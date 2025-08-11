// Kalceto Cup — client-side single-file app with matchday + printable match sheets
const DATA = {
  teams: [
    { id: "t1", name: "Red Strikers", short: "RS", logo: "" },
    { id: "t2", name: "Blue Rockets", short: "BR", logo: "" },
    { id: "t3", name: "Green Wolves", short: "GW", logo: "" },
    { id: "t4", name: "Golden Eagles", short: "GE", logo: "" },
    { id: "t5", name: "Black Eagles", short: "GE", logo: "" },
    { id: "t6", name: "Golden Eagles", short: "GE", logo: "" },
    { id: "t7", name: "Golden Eagles", short: "GE", logo: "" },
    { id: "t8", name: "Golden Eagles", short: "GE", logo: "" },
    { id: "t9", name: "Golden Eagles", short: "GE", logo: "" },
    { id: "t10", name: "Golden Eagles", short: "GE", logo: "" }
  ],
  fixtures: [
    { id:"f1", date:"2025-08-16", home:"t1", away:"t2", homeGoals:2, awayGoals:1, venue:"Field A", kickOff:"18:30" },
    { id:"f2", date:"2025-08-18", home:"t3", away:"t4", homeGoals:null, awayGoals:null, venue:"Field B", kickOff:"19:00" },
    { id:"f3", date:"2025-08-20", home:"t1", away:"t3", homeGoals:null, awayGoals:null, venue:"Field A", kickOff:"18:00" },
    { id:"f4", date:"2025-08-22", home:"t2", away:"t4", homeGoals:null, awayGoals:null, venue:"Field B", kickOff:"20:00" },
    { id:"f5", date:"2025-08-23", home:"t4", away:"t1", homeGoals:null, awayGoals:null, venue:"Field A", kickOff:"22:00" }
  ]
};

// Utilities
function teamById(id){ return DATA.teams.find(t=>t.id===id) }
function formatDate(d){ return d } // keep simple; you can replace with nicer format later

const app = document.getElementById('app');
document.getElementById('year').textContent = new Date().getFullYear();

// Router wiring
document.querySelectorAll('.main-nav a').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    document.querySelectorAll('.main-nav a').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    renderRoute(a.dataset.route);
  })
});

function renderRoute(route){
  if(route==='standings') return renderStandings();
  if(route==='fixtures') return renderFixtures();
  if(route==='matchdays') return renderMatchdays();
  if(route==='teams') return renderTeams();
  if(route==='stats') return renderStats();
  return renderHome();
}
renderRoute('home'); // initial

/* HOME */
function renderHome(){
  app.innerHTML = `
  <section class="card hero">
    <div class="left">
      <h2>Kalceto Cup</h2>
      <p class="small">Welcome to the official minifootball league. Fixtures, standings and team pages — all in one place.</p>
      <div style="margin-top:12px">
        <a class="btn" href="#" data-route="fixtures">View Fixtures</a>
        <a style="margin-left:10px" class="btn" href="#" data-route="standings">Standings</a>
      </div>
    </div>
    <div class="right small">
      <p><strong>Next match:</strong></p>
      <div id="next-match"></div>
    </div>
  </section>

  <section class="card">
    <h3>Latest Results</h3>
    <div id="latest-results"></div>
  </section>

  <section class="card">
    <h3>Teams</h3>
    <div class="team-grid" id="home-teams"></div>
  </section>
  `;

  // wire buttons
  document.querySelectorAll('[data-route]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      e.preventDefault();
      const r = b.getAttribute('data-route');
      document.querySelectorAll('.main-nav a').forEach(x=>x.classList.remove('active'));
      const nav = Array.from(document.querySelectorAll('.main-nav a')).find(x=>x.dataset.route===r);
      if(nav) nav.classList.add('active');
      renderRoute(r);
    })
  });

  // populate next match & latest results
  const upcoming = DATA.fixtures.filter(f=>f.homeGoals===null).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const nextEl = document.getElementById('next-match');
  if(upcoming){
    nextEl.innerHTML = `<div class="small">${upcoming.date} — ${teamById(upcoming.home).name} vs ${teamById(upcoming.away).name} (${upcoming.kickOff || ''})</div>`;
  } else nextEl.textContent = "No upcoming matches";

  const latest = DATA.fixtures.filter(f=>f.homeGoals!==null).slice(-5).reverse();
  const lr = document.getElementById('latest-results');
  if(latest.length===0) lr.innerHTML='<div class="small">No results yet</div>';
  else {
    lr.innerHTML = latest.map(f=>`<div class="fixture"><div>${teamById(f.home).name} ${f.homeGoals} — ${f.awayGoals} ${teamById(f.away).name}</div><div class="meta">${f.date}</div></div>`).join('');
  }

  // teams
  const tg = document.getElementById('home-teams');
  tg.innerHTML = DATA.teams.map(t=>`
    <a class="team card" href="#" data-team="${t.id}">
      <img src="${t.logo || 'placeholder_team.png'}" alt="${t.name}" />
      <div><h4>${t.name}</h4><div class="small">${t.short}</div></div>
    </a>
  `).join('');
  document.querySelectorAll('[data-team]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      renderTeamPage(el.dataset.team);
      document.querySelectorAll('.main-nav a').forEach(x=>x.classList.remove('active'));
    })
  });
}

