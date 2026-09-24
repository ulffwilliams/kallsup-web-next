# Granskning av användarvillkoren

Genomgång av den ifyllda texten, 2026-09-24. Inte juridisk rådgivning — en
lista på vad som sticker ut och varför.

Platshållarna från Shopifys mall är ifyllda. Det som återstår är dels fel som
uppstod vid ifyllningen, dels sådant som mallen aldrig anpassade från sitt
amerikanska ursprung.

---

## P1 — åtgärda innan publicering

### 1. Bankkontonumret ligger i fältet för momsregistreringsnummer

Sista raden i avsnitt 25 är ett bankkonto i IBAN-format, inte ett
momsregistreringsnummer. Två problem:

**Ta bort det.** Ett kontonummer i publika villkor bjuder in till
fakturabedrägeri — någon skickar en falsk faktura som ser trovärdig ut för att
kontot stämmer. Kunder betalar via Shopifys kassa och behöver aldrig se
kontonumret.

**Ersätt med rätt uppgift.** Momsregistreringsnumret för organisationsnummer
559550-6444 är `SE559550644401` — landskod, organisationsnumret utan
bindestreck, och 01 på slutet. Bekräfta mot Skatteverkets registerutdrag
innan det publiceras. Är bolaget inte momsregistrerat, skriv ut det i
klartext i stället.

### 2. Avsnitt 5 strider mot konsumentköplagen

> "När vi har överlämnat produkter till budet, så övergår äganderätten och
> risken för skador till dig."

Den här klausulen är ogiltig mot konsumenter. Enligt konsumentköplagen
(2022:260) går risken över på köparen först när **varan kommer i köparens
besittning** — inte när den lämnas till fraktbolaget. Undantaget är när köparen
själv ordnat en transportör som säljaren inte erbjudit.

Det betyder att ni bär risken för paket som försvinner eller skadas på vägen,
oavsett vad villkoren säger. Att påstå motsatsen är dessutom en vilseledande
affärsmetod enligt marknadsföringslagen.

Föreslagen ersättning:

> Risken för varan går över på dig när varan kommit i din besittning. Skadas
> eller försvinner en försändelse under transporten ansvarar vi för det, och
> du ska kontakta oss så löser vi det. Har du själv ordnat transport som vi
> inte erbjudit, går risken över när varan lämnats till din transportör.

### 3. Fel part binds av avtalet

Texten växlar mellan två namn:

| Används om | Var |
| --- | --- |
| "Kallsups webbshop" | Översikten, avsnitt 6, 9, 18, 22 |
| "Skärrad AB" | Avsnitt 3, 16, 17, 25 |

"Kallsups webbshop" är ett handelsnamn, inte en juridisk person. Det kan inte
ingå avtal, äga varumärken eller stämmas. Som texten står nu är det oklart vem
kunden faktiskt handlar av.

Lös det i översikten och använd sedan ett namn konsekvent:

> Termerna "vi", "oss" och "vår" avser Skärrad AB, organisationsnummer
> 559550-6444, som driver Kallsups webbshop.

Byt därefter ut resterande förekomster av "Kallsups webbshop" som avtalspart
mot "vi" eller "Skärrad AB". Namnet får gärna stå kvar där det syftar på
själva butiken.

### 4. Adressen är ofullständig

"Karlsgatan 12A" saknar postnummer och ort. E-handelslagen (2002:562) kräver
en geografisk adress — en gatuadress utan ort uppfyller inte det.

Telefonnumret är också felformaterat: `+4673 816 24 89` ska vara
`+46 73 816 24 89`.

### 5. Avsnitt 22 pekar ut amerikanska domstolar

> "…ska regleras av och tolkas i enlighet med federala och statliga eller
> territoriella domstolar i den jurisdiktion där Kallsups webbshop har sitt
> huvudkontor."

Sverige har varken federala eller delstatliga domstolar. Kvarleva från den
amerikanska mallen.

Dessutom: en jurisdiktionsklausul kan inte ta ifrån en konsument rätten att
stämma i sitt eget hemland. Det följer av Bryssel Ia-förordningen artikel 18,
och gäller oavsett vad villkoren säger — relevant nu när ni säljer till 42
länder.

Föreslagen ersättning:

> Svensk rätt tillämpas på dessa villkor. Tvist prövas av svensk allmän
> domstol. Som konsument har du alltid rätt att väcka talan vid domstol i det
> land där du har hemvist, och att vända dig till Allmänna reklamationsnämnden
> (ARN) för prövning. Vi följer ARN:s rekommendationer.

### 6. Ingen reservation för tvingande konsumenträtt

