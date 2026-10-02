// Cube skins / models. Each skin controls the 6 sticker colors, the plastic
// body color and the material feel (roughness / metalness / translucency).
export const SKINS = [
  {
    id: "classic",
    name: "Clássico",
    body: "#141417",
    roughness: 0.3,
    metalness: 0.0,
    faces: { U: "#fafafa", D: "#ffd500", F: "#00923f", B: "#0051ba", L: "#ff6d00", R: "#c41e3a" },
  },
  {
    id: "love",
    name: "Amor",
    body: "#2a0d1a",
    roughness: 0.26,
    metalness: 0.12,
    faces: { U: "#fff0f4", D: "#ffd1dc", F: "#ff8fab", B: "#ff5d8f", L: "#ff85b3", R: "#e11d48" },
  },
  {
    id: "pastel",
    name: "Pastel",
    body: "#efe7df",
    roughness: 0.52,
    metalness: 0.0,
    faces: { U: "#ffffff", D: "#ffe08a", F: "#9be0b0", B: "#a9c7ff", L: "#ffc49b", R: "#ff9fb0" },
  },
  {
    id: "neon",
    name: "Neon",
    body: "#0a0a12",
    roughness: 0.24,
    metalness: 0.1,
    faces: { U: "#f5f5ff", D: "#f2ff00", F: "#00ff95", B: "#00c2ff", L: "#ff7a00", R: "#ff0062" },
  },
  {
    id: "jewel",
    name: "Joia",
    body: "#101016",
    roughness: 0.12,
    metalness: 0.55,
    faces: { U: "#e9e9f0", D: "#ffcf33", F: "#1fae5a", B: "#2b6fd6", L: "#ff7a1a", R: "#d61f4b" },
  },
  {
    id: "glass",
    name: "Vidro",
    body: "#1a1a22",
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8,
    faces: { U: "#eafff9", D: "#fff4b0", F: "#7bf0c0", B: "#8fd0ff", L: "#ffc08a", R: "#ff8fa3" },
  },
];

export const getSkin = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