/* STANDINGS */
function computeStandings(){
  const table = {};
  DATA.teams.forEach(t => table[t.id] = {id:t.id,name:t.name, played:0, wins:0, draws:0, losses:0, gf:0, ga:0, pts:0});

  DATA.fixtures.filter(f=>f.homeGoals!==null).forEach(f=>{
    const h = table[f.home], a = table[f.away];
    h.played++; a.played++;
    h.gf += f.homeGoals; h.ga += f.awayGoals;
    a.gf += f.awayGoals; a.ga += f.homeGoals;
    if(f.homeGoals > f.awayGoals){
      h.wins++; a.losses++;
      h.pts += 3;
    } else if(f.homeGoals < f.awayGoals){
      a.wins++; h.losses++;
      a.pts += 3;
    } else {
      h.draws++; a.draws++;
      h.pts += 1; a.pts += 1;
    }
  });

  const arr = Object.values(table);
  arr.sort((x,y)=>{
    if(y.pts !== x.pts) return y.pts - x.pts;
    const gdY = y.gf - y.ga, gdX = x.gf - x.ga;
    if(gdY !== gdX) return gdY - gdX;
    if(y.gf !== x.gf) return y.gf - x.gf;
    return x.name.localeCompare(y.name);
  });
  arr.forEach((r,i)=>r.pos = i+1);
  return arr;
}

function renderStandings(){
  const standings = computeStandings();
  app.innerHTML = `
  <section class="card">
    <h3>Standings</h3>
    <div class="table-wrap">
      <table class="table" id="standings-table">
        <thead>
          <tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </section>
  `;
  const tbody = document.querySelector('#standings-table tbody');
  tbody.innerHTML = standings.map(r=>`
    <tr>
      <td>${r.pos}</td>
      <td>${r.name}</td>
      <td>${r.played}</td>
      <td>${r.wins}</td>
      <td>${r.draws}</td>
      <td>${r.losses}</td>
      <td>${r.gf}</td>
      <td>${r.ga}</td>
      <td>${r.gf - r.ga}</td>
      <td>${r.pts}</td>
    </tr>
  `).join('');
}

