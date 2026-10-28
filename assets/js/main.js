(function () {
  var D = window.STATUS_DATA;
  var C = window.STATUS_CONTRACTS;
  var meta = C.meta;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var money = function (v) {
    if (v >= 1e9) return (v / 1e9).toFixed(2).replace('.', ',') + ' млрд ₽';
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' млн ₽';
    return Math.round(v / 1e3) + ' тыс. ₽';
  };
  var fdate = function (d) { return d.slice(8) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4); };

  // Строки реестра: [дата, заказчик, предмет, сумма, категория, статус]
  var rows = C.rows.map(function (r) {
    return { d: r[0], y: +r[0].slice(0, 4), c: r[1], s: r[2], v: r[3], k: r[4], st: r[5] };
  });

  // Цифры. Итоги считаются по всем договорам реестра, включая коммерческие
  var thisYear = new Date().getFullYear();
  $('#stats').innerHTML = [
    ['с ' + meta.first, 'года выполняем подрядные работы'],
    [meta.count, 'договоров в реестре контрактов'],
    ['≈ ' + money(meta.total), 'общий объём договоров'],
    [meta.customers, 'бюджетных заказчиков']
  ].map(function (x) { return '<div><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('');
  $('#adv-exp').textContent = meta.count + ' договоров с ' + meta.first + ' года, ' + meta.customers + ' бюджетных заказчиков.';
  $('#exp-sub').textContent = 'Сведения из реестра контрактов на 01.09.2026: ' + meta.count + ' договоров, из них ' +
    meta.ip + ' на исполнении. Остальные завершены.';
  $('#yr').textContent = thisYear;

  // Меню
  var nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); }
  });

  // Динамика по годам
  var ys = Object.keys(meta.years);
  var maxV = Math.max.apply(null, ys.map(function (y) { return meta.years[y][1]; }));
  $('#years').innerHTML = ys.map(function (y) {
    var n = meta.years[y][0], v = meta.years[y][1];
    return '<div class="y"><div class="y__bar" style="height:' + Math.max(4, Math.round(v / maxV * 100)) + '%"></div>' +
      '<b>' + y + '</b><span>' + n + ' дог.</span><span>' + money(v) + '</span></div>';
  }).join('');

  // Реестр: поиск, год, вид работ
  var state = { k: 'all', y: 'all', q: '', shown: 20 };
  var STEP = 20;
  var years = ys.slice().reverse();
  $('#yr-f').innerHTML = '<option value="all">Все годы</option>' + years.map(function (y) {
    return '<option>' + y + '</option>';
  }).join('');
  var kinds = [['all', 'Все виды']].concat(Object.keys(D.categories).filter(function (k) {
    return rows.some(function (r) { return r.k === k; });
  }).map(function (k) { return [k, D.categories[k]]; }));
  $('#chips').innerHTML = kinds.map(function (c) {
    return '<button class="chip' + (c[0] === 'all' ? ' is-on' : '') + '" data-c="' + c[0] + '">' + esc(c[1]) + '</button>';
  }).join('');

  function renderRows() {
    var q = state.q.toLowerCase();
    var list = rows.filter(function (r) {
      return (state.k === 'all' || r.k === state.k) &&
        (state.y === 'all' || r.y === +state.y) &&
        (!q || (r.c + ' ' + r.s).toLowerCase().indexOf(q) > -1);
    });
    $('#count').textContent = 'Найдено договоров: ' + list.length;
    $('#proj').innerHTML = list.slice(0, state.shown).map(function (r) {
      return '<article class="p">' +
        '<div class="p__tag">' + esc(D.categories[r.k]) + ' · ' + fdate(r.d) + (r.st === 'ip' ? ' · на исполнении' : '') + '</div>' +
        '<h3>' + esc(r.c) + '</h3>' +
        '<p class="p__txt">' + esc(r.s) + '</p>' +
        '<p class="p__sum">' + money(r.v) + '</p></article>';
    }).join('');
    $('#more').hidden = list.length <= state.shown;
  }
  function reset() { state.shown = STEP; renderRows(); }
  $('#chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    state.k = b.dataset.c;
    [].forEach.call(document.querySelectorAll('.chip'), function (x) { x.classList.toggle('is-on', x === b); });
    reset();
  });
  $('#yr-f').addEventListener('change', function (e) { state.y = e.target.value; reset(); });
  $('#q').addEventListener('input', function (e) { state.q = e.target.value.trim(); reset(); });
  $('#more').addEventListener('click', function () { state.shown += STEP; renderRows(); });
  renderRows();

  // Заказчики: суммы и группы
  var cu = {};
  rows.forEach(function (r) {
    var o = cu[r.c] = cu[r.c] || { n: r.c, cnt: 0, sum: 0 };
    o.cnt++; o.sum += r.v;
  });
  var all = Object.keys(cu).map(function (k) { return cu[k]; }).sort(function (a, b) { return b.sum - a.sum; });
  var plural = function (n) {
    var m = n % 10, t = n % 100;
    return n + (m === 1 && t !== 11 ? ' договор' : (m >= 2 && m <= 4 && (t < 10 || t >= 20) ? ' договора' : ' договоров'));
  };
  $('#top5').innerHTML = all.slice(0, 6).map(function (o) {
    return '<div class="t"><b>' + esc(o.n) + '</b><span>' + plural(o.cnt) + '</span><em>' + money(o.sum) + '</em></div>';
  }).join('');

  var group = function (n) {
    if (/Жилищник|[Уу]права/.test(n)) return 'Жилищники и управы';
    if (/ГБУЗ|ДЗМ|ЦРБ|ПОКБ|ВРКБ|здравоохран|Изумруд|Социальный дом/.test(n)) return 'Здравоохранение';
    if (/Школа|МГПУ|МТУСИ|колледж|Домисолька/.test(n)) return 'Образование';
    return 'Прочие государственные заказчики';
  };
  var groups = {};
  all.forEach(function (o) { (groups[group(o.n)] = groups[group(o.n)] || []).push(o.n); });
  var order = ['Здравоохранение', 'Образование', 'Жилищники и управы', 'Прочие государственные заказчики'];
  $('#cust').innerHTML = order.filter(function (g) { return groups[g]; }).map(function (g) {
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
