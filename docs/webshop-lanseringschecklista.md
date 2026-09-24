# Checklista: innan webbshoppen öppnar

Status per 2026-09-24. Bocka av och committa allteftersom.

Juridikdelen är en avstämningslista, inte juridisk rådgivning. Låt någon med
kompetens läsa villkoren innan första ordern tas emot.

---

## 0. Avgör först — allt annat hänger på detta

- [ ] **Vem är säljaren juridiskt?** Kontaktadresserna i Shopifys policies går
      till `@skarrad.se`, så det är sannolikt Skärrad och inte bandet eller
      Våro Records. Bekräfta bolagsform. Avgör vilket org.nr som ska stå, vem
      som bär ångerrätts- och reklamationsansvaret, och vem som är
      personuppgiftsansvarig. Står fel part i villkoren är resten verkningslöst.
- [ ] **Är säljaren momsregistrerad?** Styr om priserna ska anges inkl. moms
      med momssats utskriven, och om momsreg.nr måste finnas i footern.

Uppgifter som behövs för att skriva färdigt texterna:

- [ ] Firmanamn
- [ ] Organisationsnummer
- [ ] Momsregistreringsnummer
- [ ] Geografisk adress
- [ ] E-post för kundärenden
- [ ] Returadress (om annan än ovan)

---

## 1. Juridiskt innehåll på kallsup.se

Informationen ska finnas **innan** avtalet ingås. Kassan är sista steget, så
det räcker inte att Shopify visar den där.

- [ ] **Företagsuppgifter i footern** — firmanamn, org.nr, momsreg.nr, adress,
      e-post. Krav enligt e-handelslagen (2002:562): ska vara lätt, direkt och
      varaktigt tillgängligt.
- [ ] **Sida: köpvillkor** med
  - [ ] Ångerrätt 14 dagar, hur den utövas, från vilken dag fristen räknas
  - [ ] Vem som betalar returfrakten
  - [ ] Länk till Konsumentverkets standardblankett för ångerrätt
  - [ ] Leveranstid och fraktkostnad
  - [ ] Betalsätt
  - [ ] Reklamationsrätt 3 år, omvänd bevisbörda 2 år (konsumentköplagen
        2022:260)
  - [ ] Hänvisning till ARN vid tvist, och om ni följer deras beslut
- [ ] **Sida: integritetspolicy** (GDPR art. 13) med
  - [ ] Personuppgiftsansvarig och kontaktväg
  - [ ] Vilka uppgifter, ändamål och rättslig grund
  - [ ] Mottagare: Shopify (order och betalning), Vercel (drift och analys),
        Neon (databas)
  - [ ] Lagringstider
  - [ ] Registrerades rättigheter
  - [ ] Rätten att klaga till IMY
  - [ ] Cookieavsnitt, se punkt 2
- [ ] **Länkar till båda sidorna i footern**

**Skriv inte in en ODR-länk.** EU:s tvistlösningsplattform lades ner
20 juli 2025 genom förordning (EU) 2024/3228. Mallar på nätet kräver ofta
fortfarande den — hänvisa till ARN i stället.

---

## 2. Cookies och spårning

- [ ] **Bekräfta att ingen cookiebanner behövs.** Sajten sätter idag bara
      `kallsup_cart` (nödvändig för varukorgen) och inloggningskakan för
      `/apps/biljettstatistik` (internt verktyg). Vercel Analytics och Speed
      Insights är cookiefria. Samtycke krävs bara för icke-nödvändiga cookies.
      Informationsplikten kvarstår och löses i integritetspolicyn.
- [ ] **Beskriv `ticket_clicks` i policyn.** Tabellen lagrar `referrer` och
      `user_agent`, ingen IP. Svagt pseudonymt, men ska nämnas med lagringstid.
- [ ] **Sätt en gallringsrutin för `ticket_clicks`** — lagringstiden i policyn
      måste motsvara något som faktiskt sker.

---

## 3. Shopify-admin

Policies finns redan. Granskade via Storefront API 2026-09-24:

- [x] ~~Integritetspolicy~~ — 18 700 tecken, svensk, nämner ARN, kontakt via
      `@skarrad.se`. Inga platshållare.
- [x] ~~Returpolicy~~ — 2 700 tecken, svensk, 30 dagars öppet köp med
      ångerfristen på 14 dagar nämnd.
