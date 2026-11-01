"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface RoadScene3DProps {
  className?: string;
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

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const bgHex = 0x050814;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.016);

    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 580;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3.2, 10.2);
    camera.lookAt(0, 1.4, -20);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ==========================================
    // 1. LIGHTING (Ref Reference Image 1)
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0x0e1b38, 1.6);
    scene.add(ambientLight);

    const blueOverhead = new THREE.DirectionalLight(0x38bdf8, 2.5);
    blueOverhead.position.set(0, 16, 5);
    scene.add(blueOverhead);

    const cyanHorizon = new THREE.PointLight(0x22d3ee, 3.0, 90);
    cyanHorizon.position.set(0, 3, -55);
    scene.add(cyanHorizon);

    // ==========================================
    // 2. HIGHWAY GEOMETRY & ROAD SURFACE
    // ==========================================
    const roadWidth = 16;
    const roadLength = 140;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 30, 50);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x070d18,
      roughness: 0.55,
      metalness: 0.35,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(0, 0, -35);
    scene.add(roadMesh);

    // Wet asphalt gloss reflection plane
    const wetReflectGeo = new THREE.PlaneGeometry(roadWidth * 0.95, roadLength);
    wetReflectGeo.rotateX(-Math.PI / 2);
    const wetReflectMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    });
    const wetMesh = new THREE.Mesh(wetReflectGeo, wetReflectMat);
    wetMesh.position.set(0, 0.01, -35);
    scene.add(wetMesh);

    // ==========================================
    // 3. ELEVATED FLYOVER OVERPASS (Ref Image 1)
    // ==========================================
    const flyoverGroup = new THREE.Group();

    // Curved upper flyover bridge crossing overhead
    const bridgeGeo = new THREE.BoxGeometry(80, 1.8, 14);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x0a1226,
      roughness: 0.7,
      metalness: 0.4,
    });
    const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridgeMesh.position.set(10, 12, -40);
    bridgeMesh.rotation.set(-0.06, 0.35, 0.08);
    flyoverGroup.add(bridgeMesh);

    // Neon Blue linear light trims on bridge edges (Image 1 signature)
    const neonTrimMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95,
    });
    const upperTrimGeo = new THREE.BoxGeometry(80, 0.25, 0.3);
    const upperTrim1 = new THREE.Mesh(upperTrimGeo, neonTrimMat);
    upperTrim1.position.set(10, 13, -33);
    upperTrim1.rotation.set(-0.06, 0.35, 0.08);
    flyoverGroup.add(upperTrim1);

    const upperTrim2 = new THREE.Mesh(upperTrimGeo, neonTrimMat);
    upperTrim2.position.set(10, 13, -47);
    upperTrim2.rotation.set(-0.06, 0.35, 0.08);
    flyoverGroup.add(upperTrim2);

    // Flyover support pillars with vertical blue light strips
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f1930, roughness: 0.8 });
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, 16, 16);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const stripGeo = new THREE.BoxGeometry(0.15, 12, 0.15);

    [-18, 12, 28].forEach((px) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 5, -42);
      flyoverGroup.add(pillar);

      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(px, 5, -40.6);
      flyoverGroup.add(strip);
    });

    scene.add(flyoverGroup);

    // Side Highway Barriers with Glowing Neon Blue Railings
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.4 });
    const barrierGeo = new THREE.BoxGeometry(0.4, 0.9, roadLength);

    const leftBarrier = new THREE.Mesh(barrierGeo, barrierMat);
    leftBarrier.position.set(-roadWidth / 2 - 0.2, 0.45, -35);
    scene.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(barrierGeo, barrierMat);
    rightBarrier.position.set(roadWidth / 2 + 0.2, 0.45, -35);
    scene.add(rightBarrier);

    // Glowing Railing Edge Light Strips (Image 1)
    const railNeonGeo = new THREE.BoxGeometry(0.12, 0.15, roadLength);
    const leftRailNeon = new THREE.Mesh(railNeonGeo, neonTrimMat);
    leftRailNeon.position.set(-roadWidth / 2 - 0.2, 0.95, -35);
    scene.add(leftRailNeon);

    const rightRailNeon = new THREE.Mesh(railNeonGeo, neonTrimMat);
    rightRailNeon.position.set(roadWidth / 2 + 0.2, 0.95, -35);
    scene.add(rightRailNeon);

    // ==========================================
    // 4. CHEVRON SPEED ARROWS & LANE MARKINGS
    // ==========================================
    const chevrons: THREE.Group[] = [];
    const chevronCount = 18;
    const chevronMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    // Create chevron shape geometry (>>> arrows in Image 1)
    for (let i = 0; i < chevronCount; i++) {
      const group = new THREE.Group();
      const armGeo = new THREE.PlaneGeometry(0.35, 1.8);
      armGeo.rotateX(-Math.PI / 2);

      const leftArm = new THREE.Mesh(armGeo, chevronMat);
      leftArm.position.set(-0.65, 0.03, 0);
      leftArm.rotation.y = Math.PI / 4;

      const rightArm = new THREE.Mesh(armGeo, chevronMat);
      rightArm.position.set(0.65, 0.03, 0);
      rightArm.rotation.y = -Math.PI / 4;

      group.add(leftArm);
      group.add(rightArm);

      const z = -i * 7 + 8;
      group.position.set(0, 0.02, z);
      scene.add(group);
      chevrons.push(group);
    }

    // Outer lane lines
    const sideLineGeo = new THREE.PlaneGeometry(0.3, roadLength);
    sideLineGeo.rotateX(-Math.PI / 2);
    const sideLineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const leftLine = new THREE.Mesh(sideLineGeo, sideLineMat);
    leftLine.position.set(-3.8, 0.025, -35);
    scene.add(leftLine);

    const rightLine = new THREE.Mesh(sideLineGeo, sideLineMat);
    rightLine.position.set(3.8, 0.025, -35);
    scene.add(rightLine);

    // ==========================================
    // 5. HYPERCAR MODEL ('AETHER' STYLE - Ref Image 1)
    // ==========================================
    const carGroup = new THREE.Group();

    // Aerodynamic Chassis (Aggressive Black Sports Coupe)
    const carPaintMat = new THREE.MeshStandardMaterial({
      color: 0x04060c,
      metalness: 0.95,
      roughness: 0.1,
    });

    // Lower Main Body
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.55, 4.8), carPaintMat);
    mainBody.position.y = 0.5;
    carGroup.add(mainBody);

    // Front Nose / Splitter
    const nose = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 1.2), carPaintMat);
    nose.position.set(0, 0.35, -2.5);
    carGroup.add(nose);

    // Cockpit Canopy / Windshield
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0a1628,
      metalness: 0.95,
      roughness: 0.05,
      transparent: true,
      opacity: 0.9,
    });
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.3), glassMat);
    cockpit.position.set(0, 0.95, -0.2);
    carGroup.add(cockpit);

    // Rear Aerodynamic Spoiler Wing
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x050811, metalness: 0.8, roughness: 0.3 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.6), wingMat);
    wing.position.set(0, 1.2, 2.1);
    carGroup.add(wing);

    // LED Headlights (Aggressive Dual Angular Cut - Image 1)
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const leftHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), headlightMat);
    leftHeadlight.position.set(-0.75, 0.55, -2.5);
    carGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), headlightMat);
    rightHeadlight.position.set(0.75, 0.55, -2.5);
    carGroup.add(rightHeadlight);

    // Headlight Spotlights illuminating the tarmac ahead
    const leftSpot = new THREE.SpotLight(0x38bdf8, 4.0, 45, Math.PI / 6, 0.4);
    leftSpot.position.set(-0.75, 0.55, -2.6);
    leftSpot.target.position.set(-0.75, 0, -25);
    scene.add(leftSpot);
    scene.add(leftSpot.target);

    const rightSpot = new THREE.SpotLight(0x38bdf8, 4.0, 45, Math.PI / 6, 0.4);
    rightSpot.position.set(0.75, 0.55, -2.6);
    rightSpot.target.position.set(0.75, 0, -25);
    scene.add(rightSpot);
    scene.add(rightSpot.target);

    // Glowing Cyan Wheels (Image 1 signature electric rims)
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0b0f19, roughness: 0.6 });
    const glowingRimMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d8ff,
      emissiveIntensity: 2.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const wheels: THREE.Group[] = [];
    const wheelPositions = [
      [-1.2, 0.38, -1.4],
      [1.2, 0.38, -1.4],
      [-1.22, 0.4, 1.45],
      [1.22, 0.4, 1.45],
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.36, 16), tireMat);
      tire.rotateZ(Math.PI / 2);
      wg.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.38, 12), glowingRimMat);
      rim.rotateZ(Math.PI / 2);
      wg.add(rim);

      wg.position.set(x, y, z);
      carGroup.add(wg);
      wheels.push(wg);
    });

    // ==========================================
    // 6. ELECTRIC LIGHTNING SPARKS (Ref Image 1)
    // ==========================================
    const sparksCount = 45;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparksCount * 3);
    const sparkColors = new Float32Array(sparksCount * 3);

    for (let i = 0; i < sparksCount; i++) {
      sparkPositions[i * 3] = (Math.random() - 0.5) * 3.5;
      sparkPositions[i * 3 + 1] = Math.random() * 0.7;
      sparkPositions[i * 3 + 2] = 2.0 + Math.random() * 5.0;

      // Cyan to electric blue gradient
      sparkColors[i * 3] = 0.15;
      sparkColors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
      sparkColors[i * 3 + 2] = 1.0;
    }

    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    sparkGeo.setAttribute("color", new THREE.BufferAttribute(sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    carGroup.add(sparkPoints);

    // Initial Car placement (traveling forward down highway)
    carGroup.position.set(0, 0, 1.2);
    scene.add(carGroup);

    // ==========================================
    // 7. BACKGROUND CITY SKYSCRAPERS (Ref Image 1)
    // ==========================================
    const cityGroup = new THREE.Group();
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x070d1a, roughness: 0.8 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });

    for (let i = 0; i < 24; i++) {
      const bHeight = 18 + Math.random() * 38;
      const bWidth = 6 + Math.random() * 8;
      const bDepth = 6 + Math.random() * 8;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), bldgMat);

      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (26 + Math.random() * 45);
      const z = -40 - Math.random() * 60;
      bMesh.position.set(x, bHeight / 2 - 2, z);
      cityGroup.add(bMesh);

      // Window light rows
      const winGeo = new THREE.PlaneGeometry(bWidth * 0.7, bHeight * 0.6);
      const winMesh = new THREE.Mesh(winGeo, windowMat);
      winMesh.position.set(x, bHeight / 2, z + bDepth / 2 + 0.1);
      cityGroup.add(winMesh);
    }
    scene.add(cityGroup);

    // Mouse Interaction Parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = { x, y };
    };
    container.addEventListener("mousemove", handleMouseMove);

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    setIsLoaded(true);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Scroll Chevron markings toward camera (energy transfer effect)
        chevrons.forEach((chev) => {
          chev.position.z += 18 * delta;
          if (chev.position.z > 8) {
            chev.position.z = -chevronCount * 7 + 8;
          }
        });

        // Rotate hypercar wheels
        wheels.forEach((w) => {
          w.rotation.x -= 22 * delta;
        });

        // Animate lightning sparks around rear wheels
        const positions = sparkPoints.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < sparksCount; i++) {
          positions[i * 3 + 2] += delta * (15 + Math.random() * 10);
          positions[i * 3] += (Math.random() - 0.5) * 0.15;
          positions[i * 3 + 1] = 0.05 + Math.random() * 0.6;
          if (positions[i * 3 + 2] > 7.0) {
            positions[i * 3 + 2] = 1.4 + Math.random() * 0.8;
            positions[i * 3] = (Math.random() > 0.5 ? 1.2 : -1.2) + (Math.random() - 0.5) * 0.4;
          }
        }
        sparkPoints.geometry.attributes.position.needsUpdate = true;

        // Subtle car bounce & tilt responding to mouse
        const targetX = mousePos.current.x * 1.5;
        carGroup.position.x += (targetX - carGroup.position.x) * 0.04;
        carGroup.rotation.y = -(carGroup.position.x - targetX) * 0.1;
        carGroup.rotation.z = -(carGroup.position.x - targetX) * 0.05;
        carGroup.position.y = Math.sin(time * 12) * 0.025;

        // Camera gentle drift
        camera.position.x = mousePos.current.x * 0.6;
        camera.position.y = 3.2 + mousePos.current.y * 0.3;
        camera.lookAt(carGroup.position.x * 0.4, 1.4, -20);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className || ""}`}>
      {/* 3D WebGL Canvas */}
      {hasWebGL ? (
        <div ref={mountRef} className="h-full w-full" />
      ) : (
        /* High-fidelity Fallback */
        <div className="absolute inset-0 bg-gradient-to-b from-[#070d1b] via-[#0c1529] to-[#070d1b] flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="h-2 w-24 mx-auto rounded-full bg-cyan-400 dl-glow-cyan mb-4" />
            <p className="text-sm font-semibold text-cyan-300">India&apos;s Sovereign Transportation Intelligence</p>
          </div>
        </div>
      )}

      {/* Atmospheric Vignette & Horizon Glow Overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--bg)]/70 via-transparent to-[var(--bg)]/70" />

      {/* Cinematic HUD Overlay Element */}
      <div className="pointer-events-none absolute bottom-4 left-6 hidden items-center gap-3 sm:flex">
        <span className="flex h-2 w-2 rounded-full bg-cyan-400 dl-glow-cyan animate-pulse" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300/80">
          Highway Vector Telemetry // NH44 Corridors Live
        </span>
      </div>

      {!isLoaded && hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <span className="text-xs font-semibold tracking-wider text-cyan-300">Initializing 3D Environment…</span>
          </div>
        </div>
      )}
    </div>
  );
}
