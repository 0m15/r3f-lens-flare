import { Vector2 } from "three/src/Three"

var GlareShader = {
  uniforms: {
    texture: { type: "t", value: null },
    lensColor: { type: "t", value: null },
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
    uniform vec2 mouse;
    uniform float time;
    uniform sampler2D texture;
    uniform sampler2D lensColor;
    varying vec2 vUv;

    const int uGhostSamples = 4;
    const float uChromaticAberration = 0.01;
    const float uGhostThreshold = 0.8;
    const float uGhostSpacing = 0.1;
    const float fHaloWidth = 0.71;
    const float uHaloThickness = 0.04;
    const float uHaloRadius = 0.6;
    const float uHaloAspectRatio = 0.5;
    const float uHaloThreshold = 0.5;

    // Cubic window; map [0, _radius] in [1, 0] as a cubic falloff from _center.
    float Window_Cubic(float _x, float _center, float _radius) {
      _x = min(abs(_x - _center) / _radius, 1.0);
      return 1.0 - _x * _x * (3.0 - 2.0 * _x);
    }

    vec3 ApplyThreshold(in vec3 _rgb, in float _threshold) {
	    return max(_rgb - vec3(_threshold), vec3(0.0));
    }

    vec3 textureDistorted(in vec2 _uv) {
      #if 0
        return texture2D(texture, _uv).rgb;
      #else
        vec2 offset = normalize(vec2(0.5) - _uv) * uChromaticAberration;
        return vec3(
          texture2D(texture, _uv + offset).r,
          texture2D(texture, _uv).g,
          texture2D(texture, _uv - offset).b
      );
     #endif
   }

    vec3 sampleghosts(in vec2 _uv, in float _threshold) {
      vec3 ret = vec3(0.0);
      vec2 ghostVec = (vec2(0.5) - _uv) * uGhostSpacing;

      for (int i = 0; i < uGhostSamples; ++i) {
        // sample scene color
        vec2 suv = fract(_uv + ghostVec * vec2(i));
        vec3 s = textureDistorted(suv);
        float distanceToCenter = distance(suv, vec2(0.5));
        s = ApplyThreshold(s, _threshold);
        //s *= texture2D(lensColor, vec2(distanceToCenter, 0.5), 0.0).rgb;
         
        // tint/weight
        float d = distance(suv, vec2(0.5));
        float weight = 1.0 - smoothstep(0.0, 0.75, d); // analytical weight
        s *= weight;
        ret += s;
      }

      return ret;
    }

     vec3 SampleHalo(in vec2 _uv, in float _radius, in float _aspectRatio, in float _threshold) {
      vec2 haloVec = vec2(0.5) - _uv;
      haloVec.x /= resolution.x/resolution.y;
      haloVec = normalize(haloVec);
      haloVec.x *= _aspectRatio;
      vec2 wuv = (_uv - vec2(0.5, 0.0)) / vec2(_aspectRatio, 1.0) + vec2(0.5, 0.0);
      float haloWeight = distance(wuv, vec2(0.5));
      haloVec *= _radius;
      haloWeight = Window_Cubic(haloWeight, _radius, uHaloThickness);
      return ApplyThreshold(textureDistorted(_uv + haloVec), _threshold) * haloWeight;
    }

    void main() {
      vec2 uv = -vUv + vec2(1.0);
      vec3 ret = vec3(0.0);

      ret += sampleghosts(uv, uGhostThreshold);
      ret += SampleHalo(uv, uHaloRadius, uHaloAspectRatio, uHaloThreshold);

      gl_FragColor = vec4(ret, 1.0);
      // vec4 rgba = texture2D(texture, vUv);
      // gl_FragColor = vec4(mix(rgba.rgb, ret, 0.2), rgba.a); 
      //gl_FragColor = vec4(ret + texture2D(texture, vUv).rgb, 1.0);
    }
  `,
}

export { GlareShader }
