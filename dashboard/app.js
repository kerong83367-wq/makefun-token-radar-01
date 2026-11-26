// Token Radar dashboard: one static page, no framework, no network.
// It renders window.RADAR (written by main.ts into data.js): the ranked pre-token board,
// the live-token set, and the model that scored every row. Click any row for its detail:
// the model's four multipliers with the numbers, and the row's eight farm steps.
(function () {
  'use strict';
  var D = window.RADAR;
  var $ = function (id) { return document.getElementById(id); };
  var fmt$ = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  // change_7d arrives from the snapshot in percent units already (-2.2 means -2.2%),
  // so it is printed as-is, never multiplied by 100.
  var fmtPct = function (x) {
    if (x === null || x === undefined) return '—';
    var p = x.toFixed(1);
    return (x > 0 ? '+' : '') + p + '%';
  };
  var fmtAge = function (d) {
    if (d === null || d === undefined) return '—';
    if (d < 30) return d + 'd';
    if (d < 365) return Math.round(d / 30) + 'mo';
    return (d / 365).toFixed(1) + 'y';
  };
  var esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  // Header counts.
  $('meta').innerHTML = '<b>' + D.board_size + '</b> rows &nbsp;·&nbsp; <b>' + D.watchlist_size + '</b> watchlist &nbsp;·&nbsp; snapshot ' + esc(D.as_of) + ' &nbsp;·&nbsp; model ' + esc(D.model_version);

  // Filter dropdowns, from the data itself.
  var cats = [], chains = [];
  D.rows.forEach(function (r) {
    if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category);
    r.chains.forEach(function (c) { if (chains.indexOf(c) < 0) chains.push(c); });
  });
  cats.sort(); chains.sort();
  cats.forEach(function (c) { $('cat').appendChild(new Option(c, c)); });
  chains.forEach(function (c) { $('chain').appendChild(new Option(c, c)); });

  var state = { q: '', cat: '', chain: '', sort: 'rank', view: 'board' };
  var boardBody = document.querySelector('#board tbody');
  var liveBody = document.querySelector('#live tbody');

  function filteredRows() {
    var rows = D.rows.filter(function (r) {
      if (state.cat && r.category !== state.cat) return false;
      if (state.chain && r.chains.indexOf(state.chain) < 0) return false;
      if (state.q) {
        var q = state.q.toLowerCase();
        if (r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    var by = {
      rank: function (a, b) { return a.rank - b.rank; },
      implied: function (a, b) { return b.implied_value_usd - a.implied_value_usd; },
      tvl: function (a, b) { return b.tvl_usd - a.tvl_usd; },
      growth: function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0); },
      age: function (a, b) { return (b.age_days || 0) - (a.age_days || 0); }
    }[state.sort];
    return rows.sort(by);
  }

  function rowHtml(r) {
    var g = r.change_7d === null ? '<span>—</span>' : '<span class="' + (r.change_7d >= 0 ? 'pos' : 'neg') + '">' + fmtPct(r.change_7d) + '</span>';
    return '<td>' + r.rank + '</td>' +
      '<td class="name">' + esc(r.name) + '<small>' + esc(r.slug) + '</small></td>' +
      '<td><span class="tag">' + esc(r.category || '—') + '</span></td>' +
      '<td>' + esc(r.chains.slice(0, 2).join(', ')) + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '') + '</td>' +
      '<td class="num">' + fmt$(r.tvl_usd) + '</td>' +
      '<td class="num">' + g + '</td>' +
      '<td class="num">' + fmtAge(r.age_days) + '</td>' +
      '<td class="num impl">' + fmt$(r.implied_value_usd) + '</td>' +
      '<td><span class="plan">Plan →</span></td>';
  }

  function renderBoard() {
    var rows = filteredRows();
    $('count').textContent = rows.length + ' of ' + D.board_size + ' pre-token protocols' +
      (state.cat || state.chain || state.q ? ' matching the filter' : '') + ' · click a row for its farm plan';
    boardBody.innerHTML = '';
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = rowHtml(r);
      tr.addEventListener('click', function () { showDetail(r); });
      boardBody.appendChild(tr);
    });
  }

  function renderLive() {
    $('count').textContent = D.live.length + ' protocols that already trade — shown at the market\u2019s own values, never ranked against the pre-token board';
    liveBody.innerHTML = '';
    D.live.forEach(function (p, i) {
      var tr = document.createElement('tr');
      var g = p.change_7d === null ? '<span>—</span>' : '<span class="' + (p.change_7d >= 0 ? 'pos' : 'neg') + '">' + fmtPct(p.change_7d) + '</span>';
      tr.innerHTML = '<td>' + (i + 1) + '</td>' +
        '<td class="name">' + esc(p.name) + '</td>' +
        '<td><span class="tag">' + esc(p.category || '—') + '</span></td>' +
        '<td>' + esc(p.chains.slice(0, 2).join(', ')) + (p.chains.length > 2 ? ' +' + (p.chains.length - 2) : '') + '</td>' +
        '<td class="num">' + fmt$(p.tvl_usd) + '</td>' +
        '<td class="num">' + (p.mcap_usd === null ? '—' : fmt$(p.mcap_usd)) + '</td>' +
        '<td class="num">' + g + '</td>';
      liveBody.appendChild(tr);
    });
  }

  function showDetail(r) {
    var m = D.model;
    var lines = [
      ['TVL', fmt$(r.tvl_usd)],
      ['Category multiple (' + (r.category || 'other') + ')', '× ' + r.category_multiple.toFixed(2)],
      ['Growth multiplier (' + fmtPct(r.change_7d) + ' in 7d)', '× ' + r.growth_multiplier.toFixed(4)],
      ['Maturity multiplier (' + fmtAge(r.age_days) + ' old)', '× ' + r.maturity_multiplier.toFixed(4)],
      ['Breadth multiplier (' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + ')', '× ' + r.breadth_multiplier.toFixed(2)],
      ['Implied value', fmt$(r.implied_value_usd)]
    ];
    var html = '<h3>' + esc(r.name) + '</h3>' +
      '<div class="slug">#' + r.rank + ' · ' + esc(r.slug) + ' · ' + esc(r.category || 'uncategorised') + ' · listed ' + esc(r.listed_at || 'unknown') + '</div>' +
      '<div class="big">' + fmt$(r.implied_value_usd) + ' <small>implied token value</small></div>' +
      '<h4>How the number is built</h4><div class="breakdown">' +
      lines.map(function (l) { return '<div><span>' + esc(l[0]) + '</span><span>' + esc(l[1]) + '</span></div>'; }).join('') +
      '</div><h4>Farm plan — 8 steps</h4><ol>' +
      r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
      '</ol>';
    $('detail-body').innerHTML = html;
    $('detail').hidden = false;
  }

  $('detail-close').addEventListener('click', function () { $('detail').hidden = true; });
  $('q').addEventListener('input', function (e) { state.q = e.target.value.trim(); renderBoard(); });
  $('cat').addEventListener('change', function (e) { state.cat = e.target.value; renderBoard(); });
  $('chain').addEventListener('change', function (e) { state.chain = e.target.value; renderBoard(); });
  $('sort').addEventListener('change', function (e) { state.sort = e.target.value; renderBoard(); });
  $('view-board').addEventListener('click', function () {
    state.view = 'board';
    $('view-board').classList.add('on'); $('view-live').classList.remove('on');
    $('board').hidden = false; $('live').hidden = true;
    renderBoard();
  });
  $('view-live').addEventListener('click', function () {
    state.view = 'live';
    $('view-live').classList.add('on'); $('view-board').classList.remove('on');
    $('board').hidden = true; $('live').hidden = false;
    renderLive();
  });

  renderBoard();
})();
