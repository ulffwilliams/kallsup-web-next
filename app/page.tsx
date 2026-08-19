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
import { getUpcomingGigs, getPastGigs } from "./_lib/gigs";

/* Gigs change weekly, not per request. The admin actions revalidate this path
   on write, so edits still show up immediately. */
export const revalidate = 300;

export default async function Home() {
  const [upcoming, past] = await Promise.all([
    getUpcomingGigs(),
    getPastGigs(),
  ]);

  return (
    <div id="top" className="relative isolate w-full">
      <Background />
      <SiteHeader />

      <main id="main" className="relative z-10">
        <Hero nextGig={upcoming[0]} />
        <SectionSeam />
        <GigList upcoming={upcoming} past={past} />
        <Releases />
        <Merch />
        <Video />
        <Contact />
      </main>

      <SiteFooter />
    </div>
  );
}
