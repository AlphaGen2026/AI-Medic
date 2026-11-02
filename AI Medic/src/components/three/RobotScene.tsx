import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLanguage } from "@/hooks/useLanguage";

export type RobotVariant = "team" | "presenter" | "doctors";
type Lang = "uz" | "ru" | "en";

const ROLES: Record<string, Record<Lang, string>> = {
  lead: { uz: "Bosh Dasturchi", ru: "Главный программист", en: "Lead Developer" },
  prompt: { uz: "AI Prompter", ru: "AI Промптер", en: "AI Prompter" },
  design: { uz: "Web Dizayner", ru: "Веб-дизайнер", en: "Web Designer" },
};

/** Canvas texture with one or two lines of text (no font downloads needed). */
function useLabel(lines: string[], bg: string, fg = "#ffffff", w = 512, h = 256) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    if (lines.length === 1) {
      g.font = `bold ${h * 0.42}px system-ui, sans-serif`;
      g.fillText(lines[0], w / 2, h / 2, w * 0.92);
    } else {
      g.font = `bold ${h * 0.34}px system-ui, sans-serif`;
      g.fillText(lines[0], w / 2, h * 0.36, w * 0.92);
      g.font = `600 ${h * 0.2}px system-ui, sans-serif`;
      g.fillText(lines[1], w / 2, h * 0.72, w * 0.92);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [lines.join("|"), bg, fg, w, h]);
}

const std = (color: string, r = 0.35, m = 0.3) => <meshStandardMaterial color={color} roughness={r} metalness={m} />;

interface RobotProps {
  color: string;
  name: string;
  coat?: boolean;
  seated?: boolean;
  /** Called each frame with (time, leftArm, rightArm) to animate arms. */
  animate?: (t: number, l: THREE.Group, r: THREE.Group, head: THREE.Group) => void;
  rightHandItem?: JSX.Element;
}

/** Cute robot: same build for everyone, colour and name differ. */
function Robot({ color, name, coat, seated, animate, rightHandItem }: RobotProps) {
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const shirt = useLabel([name], coat ? "#f4f7fa" : color, coat ? "#1f6feb" : "#ffffff", 512, 190);
  useFrame((s) => {
    if (l.current && r.current && head.current && animate) animate(s.clock.elapsedTime, l.current, r.current, head.current);
  });
  return (
    <group>
      {/* head */}
      <group ref={head} position={[0, 1.55, 0]}>
        <mesh><boxGeometry args={[0.8, 0.62, 0.66]} />{std(color, 0.25, 0.4)}</mesh>
        <mesh position={[0, 0, 0.335]}><planeGeometry args={[0.64, 0.42]} /><meshStandardMaterial color="#10202c" roughness={0.2} /></mesh>
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.03, 0.34]}><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color="#7ff9ff" emissive="#4be8ff" emissiveIntensity={1.6} /></mesh>
        ))}
        <mesh position={[0, -0.08, 0.34]} rotation-z={Math.PI}><torusGeometry args={[0.07, 0.018, 8, 16, Math.PI]} /><meshStandardMaterial color="#7ff9ff" emissive="#4be8ff" emissiveIntensity={1.2} /></mesh>
        <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.02, 0.02, 0.22]} />{std("#c9d3dc")}</mesh>
        <mesh position={[0, 0.56, 0]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="#ffb547" emissive="#ff8a00" emissiveIntensity={1.2} /></mesh>
        {[-0.43, 0.43].map((x) => <mesh key={x} position={[x, 0, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />{std("#c9d3dc")}</mesh>)}
      </group>
      {/* body */}
      <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.82, 0.8, 0.5]} />{std(coat ? "#f4f7fa" : color, 0.5, 0.1)}</mesh>
      <mesh position={[0, 0.9, 0.252]}><planeGeometry args={[0.8, 0.3]} /><meshStandardMaterial map={shirt} /></mesh>
      {coat && (
        <>
          <mesh position={[0, 0.62, 0.252]}><planeGeometry args={[0.02, 0.36]} /><meshStandardMaterial color="#c3ccd6" /></mesh>
          <mesh position={[0.2, 0.7, 0.26]}><boxGeometry args={[0.16, 0.12, 0.02]} />{std("#e5485b")}</mesh>
          <mesh position={[0, 1.12, 0.26]} rotation-x={0.2}><torusGeometry args={[0.22, 0.02, 8, 24, Math.PI]} />{std("#2b3440", 0.3, 0.6)}</mesh>
        </>
      )}
      {/* arms */}
      {[{ ref: l, x: -0.5 }, { ref: r, x: 0.5 }].map(({ ref, x }) => (
        <group key={x} ref={ref} position={[x, 1.15, 0]}>
          <mesh position={[0, -0.28, 0]}><capsuleGeometry args={[0.09, 0.42, 6, 12]} />{std(coat ? "#f4f7fa" : color, 0.4, 0.2)}</mesh>
          <mesh position={[0, -0.6, 0]}><sphereGeometry args={[0.11, 16, 16]} />{std("#c9d3dc")}</mesh>
          {x > 0 && rightHandItem && <group position={[0, -0.66, 0]}>{rightHandItem}</group>}
        </group>
      ))}
      {/* legs */}
      {[-0.2, 0.2].map((x) => (
        <group key={x} position={[x, 0.45, seated ? 0.2 : 0]} rotation-x={seated ? -Math.PI / 2 : 0}>
          <mesh position={[0, -0.25, 0]}><capsuleGeometry args={[0.1, 0.35, 6, 12]} />{std("#3b4652", 0.4, 0.4)}</mesh>
        </group>
      ))}
    </group>
  );
}

