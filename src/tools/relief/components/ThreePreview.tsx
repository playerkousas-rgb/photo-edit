import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { MeshData } from '../lib/meshGenerator';

interface ThreePreviewProps {
  meshData: MeshData | null;
  isProcessing: boolean;
  wireframe: boolean;
}

export function ThreePreview({ meshData, isProcessing, wireframe }: ThreePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({
    isDown: false,
    button: 0,
    x: 0,
    y: 0,
    rotX: -0.5,
    rotY: 0.4,
    dist: 120,
    panX: 0,
    panY: 0,
    pinchDist: 0,
  });
  const [, setInitialized] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02133e);

    // Subtle fog for depth
    scene.fog = new THREE.FogExp2(0x02133e, 0.003);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // === Lighting setup ===
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.35);
    scene.add(ambientLight);

    // Main key light
    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    keyLight.position.set(60, 100, 80);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 400;
    keyLight.shadow.camera.left = -150;
    keyLight.shadow.camera.right = 150;
    keyLight.shadow.camera.top = 150;
    keyLight.shadow.camera.bottom = -150;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xd4e4ff, 0.35);
    fillLight.position.set(-40, 60, -30);
    scene.add(fillLight);

    // Rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0xffd4a0, 0.4);
    rimLight.position.set(-20, 30, 80);
    scene.add(rimLight);

    // Subtle warm point light
    const pointLight = new THREE.PointLight(0x22d3ee, 0.35, 300);
    pointLight.position.set(0, 60, 60);
    scene.add(pointLight);

    // === Ground plane ===
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x02133e,
      roughness: 1,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(300, 30, 0x173a7a, 0x082052);
    grid.position.y = -0.4;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    scene.add(grid);

    // Resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // === Mouse/Touch controls ===
    const el = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.button = e.button;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;
      const dx = e.clientX - mouseRef.current.x;
      const dy = e.clientY - mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      if (mouseRef.current.button === 0) {
        // Left click: orbit
        mouseRef.current.rotY += dx * 0.005;
        mouseRef.current.rotX += dy * 0.005;
        mouseRef.current.rotX = Math.max(-Math.PI / 2 + 0.05, Math.min(0.05, mouseRef.current.rotX));
      } else if (mouseRef.current.button === 2) {
        // Right click: pan
        const panSpeed = mouseRef.current.dist * 0.001;
        mouseRef.current.panX -= dx * panSpeed;
        mouseRef.current.panY += dy * panSpeed;
      }
    };
    const onMouseUp = () => { mouseRef.current.isDown = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      mouseRef.current.dist *= 1 + e.deltaY * 0.001;
      mouseRef.current.dist = Math.max(10, Math.min(600, mouseRef.current.dist));
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        mouseRef.current.isDown = true;
        mouseRef.current.button = 0;
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        mouseRef.current.isDown = false;
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        mouseRef.current.pinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && mouseRef.current.button === 0) {
        const dx = e.touches[0].clientX - mouseRef.current.x;
        const dy = e.touches[0].clientY - mouseRef.current.y;
        mouseRef.current.rotY += dx * 0.005;
        mouseRef.current.rotX += dy * 0.005;
        mouseRef.current.rotX = Math.max(-Math.PI / 2 + 0.05, Math.min(0.05, mouseRef.current.rotX));
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const newDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const ratio = mouseRef.current.pinchDist / newDist;
        mouseRef.current.dist *= ratio;
        mouseRef.current.dist = Math.max(10, Math.min(600, mouseRef.current.dist));
        mouseRef.current.pinchDist = newDist;
      }
    };
    const onTouchEnd = () => { mouseRef.current.isDown = false; };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    // Animation loop
    const lookTarget = new THREE.Vector3();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const m = mouseRef.current;
      const cx = m.dist * Math.cos(m.rotX) * Math.sin(m.rotY) + m.panX;
      const cy = -m.dist * Math.sin(m.rotX) + m.panY;
      const cz = m.dist * Math.cos(m.rotX) * Math.cos(m.rotY);

      camera.position.set(cx, cy, cz);
      lookTarget.set(m.panX, m.panY, 0);
      camera.lookAt(lookTarget);
      renderer.render(scene, camera);
    };
    animate();
    setInitialized(true);

    return () => {
      cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update mesh
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !meshData) return;

    // Remove old
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
    }
    if (wireframeRef.current) {
      scene.remove(wireframeRef.current);
      wireframeRef.current.geometry.dispose();
      (wireframeRef.current.material as THREE.Material).dispose();
      wireframeRef.current = null;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(meshData.vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf0e6d4,
      roughness: 0.55,
      metalness: 0.02,
      clearcoat: 0.15,
      clearcoatRoughness: 0.35,
      side: THREE.DoubleSide,
      envMapIntensity: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const center = new THREE.Vector3();
    box.getCenter(center);
    mesh.position.set(-center.x, -center.z, -center.y);
    mesh.rotation.x = -Math.PI / 2;

    scene.add(mesh);
    meshRef.current = mesh;

    // Wireframe overlay
    if (wireframe) {
      const wfGeo = new THREE.WireframeGeometry(geometry);
      const wfMat = new THREE.LineBasicMaterial({
        color: 0x22d3ee,
        opacity: 0.18,
        transparent: true,
      });
      const wfMesh = new THREE.LineSegments(wfGeo, wfMat);
      wfMesh.position.copy(mesh.position);
      wfMesh.rotation.copy(mesh.rotation);
      scene.add(wfMesh);
      wireframeRef.current = wfMesh;
    }

    // Camera distance
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    mouseRef.current.dist = maxDim * 1.6;
    mouseRef.current.panX = 0;
    mouseRef.current.panY = 0;
  }, [meshData, wireframe]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {!meshData && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs">正在生成 3D 模型…</p>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-slate-900/70 border border-white/5 backdrop-blur-sm rounded-md px-2 py-1 text-[9px] text-slate-400">
          左鍵旋轉 · 右鍵平移 · 滾輪縮放
        </div>
      </div>
    </div>
  );
}
