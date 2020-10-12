import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import {
  apply as extend,
  useRender as useFrame,
  useThree,
} from "react-three-fiber"
import { RenderPass } from "./postprocessing/RenderPass"
import { ShaderPass } from "./postprocessing/ShaderPass"
import { BlurPass } from "./postprocessing/BlurPass"
import { CompositePass } from "./postprocessing/CompositePass"
import { TexturePass } from "./postprocessing/TexturePass"
import { DownSamplePass } from "./postprocessing/DownSample"
import { GlarePass } from "./postprocessing/GlarePass"
import { CopyShader } from "./shaders/CopyShader"
import { EffectComposer } from "./EffectComposer"
// import lensColor from '../../images/lens.jpg'

const CopyPass = function () {
  return new ShaderPass(CopyShader)
}

extend({
  EffectComposer,
  RenderPass,
  CopyPass,
  DownSamplePass,
  GlarePass,
  CompositePass,
  TexturePass,
  BlurPass,
})
export default function LensFlareEffect({ factor, mouse, gallery }) {
  const { gl, scene, camera, size, renderer } = useThree()

  const composer = useRef()
  const composer1 = useRef()

  const [colorRenderTarget, lensRenderTarget] = useMemo(
    () => [
      new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        stencilBuffer: false,
      }),
      new THREE.WebGLRenderTarget(size.width * 0.25, size.height * 0.25, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        stencilBuffer: false,
      }),
    ],
    [size.height, size.width]
  )

  useEffect(() => {
    console.log({ composer })
    composer.current.obj.setSize(size.width * 0.025, size.height * 0.025)
    composer1.current.obj.setSize(size.width, size.height)
  }, [size.width, size.height])

  // This takes over as the main render-loop (when 2nd arg is set to true)
  useFrame(() => {
    composer.current.obj.render()
    composer1.current.obj.render()
    gl.setRenderTarget(colorRenderTarget)
  }, true)

  // const lensColorTexture = new THREE.TextureLoader().load(lensColor)
  const lensColorTexture = null

  return (
    <>
      <effectComposer
        ref={composer}
        args={[gl, lensRenderTarget]}
        width={size.width}
        height={size.height}
      >
        <renderPass name="passes" args={[scene, camera]} />
        {/* <texturePass name="passes" args={[colorRenderTarget, 1, scene, camera]} /> */}
        {/* <downSamplePass name="passes" /> */}
        <glarePass lensColor={lensColorTexture} name="passes" />
        <blurPass name="passes" factor={18.0} />
      </effectComposer>
      <effectComposer ref={composer1} args={[gl]}>
        <renderPass name="passes" args={[scene, camera]} />
        {/* <texturePass name="passes" args={[colorRenderTarget, 1, scene, camera]} /> */}
        <compositePass
          name="passes"
          lensTexture={lensRenderTarget}
          renderToScreen
        />
      </effectComposer>
    </>
  )
}
