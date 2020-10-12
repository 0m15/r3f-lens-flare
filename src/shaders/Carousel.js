import * as THREE from "three/src/Three"

const size = [0, 0]

if (typeof window !== "undefined") {
  size[0] = window.innerWidth
  size[1] = window.innerHeight
}
export default {
  side: THREE.DoubleSide,
  lights: true,
  uniforms: THREE.UniformsUtils.merge([
    THREE.UniformsLib["lights"],
    {
      lightIntensity: { type: "f", value: 1.0 },
      textureSampler: { type: "t", value: null },
      time: { type: "f", value: 0 },
      alpha: { type: "f", value: 0 },
      pixels: {
        type: "v2",
        value: new THREE.Vector2(size[0], size[1]),
      },
      accel: { type: "v2", value: new THREE.Vector2(0.1, 0.5) },
      progress: { type: "f", value: 0 },
      uvRate1: {
        value: new THREE.Vector2(1, 1),
      },
      texture1: {
        type: "t",
      },
      texture2: {
        type: "t",
      },
      depthMap: {
        type: "t",
      },
      mouse: {
        type: "v2",
        value: new THREE.Vector2(0, 0),
      },
    },
  ]),
  vertexShader: `
    uniform float time;
    varying vec2 vUv;
    varying vec2 vUv1;
    varying vec4 vPosition;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform vec2 pixels;
    uniform vec2 uvRate1;
    varying vec3 vecPos;
    varying vec3 vecNormal;

    void main() {
      vUv = uv;
      vec2 _uv = uv - 0.5;
      _uv.y = -_uv.y;
      vUv1 = _uv;
      vUv1 *= uvRate1.xy;
      vUv1 += 0.5;
      // Since the light is in camera coordinates,
      // I'll need the vertex position in camera coords too
      vecPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
      // That's NOT exacly how you should transform your
      // normals but this will work fine, since my model
      // matrix is pretty basic
      vecNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float alpha;
    uniform float progress;
    uniform float lightIntensity;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform sampler2D depthMap;
    uniform vec2 pixels;
    uniform vec2 uvRate1;
    uniform vec2 accel;
    uniform vec2 mouse;
    varying vec2 vUv;
    varying vec2 vUv1;
    varying vec4 vPosition;
    varying vec3 vecPos;
    varying vec3 vecNormal;

    const int uGhostSamples = 5;
    const float uChromaticAberration = 0.01;
    const float uGhostThreshold = 0.6;
    const float uGhostSpacing = 0.2;
    const float fHaloWidth = 0.5;
    const float uHaloThickness = 0.03;
    const float uHaloRadius = 0.7;
    const float uHaloAspectRatio = 0.8;
    const float uHaloThreshold = 0.1;

    struct PointLight {
      vec3 color;
      vec3 position; // light position, in camera coordinates
      float distance; // used for attenuation purposes. Since
                      // we're writing our own shader, it can
                      // really be anything we want (as long as
                      // we assign it to our light in its
                      // "distance" field
    };
     
    //uniform PointLight pointLights[NUM_POINT_LIGHTS];
    
    vec2 mirrored(vec2 v) {
      vec2 m = mod(v,2.);
      return mix(m,2.0 - m, step(1.0 ,m));
    }
    
    float tri(float p) {
      return mix(p, 1.0 - p, step(0.5 ,p))*2.;
    }

    // Cubic window; map [0, _radius] in [1, 0] as a cubic falloff from _center.
    float Window_Cubic(float _x, float _center, float _radius) {
      _x = min(abs(_x - _center) / _radius, 1.0);
      return 1.0 - _x * _x * (3.0 - 2.0 * _x);
    }

    vec3 ApplyThreshold(in vec3 _rgb, in float _threshold) {
	    return max(_rgb - vec3(_threshold), vec3(0.0));
    }

    vec3 textureDistorted(in vec2 _uv) {
      #if 1
        return texture2D(texture1, _uv * 0.1).rgb;
      #else
        vec2 offset = normalize(vec2(0.5) - _uv) * uChromaticAberration;
        return vec3(
          texture2D(texture1, _uv + offset).r,
          texture2D(texture1, _uv).g,
          texture2D(texture1, _uv - offset).b
      );
     #endif
   }

    //	<https://www.shadertoy.com/view/4dS3Wd>
    //	By Morgan McGuire @morgan3d, http://graphicscodex.com
    //
    float hash(float n) { return fract(sin(n) * 1e4); }
    float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

    float noise(float x) {
      float i = floor(x);
      float f = fract(x);
      float u = f * f * (3.0 - 2.0 * f);
      return mix(hash(i), hash(i + 1.0), u);
    }

    float noise(vec2 x) {
      vec2 i = floor(x);
      vec2 f = fract(x);

      // Four corners in 2D of a tile
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      // Simple 2D lerp using smoothstep envelope between the values.
      // return vec3(mix(mix(a, b, smoothstep(0.0, 1.0, f.x)),
      //			mix(c, d, smoothstep(0.0, 1.0, f.x)),
      //			smoothstep(0.0, 1.0, f.y)));

      // Same code, with the clamps in smoothstep and common subexpressions
      // optimized away.
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      vec2 pix = gl_FragCoord.xy/pixels.xy;
      vec2 uv = vUv;//gl_FragCoord.xy/pixels.xy;
      uv.x *= pixels.x/pixels.y;

      //float n = noise(uv);
      float depth = pow(abs(pix.x - 0.5), 0.5); //length(vec2(uv.x, uv.y) - vec2(0.5, 0.5)); //texture2D(depthMap, uv).r;
  
      float p = fract(progress);
      float delayValue = p; // * 7. - uv.y * 0.3 + uv.x - 2.;
      delayValue = clamp(delayValue, 0., 1.0);
      
      vec2 translateDepth = vec2(-mouse.x, 0) * depth;
      vec2 translateValue = p + delayValue * accel;
      vec2 translateValue1 = noise(uv * 1.5)  * translateValue;
      vec2 translateValue2 = noise(uv * 1.5) * (translateValue - 1. - accel);
      
      // vec2 w = sin( sin(time)*vec2(0,0.3) + uv.yx*vec2(0,4.))*vec2(0,0.5);
      // vec2 xy = w*(tri(p)*0.5 + tri(delayValue)*0.5);      
      vec2 xy = vec2(0) + (noise(uv * 4.2)) * clamp(p, 0.0, 0.05);

      vec2 uv1 = vUv1 + translateValue1 + xy;
      vec2 uv2 = vUv1 + translateValue2;
      
      vec4 rgba1 = texture2D(texture1, uv1 + translateDepth);
      vec4 rgba2 = texture2D(texture2, uv2 + translateDepth);
      vec4 rgba = mix(rgba1, rgba2, delayValue);

      // basic lambertian lighting
      //float luminance = (rgba.r+rgba.g+rgba.b) / 3.0;
      // vec4 addedLights = vec4(0, 0, 0, 1.0);
      // vec3 lightDirection = normalize(vecPos + noise(vecPos.xy + time * 0.2) - pointLights[0].position);
      // addedLights.rgb += clamp(dot(-lightDirection, vecNormal), 0.0, 1.0)
      //                   * pointLights[0].color
      //                   * lightIntensity;
      
      // gl_FragColor = vec4(luminance, luminance - 0.2, luminance - 0.3, rgba.a) * (addedLights);
      
      // masking
      // float mask = smoothstep(0.9, 0.99, 1.0 - sdCircle(vUv1 - 0.5, 0.3));
      
      vec3 features = vec3(0);

      // features += sampleghosts(uv, uGhostThreshold);
      // features += SampleHalo(uv, uHaloRadius, uHaloAspectRatio, uHaloThreshold);
      //gl_FragColor = vec4(mix(rgba.rgb, features, 0.5), 1.0); //* alpha;
      gl_FragColor = rgba * alpha;
    }
  `,
}
