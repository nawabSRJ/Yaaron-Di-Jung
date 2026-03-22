import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';

const TIER_EMISSIVE = { S: '#2a0000', A: '#2a1200', B: '#000e22' };

export function Player({ data, isLocal }) {
  const rootRef  = useRef();
  const torsoRef = useRef();
  const rArmRef  = useRef();
  const lArmRef  = useRef();
  const rForeRef = useRef();
  const lForeRef = useRef();
  const rThighRef = useRef();
  const lThighRef = useRef();
  const rShinRef  = useRef();
  const lShinRef  = useRef();

  const attackTimer = useRef(0);
  const walkCycle   = useRef(0);
  const isMovingRef = useRef(false);

  const tierEmissive = TIER_EMISSIVE[data.tier] || '#000000';
  const S = (data.scale || 1) * 1.5;

  // Body dimensions
  const HEAD_R    = 0.20 * S;
  const NECK_H    = 0.10 * S;
  const TORSO_W   = 0.46 * S;
  const TORSO_H   = 0.78 * S;
  const TORSO_D   = 0.26 * S;
  const UPPER_ARM_H = 0.34 * S;
  const FOREARM_H = 0.30 * S;
  const HAND_R    = 0.08 * S;
  const ARM_W     = 0.11 * S;
  const HIP_W     = 0.38 * S;
  const THIGH_H   = 0.40 * S;
  const SHIN_H    = 0.38 * S;
  const FOOT_L    = 0.18 * S;
  const LEG_W     = 0.13 * S;

  const SHIN_BOT  = 0;
  const THIGH_BOT = SHIN_H;
  const TORSO_BOT = SHIN_H + THIGH_H;
  const TORSO_MID = TORSO_BOT + TORSO_H * 0.5;
  const TORSO_TOP = TORSO_BOT + TORSO_H;
  const HEAD_CY   = TORSO_TOP + NECK_H + HEAD_R;

  const SHOULDER_Y = TORSO_H * 0.42;
  const ARM_SIDE   = TORSO_W * 0.58;

  const skinColor  = data.baseColor;
  const clothColor = '#1a1a2e';
  const shoeColor  = '#0d0d0d';

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    if (!isLocal) {
      rootRef.current.position.lerp(
        new THREE.Vector3(data.position.x, data.position.y, data.position.z), 0.2
      );
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y, data.rotY || 0, 0.2
      );
    }

    // Walk cycle
    const moving = isMovingRef.current;
    if (moving) walkCycle.current += delta * 8.5;
    const legSwing  = moving ? Math.sin(walkCycle.current) * 0.62 : 0;
    const shinBend  = moving ? Math.max(0, -Math.sin(walkCycle.current)) * 0.55 : 0;
    const shinBend2 = moving ? Math.max(0,  Math.sin(walkCycle.current)) * 0.55 : 0;

    if (rThighRef.current) rThighRef.current.rotation.x =  legSwing;
    if (lThighRef.current) lThighRef.current.rotation.x = -legSwing;
    if (rShinRef.current)  rShinRef.current.rotation.x  = -shinBend;
    if (lShinRef.current)  lShinRef.current.rotation.x  = -shinBend2;

    if (torsoRef.current) {
      torsoRef.current.rotation.z = moving ? Math.sin(walkCycle.current) * 0.03 : 0;
    }

    // Attack animation
    if (attackTimer.current > 0) {
      attackTimer.current = Math.max(0, attackTimer.current - delta * 4.5);
      const t     = attackTimer.current;
      const phase = t > 0.5 ? (1 - t) * 2 : t * 2;

      if (rArmRef.current)  rArmRef.current.rotation.x  = -phase * 1.6;
      if (rForeRef.current) rForeRef.current.rotation.x = -phase * 0.7;
      if (lArmRef.current)  lArmRef.current.rotation.x  =  phase * 0.5;
      if (torsoRef.current) torsoRef.current.rotation.y = -phase * 0.30;
    } else {
      if (rArmRef.current)  rArmRef.current.rotation.x  = moving ? -legSwing * 0.55 : THREE.MathUtils.lerp(rArmRef.current.rotation.x, 0, 0.1);
      if (lArmRef.current)  lArmRef.current.rotation.x  = moving ?  legSwing * 0.55 : THREE.MathUtils.lerp(lArmRef.current.rotation.x, 0, 0.1);
      if (rForeRef.current) rForeRef.current.rotation.x = THREE.MathUtils.lerp(rForeRef.current.rotation.x, 0, 0.1);
      if (lForeRef.current) lForeRef.current.rotation.x = THREE.MathUtils.lerp(lForeRef.current.rotation.x, 0, 0.1);
      if (torsoRef.current) torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, 0, 0.12);
    }
  });

  const triggerAttack = () => { attackTimer.current = 1; };
  const setMoving     = (v) => { isMovingRef.current = v; };

  return (
    <group
      ref={rootRef}
      position={isLocal ? [data.position.x, data.position.y, data.position.z] : undefined}
    >
      {isLocal && (
        <PlayerController playerRef={rootRef} onAttack={triggerAttack} onMoving={setMoving} />
      )}

      {/* ── LEFT THIGH ──────────────────────────────────────────────────── */}
      <group ref={lThighRef} position={[-HIP_W * 0.5, THIGH_BOT + THIGH_H * 0.5, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[LEG_W * 0.52, THIGH_H * 0.55, 4, 8]} />
          <meshStandardMaterial color={clothColor} roughness={0.85} />
        </mesh>
        <group ref={lShinRef} position={[0, -(THIGH_H * 0.54 + SHIN_H * 0.3), 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[LEG_W * 0.44, SHIN_H * 0.54, 4, 8]} />
            <meshStandardMaterial color={clothColor} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, -SHIN_H * 0.46, FOOT_L * 0.2]}>
            <boxGeometry args={[LEG_W * 1.1, LEG_W * 0.55, FOOT_L]} />
            <meshStandardMaterial color={shoeColor} roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ── RIGHT THIGH ─────────────────────────────────────────────────── */}
      <group ref={rThighRef} position={[HIP_W * 0.5, THIGH_BOT + THIGH_H * 0.5, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[LEG_W * 0.52, THIGH_H * 0.55, 4, 8]} />
          <meshStandardMaterial color={clothColor} roughness={0.85} />
        </mesh>
        <group ref={rShinRef} position={[0, -(THIGH_H * 0.54 + SHIN_H * 0.3), 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[LEG_W * 0.44, SHIN_H * 0.54, 4, 8]} />
            <meshStandardMaterial color={clothColor} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, -SHIN_H * 0.46, FOOT_L * 0.2]}>
            <boxGeometry args={[LEG_W * 1.1, LEG_W * 0.55, FOOT_L]} />
            <meshStandardMaterial color={shoeColor} roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ── TORSO ───────────────────────────────────────────────────────── */}
      <group ref={torsoRef} position={[0, TORSO_MID, 0]}>
        <mesh castShadow>
          <boxGeometry args={[TORSO_W, TORSO_H, TORSO_D]} />
          <meshStandardMaterial
            color={skinColor}
            emissive={tierEmissive}
            emissiveIntensity={data.tier === 'S' ? 0.55 : 0.22}
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>

        {/* S-tier shoulder armour */}
        {data.tier === 'S' && (
          <>
            <mesh position={[ TORSO_W * 0.54, TORSO_H * 0.38, 0]} castShadow>
              <sphereGeometry args={[ARM_W * 1.0, 8, 8]} />
              <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.9} metalness={0.7} />
            </mesh>
            <mesh position={[-TORSO_W * 0.54, TORSO_H * 0.38, 0]} castShadow>
              <sphereGeometry args={[ARM_W * 1.0, 8, 8]} />
              <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.9} metalness={0.7} />
            </mesh>
          </>
        )}

        {/* ── RIGHT ARM ─────────────────────────────────────────────────── */}
        <group ref={rArmRef} position={[ARM_SIDE, SHOULDER_Y, 0]}>
          <mesh castShadow position={[0, -UPPER_ARM_H * 0.5, 0]}>
            <capsuleGeometry args={[ARM_W * 0.52, UPPER_ARM_H * 0.5, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.55} />
          </mesh>
          <group ref={rForeRef} position={[0, -UPPER_ARM_H - FOREARM_H * 0.1, 0]}>
            <mesh castShadow position={[0, -FOREARM_H * 0.5, 0]}>
              <capsuleGeometry args={[ARM_W * 0.44, FOREARM_H * 0.5, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.55} />
            </mesh>
            <mesh castShadow position={[0, -FOREARM_H - HAND_R * 0.6, 0]}>
              <sphereGeometry args={[HAND_R, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>

        {/* ── LEFT ARM ──────────────────────────────────────────────────── */}
        <group ref={lArmRef} position={[-ARM_SIDE, SHOULDER_Y, 0]}>
          <mesh castShadow position={[0, -UPPER_ARM_H * 0.5, 0]}>
            <capsuleGeometry args={[ARM_W * 0.52, UPPER_ARM_H * 0.5, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.55} />
          </mesh>
          <group ref={lForeRef} position={[0, -UPPER_ARM_H - FOREARM_H * 0.1, 0]}>
            <mesh castShadow position={[0, -FOREARM_H * 0.5, 0]}>
              <capsuleGeometry args={[ARM_W * 0.44, FOREARM_H * 0.5, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.55} />
            </mesh>
            <mesh castShadow position={[0, -FOREARM_H - HAND_R * 0.6, 0]}>
              <sphereGeometry args={[HAND_R, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>

        {/* ── NECK + HEAD ───────────────────────────────────────────────── */}
        <group position={[0, TORSO_H * 0.5 + NECK_H * 0.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[ARM_W * 0.7, ARM_W * 0.85, NECK_H, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>

          <group position={[0, NECK_H * 0.5 + HEAD_R, 0]}>
            {/* Skull */}
            <mesh castShadow scale={[1, 1.15, 1]}>
              <sphereGeometry args={[HEAD_R, 20, 20]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>

            {/* Brow ridge */}
            <mesh position={[0, HEAD_R * 0.28, HEAD_R * 0.88]} rotation={[0.15, 0, 0]}>
              <boxGeometry args={[HEAD_R * 1.1, HEAD_R * 0.10, HEAD_R * 0.08]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>

            {/* Eyes */}
            {[0.32, -0.32].map((side, i) => (
              <group key={i} position={[HEAD_R * side, HEAD_R * 0.20, HEAD_R * 0.90]}>
                <mesh>
                  <sphereGeometry args={[HEAD_R * 0.18, 10, 10]} />
                  <meshStandardMaterial color="#f5f5f5" roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, HEAD_R * 0.12]}>
                  <circleGeometry args={[HEAD_R * 0.10, 10]} />
                  <meshStandardMaterial color="#111" />
                </mesh>
              </group>
            ))}

            {/* Nose */}
            <mesh position={[0, HEAD_R * 0.02, HEAD_R * 0.98]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[HEAD_R * 0.09, HEAD_R * 0.18, 5]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>

            {/* Mouth */}
            <mesh position={[0, -HEAD_R * 0.22, HEAD_R * 0.92]}>
              <boxGeometry args={[HEAD_R * 0.38, HEAD_R * 0.06, HEAD_R * 0.06]} />
              <meshStandardMaterial color="#5a2a2a" roughness={0.6} />
            </mesh>

            {/* Ears */}
            {[1, -1].map((side, i) => (
              <mesh key={i} position={[HEAD_R * side * 0.97, HEAD_R * 0.10, 0]}>
                <sphereGeometry args={[HEAD_R * 0.20, 6, 6]} />
                <meshStandardMaterial color={skinColor} roughness={0.5} />
              </mesh>
            ))}

            {/* Hair cap */}
            <mesh position={[0, HEAD_R * 0.55, -HEAD_R * 0.1]} scale={[1.02, 0.55, 1.05]}>
              <sphereGeometry args={[HEAD_R, 14, 14]} />
              <meshStandardMaterial color="#1a0f00" roughness={0.9} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Shield bubble */}
      {data.shieldActive && (
        <ShieldOrb centerY={TORSO_MID} radius={(HEAD_CY + HEAD_R) * 0.56} />
      )}

      {/* ── NAME ONLY above head — no HP bar, no tier label, no halo ─────── */}
      <Text
        position={[0, HEAD_CY + HEAD_R + 0.38 * S, 0]}
        fontSize={0.24 * S}
        color={isLocal ? '#ffd700' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        billboard
      >
        {data.name}
      </Text>
    </group>
  );
}

function ShieldOrb({ centerY, radius }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 1.3;
    ref.current.rotation.z = s.clock.elapsedTime * 0.5;
  });
  return (
    <mesh ref={ref} position={[0, centerY, 0]}>
      <sphereGeometry args={[radius, 18, 18]} />
      <meshStandardMaterial
        color="#88ccff" emissive="#2255ff" emissiveIntensity={0.5}
        transparent opacity={0.16} wireframe
      />
    </mesh>
  );
}