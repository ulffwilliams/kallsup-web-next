function Contact() {
  return (
    <section id="contact" className="flex items-center justify-start">
      <div
        id="info-container"
        className="bg-kall-black p-5 shadow-md flex flex-col gap-2 ml-8"
      >
        <h2>Kontakt:</h2>
        <p style={{ backgroundColor: "rgb(226, 226, 226)" }} className="text-black">mgmt@kallsup.se</p>
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
  );
}

export default Contact;
