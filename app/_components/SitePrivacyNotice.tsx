/**
 * Short preface above Shopify's privacy policy on
 * `/villkor/integritetspolicy`.
 *
 * Shopify's text lists card numbers, billing addresses and phone numbers.
 * That is true of its checkout and false of kallsup.se, and a visitor reading
 * top to bottom would otherwise conclude this page collects them. This says
 * what the site does not take, and where the handover happens.
 *
 * The rest — controller, rights, processors — is left to the store policy
 * below rather than stated twice.
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
    </section>
  );
}

export default SitePrivacyNotice;
