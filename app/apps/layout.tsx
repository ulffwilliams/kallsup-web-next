import { getServerSession } from "next-auth";

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
      {children}
    </>
  );
}
