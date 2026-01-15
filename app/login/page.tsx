"use client";
import { SessionProvider } from "next-auth/react";
import LoginBtn from "./LoginBtn";
export default function Login(session: any) {
  return (
    <SessionProvider session={null}>
      <LoginBtn />
    </SessionProvider>
  );
}
