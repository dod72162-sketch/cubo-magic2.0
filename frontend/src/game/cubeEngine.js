// Pure logic engine for a 3x3 Rubik's Cube.
// Source of truth: 27 cubelets, each with grid position + integer orientation matrix.
// Solved detection / completed faces are derived from this logical state only.

export const FACE_COLORS = {
  U: "#fafafa", // white  (top / +y)
  D: "#ffd500", // yellow (bottom / -y)
  F: "#00923f", // green  (front / +z)
  B: "#0051ba", // blue   (back / -z)
  L: "#ff6d00", // orange (left / -x)
  R: "#c41e3a", // red    (right / +x)
};

const AXIS_INDEX = { x: 0, y: 1, z: 2 };

// dir = +1 => +90deg about +axis, dir = -1 => -90deg about +axis
function rotMatrix(axis, dir) {
  const c = 0;
  const s = dir;
  if (axis === "x") return [[1, 0, 0], [0, c, -s], [0, s, c]];
  if (axis === "y") return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}

function mv(m, v) {
  return [
    Math.round(m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2]),
    Math.round(m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2]),
    Math.round(m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]),
  ];
}

function mm(a, b) {
  const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += a[i][k] * b[k][j];
      r[i][j] = Math.round(s);
    }
  return r;
}

function transpose(m) {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
}

function faceIndex(v) {
  if (v[0] === 1) return 0;
  if (v[0] === -1) return 1;
  if (v[1] === 1) return 2;
  if (v[1] === -1) return 3;
  if (v[2] === 1) return 4;
  return 5;
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const WORLD_DIRS = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];

const WORLD_FACES = [
  { dir: [1, 0, 0], name: "D" },
  { dir: [-1, 0, 0], name: "E" },
  { dir: [0, 1, 0], name: "T" },
  { dir: [0, -1, 0], name: "B" },
  { dir: [0, 0, 1], name: "F" },
  { dir: [0, 0, -1], name: "T" },
];

// Standard face-turn definitions. dir is the integer rotation sign about the +axis.
export const MOVE_DEFS = {
  R: { axis: "x", layer: 1, dir: -1 },
  "R'": { axis: "x", layer: 1, dir: 1 },
  L: { axis: "x", layer: -1, dir: 1 },
  "L'": { axis: "x", layer: -1, dir: -1 },
  U: { axis: "y", layer: 1, dir: -1 },
  "U'": { axis: "y", layer: 1, dir: 1 },
  D: { axis: "y", layer: -1, dir: 1 },
  "D'": { axis: "y", layer: -1, dir: -1 },
  F: { axis: "z", layer: 1, dir: -1 },
  "F'": { axis: "z", layer: 1, dir: 1 },
  B: { axis: "z", layer: -1, dir: 1 },
  "B'": { axis: "z", layer: -1, dir: -1 },
};

function colorsFor(home, faces) {
  const [x, y, z] = home;
  return [
    x === 1 ? faces.R : null,
    x === -1 ? faces.L : null,
    y === 1 ? faces.U : null,
    y === -1 ? faces.D : null,
    z === 1 ? faces.F : null,
    z === -1 ? faces.B : null,
  ];
}

export class CubeEngine {
  constructor(faces = FACE_COLORS) {
    this.faces = faces;
    this.reset();
  }

  reset() {
    this.cubelets = [];
    let id = 0;
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          this.cubelets.push({
            id: id++,
            home: [x, y, z],
            pos: [x, y, z],
            orient: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            colors: colorsFor([x, y, z], this.faces),
          });
        }
  }

  // swap the palette without disturbing cube state (solved-ness is preserved
  // because every sticker of a given face recolors consistently)
  setPalette(faces) {
    this.faces = faces;
    for (const c of this.cubelets) c.colors = colorsFor(c.home, faces);
  }

  applyMove(axis, layer, dir) {
    const Rm = rotMatrix(axis, dir);
    const ai = AXIS_INDEX[axis];
    for (const c of this.cubelets) {
      if (c.pos[ai] === layer) {
        c.pos = mv(Rm, c.pos);
        c.orient = mm(Rm, c.orient);
      }
    }
  }

  colorOnWorldDir(c, d) {
    const local = mv(transpose(c.orient), d);
    return c.colors[faceIndex(local)];
  }

  isSolved() {
    for (const d of WORLD_DIRS) {
      let col = null;
      for (const c of this.cubelets) {
        if (dot(c.pos, d) === 1) {
          const cc = this.colorOnWorldDir(c, d);
          if (cc == null) return false;
          if (col == null) col = cc;
          else if (col !== cc) return false;
        }
      }
    }
    return true;
  }

  completedFaces() {
    const res = [];
    for (const { dir, name } of WORLD_FACES) {
      let col = null;
      let ok = true;
      for (const c of this.cubelets) {
        if (dot(c.pos, dir) === 1) {
          const cc = this.colorOnWorldDir(c, dir);
          if (cc == null) {
            ok = false;
            break;
          }
          if (col == null) col = cc;
          else if (col !== cc) {
            ok = false;
            break;
          }
        }
      }
      if (ok && col != null) res.push(name);
    }
    return res;
  }

  // returns the random move keys applied (logic only)
  randomScrambleKeys(n = 26) {
    const keys = Object.keys(MOVE_DEFS);
    const seq = [];
    let lastAxis = null;
    for (let i = 0; i < n; i++) {
      let k;
      let def;
      do {
        k = keys[Math.floor(Math.random() * keys.length)];
        def = MOVE_DEFS[k];
      } while (def.axis === lastAxis);
      lastAxis = def.axis;
      seq.push(k);
    }
    return seq;
  }
}
