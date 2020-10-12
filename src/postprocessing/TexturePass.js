/**
 * @author alteredq / http://alteredqualia.com/
 */

import * as THREE from "three"
import { CopyShader } from "../shaders/CopyShader"
import { Pass } from "./Pass.js"
import { Texture } from "three";

const TexturePass = function(texture, opacity, scene, camera) {
  Pass.call(this)
  if (CopyShader === undefined)
    console.error("TexturePass relies on CopyShader")

  var shader = CopyShader

  this.uniforms = THREE.UniformsUtils.clone(shader.uniforms)

  this.uniforms["opacity"].value = opacity !== undefined ? opacity : 1.0
  this.uniforms["tDiffuse"].value = texture

  this.material = new THREE.ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
  })

  this.enabled = true
  this.needsSwap = false

  this.scene = scene
  this.camera = camera
}

TexturePass.prototype = Object.assign(Object.create(Pass.prototype), {
  constructor: TexturePass,
  render: function(renderer, writeBuffer, readBuffer, delta) {
    //THREE.EffectComposer.quad.material = this.material
    renderer.setRenderTarget(readBuffer)
    renderer.render(this.scene, this.camera)
  },
})

export { TexturePass }
