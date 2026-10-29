'use strict';
(function () {
  var STORE_KEY = 'status-crm-v1';
  var DAY = 86400000;

  // ---------- Схема данных ----------
  // Статус: [название, тон, финальный?]
  var SOURCES = ['Сайт (страница бригад)', 'hh.ru', 'Авито Работа', 'Рекомендация', 'Звонок', 'Другое'];
  var TRADES = ['Монолит / бетон', 'Кладка', 'Кровля', 'Фасады', 'Штукатурка / малярка', 'Полы / стяжка', 'Электромонтаж', 'Сантехника / ОВиК', 'Демонтаж', 'Разнорабочие', 'Другое'];

  var SCHEMA = {
    brigades: {
      label: 'Заявки от бригад', add: '+ Заявка', one: 'заявку',
      statuses: [['Новая', 'warn'], ['Созвонились', 'info'], ['Собеседование', 'info'], ['В резерве', ''], ['Взяли на объект', 'ok', 1], ['Отказ', 'bad', 1]],
      fields: [
        { k: 'name', l: 'Бригада / контактное лицо', req: 1, wide: 1 },
        { k: 'phone', l: 'Телефон', t: 'tel', req: 1 },
        { k: 'received', l: 'Дата заявки', t: 'date', def: 'today' },
        { k: 'trade', l: 'Специализация', t: 'select', opts: TRADES },
        { k: 'size', l: 'Человек в бригаде', t: 'number' },
        { k: 'city', l: 'Город / район' },
        { k: 'employment', l: 'Оформление', t: 'select', opts: ['Самозанятый', 'ИП', 'ООО', 'Без оформления'] },
        { k: 'rate', l: 'Ставка / ожидания' },
        { k: 'source', l: 'Откуда узнали', t: 'select', opts: SOURCES },
        { k: 'next', l: 'Следующий контакт', t: 'date' },
        { k: 'status', l: 'Статус', t: 'status' },
        { k: 'owner', l: 'Ответственный' },
        { k: 'note', l: 'Комментарий', t: 'textarea', wide: 1 }
      ],
      cols: [
        ['Бригада', function (r) { return two(r.name, tel(r.phone)); }],
        ['Специализация', function (r) { return two(r.trade, [r.size ? r.size + ' чел.' : '', r.employment].filter(Boolean).join(' · ')); }],
        ['Город / ставка', function (r) { return two(r.city, r.rate); }],
        ['Заявка', function (r) { return two(fmtDate(r.received), r.source); }],
        ['Связаться', function (r) { return dueBadge(r.next, !isFinal('brigades', r.status)); }]
      ],
      sort: function (a, b) { return cmp(b.received, a.received); }
    },
    tenders: {
      label: 'Тендеры', add: '+ Тендер', one: 'тендер',
      statuses: [['Найден', ''], ['Анализ', 'info'], ['Готовим заявку', 'warn'], ['Подано', 'info'], ['Торги', 'warn'], ['Выиграли', 'ok', 1], ['Проиграли', 'bad', 1], ['Отказ от участия', '', 1]],
      fields: [
        { k: 'customer', l: 'Заказчик', req: 1, wide: 1 },
        { k: 'subject', l: 'Предмет закупки', req: 1, wide: 1 },
        { k: 'number', l: '№ закупки' },
        { k: 'law', l: 'Закон / тип', t: 'select', opts: ['44-ФЗ', '223-ФЗ', 'Коммерческий'] },
        { k: 'nmck', l: 'НМЦК, ₽', t: 'number' },
        { k: 'ourPrice', l: 'Наша цена, ₽', t: 'number' },
        { k: 'security', l: 'Обеспечение заявки, ₽', t: 'number' },
        { k: 'deadline', l: 'Окончание подачи заявок', t: 'date' },
        { k: 'auction', l: 'Дата торгов / подведения итогов', t: 'date' },
        { k: 'status', l: 'Статус', t: 'status' },
        { k: 'owner', l: 'Ответственный' },
        { k: 'url', l: 'Ссылка на закупку', t: 'url' },
        { k: 'note', l: 'Комментарий', t: 'textarea', wide: 1 }
      ],
      cols: [
        ['Закупка', function (r) { return two(r.customer, r.subject, linkTo(r.url, r.number || 'ссылка')); }],
        ['Тип', function (r) { return esc(r.law); }],
        ['НМЦК', function (r) { return two(money(r.nmck), r.ourPrice ? 'наша ' + money(r.ourPrice) : ''); }, 'num'],
        ['Подача до', function (r) { return dueBadge(r.deadline, !isFinal('tenders', r.status) && !submitted(r.status), 2); }],
        ['Торги', function (r) { return esc(fmtDate(r.auction)); }]
      ],
      sort: function (a, b) {
        var fa = isFinal('tenders', a.status) ? 1 : 0, fb = isFinal('tenders', b.status) ? 1 : 0;
        return fa - fb || cmpEmptyLast(a.deadline, b.deadline);
      },
      rowAction: function (r) {
        return r.status === 'Выиграли' ? '<button class="btn sm" data-act="to-contract" type="button">→ Контракт</button> ' : '';
      }
    },
    contracts: {
      label: 'Реестр контрактов', add: '+ Контракт', one: 'контракт',
      statuses: [['В работе', 'info'], ['Приёмка / закрытие', 'warn'], ['Гарантийный период', 'ok', 1], ['Приостановлен', 'bad'], ['Завершён', '', 1]],
      fields: [
        { k: 'customer', l: 'Заказчик', req: 1, wide: 1 },
        { k: 'subject', l: 'Предмет контракта', req: 1, wide: 1 },
        { k: 'number', l: '№ контракта', req: 1 },
        { k: 'signed', l: 'Дата заключения', t: 'date' },
        { k: 'amount', l: 'Сумма контракта, ₽', t: 'number' },
        { k: 'paid', l: 'Оплачено, ₽', t: 'number' },
        { k: 'progress', l: 'Выполнено, %', t: 'number', min: 0, max: 100 },
        { k: 'end', l: 'Срок окончания работ', t: 'date' },
        { k: 'securityTill', l: 'Обеспечение исполнения до', t: 'date' },
        { k: 'status', l: 'Статус', t: 'status' },
        { k: 'brigades', l: 'Бригады на объекте' },
        { k: 'owner', l: 'Ответственный (прораб / ПТО)' },
        { k: 'tenderNo', l: '№ закупки (тендер)' },
        { k: 'note', l: 'Комментарий', t: 'textarea', wide: 1 }
      ],
      cols: [
        ['Контракт', function (r) { return two(r.customer, r.subject, '№ ' + (r.number || '—')); }],
        ['Сумма', function (r) { return two(money(r.amount), r.amount ? 'оплачено ' + money(r.paid || 0) : ''); }, 'num'],
        ['Выполнение', function (r) { var p = clamp(+r.progress || 0); return '<div class="bar-p" title="' + p + '%"><i style="width:' + p + '%"></i></div><div class="s">' + p + '%</div>'; }],
        ['Срок до', function (r) { return dueBadge(r.end, !isFinal('contracts', r.status), 14); }],
        ['Обеспечение до', function (r) { return dueBadge(r.securityTill, !isFinal('contracts', r.status), 30); }],
        ['Бригады', function (r) { return two(r.brigades, r.owner); }]
      ],
      sort: function (a, b) {
        var fa = isFinal('contracts', a.status) ? 1 : 0, fb = isFinal('contracts', b.status) ? 1 : 0;
        return fa - fb || cmpEmptyLast(a.end, b.end);
      }
    }
  };
  var ORDER = ['brigades', 'tenders', 'contracts'];

  // ---------- Утилиты ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function two(a, b, c) {
    var h = a ? '<div class="t">' + esc(a) + '</div>' : '';
    if (b) h += '<div class="s">' + esc(b) + '</div>';
    if (c) h += '<div class="s">' + c + '</div>';
    return h || '<span class="s">—</span>';
  }
  function tel(p) {
    if (!p) return '';
    return '<a href="tel:' + esc(String(p).replace(/[^\d+]/g, '')) + '">' + esc(p) + '</a>';
  }
  function linkTo(u, text) {
    if (!u) return text && text !== 'ссылка' ? esc(text) : '';
    if (!/^https?:\/\//i.test(u)) return esc(text);
    return '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(text) + '</a>';
  }
  function money(n) {
    if (n === '' || n == null || isNaN(+n)) return '';
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(+n) + ' ₽';
  }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dayNum(s) { return s ? Math.round(Date.parse(s + 'T00:00:00Z') / DAY) : NaN; }
  function daysLeft(s) { return dayNum(s) - dayNum(todayStr()); }
  function fmtDate(s) {
    if (!s) return '';
    var p = s.split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : s;
  }
  function cmp(a, b) { return a === b ? 0 : (a || '') < (b || '') ? -1 : 1; }
  function cmpEmptyLast(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return cmp(a, b);
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function statusInfo(type, name) {
    var list = SCHEMA[type].statuses;
    for (var i = 0; i < list.length; i++) if (list[i][0] === name) return list[i];
    return list[0];
  }
  function isFinal(type, name) { return !!statusInfo(type, name)[2]; }
  function submitted(name) { return name === 'Подано' || name === 'Торги'; }

  // Бейдж срока: просрочено — красный, скоро (≤ soon дней) — жёлтый
  function dueBadge(date, active, soon) {
    if (!date) return '<span class="s">—</span>';
    var d = daysLeft(date), cls = '', hint = '';
    if (active) {
      if (d < 0) { cls = ' late'; hint = ' · просрочено ' + (-d) + ' дн.'; }
      else if (d === 0) { cls = ' late'; hint = ' · сегодня'; }
      else if (d <= (soon || 3)) { cls = ' soon'; hint = ' · через ' + d + ' дн.'; }
    }
    return '<span class="due' + cls + '">' + esc(fmtDate(date)) + hint + '</span>';
  }

  // ---------- Состояние ----------
  var data = load();
  var ui = { tab: 'brigades', q: '', status: '' };

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (d && typeof d === 'object') return norm(d);
    } catch (e) { /* пустое хранилище */ }
    return norm({});
  }
  function norm(d) {
    var o = {};
    ORDER.forEach(function (t) { o[t] = Array.isArray(d[t]) ? d[t] : []; });
    return o;
  }
  var storeOk = true;
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
    catch (e) {
      if (storeOk) alert('Браузер не даёт сохранить данные (приватный режим или нет места). Сделайте «Резервную копию», чтобы ничего не потерять.');
      storeOk = false;
    }
  }

  // ---------- Рендер ----------
  var $ = function (id) { return document.getElementById(id); };

  function matches(t, r) {
    if (ui.status && r.status !== ui.status) return false;
    if (!ui.q) return true;
    var q = ui.q.toLowerCase();
    return SCHEMA[t].fields.some(function (f) { return String(r[f.k] == null ? '' : r[f.k]).toLowerCase().indexOf(q) !== -1; });
  }

  function renderCards() {
    var b = data.brigades, t = data.tenders, c = data.contracts, h = '';

    var nb = b.filter(function (r) { return r.status === 'Новая'; }).length;
    var lateB = b.filter(function (r) { return r.next && !isFinal('brigades', r.status) && daysLeft(r.next) <= 0; }).length;
    h += card('brigades', 'Заявки от бригад', nb, 'новых', lateB ? '<b>' + lateB + '</b> — пора перезвонить' : 'всего ' + b.length, nb || lateB);

    var open = t.filter(function (r) { return !isFinal('tenders', r.status); });
    var dl = open.filter(function (r) { return r.deadline && !submitted(r.status) && daysLeft(r.deadline) >= 0; })
      .sort(function (x, y) { return cmp(x.deadline, y.deadline); })[0];
    var soon = open.filter(function (r) { return r.deadline && !submitted(r.status) && daysLeft(r.deadline) >= 0 && daysLeft(r.deadline) <= 3; }).length;
    h += card('tenders', 'Тендеры в работе', open.length, '',
      dl ? 'ближайшая подача: ' + fmtDate(dl.deadline) + (soon ? ' · <b>горит: ' + soon + '</b>' : '') : 'всего ' + t.length, soon);

    var act = c.filter(function (r) { return !isFinal('contracts', r.status); });
    var sum = act.reduce(function (s, r) { return s + (+r.amount || 0); }, 0);
    var rest = act.reduce(function (s, r) { return s + Math.max(0, (+r.amount || 0) - (+r.paid || 0)); }, 0);
    var endSoon = act.filter(function (r) { return r.end && daysLeft(r.end) <= 14; }).length;
    h += card('contracts', 'Контракты в работе', act.length, sum ? money(sum) : '',
      (rest ? 'не оплачено ' + money(rest) : 'всего ' + c.length) + (endSoon ? ' · <b>сроки: ' + endSoon + '</b>' : ''), endSoon);

    $('cards').innerHTML = h;
  }
  function card(tab, title, big, unit, sub, hot) {
    return '<button type="button" class="card' + (hot ? ' hot' : '') + '" data-tab="' + tab + '"><h3>' + esc(title) + '</h3>' +
      '<div class="big">' + esc(big) + (unit ? ' <small style="font-size:14px;font-weight:400">' + esc(unit) + '</small>' : '') + '</div>' +
      '<div class="sub">' + sub + '</div></button>';
  }

  function renderTabs() {
    $('tabs').innerHTML = ORDER.map(function (t) {
      return '<button class="tab" role="tab" type="button" data-tab="' + t + '" aria-selected="' + (t === ui.tab) + '">' +
        esc(SCHEMA[t].label) + '<span class="n">' + data[t].length + '</span></button>';
    }).join('');
  }

  function renderStatusFilter() {
    var s = SCHEMA[ui.tab].statuses;
    $('f-status').innerHTML = '<option value="">Все статусы</option>' + s.map(function (x) {
      return '<option' + (ui.status === x[0] ? ' selected' : '') + '>' + esc(x[0]) + '</option>';
    }).join('');
  }

  function renderTable() {
    var sc = SCHEMA[ui.tab], t = ui.tab;
    var rows = data[t].filter(function (r) { return matches(t, r); }).sort(sc.sort);
    $('count').textContent = rows.length === data[t].length ? 'Записей: ' + rows.length : 'Показано ' + rows.length + ' из ' + data[t].length;
    $('btn-add').textContent = sc.add;

    var head = '<thead><tr>' + sc.cols.map(function (c) { return '<th' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + esc(c[0]) + '</th>'; }).join('') +
      '<th>Статус</th><th></th></tr></thead>';
    var body = rows.map(function (r) {
      var si = statusInfo(t, r.status);
      var sel = '<select class="st ' + si[1] + '" data-act="status" aria-label="Статус">' + sc.statuses.map(function (x) {
        return '<option' + (x[0] === si[0] ? ' selected' : '') + '>' + esc(x[0]) + '</option>';
      }).join('') + '</select>';
      return '<tr data-id="' + esc(r.id) + '">' + sc.cols.map(function (c) {
        return '<td' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + c[1](r) + '</td>';
      }).join('') + '<td>' + sel + '</td><td class="act">' + (sc.rowAction ? sc.rowAction(r) : '') +
        '<button class="btn sm" data-act="edit" type="button">Открыть</button></td></tr>';
    }).join('');
    $('table').innerHTML = head + '<tbody>' + body + '</tbody>';

    var empty = $('empty');
    empty.hidden = rows.length > 0;
    if (!rows.length) {
      if (data[t].length) empty.textContent = 'Ничего не найдено. Измените поиск или фильтр.';
      else {
        empty.innerHTML = 'Пока пусто.<br><button class="btn primary" data-act="add" type="button">' + esc(sc.add) + '</button>' +
          (isEmptyAll() ? '<button class="btn" data-act="demo" type="button">Загрузить пример данных</button>' : '');
      }
    }
    $('table').hidden = !rows.length;
  }
  function isEmptyAll() { return ORDER.every(function (t) { return !data[t].length; }); }

  function render() { renderCards(); renderTabs(); renderStatusFilter(); renderTable(); }

  // ---------- Форма ----------
  var dlg = $('dlg'), editing = null; // { type, id|null, prefill }

  function openForm(type, id, prefill) {
    var sc = SCHEMA[type];
    var rec = id ? data[type].filter(function (r) { return r.id === id; })[0] : null;
    var src = rec || prefill || {};
    editing = { type: type, id: id || null };
    $('dlg-title').textContent = (rec ? 'Изменить: ' : 'Добавить: ') + sc.one;
    $('dlg-fields').innerHTML = sc.fields.map(function (f) {
      var v = src[f.k] != null ? src[f.k] : (f.def === 'today' ? todayStr() : '');
      var h = '<label class="' + (f.wide ? 'wide' : '') + '"><span class="' + (f.req ? 'req' : '') + '">' + esc(f.l) + '</span>';
      if (f.t === 'textarea') h += '<textarea name="' + f.k + '">' + esc(v) + '</textarea>';
      else if (f.t === 'select' || f.t === 'status') {
        var opts = f.t === 'status' ? sc.statuses.map(function (s) { return s[0]; }) : [''].concat(f.opts);
        if (f.t === 'select' && v && opts.indexOf(v) === -1) opts.push(v);
        h += '<select name="' + f.k + '">' + opts.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
      } else {
        h += '<input name="' + f.k + '" type="' + (f.t || 'text') + '" value="' + esc(v) + '"' +
          (f.t === 'number' ? ' inputmode="decimal" step="any" min="' + (f.min != null ? f.min : 0) + '"' + (f.max != null ? ' max="' + f.max + '"' : '') : '') + '>';
      }
      return h + '</label>';
    }).join('');
    $('btn-del').hidden = !rec;
    dlg.showModal();
    var first = $('dlg-fields').querySelector('input, select, textarea');
    if (first) first.focus();
  }

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var sc = SCHEMA[editing.type], rec = {}, bad = false;
    sc.fields.forEach(function (f) {
      var el = $('form').elements[f.k];
      var v = el.value.trim();
      el.classList.remove('err');
      if (f.req && !v) { el.classList.add('err'); bad = true; }
      if (f.t === 'number' && v !== '') {
        var n = +v.replace(',', '.');
        if (isNaN(n)) { el.classList.add('err'); bad = true; } else v = n;
      }
      rec[f.k] = v;
    });
    if (bad) { var x = $('form').querySelector('.err'); if (x) x.focus(); return; }
    var list = data[editing.type];
    if (editing.id) {
      var i = list.findIndex(function (r) { return r.id === editing.id; });
      list[i] = Object.assign({}, list[i], rec);
    } else {
      rec.id = uid(); rec.created = todayStr();
      list.push(rec);
    }
    save(); dlg.close(); render();
  });
  $('btn-cancel').addEventListener('click', function () { dlg.close(); });
  $('btn-del').addEventListener('click', function () {
    if (!editing.id || !confirm('Удалить запись безвозвратно?')) return;
    data[editing.type] = data[editing.type].filter(function (r) { return r.id !== editing.id; });
    save(); dlg.close(); render();
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  // ---------- События ----------
  document.addEventListener('click', function (e) {
    var tabEl = e.target.closest('[data-tab]');
    if (tabEl) { ui.tab = tabEl.getAttribute('data-tab'); ui.q = ''; ui.status = ''; $('q').value = ''; render(); return; }
    var actEl = e.target.closest('[data-act]');
    if (!actEl || actEl.tagName === 'SELECT') return;
    var act = actEl.getAttribute('data-act');
    var tr = actEl.closest('tr'), id = tr && tr.getAttribute('data-id');
    if (act === 'add') openForm(ui.tab);
    else if (act === 'edit') openForm(ui.tab, id);
    else if (act === 'demo') { data = demo(); save(); render(); }
    else if (act === 'to-contract') {
      var t = data.tenders.filter(function (r) { return r.id === id; })[0];
      ui.tab = 'contracts'; ui.q = ''; ui.status = ''; $('q').value = ''; render();
      openForm('contracts', null, {
        customer: t.customer, subject: t.subject, amount: t.ourPrice || t.nmck || '',
        tenderNo: t.number, owner: t.owner, status: 'В работе', signed: todayStr()
      });
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.getAttribute('data-act') !== 'status') return;
    var id = e.target.closest('tr').getAttribute('data-id');
    var r = data[ui.tab].filter(function (x) { return x.id === id; })[0];
    r.status = e.target.value;
    save(); render();
  });
  $('btn-add').addEventListener('click', function () { openForm(ui.tab); });
  $('q').addEventListener('input', function (e) { ui.q = e.target.value; renderTable(); });
  $('f-status').addEventListener('change', function (e) { ui.status = e.target.value; renderTable(); });

  // ---------- Экспорт / импорт ----------
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  $('btn-export').addEventListener('click', function () {
    download('crm-status-' + todayStr() + '.json', JSON.stringify(data, null, 2), 'application/json');
  });
  $('file-import').addEventListener('change', function (e) {
    var f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = norm(JSON.parse(rd.result));
        var n = ORDER.reduce(function (s, t) { return s + d[t].length; }, 0);
        if (!confirm('Заменить текущие данные записями из файла (' + n + ' шт.)?')) return;
        data = d; save(); render();
      } catch (err) { alert('Не удалось прочитать файл: это не резервная копия CRM.'); }
    };
    rd.readAsText(f);
  });
  $('btn-csv').addEventListener('click', function () {
    var sc = SCHEMA[ui.tab];
    var q = function (v) { v = String(v == null ? '' : v); return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rows = data[ui.tab].filter(function (r) { return matches(ui.tab, r); }).sort(sc.sort);
    var lines = [sc.fields.map(function (f) { return q(f.l); }).join(';')].concat(rows.map(function (r) {
      return sc.fields.map(function (f) { return q(r[f.k]); }).join(';');
    }));
    download(ui.tab + '-' + todayStr() + '.csv', '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  });

  // ---------- Пример данных ----------
  function demo() {
    function off(n) { var d = new Date(Date.now() + n * DAY); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function mk(o) { o.id = uid() + Math.random().toString(36).slice(2, 4); o.created = todayStr(); return o; }
    return {
      brigades: [
        mk({ name: 'Бригада Рустама', phone: '+7 900 000-00-01', received: off(0), trade: 'Кровля', size: 6, city: 'Москва', employment: 'Самозанятый', rate: 'от 1 200 ₽/м²', source: 'hh.ru', next: off(0), status: 'Новая', owner: '', note: 'Работали на больницах' }),
        mk({ name: 'Сергей, фасадчики', phone: '+7 900 000-00-02', received: off(-3), trade: 'Фасады', size: 4, city: 'Подольск', employment: 'ИП', rate: 'по договорённости', source: 'Сайт (страница бригад)', next: off(-1), status: 'Созвонились', owner: '', note: 'Есть альпинисты' }),
        mk({ name: 'Олег, отделка', phone: '+7 900 000-00-03', received: off(-10), trade: 'Штукатурка / малярка', size: 8, city: 'Москва', employment: 'ООО', rate: '', source: 'Рекомендация', next: '', status: 'В резерве', owner: '', note: '' })
      ],
      tenders: [
        mk({ customer: 'ГБУЗ «Городская клиническая больница»', subject: 'Капитальный ремонт корпуса № 3', number: '0173200000000000001', law: '44-ФЗ', nmck: 48500000, ourPrice: '', security: 485000, deadline: off(2), auction: off(6), status: 'Готовим заявку', owner: '', url: '', note: '' }),
        mk({ customer: 'ГБУ «Жилищник»', subject: 'Ремонт кровли жилых домов', number: '32312345678', law: '223-ФЗ', nmck: 12300000, ourPrice: '', security: 123000, deadline: off(9), auction: off(14), status: 'Анализ', owner: '', url: '', note: '' }),
        mk({ customer: 'МТУСИ', subject: 'Ремонт фасада общежития', number: '0173200000000000002', law: '44-ФЗ', nmck: 21000000, ourPrice: 18900000, security: 210000, deadline: off(-12), auction: off(-5), status: 'Выиграли', owner: '', url: '', note: 'Подписать контракт' })
      ],
      contracts: [
        mk({ customer: 'ГКБ имени Буянова', subject: 'Ремонт приёмного отделения', number: 'ГК-2026/14', signed: off(-60), amount: 36200000, paid: 14000000, progress: 45, end: off(10), securityTill: off(120), status: 'В работе', brigades: 'Рустам (кровля), Олег (отделка)', owner: '', tenderNo: '', note: '' }),
        mk({ customer: 'МГПУ', subject: 'Реконструкция котельной', number: 'К-88/26', signed: off(-200), amount: 15800000, paid: 15800000, progress: 100, end: off(-20), securityTill: off(40), status: 'Гарантийный период', brigades: '', owner: '', tenderNo: '', note: '' })
      ]
    };
  }

  render();
})();
