import Main from "./components/Main";
import GigList from "./components/GigList";
import Contact from "./components/Contact";
import Background from "./components/Background";

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
