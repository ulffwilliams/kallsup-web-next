"use client";
import { useRouter } from "next/navigation";
function LoginBtn() {
  const router = useRouter();
  return (
    <span
      onClick={() => {
        router.push("/login");
      }}
    >
      Logga in
    </span>
  );
}

export default LoginBtn;
