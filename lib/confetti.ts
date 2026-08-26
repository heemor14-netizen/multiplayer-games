"use client";

export function launchConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#f97316", "#ea580c", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ffd700"];
  const pieces: {
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
  }[] = [];

  for (let i = 0; i < 150; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 - 100,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 16,
      speedY: -(Math.random() * 14 + 6),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let animationFrame: number;
  const startTime = Date.now();
  const duration = 3500;

  const render = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      cancelAnimationFrame(animationFrame);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.4; // gravity
      p.speedX *= 0.99;
      p.rotation += p.rotationSpeed;
      if (elapsed > duration - 1000) {
        p.opacity = Math.max(0, (duration - elapsed) / 1000);
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    animationFrame = requestAnimationFrame(render);
  };

  animationFrame = requestAnimationFrame(render);
}
