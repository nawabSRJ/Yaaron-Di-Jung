import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../core/useGameStore.js';
import { Player } from '../entities/Player/Player.jsx';
import { PowerUps } from '../entities/PowerUps/PowerUps.jsx';

const ARENA = 24; // half-size of arena

export function ArenaScene({ timeOfDay = 'day' }) {
  const { players, localPlayerId, powerups } = useGameStore();
  const isDay = timeOfDay === 'day';

  return (
    <>
      {/* ── Lighting ──────────────────────────────────────────────────────── */}
      {isDay ? (
        <>
          <ambientLight intensity={0.9} color="#fff8ef" />
          <directionalLight
            position={[40, 60, 20]}
            intensity={2.0}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={1}
            shadow-camera-far={150}
            shadow-camera-left={-35}
            shadow-camera-right={35}
            shadow-camera-top={35}
            shadow-camera-bottom={-35}
            color="#fffbe6"
          />
          {/* Soft blue fill from the opposite side */}
          <directionalLight position={[-30, 15, -30]} intensity={0.35} color="#c0d8ff" />
        </>
      ) : (
        <>
          <ambientLight intensity={0.18} color="#1a1a3a" />
          <directionalLight
            position={[20, 35, 10]}
            intensity={0.55}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={1}
            shadow-camera-far={120}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            color="#7799cc"
          />
          {/* Orange-red underlight from arena lava cracks */}
          <pointLight position={[0, 0.1, 0]} intensity={1.2} color="#ff4400" distance={50} decay={1.5} />
        </>
      )}

      {/* ── Sky / Background ──────────────────────────────────────────────── */}
      {isDay ? (
        <>
          <Sky
            distance={450}
            sunPosition={[80, 60, 20]}
            inclination={0.52}
            azimuth={0.25}
            turbidity={3}
            rayleigh={0.4}
          />
          <Cloud position={[-20, 28, -30]} speed={0.1} opacity={0.4} />
          <Cloud position={[25, 32, -15]} speed={0.08} opacity={0.3} />
        </>
      ) : (
        <Stars radius={90} depth={60} count={5000} factor={3.5} saturation={0.7} fade />
      )}

      {/* ── Ground ────────────────────────────────────────────────────────── */}
      <ArenaGround size={ARENA} isDay={isDay} />

      {/* ── Walls ─────────────────────────────────────────────────────────── */}
      <ArenaWalls size={ARENA} isDay={isDay} />

      {/* ── Ground-level decorations ──────────────────────────────────────── */}
      <GroundDecor size={ARENA} isDay={isDay} />

      {/* ── Corner torches ────────────────────────────────────────────────── */}
      <TorchPillar position={[ ARENA - 2, 0,  ARENA - 2]} isDay={isDay} />
      <TorchPillar position={[-(ARENA-2), 0,  ARENA - 2]} isDay={isDay} />
      <TorchPillar position={[ ARENA - 2, 0, -(ARENA-2)]} isDay={isDay} />
      <TorchPillar position={[-(ARENA-2), 0, -(ARENA-2)]} isDay={isDay} />

      {/* ── Mid-wall torches ──────────────────────────────────────────────── */}
      <TorchPillar position={[ ARENA - 2, 0, 0]} isDay={isDay} />
      <TorchPillar position={[-(ARENA-2), 0, 0]} isDay={isDay} />
      <TorchPillar position={[0, 0,  ARENA - 2]} isDay={isDay} />
      <TorchPillar position={[0, 0, -(ARENA-2)]} isDay={isDay} />

      {/* ── Players ───────────────────────────────────────────────────────── */}
      {players.map((p) =>
        p.eliminated ? null : (
          <Player key={p.id} data={p} isLocal={p.id === localPlayerId} />
        )
      )}

      {/* ── Power-ups ─────────────────────────────────────────────────────── */}
      <PowerUps powerups={powerups} />
    </>
  );
}

