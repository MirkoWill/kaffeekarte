/**
 * Kaffeekarte – digitale Stempelkarte, nur auf diesem Gerät gespeichert (localStorage).
 * ?kaffee=1 in der Adresse (z. B. über den gedruckten QR-Code) zählt einen Kaffee.
 */
(() => {
  "use strict";
  const KEY = "kaffeekarte.v1";
  const GUARD_MIN = 30;          // zweimal innerhalb von 30 Minuten = vermutlich doppelt gescannt
  const $ = (s) => document.querySelector(s);
  const CUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3"/></svg>';
  const GIFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0"/></svg>';

  const blank = () => ({ stamps: 0, size: 10, place: "", total: 0, free: 0, log: [] });
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); return d && typeof d === "object" ? Object.assign(blank(), d) : blank(); }
    catch (e) { return blank(); }
  }
  let data = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { toast("Speichern nicht möglich (privater Modus?)."); }
  }
  // Browser bitten, die Daten nicht automatisch zu löschen
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }

  const fmt = (t) => new Date(t).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  function render(newIndex) {
    const n = data.size;
    $("#place").textContent = data.place || "";
    $("#cups").innerHTML = Array.from({ length: n }, (_, i) => {
      const on = i < data.stamps;
      const gift = i === n - 1 && !on;
      return `<div class="cup${on ? " cup--on" : ""}${gift ? " cup--gift" : ""}${i === newIndex ? " cup--new" : ""}">${gift ? GIFT : CUP}</div>`;
    }).join("");
    const full = data.stamps >= n;
    const left = n - data.stamps;
    $("#status").textContent = full ? `${n} von ${n} – geschafft!` : `${data.stamps} von ${n} · noch ${left} bis zum Gratis-Kaffee`;
    $("#free").hidden = !full;
    $("#add").disabled = full;
    $("#add").textContent = full ? "Erst den Gratis-Kaffee einlösen" : "☕ Kaffee zählen";
    $("#undo").hidden = !data.log.length || data.log[0].type !== "coffee";
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    const thisMonth = data.log.filter((e) => e.type === "coffee" && e.t >= month.getTime()).length;
    $("#stats").innerHTML = `<div class="stat"><b>${data.total}</b><span>Kaffees gesamt</span></div>`
      + `<div class="stat"><b>${thisMonth}</b><span>diesen Monat</span></div>`
      + `<div class="stat"><b>${data.free}</b><span>gratis erhalten</span></div>`;
    $("#log").innerHTML = data.log.length ? data.log.slice(0, 60).map((e) =>
      `<li><span>${e.type === "free" ? "🎁 Gratis-Kaffee eingelöst" : "☕ Kaffee"}</span><span class="when">${fmt(e.t)}</span></li>`).join("")
      : "<li><span class=\"when\">Noch keine Einträge.</span></li>";
  }

  let toastTimer;
  function toast(msg, actionLabel, action) {
    const el = $("#toast");
    el.innerHTML = "";
    el.append(document.createTextNode(msg));
    if (actionLabel) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = actionLabel;
      b.addEventListener("click", () => { el.hidden = true; action(); });
      el.append(b);
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, actionLabel ? 8000 : 3500);
  }

  function addCoffee(force) {
    if (data.stamps >= data.size) { toast("Karte ist voll – erst den Gratis-Kaffee einlösen."); return; }
    const last = data.log.find((e) => e.type === "coffee");
    const mins = last ? (Date.now() - last.t) / 60000 : Infinity;
    if (!force && mins < GUARD_MIN) {
      toast(`Schon vor ${Math.max(1, Math.round(mins))} Min. gezählt.`, "Trotzdem zählen", () => addCoffee(true));
      return;
    }
    data.stamps++; data.total++;
    data.log.unshift({ t: Date.now(), type: "coffee" });
    data.log = data.log.slice(0, 500);
    save();
    render(data.stamps - 1);
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* egal */ }
    toast(data.stamps >= data.size ? "Voll! Der nächste Kaffee ist gratis 🎉" : "Kaffee gezählt ✓");
  }

  function undo() {
    if (!data.log.length || data.log[0].type !== "coffee" || data.stamps <= 0) return;
    data.log.shift(); data.stamps--; data.total = Math.max(0, data.total - 1);
    save(); render();
    toast("Zurückgenommen.");
  }

  function redeem() {
    data.stamps = 0; data.free++;
    data.log.unshift({ t: Date.now(), type: "free" });
    save(); render();
    toast("Guten Genuss! Neue Karte beginnt ☕");
  }

  // Einstellungen
  const sizeSel = $("#setSize");
  sizeSel.innerHTML = [5, 6, 8, 10, 12, 15, 20].map((n) => `<option value="${n}">${n}</option>`).join("");
  sizeSel.value = String(data.size);
  sizeSel.addEventListener("change", () => { data.size = Number(sizeSel.value); data.stamps = Math.min(data.stamps, data.size); save(); render(); });
  const placeIn = $("#setPlace");
  placeIn.value = data.place;
  placeIn.addEventListener("input", () => { data.place = placeIn.value.slice(0, 40); save(); render(); });

  $("#add").addEventListener("click", () => addCoffee(false));
  $("#undo").addEventListener("click", undo);
  $("#redeem").addEventListener("click", redeem);
  $("#reset").addEventListener("click", () => {
    if (!confirm("Wirklich alles löschen (Karte, Verlauf, Zähler)?")) return;
    data = blank(); save(); sizeSel.value = "10"; placeIn.value = ""; render(); toast("Zurückgesetzt.");
  });
  $("#backup").addEventListener("click", async () => {
    const text = `KAFFEEKARTE:${btoa(unescape(encodeURIComponent(JSON.stringify(data))))}`;
    try { await navigator.clipboard.writeText(text); toast("Sicherung kopiert – z. B. in eine Notiz einfügen."); }
    catch (e) { prompt("Sicherung (kopieren und aufbewahren):", text); }
  });
  $("#restore").addEventListener("click", () => {
    const text = (prompt("Sicherung hier einfügen:") || "").trim();
    if (!text) return;
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob(text.replace(/^KAFFEEKARTE:/, "")))));
      if (typeof d.stamps !== "number" || !Array.isArray(d.log)) throw new Error("ungültig");
      data = Object.assign(blank(), d); save(); sizeSel.value = String(data.size); placeIn.value = data.place; render();
      toast("Sicherung wiederhergestellt ✓");
    } catch (e) { toast("Das ist keine gültige Sicherung."); }
  });

  render();

  // Gescannter QR-Code: ?kaffee=1 → zählen und Adresse bereinigen (Neuladen zählt nicht doppelt)
  const params = new URLSearchParams(location.search);
  if (params.has("kaffee")) {
    history.replaceState(null, "", location.pathname);
    addCoffee(false);
  }

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
