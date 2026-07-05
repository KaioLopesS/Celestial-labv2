
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Maximize, Minimize, Eye, EyeOff } from 'lucide-react';

export const VectorFieldSim: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const { t } = useLanguage();
  const [is3D, setIs3D] = useState(false);

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
  

  // Equation State
  const [exprX, setExprX] = useState("-y");
  const [exprY, setExprY] = useState("x");
  const [exprZ, setExprZ] = useState("0"); // Componente Z (mantido no estado)
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 3D Rotation & Zoom State (Mantidos para reativação futura)
  const rotationRef = useRef({ x: 0.5, y: 0.5 });
  const zoomRef = useRef(40); 
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Hover Analysis State
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    z: number;
    div: number;
    curlMag?: number;
    curlZ?: number;
    vx: number;
    vy: number;
    vz: number;
  } | null>(null);

  // Compiled Functions
  const funcXRef = useRef<(x: number, y: number, z: number, t: number) => number>((x, y, z, t) => -y);
  const funcYRef = useRef<(x: number, y: number, z: number, t: number) => number>((x, y, z, t) => x);
  const funcZRef = useRef<(x: number, y: number, z: number, t: number) => number>((x, y, z, t) => 0);
  const timeRef = useRef(0);

  // Handle Zoom (Mantido para 3D futuro)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (is3D) {
        e.preventDefault();
        const delta = e.deltaY;
        const newZoom = zoomRef.current - delta * 0.05;
        zoomRef.current = Math.max(10, Math.min(newZoom, 150));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [is3D]);

  // Compile math expressions
  useEffect(() => {
    try {
      const createMathFunc = (expression: string) => {
        const body = `
          with (Math) {
            return (${expression});
          }
        `;
        return new Function('x', 'y', 'z', 't', body) as (x: number, y: number, z: number, t: number) => number;
      };

      const fx = createMathFunc(exprX);
      const fy = createMathFunc(exprY);
      const fz = createMathFunc(exprZ);
      
      fx(1, 1, 1, 0);
      fy(1, 1, 1, 0);
      fz(1, 1, 1, 0);

      funcXRef.current = fx;
      funcYRef.current = fy;
      funcZRef.current = fz;
      setIsValid(true);
      setErrorMessage("");
    } catch (e: any) {
      setIsValid(false);
      setErrorMessage(e.message || t('vec.error'));
    }
  }, [exprX, exprY, exprZ, t]);

  // Numerical Differentiation
  const analyzeField = (x: number, y: number, z: number) => {
    const h = 0.01;
    const t = timeRef.current;
    
    const P = funcXRef.current;
    const Q = funcYRef.current;
    const R = funcZRef.current;

    const vx = P(x, y, z, t);
    const vy = Q(x, y, z, t);
    const vz = R(x, y, z, t);

    const dPdx = (P(x + h, y, z, t) - P(x - h, y, z, t)) / (2 * h);
    const dQdy = (Q(x, y + h, z, t) - Q(x, y - h, z, t)) / (2 * h);
    const dRdz = (R(x, y, z + h, t) - R(x, y, z - h, t)) / (2 * h);

    const div = dPdx + dQdy + dRdz;

    if (is3D) {
      const dRdy = (R(x, y + h, z, t) - R(x, y - h, z, t)) / (2 * h);
      const dQdz = (Q(x, y, z + h, t) - Q(x, y, z - h, t)) / (2 * h);
      const cx = dRdy - dQdz;
      const dPdz = (P(x, y, z + h, t) - P(x, y, z - h, t)) / (2 * h);
      const dRdx = (R(x + h, y, z, t) - R(x - h, y, z, t)) / (2 * h);
      const cy = dPdz - dRdx;
      const dQdx = (Q(x + h, y, z, t) - Q(x - h, y, z, t)) / (2 * h);
      const dPdy = (P(x, y + h, z, t) - P(x, y - h, z, t)) / (2 * h);
      const cz = dQdx - dPdy;
      const curlMag = Math.sqrt(cx*cx + cy*cy + cz*cz);
      return { div, curlMag, vx, vy, vz };
    } else {
      const dQdx = (Q(x + h, y, z, t) - Q(x - h, y, z, t)) / (2 * h);
      const dPdy = (P(x, y + h, z, t) - P(x, y - h, z, t)) / (2 * h);
      const curlZ = dQdx - dPdy;
      return { div, curlZ, vx, vy, vz };
    }
  };

  // 3D Projection Helper (Mantido para futuro)
  const project = (x: number, y: number, z: number, w: number, h: number) => {
    const fov = 400;
    const rot = rotationRef.current;
    let x1 = x * Math.cos(rot.y) - z * Math.sin(rot.y);
    let z1 = x * Math.sin(rot.y) + z * Math.cos(rot.y);
    let y2 = y * Math.cos(rot.x) - z1 * Math.sin(rot.x);
    let z2 = y * Math.sin(rot.x) + z1 * Math.cos(rot.x);
    const scale = fov / (fov + z2 * 40 + 500);
    const zoom = zoomRef.current;
    const x2d = x1 * zoom * scale + w / 2;
    const y2d = y2 * zoom * scale + h / 2;
    return { x: x2d, y: y2d, scale, z: z2 };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (is3D) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (is3D && isDraggingRef.current) {
        const deltaX = e.clientX - lastMousePosRef.current.x;
        const deltaY = e.clientY - lastMousePosRef.current.y;
        rotationRef.current = {
            x: rotationRef.current.x + deltaY * 0.01,
            y: rotationRef.current.y + deltaX * 0.01
        };
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
    }

    if (!is3D) {
        const rect = canvas.getBoundingClientRect();
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const mathRange = 10;
        const scaleX = mathRange / w;
        const scaleY = mathRange / h;
        const centerX = w / 2;
        const centerY = h / 2;
        const x = (px - centerX) * scaleX;
        const y = -(py - centerY) * scaleY;

        if (x >= -6 && x <= 6 && y >= -6 && y <= 6) {
            const analysis = analyzeField(x, y, 0);
            setHoverInfo({ x, y, z: 0, ...analysis });
        } else {
            setHoverInfo(null);
        }
    } else {
        setHoverInfo(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!is3D) setHoverInfo(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      if (!ctx || !canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.fillStyle = is3D ? '#0B1026' : 'rgba(11, 16, 38, 0.2)'; 
      ctx.fillRect(0, 0, w, h);

      if (is3D) {
        // --- LÓGICA 3D (MANTIDA MAS INATIVA) ---
        const range = 4;
        const step = 1.5;
        const points = [];
        for (let x = -range; x <= range; x += step) {
            for (let y = -range; y <= range; y += step) {
                for (let z = -range; z <= range; z += step) {
                    let vx = 0, vy = 0, vz = 0;
                    try {
                        vx = funcXRef.current(x, y, z, t);
                        vy = funcYRef.current(x, y, z, t);
                        vz = funcZRef.current(x, y, z, t);
                    } catch { vx=0; vy=0; vz=0; }
                    const len = Math.hypot(vx, vy, vz);
                    const visualLen = Math.min(len * 0.4, 1.8);
                    const nx = len > 0.001 ? vx / len : 0;
                    const ny = len > 0.001 ? vy / len : 0;
                    const nz = len > 0.001 ? vz / len : 0;
                    const p1 = project(x, y, z, w, h);
                    const p2 = project(x + nx * visualLen, y + ny * visualLen, z + nz * visualLen, w, h);
                    const hue = ((x + y + z) * 20 + t * 20) % 360;
                    points.push({ p1, p2, zDepth: p1.z, hue });
                }
            }
        }
        points.sort((a, b) => b.zDepth - a.zDepth);
        points.forEach(pt => {
             const color = `hsl(${pt.hue}, 75%, 60%)`;
             ctx.strokeStyle = color;
             ctx.fillStyle = color;
             ctx.lineWidth = 3.0 * pt.p1.scale * (zoomRef.current / 40); 
             ctx.shadowBlur = 8;
             ctx.shadowColor = color;
             ctx.beginPath();
             ctx.moveTo(pt.p1.x, pt.p1.y);
             ctx.lineTo(pt.p2.x, pt.p2.y);
             ctx.stroke();
             const headLen = 8.0 * pt.p2.scale * (zoomRef.current / 40);
             const angle = Math.atan2(pt.p2.y - pt.p1.y, pt.p2.x - pt.p1.x);
             ctx.beginPath();
             ctx.moveTo(pt.p2.x, pt.p2.y);
             ctx.lineTo(pt.p2.x - headLen * Math.cos(angle - Math.PI / 6), pt.p2.y - headLen * Math.sin(angle - Math.PI / 6));
             ctx.lineTo(pt.p2.x - headLen * Math.cos(angle + Math.PI / 6), pt.p2.y - headLen * Math.sin(angle + Math.PI / 6));
             ctx.closePath();
             ctx.fill();
             ctx.shadowBlur = 0;
        });
      } else {
        // --- RENDERIZAÇÃO 2D ---
        const cols = 25;
        const rows = 20;
        const stepX = w / cols;
        const stepY = h / rows;
        const mathRange = 10;
        const scaleX = mathRange / w;
        const scaleY = mathRange / h;
        const centerX = w / 2;
        const centerY = h / 2;
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
            const px = i * stepX;
            const py = j * stepY;
            const x = (px - centerX) * scaleX;
            const y = -(py - centerY) * scaleY;
            let vx = 0, vy = 0;
            try {
                vx = funcXRef.current(x, y, 0, t);
                vy = funcYRef.current(x, y, 0, t);
            } catch { vx = 0; vy = 0; }
            const len = Math.hypot(vx, vy);
            const visualLen = Math.min(len * 5, 25);
            const nx = len > 0.001 ? vx / len : 0;
            const ny = len > 0.001 ? vy / len : 0;
            const endPx = px + nx * visualLen;
            const endPy = py - ny * visualLen;
            const angle = Math.atan2(ny, nx);
            const hue = ((angle * 180 / Math.PI) + t * 20) % 360;
            ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(endPx, endPy);
            ctx.stroke();
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.beginPath();
            ctx.arc(endPx, endPy, 1.5, 0, Math.PI * 2);
            ctx.fill();
            }
        }
      }

      t += 0.02; 
      timeRef.current = t;
      setTime(t);
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [is3D]);

  const preset = (name: string) => {
    switch(name) {
      case 'VORTEX': setExprX("-y"); setExprY("x"); setExprZ("0"); setIs3D(false); break;
      case 'SINK': setExprX("-x"); setExprY("-y"); setExprZ("0"); setIs3D(false); break;
      case 'WAVE': setExprX("sin(y + t)"); setExprY("cos(x + t)"); setExprZ("0"); setIs3D(false); break;
      // Presets 3D comentados para facilitar reativação
      // case 'SPIRAL_3D': setExprX("-y"); setExprY("x"); setExprZ("z/2"); setIs3D(true); break;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      <div 
        ref={containerRef}
        className={`flex-1 relative min-h-[280px] sm:min-h-[400px] bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl touch-none ${is3D ? 'cursor-move' : 'cursor-default'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas ref={canvasRef} className="w-full h-full absolute top-0 left-0 block" />
        
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

        {/* Legend */}
        {showLabels && (
          <div className="absolute top-4 left-4 text-xs font-mono text-celestial-accent bg-black/50 px-2 py-1 rounded">
            {t('Tempo')} = {time.toFixed(2)}
          </div>
        )}

        {/* Hover Info Overlay (Apenas 2D) */}
        {showLabels && hoverInfo && !is3D && (
            <div 
                className="absolute bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-lg shadow-2xl pointer-events-none z-10 space-y-2 min-w-[140px]"
                style={{ left: 20, bottom: 20 }}
            >
                <div className="text-[10px] text-gray-400 font-mono border-b border-white/10 pb-1 mb-1">
                    P({hoverInfo.x.toFixed(2)}, {hoverInfo.y.toFixed(2)})
                </div>
                
                <div className="flex justify-between items-center gap-4">
                    <span className="text-xs font-bold text-gray-300">Div (∇·F)</span>
                    <span className={`text-xs font-mono font-bold ${hoverInfo.div > 0.1 ? 'text-[#FF2A6D]' : hoverInfo.div < -0.1 ? 'text-[#05D9E8]' : 'text-white'}`}>
                        {hoverInfo.div.toFixed(2)}
                    </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <span className="text-xs font-bold text-gray-300">Rot (k)</span>
                    <span className={`text-xs font-mono font-bold ${Math.abs(hoverInfo.curlZ || 0) > 0.1 ? 'text-yellow-400' : 'text-white'}`}>
                        {hoverInfo.curlZ?.toFixed(2)}
                    </span>
                </div>
            </div>
        )}
      </div>

      <div className="w-full lg:w-96 space-y-6 p-6 bg-celestial-800/30 rounded-xl border border-white/10 backdrop-blur-sm h-fit flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-serif font-bold mb-2 text-celestial-accent">{t('vec.title')}</h2>
            <p className="text-sm text-gray-300 leading-relaxed">
               {t('vec.text')}
            </p>
          </div>
          {/* Botão de Toggle 3D removido da UI por solicitação, mas lógica preservada no código */}
        </div>

        {/* Custom Equation Inputs */}
        <div className="p-5 bg-black/40 rounded-xl border border-celestial-500/30 space-y-4 shadow-inner">
           
           {!isValid && (
             <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-500/30">
               ⚠ {errorMessage}
             </div>
           )}

           <div className="space-y-1">
             <label className="text-xs font-bold text-celestial-accent uppercase tracking-wider">{t('vec.vx')}</label>
             <div className="relative flex items-center">
               <span className="absolute left-3 text-gray-500 font-serif italic">î ·</span>
               <input 
                 type="text" 
                 value={exprX}
                 onChange={(e) => setExprX(e.target.value)}
                 className="w-full bg-celestial-900/80 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm font-mono text-white focus:border-celestial-accent focus:ring-1 focus:ring-celestial-accent outline-none transition-all"
                 placeholder="Ex: -y"
               />
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-xs font-bold text-celestial-accent uppercase tracking-wider">{t('vec.vy')}</label>
             <div className="relative flex items-center">
               <span className="absolute left-3 text-gray-500 font-serif italic">ĵ ·</span>
               <input 
                 type="text" 
                 value={exprY}
                 onChange={(e) => setExprY(e.target.value)}
                 className="w-full bg-celestial-900/80 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm font-mono text-white focus:border-celestial-accent focus:ring-1 focus:ring-celestial-accent outline-none transition-all"
                 placeholder="Ex: x"
               />
             </div>
           </div>

           {/* Input Vz oculto para simplificar UI 2D */}
        </div>

        {/* Mathematical Definitions Panel */}
        <div className="p-4 bg-celestial-900/50 rounded-lg border border-white/5 space-y-3 text-xs">
            <h3 className="font-bold text-gray-300 uppercase tracking-widest border-b border-white/10 pb-1">
                {t('vec.diff_2d')}
            </h3>
            
            <div className="space-y-2">
                <div className="flex items-start gap-2">
                    <div className="font-serif text-lg text-celestial-accent">∇·F</div>
                    <div>
                        <div className="font-bold text-gray-200">{t('vec.div')}</div>
                        <div className="font-mono text-gray-400 mt-1">
                            ∂Vx/∂x + ∂Vy/∂y
                        </div>
                    </div>
                </div>
                
                <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                    <div className="font-serif text-lg text-yellow-400">∇×F</div>
                    <div>
                        <div className="font-bold text-gray-200">{t('vec.curl')}</div>
                        <div className="font-mono text-gray-400 mt-1">
                             {t('vec.curl_scalar')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Presets - Apenas 2D visíveis */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('vec.examples')}</label>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => preset('VORTEX')} className="preset-btn font-serif">F = -y î + x ĵ </button>
            <button onClick={() => preset('SINK')} className="preset-btn font-serif">F = -x î - y ĵ </button>
            <button onClick={() => preset('WAVE')} className="preset-btn font-serif">F = sin(y+t)î + cos(x+t)ĵ</button>
          </div>
          <style>{`
            .preset-btn {
                padding: 0.5rem;
                background-color: rgba(255,255,255,0.05);
                border-radius: 0.25rem;
                text-align: left;
                font-size: 0.75rem;
                font-weight: bold;
                color: white;
                border: 1px solid transparent;
                transition: all 0.2s;
            }
            .preset-btn:hover {
                background-color: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.1);
                color: #00F0FF;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};
