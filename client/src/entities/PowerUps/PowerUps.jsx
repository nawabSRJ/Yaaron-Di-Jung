import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const POWERUP_CONFIG = {
  shield: { color: '#4488ff', emissive: '#2255cc', symbol: 'SHIELD' },
  speed:  { color: '#44ffaa', emissive: '#228866', symbol: 'SPEED'  },
  damage: { color: '#ff6622', emissive: '#cc3300', symbol: 'DMG'    },
};

export function PowerUps({ powerups }) {
  return (
    <>
      {powerups.map((pu) => (
        <PowerUpOrb key={pu.id} powerup={pu} />
      ))}
    </>
  );
}

function PowerUpOrb({ powerup }) {
  const groupRef = useRef();
  const cfg = POWERUP_CONFIG[powerup.type] || POWERUP_CONFIG.shield;

  useFrame((state) => {
    if (!groupRef.current) return;
    // Hover float
    groupRef.current.position.y =
      powerup.position.y + Math.sin(state.clock.elapsedTime * 2 + powerup.position.x) * 0.3;
    // Slow spin
    groupRef.current.rotation.y = state.clock.elapsedTime * 1.2;
  });

  return (
    <group
      ref={groupRef}
      position={[powerup.position.x, powerup.position.y, powerup.position.z]}
    >
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.08, 8, 24]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Core orb */}
      <mesh>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Glow light */}
      <pointLight color={cfg.color} intensity={2} distance={4} decay={2} />

      {/* Label */}
      <Text
        position={[0, 1.0, 0]}
        fontSize={0.28}
        color={cfg.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {cfg.symbol}
      </Text>
    </group>
  );
}
