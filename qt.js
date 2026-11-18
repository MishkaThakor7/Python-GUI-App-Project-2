/* Qt Designer widget set (QDial, QLCDNumber, QCalendarWidget, QDateTimeEdit, QSlider, QTreeWidget ...)
   redrawn in plain HTML/CSS/JS. No libraries. Hover any widget to see its Qt class in the status bar. */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const p2 = n => String(n).padStart(2, "0");
const isoLocal = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const fmtD = d => d.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
const money = n => "R" + Math.round(n).toLocaleString("en-ZA");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fire = (el, t = "input") => el.dispatchEvent(new Event(t, { bubbles: true }));
const Qt = { logged: false };

/* QStatusBar: messages on the left, the Qt class under the mouse on the right */
let stT;
Qt.status = (m, ms = 5000) => { const s = $("#st"); s.textContent = m; clearTimeout(stT); stT = setTimeout(() => s.textContent = "Ready", ms); };
document.addEventListener("mouseover", e => { const w = e.target.closest && e.target.closest("[data-qt]"), s = $("#stw"); if (w && s) s.textContent = w.dataset.qt + (w.id ? "  ·  " + w.id : ""); });

/* QMessageBox */
Qt.msg = (kind, title, text, cb, buttons) => {
  let o = $("#ovl"); if (!o) { o = document.createElement("div"); o.id = "ovl"; o.className = "ovl"; document.body.appendChild(o); }
  o.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><div class="mt">${esc(title)}</div><div class="mb"><div class="ico ${kind}">${{ info: "i", warn: "!", crit: "×", ask: "?" }[kind]}</div><div>${esc(text)}</div></div>` +
    `<div class="btnrow">${buttons.map((b, i) => `<button class="qpush${i ? "" : " def"}" data-i="${i}">${b}</button>`).join("")}</div></div>`;
  o.classList.add("on"); $("button", o).focus();
  $$("button", o).forEach(b => b.onclick = () => { o.classList.remove("on"); if (cb) cb(+b.dataset.i); });
};
Qt.info = (t, m, cb) => Qt.msg("info", t, m, cb, ["OK"]);
Qt.warn = (t, m, cb) => Qt.msg("warn", t, m, cb, ["OK"]);
Qt.ask = (t, m, yes) => Qt.msg("ask", t, m, i => { if (i === 0) yes(); }, ["Yes", "No"]);

/* QMenuBar */
Qt.menus = h => {
  $$(".mi").forEach(m => m.addEventListener("click", e => { if (e.target.closest(".act")) return; const was = m.classList.contains("open"); $$(".mi").forEach(x => x.classList.remove("open")); if (!was) m.classList.add("open"); }));
  $$(".act").forEach(a => a.addEventListener("click", () => { $$(".mi").forEach(x => x.classList.remove("open")); if (h[a.dataset.act]) h[a.dataset.act](); }));
  $$(".title [data-act]").forEach(b => b.addEventListener("click", () => h[b.dataset.act] && h[b.dataset.act]()));
  document.addEventListener("click", e => { if (!e.target.closest(".mi")) $$(".mi").forEach(x => x.classList.remove("open")); });
};
Qt.palette = () => document.body.classList.toggle("dark") + document.body.classList.toggle("light");

/* QStackedWidget */
Qt.stack = onGo => {
  const pages = $$(".central > .page");
  const go = n => { if (n > 0 && !Qt.logged) return; pages.forEach((p, i) => p.classList.toggle("on", i === n)); if (onGo) onGo(n); window.scrollTo(0, 0); };
  $$("[data-go]").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
  return go;
};

/* QSpinBox / QDoubleSpinBox:  <input class="qline" data-spin data-min data-max data-step data-dec data-pre data-suf> */
Qt.spin = el => {
  const D = el.dataset, n = (v, d) => v === undefined ? d : +v, min = n(D.min, 0), max = n(D.max, 100), step = n(D.step, 1), dec = n(D.dec, 0), pre = D.pre || "", suf = D.suf || "";
  const w = document.createElement("div"); w.className = "spin"; el.replaceWith(w); w.append(el);
  const ar = document.createElement("div"); ar.className = "ar"; ar.innerHTML = "<i>▲</i><i>▼</i>"; w.append(ar);
  const parse = () => { const v = parseFloat(String(el.value).replace(/[^0-9.\-]/g, "")); return isNaN(v) ? min : v; };
  const set = v => { v = Math.min(max, Math.max(min, v)); el.value = pre + v.toFixed(dec) + suf; };
  const bump = d => { set(parse() + d * step); fire(el); };
  set(parse());
  ar.children[0].onclick = () => bump(1); ar.children[1].onclick = () => bump(-1);
  el.addEventListener("keydown", e => { if (e.key === "ArrowUp") { e.preventDefault(); bump(1); } if (e.key === "ArrowDown") { e.preventDefault(); bump(-1); } });
  el.addEventListener("blur", () => { set(parse()); fire(el, "change"); });
  el.addEventListener("wheel", e => { if (document.activeElement === el) { e.preventDefault(); bump(e.deltaY < 0 ? 1 : -1); } }, { passive: false });
  el._get = parse; el._set = set;
};
Qt.val = el => el._get(); Qt.setVal = (el, v) => el._set(v);

/* QDateTimeEdit / QDateEdit / QTimeEdit: sections are highlighted and stepped with the arrows, like Qt */
Qt.dte = (el, { fmt, init, min, clamp, step = 1 }) => {
  const w = document.createElement("div"); w.className = "spin"; el.replaceWith(w); w.append(el);
  const ar = document.createElement("div"); ar.className = "ar"; ar.innerHTML = "<i>▲</i><i>▼</i>"; w.append(ar);
  el.readOnly = true;
  const lim = clamp || (x => min && x < min ? new Date(min) : x);
  let d = lim(new Date(init)), si = 0, secs = [];
  const render = () => {
    const V = { dd: p2(d.getDate()), MM: p2(d.getMonth() + 1), yyyy: String(d.getFullYear()), HH: p2(d.getHours()), mm: p2(d.getMinutes()) };
    secs = []; let out = "", last = 0;
    fmt.replace(/dd|MM|yyyy|HH|mm/g, (t, i) => { out += fmt.slice(last, i); secs.push({ t, s: out.length, l: V[t].length }); out += V[t]; last = i + t.length; });
    el.value = out + fmt.slice(last);
  };
  const hl = () => el.setSelectionRange(secs[si].s, secs[si].s + secs[si].l);
  const pick = () => { si = Math.max(0, secs.findIndex(s => el.selectionStart >= s.s && el.selectionStart <= s.s + s.l)); hl(); };
  const bump = dir => {
    const t = secs[si].t, x = new Date(d);
    if (t === "dd") x.setDate(x.getDate() + dir); if (t === "MM") x.setMonth(x.getMonth() + dir); if (t === "yyyy") x.setFullYear(x.getFullYear() + dir);
    if (t === "HH") x.setHours(x.getHours() + dir); if (t === "mm") x.setMinutes(x.getMinutes() + dir * step);
    d = lim(x); render(); hl(); fire(el);
  };
  ar.children[0].onclick = () => { bump(1); el.focus(); }; ar.children[1].onclick = () => { bump(-1); el.focus(); };
  el.addEventListener("mouseup", pick); el.addEventListener("focus", () => setTimeout(pick, 0));
  el.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") { e.preventDefault(); bump(1); } else if (e.key === "ArrowDown") { e.preventDefault(); bump(-1); }
    else if (e.key === "ArrowRight" && si < secs.length - 1) { e.preventDefault(); si++; hl(); } else if (e.key === "ArrowLeft" && si > 0) { e.preventDefault(); si--; hl(); }
  });
  render(); el._get = () => new Date(d); el._set = x => { d = lim(new Date(x)); render(); };
};
Qt.dateOf = el => el._get();

/* QCalendarWidget: week numbers, weekends in red, minimum date */
Qt.calendar = (el, { min, onChange } = {}) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let sel = new Date(today), vy = sel.getFullYear(), vm = sel.getMonth();
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const wk = d => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7); };
  function draw() {
    const start = new Date(vy, vm, 1 - ((new Date(vy, vm, 1).getDay() + 6) % 7));
    let h = `<div class="cal"><div class="nav"><button type="button" data-n="-12">«</button><button type="button" data-n="-1">‹</button><b>${MON[vm]} ${vy}</b><button type="button" data-n="1">›</button><button type="button" data-n="12">»</button></div><table><tr><th></th>${["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(x => `<th>${x}</th>`).join("")}</tr>`;
    for (let r = 0; r < 6; r++) {
      const rs = new Date(start.getFullYear(), start.getMonth(), start.getDate() + r * 7);
      h += `<tr><td class="wk">${wk(new Date(rs.getFullYear(), rs.getMonth(), rs.getDate() + 3))}</td>`;
      for (let c = 0; c < 7; c++) {
        const d = new Date(rs.getFullYear(), rs.getMonth(), rs.getDate() + c);
        const cls = [d.getMonth() !== vm && "dim", c > 4 && "we", min && d < min && "dis", d.getTime() === sel.getTime() && "sel", d.getTime() === today.getTime() && "today"].filter(Boolean).join(" ");
        h += `<td class="${cls}" data-t="${d.getTime()}">${d.getDate()}</td>`;
      }
      h += "</tr>";
    }
    el.innerHTML = h + "</table></div>";
    $$(".nav button", el).forEach(b => b.onclick = () => { const d = new Date(vy, vm + +b.dataset.n, 1); vy = d.getFullYear(); vm = d.getMonth(); draw(); });
    $$("td[data-t]", el).forEach(td => td.onclick = () => { if (td.classList.contains("dis")) return; sel = new Date(+td.dataset.t); vy = sel.getFullYear(); vm = sel.getMonth(); draw(); if (onChange) onChange(new Date(sel)); });
  }
  draw();
  return { get: () => new Date(sel), set: d => { sel = new Date(d); vy = sel.getFullYear(); vm = sel.getMonth(); draw(); } };
};

/* QSlider (horizontal or vertical) */
Qt.slider = (el, { min, max, step = 1, value, v = false, onChange }) => {
  el.classList.add("slider", v ? "v" : "h"); el.tabIndex = 0; el.setAttribute("role", "slider");
  el.innerHTML = '<div class="gv"></div><div class="fl"></div><div class="hd"></div>';
  let val = value, drag = false; const hd = $(".hd", el), fl = $(".fl", el);
  const draw = () => { const f = (val - min) / (max - min); if (v) { hd.style.bottom = `calc((100% - 16px) * ${f})`; fl.style.height = f * 100 + "%"; } else { hd.style.left = `calc((100% - 16px) * ${f})`; fl.style.width = f * 100 + "%"; } el.setAttribute("aria-valuenow", val); };
  const set = x => { x = Math.min(max, Math.max(min, Math.round(x / step) * step)); const c = x !== val; val = x; draw(); if (c) { if (onChange) onChange(val); fire(el); } };
  const from = e => { const r = el.getBoundingClientRect(), f = v ? 1 - (e.clientY - r.top - 8) / (r.height - 16) : (e.clientX - r.left - 8) / (r.width - 16); set(min + Math.min(1, Math.max(0, f)) * (max - min)); };
  el.addEventListener("pointerdown", e => { drag = true; el.setPointerCapture(e.pointerId); el.focus(); from(e); });
  el.addEventListener("pointermove", e => { if (drag) from(e); }); el.addEventListener("pointerup", () => drag = false);
  el.addEventListener("keydown", e => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (k) { e.preventDefault(); set(val + k * step); } if (e.key === "Home") set(min); if (e.key === "End") set(max);
  });
  draw(); return { get: () => val, set };
};

