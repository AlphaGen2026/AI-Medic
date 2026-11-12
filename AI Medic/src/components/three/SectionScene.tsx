import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useRef, type ReactNode } from "react";
import * as THREE from "three";

export type SectionKey =
  | "dashboard" | "radiologist" | "advisor" | "patients" | "admin" | "chat" | "aichat"
  | "voiceai" | "profile" | "doctors" | "appointments" | "prescriptions" | "dailyroutine" | "map";

const M = ({ c, e = 0.15, o }: { c: string; e?: number; o?: number }) => (
  <meshPhysicalMaterial color={c} roughness={0.2} metalness={0.35} clearcoat={1} emissive={c} emissiveIntensity={e}
    transparent={o !== undefined} opacity={o ?? 1} />
);

function Spin({ children, speed = 0.5 }: { children: ReactNode; speed?: number }) {
  const r = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (r.current) r.current.rotation.y += Math.min(d, 0.05) * speed; });
  return <group ref={r}>{children}</group>;
}

function Bars() {
  const r = useRef<THREE.Group>(null);
  useFrame((s) => r.current?.children.forEach((m, i) => { m.scale.y = 1 + Math.sin(s.clock.elapsedTime * 1.5 + i) * 0.35; }));
  const cols = ["#3fc6e0", "#5ee0b0", "#7c8cff", "#3fc6e0"];
  return <Spin speed={0.4}><group ref={r} position={[0, -0.6, 0]}>{cols.map((c, i) => (
    <mesh key={i} position={[(i - 1.5) * 0.6, 0.5 + i * 0.15, 0]}><boxGeometry args={[0.42, 1 + i * 0.3, 0.42]} /><M c={c} /></mesh>))}</group></Spin>;
}

function Scan() {
  const p = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (p.current) p.current.position.y = Math.sin(s.clock.elapsedTime * 1.4) * 1; });
  return <group><Spin><mesh><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#3fc6e0" wireframe /></mesh>
    <mesh><sphereGeometry args={[0.6, 32, 32]} /><M c="#7fd9ef" o={0.6} /></mesh></Spin>
    <mesh ref={p} rotation-x={-Math.PI / 2}><ringGeometry args={[1.1, 1.3, 48]} /><meshBasicMaterial color="#5ee0b0" side={THREE.DoubleSide} transparent opacity={0.8} /></mesh></group>;
}

function Brain() {
  const nodes = Array.from({ length: 14 }, (_, i) => {
    const t = i * 2.4, y = 1 - (i / 13) * 2, r = Math.sqrt(1 - y * y);
    return [Math.cos(t) * r * 1.2, y * 1.1, Math.sin(t) * r * 1.2] as [number, number, number];
  });
  return <Spin speed={0.6}><mesh><sphereGeometry args={[0.55, 32, 32]} /><M c="#7c8cff" e={0.4} /></mesh>
    {nodes.map((p, i) => <mesh key={i} position={p}><sphereGeometry args={[0.12, 16, 16]} /><M c={i % 2 ? "#3fc6e0" : "#5ee0b0"} e={0.5} /></mesh>)}
    <mesh><sphereGeometry args={[1.25, 12, 10]} /><meshBasicMaterial color="#7fd9ef" wireframe transparent opacity={0.25} /></mesh></Spin>;
}

