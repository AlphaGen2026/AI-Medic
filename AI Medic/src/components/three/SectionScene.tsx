import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Line, RoundedBox } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useTheme } from "@/hooks/useTheme";
import DraggableScene from "@/components/three/DraggableScene";

export type SectionKey =
  | "dashboard" | "radiologist" | "advisor" | "patients" | "admin" | "chat" | "aichat"
  | "voiceai" | "profile" | "doctors" | "appointments" | "prescriptions" | "dailyroutine" | "map";

const C = {
  ice: "#dcebef",
  white: "#f4f7f8",
  teal: "#248fa5",
  cyan: "#64bfd0",
  mint: "#68bda9",
  steel: "#91a6b1",
  graphite: "#273943",
  navy: "#17313e",
  red: "#c94c5c",
  amber: "#b88a4b",
  tissue: "#b9828c",
  bone: "#d9e3e2",
};

type MaterialProps = {
  color?: string;
  metal?: boolean;
  glass?: boolean;
  glow?: number;
  opacity?: number;
};

let microSurface: THREE.DataTexture | null = null;

function getMicroSurface() {
  if (microSurface) return microSurface;
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    const noise = 218 + Math.floor(Math.abs(Math.sin(i * 91.731) * 43758.5453) % 1 * 37);
    data[i * 4] = noise;
    data[i * 4 + 1] = noise;
    data[i * 4 + 2] = noise;
    data[i * 4 + 3] = 255;
  }
  microSurface = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  microSurface.wrapS = THREE.RepeatWrapping;
  microSurface.wrapT = THREE.RepeatWrapping;
  microSurface.repeat.set(4, 4);
  microSurface.needsUpdate = true;
  return microSurface;
}

function Material({ color = C.ice, metal = false, glass = false, glow = 0, opacity = 1 }: MaterialProps) {
  const surface = useMemo(getMicroSurface, []);
  const textured = !glass && opacity === 1;
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metal ? 0.86 : 0.04}
      roughness={metal ? 0.22 : glass ? 0.1 : 0.38}
      roughnessMap={textured ? surface : null}
      bumpMap={textured ? surface : null}
      bumpScale={textured ? 0.006 : 0}
      clearcoat={glass ? 1 : metal ? 0.55 : 0.28}
      clearcoatRoughness={glass ? 0.08 : 0.22}
      transmission={glass ? 0.62 : 0}
      thickness={glass ? 0.7 : 0}
      ior={1.46}
      attenuationColor={color}
      attenuationDistance={1.8}
      envMapIntensity={glass ? 1.35 : 1.05}
      specularIntensity={glass ? 1 : 0.65}
      transparent={glass || opacity < 1}
      opacity={opacity}
      emissive={glow ? color : "#000000"}
      emissiveIntensity={glow}
    />
  );
}

function RenderSettings({ night }: { night: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = night ? 1.02 : 1.12;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl, night]);
  return null;
}

function ClinicalMotion({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = -0.28 + Math.sin(t * 0.3) * 0.2;
    ref.current.rotation.x = Math.sin(t * 0.24) * 0.045;
  });
  return <group ref={ref} rotation={[0, -0.28, 0]}>{children}</group>;
}

function Tube({ points, radius = 0.055, color = C.graphite }: { points: [number, number, number][]; radius?: number; color?: string }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 48, radius, 10, false);
  }, [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><Material color={color} metal /></mesh>;
}

