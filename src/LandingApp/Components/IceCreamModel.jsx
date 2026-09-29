import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls, 
  Environment, 
  Float, 
  ContactShadows, 
  Torus, 
  Cylinder,
  MeshDistortMaterial,
  PerspectiveCamera,
  PresentationControls
} from "@react-three/drei";
import * as THREE from "three";

const RealisticIceCreamScoop = ({ position, color, size = 0.7, speed = 1 }) => {
  const mesh = useRef();
  
  // Create a slightly irregular shape for realism
  return (
    <mesh position={position} ref={mesh}>
      <icosahedronGeometry args={[size, 15]} />
      <MeshDistortMaterial
        color={color}
        speed={speed * 0.5}
        distort={0.15}
        radius={1}
        roughness={0.8}
        metalness={0}
        flatShading={false}
      />
    </mesh>
  );
};

const FruitIceCreamBowl = () => {
  const group = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t / 10) * 0.2;
    }
  });

  return (
    <group ref={group}>
      {/* Premium Ceramic Bowl */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[1.6, 1.1, 1, 64, 1, false]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          roughness={0.05} 
          metalness={0.1} 
          clearcoat={1} 
          clearcoatRoughness={0.1}
          reflectivity={0.5}
        />
      </mesh>
      
      {/* Bowl Base */}
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[1.1, 1, 0.15, 64]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} clearcoat={0.5} />
      </mesh>

      {/* Ice Cream Scoops with realistic textures */}
      <RealisticIceCreamScoop position={[-0.45, -0.1, 0.35]} color="#FFD700" size={0.75} speed={0.8} /> {/* Mango */}
      <RealisticIceCreamScoop position={[0.55, -0.1, 0.2]} color="#FF69B4" size={0.7} speed={1.2} />  {/* Strawberry */}
      <RealisticIceCreamScoop position={[0.1, 0.05, -0.4]} color="#90EE90" size={0.65} speed={0.9} /> {/* Pistachio */}
      <RealisticIceCreamScoop position={[0, 0.55, 0]} color="#FFFDD0" size={0.6} speed={1.1} />     {/* Vanilla */}

      {/* Realistic Toppings */}
      {/* Strawberry Garnish */}
      <mesh position={[0.4, 0.8, 0.1]} rotation={[0.4, 0, 0.4]}>
        <icosahedronGeometry args={[0.15, 2]} />
        <meshStandardMaterial color="#D21F3C" roughness={0.3} />
      </mesh>
      
      {/* Blueberry Garnish */}
      <mesh position={[-0.3, 0.9, 0.2]}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial color="#4B0082" roughness={0.2} />
      </mesh>

      {/* Mint Leaf */}
      <mesh position={[-0.4, 0.7, -0.2]} rotation={[0.5, 1, 0.5]} scale={[0.05, 0.25, 0.15]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#2E8B57" roughness={0.5} />
      </mesh>
    </group>
  );
};

export default function IceCreamModel() {
  return (
    <div className="w-full h-full min-h-[450px] lg:min-h-[650px] cursor-grab active:cursor-grabbing">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={35} />
        
        {/* Studio Lighting Setup */}
        <ambientLight intensity={0.5} />
        <spotLight 
          position={[10, 15, 10]} 
          angle={0.2} 
          penumbra={1} 
          intensity={2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 5, -10]} intensity={1} color="#FFF4E0" />
        <directionalLight position={[0, 10, 0]} intensity={0.5} />
        
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 2, Math.PI / 2]}
        >
          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
            <FruitIceCreamBowl />
          </Float>
        </PresentationControls>
        
        <Environment preset="city" />
        <ContactShadows 
          position={[0, -1.25, 0]} 
          opacity={0.4} 
          scale={12} 
          blur={2.8} 
          far={4.5} 
          color="#000000"
        />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate 
          autoRotateSpeed={0.4} 
          maxPolarAngle={Math.PI / 1.8} 
          minPolarAngle={Math.PI / 3} 
        />
      </Canvas>
    </div>
  );
}

