(() => {
  "use strict";
  const { esc, label } = Store;
  const data = Store.load();
  const only = new URLSearchParams(location.search).get("id");
  const list = data.customers.filter((c) => !only || c.id === only).sort((a, b) => a.no - b.no);

  function qrSvg(text, mm) {
    const qr = qrcode(0, "M"); qr.addData(text); qr.make();
    const n = qr.getModuleCount(), q = 2, t = n + 2 * q;
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${mm}mm" height="${mm}mm" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  if (only && list.length === 1) document.getElementById("title").textContent = `Karte drucken: ${label(list[0])}`;
  document.getElementById("sheet").innerHTML = list.length ? list.map((c) =>
    `<div class="kcard">${qrSvg(Store.payload(c), 40)}<div class="ktext">`
    + '<span class="ktitle">☕ Kaffeekarte</span>'
    + (data.place ? `<span class="kplace">${esc(data.place)}</span>` : "")
    + `<span class="kname">${c.name ? esc(c.name) : "Nr. " + c.no}</span>`
    + `<span>${c.name ? `Nr. ${c.no} · ` : ""}<span class="kcode">${c.id}</span></span>`
    + `<span class="krule">Bei jedem Kaffee vorzeigen –<br>nach ${data.size} Kaffees ist der nächste gratis.</span>`
    + "</div></div>").join("")
    : '<p class="wrap">Keine Kunden angelegt.</p>';
  document.getElementById("print").addEventListener("click", () => window.print());
})();