function Bars({ reducedMotion }: SceneProps) {
  const bars = useRef<THREE.Group>(null);
  const heights = [0.75, 1.2, 0.95, 1.65];
  useFrame(({ clock }) => {
    if (!bars.current || reducedMotion) return;
    bars.current.children.forEach((bar, i) => {
      const target = 0.9 + Math.sin(clock.elapsedTime * 0.85 + i * 0.8) * 0.1;
      bar.scale.y += (target - bar.scale.y) * 0.06;
    });
  });
  return (
    <group position={[0, -0.25, 0]}>
      <RoundedBox args={[2.45, 0.12, 1.25]} radius={0.06} smoothness={4} position={[0, -0.95, 0]}><Material color={C.navy} metal /></RoundedBox>
      <group ref={bars}>
        {heights.map((height, i) => (
          <group key={i} position={[(i - 1.5) * 0.53, -0.88 + height / 2, 0]}>
            <RoundedBox args={[0.34, height, 0.48]} radius={0.08} smoothness={5}>
              <Material color={i === 3 ? C.mint : C.teal} metal={i !== 3} />
            </RoundedBox>
            <mesh position={[0, height / 2 + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.23, 0.34]} /><Material color={C.ice} metal />
            </mesh>
          </group>
        ))}
      </group>
      <Line points={[[-1.05, 0.05, 0.38], [-0.55, 0.38, 0.38], [-0.05, 0.2, 0.38], [0.48, 0.78, 0.38], [1.02, 0.92, 0.38]]} color={C.ice} lineWidth={2} />
    </group>
  );
}

function Lung({ side }: { side: -1 | 1 }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.05, 0.88);
    shape.bezierCurveTo(0.4, 1.02, 0.72, 0.78, 0.76, 0.36);
    shape.bezierCurveTo(0.82, -0.1, 0.72, -0.72, 0.42, -0.9);
    shape.bezierCurveTo(0.18, -0.98, 0.02, -0.72, 0.04, -0.4);
    shape.bezierCurveTo(0.08, -0.12, -0.02, 0.18, 0.04, 0.42);
    shape.bezierCurveTo(-0.02, 0.62, -0.04, 0.76, 0.05, 0.88);
    const result = new THREE.ExtrudeGeometry(shape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelSize: 0.09,
      bevelThickness: 0.1,
      bevelSegments: 6,
      curveSegments: 28,
    });
    result.center();
    result.computeVertexNormals();
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group position={[side * 0.4, 0.12, 0.04]} scale={[side * 0.82, 0.94, 0.82]} rotation={[0, side * -0.12, side * -0.04]}>
      <mesh geometry={geometry} castShadow>
        <Material color={C.tissue} />
      </mesh>
      <Line points={[[0.02, 0.25, 0.23], [0.22, 0.02, 0.25], [0.48, -0.18, 0.19]]} color="#8f626d" lineWidth={1.1} transparent opacity={0.6} />
    </group>
  );
}

function Scan({ reducedMotion }: SceneProps) {
  const scanner = useRef<THREE.Group>(null);
  const torso = useMemo(() => {
    const profile = [
      new THREE.Vector2(0.3, -1.16),
      new THREE.Vector2(0.52, -0.9),
      new THREE.Vector2(0.67, -0.3),
      new THREE.Vector2(0.7, 0.34),
      new THREE.Vector2(0.48, 0.92),
      new THREE.Vector2(0.26, 1.16),
    ];
    return new THREE.LatheGeometry(profile, 56);
  }, []);
  useEffect(() => () => torso.dispose(), [torso]);

  useFrame(({ clock }) => {
    if (!scanner.current || reducedMotion) return;
    scanner.current.position.y = Math.sin(clock.elapsedTime * 0.72) * 0.9;
  });

  return (
    <group scale={0.94}>
      <mesh geometry={torso} scale={[1, 1, 0.58]}>
        <Material color={C.cyan} glass opacity={0.25} />
      </mesh>
      <Lung side={-1} />
      <Lung side={1} />

      {[-1, 1].flatMap((side) => Array.from({ length: 6 }, (_, i) => {
        const y = 0.63 - i * 0.23;
        const width = 0.58 + Math.sin((i / 5) * Math.PI) * 0.08;
        return (
          <Line
            key={`${side}-${i}`}
            points={[[side * 0.03, y, 0.45], [side * 0.28, y + 0.035, 0.43], [side * width, y + 0.09, 0.2], [side * (width + 0.05), y + 0.12, -0.04]]}
            color={C.bone}
            lineWidth={1.25}
            transparent
            opacity={0.62}
          />
        );
      }))}

      <mesh position={[0, 0.02, 0.45]} castShadow>
        <capsuleGeometry args={[0.045, 1.15, 8, 16]} /><Material color={C.bone} />
      </mesh>
      <group position={[0, -0.04, -0.25]}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[0, -0.73 + i * 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.072, 0.078, 0.105, 20]} /><Material color={C.bone} />
          </mesh>
        ))}
      </group>

      <group ref={scanner}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.58, 1]}>
          <circleGeometry args={[0.94, 64]} />
          <meshBasicMaterial color={C.mint} transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.58, 1]}>
          <torusGeometry args={[0.96, 0.018, 10, 96]} /><Material color={C.mint} glow={0.3} />
        </mesh>
        <pointLight color={C.mint} intensity={1.2} distance={2.8} />
      </group>
      <mesh position={[0, -1.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.68, 0.94, 64]} /><Material color={C.steel} metal opacity={0.55} />
      </mesh>
    </group>
  );
}

