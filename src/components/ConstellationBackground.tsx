import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { constellationNodes, constellationConnections } from "@/data/mockData";

const vertexShader = `
  uniform float uTime;
  varying vec3 vColor;
  void main() {
    vColor = instanceColor;
    vec3 p = instanceMatrix[3].xyz;
    float dist = length(p);
    float t = sin(uTime * 0.5 + dist * 0.01) * 0.5 + 0.5;
    float scale = 0.8 + t * 0.4 * (1.0 - dist * 0.005);
    vec4 mv = modelViewMatrix * instanceMatrix;
    mv[0].xyz = normalize(mv[0].xyz) * scale;
    mv[1].xyz = normalize(mv[1].xyz) * scale;
    mv[2].xyz = normalize(mv[2].xyz) * scale;
    gl_Position = projectionMatrix * mv * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(vColor, alpha * 0.9);
  }
`;

const lineVertexShader = `
  uniform float uTime;
  varying float vAlpha;
  void main() {
    float dist = length(instanceMatrix[3].xyz);
    float t = sin(uTime * 0.5 + dist * 0.01) * 0.5 + 0.5;
    vAlpha = 0.12 * t + sin(uTime) * 0.05;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const lineFragmentShader = `
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(0.176, 0.561, 0.941, vAlpha);
  }
`;

function Nodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useMemo(() => {
    // Pre-compute data for constellation nodes
    constellationNodes.forEach(() => {
      // Nodes are positioned via the render loop below
    });
  }, []);

  useFrame(state => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  const dummy = useMemo(() => new THREE.Object3D(), []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, constellationNodes.length]}
    >
      <sphereGeometry args={[0.25, 8, 8]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
      {constellationNodes.map((node, i) => {
        dummy.position.set(node.x, node.y, node.z);
        dummy.scale.setScalar(node.size);
        dummy.updateMatrix();
        return (
          <primitive
            key={i}
            object={dummy.clone()}
            attach={`instanceMatrix-${i}`}
            matrix={dummy.matrix}
          />
        );
      })}
    </instancedMesh>
  );
}

function Connections() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const lines = useMemo(() => {
    const validConnections = constellationConnections.filter(
      c =>
        c.from !== c.to &&
        c.from < constellationNodes.length &&
        c.to < constellationNodes.length
    );
    return validConnections;
  }, []);

  useFrame(state => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((conn, i) => {
        const from = constellationNodes[conn.from];
        const to = constellationNodes[conn.to];
        if (!from || !to) return null;
        const points = [
          new THREE.Vector3(from.x, from.y, from.z),
          new THREE.Vector3(to.x, to.y, to.z),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <lineSegments key={i} geometry={geometry}>
            <shaderMaterial
              ref={i === 0 ? materialRef : undefined}
              vertexShader={lineVertexShader}
              fragmentShader={lineFragmentShader}
              uniforms={{ uTime: { value: 0 } }}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        );
      })}
    </group>
  );
}

export default function ConstellationBackground() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: "#0A0F1C" }}>
      <Canvas
        camera={{ position: [0, 0, 40], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <Nodes />
        <Connections />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enableZoom={true}
          enablePan={false}
          rotateSpeed={0.5}
          minDistance={15}
          maxDistance={80}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
