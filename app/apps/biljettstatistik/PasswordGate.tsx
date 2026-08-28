"use client";

import Link from "next/link";
import { useActionState } from "react";

import { unlock } from "./actions";

export default function PasswordGate() {
  const [error, formAction, pending] = useActionState(unlock, null);

  return (
    <main className="shell py-12">
      <Link href="/apps" className="type-label">
        ← Verktygslådan
      </Link>

      <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-kall-cream italic">
        Biljettstatistik
      </h1>

      <form action={formAction} className="mt-8 flex max-w-xs flex-col gap-3">
        <label className="type-label" htmlFor="password">
          Lösenord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          className="border-b border-kall-600 bg-transparent py-2 text-kall-cream outline-none focus:border-kall-cream"
        />
        <button
          type="submit"
          disabled={pending}
          className="type-label mt-2 self-start border border-kall-600 px-4 py-2 text-kall-cream disabled:opacity-50"
        >
          {pending ? "Kollar…" : "Visa statistik"}
        </button>

        {error && <p className="type-meta text-kall-cream">{error}</p>}
      </form>
    </main>
  );
}
