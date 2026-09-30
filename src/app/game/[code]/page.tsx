import { notFound } from "next/navigation";

import Lobby from "@/components/game/Lobby";

interface GamePageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function GamePage({
  params,
}: GamePageProps) {
  const { code } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/games/${code}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    notFound();
  }

  const data = await response.json();

  return (
    <Lobby
      initialGame={data.game}
      initialSession={data.session}
      initialPlayers={data.players}
    />
  );
}