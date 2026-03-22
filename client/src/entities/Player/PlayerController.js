import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { socket } from '../../core/socket.js';
import { useGameStore } from '../../core/useGameStore.js';
import { audio } from '../../systems/AudioSystem.js';

const SPEED_BASE    = 9;
const JUMP_FORCE    = 7;
const GRAVITY       = -22;
const MOUSE_SENS    = 0.002;
const CAM_DIST      = 8;
const CAM_HEIGHT    = 3.0;
const CAM_MIN_PITCH = -0.20;
const CAM_MAX_PITCH =  0.80;
const TURN_SPEED    = 0.18;
const SEND_HZ       = 0.05;
const ARENA_BOUND   = 21.5;

export function PlayerController({ playerRef, onAttack, onMoving }) {
  const { gl } = useThree();

  const keys    = useRef({});
  const yaw     = useRef(0);
  const pitch   = useRef(0.25);
  const isLocked = useRef(false);
  const sendTimer = useRef(0);

  // ── Own position ref — NOT derived from mesh.position ─────────────────────
  // This is the jitter fix. Previously we read/wrote mesh.position directly
  // and then immediately computed the camera from it in the same frame.
  // Three.js hasn't rendered the mesh yet at that point, so there's a
  // one-frame mismatch between the mesh visuals and the camera target → shiver.
  //
  // Solution: keep our own authoritative position in a plain object ref.
  // Every frame we: (1) update pos ref, (2) write it to mesh, (3) compute
  // camera from the same pos ref values. Everything is in sync, zero jitter.
  const pos = useRef({ x: 0, y: 0, z: 0 });
  const vel = useRef({ x: 0, y: 0, z: 0 });
  const onGround = useRef(true);

  useEffect(() => {
    const canvas = gl.domElement;

    // Sync starting position from the mesh so it doesn't snap on first frame
    if (playerRef.current) {
      const mp = playerRef.current.position;
      pos.current.x = mp.x;
      pos.current.y = mp.y;
      pos.current.z = mp.z;
    }

    const requestLock = () => canvas.requestPointerLock();
    canvas.addEventListener('click', requestLock);

    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };
    document.addEventListener('pointerlockchange', onLockChange);

    const onMouseMove = (e) => {
      if (!isLocked.current) return;
      yaw.current   -= e.movementX * MOUSE_SENS;
      pitch.current += e.movementY * MOUSE_SENS;
      pitch.current  = Math.max(CAM_MIN_PITCH, Math.min(CAM_MAX_PITCH, pitch.current));
    };
    document.addEventListener('mousemove', onMouseMove);

    const onKeyDown = (e) => {
      keys.current[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    };
    const onKeyUp = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onMouseDown = (e) => {
      if (!isLocked.current) return;
      if (e.button === 0) {
        socket.emit('player:attack');
        onAttack?.();
        audio.play('punch');
      }
    };
    document.addEventListener('mousedown', onMouseDown);

    const unsubscribe = useGameStore.subscribe((state) => {
      if (!['game', 'spectator'].includes(state.screen) && document.pointerLockElement) {
        document.exitPointerLock();
      }
    });

    return () => {
      canvas.removeEventListener('click', requestLock);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      unsubscribe();
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const { players, localPlayerId } = useGameStore.getState();
    const me = players.find((p) => p.id === localPlayerId);
    if (!me || me.eliminated) return;

    const mesh = playerRef.current;
    const cam  = state.camera;

    const speedMult = (me.speedMultiplier || 1) * (me.speedBoost ? 1.5 : 1);
    const speed     = SPEED_BASE * speedMult;

    // ── Movement direction from camera yaw (horizontal only) ─────────────────
    const fwdX = -Math.sin(yaw.current);
    const fwdZ = -Math.cos(yaw.current);
    const rgtX =  Math.cos(yaw.current);
    const rgtZ = -Math.sin(yaw.current);

    let moveX = 0;
    let moveZ = 0;

    if (keys.current['KeyW'] || keys.current['ArrowUp'])    { moveX += fwdX; moveZ += fwdZ; }
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  { moveX -= fwdX; moveZ -= fwdZ; }
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  { moveX -= rgtX; moveZ -= rgtZ; }
    if (keys.current['KeyD'] || keys.current['ArrowRight']) { moveX += rgtX; moveZ += rgtZ; }

    const moveMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveMag > 0.001) { moveX /= moveMag; moveZ /= moveMag; }

    const isMoving = moveMag > 0.001;
    onMoving?.(isMoving);

    // Footstep loop — start when moving on ground, stop otherwise
    if (isMoving && onGround.current) {
      audio.startFootstep();
    } else {
      audio.stopFootstep();
    }

    vel.current.x = moveX * speed;
    vel.current.z = moveZ * speed;

    // ── Jump & gravity ────────────────────────────────────────────────────────
    if (keys.current['Space'] && onGround.current) {
      vel.current.y  = JUMP_FORCE;
      onGround.current = false;
      audio.play('jump');
      audio.stopFootstep();
    }
    vel.current.y += GRAVITY * delta;

    // ── Integrate into our own pos ref ────────────────────────────────────────
    pos.current.x += vel.current.x * delta;
    pos.current.y += vel.current.y * delta;
    pos.current.z += vel.current.z * delta;

    if (pos.current.y <= 0) {
      pos.current.y  = 0;
      vel.current.y  = 0;
      onGround.current = true;
    }

    pos.current.x = Math.max(-ARENA_BOUND, Math.min(ARENA_BOUND, pos.current.x));
    pos.current.z = Math.max(-ARENA_BOUND, Math.min(ARENA_BOUND, pos.current.z));

    // ── Write pos ref → mesh (single authoritative write per frame) ───────────
    mesh.position.x = pos.current.x;
    mesh.position.y = pos.current.y;
    mesh.position.z = pos.current.z;

    // ── Avatar faces movement direction ───────────────────────────────────────
    if (isMoving) {
      const targetAngle = Math.atan2(moveX, moveZ);
      let diff = targetAngle - mesh.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      mesh.rotation.y += diff * TURN_SPEED;
    }

    // ── Camera computed from pos ref — same values, same frame, zero jitter ───
    const pitchCos = Math.cos(pitch.current);
    const pitchSin = Math.sin(pitch.current);

    cam.position.x = pos.current.x + Math.sin(yaw.current) * CAM_DIST * pitchCos;
    cam.position.y = pos.current.y + CAM_HEIGHT + pitchSin * CAM_DIST;
    cam.position.z = pos.current.z + Math.cos(yaw.current) * CAM_DIST * pitchCos;

    cam.lookAt(pos.current.x, pos.current.y + 1.6, pos.current.z);

    // ── Network sync at 20 Hz ─────────────────────────────────────────────────
    sendTimer.current += delta;
    if (sendTimer.current >= SEND_HZ) {
      sendTimer.current = 0;
      socket.emit('player:input', {
        x:    pos.current.x,
        y:    pos.current.y,
        z:    pos.current.z,
        rotY: mesh.rotation.y,
        jumping: !onGround.current,
      });
    }
  });

  return null;
}