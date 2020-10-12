/**
 * @author alteredq / http://alteredqualia.com/
 */

import * as THREE from "three/src/Three"
import { Pass } from "./Pass.js"
import { FilmShader } from "../shaders/FilmShader.js"

const FilmPass = function(
  noiseIntensity,
  scanlinesIntensity,
  scanlinesCount,
  grayscale
) {
  Pass.call(this)

  if (FilmShader === undefined)
    console.error("THREE.FilmPass relies on FilmShader")

  var shader = FilmShader

  this.uniforms = THREE.UniformsUtils.clone(shader.uniforms)

  this.material = new THREE.ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
  })

  if (grayscale !== undefined) this.uniforms.grayscale.value = grayscale
  if (noiseIntensity !== undefined)
    this.uniforms.nIntensity.value = noiseIntensity
  if (scanlinesIntensity !== undefined)
    this.uniforms.sIntensity.value = scanlinesIntensity
  if (scanlinesCount !== undefined) this.uniforms.sCount.value = scanlinesCount

  this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  this.scene = new THREE.Scene()

  this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null)
  this.quad.frustumCulled = false // Avoid getting clipped
  this.scene.add(this.quad)
}

FilmPass.prototype = Object.assign(Object.create(Pass.prototype), {
  constructor: THREE.FilmPass,

  render: function(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    this.uniforms["tDiffuse"].value = readBuffer.texture
    this.uniforms["time"].value += deltaTime

    this.quad.material = this.material

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
      renderer.render(this.scene, this.camera)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
      renderer.render(this.scene, this.camera)
    }
  },
})

export { FilmPass }
