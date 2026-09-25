# Kaffeekarte ☕

Digitale Stempelkarte fürs eigene Handy: 10 Kaffees, einer gratis.

- **Kaffee zählen:** großer Knopf oder den gedruckten QR-Code mit der Handy-Kamera scannen (`?kaffee=1`).
- **Doppelt gescannt?** Innerhalb von 30 Minuten wird nachgefragt; der letzte Kaffee lässt sich zurücknehmen.
- **Voll:** „Gratis-Kaffee eingelöst“ tippen – die nächste Karte beginnt.
- **Einstellungen:** Name des Bäckers, Anzahl Felder (5–20), QR-Code drucken, Sicherung kopieren/einfügen.
- Alles bleibt **nur auf dem Handy** (localStorage) – kein Server, kein Konto. Funktioniert offline und lässt sich
  über „Zum Startbildschirm hinzufügen“ als App installieren.

Veröffentlicht über GitHub Pages: https://mirkowill.github.io/kaffeekarte/

Neue Version: Dateien ändern, in `index.html`/`sw.js` die `?v=` bzw. `CACHE` hochzählen.
QR-Code-Erzeugung: qrcode-generator von Kazuhiko Arase (MIT-Lizenz).
