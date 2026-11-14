import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/hooks/useTheme";
import DraggableScene from "@/components/three/DraggableScene";

const NODE_COUNT = 58;
const SIGNAL_COUNT = 12;
const CYAN = "#43c6df";
const MINT = "#64dfba";
const ICE = "#d9f4f7";

type Signal = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  offset: number;
  speed: number;
};

function createNetwork() {
  const nodes: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < NODE_COUNT; i += 1) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const shell = 1.55 + Math.sin(i * 2.37) * 0.12;
    nodes.push(
      new THREE.Vector3(
        Math.cos(theta) * radius * shell,
        y * shell,
        Math.sin(theta) * radius * shell,
      ),
    );
  }

  const edgeKeys = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((node, index) => {
    const nearest = nodes
      .map((candidate, candidateIndex) => ({
        candidateIndex,
        distance: node.distanceTo(candidate),
      }))
      .filter(({ candidateIndex }) => candidateIndex !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    nearest.forEach(({ candidateIndex }) => {
      const a = Math.min(index, candidateIndex);
      const b = Math.max(index, candidateIndex);
      const key = `${a}-${b}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push([a, b]);
      }
    });
  });

  return { nodes, edges };
}

function NeuralCore({ reducedMotion }: { reducedMotion: boolean }) {
  const network = useMemo(createNetwork, []);
  const group = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const signalsRef = useRef<THREE.InstancedMesh>(null);
  const scannerRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const point = useMemo(() => new THREE.Vector3(), []);

  const connections = useMemo(() => {
    const positions = new Float32Array(network.edges.length * 6);
    network.edges.forEach(([from, to], index) => {
      network.nodes[from].toArray(positions, index * 6);
      network.nodes[to].toArray(positions, index * 6 + 3);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [network]);

  const signals = useMemo<Signal[]>(
    () =>
      Array.from({ length: SIGNAL_COUNT }, (_, index) => {
        const edge = network.edges[(index * 11 + 3) % network.edges.length];
        return {
          from: network.nodes[edge[0]],
          to: network.nodes[edge[1]],
          offset: (index * 0.173) % 1,
          speed: 0.09 + (index % 4) * 0.018,
        };
      }),
    [network],
  );

  useLayoutEffect(() => {
    if (!nodesRef.current) return;
    network.nodes.forEach((position, index) => {
      dummy.position.copy(position);
      const scale = index % 7 === 0 ? 1.45 : 0.82 + (index % 3) * 0.12;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      nodesRef.current?.setMatrixAt(index, dummy.matrix);
    });
    nodesRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, network]);

  useLayoutEffect(
    () => () => {
      connections.dispose();
    },
    [connections],
  );

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    if (group.current && !reducedMotion) {
      group.current.rotation.y += dt * 0.12;
      group.current.rotation.x = Math.sin(time * 0.19) * 0.14;
      group.current.rotation.z = Math.cos(time * 0.16) * 0.055;
      const breath = 1 + Math.sin(time * 1.05) * 0.018;
      group.current.scale.setScalar(breath);
    }

    if (scannerRef.current && !reducedMotion) {
      scannerRef.current.rotation.y = time * 0.16;
      scannerRef.current.rotation.z = Math.sin(time * 0.24) * 0.24;
    }

    if (haloRef.current) {
      const material = haloRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.075 + Math.sin(time * 1.05) * 0.018;
    }

    if (signalsRef.current) {
      signals.forEach((signal, index) => {
        const progress = reducedMotion
          ? signal.offset
          : (time * signal.speed + signal.offset) % 1;
        point.lerpVectors(signal.from, signal.to, progress);
        dummy.position.copy(point);
        dummy.scale.setScalar(0.65 + Math.sin(progress * Math.PI) * 0.7);
        dummy.updateMatrix();
        signalsRef.current?.setMatrixAt(index, dummy.matrix);
      });
      signalsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group rotation={[0.08, -0.35, -0.08]}>
      <group ref={group}>
        <lineSegments geometry={connections}>
          <lineBasicMaterial
            color={CYAN}
            transparent
            opacity={0.24}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        <instancedMesh ref={nodesRef} args={[undefined, undefined, NODE_COUNT]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial
            color={ICE}
            emissive={CYAN}
            emissiveIntensity={0.8}
            metalness={0.45}
            roughness={0.2}
          />
        </instancedMesh>

        <instancedMesh ref={signalsRef} args={[undefined, undefined, SIGNAL_COUNT]}>
          <sphereGeometry args={[0.072, 12, 12]} />
          <meshBasicMaterial color={MINT} toneMapped={false} />
        </instancedMesh>

        <mesh>
          <icosahedronGeometry args={[0.72, 3]} />
          <meshPhysicalMaterial
            color="#2e9db8"
            emissive="#0b5369"
            emissiveIntensity={0.32}
            roughness={0.16}
            metalness={0.3}
            clearcoat={1}
            clearcoatRoughness={0.12}
            transparent
            opacity={0.88}
          />
        </mesh>
        <mesh scale={1.04}>
          <icosahedronGeometry args={[0.72, 2]} />
          <meshBasicMaterial
            color={MINT}
            wireframe
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={haloRef}>
          <sphereGeometry args={[1.04, 32, 32]} />
          <meshBasicMaterial
            color={CYAN}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      <group ref={scannerRef}>
        <mesh rotation={[Math.PI / 2.35, 0.2, 0.25]}>
          <torusGeometry args={[2.02, 0.014, 8, 128]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.42} />
        </mesh>
        <mesh rotation={[Math.PI / 2.8, 0.85, -0.65]}>
          <torusGeometry args={[2.24, 0.01, 8, 128]} />
          <meshBasicMaterial color={MINT} transparent opacity={0.24} />
        </mesh>
        <mesh rotation={[0.35, 0.4, Math.PI / 2]}>
          <torusGeometry args={[1.86, 0.008, 8, 128]} />
          <meshBasicMaterial color={ICE} transparent opacity={0.2} />
        </mesh>
      </group>

      <mesh position={[0, -2.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 1.45, 96]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.055}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, pointer } = useThree();

  useFrame((_, delta) => {
    if (reducedMotion) return;
    const smoothing = 1 - Math.exp(-2.4 * Math.min(delta, 0.05));
    camera.position.x += (pointer.x * 0.28 - camera.position.x) * smoothing;
    camera.position.y += (pointer.y * 0.2 + 0.1 - camera.position.y) * smoothing;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

const AuthNeuralScene = () => {
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const night = theme === "dark";

  return (
    <DraggableScene className="absolute inset-0" ready={ready}>
      <Canvas
        aria-hidden="true"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.1, 6.4], fov: 43 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => setReady(true)}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={night ? 0.48 : 0.72} />
          <hemisphereLight
            args={[night ? "#8dd9e8" : "#ffffff", night ? "#071a26" : "#a9c9d0", 0.65]}
          />
          <directionalLight position={[4, 5, 6]} intensity={night ? 1.5 : 1.8} />
          <pointLight position={[-4, -2, 2]} intensity={18} color={MINT} />
          <NeuralCore reducedMotion={reducedMotion} />
          <CameraRig reducedMotion={reducedMotion} />
          <Environment>
            <Lightformer intensity={2.2} position={[0, 5, 3]} scale={[9, 9, 1]} />
            <Lightformer
              intensity={1.25}
              color="#86e5df"
              position={[-5, 0, 1]}
              rotation-y={Math.PI / 2}
              scale={[12, 2, 1]}
            />
            <Lightformer
              intensity={0.8}
              color="#8acbe8"
              position={[5, -1, 0]}
              rotation-y={-Math.PI / 2}
              scale={[10, 2, 1]}
            />
          </Environment>
        </Suspense>
      </Canvas>
    </DraggableScene>
  );
};

export default AuthNeuralScene;