function Chair({ color, name, role }: { color: string; name: string; role: string }) {
  const tex = useLabel([name, role], color);
  return (
    <group>
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.9, 0.08, 0.8]} />{std("#2b3440")}</mesh>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.05, 0.05, 0.4]} />{std("#9aa6b2", 0.3, 0.8)}</mesh>
      <mesh position={[0, 0.9, -0.42]}><boxGeometry args={[0.95, 0.9, 0.08]} />{std("#2b3440")}</mesh>
      {/* label on the outer face of the backrest */}
      <mesh position={[0, 0.9, -0.465]} rotation-y={Math.PI}><planeGeometry args={[0.88, 0.44]} /><meshStandardMaterial map={tex} /></mesh>
    </group>
  );
}

function Laptop() {
  return (
    <group>
      <mesh><boxGeometry args={[0.6, 0.03, 0.4]} />{std("#c9d3dc", 0.3, 0.8)}</mesh>
      <mesh position={[0, 0.2, -0.2]} rotation-x={-0.25}><boxGeometry args={[0.6, 0.4, 0.02]} />{std("#c9d3dc", 0.3, 0.8)}</mesh>
      <mesh position={[0, 0.2, -0.188]} rotation-x={-0.25}><planeGeometry args={[0.54, 0.34]} /><meshStandardMaterial color="#4be8ff" emissive="#2fb5ff" emissiveIntensity={0.9} /></mesh>
    </group>
  );
}

const typing = (offset: number) => (t: number, l: THREE.Group, r: THREE.Group, h: THREE.Group) => {
  l.rotation.x = -1.1 + Math.sin(t * 14 + offset) * 0.08;
  r.rotation.x = -1.1 + Math.sin(t * 14 + offset + 1.6) * 0.08;
  h.rotation.x = 0.15 + Math.sin(t * 1.5 + offset) * 0.05;
};

function Team({ lang }: { lang: Lang }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += Math.min(d, 0.05) * 0.45; });
  const people = [
    { name: "Bobur", role: ROLES.lead[lang], color: "#2f80ed" },
    { name: "Maqsadbek", role: ROLES.prompt[lang], color: "#27ae60" },
    { name: "Mo'minjon", role: ROLES.design[lang], color: "#f2994a" },
  ];
  return (
    <group ref={ref} position={[0, -1.2, 0]} scale={0.85}>
      <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[1.05, 1.05, 0.08, 48]} />{std("#e8edf2", 0.3, 0.2)}</mesh>
      <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.12, 0.3, 0.84, 24]} />{std("#9aa6b2", 0.3, 0.8)}</mesh>
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[2.6, 2.6, 0.04, 48]} /><meshStandardMaterial color="#5ee0b0" transparent opacity={0.18} /></mesh>
      {people.map((p, i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <group key={p.name} rotation-y={a}>
            <group position={[0, 0.89, 0.62]}><Laptop /></group>
            <group position={[0, 0, 1.75]} rotation-y={Math.PI}>
              <Chair color={p.color} name={p.name} role={p.role} />
              <group position={[0, 0.1, -0.05]}><Robot seated color={p.color} name={p.name} animate={typing(i * 2)} /></group>
            </group>
          </group>
        );
      })}
    </group>
  );
}

