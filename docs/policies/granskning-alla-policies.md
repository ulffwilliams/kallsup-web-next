# Granskning av samtliga policies

Hämtade live via Storefront API 2026-09-24 och lästa i sin helhet. Inte
juridisk rådgivning — en lista på vad som avviker och varför.

| Policy | Längd | Bedömning |
| --- | --- | --- |
| Fraktpolicy | 2 431 tecken | Inlagd. Ett avsnitt saknas |
| Användarvillkor | 25 448 | Två allvarliga fel rättade, fyra kvar |
| Returpolicy | 2 377 | **Innehåller villkor som inte håller mot ångerrätten** |
| Integritetspolicy | 16 975 | Fel personuppgiftsansvarig, motstridig adress |

---

## Fraktpolicy — i stort sett klar

Texten är inlagd. Handläggningstid, leveranstider, fraktkostnad, tull,
spårning, förseningar, felaktig adress, ej uthämtade paket, returer och
kontakt finns alla på plats.

- [ ] **Avsnittet "Leveransområde" föll bort.** Policyn börjar direkt på
      Handläggningstid. Listan över vilka länder ni skickar till finns alltså
      inte längre i texten. Inte ett formellt krav — kassan visar ändå vilka
      länder som går att välja — men det var det avsnitt som förklarade varför
      tullstycket längre ned finns. Lägg tillbaka det eller stryk det medvetet.

---

## Användarvillkor — rättat sedan förra granskningen

- [x] ~~Bankkontonumret borttaget~~
- [x] ~~Momsregistreringsnummer `SE559550644401` på plats~~
- [x] ~~Riskövergången vid överlämning till budet borttagen ur avsnitt 5~~

Avsnitt 5 lyder nu enbart att ni inte ansvarar för leveransförseningar
orsakade av budföretag, tull eller omständigheter utanför er kontroll. Det är
rimligt och strider inte mot konsumentköplagen.

### Kvarstår

- [ ] **Översikten definierar fel avtalspart.** Texten säger nu:

      > Termerna "vi", "oss" och "vår" avser Kallsups webbshop. Skärrad AB
      > driver denna butik och webbplats…

      Det blir motsägelsefullt: "vi" definieras som handelsnamnet, och i nästa
      mening är det Skärrad AB som driver butiken. Handelsnamnet är ingen
      juridisk person och kan inte ingå avtal. Byt till:

      > Termerna "vi", "oss" och "vår" avser Skärrad AB, organisationsnummer
      > 559550-6444, som driver Kallsups webbshop.

      "Kallsups webbshop" förekommer på 7 ställen. Kvar får det stå där det
      syftar på själva butiken, exempelvis i avsnitt 9 om Shopify.

- [ ] **Adressen saknar fortfarande postnummer och ort.** Står som
      "Karlsgatan 12A". Se även konflikten med integritetspolicyn nedan.

- [ ] **Telefonnumret är fortfarande felformaterat**: `+4673 816 24 89` ska
      vara `+46 73 816 24 89`.

- [ ] **Avsnitt 22 pekar fortfarande ut amerikanska domstolar.** Ordagrant:
      "regleras av och tolkas i enlighet med federala och statliga eller
      territoriella domstolar i den jurisdiktion där Skärrad AB har sitt
      huvudkontor." Sverige har inga sådana domstolar. Förslag på ersättning
      finns i `anvandarvillkor-granskning.md`.

