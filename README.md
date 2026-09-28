# Kaffeekarte ☕

Digitale Stempelkarte fürs eigene Handy: 10 Kaffees, einer gratis.

- **Kaffee zählen:** QR-Code ausdrucken und der Verkäuferin geben; beim Kauf hält sie ihn hin, man scannt ihn
  mit der Handy-Kamera (`?kaffee=1`) und der Kaffee ist gezählt. Alternativ der große Knopf in der App.
- **Doppelt gescannt?** Innerhalb von 30 Minuten wird nachgefragt; der letzte Kaffee lässt sich zurücknehmen.
- **Voll:** „Gratis-Kaffee eingelöst“ tippen – die nächste Karte beginnt.
- **Einstellungen:** Name des Bäckers, Anzahl Felder (5–20), QR-Code drucken, Sicherung kopieren/einfügen.
- Alles bleibt **nur auf dem Handy** (localStorage) – kein Server, kein Konto. Funktioniert offline und lässt sich
  über „Zum Startbildschirm hinzufügen“ als App installieren.

## Theken-Version (`/theke/`)

Für den Bäcker: Die App läuft auf dem Handy/Tablet der Verkäuferin, jeder Kunde bekommt eine gedruckte Karte
mit eigenem QR-Code (Inhalt `KAFFEEKARTE-KUNDE:<Code>`).

- **Scannen:** „Kundenkarte scannen“ öffnet die Kamera; erkannte Karte → Kaffee wird sofort gezählt, der Kunde
  wird angezeigt (Zurücknehmen möglich, Doppelscan-Schutz 30 Min.). Ohne Kamera: Kunden in der Liste antippen.
- **Karten auf Vorrat:** `karten.html?vorrat=1` druckt Karten mit Zufallscodes (Standard: 10 Stück, eine A4-Seite)
  – auf jedem Gerät, auch am PC.
  Eine unbekannte Karte wird beim ersten Scan an der Theke angelegt (Name freiwillig) und zählt den ersten Kaffee.
- **Kunden:** Liste mit Suche; zusätzlich „＋ Kunde“ direkt an der Theke. Karten vorhandener Kunden lassen sich neu
  drucken (`karten.html`, einzeln `karten.html?id=<Code>`).
- **Statistik:** Kaffees heute, diesen Monat, Gratis-Kaffees; pro Kunde gesamt/Monat/gratis mit Verlauf.
- **Sicherung:** Auf dem Handy über „Teilen“ (WhatsApp, Mail …) verschicken, sonst als JSON-Datei herunterladen;
  laden über „Sicherung laden“; Erinnerung nach 7 Tagen. Zurücksetzen mit doppelter Nachfrage.
- **Kurzanleitung:** `anleitung.html` – eine A4-Seite für die Theke, mit QR-Code zum Öffnen der App und Feld
  für die Betreuungs-Kontaktdaten.
- Alles nur auf **einem** Gerät (localStorage), kein Server. QR-Erkennung: `BarcodeDetector`, sonst
  jsQR von Cosmo Wolfe (Apache-2.0-Lizenz, `theke/jsQR.js`).

Veröffentlicht über GitHub Pages: https://mirkowill.github.io/kaffeekarte/

Neue Version: Dateien ändern, in den HTML-Dateien/`sw.js` die `?v=` bzw. `CACHE` hochzählen.
QR-Code-Erzeugung: qrcode-generator von Kazuhiko Arase (MIT-Lizenz).
