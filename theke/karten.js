(() => {
  "use strict";
  const { esc, label } = Store;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const vorrat = params.has("vorrat");       // neue, noch keinem Kunden zugeordnete Karten
  const only = params.get("id");

  function qrSvg(text, mm) {
    const qr = qrcode(0, "M"); qr.addData(text); qr.make();
    const n = qr.getModuleCount(), q = 2, t = n + 2 * q;
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${mm}mm" height="${mm}mm" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  // who: Name/Nummer-Zeile(n) als HTML
  const card = (c, size, who) =>
    `<div class="kcard">${qrSvg(Store.payload(c), 40)}<div class="ktext">`
    + '<span class="ktitle">☕ Kaffeekarte</span>'
    + who
    + `<span class="krule">Bei jedem Kaffee vorzeigen –<br>nach ${size} Kaffees ist der nächste gratis.</span>`
    + "</div></div>";

  if (vorrat) {
    const size = Store.load().size;
    $("#title").textContent = "Neue Karten auf Vorrat drucken";
    $("#intro").textContent = "Diese Karten gehören noch keinem Kunden. Beim ersten Scan an der Theke wird die Karte "
      + "angelegt – der Name kann dann eingegeben oder mit Stift auf die Karte geschrieben werden. "
      + "Die Karten lassen sich auf jedem Gerät drucken, auch am PC.";
    $("#vorratCtl").hidden = false;
    const render = () => {
      // Jedes Mal neue Codes – gedruckt wird, was gerade zu sehen ist
      $("#sheet").innerHTML = Array.from({ length: Number($("#vCount").value) }, () => {
        const id = Store.randomCode();
        return card({ id }, size, '<span class="kname kline">Name:</span>'
          + `<span>Code <span class="kcode">${id}</span></span>`);
      }).join("");
    };
    $("#vCount").addEventListener("change", render);
    render();
  } else {
    const data = Store.load();
    const list = data.customers.filter((c) => !only || c.id === only).sort((a, b) => a.no - b.no);
    if (only && list.length === 1) $("#title").textContent = `Karte drucken: ${label(list[0])}`;
    $("#sheet").innerHTML = list.length ? list.map((c) => card(c, data.size,
      `<span class="kname">${c.name ? esc(c.name) : "Nr. " + c.no}</span>`
      + `<span>${c.name ? `Nr. ${c.no} · ` : ""}<span class="kcode">${c.id}</span></span>`)).join("")
      : '<p class="wrap">Noch keine Kunden angelegt. Neue Karten gibt es unter <a href="karten.html?vorrat=1">„Karten auf Vorrat drucken“</a>.</p>';
  }
  $("#print").addEventListener("click", () => window.print());
})();
