/**
 * Hero WebGL — "The Signal Field"
 * A particle terrain driven by simplex noise in a custom shader.
 * The cursor injects energy into the field: particles rise, brighten
 * and shift to the accent colour — attention made visible.
 */
import * as THREE from 'three';

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uMouseStrength;
  uniform float uPixelRatio;

  attribute float aScale;

  varying float vElev;
  varying float vBump;
  varying float vDepth;

  // Simplex 2D noise — Ian McEwan, Ashima Arts (MIT)
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec3 pos = position;

    // Layered noise terrain, drifting over time
    float n1 = snoise(vec2(pos.x * 0.30 + uTime * 0.11, pos.z * 0.42 - uTime * 0.08));
    float n2 = snoise(vec2(pos.x * 0.85 - uTime * 0.05, pos.z * 1.10 + uTime * 0.09));
    float elev = n1 * 0.52 + n2 * 0.18;

    // Cursor energy — gaussian bump that lifts and excites the field
    float d = distance(pos.xz, uMouse);
    float bump = exp(-d * d * 1.35) * uMouseStrength;
    elev += bump * 1.05;

    pos.y += elev;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vElev  = elev;
    vBump  = bump;
    vDepth = -mvPosition.z;

    float size = (1.15 + aScale * 1.25 + bump * 2.6) * uPixelRatio;
    gl_PointSize = min(size * (34.0 / vDepth), 9.0 * uPixelRatio);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform vec3 uColorHot;

  varying float vElev;
  varying float vBump;
  varying float vDepth;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float disc = smoothstep(0.5, 0.12, d);
    if (disc < 0.01) discard;

    vec3 col = mix(uColorLow, uColorHigh, smoothstep(0.0, 0.85, vElev));
    col = mix(col, uColorHot, clamp(vBump * 1.4, 0.0, 1.0));

    // depth fade keeps the horizon soft
    float fade = mix(0.22, 1.0, smoothstep(10.5, 4.0, vDepth));
    float alpha = disc * fade * (0.34 + max(vElev, 0.0) * 0.38 + vBump * 0.65);

    gl_FragColor = vec4(col, alpha);
  }
`;

export function createHeroScene(canvas) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    58,
    canvas.clientWidth / Math.max(canvas.clientHeight, 1),
    0.1,
    60
  );
  camera.position.set(0, 1.7, 4.6);
  camera.lookAt(0, 0.1, -0.6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x000000, 0);

  // ----- Particle grid -----
  const COLS = isMobile ? 150 : 240;
  const ROWS = isMobile ? 100 : 150;
  const WIDTH = 15;
  const DEPTH = 9;
  const COUNT = COLS * ROWS;

  const positions = new Float32Array(COUNT * 3);
  const scales = new Float32Array(COUNT);
  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      positions[i * 3 + 0] = (c / (COLS - 1) - 0.5) * WIDTH;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (r / (ROWS - 1) - 0.5) * DEPTH - 1.0;
      scales[i] = Math.random();
      i++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, -0.5) },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: dpr },
      uColorLow: { value: new THREE.Color('#26262e') },
      uColorHigh: { value: new THREE.Color('#c9ff3b') },
      uColorHot: { value: new THREE.Color('#f2f1ec') },
    },
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // ----- Mouse → world-plane projection -----
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const mouseTarget = new THREE.Vector2(0, -0.5);
  const camTarget = new THREE.Vector2(0, 0);
  let lastMove = 0;

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    if (rect.bottom < 0) return;
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      mouseTarget.set(
        THREE.MathUtils.clamp(hit.x, -WIDTH / 2, WIDTH / 2),
        THREE.MathUtils.clamp(hit.z, -DEPTH / 2 - 1, DEPTH / 2 + 1)
      );
    }
    camTarget.set(ndc.x, ndc.y);
    lastMove = performance.now();
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // ----- Render control -----
  let inView = true;
  let pageVisible = !document.hidden;
  let rafId = 0;

  const io = new IntersectionObserver(
    (entries) => { inView = entries[0].isIntersecting; },
    { threshold: 0 }
  );
  io.observe(canvas);

  function onVisibility() { pageVisible = !document.hidden; }
  document.addEventListener('visibilitychange', onVisibility);

  function onResize() {
    const w = canvas.clientWidth;
    const h = Math.max(canvas.clientHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();

  function frame() {
    rafId = requestAnimationFrame(frame);
    if (!inView || !pageVisible) return;

    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;

    // Smooth-follow cursor; energy decays when the cursor rests
    const u = material.uniforms;
    u.uMouse.value.lerp(mouseTarget, 0.07);
    const active = performance.now() - lastMove < 400 ? 1 : 0.35;
    u.uMouseStrength.value += (active - u.uMouseStrength.value) * 0.05;

    // Gentle camera parallax
    camera.position.x += (camTarget.x * 0.45 - camera.position.x) * 0.035;
    camera.position.y += (1.7 + camTarget.y * 0.18 - camera.position.y) * 0.035;
    camera.lookAt(0, 0.1, -0.6);

    renderer.render(scene, camera);
  }

  if (prefersReduced) {
    // Single static frame — the composition without the motion
    material.uniforms.uTime.value = 8;
    material.uniforms.uMouseStrength.value = 0.6;
    material.uniforms.uMouse.value.set(1.4, -0.8);
    renderer.render(scene, camera);
  } else {
    frame();
  }

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
