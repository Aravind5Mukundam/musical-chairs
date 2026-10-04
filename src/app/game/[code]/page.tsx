import { notFound } from "next/navigation";
import { headers } from "next/headers";

import GameContainer from "@/components/game/GameContainer";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

async function getGame(
  code: string
) {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol ?? "http";
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (host ? `${protocol}://${host}` : null);

  if (!origin) {
    return null;
  }

  const response = await fetch(
    `${origin}/api/games/${code}`,
    {
      cache: "no-store",
      headers: cookie ? { cookie } : undefined,
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function GamePage({
  params,
}: PageProps) {
  const { code } =
    await params;

  const data =
    await getGame(code);

  if (!data) {
    notFound();
  }

  return (
    <GameContainer
  game={data.game}
  session={data.session}
  round={data.round}
  roundPlayers={
    data.roundPlayers
  }
  players={data.players}
/>
  );
}
