// Demo login. Change before real use. (This check runs in the browser, so it is not real security.)
const USERNAME = "demo", PASSWORD = "amper123";
const KEY = "amper_qt_v1", TITLES = ["Sign in", "Vehicle inventory", "Test-drive bookings", "Dashboard & reports"];
let db = { vehicles: [], drives: [], log: [] };
try { const s = localStorage.getItem(KEY); if (s) db = { ...db, ...JSON.parse(s) }; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
const label = v => `${v.year} ${v.make} ${v.model}`;

/* logo (car + bolt), shown as a QLabel pixmap */
const LOGO = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="var(--base)" stroke="var(--hl)" stroke-width="3"/><path d="M22 62v-6c0-3 2-5 5-6l8-1 8-10c1-1 2-2 4-2h12c2 0 3 1 4 2l8 10 4 1c3 1 5 3 5 6v6z" fill="var(--hl)"/><circle cx="35" cy="64" r="7" fill="var(--base)" stroke="var(--hl)" stroke-width="3"/><circle cx="67" cy="64" r="7" fill="var(--base)" stroke="var(--hl)" stroke-width="3"/><polygon points="55,39 46,52 52,52 49,61 60,46 54,46" fill="var(--base)"/></svg>`;
$$(".logo").forEach(e => e.innerHTML = LOGO);

/* activity log (QTextBrowser) */
function logEvent(m) { db.log.unshift({ t: new Date().toISOString(), msg: m }); db.log = db.log.slice(0, 30); save(); }
const drawLog = () => $("#log").innerHTML = db.log.slice(0, 8).map(l => `<p><time>${new Date(l.t).toTimeString().slice(0, 5)}</time>${esc(l.msg)}</p>`).join("") || '<p class="mut">No activity yet.</p>';

/* window: pages, menus */
const go = Qt.stack(n => { $("#wt").textContent = "Amper Motors — " + TITLES[n]; if (n === 2) { fillVehicles(); drawTree(); } if (n === 3) refresh(); });
const signOut = () => { Qt.logged = false; go(0); Qt.status("Signed out."); };
Qt.menus({ signout: signOut, exit: signOut, palette: Qt.palette,
  about: () => Qt.info("About Amper Motors", "A four-page dealership demo built only from Qt Designer widgets: QTabWidget, QSlider, QTextBrowser, QTimeEdit, QDateEdit, QCalendarWidget, QTreeWidget, QGraphicsView and QScrollArea. Hover any widget to see its class in the status bar.") });

/* page 0: login */
$("#loginBtn").onclick = () => {
  if ($("#user").value.trim().toLowerCase() === USERNAME && $("#pass").value === PASSWORD) {
    Qt.logged = true; $("#user").value = $("#pass").value = "";
    Qt.info("Login Successful", "Welcome to Amper Motors.", () => go(1));
  } else { $("#pass").value = ""; Qt.warn("Login Failed", "Incorrect username or password. Please try again."); }
};
$("#cancelBtn").onclick = () => { $("#user").value = $("#pass").value = ""; };
$("#pass").addEventListener("keydown", e => { if (e.key === "Enter") $("#loginBtn").click(); });
$$("[data-spin]").forEach(Qt.spin);

/* page 1: inventory with a live spec sheet */
Qt.tabs($("#vTabs"));
const rangeS = Qt.slider($("#rangeS"), { min: 0, max: 800, step: 10, value: 400 });
const sohS = Qt.slider($("#sohS"), { min: 60, max: 100, value: 100, v: true });
function syncV() {
  $("#rangeOut").textContent = rangeS.get() + " km"; $("#sohOut").textContent = sohS.get() + "%";
  const f = $$("#feats input:checked").map(c => c.value), colour = $("#vColour").value.trim(), plug = $("#vPlug").value, notes = $("#vNotes").value.trim();
  const name = [Qt.val($("#vYear")), $("#vMake").value.trim(), $("#vModel").value.trim()].filter(Boolean).join(" ") || "New vehicle";
  $("#spec").innerHTML = `<h3>${esc(name)}</h3><p>${esc($("#vFuel").value)} · ${esc($("#vCond").value)}${colour ? " · " + esc(colour) : ""}</p>` +
    `<p><b>${rangeS.get()} km</b> range · battery health <b>${sohS.get()}%</b>${plug !== "None" ? " · " + esc(plug) + " port" : ""}</p><p><b>${money(Qt.val($("#vPrice")))}</b></p>` +
    `<p class="mut">${f.length ? esc(f.join(", ")) : "No features selected"}</p>${notes ? "<p>" + esc(notes) + "</p>" : ""}`;
}
["input", "change"].forEach(ev => $("#p1").addEventListener(ev, syncV));
function clearV() {
  ["#vMake", "#vModel", "#vColour", "#vNotes"].forEach(s => $(s).value = ""); Qt.setVal($("#vYear"), 2024); Qt.setVal($("#vPrice"), 0);
  $("#vFuel").selectedIndex = $("#vPlug").selectedIndex = $("#vCond").selectedIndex = 0; $$("#feats input").forEach(c => c.checked = false); rangeS.set(400); sohS.set(100); syncV();
}
$("#clearV").onclick = clearV;
$("#saveV").onclick = () => {
  const make = $("#vMake").value.trim(), model = $("#vModel").value.trim(), price = Qt.val($("#vPrice"));
  if (!make || !model || price <= 0) return Qt.warn("Missing Information", "Please enter a make, a model and a price above zero.");
  const v = { id: uid(), make, model, year: Qt.val($("#vYear")), colour: $("#vColour").value.trim(), fuel: $("#vFuel").value, plug: $("#vPlug").value, condition: $("#vCond").value,
    range: rangeS.get(), soh: sohS.get(), price, features: $$("#feats input:checked").map(c => c.value), notes: $("#vNotes").value.trim() };
  db.vehicles.push(v); logEvent("Vehicle added: " + label(v)); clearV(); Qt.info("Vehicle Saved", `${label(v)} has been added to stock.`);
};

/* page 2: test drives */
const today = new Date(); today.setHours(0, 0, 0, 0);
const cal = Qt.calendar($("#dCal"), { min: today, onChange: d => Qt.status("Test drive on " + fmtD(d), 4000) });
const inHours = x => { const m = x.getHours() * 60 + x.getMinutes(); if (m < 480) x.setHours(8, 0); if (m > 1020) x.setHours(17, 0); return x; };
Qt.dte($("#dTime"), { fmt: "HH:mm", init: new Date(2000, 0, 1, 10, 0), clamp: inHours, step: 15 });
const nextYear = new Date(today); nextYear.setFullYear(today.getFullYear() + 1);
Qt.dte($("#dLic"), { fmt: "dd/MM/yyyy", init: nextYear, min: today });
function fillVehicles() {
  ["#dVehicle", "#fVehicle"].forEach(s => {
    const el = $(s), keep = el.value;
    el.innerHTML = db.vehicles.length ? db.vehicles.map(v => `<option value="${v.id}">${esc(label(v))}</option>`).join("") : '<option value="">No vehicles yet</option>';
    if (db.vehicles.some(v => v.id === keep)) el.value = keep;
  });
  calc();
}
function drawTree() {
  const days = [...new Set(db.drives.map(d => d.date))].sort();
  Qt.tree($("#tree"), [["Date", "1.1fr"], ["Customer", "1.3fr"], ["Vehicle", "1.8fr"], ["Time", ".7fr"], ["Payment", ".8fr"]],
    days.map(day => ({ c: [day, "", "", "", ""], kids: db.drives.filter(d => d.date === day).sort((a, b) => a.time.localeCompare(b.time)).map(d => ({ id: d.id, c: ["", d.customer, d.vehicle, d.time, d.payment] })) })), "No test drives booked yet.");
}
$("#bookD").onclick = () => {
  const name = $("#dName").value.trim(), contact = $("#dContact").value.trim(), v = db.vehicles.find(x => x.id === $("#dVehicle").value);
  if (!name || !contact) return Qt.warn("Missing Information", "Please enter a customer name and a contact detail.");
  if (!v) return Qt.warn("No Vehicle", "Add a vehicle to stock first, then book the test drive.");
  const t = Qt.dateOf($("#dTime")), time = `${p2(t.getHours())}:${p2(t.getMinutes())}`, when = isoLocal(cal.get());
  if (isoLocal(Qt.dateOf($("#dLic"))) < when) return Qt.warn("Licence Expired", "That licence expires before the test drive date. A valid licence is needed to drive.");
  db.drives.push({ id: uid(), customer: name, contact, vehicleId: v.id, vehicle: label(v), date: when, time, payment: $("#dPay").value, extras: $$("#extras input:checked").map(c => c.value).join(", ") || "None" });
  logEvent(`Test drive booked: ${name}, ${label(v)}`); save(); $("#dName").value = $("#dContact").value = ""; $$("#extras input").forEach(c => c.checked = false); drawTree();
  Qt.info("Test Drive Booked", `${name} is booked for the ${label(v)} on ${fmtD(cal.get())} at ${time}.`);
};
$("#cancelD").onclick = () => {
  const id = Qt.treePicked($("#tree")); if (!id) return Qt.info("Nothing selected", "Select a booking (not a date) in the list first.");
  Qt.ask("Cancel booking", "Cancel the selected test drive?", () => { db.drives = db.drives.filter(d => d.id !== id); logEvent("Test drive cancelled"); save(); drawTree(); });
};

/* page 3: dashboard */
Qt.tabs($("#tTabs"));
let face = ""; for (let i = 0; i < 12; i++) face += `<line x1="60" y1="9" x2="60" y2="${i % 3 ? 14 : 18}" stroke="var(--dis)" stroke-width="${i % 3 ? 1.5 : 2.5}" transform="rotate(${i * 30} 60 60)"/>`;
$("#faceTicks").innerHTML = face;
function tick() {
  const d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = d.getHours() % 12 + m / 60;
  $("#hH").setAttribute("transform", `rotate(${h * 30} 60 60)`); $("#hM").setAttribute("transform", `rotate(${m * 6} 60 60)`); $("#hS").setAttribute("transform", `rotate(${s * 6} 60 60)`);
  $("#clockTime").textContent = d.toTimeString().slice(0, 8); $("#clockDate").textContent = d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
}
tick(); setInterval(tick, 1000);
function drawChart() {
  const kinds = ["Electric", "Plug-in hybrid", "Hybrid"], counts = kinds.map(k => db.vehicles.filter(v => v.fuel === k).length), max = Math.max(1, ...counts);
  $("#gvChart").innerHTML = `<svg viewBox="0 0 300 150" role="img" aria-label="Stock by fuel type">` + kinds.map((k, i) => {
    const h = Math.round(counts[i] / max * 90), x = 30 + i * 90;
    return `<rect x="${x}" y="${110 - h}" width="60" height="${h}" fill="var(--hl)"/><text x="${x + 30}" y="${104 - h}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--tx)">${counts[i]}</text><text x="${x + 30}" y="130" text-anchor="middle" font-size="10" fill="var(--dis)">${k}</text>`;
  }).join("") + `<line x1="15" y1="110" x2="285" y2="110" stroke="var(--bd)"/></svg>`;
}
function calc() {
  const v = db.vehicles.find(x => x.id === $("#fVehicle").value);
  if (!v) { $("#fOut").textContent = "—"; $("#fNote").textContent = "Add a vehicle to estimate repayments."; return; }
  const dep = Qt.val($("#fDep")), n = +$("#fTerm").value, rate = Qt.val($("#fRate")), r = rate / 1200, P = v.price * (1 - dep / 100);
  $("#fOut").textContent = money(r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n) + " / month"; $("#fNote").textContent = `${money(P)} financed over ${n} months at ${rate}%.`;
}
["#fVehicle", "#fTerm", "#fDep", "#fRate"].forEach(s => $(s).addEventListener("input", calc));
$("#fTerm").addEventListener("change", calc); $("#fVehicle").addEventListener("change", calc);
const VCOLS = [["Vehicle", label], ["Fuel", "fuel"], ["Condition", "condition"], ["Range", v => v.range + " km"], ["Battery", v => v.soh + "%"], ["Price", v => money(v.price)]];
const DCOLS = [["Customer", "customer"], ["Vehicle", "vehicle"], ["Date", "date"], ["Time", "time"], ["Payment", "payment"]];
Qt.pick($("#tblV"), "tr[data-i]");
const shown = () => { const q = $("#flt").value.trim().toLowerCase(); return db.vehicles.map((v, i) => [v, i]).filter(([v]) => JSON.stringify(v).toLowerCase().includes(q)); };
function drawTables() {
  const rows = shown(); Qt.table($("#tblV"), VCOLS, rows.map(r => r[0]));
  $$("#tblV tr[data-i]").forEach((tr, k) => tr.dataset.i = rows[k][1]);
  Qt.table($("#tblD"), DCOLS, [...db.drives].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
}
$("#flt").addEventListener("input", drawTables);
function refresh() {
  const n = db.vehicles.length, booked = new Set(db.drives.map(d => d.vehicleId)), b = db.vehicles.filter(v => booked.has(v.id)).length;
  $("#stockNum").textContent = n; $("#bookedTxt").textContent = n ? `${b} of ${n} have a test drive booked` : "No stock yet";
  drawChart(); drawLog(); fillVehicles(); drawTables();
}
$("#remV").onclick = () => {
  const i = Qt.picked($("#tblV")); if (i < 0) return Qt.info("Nothing selected", "Select a vehicle in the table first.");
  Qt.ask("Remove vehicle", `Remove ${label(db.vehicles[i])} from stock?`, () => { const v = db.vehicles[i]; db.vehicles.splice(i, 1); db.drives = db.drives.filter(d => d.vehicleId !== v.id); logEvent("Vehicle removed: " + label(v)); save(); refresh(); });
};
$("#sample").onclick = () => {
  if (!db.vehicles.some(v => v.model === "Atto 3")) {
    const a = { id: uid(), make: "BYD", model: "Atto 3", year: 2024, colour: "Surf blue", fuel: "Electric", plug: "CCS2", condition: "New", range: 420, soh: 100, price: 559900, features: ["Fast DC charging", "Vehicle-to-load (V2L)"], notes: "" };
    db.vehicles.push(a,
      { id: uid(), make: "Volvo", model: "XC40 Recharge", year: 2023, colour: "Fjord blue", fuel: "Electric", plug: "CCS2", condition: "Demo", range: 440, soh: 96, price: 789000, features: ["Heat pump"], notes: "" },
      { id: uid(), make: "Nissan", model: "Leaf", year: 2019, colour: "Pearl white", fuel: "Electric", plug: "CHAdeMO", condition: "Used", range: 240, soh: 82, price: 259900, features: [], notes: "" });
    db.drives.push({ id: uid(), customer: "Kagiso Mahlangu", contact: "071 926 4408", vehicleId: a.id, vehicle: label(a), date: isoLocal(today), time: "10:30", payment: "Finance", extras: "Home charger quote" });
    logEvent("Sample data loaded");
  }
  save(); refresh(); Qt.status("Sample data loaded.");
};
$("#export").onclick = () => {
  Qt.save("amper_motors_report.txt", ["AMPER MOTORS — REPORT", "=".repeat(36), "", `Vehicles in stock: ${db.vehicles.length}`,
    ...db.vehicles.map(v => `  - ${label(v)}, ${v.fuel}, ${v.condition}, battery ${v.soh}%, ${money(v.price)}`), "", `Test drives booked: ${db.drives.length}`,
    ...db.drives.map(d => `  - ${d.customer}: ${d.vehicle} on ${d.date} at ${d.time} (${d.payment})`)].join("\n"));
  Qt.status("Report exported.");
};
$("#exitBtn").onclick = signOut;
syncV(); drawLog(); calc();