// ── Arena Ground ───────────────────────────────────────────────────────────────
// Flat stone courtyard — no floating platforms.
// Two layers: outer dirt/grass ring + inner paved stone.
function ArenaGround({ size, isDay }) {
  const outerColor  = isDay ? '#5c7a3e' : '#1a2210';   // grass/dirt outside
  const stoneColor  = isDay ? '#8a7a6a' : '#2a2018';   // paved arena floor
  const lineColor   = isDay ? '#6a5a4a' : '#1a1208';
  const crackGlow   = isDay ? '#cc6600' : '#ff4400';

  return (
    <group>
      {/* Outer ground (beyond walls — visible through gaps) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size * 4, size * 4]} />
        <meshStandardMaterial color={outerColor} roughness={0.95} />
      </mesh>

      {/* Main arena floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[size * 2, size * 2, 24, 24]} />
        <meshStandardMaterial color={stoneColor} roughness={0.88} metalness={0.05} />
      </mesh>

      {/* Central battle circle — glowing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[4.8, 5.1, 64]} />
        <meshStandardMaterial
          color={crackGlow} emissive={crackGlow}
          emissiveIntensity={isDay ? 0.5 : 1.4}
          transparent opacity={0.85}
        />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[1.8, 2.0, 32]} />
        <meshStandardMaterial
          color={crackGlow} emissive={crackGlow}
          emissiveIntensity={isDay ? 0.4 : 1.2}
          transparent opacity={0.7}
        />
      </mesh>

      {/* Corner accent diamonds */}
      {[
        [ size * 0.6,  size * 0.6],
        [-size * 0.6,  size * 0.6],
        [ size * 0.6, -size * 0.6],
        [-size * 0.6, -size * 0.6],
      ].map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, Math.PI / 4, 0]} position={[x, 0.007, z]}>
          <ringGeometry args={[1.0, 1.15, 4]} />
          <meshStandardMaterial
            color={crackGlow} emissive={crackGlow}
            emissiveIntensity={isDay ? 0.4 : 1.0}
            transparent opacity={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

// Thin stone tile lines
function GridLines({ size, color }) {
  const lines = [];
  const step = 4;
  for (let i = -size; i <= size; i += step) {
    lines.push(
      <mesh key={`h${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, i]}>
        <planeGeometry args={[size * 2, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>,
      <mesh key={`v${i}`} rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[i, 0.003, 0]}>
        <planeGeometry args={[size * 2, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    );
  }
  return <>{lines}</>;
}

// ── Arena Walls ────────────────────────────────────────────────────────────────
// Thick, chunky walls with battlements on top
function ArenaWalls({ size, isDay }) {
  const wallColor = isDay ? '#7a6850' : '#2a1e10';
  const trimColor = '#cc6600';
  const wallH = 3.5;
  const wallT = 1.0;

  const wallDefs = [
    // [x, z, width, depth] for box walls
    { pos: [0, wallH / 2, -size],  args: [size * 2 + wallT * 2, wallH, wallT] },
    { pos: [0, wallH / 2,  size],  args: [size * 2 + wallT * 2, wallH, wallT] },
    { pos: [-size, wallH / 2, 0],  args: [wallT, wallH, size * 2] },
    { pos: [ size, wallH / 2, 0],  args: [wallT, wallH, size * 2] },
  ];

  return (
    <>
      {wallDefs.map(({ pos, args }, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial color={wallColor} roughness={0.92} metalness={0.05} />
        </mesh>
      ))}

      {/* Glowing top trim on each wall */}
      {[
        [0,  wallH + 0.04, -size, size * 2 + wallT * 2, 0.12, wallT],
        [0,  wallH + 0.04,  size, size * 2 + wallT * 2, 0.12, wallT],
        [-size, wallH + 0.04, 0, wallT, 0.12, size * 2],
        [ size, wallH + 0.04, 0, wallT, 0.12, size * 2],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`t${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={trimColor} emissive={trimColor}
            emissiveIntensity={isDay ? 0.45 : 1.4}
          />
        </mesh>
      ))}

      {/* Battlements — crenellations on top of walls */}
      <Battlements size={size} wallH={wallH} wallT={wallT} wallColor={wallColor} isDay={isDay} />
    </>
  );
}

function Battlements({ size, wallH, wallT, wallColor, isDay }) {
  const merlonW  = 1.2;
  const merlonH  = 0.7;
  const merlonD  = wallT * 0.9;
  const count    = Math.floor((size * 2) / (merlonW * 2));
  const elements = [];

  const sides = [
    { axis: 'z', val: -size, rotY: 0 },
    { axis: 'z', val:  size, rotY: 0 },
    { axis: 'x', val: -size, rotY: 0 },
    { axis: 'x', val:  size, rotY: 0 },
  ];

  sides.forEach(({ axis, val }, si) => {
    for (let i = 0; i < count; i++) {
      const offset = -size + merlonW + i * merlonW * 2;
      const x = axis === 'x' ? val : offset;
      const z = axis === 'z' ? val : offset;
      elements.push(
        <mesh key={`${si}-${i}`} position={[x, wallH + merlonH / 2, z]} castShadow>
          <boxGeometry args={[axis === 'x' ? merlonD : merlonW, merlonH, axis === 'z' ? merlonD : merlonW]} />
          <meshStandardMaterial color={wallColor} roughness={0.92} />
        </mesh>
      );
    }
  });

  return <>{elements}</>;
}

// ── Ground-level decorations (no floating) ─────────────────────────────────────
function GroundDecor({ size, isDay }) {
  // Low stone pillars/columns around the inner ring
  const pillarPositions = [
    [ 6, 0,  0], [-6, 0,  0],
    [ 0, 0,  6], [ 0, 0, -6],
    [ 5, 0,  5], [-5, 0,  5],
    [ 5, 0, -5], [-5, 0, -5],
  ];
  const pillarColor = isDay ? '#6a5a4a' : '#221a10';
  const pillarH = 1.2;

  return (
    <>
      {pillarPositions.map(([x, y, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Stone column base */}
          <mesh castShadow receiveShadow position={[0, pillarH / 2, 0]}>
            <cylinderGeometry args={[0.22, 0.28, pillarH, 8]} />
            <meshStandardMaterial color={pillarColor} roughness={0.9} />
          </mesh>
          {/* Capital (top cap) */}
          <mesh position={[0, pillarH + 0.06, 0]} castShadow>
            <boxGeometry args={[0.55, 0.12, 0.55]} />
            <meshStandardMaterial color={pillarColor} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Chain barriers between pillars — ground level ropes/chains */}
      {/* (visual only, not physics) */}
    </>
  );
}

// ── Torch Pillar ───────────────────────────────────────────────────────────────
function TorchPillar({ position, isDay }) {
  const flameRef  = useRef();
  const glowRef   = useRef();

  useFrame((state) => {
    if (flameRef.current) {
      const t = state.clock.elapsedTime;
      flameRef.current.scale.x = 1 + Math.sin(t * 11) * 0.08;
      flameRef.current.scale.y = 1 + Math.sin(t * 7 + 1) * 0.14;
      flameRef.current.position.y = 3.85 + Math.sin(t * 5) * 0.04;
    }
  });

  const pillarColor = isDay ? '#5a4830' : '#2a1a08';

  return (
    <group position={position}>
      {/* Stone pillar */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.24, 3.6, 8]} />
        <meshStandardMaterial color={pillarColor} roughness={0.92} />
      </mesh>
      {/* Pillar cap */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <boxGeometry args={[0.42, 0.18, 0.42]} />
        <meshStandardMaterial color={pillarColor} roughness={0.88} />
      </mesh>
      {/* Torch bowl */}
      <mesh position={[0, 3.78, 0]}>
        <cylinderGeometry args={[0.20, 0.12, 0.24, 8]} />
        <meshStandardMaterial color="#4a3010" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 3.92, 0]}>
        <coneGeometry args={[0.12, 0.38, 7]} />
        <meshStandardMaterial
          color="#ff7700" emissive="#ff4400"
          emissiveIntensity={3.5} transparent opacity={0.88}
        />
      </mesh>
      {/* Inner bright core */}
      <mesh position={[0, 3.88, 0]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial
          color="#ffffff" emissive="#ffaa00"
          emissiveIntensity={4} transparent opacity={0.9}
        />
      </mesh>
      {/* Point light */}
      <pointLight
        position={[0, 3.92, 0]}
        color="#ff6600"
        intensity={isDay ? 1.8 : 4.5}
        distance={isDay ? 7 : 16}
        decay={2}
      />
    </group>
  );
}