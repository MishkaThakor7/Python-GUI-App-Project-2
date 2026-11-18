// Demo login. Change before real use. (This check runs in the browser, so it is not real security.)
const USERNAME = "demo", PASSWORD = "heritage123";
const KEY = "stonecroft_qt_v1", TITLES = ["Login", "Property Register", "Tenant Bookings", "Dashboards & Reports"];
let db = { properties: [], bookings: [] };
try { const s = localStorage.getItem(KEY); if (s) db = { ...db, ...JSON.parse(s) }; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };

/* logo, shown as a QLabel pixmap */
const LOGO = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="var(--base)" stroke="var(--hl)" stroke-width="3"/><circle cx="50" cy="50" r="41" fill="none" stroke="var(--hl)" stroke-width=".8"/><path d="M29 68V46c0-7 5-6 8-12 3-7 9-9 13-14 4 5 10 7 13 14 3 6 8 5 8 12v22z" fill="var(--hl)"/><circle cx="50" cy="31" r="2.6" fill="#c08a2e"/><path d="M45 68V58c0-6 10-6 10 0v10z" fill="var(--base)"/><rect x="33" y="52" width="6" height="8" rx="1" fill="var(--base)"/><rect x="61" y="52" width="6" height="8" rx="1" fill="var(--base)"/><rect x="25" y="68" width="50" height="2.5" fill="var(--hl)"/></svg>`;
$$(".logo").forEach(e => e.innerHTML = LOGO);

/* window: pages, menus */
const go = Qt.stack(n => { $("#wt").textContent = "Stonecroft Heritage Lettings — " + TITLES[n]; if (n === 3) refresh(); });
const signOut = () => { Qt.logged = false; go(0); Qt.status("Signed out."); };
Qt.menus({ signout: signOut, exit: signOut, palette: Qt.palette,
  about: () => Qt.info("About Stonecroft Heritage Lettings", "A four-page administration demo built only from Qt Designer widgets: QStackedWidget, QCalendarWidget, QDateTimeEdit, QDial, QLCDNumber, QProgressBar, QListWidget, QTableWidget and more. Hover any widget to see its class in the status bar.") });

/* page 0: login */
$("#loginBtn").onclick = () => {
  if ($("#user").value.trim().toLowerCase() === USERNAME && $("#pass").value === PASSWORD) {
    Qt.logged = true; $("#user").value = $("#pass").value = "";
    Qt.info("Login Successful", "Welcome back! Login successful.", () => go(1));
  } else { $("#pass").value = ""; Qt.warn("Login Failed", "Incorrect username or password. Please try again."); }
};
$("#cancelBtn").onclick = () => { $("#user").value = $("#pass").value = ""; };
$("#pass").addEventListener("keydown", e => { if (e.key === "Enter") $("#loginBtn").click(); });

/* page 1: property register */
$$("[data-spin]").forEach(Qt.spin);
const today = new Date(); today.setHours(0, 0, 0, 0);
const cal = Qt.calendar($("#pCal"), { min: today, onChange: d => Qt.status("Available from: " + fmtD(d), 4000) });
let features = ["Yellowwood floors", "Thatch roof", "Sash windows"];
const drawFeatures = () => $("#fList").innerHTML = features.map((f, i) => `<li data-i="${i}">${esc(f)}</li>`).join("");
Qt.pick($("#fList"), "li"); drawFeatures();
$("#fAdd").onclick = () => {
  const f = $("#fIn").value.trim();
  if (!f) return Qt.info("No Feature Entered", "Type a heritage feature (e.g. Yellowwood floors) before adding it.");
  features.push(f); $("#fIn").value = ""; drawFeatures();
};
$("#fIn").addEventListener("keydown", e => { if (e.key === "Enter") $("#fAdd").click(); });
$("#fDel").onclick = () => { const i = Qt.picked($("#fList")); if (i < 0) return Qt.info("Nothing selected", "Select a feature in the list first."); features.splice(i, 1); drawFeatures(); };
function clearP() {
  ["#pName", "#pAddr", "#pDesc", "#fIn"].forEach(s => $(s).value = ""); $("#pGrade").selectedIndex = $("#pStyle").selectedIndex = $("#pPermit").selectedIndex = 0;
  Qt.setVal($("#pRent"), 0); features = []; drawFeatures(); cal.set(today);
}
$("#clearP").onclick = clearP;
$("#saveP").onclick = () => {
  const name = $("#pName").value.trim(), address = $("#pAddr").value.trim();
  if (!name || !address) return Qt.warn("Missing Information", "Please enter at least a property name and address before saving.");
  db.properties.push({ id: uid(), name, address, grade: $("#pGrade").value, style: $("#pStyle").value, permit: $("#pPermit").value, rent: Qt.val($("#pRent")),
    available: isoLocal(cal.get()), description: $("#pDesc").value.trim(), features: [...features] });
  save(); clearP(); Qt.info("Property Saved", `“${name}” has been added to the register.`);
};

/* page 2: tenant bookings */
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
Qt.dte($("#tWhen"), { fmt: "dd/MM/yyyy HH:mm", init: tomorrow, min: new Date(), step: 15 });
$("#bookT").onclick = () => {
  const tenant = $("#tName").value.trim(), contact = $("#tContact").value.trim();
  if (!tenant || !contact) return Qt.warn("Missing Information", "Please enter at least a tenant name and contact detail before booking.");
  const when = Qt.dateOf($("#tWhen"));
  db.bookings.push({ id: uid(), tenant, contact, viewing: `${isoLocal(when)} ${p2(when.getHours())}:${p2(when.getMinutes())}`, occupants: Qt.val($("#tOcc")),
    urgency: $("input[name=urg]:checked").value, amenities: $$("#amen input:checked").map(c => c.value).join(", ") || "None specified" });
  save(); $("#tName").value = $("#tContact").value = ""; Qt.setVal($("#tOcc"), 1); $("input[name=urg][value='Within 1 Month']").checked = true; $$("#amen input").forEach(c => c.checked = false);
  Qt.info("Viewing Booked", `Viewing booked for ${tenant}.`);
};

/* page 3: dashboard */
const dial = Qt.dial($("#dial"), { min: 0, max: 15, value: 8, onChange: v => $("#escLbl").textContent = `Escalation Value: ${v}%` });
Qt.pick($("#tbl"), "tr[data-i]");
const COLS = [["Name", "name"], ["Address", "address"], ["Grade", "grade"], ["S34 permit", "permit"], ["Rent", r => money(r.rent)]];
function refresh() {
  const n = db.properties.length, pct = n ? Math.min(100, Math.round(db.bookings.length / n * 100)) : 0;
  Qt.lcd($("#lcdCount"), String(n).padStart(3, "0")); Qt.progress($("#prog"), pct, `${pct}% occupied`); Qt.table($("#tbl"), COLS, db.properties);
}
const tick = () => Qt.lcd($("#lcdClock"), new Date().toTimeString().slice(0, 8));
tick(); setInterval(tick, 1000); refresh();
$("#remP").onclick = () => {
  const i = Qt.picked($("#tbl")); if (i < 0) return Qt.info("Nothing selected", "Select a property in the table first.");
  Qt.ask("Remove property", `Remove “${db.properties[i].name}” from the register?`, () => { db.properties.splice(i, 1); save(); refresh(); Qt.status("Property removed."); });
};
$("#sample").onclick = () => {
  if (!db.properties.some(p => p.name === "Doornbosch Werf House")) {
    db.properties.push(
      { id: uid(), name: "Doornbosch Werf House", address: "22 Dorp Street, Stellenbosch", grade: "Grade I", style: "Cape Dutch", permit: "Approved", rent: 24750, available: isoLocal(today), description: "", features: ["Reed ceiling"] },
      { id: uid(), name: "The Tanner’s Row House", address: "9 Bree Street, Makhanda", grade: "Grade IIB", style: "Edwardian", permit: "Applied for", rent: 11300, available: isoLocal(today), description: "", features: ["Cast-iron balcony"] });
    db.bookings.push({ id: uid(), tenant: "Kagiso Mahlangu", contact: "071 926 4408", viewing: isoLocal(today) + " 10:00", occupants: 2, urgency: "Within 3 Months", amenities: "Garden, Furnished" });
  }
  save(); refresh(); Qt.status("Sample data loaded.");
};
$("#export").onclick = () => {
  Qt.save("stonecroft_report.txt", ["STONECROFT HERITAGE LETTINGS — REPORT", "=".repeat(40), "", `Properties registered: ${db.properties.length}`,
    ...db.properties.map(p => `  - ${p.name} (${p.address}), ${p.grade}, S34 ${p.permit}, ${money(p.rent)}`), "", `Viewings booked: ${db.bookings.length}`,
    ...db.bookings.map(b => `  - ${b.tenant} on ${b.viewing} (${b.urgency})`), "", `Projected rent escalation: ${dial.get()}%`].join("\n"));
  Qt.status("Report exported.");
};
$("#exitBtn").onclick = signOut;
