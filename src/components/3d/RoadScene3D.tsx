"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface RoadScene3DProps {
  className?: string;
  onExplore?: () => void;
  onAskAi?: () => void;
}

export default function RoadScene3D({ className }: RoadScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const bgHex = 0x070d1b;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.018);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 3.6, 9.5);
    camera.lookAt(0, 1.2, -15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x1e3357, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x3b82f6, 1.8);
    dirLight.position.set(5, 12, 5);
    scene.add(dirLight);

    const horizonGlow = new THREE.PointLight(0x22d3ee, 2.5, 70);
    horizonGlow.position.set(0, 2, -45);
    scene.add(horizonGlow);

    // Highway Geometry
    const roadWidth = 14;
    const roadLength = 120;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 20, 40);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0c1529,
      roughness: 0.7,
      metalness: 0.2,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(0, 0, -35);
    scene.add(roadMesh);

    // Road Shoulder / Grass Ground
    const groundGeo = new THREE.PlaneGeometry(80, roadLength);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x050914 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, -0.05, -35);
    scene.add(groundMesh);

    // Road Barriers (Guard Rails)
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x182846, metalness: 0.8, roughness: 0.3 });
    const barrierGeo = new THREE.BoxGeometry(0.3, 0.6, roadLength);
    const leftBarrier = new THREE.Mesh(barrierGeo, barrierMat);
    leftBarrier.position.set(-roadWidth / 2 - 0.2, 0.3, -35);
    scene.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(barrierGeo, barrierMat);
    rightBarrier.position.set(roadWidth / 2 + 0.2, 0.3, -35);
    scene.add(rightBarrier);

    // Side Solid White Edge Lines
    const edgeLineGeo = new THREE.PlaneGeometry(0.35, roadLength);
    edgeLineGeo.rotateX(-Math.PI / 2);
    const edgeLineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    const leftEdge = new THREE.Mesh(edgeLineGeo, edgeLineMat);
    leftEdge.position.set(-roadWidth / 2 + 0.8, 0.02, -35);
    scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeLineGeo, edgeLineMat);
    rightEdge.position.set(roadWidth / 2 - 0.8, 0.02, -35);
    scene.add(rightEdge);

    // Center Dashed Dividers (Animated)
    const dashCount = 28;
    const dashLength = 2.4;
    const dashSpacing = 2.4;
    const dashes: THREE.Mesh[] = [];
    const dashGeo = new THREE.PlaneGeometry(0.25, dashLength);
    dashGeo.rotateX(-Math.PI / 2);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Indian Highway Amber/Yellow divider

    const laneOffsets = [-2.4, 0, 2.4];
    laneOffsets.forEach((offsetX) => {
      for (let i = 0; i < dashCount; i++) {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        const z = -i * (dashLength + dashSpacing) + 5;
        dash.position.set(offsetX, 0.025, z);
        scene.add(dash);
        dashes.push(dash);
      }
    });

    // Light Trails on Highway Edges (Blue & Cyan beams)
    const trailCount = 14;
    const trails: { mesh: THREE.Mesh; speed: number; startZ: number }[] = [];
    const trailMatLeft = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.85 });
    const trailMatRight = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.85 });

    for (let i = 0; i < trailCount; i++) {
      const len = 4 + Math.random() * 8;
      const trailGeo = new THREE.BoxGeometry(0.08, 0.08, len);
      const isLeft = i % 2 === 0;
      const mesh = new THREE.Mesh(trailGeo, isLeft ? trailMatLeft : trailMatRight);
      const x = isLeft ? -roadWidth / 2 + 1.2 : roadWidth / 2 - 1.2;
      const z = -Math.random() * 80;
      mesh.position.set(x, 0.4 + Math.random() * 0.5, z);
      scene.add(mesh);
      trails.push({ mesh, speed: 0.6 + Math.random() * 0.8, startZ: z });
    }

    // 3D Vehicle Model (High-tech Electric Mobility Sedan)
    const carGroup = new THREE.Group();

    // Car Body (Chassis)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.85,
      roughness: 0.2,
    });
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.7, 4.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.6;
    carGroup.add(bodyMesh);

    // Car Cabin (Glass Cockpit)
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x070d1b,
      metalness: 0.95,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.6, 2.3);
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.15, -0.2);
    carGroup.add(cabinMesh);

    // Wheels (4 Alloy Wheels)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.9, roughness: 0.2 });
    const wheelPositions = [
      [-1.1, 0.35, 1.3],
      [1.1, 0.35, 1.3],
      [-1.1, 0.35, -1.3],
      [1.1, 0.35, -1.3],
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheelGroup = new THREE.Group();
      const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, wheelMat);
      wheelGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      wheelGroup.position.set(x, y, z);
      carGroup.add(wheelGroup);
    });

    // Headlights (High-intensity Cyan Beam)
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const leftHL = new THREE.Mesh(hlGeo, headlightMat);
    leftHL.position.set(-0.75, 0.65, -2.22);
    carGroup.add(leftHL);

    const rightHL = new THREE.Mesh(hlGeo, headlightMat);
    rightHL.position.set(0.75, 0.65, -2.22);
    carGroup.add(rightHL);

    // Headlight Spot Beams projecting down the road
    const leftSpot = new THREE.SpotLight(0x22d3ee, 3.5, 30, Math.PI / 6, 0.6);
    leftSpot.position.set(-0.75, 0.7, -2.2);
    leftSpot.target.position.set(-0.75, 0, -20);
    scene.add(leftSpot);
    scene.add(leftSpot.target);

    const rightSpot = new THREE.SpotLight(0x22d3ee, 3.5, 30, Math.PI / 6, 0.6);
    rightSpot.position.set(0.75, 0.7, -2.2);
    rightSpot.target.position.set(0.75, 0, -20);
    scene.add(rightSpot);
    scene.add(rightSpot.target);

    // Tail Lights (Ruby Red Glow)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tailGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    const leftTL = new THREE.Mesh(tailGeo, tailMat);
    leftTL.position.set(-0.75, 0.7, 2.22);
    carGroup.add(leftTL);

    const rightTL = new THREE.Mesh(tailGeo, tailMat);
    rightTL.position.set(0.75, 0.7, 2.22);
    carGroup.add(rightTL);

    carGroup.position.set(0, 0, 1.5);
    scene.add(carGroup);

    // Floating 3D Navigation & Legal Markers
    const markerGroup = new THREE.Group();
    const markerColors = [0x22d3ee, 0x3b82f6, 0x14b8a6, 0xf59e0b];
    const markerPositions = [
      { x: -4, y: 3.5, z: -10 },
      { x: 4.2, y: 4, z: -22 },
      { x: -3.8, y: 3.8, z: -35 },
      { x: 3.9, y: 4.2, z: -50 },
    ];

    const markers: { mesh: THREE.Mesh; baseY: number; offset: number }[] = [];

    markerPositions.forEach((pos, idx) => {
      const geo = new THREE.OctahedronGeometry(0.65, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: markerColors[idx % markerColors.length],
        metalness: 0.9,
        roughness: 0.1,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      markerGroup.add(mesh);
      markers.push({ mesh, baseY: pos.y, offset: idx * 1.5 });
    });
    scene.add(markerGroup);

    // Mouse Interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animId: number;
    const speed = prefersReducedMotion ? 0 : 0.42;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        // Animate Road Dashes forward to simulate velocity
        dashes.forEach((dash) => {
          dash.position.z += speed;
          if (dash.position.z > 8) {
            dash.position.z -= (dashLength + dashSpacing) * dashCount;
          }
        });

        // Animate Light Trails
        trails.forEach((trail) => {
          trail.mesh.position.z += trail.speed;
          if (trail.mesh.position.z > 10) {
            trail.mesh.position.z = -75 - Math.random() * 20;
          }
        });

        // Animate Floating Legal Markers (Hover & Rotate)
        const time = performance.now() * 0.0015;
        markers.forEach(({ mesh, baseY, offset }) => {
          mesh.rotation.y += 0.015;
          mesh.rotation.x += 0.008;
          mesh.position.y = baseY + Math.sin(time + offset) * 0.35;
        });

        // Subtle vehicle suspension bounce
        carGroup.position.y = Math.sin(time * 3) * 0.02;

        // Camera gentle parallax based on cursor
        const targetCamX = mousePos.current.x * 0.8;
        const targetCamY = 3.6 + mousePos.current.y * 0.4;
        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (targetCamY - camera.position.y) * 0.05;
        camera.lookAt(0, 1.2, -15);
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#070D1B] via-[#0C1529] to-[#111E35] ${className ?? "h-[450px]"}`}>
        <div className="text-center p-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-royal/20 flex items-center justify-center text-accent">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">India's Driving Laws & Legal Intelligence</h3>
          <p className="mt-2 text-xs text-slate-400">High-performance 3D visualization optimized for your device.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${className ?? "h-[480px] sm:h-[540px]"}`}>
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />
      {/* Subtle bottom gradient to blend seamlessly into page content */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#070D1B] via-[#070D1B]/70 to-transparent" />
      {/* Subtle top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#070D1B]/60 to-transparent" />
    </div>
  );
}
