import type * as T from "three";

/**
 * Shared 3D "glass studio" for the home page.
 *
 * Both 3D moments (the photo hero and the shade studio) need the same things:
 * a dark studio with hard white strip lights, glass that goes dark toward its
 * silhouette, and a lateral chromatic-aberration pass over the result. They live
 * here once. three.js is imported dynamically, so it is only downloaded on the
 * home page, and `createStage` resolves to null when WebGL is unavailable so
 * the caller can leave its ordinary HTML in place.
 */
export type ThreeNS = typeof import("three");

export interface Stage {
  THREE: ThreeNS;
  gl: T.WebGLRenderer;
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  /** Group the glass lives in; placed and scaled by `place`. */
  world: T.Group;
  /** CSS size of the host, in px, and world units per px at z = 0. */
  lay: { w: number; h: number; upp: number };
  /** A clear glass material; `thickness` is in model units. */
  glass: (thickness: number) => T.MeshPhysicalMaterial;
  /** Put the glass's centre at (cx, cy) CSS px, with this on-screen radius. */
  place: (cx: number, cy: number, rpx: number, modelRadius?: number) => void;
  /** Strength of the colour fringe (0.007 is the resting value). */
  fringe: (k: number) => void;
  render: () => void;
  dispose: () => void;
}

export async function createStage(
  cv: HTMLCanvasElement,
  host: HTMLElement,
  o: { bg: string; onResize?: (s: Stage) => void },
): Promise<Stage | null> {
  const THREE = await import("three");

  let gl: T.WebGLRenderer;
  try {
    gl = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const undo: Array<() => void> = [() => gl.dispose()];
  gl.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  gl.toneMapping = THREE.NoToneMapping; // the ground must match the page exactly

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(o.bg);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.z = 10;
  const world = new THREE.Group();
  scene.add(world);

  /* Dark studio, hard white strips: glass is defined by what it reflects. */
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.BackSide })));
  const strip = (w: number, h: number, x: number, y: number, z: number, ry: number, k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    m.rotateZ(ry);
    env.add(m);
  };
  strip(12, 3.2, 0, 9, 2, 0, 7);
  strip(0.9, 16, -8, 0, 3, 0, 20);
  strip(0.5, 16, 7.5, 1, 5, 0.2, 14);
  strip(14, 0.3, 0, 3.5, 8, 0, 12);
  strip(10, 1.2, 0, -8, 3, 0, 3);
  strip(2, 2, -6, -3, -7, 0, 10);
  strip(1.2, 1.2, 6, 4, -7, 0, 12);
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = pmrem.fromScene(env, 0.01).texture;
  undo.push(() => pmrem.dispose());

  /* Real glass goes dark toward its silhouette; transmission alone never does. */
  const rimDark = (shader: { fragmentShader: string }) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;",
      `float nv = abs(dot(normalize(normal), normalize(geometryViewDir)));
       totalDiffuse *= 1.0 - 0.88 * pow(1.0 - nv, 2.2);
       vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;`,
    );
  };
  const glass = (thickness: number) => {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness, ior: 1.52,
      specularIntensity: 1, envMapIntensity: 1.6, dispersion: 1.2,
      attenuationColor: new THREE.Color("#ffffff"), attenuationDistance: 0.5,
    });
    m.onBeforeCompile = rimDark;
    return m;
  };

  /* Lateral chromatic aberration: red and blue sampled either side of green,
     radially from the glass's centre, so every dark rim and highlight fringes. */
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const postMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { tMap: { value: rt.texture }, uC: { value: new THREE.Vector2(0.5, 0.5) }, uK: { value: 0.007 }, uAsp: { value: 1 }, uRad: { value: 0.2 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `varying vec2 vUv; uniform sampler2D tMap; uniform vec2 uC; uniform float uK, uAsp, uRad;
      void main(){
        vec2 d = vUv - uC;
        float rel = length(d * vec2(uAsp, 1.0)) / uRad;
        float m = 1.0 - smoothstep(1.6, 3.0, rel);
        vec3 acc = vec3(0.0), wsum = vec3(0.0);
        for (int i = 0; i < 9; i++) {
          float t = float(i) / 8.0;
          vec3 w = vec3(clamp(1.0 - abs(t - 1.0) / 0.75, 0.0, 1.0), clamp(1.0 - abs(t - 0.5) / 0.75, 0.0, 1.0), clamp(1.0 - abs(t) / 0.75, 0.0, 1.0));
          acc += texture2D(tMap, vUv + d * uK * m * (t - 0.5) * 2.0).rgb * w; wsum += w;
        }
        gl_FragColor = vec4(acc / wsum, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
  postScene.add(quad);
  undo.push(() => { rt.dispose(); postMat.dispose(); quad.geometry.dispose(); });

  const lay = { w: 1, h: 1, upp: 0.01 };
  const stage: Stage = {
    THREE, gl, scene, camera, world, lay, glass,
    place(cx, cy, rpx, modelRadius = 1.135) {
      world.position.set((cx - lay.w / 2) * lay.upp, -(cy - lay.h / 2) * lay.upp, 0);
      world.scale.setScalar((rpx * lay.upp) / modelRadius);
      postMat.uniforms.uC.value.set(cx / lay.w, 1 - cy / lay.h);
      postMat.uniforms.uRad.value = rpx / lay.h;
    },
    fringe(k) { postMat.uniforms.uK.value = k; },
    render() {
      gl.setRenderTarget(rt);
      gl.render(scene, camera);
      gl.setRenderTarget(null);
      gl.render(postScene, postCam);
    },
    dispose() { undo.forEach((f) => f()); },
  };

  const measure = () => {
    const r = host.getBoundingClientRect();
    lay.w = Math.max(1, r.width);
    lay.h = Math.max(1, r.height);
    gl.setSize(lay.w, lay.h, false);
    const sz = gl.getDrawingBufferSize(new THREE.Vector2());
    rt.setSize(sz.x, sz.y);
    camera.aspect = lay.w / lay.h;
    camera.updateProjectionMatrix();
    lay.upp = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / lay.h;
    postMat.uniforms.uAsp.value = lay.w / lay.h;
    o.onResize?.(stage);
  };
  const ro = new ResizeObserver(measure);
  ro.observe(host);
  undo.push(() => ro.disconnect());
  measure();

  return stage;
}
