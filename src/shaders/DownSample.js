import { Vector2 } from "three/src/Three"

const DownSampleShader = {
  uniforms: {
    texture: { type: "t", value: null },
    factor: { value: 0.5 },
    time: { value: 0 },
    mouse: {
      type: "v2",
      value: new Vector2(0, 0),
    },
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
    uniform float time;
    uniform sampler2D texture;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      vec4 ret = vec4(0.0);
      
      // 3x3 Gaussian blur
      float kernel[9];
      kernel[0] = 0.077847; kernel[1] = 0.123317; kernel[2] = 0.077847;
      kernel[3] = 0.123317; kernel[4] = 0.195346; kernel[5] = 0.123317;
      kernel[6] = 0.077847; kernel[7] = 0.123317; kernel[8] = 0.077847;

      vec2 scale = 2.0 / resolution; // scale can increase the blur radius 
      vec2 offsets[9];
      
      offsets[0] = vec2(-1.0, -1.0); offsets[1] = vec2( 0.0, -1.0); offsets[2] = vec2( 1.0, -1.0);
      offsets[3] = vec2(-1.0,  0.0); offsets[4] = vec2( 0.0,  0.0); offsets[5] = vec2( 1.0,  0.0);
      offsets[6] = vec2(-1.0,  1.0); offsets[7] = vec2( 0.0,  1.0); offsets[8] = vec2( 1.0,  1.0);

      for (int i = 0; i < 9; ++i) {
        ret += texture2D(texture, uv + offsets[i] * scale) * kernel[i];
      }
      
      gl_FragColor = ret;
      //gl_FragColor = texture2D(texture, vUv);
      //gl_FragColor = max(vec4(0.0), texture2D(texture, vUv));
    }
  `,
}

export { DownSampleShader }
