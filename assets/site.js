// Shared behaviour for every page: reveal animations, mobile nav, active link, email CTA menu.
(function () {
  // ── Reveal on scroll ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.anim').forEach((el) => observer.observe(el));

  // ── Mobile nav ──
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Mark the current page in the nav.
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    navLinks.querySelectorAll('a[href]').forEach((link) => {
      const target = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (target && target === here) link.setAttribute('aria-current', 'page');
    });
  }

  // ── Email CTA menu — works without a desktop mail client ──
  const EMAIL = 'contact_us@bidmana.com';
  const EMAIL_SUBJECT = 'Bidmana Demo Request';

  function emailLinks() {
    const su = encodeURIComponent(EMAIL_SUBJECT);
    return {
      gmail:   'https://mail.google.com/mail/?view=cm&fs=1&to=' + EMAIL + '&su=' + su,
      outlook: 'https://outlook.office.com/mail/deeplink/compose?to=' + EMAIL + '&subject=' + su,
      yahoo:   'https://compose.mail.yahoo.com/?to=' + EMAIL + '&subject=' + su,
      mailto:  'mailto:' + EMAIL + '?subject=' + su,
    };
  }

  let activeEmailMenu = null;
  let activeEmailBackdrop = null;

  function closeEmailMenu() {
    if (activeEmailMenu) {
      activeEmailMenu.remove();
      activeEmailBackdrop.remove();
      activeEmailMenu = null;
      activeEmailBackdrop = null;
      document.removeEventListener('keydown', onEmailMenuKeydown);
    }
  }

  function onEmailMenuKeydown(e) {
    if (e.key === 'Escape') closeEmailMenu();
  }

  function openEmailMenu() {
    if (activeEmailMenu) { closeEmailMenu(); return; }
    const links = emailLinks();

    const backdrop = document.createElement('div');
    backdrop.className = 'email-menu-backdrop';
    backdrop.addEventListener('click', closeEmailMenu);
    document.body.appendChild(backdrop);

    const menu = document.createElement('div');
    menu.className = 'email-menu';
    menu.innerHTML =
      '<div class="email-menu-label">Reach us at ' + EMAIL + '</div>' +
      '<a href="' + links.gmail + '" target="_blank" rel="noopener">Open in Gmail</a>' +
      '<a href="' + links.outlook + '" target="_blank" rel="noopener">Open in Outlook Web</a>' +
      '<a href="' + links.yahoo + '" target="_blank" rel="noopener">Open in Yahoo Mail</a>' +
      '<div class="email-menu-divider"></div>' +
      '<a href="' + links.mailto + '">Use desktop mail app</a>' +
      '<button type="button" data-copy>Copy email address</button>';
    document.body.appendChild(menu);
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      menu.classList.add('open');
    });

    menu.querySelector('[data-copy]').addEventListener('click', () => {
      const btn = menu.querySelector('[data-copy]');
      const clip = navigator.clipboard;
      if (!clip) { btn.textContent = EMAIL; return; }
      clip.writeText(EMAIL).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(closeEmailMenu, 900);
      }).catch(() => { btn.textContent = EMAIL; });
    });

    activeEmailMenu = menu;
    activeEmailBackdrop = backdrop;
    document.addEventListener('keydown', onEmailMenuKeydown);
  }

  document.querySelectorAll('a.mailto-cta').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openEmailMenu();
    });
  });

  // ── Home: the product showcase ──
  // Four screens behind four tabs. They advance on their own every few
  // seconds (the bar under the active tab counts it down), stop while the
  // pointer or keyboard focus is on them, and never auto-advance for
  // someone who asked their system for reduced motion.
  (function showcase() {
    const root = document.getElementById('showcase');
    if (!root) return;
    const tabs = Array.from(root.querySelectorAll('.shot-tab'));
    const screens = Array.from(root.querySelectorAll('.shot-screen'));
    const notes = Array.from(root.querySelectorAll('.shot-note'));
    if (tabs.length < 2) return;
    const INTERVAL = 7000;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.style.setProperty('--shot-interval', INTERVAL + 'ms');
    let index = 0, timer = null, paused = false, started = false;

    function show(i) {
      index = (i + tabs.length) % tabs.length;
      const key = tabs[index].dataset.shot;
      tabs.forEach((t, n) => {
        const on = n === index;
        t.classList.toggle('is-active', on);
        t.classList.remove('is-counting');
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      screens.forEach((s) => { const on = s.id === 'shot-' + key; s.classList.toggle('is-active', on); s.hidden = !on; });
      notes.forEach((n) => { const on = n.dataset.shot === key; n.classList.toggle('is-active', on); n.hidden = !on; });
      // Restart the countdown bar on the new tab (forces the animation to replay).
      if (started && !paused && !reduced) {
        void tabs[index].offsetWidth;
        tabs[index].classList.add('is-counting');
      }
    }

    function schedule() {
      clearTimeout(timer);
      if (reduced || paused || !started) return;
      timer = setTimeout(() => { show(index + 1); schedule(); }, INTERVAL);
    }
    function pause() { paused = true; clearTimeout(timer); tabs[index].classList.remove('is-counting'); }
    function resume() {
      if (!paused) return;
      paused = false;
      if (!reduced && started) { void tabs[index].offsetWidth; tabs[index].classList.add('is-counting'); }
      schedule();
    }

    tabs.forEach((t, n) => {
      t.addEventListener('click', () => { show(n); schedule(); });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          show(index + (e.key === 'ArrowRight' ? 1 : -1));
          tabs[index].focus();
          schedule();
        }
      });
    });
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) resume(); });
    document.addEventListener('visibilitychange', () => { document.hidden ? pause() : resume(); });

    // Nothing moves until the section is actually on screen.
    const start = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { started = true; show(index); schedule(); start.disconnect(); }
    }, { threshold: 0.3 });
    start.observe(root);
    show(0);
  })();
})();
