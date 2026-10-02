import { useRef, useEffect, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CubeEngine, MOVE_DEFS } from "../../game/cubeEngine";
import Cubelet from "./Cubelet";
import { useGameStore } from "../../store/gameStore";
import { moveBus } from "../../game/moveBus";
import { getSkin } from "../../game/skins";
import { playClack, playChime, playCelebration } from "../../game/sound";

const SPACING = 1.0;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function dominantFace(v) {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  if (ax >= ay && ax >= az) return v.x > 0 ? "R" : "L";
  if (ay >= ax && ay >= az) return v.y > 0 ? "U" : "D";
  return v.z > 0 ? "F" : "B";
}

function roundAxis(v) {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  if (ax >= ay && ax >= az) return new THREE.Vector3(Math.sign(v.x), 0, 0);
  if (ay >= ax && ay >= az) return new THREE.Vector3(0, Math.sign(v.y), 0);
  return new THREE.Vector3(0, 0, Math.sign(v.z));
}

export default function RubiksCube({ controlsRef }) {
  const engine = useRef(new CubeEngine()).current;
  const groups = useRef([]);
  const cubeGroup = useRef();
  const { camera, gl } = useThree();

  const setPhase = useGameStore((s) => s.setPhase);
  const incMoves = useGameStore((s) => s.incMoves);
  const setCompletedFaces = useGameStore((s) => s.setCompletedFaces);
  const phase = useGameStore((s) => s.phase);
  const skinId = useGameStore((s) => s.skinId);
  const skin = getSkin(skinId);

  const queue = useRef([]);
  const anim = useRef(null);
  const scrambling = useRef(false);
  const inputEnabled = useRef(false);
  const hasScrambled = useRef(false);
  const completedSet = useRef(new Set());
  const victory = useRef(false);
  const drag = useRef(null);
  const pulse = useRef(0);
  const scrambleKeys = useRef([]);

  const tmp = useMemo(
    () => ({
      m4: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      wn: new THREE.Vector3(),
      axisVec: new THREE.Vector3(),
      camTarget: new THREE.Vector3(0, 0, 5.4),
    }),
    []
  );

  const setGroupFromEngine = useCallback(
    (i) => {
      const c = engine.cubelets[i];
      const g = groups.current[i];
      if (!g) return;
      g.position.set(c.pos[0] * SPACING, c.pos[1] * SPACING, c.pos[2] * SPACING);
      const o = c.orient;
      tmp.m4.set(
        o[0][0], o[0][1], o[0][2], 0,
        o[1][0], o[1][1], o[1][2], 0,
        o[2][0], o[2][1], o[2][2], 0,
        0, 0, 0, 1
      );
      g.quaternion.setFromRotationMatrix(tmp.m4);
    },
    [engine, tmp]
  );

  useEffect(() => {
    for (let i = 0; i < 27; i++) setGroupFromEngine(i);
  }, [setGroupFromEngine]);

  // Live skin change — recolor materials & engine without resetting cube state.
  useEffect(() => {
    const sk = getSkin(skinId);
    engine.setPalette(sk.faces);
    if (cubeGroup.current) {
      cubeGroup.current.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        if (o.userData.isSticker) {
          const col = sk.faces[o.userData.faceKey];
          o.material.color.set(col);
          o.material.emissive.set(col);
          o.material.roughness = sk.roughness;
          o.material.metalness = sk.metalness;
          o.material.transparent = !!sk.transparent;
          o.material.opacity = sk.transparent ? sk.opacity : 1;
          o.userData.baseColor = new THREE.Color(col);
          o.material.needsUpdate = true;
        } else if (o.userData.isBody) {
          o.material.color.set(sk.body);
          o.material.roughness = sk.roughness + 0.08;
          o.material.metalness = sk.metalness;
          o.material.transparent = !!sk.transparent;
          o.material.opacity = sk.transparent ? Math.min(sk.opacity + 0.1, 1) : 1;
          o.material.needsUpdate = true;
        }
      });
    }
  }, [skinId, engine]);

  // Scramble once, when the game starts.
  useEffect(() => {
    if (phase === "playing" && !hasScrambled.current) {
      hasScrambled.current = true;
      scrambling.current = true;
      inputEnabled.current = false;
      const keys = engine.randomScrambleKeys(26);
      scrambleKeys.current = keys;
      keys.forEach((k) =>
        queue.current.push({ ...MOVE_DEFS[k], count: false, fast: true })
      );
    }
  }, [phase, engine]);

  // Debug/QA hook: drive moves and auto-solve (reverse the scramble).
  useEffect(() => {
    const inv = (k) => (k.endsWith("'") ? k.slice(0, -1) : k + "'");
    window.__cube = {
      move: (k) => queue.current.push({ ...MOVE_DEFS[k], count: true, fast: false }),
      solve: () => {
        const keys = scrambleKeys.current;
        for (let i = keys.length - 1; i >= 0; i--)
          queue.current.push({ ...MOVE_DEFS[inv(keys[i])], count: true, fast: false });
      },
      state: () => ({
        solved: engine.isSolved(),
        moves: useGameStore.getState().moves,
        inputEnabled: inputEnabled.current,
        scrambling: scrambling.current,
        queued: queue.current.length,
      }),
    };
    return () => {
      delete window.__cube;
    };
  }, [engine]);

  const handleMove = useCallback(
    (key) => {
      if (!inputEnabled.current) return;
      if (useGameStore.getState().phase !== "playing") return;
      const def = MOVE_DEFS[key];
      if (!def) return;
      queue.current.push({ ...def, count: true, fast: false });
    },
    []
  );

  useEffect(() => {
    const off = moveBus.on(handleMove);
    const onKey = (e) => {
      const map = { r: "R", l: "L", u: "U", d: "D", f: "F", b: "B" };
      const base = map[e.key.toLowerCase()];
      if (base) handleMove(e.shiftKey ? base + "'" : base);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      off();
      window.removeEventListener("keydown", onKey);
    };
  }, [handleMove]);

  const triggerWin = useCallback(() => {
    inputEnabled.current = false;
    victory.current = true;
    if (useGameStore.getState().soundEnabled) {
      playChime();
      setTimeout(() => {
        if (useGameStore.getState().soundEnabled) playCelebration();
      }, 350);
    }
    setPhase("celebrating");
    setTimeout(() => setPhase("completed"), 2600);
  }, [setPhase]);

  const startAnim = useCallback(
    (entry) => {
      const ai = { x: 0, y: 1, z: 2 }[entry.axis];
      const idxs = [];
      for (let i = 0; i < 27; i++)
        if (engine.cubelets[i].pos[ai] === entry.layer) idxs.push(i);
      const axisVec = new THREE.Vector3(
        entry.axis === "x" ? 1 : 0,
        entry.axis === "y" ? 1 : 0,
        entry.axis === "z" ? 1 : 0
      );
      const starts = idxs.map((i) => ({
        i,
        pos: groups.current[i].position.clone(),
        quat: groups.current[i].quaternion.clone(),
      }));
      anim.current = {
        entry,
        axisVec,
        starts,
        target: entry.dir * (Math.PI / 2),
        elapsed: 0,
        duration: entry.fast ? 0.12 : 0.26,
      };
    },
    [engine]
  );

  const commit = useCallback(
    (a) => {
      engine.applyMove(a.entry.axis, a.entry.layer, a.entry.dir);
      for (const s of a.starts) setGroupFromEngine(s.i);

      if (!a.entry.fast && useGameStore.getState().soundEnabled) playClack();

      const cf = engine.completedFaces();
      completedSet.current = new Set(cf);
      setCompletedFaces(cf);

      if (a.entry.count && !scrambling.current) incMoves();

      if (scrambling.current && queue.current.length === 0) {
        scrambling.current = false;
        inputEnabled.current = true;
        useGameStore.getState().setReady(true);
      }

      if (!scrambling.current && inputEnabled.current && engine.isSolved()) {
        triggerWin();
      }
    },
    [engine, setGroupFromEngine, setCompletedFaces, incMoves, triggerWin]
  );

  const updateGlow = useCallback(() => {
    if (!cubeGroup.current) return;
    const glowAll = victory.current;
    const p = 0.5 + 0.5 * Math.sin(pulse.current * 5);
    cubeGroup.current.traverse((o) => {
      if (!o.userData || !o.userData.isSticker) return;
      tmp.wn.copy(o.userData.localNormal).applyQuaternion(o.parent.quaternion);
      const fk = dominantFace(tmp.wn);
      const glowing = glowAll || completedSet.current.has(fk);
      const target = glowing ? (glowAll ? 1.4 : 0.45 + 0.4 * p) : 0.0;
      o.material.emissiveIntensity +=
        (target - o.material.emissiveIntensity) * 0.12;
    });
  }, [tmp]);

  useFrame((_, delta) => {
    pulse.current += delta;

    if (!anim.current && queue.current.length > 0) {
      startAnim(queue.current.shift());
    }

    if (anim.current) {
      const a = anim.current;
      a.elapsed += delta;
      const t = Math.min(a.elapsed / a.duration, 1);
      const ang = a.target * easeInOut(t);
      tmp.q.setFromAxisAngle(a.axisVec, ang);
      for (const s of a.starts) {
        const g = groups.current[s.i];
        g.quaternion.copy(tmp.q).multiply(s.quat);
        g.position.copy(s.pos).applyAxisAngle(a.axisVec, ang);
      }
      if (t >= 1) {
        const finished = anim.current;
        anim.current = null;
        commit(finished);
      }
    }

    updateGlow();

    const ph = useGameStore.getState().phase;
    if (ph === "celebrating" || ph === "completed") {
      if (controlsRef.current) controlsRef.current.enabled = false;
      camera.position.lerp(tmp.camTarget, 0.035);
      camera.lookAt(0, 0, 0);
      if (cubeGroup.current) cubeGroup.current.rotation.y += delta * 0.5;
    }
  });

  // ---- pointer drag to turn a layer ----
  const onPointerMove = useCallback(
    (ev) => {
      const d = drag.current;
      if (!d || d.committed) return;
      const dx = ev.clientX - d.x;
      const dy = ev.clientY - d.y;
      if (Math.hypot(dx, dy) < 10) return;

      const nAxisIdx = d.n.x !== 0 ? 0 : d.n.y !== 0 ? 1 : 2;
      const axes = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
      ];
      const cands = [];
      for (let a = 0; a < 3; a++) {
        if (a === nAxisIdx) continue;
        cands.push(axes[a].clone(), axes[a].clone().multiplyScalar(-1));
      }

      const rect = gl.domElement.getBoundingClientRect();
      const toPx = (v3) => {
        const p = v3.clone().project(camera);
        return new THREE.Vector2(
          (p.x * 0.5 + 0.5) * rect.width,
          (-p.y * 0.5 + 0.5) * rect.height
        );
      };
      const c0 = toPx(d.center);
      const dragV = new THREE.Vector2(dx, dy).normalize();

      let best = null;
      let bestScore = -Infinity;
      for (const cand of cands) {
        const sdir = toPx(d.center.clone().add(cand)).sub(c0);
        if (sdir.length() < 1e-4) continue;
        const score = sdir.normalize().dot(dragV);
        if (score > bestScore) {
          bestScore = score;
          best = cand;
        }
      }
      if (!best) return;

      const rax = roundAxis(new THREE.Vector3().crossVectors(d.n, best));
      const ai = rax.x !== 0 ? 0 : rax.y !== 0 ? 1 : 2;
      const dir = rax.getComponent(ai);
      if (dir === 0) return;
      const axisName = ["x", "y", "z"][ai];
      const layer = d.pos[ai];

      d.committed = true;
      queue.current.push({ axis: axisName, layer, dir, count: true, fast: false });
    },
    [camera, gl]
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (controlsRef.current && useGameStore.getState().phase === "playing")
      controlsRef.current.enabled = true;
  }, [controlsRef, onPointerMove]);

  const onPointerDown = useCallback(
    (e) => {
      if (!inputEnabled.current) return;
      if (useGameStore.getState().phase !== "playing") return;
      e.stopPropagation();
      let grp = e.object;
      while (grp && grp.userData.cubeletIndex === undefined) grp = grp.parent;
      if (!grp || !e.face) return;
      const idx = grp.userData.cubeletIndex;
      const n = roundAxis(
        e.face.normal.clone().transformDirection(e.object.matrixWorld)
      );
      drag.current = {
        idx,
        n,
        x: e.clientX,
        y: e.clientY,
        committed: false,
        pos: [...engine.cubelets[idx].pos],
        center: grp.position.clone(),
      };
      if (controlsRef.current) controlsRef.current.enabled = false;
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [engine, controlsRef, onPointerMove, onPointerUp]
  );

  return (
    <group ref={cubeGroup} onPointerDown={onPointerDown}>
      {Array.from({ length: 27 }).map((_, i) => (
        <Cubelet
          key={i}
          colors={engine.cubelets[i].colors}
          skin={skin}
          ref={(el) => {
            groups.current[i] = el;
            if (el) el.userData.cubeletIndex = i;
          }}
        />
      ))}
    </group>
  );
}
