# LetiBlu Pesca Map

Mappa navigazione/pesca Castiglioncello–Vada per la barca **LetiBlu**.

## Telefono / GitHub Pages

Dopo il deploy su `main`, l’app è su:

**https://alessiodc8.github.io/pesca-map/**

Sul telefono: apri il link → menu browser → **Aggiungi a Home** (PWA). Serve rete (hotspot) per tile e meteo.

## Hardware di bordo (configurato nell’app)

| Dispositivo | Uso |
|-------------|-----|
| **Simrad GO7** | Plotter principale — import GPX waypoint/route |
| **Lowrance Elite 5 DSI** | Eco/DownScan — verifica strutture, cupole, cigli |
| **Haswing 120 lb** (prua) | Spot-lock, controderiva tenya, avvicinamento finale |

## Avvio locale

```bash
python3 -m http.server 43125 --bind 127.0.0.1
```

Apri http://127.0.0.1:43125

L’app registra un **service worker** (shell offline: HTML/JS/manifest). Tiles e meteo restano online quando c’è rete.

## Funzioni principali

- Carta + batimetria EMODnet, isobate verificate (−50 m: Cecina/Vada 5–9 nm, Cala ~3 nm)
- Spot tecnici, cerchi di lavoro, preferiti, piano giornata
- Rotte con BRG/DTG/ETA, prua **vera e magnetica** (var. 3°E)
- GPS live + simulazione, XTE, allarme arrivo, anchor watch, MOB
- Deriva stimata vento+corrente → indicazioni Haswing
- Mare/correnti/livello MSL/SST (Open-Meteo Marine)
- Export **GPX** waypoint, rotta attiva, piano giornata (GO7 / Elite 5)
- Log catture, soglie GO/NO-GO, modalità notte, wake lock schermo

## Import GPX sui plotter

1. Dall’app: **Pack plotter** oppure **GPX piano → GO7/Elite** / **GPX rotta**
2. Copia il file `.gpx` su microSD
3. **Simrad GO7**: Files → Import → GPX (Waypoint/Routes)
4. **Lowrance Elite 5 DSI**: inserisci SD → Files/Waypoints import (menu può variare per firmware)

Suggerimento: sul GO7 usa i waypoint del piano come destinazioni; sull’Elite 5 DSI marca la struttura vista in DownScan e confrontala con “Confronta profondità eco” nell’app.

## Flusso tipico in mare

1. Controlla **GO/NO-GO** (vento/onda)
2. Compila **piano giornata** (3–5 spot)
3. **Export GPX** sul plotter
4. **Imposta rotta** + **GPS live**
5. Negli ultimi ~0,2 nm: **Haswing approach**, allarme arrivo
6. Su spot: **Deriva** + spot-lock Haswing; verifica eco DSI/GO7
7. A fine sessione: **log catture**
