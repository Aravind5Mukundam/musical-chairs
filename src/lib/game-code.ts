const CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGameCode(
  length = 6
): string {
  let result = "";

  for (let i = 0; i < length; i++) {
    const index = Math.floor(
      Math.random() * CHARACTERS.length
    );

    result += CHARACTERS[index];
  }

  return result;
}