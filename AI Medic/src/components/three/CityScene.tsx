import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/hooks/useTheme";

const ROADS = [-10, -6, -2, 2, 6, 10];
const BLOCKS = [-8, -4, 0, 4, 8];
const HALF = 12;
const rnd = (a: number, b: number) => Math.abs(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1;

function City({ night }: { night: boolean }) {
  const root = useRef<THREE.Group>(null);
  const pin = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const cars = useRef<THREE.Group>(null);
  const people = useRef<THREE.Group>(null);

  const lots = useMemo(() => {
    const b: { x: number; z: number; w: number; h: number; c: string }[] = [];
    const t: { x: number; z: number; s: number }[] = [];
    const cols = ["#cfd8e3", "#b9c7d6", "#e3e7ee", "#a9bccf", "#d9cfc4", "#c9d9cf"];
    BLOCKS.forEach((bx) => BLOCKS.forEach((bz) => {
      if (bx === 0 && bz === 0) return; // hospital
      const park = rnd(bx, bz) < 0.22;
      for (const ox of [-0.8, 0.8]) for (const oz of [-0.8, 0.8]) {
        const s = rnd(bx + ox, bz + oz);
        if (park || s < 0.15) t.push({ x: bx + ox, z: bz + oz, s: 0.7 + s * 0.6 });
        else {
          const far = Math.hypot(bx, bz) / 11;
          b.push({ x: bx + ox, z: bz + oz, w: 1.1 + s * 0.3, h: 0.8 + s * (3.2 - far * 1.5), c: cols[Math.floor(s * cols.length)] });
        }
      }
      // corner trees on every block
      [[-1.55, -1.55], [1.55, 1.55]].forEach(([dx, dz]) => t.push({ x: bx + dx, z: bz + dz, s: 0.6 }));
    }));
    // hospital garden
    [[-1.4, 1.4], [1.4, 1.4], [-1.4, -1.4], [1.4, -1.4]].forEach(([x, z]) => t.push({ x, z, s: 0.75 }));
    return { b, t };
  }, []);

  const lamps = useMemo(() => {
    const l: [number, number][] = [];
    ROADS.forEach((r) => BLOCKS.forEach((p) => { l.push([r + 0.55, p]); l.push([p, r - 0.55]); }));
    return l;
  }, []);

  const carDefs = useMemo(() => [
    { road: -2, axis: "x", dir: 1, speed: 2.2, off: 0, c: "#e5485b" },
    { road: 2, axis: "x", dir: -1, speed: 1.8, off: 7, c: "#3b82f6" },
    { road: 6, axis: "x", dir: 1, speed: 2.6, off: 13, c: "#f5b83d" },
    { road: -6, axis: "x", dir: -1, speed: 2, off: 4, c: "#ffffff" },
    { road: -2, axis: "z", dir: -1, speed: 2.4, off: 9, c: "#10b981" },
    { road: 2, axis: "z", dir: 1, speed: 1.9, off: 2, c: "#8b5cf6" },
    { road: 6, axis: "z", dir: -1, speed: 2.3, off: 16, c: "#f97316" },
    { road: -6, axis: "z", dir: 1, speed: 2.1, off: 11, c: "#ef4444" },
  ], []);

  const peopleDefs = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    road: ROADS[1 + (i % 4)], axis: i % 2 ? "x" : "z", side: i % 3 ? 0.95 : -0.95,
    dir: i % 4 < 2 ? 1 : -1, speed: 0.35 + rnd(i, 3) * 0.3, off: rnd(i, 7) * 24,
    c: ["#e5485b", "#3b82f6", "#10b981", "#f5b83d", "#8b5cf6", "#ffffff"][i % 6],
  })), []);

  useFrame((s, d) => {
    const t = s.clock.elapsedTime;
    if (root.current) root.current.rotation.y += Math.min(d, 0.05) * 0.04;
    if (pin.current) { pin.current.position.y = 3.4 + Math.sin(t * 1.6) * 0.2; pin.current.rotation.y = t * 0.8; }
    rings.current?.children.forEach((m, i) => {
      const p = (t * 0.45 + i / 3) % 1;
      m.scale.setScalar(0.6 + p * 3);
      ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - p);
    });
    cars.current?.children.forEach((g, i) => {
      const c = carDefs[i];
      const v = (((t * c.speed + c.off) % 24) + 24) % 24 - HALF;
      const p = c.dir * v, lane = c.dir * 0.2;
      if (c.axis === "x") { g.position.set(p, 0, c.road + lane); g.rotation.y = c.dir > 0 ? 0 : Math.PI; }
      else { g.position.set(c.road - lane, 0, p); g.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
    });
    people.current?.children.forEach((g, i) => {
      const c = peopleDefs[i];
      const p = c.dir * ((((t * c.speed + c.off) % 24) + 24) % 24 - HALF);
      const bob = Math.abs(Math.sin(t * 6 + i)) * 0.04;
      if (c.axis === "x") g.position.set(p, bob, c.road + c.side);
      else g.position.set(c.road + c.side, bob, p);
    });
  });

  const win = night ? "#ffd27a" : "#9cc9e8";
  const road = night ? "#1f2733" : "#5b6472";
  return (
    <group ref={root} position={[0, -1.5, 0]}>
      {/* ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={night ? "#16271f" : "#8fcf8f"} roughness={1} />
      </mesh>
      {/* sidewalks + roads */}
      {ROADS.map((r) => (
        <group key={r}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0, r]}><planeGeometry args={[HALF * 2, 1.5]} /><meshStandardMaterial color={night ? "#3a4252" : "#cfd3da"} /></mesh>
          <mesh rotation-x={-Math.PI / 2} position={[r, 0.001, 0]}><planeGeometry args={[1.5, HALF * 2]} /><meshStandardMaterial color={night ? "#3a4252" : "#cfd3da"} /></mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, r]}><planeGeometry args={[HALF * 2, 0.9]} /><meshStandardMaterial color={road} roughness={0.8} /></mesh>
          <mesh rotation-x={-Math.PI / 2} position={[r, 0.006, 0]}><planeGeometry args={[0.9, HALF * 2]} /><meshStandardMaterial color={road} roughness={0.8} /></mesh>
          {BLOCKS.map((p) => (
            <group key={p}>
              <mesh rotation-x={-Math.PI / 2} position={[p, 0.01, r]}><planeGeometry args={[1.2, 0.05]} /><meshBasicMaterial color="#f5e7a1" /></mesh>
              <mesh rotation-x={-Math.PI / 2} position={[r, 0.011, p]}><planeGeometry args={[0.05, 1.2]} /><meshBasicMaterial color="#f5e7a1" /></mesh>
            </group>
          ))}
        </group>
      ))}
      {/* buildings */}
      {lots.b.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh><boxGeometry args={[b.w, b.h, b.w]} /><meshStandardMaterial color={night ? "#2b3a4f" : b.c} roughness={0.6} /></mesh>
          {Array.from({ length: Math.max(1, Math.floor(b.h / 0.5)) }, (_, k) => (
            <mesh key={k} position={[0, -b.h / 2 + 0.35 + k * 0.5, b.w / 2 + 0.003]}>
              <planeGeometry args={[b.w * 0.75, 0.16]} />
              <meshStandardMaterial color={win} emissive={win} emissiveIntensity={night ? (rnd(i, k) > 0.3 ? 1.6 : 0) : 0.1} />
            </mesh>
          ))}
        </group>
      ))}
      {/* trees and bushes */}
      {lots.t.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.07, 0.09, 0.6, 8]} /><meshStandardMaterial color="#7a5232" /></mesh>
          <mesh position={[0, 0.85, 0]}><coneGeometry args={[0.42, 0.9, 10]} /><meshStandardMaterial color={night ? "#1f5a3a" : "#3f9d5a"} roughness={0.8} /></mesh>
          <mesh position={[0.35, 0.12, 0.2]}><sphereGeometry args={[0.18, 10, 10]} /><meshStandardMaterial color={night ? "#25603f" : "#5cb85c"} /></mesh>
        </group>
      ))}
      {/* street lamps */}
      {lamps.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.025, 0.03, 0.9, 6]} /><meshStandardMaterial color="#4b5563" metalness={0.6} /></mesh>
          <mesh position={[0, 0.92, 0]}><sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color="#fff3c4" emissive="#ffcf66" emissiveIntensity={night ? 3 : 0.2} /></mesh>
        </group>
      ))}
      {/* cars */}
      <group ref={cars}>
        {carDefs.map((c, i) => (
          <group key={i}>
            <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.6, 0.16, 0.3]} /><meshPhysicalMaterial color={c.c} clearcoat={1} roughness={0.3} /></mesh>
            <mesh position={[-0.04, 0.28, 0]}><boxGeometry args={[0.32, 0.13, 0.26]} /><meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.2} /></mesh>
            {[[-0.2, 0.15], [0.2, 0.15], [-0.2, -0.15], [0.2, -0.15]].map(([x, z], k) => (
              <mesh key={k} position={[x, 0.06, z]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.06, 0.06, 0.04, 10]} /><meshStandardMaterial color="#111827" /></mesh>
            ))}
            <mesh position={[0.31, 0.15, 0]}><boxGeometry args={[0.02, 0.05, 0.24]} />
              <meshStandardMaterial color="#fffbe6" emissive="#fff3b0" emissiveIntensity={night ? 3 : 0.3} /></mesh>
          </group>
        ))}
      </group>
      {/* people */}
      <group ref={people}>
        {peopleDefs.map((p, i) => (
          <group key={i}>
            <mesh position={[0, 0.17, 0]}><capsuleGeometry args={[0.06, 0.16, 4, 8]} /><meshStandardMaterial color={p.c} /></mesh>
            <mesh position={[0, 0.36, 0]}><sphereGeometry args={[0.055, 10, 10]} /><meshStandardMaterial color="#f2c9a0" /></mesh>
          </group>
        ))}
      </group>
      {/* hospital */}
      <group>
        <mesh position={[0, 0.9, 0]}><boxGeometry args={[2.2, 1.8, 1.6]} />
          <meshStandardMaterial color="#ffffff" emissive={night ? "#8fb3d9" : "#000000"} emissiveIntensity={night ? 0.25 : 0} /></mesh>
        <mesh position={[0, 2.1, 0]}><boxGeometry args={[1.1, 0.6, 1.1]} /><meshStandardMaterial color="#f4f7fb" /></mesh>
        <mesh position={[0, 1.25, 0.81]}><boxGeometry args={[0.16, 0.55, 0.03]} /><meshStandardMaterial color="#e5485b" emissive="#e5485b" emissiveIntensity={night ? 1.5 : 0.3} /></mesh>
        <mesh position={[0, 1.25, 0.81]}><boxGeometry args={[0.55, 0.16, 0.03]} /><meshStandardMaterial color="#e5485b" emissive="#e5485b" emissiveIntensity={night ? 1.5 : 0.3} /></mesh>
        {[-0.75, 0.75].map((x) => [0.5, 1.2].map((y) => (
          <mesh key={`${x}${y}`} position={[x, y, 0.805]}><planeGeometry args={[0.4, 0.22]} />
            <meshStandardMaterial color={win} emissive={win} emissiveIntensity={night ? 1.6 : 0.1} /></mesh>
        )))}
      </group>
      <group ref={rings} position={[0, 0.03, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={-Math.PI / 2}><ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial color="#e5485b" transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>
        ))}
      </group>
      <group ref={pin}>
        <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.6, 32, 32]} />
          <meshPhysicalMaterial color="#e5485b" clearcoat={1} roughness={0.2} emissive="#7a0f1d" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, -0.4, 0]} rotation-z={Math.PI}><coneGeometry args={[0.52, 1.1, 32]} /><meshPhysicalMaterial color="#d93a4e" clearcoat={1} roughness={0.2} /></mesh>
        <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.25, 24, 24]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
    </group>
  );
}

/** Full-page animated 3D city with a hospital pin; day/night follows the theme. */
const CityScene = ({ className = "" }: { className?: string }) => {
  const night = useTheme().theme === "dark";
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 11, 15], fov: 42 }} gl={{ antialias: true, alpha: true }}
        onCreated={({ camera }) => camera.lookAt(0, -1.5, 0)}>
        <fog attach="fog" args={[night ? "#0b1220" : "#eaf3fb", 16, 34]} />
        <Suspense fallback={null}>
          <ambientLight intensity={night ? 0.25 : 0.7} />
          <directionalLight position={[6, 10, 6]} intensity={night ? 0.35 : 1.4} color={night ? "#9fb4ff" : "#ffffff"} />
          <City night={night} />
          <Environment>
            <Lightformer intensity={2} position={[0, 5, 2]} scale={[10, 10, 1]} />
            <Lightformer intensity={1} color="#7fd9ef" position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CityScene;
