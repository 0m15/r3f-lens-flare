import React, { Suspense, useEffect } from "react"
import { Canvas } from "react-three-fiber"
import lerp from "lerp"
import Background from "./Background"
import LensFlare from "./LensFlare"
const _mouse = { x: 0, y: 0 }
const mouse = { x: 0, y: 0 }

export default function App() {
  useEffect(() => {
    const loop = () => {
      mouse.x = lerp(mouse.x, _mouse.x, 0.05)
      mouse.y = lerp(mouse.x, _mouse.y, 0.05)
      requestAnimationFrame(loop)
    }

    loop()
    const handleMouseMove = (evt) => {
      _mouse.x = (evt.clientX / window.innerWidth) * 2 - 1
      _mouse.y = (evt.clientY / window.innerHeight) * 2 - 1
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("mousemove", handleMouseMove, {
        passive: true,
      })
    }
  }, [])

  return (
    <Canvas
      camera={{
        fov: 50,
        position: [0, 0, 9],
      }}
    >
      <ambientLight intensity={1.0} />
      <Background mouse={mouse} />
      <LensFlare />
    </Canvas>
  )
}
