import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { SocketManager } from './multiplayer/SocketManager.js';
import { useGameStore } from './core/useGameStore.js';
import { ArenaScene } from './scenes/ArenaScene.jsx';
import { HUD } from './ui/HUD.jsx';
import { Menu } from './ui/Menu.jsx';
import { Lobby } from './ui/Lobby.jsx';
import { SpectatorOverlay, GameEndScreen, ShuffleAnnouncement } from './ui/Overlays.jsx';
import { SettingsPanel } from './ui/SettingsPanel.jsx';
 
export default function App() {
  const screen    = useGameStore((s) => s.screen);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const showCanvas = screen === 'game' || screen === 'spectator' || screen === 'ended';
 
  return (
    <>
      <SocketManager />
 
      {/* Settings gear — visible on every screen */}
      <SettingsPanel />
 
      {screen === 'menu'  && <Menu />}
      {screen === 'lobby' && <Lobby />}
 
      {showCanvas && (
        <>
          <Canvas
            shadows
            camera={{ position: [0, 10, 20], fov: 65, near: 0.1, far: 300 }}
            style={{
              position: 'fixed', inset: 0,
              background: timeOfDay === 'day' ? '#87ceeb' : '#050302',
            }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <Suspense fallback={null}>
              <ArenaScene timeOfDay={timeOfDay} />
            </Suspense>
          </Canvas>
 
          {screen === 'game'      && <HUD />}
          {screen === 'spectator' && <SpectatorOverlay />}
          {screen !== 'ended'     && <ShuffleAnnouncement />}
          {screen === 'ended'     && <GameEndScreen />}
        </>
      )}
    </>
  );
}
 