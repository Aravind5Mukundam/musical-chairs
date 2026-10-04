export async function getGame(
  code: string
) {
  const response = await fetch(
    `/api/games/${code}`,
    {
      cache: "no-store",
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to fetch game"
    );
  }

  return data;
}

export async function startGame(
  code: string
) {
  const response = await fetch(
    `/api/games/${code}/start`,
    {
      method: "POST",
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to start game"
    );
  }

  return data;
}