"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface VehicleModel3DProps {
  category?: string;
  className?: string;
  autoRotate?: boolean;
}

export default function VehicleModel3D({ category = "private-car", className, autoRotate = true }: VehicleModel3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
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

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x22d3ee, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    // Vehicle Group
    const vehicleGroup = new THREE.Group();

    // Build geometry based on category
    if (category === "two-wheeler") {
      // 2-Wheeler: Body frame, 2 wheels, handlebar
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.2 });
      const frameGeo = new THREE.BoxGeometry(0.4, 0.8, 2.2);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 0.8;
      vehicleGroup.add(frame);

      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const frontWheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.18, 16);
      frontWheelGeo.rotateZ(Math.PI / 2);
      const frontWheel = new THREE.Mesh(frontWheelGeo, wheelMat);
      frontWheel.position.set(0, 0.45, -0.9);
      vehicleGroup.add(frontWheel);

      const rearWheel = new THREE.Mesh(frontWheelGeo, wheelMat);
      rearWheel.position.set(0, 0.45, 0.9);
      vehicleGroup.add(rearWheel);
    } else if (category === "bus" || category === "heavy-commercial") {
      // Heavy bus / truck: Long chassis, multiple wheels
      const busMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, metalness: 0.7, roughness: 0.3 });
      const busGeo = new THREE.BoxGeometry(1.9, 1.4, 4.8);
      const bus = new THREE.Mesh(busGeo, busMat);
      bus.position.y = 1.1;
      vehicleGroup.add(bus);

      // Glass windows strip
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x070d1b, metalness: 0.9, roughness: 0.1 });
      const glassGeo = new THREE.BoxGeometry(1.92, 0.45, 4.2);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.y = 1.25;
      vehicleGroup.add(glass);

      // 6 Wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      [
        [-1.0, 0.4, -1.6],
        [1.0, 0.4, -1.6],
        [-1.0, 0.4, 1.2],
        [1.0, 0.4, 1.2],
        [-1.0, 0.4, 1.9],
        [1.0, 0.4, 1.9],
      ].forEach(([x, y, z]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(x, y, z);
        vehicleGroup.add(w);
      });
    } else {
      // Private Car / Taxi / Default
      const carColor = category === "taxi" ? 0xf59e0b : 0x2563eb;
      const bodyMat = new THREE.MeshStandardMaterial({ color: carColor, metalness: 0.85, roughness: 0.2 });
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.65, 3.8);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.55;
      vehicleGroup.add(body);

      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x070d1b, metalness: 0.9, roughness: 0.1 });
      const cabinGeo = new THREE.BoxGeometry(1.4, 0.55, 2.0);
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.0, -0.2);
      vehicleGroup.add(cabin);

      // 4 Wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      [
        [-0.95, 0.35, -1.1],
        [0.95, 0.35, -1.1],
        [-0.95, 0.35, 1.1],
        [0.95, 0.35, 1.1],
      ].forEach(([x, y, z]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(x, y, z);
        vehicleGroup.add(w);
      });
    }

    scene.add(vehicleGroup);

    // Ground shadow circle
    const shadowGeo = new THREE.CircleGeometry(2.5, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.01;
    scene.add(shadow);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate) {
        vehicleGroup.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [category, autoRotate]);

  if (!hasWebGL) {
    return (
      <div className={`flex items-center justify-center bg-surface-2 rounded-2xl ${className ?? "h-48"}`}>
        <span className="text-xs text-muted">Vehicle Class Visualization</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className ?? "h-48 w-full"}`}>
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
