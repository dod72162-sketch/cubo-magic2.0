import { forwardRef, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// local face: outward normal, position on the cubelet, rotation to orient the
// sticker outward, the color index it reads, and its logical face key.
const FACES = [
  { n: [1, 0, 0], pos: [0.481, 0, 0], rot: [0, Math.PI / 2, 0], ci: 0, key: "R" },
  { n: [-1, 0, 0], pos: [-0.481, 0, 0], rot: [0, -Math.PI / 2, 0], ci: 1, key: "L" },
  { n: [0, 1, 0], pos: [0, 0.481, 0], rot: [-Math.PI / 2, 0, 0], ci: 2, key: "U" },
  { n: [0, -1, 0], pos: [0, -0.481, 0], rot: [Math.PI / 2, 0, 0], ci: 3, key: "D" },
  { n: [0, 0, 1], pos: [0, 0, 0.481], rot: [0, 0, 0], ci: 4, key: "F" },
  { n: [0, 0, -1], pos: [0, 0, -0.481], rot: [0, Math.PI, 0], ci: 5, key: "B" },
];

function roundedRectGeom(size = 0.82, radius = 0.13) {
  const shape = new THREE.Shape();
  const w = size;
  const h = size;
  const r = radius;
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ShapeGeometry(shape, 10);
}

const Cubelet = forwardRef(({ colors, skin }, ref) => {
  const geo = useMemo(() => roundedRectGeom(), []);
  const transparent = !!skin.transparent;
  return (
    <group ref={ref}>
      <RoundedBox
        args={[0.94, 0.94, 0.94]}
        radius={0.1}
        smoothness={4}
        castShadow
        receiveShadow
        userData={{ isBody: true }}
      >
        <meshStandardMaterial
          color={skin.body}
          roughness={skin.roughness + 0.08}
          metalness={skin.metalness}
          transparent={transparent}
          opacity={transparent ? Math.min(skin.opacity + 0.1, 1) : 1}
        />
      </RoundedBox>
      {FACES.map((f, idx) => {
        const col = colors[f.ci];
        if (!col) return null;
        return (
          <mesh
            key={idx}
            geometry={geo}
            position={f.pos}
            rotation={f.rot}
            userData={{
              isSticker: true,
              faceKey: f.key,
              localNormal: new THREE.Vector3(f.n[0], f.n[1], f.n[2]),
              baseColor: new THREE.Color(col),
            }}
          >
            <meshStandardMaterial
              color={col}
              roughness={skin.roughness}
              metalness={skin.metalness}
              emissive={new THREE.Color(col)}
              emissiveIntensity={0}
              transparent={transparent}
              opacity={transparent ? skin.opacity : 1}
            />
          </mesh>
        );
      })}
    </group>
  );
});

export default Cubelet;
