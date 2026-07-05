
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Maximize, Minimize, Eye, EyeOff, Sliders } from 'lucide-react';

export const GradientSim: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for dynamic function 2D surface z = f(x,y)
  const [expression, setExpression] = useState("4 * exp(-(x^2 + y^2)/5)");
  const [error, setError] = useState("");
  const funcRef = useRef<(x: number, y: number) => number>((x, y) => 0);
  
  // Probe Position State (2D Domain)
  const [probe, setProbe] = useState({ x: 1, y: 1 });
  
  // Analysis State
  const [analysis, setAnalysis] = useState({ z: 0, dx: 0, dy: 0, mag: 0 });

  // UI States
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsControls, setShowFsControls] = useState(true);

  const { t } = useLanguage();
  
  // Navigation State
  const rotationRef = useRef({ x: 0.8, y: 0.6 });
  const zoomRef = useRef(70);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  interface Point3D { x: number; y: number; z: number; }

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

  // Compile Function on Change
  useEffect(() => {
    try {
        // Replace ^ with ** for JS evaluation
        const cleanExpression = expression.replace(/\^/g, '**');

        const body = `
            with (Math) {
                return (${cleanExpression});
            }
        `;
        const newFunc = new Function('x', 'y', body) as (x: number, y: number) => number;
        
        // Test execution
        const testVal = newFunc(1, 1);
        if (isNaN(testVal)) throw new Error("Result is NaN");
        
        funcRef.current = newFunc;
        setError("");
    } catch (e) {
        setError(t('grad.error'));
    }
  }, [expression, t]);

  // Update Analysis whenever probe or expression changes
  useEffect(() => {
      updateAnalysis(probe.x, probe.y);
  }, [probe, expression]);

  const updateAnalysis = (x: number, y: number) => {
      const h = 0.01;
      const f = funcRef.current;
      try {
        const z = f(x, y);
        const z_dx = f(x + h, y);
        const z_dx_neg = f(x - h, y);
        const z_dy = f(x, y + h);
        const z_dy_neg = f(x, y - h);
        
        const dx = (z_dx - z_dx_neg) / (2 * h);
        const dy = (z_dy - z_dy_neg) / (2 * h);
        const mag = Math.sqrt(dx * dx + dy * dy);
        
        setAnalysis({ z, dx, dy, mag });
      } catch (e) {
          // Ignore calc errors during render
      }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(30, Math.min(zoomRef.current - e.deltaY * 0.1, 150));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize);
    resize();

    const fov = 600;
    const project = (p: Point3D, w: number, h: number) => {
      const rot = rotationRef.current;
      // Standard isometric-ish rotation
      let x1 = p.x * Math.cos(rot.y) - p.z * Math.sin(rot.y);
      let z1 = p.x * Math.sin(rot.y) + p.z * Math.cos(rot.y);
      let y2 = p.y * Math.cos(rot.x) - z1 * Math.sin(rot.x);
      let z2 = p.y * Math.sin(rot.x) + z1 * Math.cos(rot.x);
      const scale = fov / (fov + z2 * 40 + 500);
      const x2d = x1 * zoomRef.current * scale + w / 2;
      const y2d = y2 * zoomRef.current * scale + h / 2;
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
        ctx.stroke();
    };

    const drawArrow = (start: Point3D, end: Point3D, color: string, width: number, w: number, h: number) => {
        const projStart = project(start, w, h);
        const projEnd = project(end, w, h);
        
        ctx.beginPath();
        ctx.moveTo(projStart.x, projStart.y);
        ctx.lineTo(projEnd.x, projEnd.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width * projStart.scale;
        
        // Shadow/Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Arrow Head
        const angle = Math.atan2(projEnd.y - projStart.y, projEnd.x - projStart.x);
        const headLen = 10 * projEnd.scale;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(projEnd.x, projEnd.y);
        ctx.lineTo(projEnd.x - headLen * Math.cos(angle - Math.PI/6), projEnd.y - headLen * Math.sin(angle - Math.PI/6));
        ctx.lineTo(projEnd.x - headLen * Math.cos(angle + Math.PI/6), projEnd.y - headLen * Math.sin(angle + Math.PI/6));
        ctx.fill();
    };

    // Helper to rotate a vector strictly by camera angles (for gizmo)
    const rotateVec = (vx: number, vy: number, vz: number) => {
        const rot = rotationRef.current;
        // 1. Rotate Y
        let x1 = vx * Math.cos(rot.y) - vz * Math.sin(rot.y);
        let z1 = vx * Math.sin(rot.y) + vz * Math.cos(rot.y);
        // 2. Rotate X
        let y2 = vy * Math.cos(rot.x) - z1 * Math.sin(rot.x);
        // We project to 2D flat for gizmo, ignoring perspective Z depth
        return { x: x1, y: y2 };
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const range = 4;
      const step = 0.5;
      const f = funcRef.current;
      const diffH = 0.01;

      // 1. Draw Mesh
      for (let x = -range; x <= range; x += step) {
        for (let y = -range; y <= range; y += step) {
            let z = 0, zNextX = 0, zNextY = 0;
            
            try {
                z = f(x, y);
                zNextX = f(x + step, y);
                zNextY = f(x, y + step);
            } catch { }

            // Map Math(x,y,z) to Graphics(x, -z, y) so Z is UP
            const p = { x: x, y: -z, z: y };
            const pNx = { x: x + step, y: -zNextX, z: y };
            const pNy = { x: x, y: -zNextY, z: y + step };

            if (x < range) drawLine(p, pNx, 'rgba(255, 255, 255, 0.2)', 1, w, h);
            if (y < range) drawLine(p, pNy, 'rgba(255, 255, 255, 0.2)', 1, w, h);
        }
      }

      // 2. Draw Interactive Probe and Gradient Vector
      const px = probe.x;
      const py = probe.y;
      
      let pz = 0;
      let dx = 0;
      let dy = 0;

      try {
          pz = f(px, py);
          const z_dx = f(px + diffH, py);
          const z_dx_neg = f(px - diffH, py);
          const z_dy = f(px, py + diffH);
          const z_dy_neg = f(px, py - diffH);
          dx = (z_dx - z_dx_neg) / (2 * diffH);
          dy = (z_dy - z_dy_neg) / (2 * diffH);
      } catch {}

      const origin = { x: px, y: -pz, z: py };
      
      // Draw Probe Point (White Sphere)
      const projOrigin = project(origin, w, h);
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 10;
      ctx.beginPath(); 
      ctx.arc(projOrigin.x, projOrigin.y, 4 * projOrigin.scale, 0, Math.PI*2); 
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Gradient Vector (Gold Arrow)
      const vecScale = 0.4;
      const rise = (dx*dx + dy*dy) * vecScale;
      
      const tip = {
          x: origin.x + dx * vecScale,
          y: origin.y - rise, 
          z: origin.z + dy * vecScale
      };
      
      const mag = Math.sqrt(dx*dx + dy*dy);
      if (mag > 0.01) {
        drawArrow(origin, tip, '#FFD700', 3, w, h);
      }

      // 3. Draw Axis Gizmo (Bottom Right) - Only if labels are shown
      if (showLabels) {
          const gizmoSize = 40;
          const cx = w - 60;
          const cy = h - 60;

          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Axis X (Red) - Math X, Graphic (1,0,0)
          const xVec = rotateVec(1, 0, 0);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + xVec.x * gizmoSize, cy + xVec.y * gizmoSize);
          ctx.strokeStyle = '#FF6B6B'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#FF6B6B'; ctx.fillText('X', cx + xVec.x * (gizmoSize + 12), cy + xVec.y * (gizmoSize + 12));

          // Axis Y (Green) - Math Y, Graphic Z (0,0,1)
          const yVec = rotateVec(0, 0, 1);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + yVec.x * gizmoSize, cy + yVec.y * gizmoSize);
          ctx.strokeStyle = '#4ECDC4'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#4ECDC4'; ctx.fillText('Y', cx + yVec.x * (gizmoSize + 12), cy + yVec.y * (gizmoSize + 12));

          // Axis Z (Blue) - Math Z, Graphic -Y (0,-1,0)
          const zVec = rotateVec(0, -1, 0);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + zVec.x * gizmoSize, cy + zVec.y * gizmoSize);
          ctx.strokeStyle = '#45B7D1'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#45B7D1'; ctx.fillText('Z', cx + zVec.x * (gizmoSize + 12), cy + zVec.y * (gizmoSize + 12));
      }

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrameId); };
  }, [expression, probe, showLabels]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    rotationRef.current = { x: rotationRef.current.x + deltaY * 0.01, y: rotationRef.current.y + deltaX * 0.01 };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const setPreset = (expr: string) => {
      setExpression(expr);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      <div 
        ref={containerRef}
        className="flex-1 relative min-h-[280px] sm:min-h-[500px] bg-black/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl cursor-move group touch-none"
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
      >
        <canvas ref={canvasRef} className="w-full h-full absolute top-0 left-0 block" />
        
        {/* Top Controls: Labels & Fullscreen */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
            {isFullscreen && (
               <button 
                  onClick={() => setShowFsControls(!showFsControls)}
                  className={`p-2 rounded-full border border-white/10 backdrop-blur-sm transition-all ${showFsControls ? 'bg-celestial-accent text-black' : 'bg-black/60 text-white/70 hover:text-white'}`}
                  title="Controles de Posição"
               >
                  <Sliders size={16} />
               </button>
            )}
            <button 
                onClick={() => setShowLabels(!showLabels)}
                className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white/70 hover:text-white border border-white/10 backdrop-blur-sm transition-all"
                title="Mostrar/Ocultar Rótulos"
            >
                {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button 
                onClick={toggleFullscreen}
                className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white/70 hover:text-white border border-white/10 backdrop-blur-sm transition-all"
                title="Tela Cheia"
            >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
        </div>

        {/* Fullscreen Controls Overlay (2D P) */}
        {isFullscreen && showFsControls && (
          <div className="absolute bottom-6 right-6 w-64 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl animate-fade-in-up z-50" onMouseDown={(e) => e.stopPropagation()}>
             <div className="text-xs font-bold text-celestial-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sliders size={12} />
                Controle de Posição
             </div>
             <div className="space-y-4">
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-gray-400">
                    <span>X</span> <span className="text-white font-mono">{probe.x.toFixed(1)}</span>
                 </div>
                 <input type="range" min="-3" max="3" step="0.1" value={probe.x} onChange={(e) => setProbe(p => ({...p, x: parseFloat(e.target.value)}))} className="w-full accent-celestial-accent h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
               </div>
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Y</span> <span className="text-white font-mono">{probe.y.toFixed(1)}</span>
                 </div>
                 <input type="range" min="-3" max="3" step="0.1" value={probe.y} onChange={(e) => setProbe(p => ({...p, y: parseFloat(e.target.value)}))} className="w-full accent-celestial-accent h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
               </div>
             </div>
          </div>
        )}

      </div>

      <div className="w-full lg:w-96 space-y-6 p-6 bg-celestial-800/30 rounded-xl border border-white/10 backdrop-blur-sm h-fit">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2 text-celestial-accent">{t('grad.title')}</h2>
          <p className="text-xs text-gray-300 leading-relaxed text-justify">
            {t('grad.intro')}
          </p>
        </div>

        {/* Input Section */}
        <div className="p-5 bg-black/40 rounded-xl border border-celestial-500/30 space-y-4 shadow-inner">
             {error && (
                 <div className="text-[10px] text-red-300 bg-red-900/20 p-2 rounded border border-red-500/20">
                     ⚠ {error}
                 </div>
             )}
             
             <div className="space-y-2">
                 <label className="text-xs font-bold text-celestial-accent uppercase tracking-wider">{t('grad.formula_label')}</label>
                 <div className="relative flex items-center">
                    <span className="absolute left-3 text-gray-500 font-serif italic text-xs">z =</span>
                    <input 
                        type="text" 
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        className="w-full bg-celestial-900/80 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs font-mono text-white focus:border-celestial-accent focus:ring-1 focus:ring-celestial-accent outline-none transition-all"
                    />
                 </div>
             </div>

             <div className="grid grid-cols-3 gap-2">
                 <button onClick={() => setPreset("4 * exp(-(x^2 + y^2)/5)")} className="preset-btn">{t('grad.hill')}</button>
                 <button onClick={() => setPreset("(x^2 - y^2)/4")} className="preset-btn">{t('grad.saddle')}</button>
                 <button onClick={() => setPreset("sqrt(x^2 + y^2)")} className="preset-btn text-celestial-accent border-celestial-accent/50">{t('grad.cone')}</button>
             </div>
             <style>{`
                .preset-btn {
                    padding: 6px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px;
                    font-size: 10px;
                    color: #aaa;
                    transition: all 0.2s;
                }
                .preset-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border-color: rgba(255,255,255,0.2);
                }
             `}</style>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <label>{t('grad.pos_x')}</label>
                    <span className="text-white font-mono">{probe.x.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="-3" max="3" step="0.1" value={probe.x}
                    onChange={(e) => setProbe(prev => ({...prev, x: parseFloat(e.target.value)}))}
                    className="w-full accent-celestial-accent h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <label>{t('grad.pos_y')}</label>
                    <span className="text-white font-mono">{probe.y.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="-3" max="3" step="0.1" value={probe.y}
                    onChange={(e) => setProbe(prev => ({...prev, y: parseFloat(e.target.value)}))}
                    className="w-full accent-celestial-accent h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>

        {/* Analysis Panel */}
        <div className="p-5 bg-black/40 rounded-xl border border-white/5 space-y-4">
             <div className="flex justify-between items-center border-b border-white/10 pb-2">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t('grad.analysis_at').replace('P', `P(${probe.x.toFixed(1)}, ${probe.y.toFixed(1)})`)}
                 </span>
             </div>
             
             <div className="space-y-3 font-mono text-xs">
                 <div className="flex items-center justify-between">
                     <span className="text-celestial-accent font-bold">∇f (Vetor)</span>
                     <span className="text-white">&lt; {analysis.dx.toFixed(2)}, {analysis.dy.toFixed(2)} &gt;</span>
                 </div>
                 
                 <div className="p-3 bg-white/5 rounded border border-white/5 space-y-2">
                     <div className="flex justify-between items-center">
                         <span className="text-gray-400">∂f/∂x</span>
                         <span className="text-red-300">{analysis.dx.toFixed(3)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-gray-400">∂f/∂y</span>
                         <span className="text-blue-300">{analysis.dy.toFixed(3)}</span>
                     </div>
                 </div>

                 <div className="flex items-center justify-between pt-2 border-t border-white/5">
                     <span className="text-yellow-400 font-bold">{t('grad.magnitude_label')}</span>
                     <span className="text-xl text-white font-bold">{analysis.mag.toFixed(3)}</span>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};