- [ ] **Användarvillkoren har 13 ofyllda platshållare** — `[LÄNK]` fyra gånger,
      `[Handlere]`, `[agentnamn]`. Texten inleds dessutom med Shopifys egen
      brasklapp om att mallen kan vara maskinöversatt och inte utgör juridisk
      rådgivning. Den ska bort innan publicering.
- [ ] **Skriv om fraktpolicyn.** Den är 121 tecken lång och på engelska i en
      svensk butik: "Different shipping method depending on country of the
      buyer. We ship ASAP, but usually not longer than a few days." Saknar
      fraktkostnad, leveranstid och zoner. "ASAP" duger inte som leveranstid
      enligt distansavtalslagen.
- [ ] **Bestäm om ni verkligen ska sälja till 42 länder.** Butiken levererar
      idag till bl.a. USA, Japan och Australien. Utanför EU tillkommer tull och
      exportmoms; inom EU gäller OSS-reglerna vid tröskelvärdet. Begränsa till
      Sverige eller EU om ingen vill hantera det.
- [ ] **Se till att texterna säger samma sak som sidorna på kallsup.se.**
- [ ] **Öppna butiken.** Den är lösenordsskyddad och visar "Opening soon", så
      kassan är oåtkomlig. Kräver att en betalplan väljs.
- [ ] **Ta bort lösenordsskyddet** under Online Store → Preferences.
- [ ] **Konfigurera frakt** — fraktzoner och priser. Drawern säger "Frakt
      tillkommer i kassan"; det måste finnas något att räkna ut.
- [ ] **Aktivera betalsätt.** För test: Bogus Gateway under Settings →
      Payments.
- [ ] **Kontrollera att varje produkt ligger i rätt kollektion.** `musik` var en
      period tom trots att vinylen hade `productType: musik`.
- [ ] **Sätt produktbeskrivningar och SEO-fält.** `seo.title` och
      `seo.description` är `null` på alla produkter; koden faller tillbaka på
      titel och beskrivning, men egna värden ger bättre sökresultat.
- [ ] **Lägg upp fler produktbilder.** Produktsidan visar upp till tio; galleriet
      och hover-växlingen på korten behöver minst två per produkt.

---

## 4. Säkerhet

- [ ] **Rotera admin-token `shpat_2d3de40f…`.** Den klistrades in i en chatt och
      svarar på både Storefront- och Admin-endpointen. Koden använder den inte.
- [ ] **Behåll enbart den publika Storefront-token i sajtens miljö.** Den är
      konstruerad för att vara klientsynlig och räcker för både produkter och
      varukorg.
- [ ] **Verifiera att `.env.local` fortfarande är gitignorerad** innan nästa
      push.

---

## 5. Vercel

- [ ] **`DATABASE_URL` för Preview.** Saknas nu och fäller hela bygget —
      `/apps/latordnaren` och startsidan prerenderas båda mot databasen. Den
      befintliga variabeln är troligen branch-scopad till `tour-preview`.
- [ ] **`SHOPIFY_STORE_DOMAIN` och `SHOPIFY_STOREFRONT_ACCESS_TOKEN` för
      Preview.** Utan dem byggs sajten men merch-sektionen är tom.
- [ ] **Redeploya efter att variablerna lagts till** — env injiceras vid
      byggtid.
- [ ] **Samma variabler för Production** innan `webshop` mergas till `main`.
- [ ] **Testdomän**, om önskad: Settings → Domains, koppla till branchen
      `webshop`.

---

## 6. Testa hela köpet skarpt

- [ ] Lägg i varukorgen från ett kort, från en kategorisida och från en
      produktsida
- [ ] Ändra antal i drawern, ta bort sista raden
- [ ] Gå till kassan, genomför ett testköp med Bogus Gateway
- [ ] Bekräfta att orderbekräftelsen kommer per mejl — kravet på varaktigt
      medium enligt distansavtalslagen vilar på den
- [ ] Testa en utsåld variant
- [ ] Testa på mobil: galleriet ligger före pris och köpknapp i mobilordningen
- [ ] Kontrollera att kassan visar samma frakt- och returvillkor som
      kallsup.se

---

## Referenser

- Distansavtalslagen (2005:59) — ångerrätt och förköpsinformation
- E-handelslagen (2002:562) — identifieringsuppgifter
- Konsumentköplagen (2022:260) — reklamation
- Prisinformationslagen (2004:347) — prisangivelser
- GDPR art. 13 — information vid insamling
- Lag om elektronisk kommunikation — cookies
- Konsumentverket: standardblankett för ångerrätt
- ARN: tvistlösning
- IMY: tillsyn dataskydd
