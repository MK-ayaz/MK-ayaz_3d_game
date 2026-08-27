import React from 'react'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { useGameStore } from '../store'

/**
 * Post-processing effects:
 * - Bloom: makes emissive lasers, explosions, and engine glows actually glow
 * - Vignette: subtle darkening at edges, focuses attention on the action
 * - ChromaticAberration: very subtle, only at high combo (3+) for "intensity" feel
 */
export function PostFX() {
  const gameState = useGameStore((s) => s.gameState)
  const comboMultiplier = useGameStore((s) => s.comboMultiplier)

  // Disable effects when not playing (perf)
  const enabled = gameState === 'playing' || gameState === 'paused' || gameState === 'gameover'

  if (!enabled) return null

  const showChroma = comboMultiplier >= 3

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.35}
        luminanceSmoothing={0.9}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
      />
      <Vignette
        eskil={false}
        offset={0.2}
        darkness={0.55}
        blendFunction={BlendFunction.NORMAL}
      />
      {showChroma && (
        <ChromaticAberration
          offset={[0.0008, 0.0008]}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  )
}
