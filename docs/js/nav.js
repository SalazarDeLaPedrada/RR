(function () {
  var menuBtn = document.querySelector('.menu-btn');
  var sideMenu = document.getElementById('sideMenu');
  var overlay = document.getElementById('menuOverlay');
  var closeBtn = document.querySelector('.side-menu-close');

  if (!menuBtn || !sideMenu || !overlay) return;

  function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    sideMenu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    sideMenu.setAttribute('aria-hidden', 'true');
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();
