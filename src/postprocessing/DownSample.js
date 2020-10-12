import {
    Mesh,
    OrthographicCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    UniformsUtils,
    Vector2,
  } from "three"
  import { DownSampleShader } from "../shaders/DownSample.js"
  import { Pass } from "./Pass.js"
  
  const DownSamplePass = function(dt_size) {
    Pass.call(this)
    if (DownSampleShader === undefined)
      console.error("DownSamplePass relies on DownSampleShader")
    const shader = DownSampleShader
    this.uniforms = UniformsUtils.clone(shader.uniforms)
    if (dt_size === undefined) dt_size = 128
    this.uniforms["resolution"].value = new Vector2(200, 120)
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
  
  DownSamplePass.prototype = Object.assign(Object.create(Pass.prototype), {
    constructor: DownSamplePass,
  
    render: function(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
      this.uniforms["texture"].value = readBuffer.texture
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
  
  export { DownSamplePass }
  