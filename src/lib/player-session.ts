const PLAYER_ID_KEY =
  "musical_chairs_player_id";

export function setPlayerId(
  playerId: string
) {
  sessionStorage.setItem(
    PLAYER_ID_KEY,
    playerId
  );
}

export function getPlayerId() {
  return sessionStorage.getItem(
    PLAYER_ID_KEY
  );
}

export function clearPlayerId() {
  sessionStorage.removeItem(
    PLAYER_ID_KEY
  );
}