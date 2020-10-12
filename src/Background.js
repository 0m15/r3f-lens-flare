import React, { useMemo, useRef } from "react"
import { apply, useRender, useThree } from "react-three-fiber"
//import { useLoader } from "react-three-fiber"
import { TextureLoader, LinearFilter, ShaderMaterial } from "three"

const backgroundMaterial = new ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
  varying vec2 vUv;
  uniform vec2 resolution;
  uniform vec2 mouse;
  uniform sampler2D map;
  
  void main() {
      vec2 p = (-0.5 + (gl_FragCoord.xy/resolution.xy)) * 2.0; 
      vec2 uv = vUv;
      vec2 offset = vec2(0.0);
      offset.x += mouse.x *0.01* abs(pow(p.x,0.75)); //length(uv - vec2(0.5));
      gl_FragColor = texture2D(map, uv + offset);
    }
  `,
  uniforms: {
    mouse: {
      value: [0, 0],
    },
    resolution: {
      value: [window.innerWidth, window.innerHeight],
    },
    map: {
      value: null,
    },
  },
})

export default function Background({ mouse, ...props }) {
  // const [map] = useLoader(TextureLoader, ["/earth.jpg"])
  const mesh = useRef()

  const { size } = useThree()

  const map = useMemo(() => {
    const t = new TextureLoader().load("/sample-2.jpg")
    t.minFilter = LinearFilter
    t.magFilter = LinearFilter
    return t
  }, [])

  useRender(() => {
    mesh.current.material = backgroundMaterial
    mesh.current.material.uniforms.resolution.value = [size.width, size.height]
    mesh.current.material.uniforms.mouse.value = [mouse.x, mouse.y]
    mesh.current.material.uniforms.map.value = map
  })

  return (
    <mesh ref={mesh} {...props}>
      <boxBufferGeometry args={[12, 6, 1]} name="geometry" />
      {/* <backgroundMaterial uniforms-map-value={map} name="material" /> */}
    </mesh>
  )
}
