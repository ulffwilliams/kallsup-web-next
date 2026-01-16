import { getServerSession } from "next-auth";
import Logout from "../_components/logout";
import LoginBtn from "../_components/loginBtn";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    return (
      <>
        <span>Not logged in</span>
        <LoginBtn />
      </>
    );
  }

  return (
    <>
      <nav>
        <span>Logged in as {session.user?.name}</span>
        <Logout />
      </nav>
      {children}
    </>
  );
}
