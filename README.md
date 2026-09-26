# Kaffeekarte ☕

Digitale Stempelkarte fürs eigene Handy: 10 Kaffees, einer gratis.

- **Kaffee zählen:** QR-Code ausdrucken und der Verkäuferin geben; beim Kauf hält sie ihn hin, man scannt ihn
  mit der Handy-Kamera (`?kaffee=1`) und der Kaffee ist gezählt. Alternativ der große Knopf in der App.
- **Doppelt gescannt?** Innerhalb von 30 Minuten wird nachgefragt; der letzte Kaffee lässt sich zurücknehmen.
- **Voll:** „Gratis-Kaffee eingelöst“ tippen – die nächste Karte beginnt.
- **Einstellungen:** Name des Bäckers, Anzahl Felder (5–20), QR-Code drucken, Sicherung kopieren/einfügen.
- Alles bleibt **nur auf dem Handy** (localStorage) – kein Server, kein Konto. Funktioniert offline und lässt sich
  über „Zum Startbildschirm hinzufügen“ als App installieren.

Veröffentlicht über GitHub Pages: https://mirkowill.github.io/kaffeekarte/

Neue Version: Dateien ändern, in `index.html`/`sw.js` die `?v=` bzw. `CACHE` hochzählen.
QR-Code-Erzeugung: qrcode-generator von Kazuhiko Arase (MIT-Lizenz).
