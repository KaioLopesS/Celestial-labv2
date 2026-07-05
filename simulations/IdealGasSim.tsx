
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { Maximize, Minimize, Play, Pause, RotateCcw, Sliders, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const R_CONSTANT = 8.314; // J/(mol·K)

export const IdealGasSim: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const [temperature, setTemperature] = useState(300); // K
  const [volume, setVolume] = useState(70); // % of max width
  const [numParticles, setNumParticles] = useState(40);
  const [isRunning, setIsRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsControls, setShowFsControls] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [pressure, setPressure] = useState(0);
  const [wallHits, setWallHits] = useState(0);

  const { t } = useLanguage();

  // Container dimensions (in canvas coords)
  const CONTAINER_TOP = 45;
  const CONTAINER_BOTTOM_MARGIN = 50;
  const CONTAINER_LEFT = 45;

  // Compute speed factor from temperature
  const getSpeedFactor = useCallback((temp: number) => {
    return Math.sqrt(temp / 300) * 3.5;
  }, []);

  // Initialize particles
  const initParticles = useCallback((count: number, canvasW: number, canvasH: number) => {
    const containerRight = CONTAINER_LEFT + (canvasW - CONTAINER_LEFT - 60) * (volume / 100);
    const containerBottom = canvasH - CONTAINER_BOTTOM_MARGIN;
    const speed = getSpeedFactor(temperature);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.random() * 2;
      const x = CONTAINER_LEFT + radius + Math.random() * (containerRight - CONTAINER_LEFT - radius * 2);
      const y = CONTAINER_TOP + radius + Math.random() * (containerBottom - CONTAINER_TOP - radius * 2);
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()),
        radius,
      });
    }
    return particles;
  }, [volume, temperature, getSpeedFactor]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Update particle speeds when temperature changes
  useEffect(() => {
    const speed = getSpeedFactor(temperature);
    particlesRef.current.forEach(p => {
      const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (currentSpeed > 0.01) {
        const scale = speed / currentSpeed;
        // Add some randomness to make it look more natural
        p.vx *= scale * (0.8 + Math.random() * 0.4);
        p.vy *= scale * (0.8 + Math.random() * 0.4);
      } else {
        const angle = Math.random() * Math.PI * 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }
    });
  }, [temperature, getSpeedFactor]);

  // Adjust particle count
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = particlesRef.current;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (numParticles > current.length) {
      const newOnes = initParticles(numParticles - current.length, w, h);
      particlesRef.current = [...current, ...newOnes];
    } else if (numParticles < current.length) {
      particlesRef.current = current.slice(0, numParticles);
    }
  }, [numParticles, initParticles]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize);
    resize();

    // Init particles if empty
    if (particlesRef.current.length === 0) {
      particlesRef.current = initParticles(numParticles, canvas.clientWidth, canvas.clientHeight);
    }

    let hits = 0;
    let hitAccum = 0;
    let lastPressureTime = performance.now();

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const containerRight = CONTAINER_LEFT + (w - CONTAINER_LEFT - 45) * (volume / 100);
      const containerBottom = h - CONTAINER_BOTTOM_MARGIN;
      const containerWidth = containerRight - CONTAINER_LEFT;
      const containerHeight = containerBottom - CONTAINER_TOP;

      // Calculate pressure via PV=nRT
      const n = numParticles / 100; // moles (scaled)
      const V = (volume / 100) * 0.01; // m³ (scaled)
      const P = (n * R_CONSTANT * temperature) / V;
      
      // Update pressure display periodically
      const now = performance.now();
      if (now - lastPressureTime > 200) {
        setPressure(P);
        setWallHits(hitAccum);
        hitAccum = 0;
        lastPressureTime = now;
      }

      // Pressure-based wall color
      const pressureNorm = Math.min(P / 500000, 1);
      const wallR = Math.floor(30 + pressureNorm * 225);
      const wallG = Math.floor(180 - pressureNorm * 140);
      const wallB = Math.floor(255 - pressureNorm * 200);
      const wallColor = `rgb(${wallR}, ${wallG}, ${wallB})`;

      // Draw container background
      const bgGrad = ctx.createLinearGradient(CONTAINER_LEFT, CONTAINER_TOP, CONTAINER_LEFT, containerBottom);
      bgGrad.addColorStop(0, 'rgba(10, 15, 30, 0.9)');
      bgGrad.addColorStop(1, 'rgba(5, 10, 20, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(CONTAINER_LEFT, CONTAINER_TOP, containerWidth, containerHeight);

      // Draw container grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = CONTAINER_LEFT; gx <= containerRight; gx += 30) {
        ctx.beginPath();
        ctx.moveTo(gx, CONTAINER_TOP);
        ctx.lineTo(gx, containerBottom);
        ctx.stroke();
      }
      for (let gy = CONTAINER_TOP; gy <= containerBottom; gy += 30) {
        ctx.beginPath();
        ctx.moveTo(CONTAINER_LEFT, gy);
        ctx.lineTo(containerRight, gy);
        ctx.stroke();
      }

      // Draw container walls (left, top, bottom)
      ctx.strokeStyle = wallColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = wallColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(containerRight, CONTAINER_TOP);
      ctx.lineTo(CONTAINER_LEFT, CONTAINER_TOP);
      ctx.lineTo(CONTAINER_LEFT, containerBottom);
      ctx.lineTo(containerRight, containerBottom);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw piston (right wall)
      const pistonGrad = ctx.createLinearGradient(containerRight - 10, 0, containerRight + 10, 0);
      pistonGrad.addColorStop(0, 'rgba(100,120,150,0.6)');
      pistonGrad.addColorStop(0.5, 'rgba(180,200,220,0.9)');
      pistonGrad.addColorStop(1, 'rgba(100,120,150,0.6)');
      ctx.fillStyle = pistonGrad;
      ctx.fillRect(containerRight - 6, CONTAINER_TOP, 12, containerHeight);

      // Piston handle lines
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let py = CONTAINER_TOP + 10; py < containerBottom - 10; py += 8) {
        ctx.beginPath();
        ctx.moveTo(containerRight - 3, py);
        ctx.lineTo(containerRight + 3, py);
        ctx.stroke();
      }

      // Piston arrow indicator
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◀▶', containerRight, CONTAINER_TOP - 10);

      // Update and draw particles
      const particles = particlesRef.current;
      if (isRunning) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Move
          p.x += p.vx;
          p.y += p.vy;

          // Wall collisions
          if (p.x - p.radius < CONTAINER_LEFT) {
            p.x = CONTAINER_LEFT + p.radius;
            p.vx = Math.abs(p.vx);
            hitAccum++;
          }
          if (p.x + p.radius > containerRight) {
            p.x = containerRight - p.radius;
            p.vx = -Math.abs(p.vx);
            hitAccum++;
          }
          if (p.y - p.radius < CONTAINER_TOP) {
            p.y = CONTAINER_TOP + p.radius;
            p.vy = Math.abs(p.vy);
            hitAccum++;
          }
          if (p.y + p.radius > containerBottom) {
            p.y = containerBottom - p.radius;
            p.vy = -Math.abs(p.vy);
            hitAccum++;
          }

          // Particle-particle collisions
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx = q.x - p.x;
            const dy = q.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = p.radius + q.radius;

            if (dist < minDist && dist > 0) {
              // Elastic collision
              const nx = dx / dist;
              const ny = dy / dist;
              const dvx = p.vx - q.vx;
              const dvy = p.vy - q.vy;
              const dvn = dvx * nx + dvy * ny;

              if (dvn > 0) {
                p.vx -= dvn * nx;
                p.vy -= dvn * ny;
                q.vx += dvn * nx;
                q.vy += dvn * ny;
              }

              // Separate overlapping particles
              const overlap = minDist - dist;
              p.x -= overlap * nx * 0.5;
              p.y -= overlap * ny * 0.5;
              q.x += overlap * nx * 0.5;
              q.y += overlap * ny * 0.5;
            }
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const speedNorm = Math.min(speed / 8, 1);

        // Color gradient: blue (cold) → cyan → yellow → red (hot)
        let r, g, b;
        if (speedNorm < 0.33) {
          const t = speedNorm / 0.33;
          r = Math.floor(50 + t * 0);
          g = Math.floor(150 + t * 105);
          b = Math.floor(255);
        } else if (speedNorm < 0.66) {
          const t = (speedNorm - 0.33) / 0.33;
          r = Math.floor(50 + t * 205);
          g = Math.floor(255);
          b = Math.floor(255 - t * 200);
        } else {
          const t = (speedNorm - 0.66) / 0.34;
          r = 255;
          g = Math.floor(255 - t * 200);
          b = Math.floor(55 - t * 55);
        }

        const color = `rgb(${r}, ${g}, ${b})`;

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;

        // Trail
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();

        // Particle
        const pGrad = ctx.createRadialGradient(p.x - 1, p.y - 1, 0, p.x, p.y, p.radius);
        pGrad.addColorStop(0, `rgba(${Math.min(r + 80, 255)}, ${Math.min(g + 80, 255)}, ${Math.min(b + 80, 255)}, 1)`);
        pGrad.addColorStop(1, color);
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      // Labels inside canvas
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      const maxAvailableWidth = containerRight - CONTAINER_LEFT - 10;
      const stepX = Math.max(75, maxAvailableWidth / 3);
      ctx.fillText(`P: ${(P / 1000).toFixed(1)}kP`, CONTAINER_LEFT + 5, containerBottom + 20);
      ctx.fillText(`V: ${(volume).toFixed(0)}%`, CONTAINER_LEFT + 5 + stepX, containerBottom + 20);
      ctx.fillText(`T: ${temperature}K`, CONTAINER_LEFT + 5 + stepX * 2, containerBottom + 20);

      // Formula
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PV = nRT', (CONTAINER_LEFT + containerRight) / 2, containerBottom + 45);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [volume, numParticles, isRunning, temperature, initParticles]);

  // Drag piston on canvas
  const isDraggingPistonRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      return {
        x: clientX - rect.left,
        w: rect.width,
      };
    };

    const handleDown = (e: MouseEvent | TouchEvent) => {
      const { x, w } = getCanvasPos(e);
      const containerRight = CONTAINER_LEFT + (w - CONTAINER_LEFT - 45) * (volume / 100);
      
      // If user touched/clicked near the piston (within 30px)
      if (Math.abs(x - containerRight) < 30) {
        isDraggingPistonRef.current = true;
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingPistonRef.current) return;
      e.preventDefault();
      
      const { x, w } = getCanvasPos(e);
      const pct = ((x - CONTAINER_LEFT) / (w - CONTAINER_LEFT - 45)) * 100;
      const clampedPct = Math.max(20, Math.min(100, pct));
      setVolume(Math.round(clampedPct));
    };

    const handleUp = () => {
      isDraggingPistonRef.current = false;
    };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', handleUp);
    canvas.addEventListener('touchstart', handleDown, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleUp);

    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('mouseleave', handleUp);
      canvas.removeEventListener('touchstart', handleDown);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleUp);
    };
  }, [volume]);

  const handleReset = () => {
    setTemperature(300);
    setVolume(70);
    setNumParticles(40);
    setIsRunning(true);
    const canvas = canvasRef.current;
    if (canvas) {
      particlesRef.current = initParticles(40, canvas.clientWidth, canvas.clientHeight);
    }
  };

  const pressureKPa = pressure / 1000;
  const pressureNorm = Math.min(pressure / 500000, 1);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in-up">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[280px] sm:min-h-[380px] bg-celestial-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />

        {/* Toolbar */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-white hover:bg-black/80 transition-colors"
            title={isRunning ? 'Pausar' : 'Retomar'}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-white hover:bg-black/80 transition-colors"
            title="Resetar"
          >
            <RotateCcw size={16} />
          </button>
           <button
            onClick={() => setShowLabels(!showLabels)}
            className="p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-white hover:bg-black/80 transition-colors"
            title="Mostrar/Ocultar Rótulos"
          >
            {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-white hover:bg-black/80 transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        {/* Fullscreen Controls Overlay */}
        {isFullscreen && (
          <div className="absolute bottom-6 right-6 z-50" onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFsControls(!showFsControls)}
              className="mb-2 ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 text-xs text-celestial-accent font-bold hover:bg-black/90 transition-colors"
            >
              <Sliders size={12} />
              {t('gas.controls_label')}
              {showFsControls ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
            {showFsControls && (
              <div className="w-72 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl space-y-4 animate-fade-in-up">
                {/* Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{t('gas.temperature')} (K)</span>
                    <span className="text-white font-mono">{temperature} K</span>
                  </div>
                  <input
                    type="range" min="100" max="800" step="10" value={temperature}
                    onChange={(e) => setTemperature(parseInt(e.target.value))}
                    className="w-full accent-orange-400 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                {/* Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{t('gas.volume')}</span>
                    <span className="text-white font-mono">{volume}%</span>
                  </div>
                  <input
                    type="range" min="20" max="100" step="1" value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full accent-blue-400 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                {/* Particles */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{t('gas.particles')} (n)</span>
                    <span className="text-white font-mono">{numParticles}</span>
                  </div>
                  <input
                    type="range" min="5" max="100" step="1" value={numParticles}
                    onChange={(e) => setNumParticles(parseInt(e.target.value))}
                    className="w-full accent-emerald-400 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                {/* Pressure readout */}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">{t('gas.pressure')}</span>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: `rgb(${Math.floor(30 + pressureNorm * 225)}, ${Math.floor(180 - pressureNorm * 140)}, ${Math.floor(255 - pressureNorm * 200)})` }}
                  >
                    {pressureKPa.toFixed(1)} kPa
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-96 space-y-6 p-6 bg-celestial-800/30 rounded-xl border border-white/10 backdrop-blur-sm h-fit">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2 text-celestial-accent">{t('gas.title')}</h2>
          <p className="text-xs text-gray-300 leading-relaxed text-justify">
            {t('gas.intro')}
          </p>
        </div>

        {/* Formula */}
        <div className="p-4 bg-black/40 rounded-xl border border-celestial-500/30 text-center">
          <div className="text-lg font-mono font-bold text-celestial-accent tracking-wider">
            PV = nRT
          </div>
          <div className="text-[10px] text-gray-500 mt-1">{t('gas.formula_desc')}</div>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <label>{t('gas.temperature')} (K)</label>
              <span className="text-white font-mono">{temperature} K</span>
            </div>
            <input
              type="range" min="100" max="800" step="10" value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full accent-orange-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>100 K</span><span>800 K</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <label>{t('gas.volume')}</label>
              <span className="text-white font-mono">{volume}%</span>
            </div>
            <input
              type="range" min="20" max="100" step="1" value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-full accent-blue-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>20%</span><span>100%</span>
            </div>
          </div>

          {/* Number of Particles */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <label>{t('gas.particles')} (n)</label>
              <span className="text-white font-mono">{numParticles}</span>
            </div>
            <input
              type="range" min="5" max="100" step="1" value={numParticles}
              onChange={(e) => setNumParticles(parseInt(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>5</span><span>100</span>
            </div>
          </div>
        </div>

        {/* Pressure Readout */}
        <div className="p-5 bg-black/40 rounded-xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t('gas.readings')}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t('gas.pressure')} (P)</span>
              <span
                className="text-lg font-bold"
                style={{ color: `rgb(${Math.floor(30 + pressureNorm * 225)}, ${Math.floor(180 - pressureNorm * 140)}, ${Math.floor(255 - pressureNorm * 200)})` }}
              >
                {pressureKPa.toFixed(1)} kPa
              </span>
            </div>

            {/* Pressure bar */}
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pressureNorm * 100}%`,
                  background: `linear-gradient(90deg, rgb(30,180,255), rgb(255,200,50), rgb(255,60,60))`,
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-gray-400">{t('gas.temperature')} (T)</span>
              <span className="text-orange-400 font-bold">{temperature} K</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t('gas.volume')} (V)</span>
              <span className="text-blue-400 font-bold">{volume}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t('gas.particles')} (n)</span>
              <span className="text-emerald-400 font-bold">{numParticles}</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-gradient-to-br from-orange-900/20 to-transparent rounded-xl border border-orange-500/20">
          <div className="text-[10px] text-orange-300/80 font-bold uppercase tracking-wider mb-2">{t('gas.info_title')}</div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {t('gas.info_text')}
          </p>
        </div>
      </div>
    </div>
  );
};
