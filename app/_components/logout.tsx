"use client";
import { signOut } from "next-auth/react";
function Logout() {
  return (
    <span
      onClick={() => {
        signOut();
      }}
    >
      Logga ut
    </span>
  );
}

export default Logout;