function Brain({ reducedMotion }: SceneProps) {
  const ref = useRef<THREE.Group>(null);
  const lobes: [number, number, number, number][] = [
    [0.3, 0.58, 0.12, 0.47], [0.62, 0.25, 0.16, 0.52], [0.55, -0.28, 0.15, 0.5],
    [0.22, -0.58, 0.1, 0.42], [0.2, 0.12, 0.5, 0.48], [0.28, 0.48, -0.38, 0.42],
    [0.45, -0.15, -0.35, 0.43], [0.12, -0.35, 0.48, 0.36],
  ];
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const s = 1 + Math.sin(clock.elapsedTime * 1.15) * 0.018;
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref} rotation={[0.08, 0, -0.05]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          {lobes.map(([x, y, z, size], i) => (
            <mesh key={i} position={[x * side, y, z]} scale={[0.82, 1, 0.9]}>
              <sphereGeometry args={[size, 28, 28]} /><Material color={i % 3 === 0 ? C.cyan : C.ice} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, -0.78, -0.05]} rotation={[0.15, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.5, 8, 20]} /><Material color={C.steel} />
      </mesh>
      <mesh position={[0, 0, 0.7]}>
        <planeGeometry args={[0.025, 1.35]} /><meshBasicMaterial color={C.teal} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function ChatBubble({ position, scale = 1, secondary = false }: { position: [number, number, number]; scale?: number; secondary?: boolean }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[1.65, 0.92, 0.32]} radius={0.2} smoothness={6}>
        <Material color={secondary ? C.teal : C.white} metal={secondary} />
      </RoundedBox>
      <mesh position={[-0.53, -0.52, 0]} rotation={[0, 0, 0.22]}>
        <coneGeometry args={[0.18, 0.42, 3]} /><Material color={secondary ? C.teal : C.white} metal={secondary} />
      </mesh>
      {[0.32, 0, -0.32].map((y, i) => (
        <RoundedBox key={y} args={[i === 2 ? 0.62 : 0.94, 0.055, 0.025]} radius={0.02} smoothness={3} position={[-0.12, y * 0.65, 0.175]}>
          <Material color={secondary ? C.ice : C.steel} opacity={0.75} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Bubbles({ reducedMotion }: SceneProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !reducedMotion) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.55) * 0.035;
  });
  return <group ref={ref}><ChatBubble position={[-0.28, 0.38, 0.18]} /><ChatBubble position={[0.48, -0.58, -0.2]} scale={0.72} secondary /></group>;
}

function Chip({ reducedMotion }: SceneProps) {
  const core = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (core.current && !reducedMotion) {
      (core.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.12 + Math.sin(clock.elapsedTime * 1.2) * 0.06;
    }
  });
  return (
    <group rotation={[0.45, 0, 0]}>
      <RoundedBox args={[1.75, 0.2, 1.75]} radius={0.12} smoothness={5}><Material color={C.graphite} metal /></RoundedBox>
      <RoundedBox args={[1.15, 0.16, 1.15]} radius={0.09} smoothness={5} position={[0, 0.17, 0]}><Material color={C.steel} metal /></RoundedBox>
      <mesh ref={core} position={[0, 0.29, 0]}>
        <boxGeometry args={[0.64, 0.1, 0.64]} /><Material color={C.teal} glow={0.15} />
      </mesh>
      {[-0.58, -0.2, 0.2, 0.58].flatMap((v) => [[v, 1.02], [v, -1.02], [1.02, v], [-1.02, v]]).map(([x, z], i) => (
        <RoundedBox key={i} args={[0.13, 0.1, 0.38]} radius={0.025} smoothness={3} position={[x, 0, z]} rotation={[0, Math.abs(x) > 0.9 ? Math.PI / 2 : 0, 0]}>
          <Material color={C.amber} metal />
        </RoundedBox>
      ))}
      <Line points={[[-0.22, 0.36, 0.18], [0, 0.36, 0.18], [0, 0.36, -0.2], [0.25, 0.36, -0.2]]} color={C.ice} lineWidth={1.5} />
    </group>
  );
}

