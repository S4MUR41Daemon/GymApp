"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  opacity: number;
  opDir: number;
  cyan: boolean;
};

const PARTICLE_COUNT = 40;

function createParticle(width: number, height: number, fromBottom = false): Particle {
  return {
    x: Math.random() * width,
    y: fromBottom ? height + 5 : Math.random() * height,
    r: 0.3 + Math.random() * 1.4,
    vy: -(0.08 + Math.random() * 0.25),
    vx: (Math.random() - 0.5) * 0.15,
    opacity: 0.1 + Math.random() * 0.45,
    opDir: Math.random() > 0.5 ? 1 : -1,
    cyan: Math.random() < 0.35,
  };
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let animationFrame = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(width, height));
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        const color = particle.cyan ? "34,211,238" : "59,130,246";
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color},${particle.opacity})`;
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.r * 5,
        );
        gradient.addColorStop(0, `rgba(${color},${particle.opacity * 0.2})`);
        gradient.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r * 5, 0, Math.PI * 2);
        ctx.fill();

        particle.y += particle.vy;
        particle.x += particle.vx;
        particle.opacity += particle.opDir * 0.003;

        if (particle.opacity > 0.55 || particle.opacity < 0.1) {
          particle.opDir *= -1;
        }
        if (particle.y < -10) {
          Object.assign(particle, createParticle(width, height, true));
        }
        if (particle.x < -10 || particle.x > width + 10) {
          particle.vx *= -1;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
      } else {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    resize();
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <canvas id="particle-canvas" ref={canvasRef} aria-hidden="true" />;
}