function Presenter() {
  const screen = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 640; c.height = 384;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 640, 384); grd.addColorStop(0, "#0b2a3d"); grd.addColorStop(1, "#103f5a");
    g.fillStyle = grd; g.fillRect(0, 0, 640, 384);
    g.fillStyle = "#ffffff"; g.font = "bold 40px system-ui"; g.fillText("AI Medic", 30, 60);
    [120, 200, 150, 260, 220].forEach((v, i) => { g.fillStyle = i % 2 ? "#5ee0b0" : "#4be8ff"; g.fillRect(40 + i * 70, 340 - v, 46, v); });
    g.strokeStyle = "#ff6b81"; g.lineWidth = 6; g.beginPath();
    [[400, 260], [450, 260], [470, 190], [495, 320], [520, 230], [600, 230]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const whole = useRef<THREE.Group>(null);
  useFrame((s) => { if (whole.current) whole.current.rotation.y = 0.35 + Math.sin(s.clock.elapsedTime * 0.4) * 0.15; });
  const point = (t: number, l: THREE.Group, r: THREE.Group, h: THREE.Group) => {
    r.rotation.z = 2.1 + Math.sin(t * 1.6) * 0.35;
    r.rotation.x = Math.sin(t * 0.8) * 0.2;
    l.rotation.z = -0.15 + Math.sin(t * 2) * 0.05;
    h.rotation.y = 0.5 + Math.sin(t * 1.6) * 0.15;
  };
  const stick = (
    <mesh position={[0, -0.45, 0]}><cylinderGeometry args={[0.018, 0.018, 0.9]} />{std("#ffb547", 0.4, 0.3)}</mesh>
  );
  return (
    <group ref={whole} position={[0.2, -1.5, 0]} scale={0.95}>
      <group position={[-0.9, 1.9, -0.6]}>
        <mesh><boxGeometry args={[2.7, 1.65, 0.1]} />{std("#1c232b", 0.3, 0.7)}</mesh>
        <mesh position={[0, 0, 0.055]}><planeGeometry args={[2.5, 1.5]} /><meshStandardMaterial map={screen} emissiveMap={screen} emissive="#ffffff" emissiveIntensity={0.6} /></mesh>
        <mesh position={[0, -1.25, -0.05]}><cylinderGeometry args={[0.06, 0.06, 0.9]} />{std("#9aa6b2", 0.3, 0.8)}</mesh>
      </group>
      <group position={[1.2, 0, 0.3]} rotation-y={-0.5}>
        <Robot color="#2f80ed" name="Bobur" animate={point} rightHandItem={stick} />
      </group>
    </group>
  );
}

function Doctors() {
  const lid = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (lid.current) lid.current.rotation.x = -0.9 - Math.max(0, Math.sin(s.clock.elapsedTime * 0.9)) * 0.4; });
  // each arm: reach into the case, lift the item up, show it, put it back
  const doc = (offset: number, side: 1 | -1) => (t: number, l: THREE.Group, r: THREE.Group, h: THREE.Group) => {
    const p = (Math.sin(t * 1.2 + offset) + 1) / 2; // 0 = in case, 1 = raised
    const arm = side === 1 ? l : r;
    const other = side === 1 ? r : l;
    arm.rotation.x = -0.5 - p * 1.6;
    arm.rotation.z = side * (0.5 - p * 0.3);
    other.rotation.z = -side * 0.12;
    h.rotation.x = 0.3 - p * 0.35;
  };
  const syringe = (
    <group rotation-x={Math.PI / 2}>
      <mesh><cylinderGeometry args={[0.05, 0.05, 0.32, 16]} /><meshStandardMaterial color="#dff6ff" transparent opacity={0.8} /></mesh>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.006, 0.006, 0.14]} />{std("#c9d3dc", 0.2, 0.9)}</mesh>
      <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />{std("#e5485b")}</mesh>
    </group>
  );
  const thermo = (
    <group rotation-x={Math.PI / 2}>
      <mesh><capsuleGeometry args={[0.03, 0.3, 6, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0, -0.18, 0]}><sphereGeometry args={[0.045, 12, 12]} />{std("#e5485b")}</mesh>
    </group>
  );
  return (
    <group position={[0, -1.3, 0]} scale={0.85}>
      {/* doctor's suitcase */}
      <group position={[0, 0.3, 0.5]}>
        <mesh><boxGeometry args={[0.9, 0.6, 0.55]} />{std("#7a4a2a", 0.5, 0.1)}</mesh>
        <mesh position={[0, 0.02, 0.28]}><boxGeometry args={[0.28, 0.08, 0.01]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0.02, 0.28]}><boxGeometry args={[0.08, 0.28, 0.01]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh ref={lid} position={[0, 0.3, -0.27]}><boxGeometry args={[0.9, 0.04, 0.55]} />{std("#6a3e22", 0.5, 0.1)}</mesh>
      </group>
      <group position={[-1.05, 0, 0]} rotation-y={0.5}>
        <Robot coat color="#27ae60" name="Maqsadbek" animate={doc(0, -1)} rightHandItem={syringe} />
      </group>
      <group position={[1.05, 0, 0]} rotation-y={-0.5}>
        <Robot coat color="#f2994a" name="Mo'minjon" animate={doc(Math.PI, -1)} rightHandItem={thermo} />
      </group>
    </group>
  );
}

/** Decorative robot team scenes for the public pages. */
const RobotScene = ({ variant, className = "" }: { variant: RobotVariant; className?: string }) => {
  const { lang } = useLanguage();
  const cam: [number, number, number] = variant === "team" ? [0, 2.4, 5.6] : [0, 0.8, 5.4];
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: cam, fov: 42 }} onCreated={({ camera }) => camera.lookAt(0, -0.3, 0)} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 6, 5]} intensity={1.4} />
          <pointLight position={[-3, 2, 3]} intensity={10} color="#5ee0b0" />
          {variant === "team" && <Team lang={lang as Lang} />}
          {variant === "presenter" && <Presenter />}
          {variant === "doctors" && <Doctors />}
          <Environment>
            <Lightformer intensity={2} position={[0, 5, 2]} scale={[10, 10, 1]} />
            <Lightformer intensity={1} color="#7fd9ef" position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default RobotScene;
