(function () {
  var $ = function (s) { return document.querySelector(s); };
  $('#yr').textContent = new Date().getFullYear();

  // Меню на телефоне
  var nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); }
  });

  // Просмотр фото
  var lb = $('#lb'), lbi = lb.querySelector('img'), lbp = lb.querySelector('p');
  $('.gal').addEventListener('click', function (e) {
    var b = e.target.closest('.g'); if (!b) return;
    var img = b.querySelector('img');
    lbi.src = b.dataset.src; lbi.alt = img.alt; lbp.textContent = b.textContent;
    lb.hidden = false;
  });
  lb.addEventListener('click', function () { lb.hidden = true; lbi.removeAttribute('src'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
})();
