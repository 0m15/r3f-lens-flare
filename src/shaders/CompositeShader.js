import { Vector2 } from "three/src/Three"

const CompositeShader = {
  uniforms: {
    texture: { type: "t", value: null },
    tLens: { type: "t", value: null },
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
    uniform sampler2D tLens;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv; // vec2(gl_FragCoord.xy);
      vec4 tex = texture2D(texture, vUv);
      vec4 lensFlare = texture2D(tLens, vUv);
      lensFlare *= vec4(vec3(0.5), 1.0);
      //gl_FragColor = tex + lensFlare;
      gl_FragColor = 2.0 * mix(texture2D(texture, vUv), lensFlare, 0.5);
      //gl_FragColor = texture2D(texture, vUv);
      //gl_FragColor = max(vec4(0.0), texture2D(texture, vUv));
    }
  `,
}

export { CompositeShader }
