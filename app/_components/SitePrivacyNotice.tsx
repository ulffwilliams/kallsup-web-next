import { company } from "../_lib/site";

/**
 * Addendum shown under Shopify's privacy policy on
 * `/villkor/integritetspolicy`.
 *
 * Shopify's text describes what happens inside Shopify. It says nothing about
 * what kallsup.se does on its own — the cart cookie this site sets, the click
 * statistics in our own database, or the analytics that run on the page. That
 * processing has the same controller and needs the same disclosure, so it
 * lives here, next to the code that causes it.
 *
 * Whoever changes that code changes this text in the same commit.
 */
function SitePrivacyNotice() {
  return (
    <section
      aria-labelledby="kallsup-se-behandling"
      className="policy-prose mb-14 max-w-prose border-b border-kall-700 pb-10"
    >
      <h2 id="kallsup-se-behandling">Behandling på kallsup.se</h2>

      <p>
        Det här avsnittet gäller den här webbplatsen. Texten längre ned är vår
        butikspolicy och beskriver behandlingen i Shopifys kassa, som ligger på
        Shopifys egen domän.
      </p>

      <h2>Vad vi inte samlar in här</h2>
      <p>
        På kallsup.se lämnar du inga kontaktuppgifter och inga
        betalningsuppgifter. Vi tar inte emot namn, adress, telefonnummer,
        e-postadress, kortnummer eller kontouppgifter någonstans på den här
        sidan. När du lägger något i varukorgen skickas enbart uppgift om
        vilken artikel och vilket antal det gäller till Shopify.
      </p>
      <p>
        Klickar du på <strong>Till kassan</strong> lämnar du kallsup.se och
        fortsätter på Shopifys domän. Det är där du anger dina uppgifter och
        betalar, och det är den behandlingen butikspolicyn nedan beskriver.
        Inga kortuppgifter passerar våra servrar.
      </p>

      <h2>Personuppgiftsansvarig</h2>
      <p>
        {company.legalName}, organisationsnummer {company.orgNumber}, är
        personuppgiftsansvarig för behandlingen på kallsup.se. Kontakta oss på{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a> i frågor om dina
        personuppgifter.
      </p>

      <h2>Varukorgen</h2>
      <p>
        När du lägger något i varukorgen sparar vi en kaka,{" "}
        <strong>kallsup_cart</strong>, i din webbläsare. Den innehåller enbart
        ett id till varukorgen hos Shopify — inga uppgifter om dig. Kakan är
        nödvändig för att varukorgen ska fungera och kräver därför inget
        samtycke. Den är httpOnly, vilket innebär att den inte kan läsas av
        skript i webbläsaren, och den upphör efter 14 dagar.
      </p>

      <h2>Klick på biljettlänkar</h2>
      <p>
        När du klickar på en biljettlänk i spelningslistan registrerar vi vilken
        spelning det gällde, vilken webbläsare klicket kom från
        (webbläsarens user agent) och, i de fall webbläsaren skickar det, vilken
        sida du kom från. Vi sparar <strong>inte</strong> din IP-adress och kan
        inte koppla ett klick till dig som person.
      </p>
      <p>
        Ändamålet är att se vilka spelningar som får uppmärksamhet. Rättslig
        grund är vårt berättigade intresse av att förstå hur sidan används.
        Uppgifterna raderas automatiskt efter 24 månader.
      </p>

      <h2>Besöksstatistik</h2>
      <p>
        Vi använder Vercel Analytics och Vercel Speed Insights för att mäta
        trafik och laddtider. Tjänsterna arbetar utan kakor och utan att bygga
        någon profil av dig. Rättslig grund är vårt berättigade intresse av att
        kunna driva och förbättra sidan.
      </p>

      <h2>Vilka som behandlar uppgifterna åt oss</h2>
      <ul>
        <li>
          <strong>Vercel</strong> — drift av webbplatsen och besöksstatistik
        </li>
        <li>
          <strong>Neon</strong> — databasen där spelningar och klickstatistik
          lagras, med lagring inom EU (Frankfurt)
        </li>
        <li>
          <strong>Shopify</strong> — varukorg, kassa och order, enligt texten
          ovan
        </li>
      </ul>
      <p>
        Samtliga behandlar uppgifter på vårt uppdrag. Sker överföring till land
        utanför EU/EES vilar den på EU-kommissionens standardavtalsklausuler.
      </p>

      <h2>Dina rättigheter</h2>
      <p>
        Du har rätt att begära ett registerutdrag, att få felaktiga uppgifter
        rättade, att få uppgifter raderade, att invända mot behandling som
        vilar på berättigat intresse, och att begära att behandlingen
        begränsas. Hör av dig till{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>.
      </p>
      <p>
        Är du missnöjd med hur vi behandlar dina personuppgifter kan du lämna
        klagomål till Integritetsskyddsmyndigheten, Box 8114, 104 20 Stockholm,{" "}
        <a href="https://www.imy.se">imy.se</a>.
      </p>
    </section>
  );
}

export default SitePrivacyNotice;