- [ ] **Samma amerikanska kvarlevor på två ställen till:** avsnitt 6 ("brott
      mot federala och statliga lagar om immateriell egendom") och avsnitt 13
      ("internationella, federala, provinsiella eller statliga bestämmelser").

- [ ] **Ingen reservation för tvingande konsumenträtt.** Sökning efter
      "tvingande" ger noll träffar. Avsnitt 16 och 17 friskriver i praktiken
      allt ansvar, vilket är overksamt mot konsumenter men ger fel intryck.

- [ ] **Varken ARN eller svensk rätt nämns någonstans** i villkoren.

- [ ] **`[agentnamn]` står kvar** i avsnitt 14.4.

- [ ] **Oöversatta `AND` på fyra ställen** — rubrikerna till avsnitt 1, 4 och
      12, samt "I BEFINTLIGT SKICK AND I MÅN AV TILLGÄNGLIGHET" i avsnitt 16.

- [ ] **Oöversatta `OR` på tre ställen** i avsnitt 16 och 17: "UTTRYCKLIGA OR
      UNDERFÖRSTÅDDA", "SÄKER OR FELFRI", "TJÄNSTERNA OR NÅGON PRODUKT".

---

## Returpolicy — här finns de allvarligaste problemen

Policyn ger 30 dagars öppet köp och ni skickar returfraktsedel, alltså betalar
ni returfrakten. Generöst och helt i sin ordning. Problemet är att samma
villkor tillämpas på den **lagstadgade ångerrätten**, och där får de inte
gälla.

- [ ] **"Tyvärr kan vi inte acceptera returer av rea-artiklar eller
      presentkort."** Rea-artiklar omfattas av ångerrätten enligt
      distansavtalslagen. Villkoret är overksamt och riskerar att läsas som
      vilseledande. Undanta bara det lagen faktiskt undantar.

- [ ] **Kravet på oanvänt skick tillämpas även på ångerrätten.** Avsnittet om
      ångerfrist säger uttryckligen: "Precis som ovan måste artikeln vara i
      samma skick som du fick den i, oanvänd, med alla lappar kvar och i sin
      originalförpackning."

      Vid ångerrätt får konsumenten undersöka varan i den omfattning som
      behövs för att fastställa dess egenskaper och funktion, ungefär som i en
      butik. Ni får göra avdrag för värdeminskning om varan hanterats mer än
      så — men ni får inte vägra ångerrätten. En provad t-shirt ger alltså
      inte rätt att neka retur.

- [ ] **Kravet på kvitto vid ångerrätt.** Ni har ordern registrerad i Shopify.
      Att kräva kvitto som förutsättning är strängare än lagen medger.

- [ ] **Kravet på föregående returbegäran.** "Artiklar som skickas tillbaka
      till oss utan att retur först har begärts accepteras inte." För
      ångerrätten räcker ett otvetydigt meddelande från kunden. Behåll gärna
      rutinen som uppmaning, men den kan inte vara ett villkor för att
      ångerrätten ska gälla.

- [ ] **Ångerfristens startpunkt saknas.** Texten säger 14 dagar men inte från
      när. Fristen löper från den dag kunden fick varan i sin besittning.

- [ ] **Återbetalning "inom 10 arbetsdagar" efter godkänd retur.**
      Distansavtalslagen kräver återbetalning utan onödigt dröjsmål och senast
      14 dagar från att ni tagit emot ångermeddelandet. 10 arbetsdagar räknat
      från er godkännandeprövning kan lätt passera 14 kalenderdagar. Skriv om
      till kalenderdagar räknat från ångermeddelandet.

- [ ] **Ångerblanketten saknas.** Konsumentverkets standardblankett ska
      tillhandahållas.

- [ ] **Reklamationsrätten nämns inte.** Tre år enligt konsumentköplagen, med
      omvänd bevisbörda de första två. Ångerrätt och reklamation är olika
      saker och kunden ska kunna se båda.

- [ ] **ARN nämns inte.**

- [ ] **Undantagslistan är Shopify-boilerplate.** Färskvaror, blommor, växter,
      livsmedel, skönhetsprodukter, lättantändliga vätskor och gaser — inget av
      det säljer ni. Stryk det som inte är relevant; en lista med uppenbart
      irrelevanta undantag får kunden att tvivla på resten.

---

## Integritetspolicy

- [ ] **Fel personuppgiftsansvarig.** Policyn anger "Kallsups webbshop". GDPR
      artikel 13 kräver den personuppgiftsansvariges identitet, alltså den
      juridiska personen: Skärrad AB, organisationsnummer 559550-6444.

- [ ] **Adressen krockar med användarvillkoren.**

      | Dokument | Adress |
      | --- | --- |
      | Integritetspolicy | Åbylundsgatan 3, 702 32 Örebro, Sverige |
      | Användarvillkor | Karlsgatan 12A |

      Två olika adresser för samma bolag i två dokument som båda är juridiskt
      bindande. Bestäm vilken som är bolagets adress och använd den överallt,
      inklusive i sajtens footer.

- [ ] **IMY namnges inte.** Policyn hänvisar till "tillsynsmyndighet" i
      allmänna ordalag. Svenska kunder ska kunna se vart de vänder sig:
      Integritetsskyddsmyndigheten.

- [ ] **Inga lagringstider.** Sökning efter "behåller", "lagras",
      "lagringstid" och "så länge" ger inga träffar i den betydelsen. GDPR
      artikel 13.2 a kräver att lagringsperioden anges, eller kriterierna för
      att bestämma den.

- [ ] **Klickspårningen på kallsup.se saknas.** Tabellen `ticket_clicks`
      lagrar `referrer` och `user_agent` när någon klickar på en biljettlänk.
      Det sker utanför Shopify och täcks därför inte av den här policyn — det
      hör hemma i sajtens egen integritetspolicy, tillsammans med Vercels
      cookiefria analys.

---

## Sammanfattning

Ingen av de fyra är klar, men allvarlighetsgraden skiljer sig.

**Returpolicyn är den som faktiskt kan ge problem.** Den innehåller fyra
villkor som inte håller mot ångerrätten, och det är sådant Konsumentverket
tittar på. Rätta den först.

**Användarvillkoren är halvvägs.** De två farliga felen är borta. Det som
återstår gör dokumentet juridiskt skevt snarare än riskabelt, men
avtalspartsfrågan bör lösas innan första ordern.

**Integritetspolicyns adresskrock** är liten att rätta men pinsam att bli
påkommen med — två bindande dokument som anger olika adress för samma bolag.

**Fraktpolicyn** behöver bara sitt inledande avsnitt tillbaka.
