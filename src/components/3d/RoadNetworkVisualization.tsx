"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface RoadNetworkVisualizationProps {
  className?: string;
}

export default function RoadNetworkVisualization({ className }: RoadNetworkVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Nodes representing major transport hubs & statutory boundary junctions
    const nodes = [
      { x: -3.5, y: 2.5, z: 0, label: "Delhi NCR (DL)" },
      { x: -4.5, y: -0.5, z: 1, label: "Mumbai (MH)" },
      { x: 3.5, y: 1.5, z: -1, label: "Kolkata (WB)" },
      { x: -1.5, y: -3.0, z: 0.5, label: "Bengaluru (KA)" },
      { x: 0.5, y: -3.8, z: -0.5, label: "Chennai (TN)" },
      { x: -1.0, y: -0.5, z: -1.5, label: "Hyderabad (TS)" },
      { x: 0.0, y: 1.0, z: 0.5, label: "Bhopal (MP)" },
    ];

    const group = new THREE.Group();

    // Node spheres
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const hubMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const nodeGeo = new THREE.SphereGeometry(0.25, 16, 16);

    nodes.forEach((n, i) => {
      const mesh = new THREE.Mesh(nodeGeo, i === 0 ? hubMat : nodeMat);
      mesh.position.set(n.x, n.y, n.z);
      group.add(mesh);
    });

    // Connecting Highway Arteries (Lines)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.6 });
    const connections = [
      [0, 6], [6, 1], [0, 2], [2, 6], [1, 5], [6, 5], [5, 3], [3, 4], [5, 4], [1, 3]
    ];

    connections.forEach(([from, to]) => {
      const p1 = new THREE.Vector3(nodes[from].x, nodes[from].y, nodes[from].z);
      const p2 = new THREE.Vector3(nodes[to].x, nodes[to].y, nodes[to].z);
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(geo, lineMat);
      group.add(line);
    });

    scene.add(group);

    // Animation
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.005;
      group.rotation.x = Math.sin(performance.now() * 0.001) * 0.1;
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
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className ?? "h-64 w-full"}`}>
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
