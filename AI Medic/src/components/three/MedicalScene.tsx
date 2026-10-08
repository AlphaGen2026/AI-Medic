import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

export type MedicalVariant = "capsule" | "heart" | "cross" | "molecule" | "beacon";

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => (
  <meshStandardMaterial color={color} roughness={0.15} metalness={0.5} emissive={color} emissiveIntensity={0.2} {...extra} />
);

/** Two-tone pill capsule with orbiting tablets. */
function Capsule() {
  const ref = useRef<THREE.Group>(null);
  useFrame((s, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * 0.5;
    ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.6) * 0.35 + 0.6;
  });
  return (
    <group>
      <group ref={ref}>
        <mesh position={[0, 0.55, 0]}><capsuleGeometry args={[0.55, 1.1, 12, 32]} />{mat("#3fc6e0")}</mesh>
        <mesh position={[0, -0.55, 0]}><capsuleGeometry args={[0.56, 1.1, 12, 32]} />{mat("#f2f6fa", { emissiveIntensity: 0.05 })}</mesh>
      </group>
      {[0, 1, 2, 3, 4].map((i) => (
        <Float key={i} speed={1.5} floatIntensity={1.2}>
          <mesh position={[Math.cos(i * 1.25) * 2.2, Math.sin(i * 2) * 1.3, Math.sin(i * 1.25) * 1.2]} rotation={[1.2, i, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 24]} />{mat(i % 2 ? "#5ee0b0" : "#ffffff", { emissiveIntensity: 0.08 })}
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** Beating heart built from spheres + cone, with pulse ring. */
function Heart() {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const beat = 1 + Math.max(0, Math.sin(t * 5)) ** 8 * 0.12;
    if (ref.current) { ref.current.scale.setScalar(beat); ref.current.rotation.y = Math.sin(t * 0.5) * 0.6; }
    if (ring.current) {
      const p = (t * 0.8) % 1;
      ring.current.scale.setScalar(1 + p * 2.2);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - p);
    }
  });
  return (
    <group>
      <group ref={ref}>
        <mesh position={[-0.45, 0.35, 0]}><sphereGeometry args={[0.62, 32, 32]} />{mat("#e5485b")}</mesh>
        <mesh position={[0.45, 0.35, 0]}><sphereGeometry args={[0.62, 32, 32]} />{mat("#e5485b")}</mesh>
        <mesh position={[0, -0.45, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[1.02, 1.5, 32]} />{mat("#d93a4e")}</mesh>
      </group>
      <mesh ref={ring} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1, 0.02, 8, 64]} />
        <meshBasicMaterial color="#ff8a99" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/** Layered glass medical cross. */
function Cross() {
  const ref = useRef<THREE.Group>(null);
  useFrame((s, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * 0.4;
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.5) * 0.25;
  });
  return (
    <group ref={ref}>
      {[0, 1].map((k) => (
        <group key={k} position={[0, 0, k * -0.5]} scale={1 - k * 0.15}>
          <mesh><boxGeometry args={[0.7, 2.2, 0.4]} />{mat(k ? "#5ee0b0" : "#3fc6e0", { transparent: true, opacity: k ? 0.5 : 0.95 })}</mesh>
          <mesh><boxGeometry args={[2.2, 0.7, 0.4]} />{mat(k ? "#5ee0b0" : "#3fc6e0", { transparent: true, opacity: k ? 0.5 : 0.95 })}</mesh>
        </group>
      ))}
      <mesh rotation-x={Math.PI / 2}><torusGeometry args={[1.7, 0.03, 8, 80]} />{mat("#9fd7e8")}</mesh>
    </group>
  );
}

/** Bio-molecule cluster: atoms with bonds. */
function Molecule() {
  const ref = useRef<THREE.Group>(null);
  const atoms = useMemo(() => [
    [0, 0, 0, 0.45, "#7c8cff"], [1.2, 0.5, 0.2, 0.3, "#5ee0b0"], [-1.1, 0.6, -0.3, 0.32, "#3fc6e0"],
    [0.3, -1.2, 0.4, 0.3, "#5ee0b0"], [-0.4, 0.2, 1.2, 0.26, "#ffffff"], [0.6, 0.9, -1.0, 0.24, "#3fc6e0"],
  ] as [number, number, number, number, string][], []);
  useFrame((_, d) => { if (ref.current) { ref.current.rotation.y += d * 0.35; ref.current.rotation.x += d * 0.12; } });
  return (
    <group ref={ref}>
      {atoms.map(([x, y, z, r, c], i) => (
        <group key={i}>
          <mesh position={[x, y, z]}><sphereGeometry args={[r, 28, 28]} />{mat(c)}</mesh>
          {i > 0 && (() => {
            const v = new THREE.Vector3(x, y, z);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
            return (
              <mesh position={v.clone().multiplyScalar(0.5)} quaternion={q}>
                <cylinderGeometry args={[0.05, 0.05, v.length(), 10]} />{mat("#cfe6ef", { emissiveIntensity: 0 })}
              </mesh>
            );
          })()}
        </group>
      ))}
    </group>
  );
}

/** Emergency beacon: pulsing signal rings over a pin. */
function Beacon() {
  const rings = useRef<THREE.Group>(null);
  const pin = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (pin.current) { pin.current.position.y = Math.sin(t * 1.5) * 0.12; pin.current.rotation.y = t * 0.6; }
    rings.current?.children.forEach((m, i) => {
      const p = (t * 0.5 + i / 3) % 1;
      m.scale.setScalar(0.4 + p * 2.4);
      ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - p);
    });
  });
  return (
    <group>
      <group ref={pin}>
        <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.65, 32, 32]} />{mat("#e5485b")}</mesh>
        <mesh position={[0, -0.45, 0]} rotation-z={Math.PI}><coneGeometry args={[0.55, 1.2, 32]} />{mat("#d93a4e")}</mesh>
        <mesh position={[0, 0.5, 0.62]}><boxGeometry args={[0.16, 0.5, 0.06]} />{mat("#ffffff", { emissiveIntensity: 0.6 })}</mesh>
        <mesh position={[0, 0.5, 0.62]}><boxGeometry args={[0.5, 0.16, 0.06]} />{mat("#ffffff", { emissiveIntensity: 0.6 })}</mesh>
      </group>
      <group ref={rings} position={[0, -1.1, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={-Math.PI / 2}>
            <torusGeometry args={[1, 0.025, 8, 64]} />
            <meshBasicMaterial color="#3fc6e0" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const MAP: Record<MedicalVariant, () => JSX.Element> = { capsule: Capsule, heart: Heart, cross: Cross, molecule: Molecule, beacon: Beacon };

interface Props { variant: MedicalVariant; className?: string; scale?: number }

/** Lightweight decorative 3D medical object for page backgrounds. */
const MedicalScene = ({ variant, className = "", scale = 1 }: Props) => {
  const Obj = MAP[variant];
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 5]} intensity={1.3} />
          <pointLight position={[-4, -2, -3]} intensity={20} color="#5ee0b0" />
          <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
            <group scale={scale}><Obj /></group>
          </Float>
          <Environment>
            <Lightformer intensity={2} position={[0, 5, 2]} scale={[10, 10, 1]} />
            <Lightformer intensity={1} color="#7fd9ef" position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default MedicalScene;
