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
})();