/* FIXTURES */
function renderFixtures(){
  app.innerHTML = `
  <section class="card">
    <h3>Fixtures & Results</h3>
    <div id="fixtures-list"></div>
  </section>
  <section class="card">
    <h3>Admin: Enter Result</h3>
    <div class="small">Select a fixture and enter score (client-side only).</div>
    <div style="margin-top:10px" id="admin-panel"></div>
  </section>
  `;
  const list = document.getElementById('fixtures-list');
  const sorted = DATA.fixtures.slice().sort((a,b)=>a.date.localeCompare(b.date));
  list.innerHTML = sorted.map(f=>{
    const home = teamById(f.home).name, away = teamById(f.away).name;
    const score = (f.homeGoals===null) ? `<span class="small">vs</span>` : `<strong>${f.homeGoals} - ${f.awayGoals}</strong>`;
    return `<div class="fixture card"><div>${f.date} — ${home} ${score} ${away} <span class="small">(${f.kickOff||''})</span></div><div style="display:flex;gap:8px"><button class="btn edit" data-id="${f.id}">Edit</button><button class="btn" data-print="${f.id}">Print Match Sheet</button></div></div>`;
  }).join('');

  document.querySelectorAll('.edit').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const fid = btn.dataset.id;
      showAdminForm(fid);
    })
  });

  document.querySelectorAll('[data-print]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const fid = btn.dataset.print;
      const f = DATA.fixtures.find(x=>x.id===fid);
      openPrintableMatchSheet(f);
    })
  });

  function showAdminForm(fid){
    const f = DATA.fixtures.find(x=>x.id===fid);
    const admin = document.getElementById('admin-panel');
    admin.innerHTML = `
      <form id="score-form" class="input-inline">
        <label>${teamById(f.home).name}</label>
        <input type="number" id="homeGoals" min="0" style="width:72px" value="${f.homeGoals===null?'':f.homeGoals}" />
        <span>:</span>
        <input type="number" id="awayGoals" min="0" style="width:72px" value="${f.awayGoals===null?'':f.awayGoals}" />
        <label>${teamById(f.away).name}</label>
        <button class="btn" type="submit">Save</button>
        <button id="clear-score" type="button" style="margin-left:8px">Clear</button>
      </form>
    `;
    document.getElementById('score-form').addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const hg = document.getElementById('homeGoals').value;
      const ag = document.getElementById('awayGoals').value;
      f.homeGoals = hg === '' ? null : parseInt(hg,10);
      f.awayGoals = ag === '' ? null : parseInt(ag,10);
      renderFixtures();
      document.querySelectorAll('.main-nav a').forEach(x=>x.classList.remove('active'));
      document.querySelector('[data-route="fixtures"]').classList.add('active');
    });
    document.getElementById('clear-score').addEventListener('click', ()=>{
      f.homeGoals = null; f.awayGoals = null;
      renderFixtures();
    });
  }
}

/* MATCHDAYS (new) */
function getMatchdays(){
  // grouped by date
  const byDate = {};
  DATA.fixtures.forEach(f=>{
    if(!byDate[f.date]) byDate[f.date] = [];
    byDate[f.date].push(f);
  });
  // return sorted dates
  return Object.keys(byDate).sort().map(date => ({ date, fixtures: byDate[date] }));
}