function Wave({ reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const values = [0.45, 0.8, 1.25, 1.7, 1.25, 0.8, 0.45];
  useFrame(({ clock }) => {
    if (!group.current || reducedMotion) return;
    group.current.children.forEach((bar, i) => {
      bar.scale.y = 0.88 + Math.sin(clock.elapsedTime * 2 + i * 0.55) * 0.12;
    });
  });
  return (
    <group>
      <RoundedBox args={[3.15, 2.25, 0.18]} radius={0.3} smoothness={6} position={[0, 0, -0.35]}><Material color={C.navy} metal opacity={0.88} /></RoundedBox>
      <group ref={group}>
        {values.map((height, i) => (
          <mesh key={i} position={[(i - 3) * 0.38, 0, 0]}>
            <capsuleGeometry args={[0.09, height, 8, 20]} /><Material color={i === 3 ? C.mint : C.cyan} metal={i !== 3} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.87, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.4, 0.02]} /><Material color={C.steel} metal /></mesh>
    </group>
  );
}

function Stethoscope() {
  const left = useMemo<[number, number, number][]>(() => [[-0.68, 0.95, 0], [-0.78, 0.45, 0], [-0.58, -0.1, 0], [0, -0.4, 0], [0.18, -0.95, 0], [0.68, -1.02, 0]], []);
  const right = useMemo<[number, number, number][]>(() => [[0.68, 0.95, 0], [0.78, 0.45, 0], [0.58, -0.1, 0], [0, -0.4, 0]], []);
  return (
    <group rotation={[0.08, 0, -0.08]}>
      <Tube points={left} radius={0.075} /><Tube points={right} radius={0.075} />
      {[-0.68, 0.68].map((x) => (
        <group key={x} position={[x, 1.02, 0]} rotation={[0, 0, x < 0 ? -0.18 : 0.18]}>
          <mesh><capsuleGeometry args={[0.1, 0.3, 8, 20]} /><Material color={C.steel} metal /></mesh>
          <mesh position={[0, 0.24, 0]}><sphereGeometry args={[0.12, 20, 20]} /><Material color={C.graphite} /></mesh>
        </group>
      ))}
      <group position={[0.76, -1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh><cylinderGeometry args={[0.38, 0.38, 0.15, 48]} /><Material color={C.steel} metal /></mesh>
        <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.29, 0.29, 0.035, 48]} /><Material color={C.ice} metal /></mesh>
        <mesh position={[0, 0.115, 0]}><torusGeometry args={[0.19, 0.025, 8, 48]} /><Material color={C.teal} metal /></mesh>
      </group>
    </group>
  );
}

function Calendar({ reducedMotion }: SceneProps) {
  const hand = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (hand.current && !reducedMotion) hand.current.rotation.z = -clock.elapsedTime * 0.25;
  });
  return (
    <group rotation={[0.04, 0, 0]}>
      <RoundedBox args={[1.85, 1.8, 0.2]} radius={0.14} smoothness={5}><Material color={C.white} /></RoundedBox>
      <RoundedBox args={[1.86, 0.42, 0.23]} radius={0.1} smoothness={5} position={[0, 0.7, 0]}><Material color={C.teal} metal /></RoundedBox>
      {[-0.52, 0.52].map((x) => <mesh key={x} position={[x, 0.96, 0]}><capsuleGeometry args={[0.065, 0.24, 6, 16]} /><Material color={C.steel} metal /></mesh>)}
      {[-0.42, 0, 0.42].flatMap((y) => [-0.5, 0, 0.5].map((x) => (
        <RoundedBox key={`${x}-${y}`} args={[0.22, 0.15, 0.035]} radius={0.025} smoothness={3} position={[x, y - 0.12, 0.12]}><Material color={x === 0.5 && y === 0 ? C.mint : C.steel} opacity={0.75} /></RoundedBox>
      )))}
      <group position={[0.72, -0.65, 0.34]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.48, 0.48, 0.14, 48]} /><Material color={C.graphite} metal /></mesh>
        <mesh position={[0, 0, 0.085]}><circleGeometry args={[0.39, 48]} /><Material color={C.ice} /></mesh>
        <group ref={hand} position={[0, 0, 0.1]}>
          <RoundedBox args={[0.045, 0.31, 0.025]} radius={0.015} smoothness={3} position={[0, 0.13, 0]}><Material color={C.teal} metal /></RoundedBox>
        </group>
        <RoundedBox args={[0.24, 0.04, 0.025]} radius={0.015} smoothness={3} position={[0.1, 0, 0.1]}><Material color={C.graphite} metal /></RoundedBox>
      </group>
    </group>
  );
}

