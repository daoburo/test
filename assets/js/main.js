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

  // Сравнение «до и после»
  Array.prototype.forEach.call(document.querySelectorAll('.cmp'), function (f) {
    var r = f.querySelector('input');
    var set = function () { f.style.setProperty('--p', r.value + '%'); };
    r.addEventListener('input', set); set();
  });

  // Карусель «до и после»
  var car = document.querySelector('.car');
  if (car) {
    var track = car.querySelector('.car__track'), slides = track.children;
    var prev = car.querySelector('.car__prev'), next = car.querySelector('.car__next');
    var dots = car.querySelector('.car__dots'), num = car.querySelector('.car__n');
    var go = function (i) { track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); };
    Array.prototype.forEach.call(slides, function (s, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.setAttribute('aria-label', 'Снимок ' + (i + 1));
      d.addEventListener('click', function () { go(i); });
      dots.appendChild(d);
    });
    var upd = function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      Array.prototype.forEach.call(dots.children, function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      num.textContent = (i + 1) + ' / ' + slides.length;
      prev.disabled = i === 0; next.disabled = i === slides.length - 1;
    };
    prev.addEventListener('click', function () { go(Math.round(track.scrollLeft / track.clientWidth) - 1); });
    next.addEventListener('click', function () { go(Math.round(track.scrollLeft / track.clientWidth) + 1); });
    track.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  // Виды работ: на компьютере показываем два снимка, остальные раскрываются
  Array.prototype.forEach.call(document.querySelectorAll('.work__ph'), function (ph) {
    var n = ph.querySelectorAll('.g').length;
    if (n < 3) return;
    var side = document.createElement('div'); side.className = 'work__side';
    ph.parentNode.insertBefore(side, ph); side.appendChild(ph);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'work__more';
    function label(folded) { btn.textContent = folded ? 'Показать все фото (' + n + ')' : 'Свернуть'; btn.setAttribute('aria-expanded', !folded); }
    ph.classList.add('is-folded'); label(true);
    btn.addEventListener('click', function () { label(ph.classList.toggle('is-folded')); });
    side.appendChild(btn);
  });
})();
