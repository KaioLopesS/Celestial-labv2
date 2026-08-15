import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { Maximize, Minimize, Play, Pause, RotateCcw, Sliders, ChevronDown, ChevronUp, Eye, EyeOff, FlaskConical, BarChart3, Lock, Trash2 } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

type TabType = 'lab' | 'transformations';
type TransformationType = 'isothermal' | 'isobaric' | 'isochoric';

const R_CONSTANT = 8.314; // J/(mol·K)

// Convert internal volume (20-100) to liters (2-10)
const volumeToLiters = (v: number): number => 2 + (v - 20) * (8 / 80);
const litersToInternal = (L: number): number => 20 + (L - 2) * (80 / 8);

export const IdealGasSim: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const [temperature, setTemperature] = useState(300);
  const [volume, setVolume] = useState(70);
  const [numParticles, setNumParticles] = useState(40);
  const [isRunning, setIsRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsControls, setShowFsControls] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [pressure, setPressure] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>('lab');

  // Transformations
  const [transType, setTransType] = useState<TransformationType>('isothermal');
  const [graphPath, setGraphPath] = useState<{ x: number; y: number }[]>([]);
  const transRefState = useRef({ P: 0, V: 0, T: 0 });
  const isAutoRef = useRef(false);

  // Refs for current values (used in event listeners without re-creating them)
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const transTypeRef = useRef(transType);
  transTypeRef.current = transType;

  const { t } = useLanguage();

  const CONTAINER_TOP = 40;
  const CONTAINER_BOTTOM_MARGIN = 45;
  const CONTAINER_LEFT = 40;

  const volumeLiters = volumeToLiters(volume);

  const getSpeedFactor = useCallback((temp: number) => {
    return Math.sqrt(temp / 300) * 3.5;
  }, []);

  const initParticles = useCallback((count: number, canvasW: number, canvasH: number) => {
    const effectiveW = canvasW > 100 ? canvasW : 800;
    const effectiveH = canvasH > 100 ? canvasH : 400;
    const containerRight = CONTAINER_LEFT + (effectiveW - CONTAINER_LEFT - 40) * (volume / 100);
    const containerBottom = effectiveH - CONTAINER_BOTTOM_MARGIN;
    const speed = getSpeedFactor(temperature);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.random() * 2;
      const x = CONTAINER_LEFT + radius + Math.random() * Math.max(20, containerRight - CONTAINER_LEFT - radius * 2);
      const y = CONTAINER_TOP + radius + Math.random() * Math.max(20, containerBottom - CONTAINER_TOP - radius * 2);
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

  // Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  // Update particle speeds when temperature changes
  useEffect(() => {
    const speed = getSpeedFactor(temperature);
    particlesRef.current.forEach(p => {
      const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (currentSpeed > 0.01) {
        const scale = speed / currentSpeed;
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
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 400;

    if (numParticles > current.length) {
      const newOnes = initParticles(numParticles - current.length, w, h);
      particlesRef.current = [...current, ...newOnes];
    } else if (numParticles < current.length) {
      particlesRef.current = current.slice(0, numParticles);
    }
  }, [numParticles, initParticles]);

  // =============================================
  // MAIN ANIMATION LOOP — particle simulation
  // =============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    let lastPressureTime = performance.now();

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, w, h);

      const containerRight = CONTAINER_LEFT + (w - CONTAINER_LEFT - 40) * (volume / 100);
      const containerBottom = h - CONTAINER_BOTTOM_MARGIN;
      const containerWidth = containerRight - CONTAINER_LEFT;
      const containerHeight = containerBottom - CONTAINER_TOP;

      // Ensure particles are initialized and within container bounds
      if (particlesRef.current.length === 0) {
        particlesRef.current = initParticles(numParticles, w, h);
      } else {
        for (const p of particlesRef.current) {
          if (isNaN(p.x) || p.x < CONTAINER_LEFT + p.radius || p.x > containerRight - p.radius) {
            p.x = CONTAINER_LEFT + p.radius + Math.random() * Math.max(10, containerRight - CONTAINER_LEFT - p.radius * 2);
          }
          if (isNaN(p.y) || p.y < CONTAINER_TOP + p.radius || p.y > containerBottom - p.radius) {
            p.y = CONTAINER_TOP + p.radius + Math.random() * Math.max(10, containerBottom - CONTAINER_TOP - p.radius * 2);
          }
        }
      }

      const n = numParticles / 100;
      const V_m3 = volumeToLiters(volume) / 1000;
      const P = (n * R_CONSTANT * temperature) / V_m3;

      const now = performance.now();
      if (now - lastPressureTime > 200) {
        setPressure(P);
        lastPressureTime = now;
      }

      const pressureNorm = Math.min(P / 500000, 1);
      const wallR = Math.floor(30 + pressureNorm * 225);
      const wallG = Math.floor(180 - pressureNorm * 140);
      const wallB = Math.floor(255 - pressureNorm * 200);
      const wallColor = `rgb(${wallR}, ${wallG}, ${wallB})`;

      // Container bg
      const bgGrad = ctx.createLinearGradient(CONTAINER_LEFT, CONTAINER_TOP, CONTAINER_LEFT, containerBottom);
      bgGrad.addColorStop(0, 'rgba(10, 15, 30, 0.9)');
      bgGrad.addColorStop(1, 'rgba(5, 10, 20, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(CONTAINER_LEFT, CONTAINER_TOP, containerWidth, containerHeight);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = CONTAINER_LEFT; gx <= containerRight; gx += 30) {
        ctx.beginPath(); ctx.moveTo(gx, CONTAINER_TOP); ctx.lineTo(gx, containerBottom); ctx.stroke();
      }
      for (let gy = CONTAINER_TOP; gy <= containerBottom; gy += 30) {
        ctx.beginPath(); ctx.moveTo(CONTAINER_LEFT, gy); ctx.lineTo(containerRight, gy); ctx.stroke();
      }

      // Walls
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

      // Piston
      const pistonGrad = ctx.createLinearGradient(containerRight - 10, 0, containerRight + 10, 0);
      pistonGrad.addColorStop(0, 'rgba(100,120,150,0.6)');
      pistonGrad.addColorStop(0.5, 'rgba(180,200,220,0.9)');
      pistonGrad.addColorStop(1, 'rgba(100,120,150,0.6)');
      ctx.fillStyle = pistonGrad;
      ctx.fillRect(containerRight - 6, CONTAINER_TOP, 12, containerHeight);

      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let py = CONTAINER_TOP + 10; py < containerBottom - 10; py += 8) {
        ctx.beginPath(); ctx.moveTo(containerRight - 3, py); ctx.lineTo(containerRight + 3, py); ctx.stroke();
      }

      // Piston lock indicator for isochoric/isobaric
      if (activeTabRef.current === 'transformations' &&
        (transTypeRef.current === 'isochoric' || transTypeRef.current === 'isobaric')) {
        ctx.fillStyle = 'rgba(255,100,100,0.8)';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIXO', containerRight, CONTAINER_TOP - 8);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◀▶', containerRight, CONTAINER_TOP - 8);
      }

      // Update and draw particles (scaled proportionally to container width for constant visual speed in Fullscreen)
      const particles = particlesRef.current;
      const speedScale = Math.max(0.5, containerWidth / 450);

      if (isRunning) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx * speedScale;
          p.y += p.vy * speedScale;

          if (p.x - p.radius < CONTAINER_LEFT) { p.x = CONTAINER_LEFT + p.radius; p.vx = Math.abs(p.vx); }
          if (p.x + p.radius > containerRight) { p.x = containerRight - p.radius; p.vx = -Math.abs(p.vx); }
          if (p.y - p.radius < CONTAINER_TOP) { p.y = CONTAINER_TOP + p.radius; p.vy = Math.abs(p.vy); }
          if (p.y + p.radius > containerBottom) { p.y = containerBottom - p.radius; p.vy = -Math.abs(p.vy); }

          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx = q.x - p.x;
            const dy = q.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = p.radius + q.radius;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const dvx = p.vx - q.vx;
              const dvy = p.vy - q.vy;
              const dvn = dvx * nx + dvy * ny;
              if (dvn > 0) {
                p.vx -= dvn * nx; p.vy -= dvn * ny;
                q.vx += dvn * nx; q.vy += dvn * ny;
              }
              const overlap = minDist - dist;
              p.x -= overlap * nx * 0.5; p.y -= overlap * ny * 0.5;
              q.x += overlap * nx * 0.5; q.y += overlap * ny * 0.5;
            }
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const speedNorm = Math.min(speed / 8, 1);
        let r, g, b;
        if (speedNorm < 0.33) {
          const t = speedNorm / 0.33;
          r = 50; g = Math.floor(150 + t * 105); b = 255;
        } else if (speedNorm < 0.66) {
          const t = (speedNorm - 0.33) / 0.33;
          r = Math.floor(50 + t * 205); g = 255; b = Math.floor(255 - t * 200);
        } else {
          const t = (speedNorm - 0.66) / 0.34;
          r = 255; g = Math.floor(255 - t * 200); b = Math.floor(55 - t * 55);
        }
        const color = `rgb(${r}, ${g}, ${b})`;

        ctx.shadowColor = color; ctx.shadowBlur = 8;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * speedScale * 3, p.y - p.vy * speedScale * 3); ctx.stroke();

        const pGrad = ctx.createRadialGradient(p.x - 1, p.y - 1, 0, p.x, p.y, p.radius);
        pGrad.addColorStop(0, `rgba(${Math.min(r + 80, 255)}, ${Math.min(g + 80, 255)}, ${Math.min(b + 80, 255)}, 1)`);
        pGrad.addColorStop(1, color);
        ctx.fillStyle = pGrad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Bottom labels inside particle canvas
      const vL = volumeToLiters(volume);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      const maxW = containerRight - CONTAINER_LEFT - 10;
      const stepX = Math.max(65, maxW / 3);
      ctx.fillText(`P: ${(P / 1000).toFixed(1)} kPa`, CONTAINER_LEFT + 2, containerBottom + 18);
      ctx.fillText(`V: ${vL.toFixed(1)} L`, CONTAINER_LEFT + 2 + stepX, containerBottom + 18);
      ctx.fillText(`T: ${temperature} K`, CONTAINER_LEFT + 2 + stepX * 2, containerBottom + 18);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PV = nRT', (CONTAINER_LEFT + containerRight) / 2, containerBottom + 38);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [volume, numParticles, isRunning, temperature, initParticles]);

  // =============================================
  // PISTON DRAG
  // =============================================
  const isDraggingPistonRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      return { x: clientX - rect.left, w: rect.width };
    };

    const handleDown = (e: MouseEvent | TouchEvent) => {
      if (activeTabRef.current === 'transformations' &&
        (transTypeRef.current === 'isochoric' || transTypeRef.current === 'isobaric')) {
        return;
      }
      const { x, w } = getCanvasPos(e);
      const containerRight = CONTAINER_LEFT + (w - CONTAINER_LEFT - 40) * (volume / 100);
      if (Math.abs(x - containerRight) < 30) {
        isDraggingPistonRef.current = true;
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingPistonRef.current) return;
      e.preventDefault();
      hasStartedGraphRef.current = true;
      const { x, w } = getCanvasPos(e);
      const pct = ((x - CONTAINER_LEFT) / (w - CONTAINER_LEFT - 40)) * 100;
      const clampedPct = Math.max(20, Math.min(100, pct));
      setVolume(Math.round(clampedPct));
    };

    const handleUp = () => { isDraggingPistonRef.current = false; };

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
    if (canvas) particlesRef.current = initParticles(40, canvas.clientWidth, canvas.clientHeight);
  };

  const pressureKPa = pressure / 1000;
  const pressureNorm = Math.min(pressure / 500000, 1);

  // =============================================
  // TRANSFORMATION LOGIC
  // =============================================

  // Compute exact physical point (x, y) for current transformation
  const getGraphPoint = useCallback((P_pa: number, V_L: number, T_K: number) => {
    const n = numParticles / 100;
    const ref = transRefState.current;

    switch (transType) {
      case 'isothermal': {
        // T constant = T_ref. P = nRT_ref / V
        const T_ref = ref.T || T_K;
        const P_calc = (n * R_CONSTANT * T_ref) / (V_L / 1000);
        return { x: V_L, y: P_calc / 1000 }; // P × V
      }
      case 'isobaric': {
        // P constant = P_ref. V = nRT / P_ref
        const P_ref = ref.P || P_pa;
        const V_calc = (n * R_CONSTANT * T_K * 1000) / P_ref;
        return { x: T_K, y: V_calc }; // V × T
      }
      case 'isochoric': {
        // V constant = V_ref. P = nRT / V_ref
        const V_ref_L = ref.V || V_L;
        const P_calc = (n * R_CONSTANT * T_K) / (V_ref_L / 1000);
        return { x: T_K, y: P_calc / 1000 }; // P × T
      }
    }
  }, [transType, numParticles]);

  const getGraphAxes = useCallback(() => {
    switch (transType) {
      case 'isothermal': return { xLabel: 'V (L)', yLabel: 'P (kPa)', title: 'P × V' };
      case 'isobaric':   return { xLabel: 'T (K)', yLabel: 'V (L)',   title: 'V × T' };
      case 'isochoric':  return { xLabel: 'T (K)', yLabel: 'P (kPa)', title: 'P × T' };
    }
  }, [transType]);

  // Ref to track if student has started interacting with transformation controls
  const hasStartedGraphRef = useRef(false);

  // Capture reference state when entering transformations or switching type (start zeroed/empty)
  useEffect(() => {
    if (activeTab === 'transformations') {
      hasStartedGraphRef.current = false;
      setNumParticles(40); // Fixed particle count (closed system)
      let initT = temperature;
      let initV = volume;

      if (transType === 'isothermal') {
        initV = 20; // 2.0 L (min)
        setVolume(20);
      } else if (transType === 'isobaric' || transType === 'isochoric') {
        initT = 100; // 100 K (min)
        setTemperature(100);
      }

      const n = numParticles / 100;
      const V_L = volumeToLiters(initV);
      const V_m3 = V_L / 1000;
      const P = (n * R_CONSTANT * initT) / V_m3;
      transRefState.current = { P, V: V_L, T: initT };
      setGraphPath([]); // Zerado inicialmente
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, transType]);

  // Auto-adjust for ISOBARIC: T changes → adjust V to keep P constant
  useEffect(() => {
    if (activeTab !== 'transformations' || transType !== 'isobaric' || isAutoRef.current) return;
    const P_ref = transRefState.current.P;
    if (P_ref === 0) return;
    const n = numParticles / 100;
    const V_L = (n * R_CONSTANT * temperature * 1000) / P_ref;
    const clamped = Math.max(2, Math.min(10, V_L));
    const internal = Math.round(litersToInternal(clamped));
    if (internal !== volume) {
      isAutoRef.current = true;
      setVolume(internal);
      setTimeout(() => { isAutoRef.current = false; }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temperature, activeTab, transType]);

  // Sample discrete state points as variables change (only after student starts interacting)
  useEffect(() => {
    if (activeTab !== 'transformations' || !hasStartedGraphRef.current) return;
    const n = numParticles / 100;
    const V_L = volumeToLiters(volume);
    const V_m3 = V_L / 1000;
    const P = (n * R_CONSTANT * temperature) / V_m3;
    const pt = getGraphPoint(P, V_L, temperature);

    setGraphPath(prev => {
      if (prev.length === 0) {
        const ref = transRefState.current;
        const startPt = getGraphPoint(ref.P, ref.V, ref.T);
        if (Math.abs(startPt.x - pt.x) < 0.05 && Math.abs(startPt.y - pt.y) < 0.05) {
          return [startPt];
        }
        return [startPt, pt];
      }
      const last = prev[prev.length - 1];
      const dx = Math.abs(last.x - pt.x);
      const dy = Math.abs(last.y - pt.y);
      if (dx < 0.05 && dy < 0.05) {
        return prev;
      }
      return [...prev, pt];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temperature, volume, activeTab, getGraphPoint]);

  // =============================================
  // GRAPH DRAWING (smooth real-time rendering)
  // =============================================
  useEffect(() => {
    if (activeTab !== 'transformations') return;
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const drawGraph = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(drawGraph);
        return;
      }

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, w, h);

      const margin = { top: 20, right: 15, bottom: 35, left: 45 };
      const gw = w - margin.left - margin.right;
      const gh = h - margin.top - margin.bottom;

      // Background
      ctx.fillStyle = 'rgba(5, 8, 18, 0.95)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, w, h);

      const axes = getGraphAxes();

      let xMin = 0, xMax = 10, yMin = 0, yMax = 100;

      if (graphPath.length > 0) {
        const xs = graphPath.map(pt => pt.x);
        const ys = graphPath.map(pt => pt.y);
        const xDataMin = Math.min(...xs);
        const xDataMax = Math.max(...xs);
        const yDataMin = Math.min(...ys);
        const yDataMax = Math.max(...ys);

        const xRange = (xDataMax - xDataMin) || Math.max(1, xDataMax * 0.3);
        const yRange = (yDataMax - yDataMin) || Math.max(1, yDataMax * 0.3);
        xMin = Math.max(0, xDataMin - xRange * 0.2);
        xMax = xDataMax + xRange * 0.2;
        yMin = Math.max(0, yDataMin - yRange * 0.3);
        yMax = yDataMax + yRange * 0.3;
      }

      if (xMax <= xMin) xMax = xMin + 1;
      if (yMax <= yMin) yMax = yMin + 1;

      const toX = (v: number) => margin.left + ((v - xMin) / (xMax - xMin)) * gw;
      const toY = (p: number) => margin.top + gh - ((p - yMin) / (yMax - yMin)) * gh;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const x = margin.left + (gw * i) / 5;
        const y = margin.top + (gh * i) / 5;
        ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + gh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + gw, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, margin.top + gh);
      ctx.lineTo(margin.left + gw, margin.top + gh);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(axes.xLabel, margin.left + gw / 2, h - 4);

      ctx.save();
      ctx.translate(10, margin.top + gh / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(axes.yLabel, 0, 0);
      ctx.restore();

      // Empty prompt text
      if (graphPath.length === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Altere os controles para formar o gráfico', margin.left + gw / 2, margin.top + gh / 2);
      }

      // Ticks
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      const xIsInt = axes.xLabel.includes('K');
      const yIsInt = axes.yLabel.includes('kPa');
      for (let i = 0; i <= 4; i++) {
        const xVal = xMin + ((xMax - xMin) * i) / 4;
        const yVal = yMin + ((yMax - yMin) * i) / 4;
        ctx.textAlign = 'center';
        ctx.fillText(xIsInt ? xVal.toFixed(0) : xVal.toFixed(1), toX(xVal), margin.top + gh + 14);
        ctx.textAlign = 'right';
        ctx.fillText(yIsInt ? yVal.toFixed(0) : yVal.toFixed(1), margin.left - 5, toY(yVal) + 3);
      }

      const transColors: Record<TransformationType, string> = {
        isothermal: '#00f0ff',
        isobaric: '#ff6b6b',
        isochoric: '#4ecdc4',
      };
      const curveColor = transColors[transType];

      // 1. Draw connecting line through recorded points (ONLY appears after 10 or more points)
      if (graphPath.length >= 10) {
        ctx.shadowColor = curveColor;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        graphPath.forEach((pt, i) => {
          const cx = toX(pt.x);
          const cy = toY(pt.y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = `${curveColor}33`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        graphPath.forEach((pt, i) => {
          const cx = toX(pt.x);
          const cy = toY(pt.y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        ctx.stroke();
      }

      // 2. Projections to X and Y axes for the LAST (current) point (only when < 10 points)
      if (graphPath.length > 0 && graphPath.length < 10) {
        const lastPt = graphPath[graphPath.length - 1];
        const lx = toX(lastPt.x);
        const ly = toY(lastPt.y);

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // Projection to X axis
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, margin.top + gh);
        ctx.stroke();

        // Projection to Y axis
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(margin.left, ly);
        ctx.stroke();

        ctx.restore();
      }

      // 3. Draw past historical points (nodes)
      graphPath.forEach((pt, i) => {
        const cx = toX(pt.x);
        const cy = toY(pt.y);
        const isLast = i === graphPath.length - 1;

        if (!isLast) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = curveColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();

          // Node number label (only when < 10 points)
          if (graphPath.length < 10) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}`, cx, cy - 6);
          }
        }
      });

      // 4. Draw LAST (latest) point with maximum prominence
      if (graphPath.length > 0) {
        const lastIdx = graphPath.length - 1;
        const lastPt = graphPath[lastIdx];
        const lx = toX(lastPt.x);
        const ly = toY(lastPt.y);

        // Outer glowing pulse ring
        ctx.shadowColor = curveColor;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 2;
        ctx.fillStyle = curveColor;
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Inner white core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Floating Callout Badge above last point ONLY when < 10 points
        if (graphPath.length < 10) {
          const labelText = `#${lastIdx + 1} (${lastPt.x.toFixed(1)}, ${lastPt.y.toFixed(1)})`;
          ctx.font = 'bold 9px sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          const badgeW = textWidth + 10;
          const badgeH = 16;
          const badgeX = Math.max(margin.left + 5, Math.min(w - margin.right - badgeW, lx - badgeW / 2));
          const badgeY = Math.max(margin.top + 2, ly - 22);

          // Badge background
          ctx.fillStyle = 'rgba(15, 20, 35, 0.95)';
          ctx.strokeStyle = curveColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
          ctx.fill(); ctx.stroke();

          // Badge text
          ctx.fillStyle = curveColor;
          ctx.textAlign = 'center';
          ctx.fillText(labelText, badgeX + badgeW / 2, badgeY + 11);
        }
      }

      animId = requestAnimationFrame(drawGraph);
    };

    animId = requestAnimationFrame(drawGraph);
    return () => cancelAnimationFrame(animId);
  }, [graphPath, activeTab, transType, getGraphAxes]);

  const handleTransTempChange = (newT: number) => {
    if (transType === 'isothermal') return;
    hasStartedGraphRef.current = true;
    setTemperature(newT);
  };

  const handleTransVolChange = (newVol: number) => {
    if (transType === 'isochoric' || transType === 'isobaric') return;
    hasStartedGraphRef.current = true;
    setVolume(newVol);
  };

  const clearGraph = () => {
    hasStartedGraphRef.current = false;
    let initT = temperature;
    let initV = volume;

    if (transType === 'isothermal') {
      initV = 20; // 2.0 L (min)
      setVolume(20);
    } else if (transType === 'isobaric' || transType === 'isochoric') {
      initT = 100; // 100 K (min)
      setTemperature(100);
    }

    const n = numParticles / 100;
    const V_L = volumeToLiters(initV);
    const V_m3 = V_L / 1000;
    const P = (n * R_CONSTANT * initT) / V_m3;
    transRefState.current = { P, V: V_L, T: initT };
    setGraphPath([]); // Zerado no reset
  };

  // =============================================
  // RENDER
  // =============================================

  const transConfigs = [
    { type: 'isothermal' as TransformationType, color: '#00f0ff' },
    { type: 'isobaric' as TransformationType, color: '#ff6b6b' },
    { type: 'isochoric' as TransformationType, color: '#4ecdc4' },
  ];

  const getConstantInfo = () => {
    const ref = transRefState.current;
    switch (transType) {
      case 'isothermal': return `T = ${temperature} K`;
      case 'isobaric': return `P = ${(ref.P / 1000).toFixed(1)} kPa`;
      case 'isochoric': return `V = ${volumeLiters.toFixed(1)} L`;
    }
  };

  const isTempFree = transType === 'isobaric' || transType === 'isochoric';
  const isVolFree = transType === 'isothermal';

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in-up font-sans">
      {/* Main visual container (particle sim + graph side-by-side in transformations) */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[300px] sm:min-h-[380px] bg-celestial-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Left section: Particle simulation (larger 2/3 share) */}
        <div className={`relative ${activeTab === 'transformations' ? 'w-full md:w-2/3 h-[280px] md:h-full' : 'w-full h-full'}`}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          />
        </div>

        {/* Right section inside container: Real-time Graph (floating card layout, larger height) */}
        {activeTab === 'transformations' && (
          <div className="relative w-full md:w-1/3 h-[240px] md:h-[310px] self-center my-auto p-3 bg-black/50 backdrop-blur-sm flex flex-col justify-between rounded-xl md:mr-3 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <BarChart3 size={13} className="text-purple-400 shrink-0" />
                <span className="text-[11px] font-bold font-mono text-purple-300 truncate">
                  {getGraphAxes().title}
                </span>
              </div>
              <button
                onClick={clearGraph}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-all shrink-0"
              >
                <Trash2 size={10} />
                Limpar
              </button>
            </div>
            <div className="relative flex-1 w-full h-full min-h-0 pt-1.5">
              <canvas
                ref={graphCanvasRef}
                className="absolute inset-0 w-full h-full rounded-lg"
              />
            </div>
          </div>
        )}

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
                <div className={`space-y-1 ${activeTab === 'transformations' && !isTempFree ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      {activeTab === 'transformations' && !isTempFree && <Lock size={10} />}
                      {t('gas.temperature')} (K)
                    </span>
                    <span className="text-white font-mono">{temperature} K</span>
                  </div>
                  <input type="range" min="100" max="800" step="10" value={temperature}
                    onChange={(e) => {
                      if (activeTab === 'transformations') handleTransTempChange(parseInt(e.target.value));
                      else setTemperature(parseInt(e.target.value));
                    }}
                    disabled={activeTab === 'transformations' && !isTempFree}
                    className="w-full accent-orange-400 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
                <div className={`space-y-1 ${activeTab === 'transformations' && !isVolFree ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      {activeTab === 'transformations' && !isVolFree && <Lock size={10} />}
                      {t('gas.volume')} (L)
                    </span>
                    <span className="text-white font-mono">{volumeLiters.toFixed(1)} L</span>
                  </div>
                  <input type="range" min="20" max="100" step="1" value={volume}
                    onChange={(e) => {
                      if (activeTab === 'transformations') handleTransVolChange(parseInt(e.target.value));
                      else setVolume(parseInt(e.target.value));
                    }}
                    disabled={activeTab === 'transformations' && !isVolFree}
                    className="w-full accent-blue-400 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
                <div className={`space-y-1 ${activeTab === 'transformations' ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      {activeTab === 'transformations' && <Lock size={10} />}
                      {t('gas.particles')} (n)
                    </span>
                    <span className="text-white font-mono">{numParticles}</span>
                  </div>
                  <input type="range" min="5" max="100" step="1" value={numParticles}
                    onChange={(e) => {
                      if (activeTab !== 'transformations') setNumParticles(parseInt(e.target.value));
                    }}
                    disabled={activeTab === 'transformations'}
                    className="w-full accent-emerald-400 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">{t('gas.pressure')}</span>
                  <span className="text-sm font-bold font-mono"
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
      <div className="w-full lg:w-96 space-y-5 p-6 bg-celestial-800/30 rounded-xl border border-white/10 backdrop-blur-sm h-fit font-sans">
        <h2 className="text-2xl font-bold tracking-tight text-celestial-accent">{t('gas.title')}</h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('lab')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${activeTab === 'lab'
              ? 'bg-celestial-accent/20 border-celestial-accent text-celestial-accent'
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
          >
            <FlaskConical size={13} />
            {t('gas.tab_lab')}
          </button>
          <button
            onClick={() => setActiveTab('transformations')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${activeTab === 'transformations'
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
          >
            <BarChart3 size={13} />
            {t('gas.tab_transformations')}
          </button>
        </div>

        {/* ============ LAB TAB ============ */}
        {activeTab === 'lab' && (
          <>
            {/* Formula */}
            <div className="p-4 bg-black/40 rounded-xl border border-celestial-500/30 text-center">
              <div className="text-lg font-mono font-bold text-celestial-accent tracking-wider">PV = nRT</div>
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
                <input type="range" min="100" max="800" step="10" value={temperature}
                  onChange={(e) => setTemperature(parseInt(e.target.value))}
                  className="w-full accent-orange-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-600"><span>100 K</span><span>800 K</span></div>
              </div>

              {/* Volume in Liters */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <label>{t('gas.volume')} (L)</label>
                  <span className="text-white font-mono">{volumeLiters.toFixed(1)} L</span>
                </div>
                <input type="range" min="20" max="100" step="1" value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full accent-blue-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-600"><span>2.0 L</span><span>10.0 L</span></div>
              </div>

              {/* Particles */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <label>{t('gas.particles')} (n)</label>
                  <span className="text-white font-mono">{numParticles}</span>
                </div>
                <input type="range" min="5" max="100" step="1" value={numParticles}
                  onChange={(e) => setNumParticles(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-600"><span>5</span><span>100</span></div>
              </div>
            </div>

            {/* Pressure only */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('gas.pressure')} (P)</span>
                <span className="text-lg font-bold font-mono"
                  style={{ color: `rgb(${Math.floor(30 + pressureNorm * 225)}, ${Math.floor(180 - pressureNorm * 140)}, ${Math.floor(255 - pressureNorm * 200)})` }}
                >
                  {pressureKPa.toFixed(1)} kPa
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pressureNorm * 100}%`,
                    background: 'linear-gradient(90deg, rgb(30,180,255), rgb(255,200,50), rgb(255,60,60))',
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ============ TRANSFORMATIONS TAB ============ */}
        {activeTab === 'transformations' && (
          <>
            {/* Type selector (clean text only, no icons) */}
            <div className="grid grid-cols-1 gap-2">
              {transConfigs.map(({ type, color }) => (
                <button
                  key={type}
                  onClick={() => setTransType(type)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${transType === type
                    ? 'bg-white/10 border-opacity-80'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  style={transType === type ? { borderColor: color, color } : {}}
                >
                  <div className="text-left">
                    <div className="text-xs font-bold">{t(`gas.trans_${type}`)}</div>
                    <div className="text-[10px] opacity-60 font-normal">{t(`gas.trans_${type}_desc`)}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Constant badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <Lock size={12} className="text-gray-400" />
              <span className="text-[10px] text-gray-300 font-mono">{getConstantInfo()} — {t('gas.trans_const')}</span>
            </div>

            {/* Temperature slider */}
            <div className={`space-y-1 ${!isTempFree ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <label className="flex items-center gap-1.5">
                  {!isTempFree && <Lock size={10} />}
                  {t('gas.temperature')} (K)
                </label>
                <span className="text-white font-mono">{temperature} K</span>
              </div>
              <input type="range" min="100" max="800" step="10" value={temperature}
                onChange={(e) => handleTransTempChange(parseInt(e.target.value))}
                disabled={!isTempFree}
                className="w-full accent-orange-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[9px] text-gray-600"><span>100 K</span><span>800 K</span></div>
            </div>

            {/* Volume slider */}
            <div className={`space-y-1 ${!isVolFree ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <label className="flex items-center gap-1.5">
                  {!isVolFree && <Lock size={10} />}
                  {t('gas.volume')} (L)
                </label>
                <span className="text-white font-mono">{volumeLiters.toFixed(1)} L</span>
              </div>
              <input type="range" min="20" max="100" step="1" value={volume}
                onChange={(e) => handleTransVolChange(parseInt(e.target.value))}
                disabled={!isVolFree}
                className="w-full accent-blue-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[9px] text-gray-600"><span>2.0 L</span><span>10.0 L</span></div>
            </div>

            {/* Current state readout */}
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('gas.pressure')} (P)</span>
                <span className="text-base font-bold font-mono"
                  style={{ color: `rgb(${Math.floor(30 + pressureNorm * 225)}, ${Math.floor(180 - pressureNorm * 140)}, ${Math.floor(255 - pressureNorm * 200)})` }}
                >
                  {pressureKPa.toFixed(1)} kPa
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pressureNorm * 100}%`,
                    background: 'linear-gradient(90deg, rgb(30,180,255), rgb(255,200,50), rgb(255,60,60))',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
