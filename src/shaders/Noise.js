/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */

var NoiseShader = {
  uniforms: {
    uTime: { value: 1.0 },
    uAmount: { value: 0.3 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uAmount;
    uniform float uTime;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 p = vUv;
      float c = rand(p) * 1.2;
      gl_FragColor = vec4(vec3(c), uAmount);
    }
  `,
}

export { NoiseShader }
