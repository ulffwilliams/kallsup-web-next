# Användarvillkor: exakta rättningar

Gäller texten under Shopify → Settings → Policies → Terms of service.
Granskad 2026-09-24, 26 950 tecken, 13 ofyllda platshållare.

Texten i övrigt lämnas orörd med flit. Att skriva om ett juridiskt dokument
från grunden riskerar att ändra innebörden i klausuler ingen läser om, så
nedan står bara det som faktiskt ska bytas.

---

## 1. Ta bort Shopifys utkastbrasklapp

Dokumentet inleds idag med en hakparentes som är avsedd för dig som handlare,
inte för kunden. Den ska inte ligga publikt.

**Ta bort hela stycket**, från och med:

> [Allmän ansvarsfriskrivning för policyer: Materialet nedan är endast i
> informationssyfte och utgör inte reklam, en uppmaning eller juridisk
> rådgivning. Denna mall kan vara översatt med automatiserad teknik. …

… till och med slutet av den hakparentesen. Villkoren ska börja direkt på den
egentliga inledningen.

---

## 2. Fyra länkar

Shopifys policysidor ligger på relativa adresser under butiksdomänen, så
länkarna fungerar oavsett om butiken nås via `kallsup.myshopify.com` eller en
egen domän.

| Var i texten | `[LÄNK]` ersätts med länk till |
| --- | --- |
| Inledningen: "…och vår Integritetspolicy [LÄNK]" | `/policies/privacy-policy` |
| Avsnitt om returer: "…i enlighet med vår återbetalningspolicy [LÄNK]" | `/policies/refund-policy` |
| Integritetsavsnittet: "…som kan läsas här [LÄNK]" | `/policies/privacy-policy` |
| Överföring till tredje part: "Läs vår Integritetspolicy [LÄNK]" | `/policies/privacy-policy` |

Praktiskt i Shopifys editor: markera ordet **Integritetspolicy** respektive
**återbetalningspolicy**, gör det till en hyperlänk med adressen ovan, och
radera `[LÄNK]`. Då slipper kunden en naken URL mitt i meningen.

---

## 3. Handlarnamnet på fyra ställen

Mallen har stavat samma platshållare fyra olika sätt. Alla ska bli det
**juridiska firmanamnet**, identiskt skrivet varje gång.

| Platshållare | Kontext |
| --- | --- |
| `[Handlere]` | "Din order accepteras inte förrän [Handlere] bekräftar godkännandet." |
| `[HANDLARE]` | "MED UNDANTAG FÖR VAD SOM UTTRYCKLIGEN ANGES AV [HANDLARE]…" |
| `[HANDlare]` | "…SKA [HANDlare], VÅRA PARTNER, STYRELSELEDAMÖTER…" |
| `[INFOGA HANDELSNAMN]` | Kontaktuppgifterna i avsnitt 25 |

Skriv ut firmanamnet med bolagsform, exempelvis `Skärrad AB`, inte `Skärrad`
eller `Kallsups webbshop`. Det är den juridiska personen som binds av
villkoren.

---

## 4. `[agentnamn]` är inte ett tomt fält

Den här står i klausulen om automatiserade agenter och beskriver ett
*format* för en user agent-sträng, inte ett värde du ska fylla i:

> …inkludera följande i begärans användaragentsträng: "Agent/[agentnamn]"

Byt hakparentesen mot vinkelparenteser så det framgår att det är en variabel:

> …inkludera följande i begärans användaragentsträng: "Agent/&lt;agentens namn&gt;"

---

## 5. Kontaktuppgifterna i avsnitt 25

Blocket ser idag ut så här:

```
[INFOGA HANDELSNAMN]
ekonomi@skarrad.se
[INFOGA FÖRETAGSADRESS]
[INFOGA FÖRETAGETS TELEFONNUMMER]
[INFOGA ORGANISATIONSNUMMER]
[INFOGA MOMSREGISTRERINGSNUMMER]
```

Ersätt med riktiga uppgifter. Detta är samma block som e-handelslagen
(2002:562) kräver ska vara lätt, direkt och varaktigt tillgängligt — så det
ska också ut i sajtens footer.

Är bolaget inte momsregistrerat: skriv ut det i klartext, exempelvis
"Ej momsregistrerad", hellre än att lämna raden tom.

Saknas fast telefon går det att utelämna telefonraden. Kravet är att minst en
snabb och effektiv kontaktväg finns, och e-postadressen uppfyller det.

---

## Kvarstår att bekräfta

- [ ] Juridiskt firmanamn med bolagsform
- [ ] Organisationsnummer
- [ ] Momsregistreringsnummer, eller besked om att bolaget inte är registrerat
- [ ] Postadress
- [ ] Telefonnummer, eller besked om att raden tas bort
