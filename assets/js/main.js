(function () {
  var D = window.STATUS_DATA;
  var C = window.STATUS_CONTRACTS;
  var meta = C.meta;
  var SINCE = 1996; // начало работы на рынке; ООО СК «Статус» зарегистрировано в 2016 году
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
  var thisYear = new Date().getFullYear();

  // Строки реестра: [дата, заказчик, предмет, сумма, категория, статус]
  var rows = C.rows.map(function (r) {
    return { d: r[0], y: +r[0].slice(0, 4), c: r[1], s: r[2], v: r[3], k: r[4], st: r[5] };
  });

  // Цифры. Итоги по договорам считаются по всему реестру, включая коммерческие
  $('#stats').innerHTML = [
    [thisYear - SINCE, 'лет на рынке строительных услуг'],
    [meta.count, 'договоров в реестре контрактов'],
    [money(meta.total), 'общий объём договоров'],
    [meta.customers, 'бюджетных заказчиков']
  ].map(function (x) { return '<div><dt>' + esc(x[1]) + '</dt><dd>' + esc(x[0]) + '</dd></div>'; }).join('');
  $('#exp-sub').textContent = 'Сведения из реестра контрактов ООО СК «Статус» на 01.09.2026: ' + meta.count +
    ' договоров с ' + meta.first + ' года, из них ' + meta.ip + ' на исполнении, остальные завершены. ' +
    'Опыт до 2016 года накоплен в других юридических лицах и в реестр не входит.';
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
  var bars = ys.map(function (y) {
    var v = meta.years[y][1];
    return '<div class="y"><span class="y__v">' + money(v).replace(' ₽', '') + '</span>' +
      '<div class="y__bar" style="height:' + Math.max(2, Math.round(v / maxV * 82)) + '%"></div></div>';
  }).join('');
  var lbls = ys.map(function (y) {
    return '<div><b>' + y + '</b><span>' + meta.years[y][0] + ' дог.</span></div>';
  }).join('');
  $('#years').innerHTML = bars;
  $('#years').insertAdjacentHTML('afterend', '<div class="years-lbl" aria-hidden="true">' + lbls + '</div>');

  // Реестр: поиск, год, вид работ
  var state = { k: 'all', y: 'all', q: '', shown: 20 };
  var STEP = 20;
  $('#yr-f').innerHTML = '<option value="all">Все годы</option>' + ys.slice().reverse().map(function (y) {
    return '<option>' + y + '</option>';
  }).join('');
  $('#kind-f').innerHTML = '<option value="all">Все виды</option>' + Object.keys(D.categories).filter(function (k) {
    return rows.some(function (r) { return r.k === k; });
  }).map(function (k) { return '<option value="' + k + '">' + esc(D.categories[k]) + '</option>'; }).join('');

  function renderRows() {
    var q = state.q.toLowerCase();
    var list = rows.filter(function (r) {
      return (state.k === 'all' || r.k === state.k) &&
        (state.y === 'all' || r.y === +state.y) &&
        (!q || (r.c + ' ' + r.s).toLowerCase().indexOf(q) > -1);
    });
    $('#count').textContent = 'Найдено договоров: ' + list.length;
    $('#proj').innerHTML = list.length ? list.slice(0, state.shown).map(function (r) {
      return '<tr><td class="d">' + fdate(r.d) + '</td>' +
        '<td class="c">' + esc(r.c) + (r.st === 'ip' ? '<span class="tag-ip">в работе</span>' : '') +
        '<span class="k">' + esc(D.categories[r.k]) + '</span></td>' +
        '<td class="s">' + esc(r.s) + '</td>' +
        '<td class="r v">' + money(r.v) + '</td></tr>';
    }).join('') : '<tr><td colspan="4" class="empty">Ничего не найдено. Измените условия поиска.</td></tr>';
    $('#more').hidden = list.length <= state.shown;
  }
  function reset() { state.shown = STEP; renderRows(); }
  $('#yr-f').addEventListener('change', function (e) { state.y = e.target.value; reset(); });
  $('#kind-f').addEventListener('change', function (e) { state.k = e.target.value; reset(); });
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
    return '<li><b>' + esc(o.n) + '</b><span>' + plural(o.cnt) + '</span><em>' + money(o.sum) + '</em></li>';
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
    return '<div class="cg"><h4>' + esc(g) + '</h4><ul>' +
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
