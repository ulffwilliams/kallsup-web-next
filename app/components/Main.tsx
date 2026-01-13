import handleSmoothScroll from "./handleSmoothScroll";
function Main() {
  return (
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
  );
}

export default Main;
