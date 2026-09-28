/**
 * Kaffeekarte · Theke – die Verkäuferin scannt die Kundenkarte, die App zählt den Kaffee.
 * Mehrere Kunden, alles nur auf diesem Gerät (siehe store.js).
 */
(() => {
  "use strict";
  const GUARD_MIN = 30;          // derselbe Kunde zweimal innerhalb von 30 Minuten = vermutlich doppelt gescannt
  const BACKUP_DAYS = 7;         // nach so vielen Tagen an die Sicherung erinnern
  const $ = (s) => document.querySelector(s);
  const { esc, label } = Store;
  const CUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3"/></svg>';
  const GIFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0"/></svg>';

  let data = Store.load();
  let current = null;            // geöffneter Kunde (id)
  function save() { if (!Store.save(data)) toast("Speichern nicht möglich (privater Modus?)."); }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }

  const byId = (id) => data.customers.find((c) => c.id === id);
  const fmt = (t) => new Date(t).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const startOf = (unit) => { const d = new Date(); if (unit === "month") d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const count = (type, since, id) => data.log.filter((e) => e.type === type && e.t >= since && (!id || e.c === id)).length;

  // ---------- Übersicht ----------
  function render() {
    $("#stats").innerHTML = `<div class="stat"><b>${count("coffee", startOf("day"))}</b><span>Kaffees heute</span></div>`
      + `<div class="stat"><b>${count("coffee", startOf("month"))}</b><span>diesen Monat</span></div>`
      + `<div class="stat"><b>${count("free", startOf("month"))}</b><span>gratis diesen Monat</span></div>`;
    const q = $("#search").value.trim().toLowerCase().replace(/^nr\.?\s*/, "");
    const list = data.customers.filter((c) => !q || label(c).toLowerCase().includes(q) || String(c.no) === q || c.id.toLowerCase().includes(q))
      .sort((a, b) => a.no - b.no);
    $("#clist").innerHTML = list.length ? list.map((c) => {
      const full = c.stamps >= data.size;
      const pct = Math.min(100, Math.round((c.stamps / data.size) * 100));
      return `<li><button type="button" data-id="${c.id}">`
        + `<span class="cname">${esc(label(c))}${full ? ' <span class="badge">🎁 gratis fällig</span>' : ""}</span>`
        + `<span class="cmeta">Nr. ${c.no} · ${Math.min(c.stamps, data.size)} von ${data.size}</span>`
        + `<span class="bar"><i data-pct="${pct}"></i></span></button></li>`;
    }).join("") : `<li class="empty">${data.customers.length ? "Kein Kunde gefunden." : "Noch keine Kunden – einfach eine neue Karte scannen, sie wird dann angelegt."}</li>`;
    // Breite per Skript setzen – die CSP erlaubt kein style="…" im HTML
    document.querySelectorAll("#clist .bar i").forEach((i) => { i.style.width = `${i.dataset.pct}%`; });
    const due = data.customers.length && data.log.length && Date.now() - data.lastBackup > BACKUP_DAYS * 864e5;
    const hint = $("#backupHint");
    hint.hidden = !due;
    if (due) {
      hint.innerHTML = "";
      hint.append(document.createTextNode(data.lastBackup ? `Letzte Sicherung vor ${Math.floor((Date.now() - data.lastBackup) / 864e5)} Tagen. ` : "Noch keine Sicherung gespeichert. "));
      const b = document.createElement("button");
      b.type = "button"; b.textContent = "Jetzt sichern"; b.addEventListener("click", exportData);
      hint.append(b);
    }
    if (current) renderDetail();
  }

  // ---------- Kunde ----------
  function openCustomer(id, newIndex) {
    current = id;
    $("#detail").hidden = false;
    document.body.classList.add("noscroll");
    $("#dRename").value = byId(id).name;
    renderDetail(newIndex);
    $("#detail").scrollTop = 0;
  }
  function closeCustomer() {
    current = null;
    $("#detail").hidden = true;
    document.body.classList.remove("noscroll");
    render();
  }
  function renderDetail(newIndex) {
    const c = byId(current);
    if (!c) { closeCustomer(); return; }
    const n = data.size, full = c.stamps >= n;
    $("#dName").textContent = label(c);
    $("#dNo").textContent = `Nr. ${c.no} · Code ${c.id}`;
    $("#dCups").innerHTML = Array.from({ length: n }, (_, i) => {
      const on = i < c.stamps, gift = i === n - 1 && !on;
      return `<div class="cup${on ? " cup--on" : ""}${gift ? " cup--gift" : ""}${i === newIndex ? " cup--new" : ""}">${gift ? GIFT : CUP}</div>`;
    }).join("");
    $("#dStatus").textContent = full ? `${n} von ${n} – der nächste Kaffee ist gratis!` : `${c.stamps} von ${n} · noch ${n - c.stamps} bis zum Gratis-Kaffee`;
    $("#dFree").hidden = !full;
    $("#dAdd").disabled = full;
    $("#dAdd").textContent = full ? "Erst den Gratis-Kaffee ausgeben" : "☕ Kaffee zählen";
    const last = data.log.find((e) => e.c === c.id);
    $("#dUndo").hidden = !last || last.type !== "coffee" || c.stamps <= 0;
    $("#dStats").innerHTML = `<div class="stat"><b>${c.total}</b><span>Kaffees gesamt</span></div>`
      + `<div class="stat"><b>${count("coffee", startOf("month"), c.id)}</b><span>diesen Monat</span></div>`
      + `<div class="stat"><b>${c.free}</b><span>gratis erhalten</span></div>`;
    const mine = data.log.filter((e) => e.c === c.id).slice(0, 60);
    $("#dLog").innerHTML = mine.length ? mine.map((e) =>
      `<li><span>${e.type === "free" ? "🎁 Gratis-Kaffee" : "☕ Kaffee"}</span><span class="when">${fmt(e.t)}</span></li>`).join("")
      : '<li><span class="when">Noch keine Einträge.</span></li>';
    $("#dPrint").href = `karten.html?id=${encodeURIComponent(c.id)}`;
  }

  function addCoffee(id, force) {
    const c = byId(id);
    if (!c) return;
    if (c.stamps >= data.size) { toast("Karte ist voll – erst den Gratis-Kaffee ausgeben."); return; }
    const last = data.log.find((e) => e.c === id && e.type === "coffee");
    const mins = last ? (Date.now() - last.t) / 60000 : Infinity;
    if (!force && mins < GUARD_MIN) {
      toast(`${label(c)}: schon vor ${Math.max(1, Math.round(mins))} Min. gezählt.`, "Trotzdem zählen", () => addCoffee(id, true));
      return;
    }
    c.stamps++; c.total++;
    data.log.unshift({ t: Date.now(), c: id, type: "coffee" });
    data.log = data.log.slice(0, 20000);
    save();
    if (current === id) renderDetail(c.stamps - 1);
    render();
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* egal */ }
    toast(c.stamps >= data.size ? `${label(c)}: voll! Der nächste Kaffee ist gratis 🎉` : `${label(c)}: Kaffee gezählt ✓ (${c.stamps} von ${data.size})`);
  }

  function undo() {
    const c = byId(current);
    const i = data.log.findIndex((e) => e.c === current);
    if (!c || i < 0 || data.log[i].type !== "coffee" || c.stamps <= 0) return;
    data.log.splice(i, 1); c.stamps--; c.total = Math.max(0, c.total - 1);
    save(); render();
    toast("Zurückgenommen.");
  }

  function redeem() {
    const c = byId(current);
    if (!c || c.stamps < data.size) return;
    c.stamps -= data.size; c.free++;
    data.log.unshift({ t: Date.now(), c: c.id, type: "free" });
    save(); render();
    toast(`${label(c)}: Gratis-Kaffee ausgegeben – neue Karte beginnt ☕`);
  }

  // ---------- Scanner ----------
  let stream = null, scanning = false, detector = null, lastMiss = 0;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  async function startScan() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("Kamera wird von diesem Browser nicht unterstützt – Kunden in der Liste antippen.");
      return;
    }
    $("#scanMsg").textContent = "Kundenkarte vor die Kamera halten …";
    $("#scanner").hidden = false;
    document.body.classList.add("noscroll");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    } catch (e) {
      stopScan();
      toast("Kein Zugriff auf die Kamera. Bitte in den Browser-Einstellungen erlauben.");
      return;
    }
    if ($("#scanner").hidden) { stopScan(); return; }   // inzwischen abgebrochen
    const video = $("#video");
    video.srcObject = stream;
    try { await video.play(); } catch (e) { /* startet trotzdem */ }
    try {
      if ("BarcodeDetector" in window && (await BarcodeDetector.getSupportedFormats()).includes("qr_code")) {
        detector = new BarcodeDetector({ formats: ["qr_code"] });
      }
    } catch (e) { detector = null; }
    scanning = true;
    requestAnimationFrame(tick);
  }

  function stopScan() {
    scanning = false;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    $("#video").srcObject = null;
    $("#scanner").hidden = true;
    if (!current) document.body.classList.remove("noscroll");
  }

  async function tick() {
    if (!scanning) return;
    const video = $("#video");
    let text = null;
    if (video.readyState >= 2 && video.videoWidth) {
      try {
        if (detector) {
          const codes = await detector.detect(video);
          if (codes.length) text = codes[0].rawValue;
        } else {
          const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const r = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (r) text = r.data;
        }
      } catch (e) { /* nächster Versuch */ }
    }
    if (text !== null && scanning) {
      if (handleScan(text)) return;
    }
    requestAnimationFrame(tick);
  }

  // true = erledigt (Scanner schließen), false = weiter scannen
  function handleScan(text) {
    const id = Store.parse(text);
    if (!id) {
      if (Date.now() - lastMiss > 1500) { lastMiss = Date.now(); $("#scanMsg").textContent = "Das ist keine Kundenkarte."; }
      return false;
    }
    stopScan();
    const c = byId(id);
    if (!c) { registerCard(id); return true; }
    openCustomer(c.id);
    addCoffee(c.id, false);
    return true;
  }

  // Neue Karte vom Vorrat: beim ersten Scan anlegen und gleich den ersten Kaffee zählen
  function registerCard(id) {
    const name = prompt(`Neue Kundenkarte (Code ${id}).\nName oder Spitzname (freiwillig) – „OK“ legt die Karte an und zählt den ersten Kaffee:`);
    if (name === null) return;
    const c = Store.addCustomer(data, name, id);
    save();
    openCustomer(c.id);
    addCoffee(c.id, true);
  }

  // ---------- Sicherung ----------
  // Auf dem Handy über „Teilen“ (WhatsApp, Mail …) verschicken, sonst als Datei herunterladen
  async function exportData() {
    const name = `kaffeekarte-theke-${new Date().toISOString().slice(0, 10)}.json`;
    const json = JSON.stringify(data, null, 1);
    const done = (msg) => { data.lastBackup = Date.now(); save(); render(); toast(msg); };
    try {
      const file = new File([json], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Kaffeekarte – Sicherung", text: `Sicherung der Kaffeekarte vom ${new Date().toLocaleDateString("de-DE")}` });
        done("Sicherung verschickt ✓");
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;   // Teilen abgebrochen
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    done("Sicherung gespeichert – die Datei gut aufbewahren (z. B. per Mail verschicken).");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = Store.sanitize(JSON.parse(reader.result));
        if (!d.customers.length) throw new Error("leer");
        if (!confirm(`Sicherung mit ${d.customers.length} Kunden laden? Der jetzige Stand auf diesem Gerät wird ersetzt.`)) return;
        data = d; save(); syncSettings(); render();
        toast("Sicherung geladen ✓");
      } catch (e) { toast("Das ist keine gültige Sicherungsdatei."); }
    };
    reader.readAsText(file);
  }

  // ---------- Einstellungen ----------
  const sizeSel = $("#setSize");
  sizeSel.innerHTML = Store.SIZES.map((n) => `<option value="${n}">${n}</option>`).join("");
  function syncSettings() { sizeSel.value = String(data.size); }
  syncSettings();
  sizeSel.addEventListener("change", () => { data.size = Number(sizeSel.value); save(); render(); });

  // ---------- Hinweis-Leiste ----------
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

  // ---------- Ereignisse ----------
  $("#scan").addEventListener("click", startScan);
  $("#scanClose").addEventListener("click", stopScan);
  $("#search").addEventListener("input", render);
  $("#clist").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (b) openCustomer(b.dataset.id);
  });
  $("#addCust").addEventListener("click", () => {
    const name = prompt("Name oder Spitzname des Kunden (freiwillig, kann leer bleiben):");
    if (name === null) return;
    const c = Store.addCustomer(data, name);
    save(); render(); openCustomer(c.id);
    toast(`${label(c)} angelegt – jetzt die Karte drucken.`);
  });
  $("#dClose").addEventListener("click", closeCustomer);
  $("#dAdd").addEventListener("click", () => addCoffee(current, false));
  $("#dUndo").addEventListener("click", undo);
  $("#dRedeem").addEventListener("click", redeem);
  $("#dRename").addEventListener("input", () => {
    const c = byId(current);
    if (c) { c.name = $("#dRename").value.slice(0, 30).trim(); save(); renderDetail(); }
  });
  $("#dDelete").addEventListener("click", () => {
    const c = byId(current);
    if (!c || !confirm(`${label(c)} wirklich löschen? Die Karte funktioniert danach nicht mehr.`)) return;
    data.customers = data.customers.filter((x) => x.id !== c.id);
    data.log = data.log.filter((e) => e.c !== c.id);
    save(); closeCustomer(); toast("Kunde gelöscht.");
  });
  $("#export").addEventListener("click", exportData);
  $("#import").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ""; });
  $("#reset").addEventListener("click", () => {
    if (!confirm("Wirklich ALLES löschen – alle Kunden, Stempel und den Verlauf? Die gedruckten Karten funktionieren danach nicht mehr.")) return;
    if (!confirm("Ganz sicher? Das lässt sich nur mit einer Sicherungsdatei rückgängig machen.")) return;
    localStorage.removeItem(Store.KEY);
    data = Store.load(); syncSettings(); render(); toast("Zurückgesetzt.");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#scanner").hidden) stopScan(); else if (current) closeCustomer();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && scanning) stopScan(); });

  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});
})();
