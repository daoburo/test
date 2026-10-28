(function () {
  var D = window.STATUS_DATA;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  // Статистика считается из данных, чтобы не расходиться с перечнями на странице
  var year = new Date().getFullYear();
  $('#st-years').textContent = year - D.experienceSince;
  $('#st-customers').textContent = D.customers.length;
  $('#st-projects').textContent = D.projects.length;
  $('#yr').textContent = year;

  // Меню
  var nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); }
  });

  // Объекты с фильтром по виду работ
  var cur = 'all';
  function renderProjects() {
    $('#proj').innerHTML = D.projects
      .filter(function (p) { return cur === 'all' || p.cat === cur; })
      .map(function (p) {
        return '<article class="p">' +
          '<div class="p__tag">' + esc(D.categories[p.cat]) + (p.year ? ' · ' + p.year : '') + '</div>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p class="p__place">' + esc(p.place) + '</p>' +
          '<p>' + esc(p.text) + '</p>' +
          '<p class="p__cust">Заказчик: <b>' + esc(p.customer) + '</b></p>' +
          '</article>';
      }).join('');
  }
  var chips = [['all', 'Все']].concat(Object.keys(D.categories).map(function (k) { return [k, D.categories[k]]; }));
  $('#chips').innerHTML = chips.map(function (c) {
    return '<button class="chip' + (c[0] === cur ? ' is-on' : '') + '" data-c="' + c[0] + '">' + esc(c[1]) + '</button>';
  }).join('');
  $('#chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    cur = b.dataset.c;
    [].forEach.call(document.querySelectorAll('.chip'), function (x) { x.classList.toggle('is-on', x === b); });
    renderProjects();
  });
  renderProjects();

  // Заказчики по группам
  var groups = {};
  D.customers.forEach(function (c) { (groups[c.group] = groups[c.group] || []).push(c.name); });
  $('#cust').innerHTML = Object.keys(groups).map(function (g) {
    return '<div class="cg"><h3>' + esc(g) + '</h3><ul>' +
      groups[g].map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
  }).join('');

  $('#rev').innerHTML = D.reviews.map(function (r) {
    return '<blockquote><p>' + esc(r.text) + '</p><footer>' + esc(r.who) + '</footer></blockquote>';
  }).join('');

  // Галерея и просмотр
  $('#gal').innerHTML = D.gallery.map(function (g, i) {
    return '<button class="g" data-i="' + i + '"><img loading="lazy" src="assets/img/' + g.img + '-s.webp" alt="' + esc(g.title) + '"><span>' + esc(g.title) + '</span></button>';
  }).join('');
  var lb = $('#lb'), lbi = lb.querySelector('img'), lbp = lb.querySelector('p');
  $('#gal').addEventListener('click', function (e) {
    var b = e.target.closest('.g'); if (!b) return;
    var g = D.gallery[b.dataset.i];
    lbi.src = 'assets/img/' + g.img + '.webp'; lbi.alt = g.title; lbp.textContent = g.title;
    lb.hidden = false;
  });
  lb.addEventListener('click', function () { lb.hidden = true; lbi.removeAttribute('src'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
})();
