import handleSmoothScroll from "./components/handleSmoothScroll";

export default function Home() {
  return (
    <div id="wrapper" className="w-full">
      <div
        id="background"
        className="bg-[url(/images/7.4.gif)] bg-center bg-cover"
      ></div>
      <main className=" flex flex-col justify-center items-center">
        <img
          src="/images/loggavit.png"
          alt="Kallsup logo"
          className=" w-auto h-50"
        />
        <article id="link-container" className="flex gap-10">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://shop.aloaded.com/sv-se/collections/kallsup?srsltid=AfmBOopUT8BtbM7q-Fn8tiUcALLI8-2nhuV7hTbXJRuq72aaUDisQ7_y&fbclid=PAZXh0bgNhZW0CMTEAAafguvgJmludAR5oFQpeNTpfQiUeyNuJ21KQzDwV8cgassRzSKK2gTJe_i3LFA_aem_20KlWrZOku3Cb4Ns4mMnLA"
          >
            Merch
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://varorecords.bandcamp.com/album/en-sista-r-ddning"
          >
            Köp skivan
          </a>
          <a href="#gigs" onClick={handleSmoothScroll}>
            Gigg
          </a>
          <a href="#contact" onClick={handleSmoothScroll}>
            Kontakt
          </a>
        </article>
        <article id="socials-container" className="flex flex-row gap-6 mt-10">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://open.spotify.com/artist/0lksP63BacYDmZCjWyNWnz"
            className="social-img"
          >
            <img
              src="/images/spotify.png"
              alt="spotify logo"
              className=" size-8"
            />
          </a>

          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.instagram.com/kallsup909/"
            className="social-img"
          >
            <img
              src="/images/instagram.png"
              alt="instagram logo"
              className="size-8"
            />
          </a>

          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.facebook.com/kallsup909/"
            className="social-img"
          >
            <img
              src="/images/facebook.png"
              alt="facebook logo"
              className="size-8"
            />
          </a>
        </article>
      </main>
      <section
        id="gigs"
        className="flex items-center justify-center text-center"
      >
        <div id="gigs-container" className="flex flex-col gap-2 ml-8">
          <h2>Kommande Gigg</h2>
          <ul>
            <li>Inga inbokade gigg just nu. Håll utkik här!</li>
          </ul>
        </div>
      </section>
      <section id="contact" className="flex items-center justify-start">
        <div id="info-container" className="flex flex-col gap-2 ml-8">
          <h2>Kontakt:</h2>
          <p>mgmt@kallsup.se</p>
          <p>
            Eller skicka ett DM på{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.instagram.com/kallsup909/"
              className="underline"
            >
              Instagram
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
