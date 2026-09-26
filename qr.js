(() => {
  const url = new URL("./?kaffee=1", location.href).href;
  const qr = qrcode(0, "M"); qr.addData(url); qr.make();
  const n = qr.getModuleCount(), q = 2, t = n + 2 * q;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  const svg = (mm) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${mm}mm" height="${mm}mm" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  let place = "";
  try { place = (JSON.parse(localStorage.getItem("kaffeekarte.v1") || "null") || {}).place || ""; } catch (e) { /* egal */ }
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  // Große Karte für die Theke, dazu zwei kleine als Ersatz
  const big = `<div class="tag tag--big"><b>☕ Kaffeekarte</b>${place ? `<span>${esc(place)}</span>` : ""}${svg(60)}`
    + "<small>Bitte zum Scannen hinhalten – danke!</small></div>";
  const spare = `<div class="tag">${svg(30)}<small>☕ Kaffee zählen</small></div>`;
  document.getElementById("sheet").innerHTML = big + spare + spare;
  document.getElementById("print").addEventListener("click", () => window.print());
})();
