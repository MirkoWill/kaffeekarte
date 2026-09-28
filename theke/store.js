/**
 * Datenhaltung der Theken-Version – nur auf diesem Gerät (localStorage).
 * Wird von theke.js und karten.js gemeinsam genutzt.
 */
window.Store = (() => {
  "use strict";
  const KEY = "kaffeekarte.theke.v1";
  const QR_PREFIX = "KAFFEEKARTE-KUNDE:";   // Inhalt der Kundenkarte: KAFFEEKARTE-KUNDE:<Code>
  const START_CUSTOMERS = 5;                // so viele Karten sind beim ersten Start schon angelegt
  const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // ohne 0/O, 1/I/L – gut abzulesen
  const SIZES = [5, 6, 8, 10, 12, 15, 20];

  const blank = () => ({ size: 10, place: "", nextNo: 1, customers: [], log: [], seeded: false, lastBackup: 0 });
  const int = (v, min, max, def) => (Number.isInteger(v) && v >= min && v <= max ? v : def);
  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

  // Gespeicherte oder importierte Daten prüfen und in eine saubere Form bringen
  function sanitize(d) {
    if (!d || typeof d !== "object") throw new Error("ungültig");
    const out = blank();
    out.size = SIZES.includes(d.size) ? d.size : 10;
    out.place = str(d.place, 40);
    out.seeded = d.seeded === true;
    out.lastBackup = int(d.lastBackup, 0, 8.64e15, 0);
    const seen = new Set();
    out.customers = (Array.isArray(d.customers) ? d.customers : []).filter((c) =>
      c && typeof c.id === "string" && /^[A-Z0-9]{4,12}$/.test(c.id) && !seen.has(c.id) && seen.add(c.id)
    ).map((c) => ({
      id: c.id, no: int(c.no, 1, 1e6, 0), name: str(c.name, 30),
      stamps: int(c.stamps, 0, 1000, 0), total: int(c.total, 0, 1e7, 0), free: int(c.free, 0, 1e7, 0),
    }));
    out.customers.forEach((c) => { if (!c.no) c.no = Math.max(0, ...out.customers.map((x) => x.no)) + 1; });
    out.nextNo = Math.max(int(d.nextNo, 1, 1e6, 1), ...out.customers.map((c) => c.no + 1));
    out.log = (Array.isArray(d.log) ? d.log : []).filter((e) =>
      e && seen.has(e.c) && (e.type === "coffee" || e.type === "free") && int(e.t, 0, 8.64e15, -1) >= 0
    ).map((e) => ({ t: e.t, c: e.c, type: e.type })).slice(0, 20000);
    return out;
  }

  function load() {
    let d;
    try { d = sanitize(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { d = blank(); }
    if (!d.seeded) {
      for (let i = 0; i < START_CUSTOMERS; i++) addCustomer(d, "");
      d.seeded = true;
      save(d);
    }
    return d;
  }

  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; }
  }

  function newCode(d) {
    const rnd = new Uint32Array(6);
    for (;;) {
      crypto.getRandomValues(rnd);
      const code = Array.from(rnd, (n) => ALPHABET[n % ALPHABET.length]).join("");
      if (!d.customers.some((c) => c.id === code)) return code;
    }
  }

  function addCustomer(d, name) {
    const c = { id: newCode(d), no: d.nextNo++, name: str(name, 30).trim(), stamps: 0, total: 0, free: 0 };
    d.customers.push(c);
    return c;
  }

  const label = (c) => c.name || `Kunde Nr. ${c.no}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const payload = (c) => QR_PREFIX + c.id;
  // Gelesenen QR-Inhalt in einen Kunden-Code übersetzen (oder null, wenn es keine Kundenkarte ist)
  function parse(text) {
    const m = /^KAFFEEKARTE-KUNDE:([A-Z0-9]{4,12})$/.exec(String(text).trim().toUpperCase());
    return m ? m[1] : null;
  }

  return { KEY, SIZES, blank, sanitize, load, save, addCustomer, label, esc, payload, parse };
})();
