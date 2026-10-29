(function () {
  var $ = function (s) { return document.querySelector(s); };
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
  // Стаж считается от текущего года, чтобы цифры не устаревали
  Array.prototype.forEach.call(document.querySelectorAll('[data-years]'), function (el) {
    el.textContent = new Date().getFullYear() - Number(el.dataset.years);
  });

  // Меню на телефоне
  var nav = $('#nav'), burger = $('#burger');
  function closeMenu() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });

  // Просмотр фото
  var lb = $('#lb'), lbi = lb.querySelector('img'), lbp = lb.querySelector('p');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gal .g'));
  var cur = -1, opener = null;
  function show(i) {
    cur = (i + items.length) % items.length;
    var b = items[cur];
    lbi.src = b.dataset.src;
    lbi.alt = b.querySelector('img').alt;
    lbp.textContent = b.querySelector('span').textContent;
  }
  function open(i) {
    opener = document.activeElement;
    show(i);
    lb.hidden = false;
    lb.querySelector('.lb__x').focus();
  }
  function close() {
    lb.hidden = true; lbi.removeAttribute('src');
    if (opener) opener.focus();
  }
  items.forEach(function (b, i) { b.setAttribute('aria-label', 'Увеличить фото: ' + b.querySelector('span').textContent); b.addEventListener('click', function () { open(i); }); });
  lb.addEventListener('click', function (e) {
    if (e.target.closest('.lb__prev')) show(cur - 1);
    else if (e.target.closest('.lb__next')) show(cur + 1);
    else if (e.target !== lbi) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!lb.hidden) close(); closeMenu(); return; }
    if (lb.hidden) return;
    if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'Tab') {
      var f = lb.querySelectorAll('button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Карточки заказчиков: раскрытие по нажатию (на компьютере также при наведении, через CSS)
  var cards = Array.prototype.slice.call(document.querySelectorAll('.cg li'));
  function closeCards(except) {
    cards.forEach(function (li) {
      if (li !== except) { li.classList.remove('is-open'); li.querySelector('.c').setAttribute('aria-expanded', 'false'); }
    });
  }
  cards.forEach(function (li) {
    var btn = li.querySelector('.c');
    btn.addEventListener('click', function () {
      var open = !li.classList.contains('is-open');
      closeCards(li);
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.cg li')) closeCards(null); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCards(null); });
})();