/* QDial */
Qt.dial = (el, { min, max, value, onChange }) => {
  el.classList.add("dial"); el.tabIndex = 0; el.setAttribute("role", "slider");
  let val = value, drag = false, n = "";
  for (let i = 0; i <= max - min; i++) { const a = (-135 + i * 270 / (max - min)) * Math.PI / 180; n += `<line x1="${50 + 40 * Math.sin(a)}" y1="${50 - 40 * Math.cos(a)}" x2="${50 + 46 * Math.sin(a)}" y2="${50 - 46 * Math.cos(a)}" stroke="var(--bdd)" stroke-width="1.5"/>`; }
  el.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="var(--b1)" stroke="var(--bdd)" stroke-width="2"/>${n}<circle r="5" fill="var(--hl)"/><text x="50" y="56" text-anchor="middle" font-size="16" font-weight="600" fill="var(--tx)"></text></svg>`;
  const h = $("circle[r='5']", el), t = $("text", el);
  const draw = () => { const a = (-135 + (val - min) * 270 / (max - min)) * Math.PI / 180; h.setAttribute("cx", 50 + 24 * Math.sin(a)); h.setAttribute("cy", 50 - 24 * Math.cos(a)); t.textContent = val; el.setAttribute("aria-valuenow", val); };
  const set = x => { x = Math.min(max, Math.max(min, Math.round(x))); const c = x !== val; val = x; draw(); if (c) { if (onChange) onChange(val); fire(el); } };
  const from = e => { const r = el.getBoundingClientRect(), a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI; set(min + (Math.min(135, Math.max(-135, a)) + 135) / 270 * (max - min)); };
  el.addEventListener("pointerdown", e => { drag = true; el.setPointerCapture(e.pointerId); el.focus(); from(e); });
  el.addEventListener("pointermove", e => { if (drag) from(e); }); el.addEventListener("pointerup", () => drag = false);
  el.addEventListener("keydown", e => { const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]; if (k) { e.preventDefault(); set(val + k); } });
  draw(); return { get: () => val, set };
};

/* QProgressBar */
Qt.progress = (el, v, text) => { el.classList.add("prog"); el.innerHTML = `<i style="width:${v}%"></i><span>${esc(text ?? v + "%")}</span>`; };

/* QLCDNumber: seven-segment digits */
const SEG = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g" };
const SL = { a: [4, 3, 16, 3], g: [4, 18, 16, 18], d: [4, 33, 16, 33], f: [2, 5, 2, 16], b: [18, 5, 18, 16], e: [2, 20, 2, 31], c: [18, 20, 18, 31] };
Qt.lcd = (el, str) => {
  let x = 0, s = "";
  for (const ch of String(str)) {
    if (ch === ":") { s += `<circle cx="${x + 4}" cy="12" r="2.2"/><circle cx="${x + 4}" cy="25" r="2.2"/>`; x += 9; }
    else { for (const k of SEG[ch] || "") s += `<line x1="${x + SL[k][0]}" y1="${SL[k][1]}" x2="${x + SL[k][2]}" y2="${SL[k][3]}"/>`; x += 24; }
  }
  el.classList.add("lcd"); el.innerHTML = `<svg viewBox="0 0 ${x} 36" height="38" width="${Math.round(x * 38 / 36)}" stroke="currentColor" fill="currentColor" stroke-width="3" stroke-linecap="round">${s}</svg>`;
};

/* item widgets: QTableWidget, QListWidget, QTreeWidget */
Qt.table = (el, cols, rows) => {
  el.innerHTML = rows.length ? `<table class="qtable"><thead><tr>${cols.map(c => `<th>${esc(c[0])}</th>`).join("")}</tr></thead><tbody>${rows.map((r, i) => `<tr data-i="${i}">${cols.map(c => `<td>${esc(typeof c[1] === "function" ? c[1](r) : r[c[1]])}</td>`).join("")}</tr>`).join("")}</tbody></table>` : '<div class="mut" style="padding:8px">No items.</div>';
};
Qt.pick = (el, sel) => el.addEventListener("click", e => { const r = e.target.closest(sel); if (!r || !el.contains(r)) return; $$(".sel", el).forEach(x => x.classList.remove("sel")); r.classList.add("sel"); });
Qt.picked = el => { const r = $(".sel", el); return r ? +r.dataset.i : -1; };
Qt.tree = (el, cols, groups, empty) => {
  const T = `grid-template-columns:${cols.map(c => c[1]).join(" ")}`;
  el.innerHTML = `<div class="th" style="${T}">${cols.map(c => `<span>${esc(c[0])}</span>`).join("")}</div>` + (groups.length ? groups.map((g, gi) =>
    `<div class="tr top" style="${T}" data-g="${gi}"><span><u>▾</u>${esc(g.c[0])}</span>${g.c.slice(1).map(x => `<span>${esc(x)}</span>`).join("")}</div>` +
    g.kids.map(k => `<div class="tr kid" style="${T}" data-g="${gi}" data-id="${k.id}">${k.c.map((x, i) => `<span${i ? "" : ' style="padding-left:20px"'}>${esc(x)}</span>`).join("")}</div>`).join("")).join("") : `<div class="mut" style="padding:8px">${esc(empty || "Nothing here yet.")}</div>`);
  $$(".tr.top u", el).forEach(u => u.onclick = e => { e.stopPropagation(); const open = u.textContent === "▾"; u.textContent = open ? "▸" : "▾"; $$(`.kid[data-g="${u.closest(".tr").dataset.g}"]`, el).forEach(k => k.hidden = open); });
  $$(".tr", el).forEach(r => r.onclick = () => { $$(".tr.sel", el).forEach(x => x.classList.remove("sel")); r.classList.add("sel"); });
};
Qt.treePicked = el => { const r = $(".tr.kid.sel", el); return r ? r.dataset.id : null; };

/* QTabWidget */
Qt.tabs = (el, cb) => {
  const bs = $$(".tabbar button", el), ps = $$(".tabpage", el);
  const sel = i => { bs.forEach((b, j) => b.classList.toggle("on", i === j)); ps.forEach((p, j) => p.classList.toggle("on", i === j)); if (cb) cb(i); };
  bs.forEach((b, i) => b.onclick = () => sel(i)); sel(0); return sel;
};

/* save a text file (works as a local file and as a shared link) */
Qt.save = async (name, text) => {
  let dl = null; try { dl = window.claude ? await window.claude.use("downloads") : null; } catch (e) {}
  if (dl) { try { await dl.save({ filename: name, data: text }); } catch (e) {} return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
};
