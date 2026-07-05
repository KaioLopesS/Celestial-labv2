import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Maximize, Minimize, Eye, EyeOff } from 'lucide-react';

type IndicatorType = 'BULB' | 'VOLTMETER';

export const FaradayLawSim: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  
  // Physics State Refs (bypassing React render loop for performance)
  const magnetPos = useRef({ x: 0, y: 0 }); 
  const prevFlux = useRef(0);
  const current = useRef(0); 
  const electronAngle = useRef(0); 
  
  // Interaction State
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // UI State for React
  const [displayCurrent, setDisplayCurrent] = useState(0);
  const [coilScale, setCoilScale] = useState(1.0);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [indicator, setIndicator] = useState<IndicatorType>('VOLTMETER');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const coilScaleRef = useRef(1.0);

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

  // Sync ref with state for animation loop
  useEffect(() => {
    coilScaleRef.current = coilScale;
  }, [coilScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let coilCenter = { x: 0, y: 0 };
    
    // Base Configs
    const baseRadiusX = 70;
    const baseRadiusY = 160;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
      
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      
      coilCenter = { x: w / 2 + 50, y: h / 2 };
      
      if (magnetPos.current.x === 0) {
          magnetPos.current = { 
              x: w / 2 + 300, 
              y: h / 2
          };
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // DYNAMIC GLOBAL VECTOR FIELD
    const drawGlobalField = (mx: number, my: number, w: number, h: number) => {
        const mw = 140;
        // North is Right (+), South is Left (-)
        const northPole = { x: mx + mw / 4, y: my };
        const southPole = { x: mx - mw / 4, y: my };
        
        const step = 45; 
        ctx.save();
        
        for (let x = step / 2; x < w; x += step) {
            for (let y = step / 2; y < h; y += step) {
                // Dipole approximation: B = k * ( r_hat_N/rN^2 - r_hat_S/rS^2 )
                const dxN = x - northPole.x;
                const dyN = y - northPole.y;
                const rN2 = dxN * dxN + dyN * dyN;
                const rN3 = Math.pow(rN2, 1.5) || 1;
                
                const dxS = x - southPole.x;
                const dyS = y - southPole.y;
                const rS2 = dxS * dxS + dyS * dyS;
                const rS3 = Math.pow(rS2, 1.5) || 1;
                
                const bx = (dxN / rN3) - (dxS / rS3);
                const by = (dyN / rN3) - (dyS / rS3);
                
                const angle = Math.atan2(by, bx);
                const mag = Math.sqrt(bx * bx + by * by);
                
                // Opacity based on field strength
                const alpha = Math.min(0.3, mag * 120000); 
                if (alpha < 0.01) continue;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                
                const lineLen = 15;
                const distToN = Math.sqrt(rN2);
                const distToS = Math.sqrt(rS2);
                const colorRatio = distToS / (distToN + distToS);
                
                ctx.beginPath();
                ctx.moveTo(-lineLen/2, 0);
                ctx.lineTo(lineLen/2, 0);
                
                ctx.strokeStyle = `rgba(${255 * (1 - colorRatio)}, ${200 * colorRatio}, ${255 * colorRatio}, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Arrow head
                ctx.beginPath();
                ctx.moveTo(lineLen/2, 0);
                ctx.lineTo(lineLen/2 - 4, -2.5);
                ctx.lineTo(lineLen/2 - 4, 2.5);
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fill();

                ctx.restore();
            }
        }
        ctx.restore();
    };

    const drawMagnet = (x: number, y: number) => {
        const w = 140;
        const h = 50;
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.fillStyle = '#05D9E8';
        ctx.fillRect(-w/2, -h/2, w/2, h);
        ctx.fillStyle = '#FF2A6D';
        ctx.fillRect(0, -h/2, w/2, h);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Cinzel';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText("S", -w/4, 0);
        ctx.fillText("N", w/4, 0);
        const grad = ctx.createLinearGradient(0, -h/2, 0, h/2);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.fillStyle = grad;
        ctx.fillRect(-w/2, -h/2, w, h);
        ctx.restore();
    };

    const drawVoltmeter = (cx: number, cy: number, currentVal: number) => {
        const w = 160;
        const h = 110;
        ctx.save();
        ctx.translate(cx, cy);

        // Case
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-w/2, -h/2, w, h, 12);
        ctx.fill();
        ctx.stroke();

        // Face
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(-w/2 + 10, -h/2 + 10, w - 20, h - 50, 6);
        ctx.fill();

        // Scale setup - Pivot lowered
        const pivotY = 35; 
        const radius = 65;

        // Scale Arc
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, pivotY, radius, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        // Ticks and Labels
        ctx.textAlign = 'center';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#475569';
        for(let i = -2; i <= 2; i++) {
            const angle = (Math.PI * 1.5) + (i * 0.4); 
            const tx = Math.cos(angle);
            const ty = Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(tx * (radius - 5), pivotY + ty * (radius - 5));
            ctx.lineTo(tx * radius, pivotY + ty * radius);
            ctx.stroke();
            const label = i === 0 ? "0" : (i > 0 ? "V+" : "-V");
            ctx.fillText(label, tx * (radius + 15), pivotY + ty * (radius + 15));
        }

        // Needle orientation pointing UP
        const needleAngle = (Math.PI * 1.5) + (currentVal * 0.4); 
        const clampedAngle = Math.max(Math.PI * 1.15, Math.min(Math.PI * 1.85, needleAngle));

        ctx.save();
        ctx.translate(0, pivotY);
        ctx.rotate(clampedAngle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius - 5, 0); 
        ctx.strokeStyle = '#FF2A6D';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Center hub
        ctx.beginPath();
        ctx.arc(0, pivotY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        ctx.restore();
    };

    const drawBulb = (cx: number, cy: number, currentVal: number) => {
        const socketY = cy - 40;
        const glassCenterY = cy + 15;
        const bulbRadius = 35;
        const intensity = Math.min(1, Math.abs(currentVal) * 1.5);
        ctx.fillStyle = '#444';
        ctx.fillRect(cx - 20, socketY, 40, 25);
        if (intensity > 0.01) {
            ctx.shadowBlur = 80 * intensity;
            ctx.shadowColor = '#FFD700'; 
        }
        ctx.fillStyle = `rgba(255, 255, ${200 - intensity * 50}, ${0.1 + intensity * 0.9})`;
        ctx.beginPath(); ctx.arc(cx, glassCenterY, bulbRadius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(cx - 10, socketY + 25);
        ctx.lineTo(cx - 10, glassCenterY - 5);
        ctx.lineTo(cx + 10, glassCenterY - 5); 
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + intensity})`;
        ctx.lineWidth = 2 + intensity * 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 10, glassCenterY - 5);
        ctx.lineTo(cx - 5, glassCenterY + 10);
        ctx.lineTo(cx, glassCenterY - 5);
        ctx.lineTo(cx + 5, glassCenterY + 10);
        ctx.lineTo(cx + 10, glassCenterY - 5);
        ctx.strokeStyle = intensity > 0.1 ? '#FFF' : '#555';
        ctx.stroke();
    };

    const draw = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const scale = coilScaleRef.current;
        const rX = baseRadiusX * scale;
        const rY = baseRadiusY * scale;

        ctx.clearRect(0, 0, w, h);

        const magnet = magnetPos.current;
        const dx = magnet.x - coilCenter.x;
        const dy = magnet.y - coilCenter.y;
        const distSq = dx*dx + dy*dy;
        
        const flux = (2500 * scale * scale) / (1 + distSq * 0.0003);
        const dPhi = flux - prevFlux.current;
        
        // SENSITIVITY LOGIC:
        // emfGain is overall scaling. 
        // We use a higher damping factor (0.95 instead of 0.9) to make the pointer feel "heavier" on slow moves.
        const emfGain = 0.22; 
        const emf = -dPhi * emfGain; 
        const targetCurrent = emf / 0.8;
        
        current.current = current.current * 0.92 + targetCurrent * 0.08; 
        prevFlux.current = flux;
        setDisplayCurrent(current.current);

        if (showFieldLines) {
            drawGlobalField(magnet.x, magnet.y, w, h);
        }

        // Draw Back Coil
        ctx.beginPath();
        ctx.ellipse(coilCenter.x, coilCenter.y, rX, rY, 0, Math.PI/2, 3*Math.PI/2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#553322';
        ctx.stroke();

        const indicatorX = coilCenter.x - 240;
        const indicatorY = coilCenter.y;
        const wireY = coilCenter.y + rY;

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        
        // Wires
        ctx.beginPath();
        ctx.moveTo(coilCenter.x - 15, wireY);
        ctx.lineTo(coilCenter.x - 15, wireY + 50);
        ctx.lineTo(indicatorX - 15, wireY + 50);
        ctx.lineTo(indicatorX - 15, indicatorY + (indicator === 'BULB' ? 0 : 45));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(coilCenter.x + 15, wireY);
        ctx.lineTo(coilCenter.x + 15, wireY + 65);
        ctx.lineTo(indicatorX + 15, wireY + 65);
        ctx.lineTo(indicatorX + 15, indicatorY + (indicator === 'BULB' ? 0 : 45));
        ctx.stroke();

        if (indicator === 'BULB') {
            drawBulb(indicatorX, indicatorY, current.current);
        } else {
            drawVoltmeter(indicatorX, indicatorY, current.current);
        }

        drawMagnet(magnet.x, magnet.y);

        // Front Coil
        ctx.beginPath();
        ctx.ellipse(coilCenter.x, coilCenter.y, rX, rY, 0, 3*Math.PI/2, Math.PI/2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#B87333';
        ctx.stroke();

        electronAngle.current += current.current * 0.2;
        ctx.fillStyle = current.current > 0 ? '#00F0FF' : '#FFD700';
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2 + electronAngle.current;
            const normAng = (ang % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            if (normAng > 4.71 || normAng < 1.57) {
                const ex = coilCenter.x + rX * Math.cos(normAng);
                const ey = coilCenter.y + rY * Math.sin(normAng);
                ctx.beginPath();
                ctx.arc(ex, ey, 4 + Math.min(3, Math.abs(current.current)*2), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showFieldLines, indicator]);

  const getPointerPos = (e: React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      const pos = getPointerPos(e);
      const mag = magnetPos.current;
      if (Math.abs(pos.x - mag.x) < 80 && Math.abs(pos.y - mag.y) < 40) {
          isDragging.current = true;
          dragOffset.current = { x: mag.x - pos.x, y: mag.y - pos.y };
          e.currentTarget.setPointerCapture(e.pointerId);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (isDragging.current) {
          const pos = getPointerPos(e);
          magnetPos.current = { 
            x: Math.max(50, Math.min(canvasRef.current!.clientWidth - 50, pos.x + dragOffset.current.x)), 
            y: Math.max(50, Math.min(canvasRef.current!.clientHeight - 50, pos.y + dragOffset.current.y))
          };
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      isDragging.current = false;
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
      </div>

      <div className="w-full lg:w-80 space-y-6 p-6 bg-celestial-800/30 rounded-xl border border-white/10 backdrop-blur-sm h-fit">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2 text-celestial-accent">{t('faraday.title')}</h2>
          <p className="text-xs text-gray-300 leading-relaxed text-justify">{t('faraday.text')}</p>
        </div>
        
        <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('faraday.indicator')}</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setIndicator('BULB')}
                        className={`py-2 text-[10px] font-bold uppercase rounded transition-all ${indicator === 'BULB' ? 'bg-celestial-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        {t('faraday.bulb')}
                    </button>
                    <button 
                        onClick={() => setIndicator('VOLTMETER')}
                        className={`py-2 text-[10px] font-bold uppercase rounded transition-all ${indicator === 'VOLTMETER' ? 'bg-celestial-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        {t('faraday.voltmeter')}
                    </button>
                </div>
            </div>

             <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('faraday.size')}</label>
                    <span className="text-xs font-mono text-celestial-accent">{coilScale.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="1.3" step="0.1" value={coilScale}
                  onChange={(e) => setCoilScale(parseFloat(e.target.value))}
                  className="w-full accent-celestial-accent h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            
            <div className="pt-2">
                 <label className="flex items-center justify-between cursor-pointer p-3 rounded bg-white/5 hover:bg-white/10 transition-colors group">
                   <span className="text-sm text-gray-300 font-bold group-hover:text-celestial-accent transition-colors">{t('faraday.show_lines')}</span>
                   <input type="checkbox" checked={showFieldLines} onChange={(e) => setShowFieldLines(e.target.checked)} className="accent-celestial-accent w-4 h-4"/>
                 </label>
            </div>
        </div>

        <div className="p-4 bg-black/40 rounded border border-white/5 space-y-3">
            <div className="font-serif text-lg text-center text-white border-b border-white/10 pb-2">ε = -dΦ/dt</div>
            <div className="text-[10px] text-gray-400 space-y-2">
                <div className="flex justify-between"><span>{t('faraday.lenz')}</span><span className="text-right text-yellow-300">{t('faraday.lenz_desc')}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/5"><span>{t('faraday.flux')}</span><span className="text-right text-gray-300">{t('faraday.area')}</span></div>
            </div>
        </div>

        <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('faraday.status')}</div>
            <div className={`p-3 rounded border text-center transition-colors ${Math.abs(displayCurrent) > 0.5 ? 'bg-celestial-500/20 border-celestial-accent' : 'bg-white/5 border-white/10'}`}>
                <div className="text-[10px] text-gray-400 mb-1">{t('faraday.current')}</div>
                <div className={`text-2xl font-mono font-bold ${Math.abs(displayCurrent) > 0.5 ? 'text-white' : 'text-gray-600'}`}>{Math.abs(displayCurrent).toFixed(2)} A</div>
                 <div className="text-[10px] mt-1 font-bold text-celestial-accent h-4">{Math.abs(displayCurrent) > 0.1 ? (displayCurrent > 0 ? t('faraday.cw') : t('faraday.ccw')) : ''}</div>
            </div>
        </div>
      </div>
    </div>
  );
};