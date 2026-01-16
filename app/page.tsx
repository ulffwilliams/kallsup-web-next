import Main from "./_components/Main";
import GigList from "./_components/GigList";
import Contact from "./_components/Contact";
import Background from "./_components/Background";



export default function Home() {
  return (
      <div id="wrapper" className="w-full">
        <Background />
        <Main />
        <GigList />
        <Contact />
      </div>
  );
}
