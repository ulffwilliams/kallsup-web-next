import Background from "../_components/Background";
import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";

/**
 * Chrome for every merch route. The front page carries its own because it
 * opens with the hero; these three pages would otherwise repeat this wrapper
 * verbatim.
 *
 * `min-h-dvh` with a growing main is what keeps the footer at the bottom of a
 * short page — an empty category is barely two rows tall, and without it the
 * footer lands mid-screen with the fixed background showing underneath.
 */
export default function MerchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
