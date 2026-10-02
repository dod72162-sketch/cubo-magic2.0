import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import RubiksCube from "./RubiksCube";
import { useGameStore } from "../../store/gameStore";

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#ffffff", "#d7d7e0", 0.5]} />
      <directionalLight
        castShadow
        position={[6, 9, 6]}
        intensity={1.7}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-6, 6, 6, -6, 0.1, 30]}
        />
      </directionalLight>
      <directionalLight position={[-6, 3, -4]} intensity={0.45} />
      <directionalLight position={[0, -4, -6]} intensity={0.4} color="#ffe9d6" />
    </>
  );
}

export default function RubiksScene() {
  const controlsRef = useRef();
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="scene-wrap">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [5.5, 5, 7], fov: 45 }}
      >
        <PerspectiveCamera
          makeDefault
          fov={45}
          near={0.1}
          far={100}
          position={[5.5, 5, 7]}
        />
        <Suspense fallback={null}>
          <Lighting />
          <RubiksCube controlsRef={controlsRef} />
          <ContactShadows
            position={[0, -2.4, 0]}
            opacity={0.38}
            scale={14}
            blur={2.8}
            far={6}
          />
          <Environment resolution={256}>
            <Lightformer
              intensity={2.2}
              position={[0, 5, 1]}
              scale={[10, 10, 1]}
            />
            <Lightformer
              intensity={1.1}
              position={[5, 2, 5]}
              scale={[8, 8, 1]}
              color="#fff4e6"
            />
            <Lightformer
              intensity={1.0}
              position={[-5, 2, -5]}
              scale={[8, 8, 1]}
              color="#e8f0ff"
            />
          </Environment>
          <EffectComposer disableNormalPass>
            <Bloom
              intensity={0.55}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.2}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          minDistance={6}
          maxDistance={14}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.4}
          maxPolarAngle={Math.PI - 0.4}
          autoRotate={phase === "intro"}
          autoRotateSpeed={1.1}
        />
      </Canvas>
    </div>
  );
}
