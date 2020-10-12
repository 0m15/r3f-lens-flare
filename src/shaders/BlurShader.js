import { Vector2 } from "three/src/Three"

var BlurShader = {
  uniforms: {
    texture: { type: "t", value: null },
    factor: { value: 0.5 },
    resolution: {
      type: "v2",
      value: null,
    },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
  fragmentShader: `
      uniform float factor;
      uniform vec2 resolution;
      uniform sampler2D texture;
      varying vec2 vUv;
  
      vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.3846153846) * direction;
        vec2 off2 = vec2(3.2307692308) * direction;
        color += texture2D(image, uv) * 0.2270270270;
        color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
        color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
        color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
        color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
        return color;
      }
  
      void main() {
        //vec2 uv = vec2(gl_FragCoord.xy / resolution.xy);
        vec2 uv = vUv;
        vec2 direction = vec2(0.05, 0.05) * factor;
        gl_FragColor = blur9(texture, uv, resolution.xy, direction);
      }
    `,
}

export { BlurShader }