function Bottle({ reducedMotion }: SceneProps) {
  const liquid = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (liquid.current && !reducedMotion) liquid.current.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.035;
  });
  return (
    <group position={[0, -0.05, 0]}>
      <mesh><cylinderGeometry args={[0.62, 0.66, 1.55, 48]} /><Material color={C.amber} glass opacity={0.9} /></mesh>
      <mesh ref={liquid} position={[0, -0.3, 0]}><cylinderGeometry args={[0.54, 0.57, 0.78, 48]} /><Material color="#7e5b37" opacity={0.72} /></mesh>
      <mesh position={[0, 0.89, 0]}><cylinderGeometry args={[0.43, 0.52, 0.3, 48]} /><Material color={C.amber} glass opacity={0.9} /></mesh>
      <mesh position={[0, 1.12, 0]}><cylinderGeometry args={[0.5, 0.5, 0.3, 48]} /><Material color={C.white} /></mesh>
      {Array.from({ length: 20 }, (_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return <mesh key={i} position={[Math.cos(a) * 0.505, 1.12, Math.sin(a) * 0.505]} rotation={[0, -a, 0]}><boxGeometry args={[0.025, 0.22, 0.025]} /><Material color={C.steel} /></mesh>;
      })}
      <RoundedBox args={[0.9, 0.7, 0.035]} radius={0.05} smoothness={4} position={[0, -0.03, 0.62]}><Material color={C.white} /></RoundedBox>
      <mesh position={[0, 0.08, 0.65]}><boxGeometry args={[0.12, 0.38, 0.025]} /><Material color={C.teal} /></mesh>
      <mesh position={[0, 0.08, 0.65]}><boxGeometry args={[0.38, 0.12, 0.025]} /><Material color={C.teal} /></mesh>
    </group>
  );
}

function Person({ position, color = C.ice, scale = 1 }: { position: [number, number, number]; color?: string; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.58, 0]}><sphereGeometry args={[0.3, 32, 32]} /><Material color={color} /></mesh>
      <mesh position={[0, -0.15, 0]} scale={[1, 1.15, 0.65]}><capsuleGeometry args={[0.4, 0.45, 8, 24]} /><Material color={color} /></mesh>
      <mesh position={[0, 0.12, 0.28]}><torusGeometry args={[0.2, 0.025, 8, 32, Math.PI]} /><Material color={C.steel} metal /></mesh>
    </group>
  );
}

