import Background from "./_components/Background";
import SiteHeader from "./_components/SiteHeader";
import SiteFooter from "./_components/SiteFooter";
import Hero from "./_components/Hero";
import SectionSeam from "./_components/SectionSeam";
import GigList from "./_components/GigList";
import Releases from "./_components/Releases";
import Merch from "./_components/Merch";
import Video from "./_components/Video";
import Contact from "./_components/Contact";
import { getUpcomingGigs } from "./_lib/gigs";

/* Regenerates every 5 minutes so publishdate/ticketreleasedate flip within
   5 minutes of Stockholm midnight. Regeneration reads the cached gig catalog,
   not the database — see app/_lib/gigs.ts and docs/gig-cache.md. */
export const revalidate = 300;

export default async function Home() {
  const upcoming = await getUpcomingGigs();

  return (
    <div id="top" className="relative isolate w-full">
      <Background />
      <SiteHeader />

      <main id="main" className="relative z-10">
        <Hero />
        <SectionSeam />
        <GigList upcoming={upcoming} />
        <Merch />
        <Releases />
        <Video />
        <Contact />
      </main>

      <SiteFooter />
    </div>
  );
}