Avsnitt 16 och 17 friskriver i stort sett allt ansvar, och avsnitt 3 säger att
returer sker "enbart i enlighet med vår Återbetalningspolicy". Mot konsumenter
är sådana villkor overksamma i den mån de inskränker tvingande rättigheter.

Lägg till ett eget avsnitt. Det räddar inte en klausul som är direkt felaktig,
som avsnitt 5, men det fångar upp resten av mallens överdrifter:

> **Tvingande konsumenträtt.** Inget i dessa villkor inskränker de rättigheter
> du har enligt tvingande lagstiftning, däribland distansavtalslagen
> (2005:59), konsumentköplagen (2022:260) och produktansvarslagen
> (1992:18). Vid konflikt mellan dessa villkor och sådan lagstiftning gäller
> lagstiftningen.

---

## P2 — rätta i samma veva

### `[agentnamn]` står kvar

Avsnitt 14.4 innehåller fortfarande `"Agent/[agentnamn]"`. Byt till
`"Agent/<agentens namn>"` — det är en formatbeskrivning, inte ett tomt fält.

### Kontrollera att länkarna faktiskt är länkar

Hakparenteserna `[LÄNK]` är borta, men i avsnitt 10 står "…Shopifys
integritetspolicy, som kan läsas här." Ordet "här" måste vara en hyperlänk,
annars pekar meningen ingenstans. Kontrollera samtliga fyra ställen i
publicerat läge, inte i editorn.

### Amerikanska referenser på fler ställen

| Avsnitt | Står | Bör vara |
| --- | --- | --- |
| 1 | "myndighetsålder i din stat eller provins" | 18 år, eller myndighetsålder i ditt hemland |
| 6 | "skyddade av amerikanska och utländska patent-…" | svensk och internationell upphovsrätt |
| 6 | "brott mot federala och statliga lagar" | svensk lag |
| 13 | "internationella, federala, provinsiella eller statliga bestämmelser" | tillämplig lag |

### Oöversatta ord från maskinöversättningen

`AND` och `OR` står kvar mitt i svensk text:

- Rubrik avsnitt 1: "ÅTKOMST **AND** KONTO"
- Rubrik avsnitt 4: "PRISER **AND** FAKTURERING"
- Rubrik avsnitt 12: "FEL, FELAKTIGHETER **AND** UTELÄMNANDEN"
- Avsnitt 16: "I BEFINTLIGT SKICK **AND** I MÅN AV TILLGÄNGLIGHET"
- Avsnitt 16: "VARE SIG UTTRYCKLIGA **OR** UNDERFÖRSTÅDDA"
- Avsnitt 16: "SÄKER **OR** FELFRI"
- Avsnitt 17: "TJÄNSTERNA **OR** NÅGON PRODUKT"

### Rena skrivfel

| Var | Står | Ska vara |
| --- | --- | --- |
| Avsnitt 3 | "faktureringsadressoch" | "faktureringsadress och" |
| Avsnitt 3 | "kanske inte kan ta tillgodose" | "kanske inte kan tillgodose" |
| Avsnitt 10 | "Alla personuppgifter som vi tillhandahåller via Tjänsterna" | "…som vi samlar in via Tjänsterna" |
| Avsnitt 12 | "efter att du har avslutat lagt din order" | "efter att du lagt din order" |
| Avsnitt 17 | "FÖRLUST INTÄKT" | "FÖRLUST AV INTÄKT" |
| Avsnitt 17 | "SHOPIFYS OCH DESS NÄRSTÅENDE BOLAGS, INTE VARA ANSVARIGA" | meningen saknar subjekt, skriv om |
| Avsnitt 20 | "policyer eller driftsregler som som publiceras" | "…som publiceras" |

---

## Det som är bra

- Organisationsnumret 559550-6444 har giltig kontrollsiffra och följer
  formatet för aktiebolag.
- Avsnitt 9 om förhållandet till Shopify är tydligt: försäljningen sker med
  er, inte med Shopify.
- Avsnitt 14 om AI-agenter är ovanligt genomtänkt för en butik i den här
  storleken.
- Avsnitt 24 om ändringar av villkoren hanterar meddelandeplikten korrekt.

---

## Sammanfattning

Två fel gör att texten inte bör publiceras som den är: **bankkontonumret** och
**riskövergången i avsnitt 5**. Det första är en säkerhetsrisk, det andra är
ett villkor som inte håller och som dessutom kan läsas som vilseledande
marknadsföring.

De övriga fyra P1-punkterna gör dokumentet juridiskt haltande snarare än
farligt, men de tar en kvart att rätta.
