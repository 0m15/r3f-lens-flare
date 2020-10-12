
import {
    DataTexture,
    FloatType,
    Math as _Math,
    Mesh,
    OrthographicCamera,
    PlaneBufferGeometry,
    RGBFormat,
    Scene,
    ShaderMaterial,
    UniformsUtils,
    Vector2,
  } from 'three'
  import { BlurShader } from '../shaders/BlurShader.js'
  import { Pass } from './Pass.js'
  
  const BlurPass = function(dt_size) {
    Pass.call(this)
    if (BlurShader === undefined) console.error('BlurPass relies on THREE.BlurShader')
    const shader = BlurShader
    this.uniforms = UniformsUtils.clone(shader.uniforms)
    if (dt_size === undefined) dt_size = 64
    this.uniforms['resolution'].value = new Vector2(dt_size, dt_size)
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    })
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.scene = new Scene()
    this.quad = new Mesh(new PlaneBufferGeometry(2, 2), null)
    this.quad.frustumCulled = false // Avoid getting clipped
    this.scene.add(this.quad)
    this.factor = 0
    this.time = 0
  }
  
  BlurPass.prototype = Object.assign(Object.create(Pass.prototype), {
    constructor: BlurPass,
  
    render: function(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
      const factor = Math.max(0, this.factor)
      this.uniforms['texture'].value = readBuffer.texture
      this.uniforms['factor'].value = this.factor
      this.time += 0.05
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
  
  export { BlurPass }