function People() {
  return (
    <group>
      <Person position={[0, 0.05, 0.35]} color={C.white} scale={1.05} />
      <Person position={[-0.88, -0.22, -0.12]} color={C.cyan} scale={0.82} />
      <Person position={[0.88, -0.22, -0.12]} color={C.steel} scale={0.82} />
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.9, 1.5, 64]} /><Material color={C.teal} metal opacity={0.25} /></mesh>
    </group>
  );
}

function Pin({ reducedMotion }: SceneProps) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current || reducedMotion) return;
    const phase = (clock.elapsedTime * 0.35) % 1;
    ring.current.scale.setScalar(0.7 + phase * 0.75);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.28 * (1 - phase);
  });
  return (
    <group position={[0, 0.25, 0]}>
      <mesh position={[0, 0.52, 0]} scale={[1, 1, 0.72]}><sphereGeometry args={[0.68, 48, 48]} /><Material color={C.red} /></mesh>
      <mesh position={[0, -0.35, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.57, 1.25, 48]} /><Material color={C.red} /></mesh>
      <mesh position={[0, 0.52, 0.48]}><circleGeometry args={[0.29, 48]} /><Material color={C.white} /></mesh>
      <mesh position={[0, 0.52, 0.5]}><boxGeometry args={[0.08, 0.32, 0.025]} /><Material color={C.teal} /></mesh>
      <mesh position={[0, 0.52, 0.5]}><boxGeometry args={[0.32, 0.08, 0.025]} /><Material color={C.teal} /></mesh>
      <mesh ref={ring} position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.65, 0.72, 64]} /><meshBasicMaterial color={C.teal} transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    </group>
  );
}

function Circadian({ reducedMotion }: SceneProps) {
  const marker = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (marker.current && !reducedMotion) marker.current.rotation.z = -clock.elapsedTime * 0.16;
  });
  return (
    <group rotation={[0.1, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.25, 1.25, 0.16, 64]} /><Material color={C.graphite} metal /></mesh>
      <mesh position={[0, 0, 0.1]}><circleGeometry args={[1.08, 64]} /><Material color={C.navy} /></mesh>
      <mesh position={[0, 0, 0.12]}><ringGeometry args={[0.78, 1.01, 64, 1, 0, Math.PI]} /><Material color={C.cyan} metal /></mesh>
      <mesh position={[0, 0, 0.13]} rotation={[0, 0, Math.PI]}><ringGeometry args={[0.78, 1.01, 64, 1, 0, Math.PI]} /><Material color={C.steel} metal /></mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <RoundedBox key={i} args={[0.035, i % 3 === 0 ? 0.17 : 0.09, 0.025]} radius={0.01} smoothness={2} position={[Math.sin(a) * 0.63, Math.cos(a) * 0.63, 0.16]} rotation={[0, 0, -a]}><Material color={C.ice} /></RoundedBox>;
      })}
      <group ref={marker} position={[0, 0, 0.22]}>
        <mesh position={[0, 0.78, 0]}><sphereGeometry args={[0.12, 24, 24]} /><Material color={C.mint} glow={0.15} /></mesh>
      </group>
      <mesh position={[0, 0, 0.2]}><circleGeometry args={[0.18, 32]} /><Material color={C.ice} metal /></mesh>
    </group>
  );
}

