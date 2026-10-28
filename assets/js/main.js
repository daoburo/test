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
  // Округление вниз для крупных чисел: 155 → «150+», 53 → «50+», 17 → «17»
  var round = function (n) {
    if (n < 20) return String(n);
    var r = Math.floor(n / 10) * 10;
    return r === n ? String(n) : r + '+';
  };
  var plus = function (s) { return esc(s).replace('+', '<span>+</span>'); };
  var plural = function (n, one, few, many) {
    var m = n % 10, t = n % 100;
    return m === 1 && t !== 11 ? one : (m >= 2 && m <= 4 && (t < 10 || t >= 20) ? few : many);
  };
  var thisYear = new Date().getFullYear();

  // Строки реестра: [дата, заказчик, предмет, категория, статус]
  var rows = C.rows.map(function (r) {
    return { y: +r[0].slice(0, 4), c: r[1], s: r[2], k: r[3], st: r[4] };
  });

  var years = thisYear - SINCE;
  $('#stats').innerHTML = [
    [String(years), plural(years, 'год', 'года', 'лет') + ' на рынке строительных услуг'],
    [round(meta.count), 'договоров с государственными и частными заказчиками'],
    [round(meta.customers), 'бюджетных организаций среди заказчиков']
  ].map(function (x) { return '<div><dd>' + plus(x[0]) + '</dd><dt>' + esc(x[1]) + '</dt></div>'; }).join('');
  $('#exp-sub').textContent = 'Договоры ООО СК «Статус» с ' + meta.first + ' года с государственными и муниципальными заказчиками. ' +
    'Можно найти объект по заказчику, адресу или виду работ.';
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

  // Направления с количеством объектов по реестру
  var cnt = {};
  rows.forEach(function (r) { cnt[r.k] = (cnt[r.k] || 0) + 1; });
  var svc = [
    ['tek', 'Текущий ремонт', 'Помещения больниц, школ и учреждений: отделка, лестницы, окна, двери, электрощиты.'],
    ['kap', 'Капитальный ремонт', 'Здания целиком, общежития, подъезды и общее имущество многоквартирных домов.'],
    ['med', 'Медицинские объекты', 'Переоборудование помещений под рентген, КТ и МРТ в действующих больницах.'],
    ['roof', 'Кровли и фасады', 'Мягкие и металлические кровли, аварийный ремонт, вентилируемые фасады.'],
    ['eng', 'Инженерные системы', 'Отопление, тепловые узлы, вентиляция, подготовка к отопительному сезону.'],
    ['area', 'Благоустройство', 'Ремонт внутриплощадных дорог и территорий учреждений.'],
    ['acc', 'Доступная среда', 'Обеспечение доступа маломобильных групп населения в больницах и школах.']
  ];
  $('#svc').innerHTML = svc.map(function (s) {
    var n = cnt[s[0]] || 0;
    return '<article><div class="svc__n">' + plus(round(n)) + '</div>' +
      '<div class="svc__u">' + (n >= 20 ? 'договоров' : plural(n, 'договор', 'договора', 'договоров')) + '</div>' +
      '<h3>' + esc(s[1]) + '</h3><p>' + esc(s[2]) + '</p></article>';
  }).join('') + '<article><div class="svc__n">' + years + '</div><div class="svc__u">' +
    plural(years, 'год', 'года', 'лет') + ' опыта</div><h3>Под ключ</h3><p>Сверяем смету с фактическими объёмами, ведём исполнительную документацию, сдаём объект комиссии.</p></article>';

  // Реестр: поиск, год, вид работ
  var state = { k: 'all', y: 'all', q: '', shown: 15 };
  var STEP = 15;
  var ys = Object.keys(meta.years).reverse();
  $('#yr-f').innerHTML = '<option value="all">Все годы</option>' + ys.map(function (y) {
    return '<option>' + y + '</option>';
  }).join('');
  $('#kind-f').innerHTML = '<option value="all">Все виды</option>' + Object.keys(D.categories).filter(function (k) {
    return cnt[k];
  }).map(function (k) { return '<option value="' + k + '">' + esc(D.categories[k]) + '</option>'; }).join('');

  function renderRows() {
    var q = state.q.toLowerCase();
    var list = rows.filter(function (r) {
      return (state.k === 'all' || r.k === state.k) &&
        (state.y === 'all' || r.y === +state.y) &&
        (!q || (r.c + ' ' + r.s).toLowerCase().indexOf(q) > -1);
    });
    $('#count').textContent = 'Найдено: ' + list.length + ' ' + plural(list.length, 'договор', 'договора', 'договоров');
    $('#proj').innerHTML = list.length ? list.slice(0, state.shown).map(function (r) {
      return '<tr><td class="y">' + r.y + '</td>' +
        '<td class="c">' + esc(r.c) + (r.st === 'ip' ? '<span class="tag-ip">в работе</span>' : '') + '</td>' +
        '<td>' + esc(r.s) + '<br><span class="k">' + esc(D.categories[r.k]) + '</span></td></tr>';
    }).join('') : '<tr><td colspan="3" class="empty">Ничего не найдено. Измените условия поиска.</td></tr>';
    $('#more').hidden = list.length <= state.shown;
  }
  function reset() { state.shown = STEP; renderRows(); }
  $('#yr-f').addEventListener('change', function (e) { state.y = e.target.value; reset(); });
  $('#kind-f').addEventListener('change', function (e) { state.k = e.target.value; reset(); });
  $('#q').addEventListener('input', function (e) { state.q = e.target.value.trim(); reset(); });
  $('#more').addEventListener('click', function () { state.shown += STEP; renderRows(); });
  renderRows();

  // Постоянные заказчики: по числу договоров
  var cu = {};
  rows.forEach(function (r) { cu[r.c] = (cu[r.c] || 0) + 1; });
  var all = Object.keys(cu).sort(function (a, b) { return cu[b] - cu[a]; });
  $('#top5').innerHTML = all.slice(0, 6).map(function (n) {
    return '<li><b>' + cu[n] + '</b><small>' + plural(cu[n], 'договор', 'договора', 'договоров') + '</small><span>' + esc(n) + '</span></li>';
  }).join('');

  var group = function (n) {
    if (/Жилищник|[Уу]права|Совет депутатов/.test(n)) return 'Жилищники и управы';
    if (/ГБУЗ|ДЗМ|ЦРБ|ПОКБ|ВРКБ|здравоохран|Изумруд|Социальный дом/.test(n)) return 'Здравоохранение';
    if (/Школа|МГПУ|МТУСИ|колледж|Домисолька/.test(n)) return 'Образование';
    return 'Другие государственные заказчики';
  };
  var groups = {};
  all.forEach(function (n) { (groups[group(n)] = groups[group(n)] || []).push(n); });
  var order = ['Здравоохранение', 'Образование', 'Жилищники и управы', 'Другие государственные заказчики'];
  $('#cust').innerHTML = order.filter(function (g) { return groups[g]; }).map(function (g) {
    return '<div class="cg"><h4>' + esc(g) + '</h4><ul>' +
      groups[g].map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
  }).join('');

  $('#rev').innerHTML = D.reviews.map(function (r) {
    return '<blockquote><p>' + esc(r.text) + '</p><footer>' + esc(r.who) + '</footer></blockquote>';
  }).join('');

  // Фото и просмотр
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
