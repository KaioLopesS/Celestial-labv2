import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Maximize, Minimize, Eye, EyeOff } from 'lucide-react';

export const ElectromagneticWave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [frequency, setFrequency] = useState(0.1);
  const [amplitude, setAmplitude] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const { t } = useLanguage();

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
  
  // We use refs for rotation to prevent re-triggering the useEffect loop on every mouse move
  const rotationRef = useRef({ x: -0.4, y: 0.6 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // 3D Point Structure
  interface Point3D {
    x: number;
    y: number;
    z: number;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      // Handle High DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize);
    resize();

    // Projection parameters
    const fov = 400;
    
    // Project 3D point to 2D canvas coordinates
    const project = (p: Point3D, w: number, h: number) => {
      const rot = rotationRef.current;
      
      // Rotate Y (Horizontal rotation)
      let x1 = p.x * Math.cos(rot.y) - p.z * Math.sin(rot.y);
      let z1 = p.x * Math.sin(rot.y) + p.z * Math.cos(rot.y);
      
      // Rotate X (Vertical tilt)
      let y2 = p.y * Math.cos(rot.x) - z1 * Math.sin(rot.x);
      let z2 = p.y * Math.sin(rot.x) + z1 * Math.cos(rot.x);
      
      // Perspective projection
      const scale = fov / (fov + z2 * 50 + 400);
      const x2d = x1 * 40 * scale + w / 2;
      const y2d = y2 * 40 * scale + h / 2;
      
      return { x: x2d, y: y2d, scale, z: z2 };
    };

    const drawLine = (p1: Point3D, p2: Point3D, color: string, width: number, w: number, h: number) => {
      const proj1 = project(p1, w, h);
      const proj2 = project(p2, w, h);
      
      ctx.beginPath();
      ctx.moveTo(proj1.x, proj1.y);
      ctx.lineTo(proj2.x, proj2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width * proj1.scale;
      // Simple depth fading
      ctx.globalAlpha = Math.min(1, Math.max(0.1, 1 - (proj1.z + 5)/20)); 
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      if (!ctx || !canvas) return;
      // We need logical width/height for calculations
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      
      ctx.clearRect(0, 0, w, h);
      
      const axisLength = 12;
      // Axes
      // X Axis (Propagation Direction)
      drawLine({x: -axisLength, y: 0, z: 0}, {x: axisLength, y: 0, z: 0}, 'rgba(255,255,255,0.3)', 2, w, h);
      
      // E-Field Axis Label Helper (Y-axis)
      drawLine({x: 0, y: -6, z: 0}, {x: 0, y: 6, z: 0}, 'rgba(255, 42, 109, 0.1)', 1, w, h);
      
      // B-Field Axis Label Helper (Z-axis)
      drawLine({x: 0, y: 0, z: -6}, {x: 0, y: 0, z: 6}, 'rgba(5, 217, 232, 0.1)', 1, w, h);

      // Wave Parameters
      const pointsCount = 120;
      const spacing = (axisLength * 1.8) / pointsCount;
      const startX = -axisLength * 0.9;
      const k = 1; // Wave number
      
      let prevE: Point3D | null = null;
      let prevB: Point3D | null = null;
      let prevAxis: Point3D | null = null;

      for (let i = 0; i < pointsCount; i++) {
        const x = startX + i * spacing;
        // Moving wave equation: sin(kx - wt)
        const phase = k * x - time;
        
        // Electric Field (E) oscillates in Y
        const yE = Math.sin(phase) * amplitude;
        const pE: Point3D = { x, y: yE, z: 0 };
        
        // Magnetic Field (B) oscillates in Z
        const zB = Math.sin(phase) * amplitude;
        const pB: Point3D = { x, y: 0, z: zB };
        
        const pAxis: Point3D = { x, y: 0, z: 0 };

        // Draw Continuous Waves
        if (prevE) {
          drawLine(prevE, pE, '#FF2A6D', 3, w, h); // Pink for E
        }
        if (prevB) {
          drawLine(prevB, pB, '#05D9E8', 3, w, h); // Cyan for B
        }
        
        // Draw Field Vectors (Arrows) periodically
        if (i % 5 === 0) {
             // E-Field Vector
             drawLine(pAxis, pE, 'rgba(255, 42, 109, 0.4)', 1, w, h);
             const projE = project(pE, w, h);
             ctx.fillStyle = '#FF2A6D';
             ctx.beginPath();
             ctx.arc(projE.x, projE.y, 2 * projE.scale, 0, Math.PI * 2);
             ctx.fill();

             // B-Field Vector
             drawLine(pAxis, pB, 'rgba(5, 217, 232, 0.4)', 1, w, h);
             const projB = project(pB, w, h);
             ctx.fillStyle = '#05D9E8';
             ctx.beginPath();
             ctx.arc(projB.x, projB.y, 2 * projB.scale, 0, Math.PI * 2);
             ctx.fill();
        }
        
        prevE = pE;
        prevB = pB;
        prevAxis = pAxis;
      }

      time += frequency;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [frequency, amplitude]); // Rotation is handled via Ref, so it doesn't trigger re-render loop reset

  // Pointer Interaction Handlers (Works for both mouse and touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    
    rotationRef.current = {
      x: rotationRef.current.x + deltaY * 0.01,
      y: rotationRef.current.y + deltaX * 0.01
    };
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      <div 
        ref={containerRef}
        className="flex-1 relative min-h-[280px] sm:min-h-[500px] bg-black/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl cursor-move touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full absolute top-0 left-0 block" 
        />
        
        {/* Toolbar */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
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

        {/* Overlay UI */}
        {showLabels && (
          <>
            <div className="absolute bottom-4 right-4 bg-black/60 p-3 rounded border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-[#FF2A6D] rounded-full shadow-[0_0_8px_#FF2A6D]"></div>
                <span className="text-xs text-white font-mono">{t('em.efield')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#05D9E8] rounded-full shadow-[0_0_8px_#05D9E8]"></div>
                <span className="text-xs text-white font-mono">{t('em.bfield')}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls Panel */}
      <div className="w-full lg:w-80 space-y-6 p-6 bg-celestial-800/30 rounded-xl border border-white/10 backdrop-blur-sm h-fit">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2 text-celestial-accent">{t('em.title')}</h2>
          <p className="text-sm text-gray-300 leading-relaxed text-justify">
            {t('em.text')} 
            <span className="text-[#FF2A6D] font-bold"> {t('em.text_e')} </span> 
             e 
            <span className="text-[#05D9E8] font-bold"> {t('em.text_b')} </span> 
            {t('em.text_end')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('em.freq')}</label>
              <span className="text-xs font-mono text-celestial-accent">{frequency.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0.02" 
              max="0.4" 
              step="0.01"
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              className="w-full accent-celestial-accent h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('em.amp')}</label>
              <span className="text-xs font-mono text-celestial-accent">{amplitude.toFixed(1)}</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="4.0" 
              step="0.1"
              value={amplitude}
              onChange={(e) => setAmplitude(parseFloat(e.target.value))}
              className="w-full accent-celestial-accent h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="p-4 bg-blue-900/30 rounded border border-blue-500/30 text-xs text-blue-100 leading-5">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {t('em.maxwell')}
            </h4>
            {t('em.maxwell_desc')}
          </div>
        </div>
      </div>
    </div>
  );
};