function Shield() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.12);
    shape.bezierCurveTo(0.5, 0.98, 0.82, 0.83, 0.95, 0.72);
    shape.bezierCurveTo(0.94, -0.25, 0.65, -0.82, 0, -1.15);
    shape.bezierCurveTo(-0.65, -0.82, -0.94, -0.25, -0.95, 0.72);
    shape.bezierCurveTo(-0.82, 0.83, -0.5, 0.98, 0, 1.12);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 5, curveSegments: 32 });
    g.center();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh geometry={geometry}><Material color={C.teal} metal /></mesh>
      <mesh geometry={geometry} position={[0, 0, -0.15]} scale={0.84}><Material color={C.navy} metal /></mesh>
      <RoundedBox args={[0.18, 0.8, 0.1]} radius={0.05} smoothness={4} position={[0, 0, 0.25]}><Material color={C.ice} metal /></RoundedBox>
      <RoundedBox args={[0.8, 0.18, 0.1]} radius={0.05} smoothness={4} position={[0, 0, 0.25]}><Material color={C.ice} metal /></RoundedBox>
    </group>
  );
}

function Bust({ reducedMotion }: SceneProps) {
  const scan = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (scan.current && !reducedMotion) scan.current.position.y = Math.sin(clock.elapsedTime * 0.75) * 0.8;
  });
  return (
    <group>
      <mesh position={[0, 0.52, 0]} scale={[0.86, 1.08, 0.9]}><sphereGeometry args={[0.55, 40, 40]} /><Material color={C.ice} /></mesh>
      <mesh position={[0, -0.68, 0]} scale={[1.15, 0.78, 0.65]}><sphereGeometry args={[0.9, 40, 40, 0, Math.PI * 2, 0, Math.PI / 2]} /><Material color={C.cyan} /></mesh>
      <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.22, 0.27, 0.5, 32]} /><Material color={C.ice} /></mesh>
      <mesh ref={scan} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.92, 0.018, 8, 64]} /><Material color={C.mint} glow={0.15} /></mesh>
      <mesh position={[0, -1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.72, 1.18, 64]} /><Material color={C.teal} metal opacity={0.25} /></mesh>
    </group>
  );
}

type SceneProps = { reducedMotion: boolean };
const MAP: Record<SectionKey, (props: SceneProps) => JSX.Element> = {
  dashboard: Bars,
  radiologist: Scan,
  advisor: Brain,
  chat: Bubbles,
  aichat: Chip,
  voiceai: Wave,
  doctors: Stethoscope,
  appointments: Calendar,
  prescriptions: Bottle,
  patients: People,
  map: Pin,
  dailyroutine: Circadian,
  admin: Shield,
  profile: Bust,
};

const SectionScene = ({ section, className = "" }: { section: SectionKey; className?: string }) => {
  const Obj = MAP[section];
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const night = theme === "dark";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <DraggableScene className={className} ready={ready}>
      <Canvas
        aria-hidden="true"
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.15, 5.6], fov: 39 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => setReady(true)}
      >
        <Suspense fallback={null}>
          <RenderSettings night={night} />
          <ambientLight intensity={night ? 0.38 : 0.55} />
          <hemisphereLight args={[night ? "#9bcbd8" : "#ffffff", night ? "#102630" : "#91aab2", 0.7]} />
          <directionalLight
            castShadow
            position={[4, 6, 5]}
            intensity={night ? 1.8 : 2.2}
            color={night ? "#c6e5ef" : "#ffffff"}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0004}
          />
          <directionalLight position={[-4, 1, 3]} intensity={0.75} color="#8bd7c7" />
          <pointLight position={[0, -1, 3]} intensity={5} distance={7} color="#d9f4f7" />
          <ClinicalMotion reducedMotion={reducedMotion}>
            <group scale={0.9}><Obj reducedMotion={reducedMotion} /></group>
          </ClinicalMotion>
          <ContactShadows position={[0, -1.65, 0]} opacity={night ? 0.22 : 0.3} scale={5} blur={2.8} far={3.5} color="#17313e" />
          <Environment>
            <Lightformer intensity={2.4} position={[0, 5, 3]} scale={[8, 8, 1]} />
            <Lightformer intensity={1.5} color="#a8dce7" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
            <Lightformer intensity={1.2} color="#a5d8c7" position={[5, 0, -1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </DraggableScene>
  );
};

export default SectionScene;