function renderMatchdays(){
  const matchdays = getMatchdays();
  app.innerHTML = `
    <section class="card">
      <h3>Matchdays</h3>
      <div class="matchday-list" id="matchday-list"></div>
    </section>
  `;
  const list = document.getElementById('matchday-list');
  if(matchdays.length===0) list.innerHTML = '<div class="small">No matchdays scheduled.</div>';
  else {
    list.innerHTML = matchdays.map(md=>`
      <div class="matchday-tile card">
        <div>
          <strong>${md.date}</strong> <div class="small">${md.fixtures.length} match(es)</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" data-open="${md.date}">Open</button>
          <button class="btn" data-print-day="${md.date}">Print Matchday</button>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('[data-open]').forEach(b=>{
      b.addEventListener('click', e=>{
        const date = b.dataset.open;
        renderMatchdayPage(date);
      })
    });
    document.querySelectorAll('[data-print-day]').forEach(b=>{
      b.addEventListener('click', e=>{
        const date = b.dataset.printDay;
        openPrintableMatchday(date);
      })
    });
  }
}

/**
 * Permanent fixture result storage using localStorage.
 * All edits in the admin input are saved to localStorage.
 * This persists across page reloads (browser only).
 * 
 * NOTE: localStorage only saves data for the current browser/device.
 * To save for all users, you need a backend server and database.
 * This demo does NOT sync between users.
 */
const FIXTURE_DB_KEY = 'kalceto-fixture-db';

// Load DB from localStorage
function loadFixtureDB() {
  try {
    return JSON.parse(localStorage.getItem(FIXTURE_DB_KEY)) || {};
  } catch {
    return {};
  }
}

// Save DB to localStorage
function saveFixtureDB(db) {
  localStorage.setItem(FIXTURE_DB_KEY, JSON.stringify(db));
}

let fixtureDB = loadFixtureDB();

// Save fixture result to the "database"
async function saveFixtureResult(fixture) {
  fixtureDB[fixture.id] = {
    homeGoals: fixture.homeGoals,
    awayGoals: fixture.awayGoals
  };
  saveFixtureDB(fixtureDB);
  return Promise.resolve();
}

// Load fixture result from the "database"
function loadFixtureResult(fixture) {
  const saved = fixtureDB[fixture.id];
  if (saved) {
    fixture.homeGoals = saved.homeGoals;
    fixture.awayGoals = saved.awayGoals;
  }
}

// On app load, sync DATA.fixtures with DB
DATA.fixtures.forEach(loadFixtureResult);

/**
 * Example usage:
 * When you edit a fixture result in the admin panel and click "Save",
 * the result is stored in localStorage and will persist across reloads.
 * 
 * To save for ALL users, you must use a backend API and database.
 * This code only saves for the current browser.
 */

function renderMatchdayPage(date){
  const fixtures = DATA.fixtures.filter(f=>f.date===date).sort((a,b)=> (a.kickOff||'').localeCompare(b.kickOff||''));
  app.innerHTML = `
    <section class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h3>Matchday — ${date}</h3>
          <div class="small">${fixtures.length} match(es)</div>
        </div>
        <div>
          <button class="btn" id="print-day">Print Matchday</button>
        </div>
      </div>
      <div style="margin-top:12px" id="md-fixtures"></div>
    </section>
  `;
  const mdEl = document.getElementById('md-fixtures');
  mdEl.innerHTML = fixtures.map(f=>{
    loadFixtureResult(f); // Always show latest from DB
    return `
    <div class="fixture card">
      <div>${f.kickOff ? `<strong>${f.kickOff}</strong>` : ''} ${teamById(f.home).name} ${f.homeGoals===null?'<span class="small">vs</span>':`<strong>${f.homeGoals} - ${f.awayGoals}</strong>`} ${teamById(f.away).name} <div class="small">${f.venue || ''}</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn" data-print="${f.id}">Print Match Sheet</button>
        <button class="btn edit" data-id="${f.id}">Edit</button>
      </div>
    </div>
    `;
  }).join('');

  document.getElementById('print-day').addEventListener('click', ()=> openPrintableMatchday(date));
  document.querySelectorAll('[data-print]').forEach(b=>{
    b.addEventListener('click', ()=> {
      const f = DATA.fixtures.find(x=>x.id===b.dataset.print);
      openPrintableMatchSheet(f);
    })
  });
  document.querySelectorAll('.edit').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      showAdminForm(btn.dataset.id);
    })
  });

  // re-use admin function from fixtures
  function showAdminForm(fid){
    const f = DATA.fixtures.find(x=>x.id===fid);
    loadFixtureResult(f); // Load latest from DB
    const panel = document.createElement('div');
    panel.className = 'card';
    panel.innerHTML = `
      <h4>Edit result</h4>
      <form id="score-form" class="input-inline">
        <label>${teamById(f.home).name}</label>
        <input type="number" id="homeGoals" min="0" style="width:72px" value="${f.homeGoals===null?'':f.homeGoals}" />
        <span>:</span>
        <input type="number" id="awayGoals" min="0" style="width:72px" value="${f.awayGoals===null?'':f.awayGoals}" />
        <label>${teamById(f.away).name}</label>
        <button class="btn" type="submit">Save</button>
        <button id="clear-score" type="button" style="margin-left:8px">Clear</button>
      </form>
    `;
    mdEl.prepend(panel);
    panel.querySelector('#score-form').addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const hg = panel.querySelector('#homeGoals').value;
      const ag = panel.querySelector('#awayGoals').value;
      f.homeGoals = hg === '' ? null : parseInt(hg,10);
      f.awayGoals = ag === '' ? null : parseInt(ag,10);
      await saveFixtureResult(f); // Save to database
      renderMatchdayPage(date);
    });
    panel.querySelector('#clear-score').addEventListener('click', async ()=>{
      f.homeGoals = null; f.awayGoals = null;
      await saveFixtureResult(f); // Save to database
      renderMatchdayPage(date);
    });
  }
}

/* TEAM PAGES */
function renderTeams(){
  app.innerHTML = `
    <section class="card">
      <h3>Teams</h3>
      <div class="team-grid" id="teams-grid"></div>
    </section>
  `;
  const grid = document.getElementById('teams-grid');
  grid.innerHTML = DATA.teams.map(t=>`
    <a class="team card" href="#" data-team="${t.id}">
      <img src="${t.logo || 'placeholder_team.png'}" alt="${t.name}" />
      <div><h4>${t.name}</h4><div class="small">${t.short}</div></div>
    </a>
    `).join('');
  document.querySelectorAll('[data-team]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      renderTeamPage(el.dataset.team);
    })
  });
}

function renderTeamPage(teamId){
  const team = teamById(teamId);
  app.innerHTML = `
    <section class="card">
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${team.logo || 'placeholder_team.png'}" style="width:96px;height:96px;border-radius:12px;object-fit:cover"/>
        <div>
          <h2>${team.name}</h2>
          <div class="small">Short: ${team.short}</div>
        </div>
      </div>
    </section>
    <section class="card">
      <h3>Matches</h3>
      <div id="team-matches"></div>
    </section>
  `;
  const tm = document.getElementById('team-matches');
  const matches = DATA.fixtures.filter(f=>f.home===teamId || f.away===teamId).sort((a,b)=>a.date.localeCompare(b.date));
  tm.innerHTML = matches.map(f=>{
    const home = teamById(f.home).name, away = teamById(f.away).name;
    const score = (f.homeGoals===null) ? `<span class="small">vs</span>` : `<strong>${f.homeGoals} - ${f.awayGoals}</strong>`;
    return `<div class="fixture card"><div>${f.date} — ${home} ${score} ${away}</div></div>`;
  }).join('');
}

// Add all other teams to the grid (already handled by DATA.teams.map above)
// If you want to show all teams (t1-t10), just ensure DATA.teams contains all teams as in your code:
// Red Strikers, Blue Rockets, Green Wolves, Golden Eagles, Black Eagles, etc.
// The code above will automatically render all teams present in DATA.teams.

/* STATS (basic) */
function renderStats(){
  app.innerHTML = `
    <section class="card">
      <h3>Stats</h3>
      <p class="small">Basic stats summary (expandable)</p>
      <div id="stats-body"></div>
    </section>
  `;
  const sb = document.getElementById('stats-body');
  const standings = computeStandings();
  sb.innerHTML = `
    <div class="card small"><strong>Top team:</strong> ${standings[0].name} (${standings[0].pts} pts)</div>
    <div class="card small"><strong>Matches played:</strong> ${DATA.fixtures.filter(f=>f.homeGoals!==null).length}</div>
  `;
}

/* PRINTABLES (open new window, render HTML, trigger print) */

function buildMatchSheetHTML(fixture){
  const home = teamById(fixture.home);
  const away = teamById(fixture.away);
  const score = (fixture.homeGoals===null) ? '—' : `${fixture.homeGoals} - ${fixture.awayGoals}`;
  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Match Sheet — ${home.name} vs ${away.name}</title>
    <style>
      body{font-family: Arial, Helvetica, sans-serif; margin:20px; color:#111}
      header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
      h1{font-size:20px;margin:0}
      .meta{font-size:13px;color:#444;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      .two-col{display:flex;gap:12px;justify-content:space-between}
      .box{border:1px solid #ddd;padding:10px;width:48%}
      .center{text-align:center}
      @media print { body{margin:8mm} }
    </style>
  </head>
  <body>
    <div class="print-sheet">
      <header>
        <div>
          <h1>Kalceto Cup — Match Sheet</h1>
          <div class="meta">${fixture.date} ${fixture.kickOff ? ' | ' + fixture.kickOff : ''} | ${fixture.venue || ''}</div>
        </div>
        <div class="center">
          <div style="font-weight:700">${home.name} vs ${away.name}</div>
          <div style="font-size:18px;margin-top:6px">${score}</div>
        </div>
      </header>

      <section>
        <h3>Match details</h3>
        <table>
          <tr><th>Home</th><td>${home.name}</td></tr>
          <tr><th>Away</th><td>${away.name}</td></tr>
          <tr><th>Venue</th><td>${fixture.venue || '—'}</td></tr>
          <tr><th>Kick-off</th><td>${fixture.kickOff || '—'}</td></tr>
          <tr><th>Referee</th><td>______________________</td></tr>
          <tr><th>Notes</th><td style="height:80px"></td></tr>
        </table>
      </section>

      <section style="margin-top:12px">
        <div class="two-col">
          <div class="box">
            <strong>Home team lineup / subs</strong>
            <ol>
              <li>__________________</li><li>__________________</li><li>__________________</li>
              <li>__________________</li><li>__________________</li>
            </ol>
          </div>
          <div class="box">
            <strong>Away team lineup / subs</strong>
            <ol>
              <li>__________________</li><li>__________________</li><li>__________________</li>
              <li>__________________</li><li>__________________</li>
            </ol>
          </div>
        </div>
      </section>

      <section style="margin-top:12px">
        <h3>Events</h3>
        <table>
          <thead><tr><th>Minute</th><th>Event</th><th>Player / Notes</th></tr></thead>
          <tbody>
            <tr><td>____</td><td>Goal</td><td>__________________</td></tr>
            <tr><td>____</td><td>Yellow card</td><td>__________________</td></tr>
            <tr><td>____</td><td>Red card</td><td>__________________</td></tr>
            <tr><td>____</td><td>Sub</td><td>__________________</td></tr>
          </tbody>
        </table>
      </section>

      <footer style="margin-top:18px;font-size:12px;color:#666">
        Printed: ${new Date().toLocaleString()}
      </footer>
    </div>
    <script>
      // Trigger print once loaded (give browser a short moment)
      setTimeout(()=>{ window.print(); }, 300);
    </script>
  </body>
  </html>
  `;
  return html;
}

function openPrintableMatchSheet(fixture){
  const html = buildMatchSheetHTML(fixture);
  const w = window.open('', '_blank', 'width=900,height=700');
  if(!w){
    alert('Popup blocked. Please allow popups for this site to print the match sheet.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* Build printable HTML for full matchday */
function buildMatchdayHTML(date, fixtures){
  const items = fixtures.map(f=>{
    const home = teamById(f.home).name, away = teamById(f.away).name;
    const score = (f.homeGoals===null) ? '—' : `${f.homeGoals} - ${f.awayGoals}`;
    return `<tr><td>${f.kickOff || ''}</td><td>${home}</td><td>${score}</td><td>${away}</td><td>${f.venue || ''}</td></tr>`;
  }).join('');
  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Matchday — ${date}</title>
    <style>
      body{font-family: Arial, Helvetica, sans-serif; margin:20px; color:#111}
      h1{font-size:20px;margin:0 0 6px 0}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      @media print { body{margin:8mm} }
    </style>
  </head>
  <body>
    <div class="print-sheet">
      <h1>Kalceto Cup — Matchday ${date}</h1>
      <div class="meta">Printed: ${new Date().toLocaleString()}</div>
      <table>
        <thead><tr><th>Kick-off</th><th>Home</th><th>Score</th><th>Away</th><th>Venue</th></tr></thead>
        <tbody>${items}</tbody>
      </table>
    </div>
    <script>setTimeout(()=>{ window.print(); }, 250);</script>
  </body>
  </html>
  `;
  return html;
}

function openPrintableMatchday(date){
  const fixtures = DATA.fixtures.filter(f=>f.date===date).sort((a,b)=> (a.kickOff||'').localeCompare(b.kickOff||''));
  const html = buildMatchdayHTML(date, fixtures);
  const w = window.open('', '_blank', 'width=900,height=700');
  if(!w){
    alert('Popup blocked. Please allow popups for this site to print the matchday sheet.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

