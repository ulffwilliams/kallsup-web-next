# Policies: att göra

Avstämt mot live-API:t 2026-09-24. Bocka av i takt med att det fixas.

| Policy | Status |
| --- | --- |
| Returpolicy | 1 punkt kvar |
| Fraktpolicy | 1 punkt kvar |
| Integritetspolicy | 3 punkter kvar |
| Användarvillkor | 9 punkter kvar |

---

## Returpolicy — nästan klar

Den nya texten är inlagd. Verifierat att samtliga ändringar följde med:
ångerfristens startpunkt, värdeminskning i stället för kravet på oanvänd vara,
förseglingsundantaget för vinyl, reklamationsavsnittet, återbetalning inom 14
dagar från ångermeddelandet, och att rea-undantaget är borta.

- [ ] **Avsnittet "Om vi inte kommer överens" saknas.** Texten slutar på
      meningen om 15 arbetsdagar. Lägg till sist:

      > ### Om vi inte kommer överens
      >
      > Är du missnöjd med hur vi hanterat ditt ärende kan du vända dig till
      > Allmänna reklamationsnämnden, Box 174, 101 23 Stockholm, www.arn.se.
      > Vi följer ARN:s rekommendationer.

---

## Fraktpolicy

- [ ] **Avsnittet "Leveransområde" saknas fortfarande.** Policyn börjar direkt
      på Handläggningstid. Tullstycket finns kvar men saknar sin förklaring.
      Lägg in först:

      > ### Leveransområde
      >
      > Vi skickar till Sverige, till länder inom EU och till ett antal länder
      > utanför EU. Vilka länder som kan väljas ser du i kassan.

---

## Integritetspolicy

- [ ] **Skärrad AB nämns inte någonstans.** Policyn säger bara "vi är
      personuppgiftsansvariga". GDPR artikel 13.1 a kräver den
      personuppgiftsansvariges identitet. Skriv ut:

      > Personuppgiftsansvarig är Skärrad AB, organisationsnummer 559550-6444.

- [ ] **Postadressen är borta.** Tidigare stod Åbylundsgatan 3, 702 32 Örebro
      i policyn, vilket var fel adress. Kontaktuppgifterna ska omfatta en
      geografisk adress, inte bara e-post. Lägg in **Karlsgatan 12A** med
      postnummer och ort, identiskt med användarvillkoren.

- [ ] **IMY namnges inte.** Policyn hänvisar till "din lokala
      datatillsynsmyndighet" och länkar till en EES-lista. Korrekt men
      onödigt omständligt för svenska kunder. Lägg till:

      > Du har rätt att lämna in klagomål till Integritetsskyddsmyndigheten
      > (IMY), Box 8114, 104 20 Stockholm, imy.se.

- [ ] *Lagringstider:* sökning ger fortfarande inga träffar på lagringstid
      eller motsvarande formuleringar. GDPR artikel 13.2 a kräver att
      lagringsperioden anges, eller kriterierna för att bestämma den. Värt att
      kontrollera manuellt — Shopifys mall kan ha formulerat det på ett sätt
      mina sökningar missar.

---

## Användarvillkor — inget rättat sedan förra granskningen

Texten är 25 370 tecken, i princip oförändrad. Samtliga punkter nedan
kvarstår.

### Avtalsparten

- [ ] **Översikten definierar "vi" som handelsnamnet.** Står fortfarande
      "Termerna 'vi', 'oss' och 'vår' avser Kallsups webbshop." Byt till:

      > Termerna "vi", "oss" och "vår" avser Skärrad AB, organisationsnummer
      > 559550-6444, som driver Kallsups webbshop.

### Kontaktuppgifterna i avsnitt 25

Blocket lyder nu:

```
Skärrad AB
ekonomi@skarrad.se
Karlsgatan 12A
+4673 816 24 89
559550-6444
SE559550644401
```

- [x] ~~Vilken adress gäller~~ — **Karlsgatan 12A** är bolagets adress.
      Åbylundsgatan 3 i integritetspolicyn var fel och ska bort.

- [ ] **Postnummer och ort saknas fortfarande.** "Karlsgatan 12A" ensamt
      uppfyller inte e-handelslagens krav på geografisk adress. Komplettera
      till formen `Karlsgatan 12A, NNN NN Örebro` och använd exakt samma
      sträng i användarvillkoren, integritetspolicyn och sajtens footer.

- [ ] **Telefonnumret ska formateras** `+46 73 816 24 89`.

### Amerikanska kvarlevor

- [ ] **Avsnitt 22, tillämplig lag.** Står fortfarande "federala och statliga
      eller territoriella domstolar". Ersätt med:

      > Svensk rätt tillämpas på dessa villkor. Tvist prövas av svensk allmän
      > domstol. Som konsument har du alltid rätt att väcka talan vid domstol
      > i det land där du har hemvist, och att vända dig till Allmänna
      > reklamationsnämnden (ARN) för prövning. Vi följer ARN:s
      > rekommendationer.

- [ ] **Avsnitt 6:** "brott mot federala och statliga lagar om immateriell
      egendom" → "brott mot svensk och internationell upphovsrätt".

- [ ] **Avsnitt 13:** "internationella, federala, provinsiella eller statliga
      bestämmelser" → "tillämplig lag".

### Saknas helt

- [ ] **Reservation för tvingande konsumenträtt.** Lägg till som eget avsnitt:

      > **Tvingande konsumenträtt.** Inget i dessa villkor inskränker de
      > rättigheter du har enligt tvingande lagstiftning, däribland
      > distansavtalslagen (2005:59) och konsumentköplagen (2022:260). Vid
      > konflikt mellan dessa villkor och sådan lagstiftning gäller
      > lagstiftningen.

### Textfel

- [ ] **`[agentnamn]` i avsnitt 14.4** → `<agentens namn>`.

- [ ] **`AND` på fyra ställen** — rubrikerna till avsnitt 1, 4 och 12, samt
      "I BEFINTLIGT SKICK AND I MÅN AV TILLGÄNGLIGHET" i avsnitt 16.

- [ ] **`OR` på tre ställen** i avsnitt 16 och 17: "UTTRYCKLIGA OR
      UNDERFÖRSTÅDDA", "SÄKER OR FELFRI", "TJÄNSTERNA OR NÅGON PRODUKT".

---

## Ordning att ta det i

1. **Postnummer och ort till Karlsgatan 12A** — låser upp tre punkter på en
   gång: användarvillkoren, integritetspolicyn och footern på sajten. Vilken
   gata det är avgjordes 2026-09-24; bara postnumret fattas.
2. **Returpolicyns ARN-avsnitt** och **fraktpolicyns leveransområde** — två
   klipp och klistra.
3. **Användarvillkoren** — avtalsparten och avsnitt 22 först, textfelen sist.
4. **Integritetspolicyn** — personuppgiftsansvarig och IMY.

Kvar sedan tidigare, utanför Shopify: företagsuppgifter i sajtens footer, och
sidorna `/kopvillkor` och `/integritetspolicy` på kallsup.se. Se
`docs/webshop-lanseringschecklista.md`.
