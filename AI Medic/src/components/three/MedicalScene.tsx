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

/** Smooth extruded heart with clearcoat, heartbeat pulse and ECG ring. */
function useHeartGeometry() {
  return useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, -1.1);
    sh.bezierCurveTo(-0.2, -0.85, -1.25, -0.25, -1.25, 0.35);
    sh.bezierCurveTo(-1.25, 0.95, -0.75, 1.2, -0.42, 1.2);
    sh.bezierCurveTo(-0.15, 1.2, 0, 0.95, 0, 0.75);
    sh.bezierCurveTo(0, 0.95, 0.15, 1.2, 0.42, 1.2);
    sh.bezierCurveTo(0.75, 1.2, 1.25, 0.95, 1.25, 0.35);
    sh.bezierCurveTo(1.25, -0.25, 0.2, -0.85, 0, -1.1);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.38, bevelSize: 0.3, bevelSegments: 14, curveSegments: 48 });
    g.center();
    g.computeVertexNormals();
    return g;
  }, []);
}

function Heart() {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const geo = useHeartGeometry();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const ph = (t * 1.2) % 1;
    const beat = 1 + Math.exp(-((ph - 0.1) ** 2) / 0.002) * 0.1 + Math.exp(-((ph - 0.3) ** 2) / 0.003) * 0.06;
    if (ref.current) { ref.current.scale.setScalar(beat); ref.current.rotation.y = Math.sin(t * 0.6) * 0.5; }
    if (ring.current) {
      const p = ph;
      ring.current.scale.setScalar(1.3 + p * 1.6);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - p);
    }
  });
  return (
    <group>
      <group ref={ref}>
        <mesh geometry={geo}>
          <meshPhysicalMaterial color="#d6283f" roughness={0.18} metalness={0.05} clearcoat={1} clearcoatRoughness={0.08} sheen={1} sheenColor="#ff9aa8" emissive="#5a0612" emissiveIntensity={0.35} />
        </mesh>
      </group>
      <mesh ref={ring} position={[0, 0, -0.6]}>
        <ringGeometry args={[1, 1.04, 96]} />
        <meshBasicMaterial color="#ff6b80" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Float key={i} speed={2} floatIntensity={1.5}>
          <mesh position={[Math.cos(i * 1.05) * 2.1, Math.sin(i * 1.05) * 1.6, -0.4]}>
            <sphereGeometry args={[0.07 + (i % 3) * 0.03, 16, 16]} />{mat(i % 2 ? "#ff8a99" : "#ffd1d8")}
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** Beveled glossy medical cross with glass halo and orbiting particles. */
function Cross() {
  const ref = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const w = 0.42, l = 1.15, r = 0.12;
    const sh = new THREE.Shape();
    const pts: [number, number][] = [[-w, l], [w, l], [w, w], [l, w], [l, -w], [w, -w], [w, -l], [-w, -l], [-w, -w], [-l, -w], [-l, w], [-w, w]];
    pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.16, bevelSize: r, bevelSegments: 10 });
    g.center();
    return g;
  }, []);
  useFrame((s, d) => {
    if (ref.current) { ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.7) * 0.7; }
    if (orb.current) orb.current.rotation.z += d * 0.6;
  });
  return (
    <group>
      <group ref={ref}>
        <mesh geometry={geo}>
          <meshPhysicalMaterial color="#1fb6d6" roughness={0.12} metalness={0.2} clearcoat={1} clearcoatRoughness={0.05} emissive="#06485a" emissiveIntensity={0.4} />
        </mesh>
        <mesh geometry={geo} position={[0, 0, -0.55]} scale={1.18}>
          <meshPhysicalMaterial color="#9fe9d4" transparent opacity={0.28} roughness={0.05} transmission={0.6} />
        </mesh>
      </group>
      <group ref={orb}>
        <mesh><torusGeometry args={[1.85, 0.025, 8, 100]} />{mat("#9fd7e8")}</mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 1.85, Math.sin(i * Math.PI / 2) * 1.85, 0]}>
            <sphereGeometry args={[0.11, 20, 20]} />{mat(i % 2 ? "#5ee0b0" : "#3fc6e0")}
          </mesh>
        ))}
      </group>
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
