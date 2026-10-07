# Grovia — demo interattiva

Una demo locale in italiano: Food Persona, ricette, lista condivisa, confronto negozi, percorso nel supermercato, scanner simulato, ricevute e dispensa. Nessun account, pagamento o servizio esterno.

## GitHub Pages

Indirizzo previsto dopo l'attivazione di Pages: https://zargon42.github.io/Grovia-demo/

In **Settings → Pages → Build and deployment**, seleziona **GitHub Actions** come sorgente. Il workflow incluso verifica e pubblica l'app a ogni push su `main`; può anche essere avviato manualmente dalla scheda Actions. Non sono necessari token o segreti aggiuntivi.

Gli asset usano percorsi relativi per funzionare anche nella sottocartella del repository. Il sito conserva i progressi separatamente nel browser di ciascun visitatore. L'indirizzo pubblico può essere usato per un QR code permanente.

Per modificare l'app, lavora nella cartella di questo repository. Esegui i test e la build, poi crea un commit e fai push su `main`. La cartella `dist` viene generata dal workflow e non è inclusa in Git.

## Avvio su Windows

Apri **Avvia-Grovia.cmd** con un doppio clic. Serve Node.js LTS (già disponibile sul computer usato per lo sviluppo). La prima installazione delle dipendenze richiede internet; in seguito il server e l'app funzionano offline. Lascia aperta la finestra del server. `Ctrl+C` lo ferma.

In alternativa, dalla cartella `grovia-demo`:

```powershell
npm ci
npm run dev -- --open
```

Il server ascolta solo sul computer locale, normalmente all'indirizzo http://127.0.0.1:5173. Se la porta è occupata, Vite usa la successiva e apre l'indirizzo corretto. La UI è responsive; per vederla su un telefono fisico serve una configurazione di rete aggiuntiva, non inclusa nel launcher locale.

## Percorso suggerito per la presentazione

1. Seleziona **Prova la demo** per usare il profilo di Sofia, oppure crea un Food Persona.
2. Apri una ricetta, modifica le porzioni e aggiungi gli ingredienti alla lista.
3. Apri **La mia lista**, cambia quantità e confronta totale e budget.
4. In **Negozi**, scegli Lidl e avvia la spesa.
5. Segui la mappa e premi **Messo nel carrello** per simulare la raccolta. Salta un articolo o modifica la lista per vedere il ricalcolo.
6. Usa **Scanner demo** per controllare un prodotto del catalogo e inserirlo nel carrello.
7. Finisci le tappe, concludi alla cassa e consulta ricevuta, statistiche e dispensa.
8. Usa **Reimposta demo** nel piè di pagina per ricominciare.

## Dati e limiti

- 30 prodotti, 8 ricette, 3 negozi di esempio; navigazione completa disponibile solo per Lidl.
- La mappa importa una copia di `lidl_store_layout.json`. Le distanze usano le coordinate e i pesi originali; i prodotti sono associati a nodi con categorie compatibili.
- L'algoritmo trova cammini minimi sul grafo e sceglie il prodotto più vicino all'interno di ogni gruppo: pesanti, dispensa/bevande, freschi, surgelati, poi la cassa più vicina. È un'euristica, non una garanzia del minimo globale. Una nuova aggiunta durante la spesa riordina soltanto le tappe rimanenti.
- Posizione, stock, prezzi, sconti, scansioni, storico iniziale e scadenze sono dimostrativi. Nessun GPS, fotocamera, AI remota, pagamento o integrazione con il supermercato.
- Compatibilità alimentare calcolata su dati locali illustrativi. Le categorie d'acquisto nelle statistiche non costituiscono una valutazione nutrizionale.
- Il totale riguarda confezioni intere. Le porzioni delle ricette vengono arrotondate a confezioni; gli ingredienti già in lista si sommano.
- Le preferenze e i progressi sono salvati solo nel localStorage di questo browser. Se il salvataggio è disabilitato, l'app avvisa e continua in memoria.
- I punti della sfida si sbloccano a tre spese demo completate. Non sono coupon spendibili.

## Verifica e build

```powershell
npm test
npm run build
npm run preview -- --open
```

La build statica è in `dist/`. Non è necessaria alcuna pubblicazione. Il simulatore Python originale non viene modificato.

## Immagini e stile

Stile adattato dalla presentazione Canva Grovia fornita per il progetto: arancione corallo, crema, verde, cart-and-wordmark locale. Il logo vettoriale è una ricostruzione, non un'esportazione originale del logo Canva.

Le foto illustrative sono scaricate da Unsplash e incluse in `public/images`; nessuna immagine viene richiesta a internet a runtime. Alcune ricette condividono immagini illustrative, non fotografie esatte del piatto.

- Bowl: https://images.unsplash.com/photo-1512621776951-a57141f2eefd
- Pasta: https://images.unsplash.com/photo-1473093295043-cdd812d0e601
- Toast: https://images.unsplash.com/photo-1525351484163-7529414344d8

Font di sistema e icone Lucide (licenza ISC, inclusa nella dipendenza).