function Bubbles() {
  return <group>
    <Float speed={2} floatIntensity={1}><group position={[-0.4, 0.4, 0]}><mesh scale={[1.2, 0.8, 0.4]}><sphereGeometry args={[1, 32, 32]} /><M c="#3fc6e0" /></mesh>
      {[-0.4, 0, 0.4].map((x) => <mesh key={x} position={[x, 0, 0.42]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#fff" /></mesh>)}</group></Float>
    <Float speed={2.5} floatIntensity={1}><mesh position={[0.7, -0.7, -0.3]} scale={[0.8, 0.55, 0.3]}><sphereGeometry args={[1, 32, 32]} /><M c="#5ee0b0" /></mesh></Float>
  </group>;
}

function Chip() {
  return <Spin speed={0.7}><group rotation-x={0.5}><mesh><boxGeometry args={[1.4, 0.25, 1.4]} /><M c="#2b3550" e={0.05} /></mesh>
    <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.8, 0.08, 0.8]} /><M c="#7c8cff" e={0.6} /></mesh>
    {[-0.5, -0.17, 0.17, 0.5].flatMap((v) => [[v, 0.85], [v, -0.85], [0.85, v], [-0.85, v]]).map(([x, z], i) =>
      <mesh key={i} position={[x, 0, z]}><boxGeometry args={[0.12, 0.06, 0.12]} /><M c="#e9c46a" /></mesh>)}</group></Spin>;
}

function Wave() {
  const r = useRef<THREE.Group>(null);
  useFrame((s) => r.current?.children.forEach((m, i) => { m.scale.y = 0.4 + Math.abs(Math.sin(s.clock.elapsedTime * 3 + i * 0.7)) * 1.6; }));
  return <group ref={r}>{Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[(i - 3) * 0.35, 0, 0]}><capsuleGeometry args={[0.1, 0.8, 8, 16]} /><M c={i % 2 ? "#3fc6e0" : "#5ee0b0"} e={0.4} /></mesh>)}</group>;
}

function Stethoscope() {
  return <Spin><group rotation-x={0.3}><mesh position={[0, 0.4, 0]}><torusGeometry args={[0.8, 0.07, 16, 64, Math.PI]} /><M c="#3a4560" e={0.05} /></mesh>
    <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.06, 0.06, 1.3, 16]} /><M c="#3a4560" e={0.05} /></mesh>
    <mesh position={[0, -1, 0]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.35, 0.35, 0.15, 32]} /><M c="#c9d4e2" /></mesh>
    {[-0.8, 0.8].map((x) => <mesh key={x} position={[x, 0.4, 0]}><sphereGeometry args={[0.12, 16, 16]} /><M c="#3fc6e0" /></mesh>)}</group></Spin>;
}

function Calendar() {
  const h = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (h.current) h.current.rotation.z -= Math.min(d, 0.05) * 1.5; });
  return <group rotation-y={-0.4}><mesh><boxGeometry args={[1.6, 1.6, 0.25]} /><M c="#f2f6fa" e={0.05} /></mesh>
    <mesh position={[0, 0.65, 0.02]}><boxGeometry args={[1.62, 0.4, 0.28]} /><M c="#e5485b" /></mesh>
    <group position={[0.75, -0.65, 0.3]}><mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.45, 0.45, 0.12, 32]} /><M c="#3fc6e0" /></mesh>
      <mesh ref={h} position={[0, 0, 0.08]}><boxGeometry args={[0.05, 0.6, 0.03]} /><meshStandardMaterial color="#fff" /></mesh></group></group>;
}

function Bottle() {
  return <Spin><group position={[0, -0.2, 0]}><mesh><cylinderGeometry args={[0.6, 0.6, 1.4, 32]} /><M c="#e9a03b" o={0.85} /></mesh>
    <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.63, 0.63, 0.35, 32]} /><M c="#f2f6fa" e={0.05} /></mesh>
    <mesh><cylinderGeometry args={[0.61, 0.61, 0.6, 32]} /><M c="#ffffff" e={0.05} /></mesh></group>
    <Float speed={3}><mesh position={[1.1, 0.7, 0]} rotation-z={0.8}><capsuleGeometry args={[0.15, 0.3, 8, 16]} /><M c="#5ee0b0" /></mesh></Float></Spin>;
}

function People() {
  const cols = ["#3fc6e0", "#5ee0b0", "#7c8cff"];
  return <Spin speed={0.4}>{cols.map((c, i) => { const a = (i / 3) * Math.PI * 2; return (
    <group key={i} position={[Math.cos(a) * 0.9, -0.3, Math.sin(a) * 0.9]}><mesh position={[0, 0.75, 0]}><sphereGeometry args={[0.3, 24, 24]} /><M c={c} /></mesh>
      <mesh><capsuleGeometry args={[0.32, 0.5, 8, 24]} /><M c={c} /></mesh></group>); })}</Spin>;
}

