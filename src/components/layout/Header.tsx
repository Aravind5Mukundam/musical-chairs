import {
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
} from "@clerk/nextjs";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-bold"
        >
          🎵 Musical Chairs
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton>
              <button className="rounded-lg border px-4 py-2 text-sm">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton>
              <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                Sign Up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
