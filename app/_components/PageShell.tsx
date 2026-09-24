import Background from "./Background";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/**
 * Chrome for every page that is not the front page. The front page carries
 * its own because it opens with the hero.
 *
 * `min-h-dvh` with a growing main is what keeps the footer at the bottom of a
 * short page — an empty category or a one-paragraph policy is barely two rows
 * tall, and without it the footer lands mid-screen with the fixed background
 * showing underneath.
 */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col">
      <Background />
      <SiteHeader />

      <main id="main" className="relative z-10 flex-1">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

export default PageShell;
