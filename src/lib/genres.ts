// Los géneros de IGDB vienen en inglés
const GENRES: Record<string, string> = {
  Adventure: "Aventura",
  Arcade: "Arcade",
  "Card & Board Game": "Cartas y tablero",
  Fighting: "Lucha",
  "Hack and slash/Beat 'em up": "Hack and slash",
  Indie: "Indie",
  MOBA: "MOBA",
  Music: "Música",
  Pinball: "Pinball",
  Platform: "Plataformas",
  "Point-and-click": "Point and click",
  Puzzle: "Puzles",
  "Quiz/Trivia": "Preguntas",
  Racing: "Carreras",
  "Real Time Strategy (RTS)": "Estrategia en tiempo real",
  "Role-playing (RPG)": "Rol (RPG)",
  Shooter: "Disparos",
  Simulator: "Simulación",
  Sport: "Deportes",
  Strategy: "Estrategia",
  Tactical: "Táctico",
  "Turn-based strategy (TBS)": "Estrategia por turnos",
  "Visual Novel": "Novela visual",
};

export const genreName = (g: string) => GENRES[g] ?? g;
