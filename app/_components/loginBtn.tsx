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
      Login
    </span>
  );
}

export default LoginBtn;
