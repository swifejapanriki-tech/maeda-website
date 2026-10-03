/* 前田幹税理士事務所 — main.js
   ・ヘッダーの影／スマホメニュー／スクロール時のふわっと表示
   ・お問い合わせフォーム（入力チェック・条件表示・送信）
   依存ライブラリなし */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  // <head> のインラインスクリプトが「JSが動かなかった時は全表示に戻す」判定に使う目印
  window.__siteReady = true;

  /* ---------- ヘッダー：スクロール時に境界線と影 ---------- */
  var header = doc.getElementById('site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- スマホメニュー ---------- */
  var menuBtn = doc.querySelector('.menu-btn');
  var gnav = doc.getElementById('gnav');
  function setNav(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    gnav.classList.toggle('is-open', open);
    root.classList.toggle('is-nav-open', open);
  }
  if (menuBtn && gnav) {
    menuBtn.addEventListener('click', function () {
      setNav(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    gnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        menuBtn.focus();
      }
    });
    var mq = window.matchMedia('(min-width: 960px)');
    var closeOnDesktop = function (e) { if (e.matches) setNav(false); };
    if (mq.addEventListener) mq.addEventListener('change', closeOnDesktop);
    else if (mq.addListener) mq.addListener(closeOnDesktop);
  }

  /* ---------- スクロール時のふわっと表示 ---------- */
  var reveals = [].slice.call(doc.querySelectorAll('.reveal'));
  function revealAll(instant) {
    if (instant) root.classList.add('reveal-instant');
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    revealAll(false);
  }
  // ページ全体が1画面に収まる縦長ビューポート（全画面キャプチャ等）では、アニメーションなしで全表示
  function revealIfTallViewport() {
    if (window.innerHeight >= root.scrollHeight - 80) revealAll(true);
  }
  window.addEventListener('resize', revealIfTallViewport);
  revealIfTallViewport();

  /* ---------- お問い合わせフォーム ---------- */
  var form = doc.getElementById('contact-form');
  if (!form) return;

  var PHONE_TEXT = '070-8987-9009';
  var PHONE_LINK = '<a href="tel:07089879009">' + PHONE_TEXT + '</a>';
  var statusEl = doc.getElementById('form-status');
  var dateWrap = doc.getElementById('schedule-date-wrap');
  var urgentNote = doc.getElementById('urgent-note');
  var submitBtn = form.querySelector('button[type="submit"]');

  var f = {
    name: doc.getElementById('f-name'),
    email: doc.getElementById('f-email'),
    tel: doc.getElementById('f-tel'),
    consent: doc.getElementById('f-consent')
  };
  var errorEl = {
    name: doc.getElementById('e-name'),
    contact: doc.getElementById('e-contact'),
    type: doc.getElementById('e-type'),
    consent: doc.getElementById('e-consent')
  };

  /* 条件表示：調査日程の入力欄／緊急時のお電話案内 */
  function syncConditional() {
    var schedule = form.querySelector('input[name="schedule"]:checked');
    dateWrap.hidden = !(schedule && schedule.value === '調査の日程が決まっている');
    var urgency = form.querySelector('input[name="urgency"]:checked');
    urgentNote.hidden = !(urgency && urgency.value.indexOf('緊急') === 0);
  }
  form.addEventListener('change', syncConditional);
  syncConditional();

  /* 入力チェック */
  function setError(key, message, fields) {
    errorEl[key].textContent = message;
    (fields || []).forEach(function (el) { el.setAttribute('aria-invalid', 'true'); });
  }
  function clearErrors() {
    Object.keys(errorEl).forEach(function (k) { errorEl[k].textContent = ''; });
    [f.name, f.email, f.tel].forEach(function (el) { el.removeAttribute('aria-invalid'); });
    statusEl.textContent = '';
    statusEl.className = 'form__status';
  }
  function validate() {
    var firstInvalid = null;
    function mark(el) { if (!firstInvalid) firstInvalid = el; }

    if (!f.name.value.trim()) {
      setError('name', 'お名前をご入力ください。', [f.name]);
      mark(f.name);
    }

    var email = f.email.value.trim();
    var tel = f.tel.value.trim();
    if (!email && !tel) {
      setError('contact', 'メールアドレスか電話番号のいずれかをご入力ください。', [f.email, f.tel]);
      mark(f.email);
    } else {
      if (email && !f.email.checkValidity()) {
        setError('contact', 'メールアドレスの形式をご確認ください。', [f.email]);
        mark(f.email);
      } else if (tel) {
        var digits = tel.replace(/[^0-9]/g, '');
        if (digits.length < 9 || digits.length > 15) {
          setError('contact', '電話番号をご確認ください。', [f.tel]);
          mark(f.tel);
        }
      }
    }

    if (!form.querySelector('input[name="type"]:checked')) {
      setError('type', 'ご相談の種類を選択してください。');
      mark(form.querySelector('input[name="type"]'));
    }

    if (!f.consent.checked) {
      setError('consent', 'プライバシーポリシーへの同意が必要です。');
      mark(f.consent);
    }
    return firstInvalid;
  }
  [f.name, f.email, f.tel].forEach(function (el) {
    el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); });
  });

  function showStatus(kind, html) {
    statusEl.className = 'form__status is-' + kind;
    statusEl.innerHTML = html;
    statusEl.focus({ preventScroll: true });
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    var firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    // スパム対策（隠し入力欄に値があれば何もしない）
    if (form.elements.website && form.elements.website.value) return;

    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    if (!endpoint) {
      // 送信先が未設定のまま公開してしまっても、利用者が「送れた」と誤解しないようにしています
      showStatus('error',
        'ただいま、このフォームからは送信できません。お手数ですが、お電話（' + PHONE_LINK + '）でご連絡ください。');
      return;
    }

    setBusy(true);
    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        syncConditional();
        showStatus('success',
          '送信が完了しました。お問い合わせありがとうございます。内容を確認のうえ、改めてご連絡いたします。お急ぎの場合は、お電話（' + PHONE_LINK + '）へご連絡ください。');
      })
      .catch(function () {
        showStatus('error',
          '送信できませんでした。お手数ですが、時間をおいて再度お試しいただくか、お電話（' + PHONE_LINK + '）でご連絡ください。');
      })
      .then(function () { setBusy(false); });
  });
})();
