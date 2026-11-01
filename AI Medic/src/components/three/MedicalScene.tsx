import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Lightformer, Line } from "@react-three/drei";
import { useTheme } from "@/hooks/useTheme";
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

/** Cardiogram pulse running through the heart's center. */
function Ecg() {
  const pts = useMemo(() => {
    const p: [number, number, number][] = [];
    const shape = [[-2.6, 0], [-0.9, 0], [-0.7, 0.15], [-0.5, 0], [-0.3, 0], [-0.15, -0.3], [0, 1.1], [0.15, -0.7], [0.3, 0], [0.6, 0], [0.85, 0.25], [1.1, 0], [2.6, 0]];
    shape.forEach(([x, y]) => p.push([x, y * 0.85, 0.75]));
    return p;
  }, []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts.map((v) => new THREE.Vector3(...v)), false, "catmullrom", 0.05), [pts]);
  const dot = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Group>(null);
  useFrame((s) => {
    const u = (s.clock.elapsedTime * 0.45) % 1;
    dot.current?.position.copy(curve.getPointAt(u));
    trail.current?.children.forEach((c, i) => c.position.copy(curve.getPointAt(Math.max(0, u - (i + 1) * 0.012))));
  });
  return (
    <group>
      <Line points={pts} color="#ffffff" lineWidth={2.5} transparent opacity={0.35} />
      <mesh ref={dot}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <group ref={trail}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i}><sphereGeometry args={[0.065 - i * 0.005, 10, 10]} /><meshBasicMaterial color="#7ff7c8" transparent opacity={0.8 - i * 0.07} /></mesh>
        ))}
      </group>
    </group>
  );
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
      <Ecg />
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

/** Hospital pin over a miniature city; day or night lighting. */
function Beacon({ night = false }: { night?: boolean }) {
  const pin = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const city = useRef<THREE.Group>(null);
  const blds = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; c: string }[] = [];
    const cols = ["#cfd8e3", "#b9c7d6", "#e3e7ee", "#a9bccf", "#d9cfc4"];
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      const r = Math.hypot(i, j);
      if (r < 1.3 || r > 3.4) continue;
      const seed = Math.abs(Math.sin(i * 12.9 + j * 78.2) * 43758.5) % 1;
      if (seed < 0.25) continue;
      out.push({ x: i * 0.62, z: j * 0.62, w: 0.36 + seed * 0.12, h: 0.3 + seed * 1.1, c: cols[Math.floor(seed * 5)] });
    }
    return out;
  }, []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (pin.current) pin.current.position.y = 2.1 + Math.sin(t * 1.6) * 0.12;
    if (pin.current) pin.current.rotation.y = t * 0.8;
    if (city.current) city.current.rotation.y = t * 0.12;
    rings.current?.children.forEach((m, i) => {
      const p = (t * 0.5 + i / 3) % 1;
      m.scale.setScalar(0.5 + p * 2);
      ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - p);
    });
  });
  const win = night ? "#ffd27a" : "#9cc9e8";
  return (
    <group rotation-x={0.45} position={[0, -0.9, 0]} scale={0.95}>
      <group ref={city}>
        <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[2.35, 2.45, 0.1, 64]} />
          <meshStandardMaterial color={night ? "#1d2a3a" : "#9fd6a8"} roughness={0.9} /></mesh>
        <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[0.95, 1.12, 64]} />
          <meshStandardMaterial color={night ? "#3a4656" : "#8a94a3"} /></mesh>
        {blds.map((b, i) => (
          <group key={i} position={[b.x, b.h / 2, b.z]}>
            <mesh><boxGeometry args={[b.w, b.h, b.w]} />
              <meshStandardMaterial color={night ? "#2b3a4f" : b.c} roughness={0.6} /></mesh>
            {[0.25, 0.55, 0.85].filter((f) => f * b.h < b.h - 0.12).map((f, k) => (
              <mesh key={k} position={[0, -b.h / 2 + f * b.h + 0.05, b.w / 2 + 0.002]}>
                <planeGeometry args={[b.w * 0.7, 0.07]} />
                <meshStandardMaterial color={win} emissive={win} emissiveIntensity={night ? 1.6 : 0.1} />
              </mesh>
            ))}
          </group>
        ))}
        {/* trees in day, street lamps at night */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.03, night ? 0.25 : 0.14, Math.sin(a) * 1.03]}>
              <sphereGeometry args={[night ? 0.05 : 0.11, 12, 12]} />
              <meshStandardMaterial color={night ? "#ffe6a3" : "#3f9d5a"} emissive={night ? "#ffcf66" : "#000000"} emissiveIntensity={night ? 2 : 0} />
            </mesh>
          );
        })}
        {/* Hospital at center */}
        <group>
          <mesh position={[0, 0.35, 0]}><boxGeometry args={[1, 0.7, 0.7]} />
            <meshStandardMaterial color={night ? "#e9eef5" : "#ffffff"} emissive={night ? "#8fb3d9" : "#000000"} emissiveIntensity={night ? 0.25 : 0} /></mesh>
          <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.5, 0.3, 0.5]} />
            <meshStandardMaterial color="#f4f7fb" /></mesh>
          <mesh position={[0, 0.48, 0.36]}><boxGeometry args={[0.08, 0.26, 0.02]} />
            <meshStandardMaterial color="#e5485b" emissive="#e5485b" emissiveIntensity={night ? 1.5 : 0.3} /></mesh>
          <mesh position={[0, 0.48, 0.36]}><boxGeometry args={[0.26, 0.08, 0.02]} />
            <meshStandardMaterial color="#e5485b" emissive="#e5485b" emissiveIntensity={night ? 1.5 : 0.3} /></mesh>
          {[-0.33, 0.33].map((x) => (
            <mesh key={x} position={[x, 0.3, 0.355]}><planeGeometry args={[0.18, 0.08]} />
              <meshStandardMaterial color={win} emissive={win} emissiveIntensity={night ? 1.6 : 0.1} /></mesh>
          ))}
        </group>
      </group>
      <group ref={rings} position={[0, 0.03, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={-Math.PI / 2}><ringGeometry args={[0.55, 0.6, 64]} />
            <meshBasicMaterial color="#e5485b" transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>
        ))}
      </group>
      <group ref={pin} scale={0.75}>
        <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.6, 32, 32]} />
          <meshPhysicalMaterial color="#e5485b" clearcoat={1} roughness={0.2} emissive="#7a0f1d" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, -0.4, 0]} rotation-z={Math.PI}><coneGeometry args={[0.52, 1.1, 32]} />
          <meshPhysicalMaterial color="#d93a4e" clearcoat={1} roughness={0.2} /></mesh>
        <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.25, 24, 24]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
    </group>
  );
}

const MAP: Record<MedicalVariant, (p: { night?: boolean }) => JSX.Element> = { capsule: Capsule, heart: Heart, cross: Cross, molecule: Molecule, beacon: Beacon };

interface Props { variant: MedicalVariant; className?: string; scale?: number }

/** Lightweight decorative 3D medical object for page backgrounds. */
const MedicalScene = ({ variant, className = "", scale = 1 }: Props) => {
  const Obj = MAP[variant];
  const night = useTheme().theme === "dark";
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={night && variant === "beacon" ? 0.25 : 0.6} />
          <directionalLight position={[4, 6, 5]} intensity={night && variant === "beacon" ? 0.35 : 1.3} color={night && variant === "beacon" ? "#9fb4ff" : "#ffffff"} />
          <pointLight position={[-4, -2, -3]} intensity={20} color="#5ee0b0" />
          <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
            <group scale={scale}><Obj night={night} /></group>
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
