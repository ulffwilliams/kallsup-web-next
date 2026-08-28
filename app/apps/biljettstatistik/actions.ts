"use server";

import { grant, isCorrect } from "./auth";

export async function unlock(_prev: string | null, formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!isCorrect(password)) {
    return "Fel lösenord.";
  }

  await grant();
  return null;
}
