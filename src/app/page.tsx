import Link from "next/link";
import Header from "@/components/layout/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <div className="mb-6 text-7xl">
            🪑
          </div>

          <h1 className="text-5xl font-bold tracking-tight">
            Musical Chairs
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Create a game, invite your friends and find out
            who will be the last player standing.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/create"
              className="rounded-xl bg-black px-6 py-3 font-medium text-white"
            >
              Create Game
            </Link>

            <Link
              href="/join"
              className="rounded-xl border bg-white px-6 py-3 font-medium"
            >
              Join Game
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}