function Pin() {
  const r = useRef<THREE.Group>(null);
  useFrame((s) => { if (r.current) r.current.position.y = 0.3 + Math.abs(Math.sin(s.clock.elapsedTime * 2)) * 0.4; });
  return <group><mesh position={[0, -1, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[1.4, 48]} /><M c="#5ee0b0" o={0.5} /></mesh>
    <group ref={r}><mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.5, 32, 32]} /><M c="#e5485b" /></mesh>
      <mesh position={[0, -0.45, 0]} rotation-z={Math.PI}><coneGeometry args={[0.43, 0.9, 32]} /><M c="#d93a4e" /></mesh></group></group>;
}

function SunMoon() {
  const r = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (r.current) r.current.rotation.z += Math.min(d, 0.05) * 0.6; });
  return <group><mesh><torusGeometry args={[1.2, 0.06, 16, 64]} /><M c="#7fd9ef" o={0.7} /></mesh>
    <group ref={r}><mesh position={[1.2, 0, 0]}><sphereGeometry args={[0.32, 24, 24]} /><M c="#f5b83d" e={0.7} /></mesh>
      <mesh position={[-1.2, 0, 0]}><sphereGeometry args={[0.25, 24, 24]} /><M c="#c9d4ff" e={0.4} /></mesh></group>
    <mesh><sphereGeometry args={[0.45, 32, 32]} /><M c="#3fc6e0" /></mesh></group>;
}

function Shield() {
  const shape = new THREE.Shape(); shape.moveTo(0, 1); shape.quadraticCurveTo(0.6, 0.85, 0.9, 0.8);
  shape.quadraticCurveTo(0.9, -0.4, 0, -1.1); shape.quadraticCurveTo(-0.9, -0.4, -0.9, 0.8); shape.quadraticCurveTo(-0.6, 0.85, 0, 1);
  return <Spin><mesh><extrudeGeometry args={[shape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6 }]} /><M c="#7c8cff" /></mesh>
    <mesh position={[0, 0.05, 0.4]}><boxGeometry args={[0.18, 0.7, 0.08]} /><meshStandardMaterial color="#fff" /></mesh>
    <mesh position={[0, 0.05, 0.4]}><boxGeometry args={[0.7, 0.18, 0.08]} /><meshStandardMaterial color="#fff" /></mesh></Spin>;
}

function Bust() {
  return <Spin speed={0.4}><mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.5, 32, 32]} /><M c="#3fc6e0" /></mesh>
    <mesh position={[0, -0.6, 0]} scale={[1, 0.7, 0.7]}><sphereGeometry args={[0.9, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#5ee0b0" /></mesh>
    <mesh rotation-x={Math.PI / 2} position={[0, -0.1, 0]}><torusGeometry args={[1.25, 0.03, 8, 64]} /><M c="#7fd9ef" e={0.6} /></mesh></Spin>;
}

const MAP: Record<SectionKey, () => JSX.Element> = {
  dashboard: Bars, radiologist: Scan, advisor: Brain, chat: Bubbles, aichat: Chip, voiceai: Wave, doctors: Stethoscope,
  appointments: Calendar, prescriptions: Bottle, patients: People, map: Pin, dailyroutine: SunMoon, admin: Shield, profile: Bust,
};

/** Small decorative 3D emblem, different per dashboard section. */
const SectionScene = ({ section, className = "" }: { section: SectionKey; className?: string }) => {
  const Obj = MAP[section];
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 5]} intensity={1.3} />
          <pointLight position={[-4, -2, -3]} intensity={20} color="#5ee0b0" />
          <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}><Obj key={section} /></Float>
          <Environment>
            <Lightformer intensity={2} position={[0, 5, 2]} scale={[10, 10, 1]} />
            <Lightformer intensity={1} color="#7fd9ef" position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SectionScene;
