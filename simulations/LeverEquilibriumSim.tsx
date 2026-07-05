
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { Maximize, Minimize, RotateCcw, Plus, Trash2, Trophy, FlaskConical, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface Weight {
  id: number;
  mass: number; // kg or grams depending on mode
  position: number; // distance from fulcrum (-1 to 1, negative = left)
  color: string;
  label?: string; // visual label e.g. "10¢"
}

type Mode = 'free' | 'challenge_a' | 'challenge_b';

const WEIGHT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F97316',
  '#34D399', '#F472B6', '#60A5FA', '#FBBF24', '#C084FC',
];

// Coin masses in grams
const COIN_10_MASS = 4.8; // 10 centavos ~4.8g
const COIN_50_MASS = 7.81; // 50 centavos ~7.81g

let nextId = 1;

export const LeverEquilibriumSim: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const angleRef = useRef(0);
  const angularVelRef = useRef(0);

  const [mode, setMode] = useState<Mode>('free');
  const [weights, setWeights] = useState<Weight[]>([
    { id: nextId++, mass: 3, position: -0.5, color: WEIGHT_COLORS[0] },
    { id: nextId++, mass: 3, position: 0.5, color: WEIGHT_COLORS[1] },
  ]);
  const [selectedMass, setSelectedMass] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [draggingWeight, setDraggingWeight] = useState<number | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  const { t } = useLanguage();

  // Fixed fulcrum at center
  const fulcrumPos = 50;

  // Use grams for coin challenges, kg for free mode
  const massUnit = mode === 'free' ? 'kg' : 'g';
  const gravityFactor = mode === 'free' ? 9.81 : 0.00981; // scale for grams

  // Torque calculations
  const torqueLeft = weights
    .filter(w => w.position < 0)
    .reduce((sum, w) => sum + w.mass * gravityFactor * Math.abs(w.position), 0);

  const torqueRight = weights
    .filter(w => w.position > 0)
    .reduce((sum, w) => sum + w.mass * gravityFactor * Math.abs(w.position), 0);

  const netTorque = torqueRight - torqueLeft;
  const isBalanced = Math.abs(netTorque) < (mode === 'free' ? 0.5 : 0.001);

  // Check challenge completion
  useEffect(() => {
    if (mode === 'free') {
      setChallengeCompleted(false);
      return;
    }
    const leftCount = weights.filter(w => w.position < 0).length;
    const rightCount = weights.filter(w => w.position > 0).length;
    const hasDifferentCounts = leftCount > 0 && rightCount > 0 && leftCount !== rightCount;
    setChallengeCompleted(isBalanced && hasDifferentCounts);
  }, [weights, isBalanced, mode]);

  // Fullscreen
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

  const addWeight = (side: 'left' | 'right') => {
    const pos = side === 'left' ? -(0.3 + Math.random() * 0.5) : (0.3 + Math.random() * 0.5);
    const mass = mode === 'free' ? selectedMass : (mode === 'challenge_a' ? COIN_10_MASS : COIN_50_MASS);
    const label = mode === 'free' ? undefined : (mode === 'challenge_a' ? '10¢' : '50¢');
    const color = mode === 'free'
      ? WEIGHT_COLORS[weights.length % WEIGHT_COLORS.length]
      : (mode === 'challenge_a' ? '#D4A844' : '#C0C0C0');
    
    setWeights(prev => [...prev, {
      id: nextId++,
      mass,
      position: pos,
      color,
      label,
    }]);
  };

  const removeWeight = (id: number) => {
    setWeights(prev => prev.filter(w => w.id !== id));
  };

  const clearAll = () => {
    setWeights([]);
    angleRef.current = 0;
    angularVelRef.current = 0;
    setChallengeCompleted(false);
  };

  const handleReset = () => {
    nextId = 1;
    if (mode === 'free') {
      setWeights([
        { id: nextId++, mass: 3, position: -0.5, color: WEIGHT_COLORS[0] },
        { id: nextId++, mass: 3, position: 0.5, color: WEIGHT_COLORS[1] },
      ]);
      setSelectedMass(3);
    } else {
      setWeights([]);
    }
    angleRef.current = 0;
    angularVelRef.current = 0;
    setChallengeCompleted(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    nextId = 1;
    angleRef.current = 0;
    angularVelRef.current = 0;
    setChallengeCompleted(false);
    if (newMode === 'free') {
      setWeights([
        { id: nextId++, mass: 3, position: -0.5, color: WEIGHT_COLORS[0] },
        { id: nextId++, mass: 3, position: 0.5, color: WEIGHT_COLORS[1] },
      ]);
    } else {
      setWeights([]);
    }
  };

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

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Physics: angular acceleration from net torque
      const gFactor = mode === 'free' ? 9.81 : 0.00981;
      const totalMoment = weights.reduce((sum, wt) => sum + wt.mass * wt.position * wt.position, 0) + (mode === 'free' ? 0.5 : 50);
      const torqueNet = weights.reduce((sum, wt) => sum + wt.mass * gFactor * wt.position, 0);
      
      // Gravitational restoring torque
      const restoringTorque = -angleRef.current * 8.0;
      
      // Apply angular acceleration with damping
      const angAccel = (torqueNet + restoringTorque) / (totalMoment * 50);
      angularVelRef.current += angAccel;
      angularVelRef.current *= 0.92;

      // Snap to zero when nearly still and balanced
      if (Math.abs(angularVelRef.current) < 0.0005 && Math.abs(angleRef.current) < 0.005 && Math.abs(torqueNet) < (mode === 'free' ? 0.5 : 0.001)) {
        angularVelRef.current = 0;
        angleRef.current = 0;
      }

      angleRef.current += angularVelRef.current;

      // Clamp angle
      const maxAngle = Math.PI / 6;
      if (angleRef.current > maxAngle) {
        angleRef.current = maxAngle;
        angularVelRef.current *= -0.3;
      }
      if (angleRef.current < -maxAngle) {
        angleRef.current = -maxAngle;
        angularVelRef.current *= -0.3;
      }

      const angle = angleRef.current;

      // Dimensions
      const leverLength = Math.min(w * (w < 640 ? 0.88 : 0.75), 600);
      const fulcrumX = w * (fulcrumPos / 100);
      const fulcrumY = h * 0.55;
      const triangleHeight = 50;

      // ======= DRAW GROUND =======
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, fulcrumY + triangleHeight + 5, w, h - fulcrumY - triangleHeight);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, fulcrumY + triangleHeight + 5);
      ctx.lineTo(w, fulcrumY + triangleHeight + 5);
      ctx.stroke();

      // ======= DRAW FULCRUM (Triangle) =======
      const triW = 36;
      ctx.save();
      
      const isEquil = Math.abs(angle) < 0.02 && isBalanced;
      const fulcrumGlowColor = isEquil ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.2)';
      ctx.shadowColor = fulcrumGlowColor;
      ctx.shadowBlur = 20;
      
      const triGrad = ctx.createLinearGradient(fulcrumX, fulcrumY, fulcrumX, fulcrumY + triangleHeight);
      triGrad.addColorStop(0, isEquil ? '#34D399' : '#FBBF24');
      triGrad.addColorStop(1, isEquil ? '#059669' : '#D97706');
      ctx.fillStyle = triGrad;
      ctx.beginPath();
      ctx.moveTo(fulcrumX, fulcrumY);
      ctx.lineTo(fulcrumX - triW / 2, fulcrumY + triangleHeight);
      ctx.lineTo(fulcrumX + triW / 2, fulcrumY + triangleHeight);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // ======= DRAW LEVER BAR =======
      ctx.save();
      ctx.translate(fulcrumX, fulcrumY);
      ctx.rotate(angle);

      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;

      const barGrad = ctx.createLinearGradient(-leverLength / 2, -6, -leverLength / 2, 6);
      barGrad.addColorStop(0, 'rgba(200, 210, 230, 0.9)');
      barGrad.addColorStop(0.5, 'rgba(160, 175, 200, 0.8)');
      barGrad.addColorStop(1, 'rgba(120, 135, 160, 0.7)');
      ctx.fillStyle = barGrad;
      
      const barH = 10;
      const barRadius = 5;
      ctx.beginPath();
      ctx.moveTo(-leverLength / 2 + barRadius, -barH / 2);
      ctx.lineTo(leverLength / 2 - barRadius, -barH / 2);
      ctx.arcTo(leverLength / 2, -barH / 2, leverLength / 2, barH / 2, barRadius);
      ctx.lineTo(leverLength / 2, barH / 2);
      ctx.arcTo(leverLength / 2, barH / 2, -leverLength / 2, barH / 2, barRadius);
      ctx.lineTo(-leverLength / 2 + barRadius, barH / 2);
      ctx.arcTo(-leverLength / 2, barH / 2, -leverLength / 2, -barH / 2, barRadius);
      ctx.lineTo(-leverLength / 2, -barH / 2 + barRadius);
      ctx.arcTo(-leverLength / 2, -barH / 2, -leverLength / 2 + barRadius, -barH / 2, barRadius);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Distance markers on bar
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      for (let d = -1; d <= 1; d += 0.1) {
        const mx = d * (leverLength / 2);
        ctx.beginPath();
        ctx.moveTo(mx, -barH / 2);
        ctx.lineTo(mx, barH / 2);
        ctx.lineWidth = Math.abs(d) < 0.01 ? 2 : 0.5;
        ctx.stroke();
      }

      // Center dot
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // ======= DRAW WEIGHTS ON BAR =======
      for (const wt of weights) {
        const wx = wt.position * (leverLength / 2);
        const isCoin = mode !== 'free';

        if (isCoin) {
          // Draw coin as circle
          const coinRadius = 14;

          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;

          // Coin body
          const coinGrad = ctx.createRadialGradient(wx - 2, -barH / 2 - coinRadius - 2, 0, wx, -barH / 2 - coinRadius, coinRadius);
          coinGrad.addColorStop(0, mode === 'challenge_a' ? '#F5D060' : '#E8E8E8');
          coinGrad.addColorStop(1, wt.color);
          ctx.fillStyle = coinGrad;
          ctx.beginPath();
          ctx.arc(wx, -barH / 2 - coinRadius, coinRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Coin border
          ctx.strokeStyle = mode === 'challenge_a' ? 'rgba(180, 140, 40, 0.6)' : 'rgba(160, 160, 160, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner ring
          ctx.strokeStyle = mode === 'challenge_a' ? 'rgba(180, 140, 40, 0.3)' : 'rgba(160, 160, 160, 0.3)';
          ctx.beginPath();
          ctx.arc(wx, -barH / 2 - coinRadius, coinRadius - 3, 0, Math.PI * 2);
          ctx.stroke();

          // Coin label
          ctx.fillStyle = mode === 'challenge_a' ? '#8B6914' : '#555';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(wt.label || '', wx, -barH / 2 - coinRadius);
        } else {
          // Draw weight as rectangle (original)
          const weightSize = 16 + wt.mass * 3;

          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 3;

          const wtGrad = ctx.createLinearGradient(wx, -barH / 2 - weightSize, wx, -barH / 2);
          wtGrad.addColorStop(0, wt.color);
          wtGrad.addColorStop(1, adjustColor(wt.color, -40));
          ctx.fillStyle = wtGrad;

          const wtW = weightSize;
          const wtH = weightSize;
          const wtY = -barH / 2 - wtH;
          const wr = 4;
          ctx.beginPath();
          ctx.moveTo(wx - wtW / 2 + wr, wtY);
          ctx.lineTo(wx + wtW / 2 - wr, wtY);
          ctx.arcTo(wx + wtW / 2, wtY, wx + wtW / 2, wtY + wtH, wr);
          ctx.lineTo(wx + wtW / 2, wtY + wtH);
          ctx.lineTo(wx - wtW / 2, wtY + wtH);
          ctx.arcTo(wx - wtW / 2, wtY, wx - wtW / 2 + wr, wtY, wr);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = 'white';
          ctx.font = `bold ${Math.max(10, 12)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${wt.mass}`, wx, wtY + wtH / 2);
          
          ctx.font = '8px sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText('kg', wx, wtY + wtH / 2 + 10);
        }

        // Distance indicator line
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(wx, barH / 2 + 5);
        ctx.lineTo(wx, barH / 2 + 20);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Distance label
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${Math.abs(wt.position).toFixed(2)}m`, wx, barH / 2 + 22);
      }

      ctx.restore();

      // ======= EQUILIBRIUM INDICATOR =======
      const indicatorY = 40;
      ctx.textAlign = 'center';
      
      if (isBalanced && Math.abs(angle) < 0.02) {
        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('✓ ' + t('lever.balanced'), w / 2, indicatorY);
      } else {
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 14px sans-serif';
        const arrow = netTorque > 0 ? '→' : '←';
        ctx.fillText(`${arrow} ${t('lever.unbalanced')}`, w / 2, indicatorY);
      }

      // Angle indicator
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px monospace';
      ctx.fillText(`θ = ${(angle * 180 / Math.PI).toFixed(1)}°`, w / 2, indicatorY + 18);

      // Challenge success banner
      if (challengeCompleted && mode !== 'free') {
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(w / 2 - 160, indicatorY + 30, 320, 36);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(w / 2 - 160, indicatorY + 30, 320, 36);
        
        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🏆 ' + t('lever.challenge_success'), w / 2, indicatorY + 52);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [weights, fulcrumPos, isBalanced, netTorque, mode, challengeCompleted, t]);

  // Drag weights on canvas
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
      const { x, w: canvasW } = getCanvasPos(e);
      const leverLength = Math.min(canvasW * 0.75, 600);
      const fulcrumX = canvasW * (fulcrumPos / 100);

      let closest: number | null = null;
      let closestDist = 30;
      for (const wt of weights) {
        const wx = fulcrumX + wt.position * (leverLength / 2);
        const dist = Math.abs(x - wx);
        if (dist < closestDist) {
          closestDist = dist;
          closest = wt.id;
        }
      }
      if (closest !== null) {
        setDraggingWeight(closest);
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (draggingWeight === null) return;
      e.preventDefault();
      const { x, w: canvasW } = getCanvasPos(e);
      const leverLength = Math.min(canvasW * (canvasW < 640 ? 0.88 : 0.75), 600);
      const fulcrumX = canvasW * (fulcrumPos / 100);
      
      let newPos = (x - fulcrumX) / (leverLength / 2);
      newPos = Math.max(-0.95, Math.min(0.95, newPos));

      setWeights(prev => prev.map(wt =>
        wt.id === draggingWeight ? { ...wt, position: newPos } : wt
      ));
    };

    const handleUp = () => {
      setDraggingWeight(null);
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
  }, [weights, draggingWeight, fulcrumPos]);

  // Count coins per side for challenge
  const leftCount = weights.filter(w => w.position < 0).length;
  const rightCount = weights.filter(w => w.position > 0).length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in-up">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[280px] sm:min-h-[380px] bg-celestial-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ cursor: draggingWeight !== null ? 'grabbing' : 'grab' }}
        />

        {/* Toolbar */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
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
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-96 space-y-5 p-6 bg-celestial-800/30 rounded-xl border border-white/10 backdrop-blur-sm h-fit">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2 text-celestial-accent">{t('lever.title')}</h2>
          <p className="text-xs text-gray-300 leading-relaxed text-justify">
            {mode === 'free' ? t('lever.intro') : t('lever.challenge_intro')}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => switchMode('free')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
              mode === 'free'
                ? 'bg-celestial-accent/20 border-celestial-accent text-celestial-accent'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <FlaskConical size={13} />
            {t('lever.mode_free')}
          </button>
          <button
            onClick={() => switchMode('challenge_a')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
              mode === 'challenge_a'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Trophy size={13} />
            {t('lever.challenge_a_tab')}
          </button>
          <button
            onClick={() => switchMode('challenge_b')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
              mode === 'challenge_b'
                ? 'bg-gray-400/20 border-gray-400 text-gray-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Trophy size={13} />
            {t('lever.challenge_b_tab')}
          </button>
        </div>

        {/* Formula */}
        <div className="p-4 bg-black/40 rounded-xl border border-celestial-500/30 text-center">
          <div className="text-lg font-mono font-bold text-celestial-accent tracking-wider">
            τ = F × d
          </div>
          <div className="text-[10px] text-gray-500 mt-1">{t('lever.formula_desc')}</div>
        </div>

        {/* ============ FREE MODE CONTROLS ============ */}
        {mode === 'free' && (
          <>
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('lever.add_weight')}</div>

              <div className="flex gap-2">
                {[1, 2, 3, 5, 8].map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMass(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      selectedMass === m
                        ? 'bg-celestial-accent/20 border-celestial-accent text-celestial-accent'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {m} kg
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addWeight('left')}
                  className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs font-bold transition-all"
                >
                  <Plus size={14} />
                  {t('lever.add_left')}
                </button>
                <button
                  onClick={() => addWeight('right')}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold transition-all"
                >
                  <Plus size={14} />
                  {t('lever.add_right')}
                </button>
              </div>

              <button
                onClick={clearAll}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 text-xs font-bold transition-all"
              >
                <Trash2 size={12} />
                {t('lever.clear')}
              </button>
            </div>
          </>
        )}

        {/* ============ CHALLENGE MODE CONTROLS ============ */}
        {mode !== 'free' && (
          <>
            {/* Challenge description */}
            <div className={`p-4 rounded-xl border ${
              mode === 'challenge_a'
                ? 'bg-yellow-500/5 border-yellow-500/20'
                : 'bg-gray-400/5 border-gray-400/20'
            }`}>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                mode === 'challenge_a' ? 'text-yellow-400' : 'text-gray-300'
              }`}>
                {mode === 'challenge_a' ? t('lever.challenge_a_title') : t('lever.challenge_b_title')}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {t('lever.challenge_question')}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                  mode === 'challenge_a'
                    ? 'bg-yellow-600/40 border-yellow-500/60 text-yellow-300'
                    : 'bg-gray-500/40 border-gray-400/60 text-gray-200'
                }`}>
                  {mode === 'challenge_a' ? '10' : '50'}
                </div>
                <span className="text-[10px] text-gray-500">
                  {mode === 'challenge_a' ? t('lever.coin_10_info') : t('lever.coin_50_info')}
                </span>
              </div>
            </div>

            {/* Add coins */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('lever.add_coins')}</div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addWeight('left')}
                  className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs font-bold transition-all"
                >
                  <Plus size={14} />
                  {t('lever.add_left')}
                </button>
                <button
                  onClick={() => addWeight('right')}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold transition-all"
                >
                  <Plus size={14} />
                  {t('lever.add_right')}
                </button>
              </div>

              {/* Coin count */}
              <div className="flex gap-3 text-xs">
                <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 border border-white/5 text-center">
                  <span className="text-red-300 font-bold">{leftCount}</span>
                  <span className="text-gray-500 ml-1">{leftCount === 1 ? t('lever.coin_singular') : t('lever.coin_plural')} ←</span>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 border border-white/5 text-center">
                  <span className="text-gray-500">→ </span>
                  <span className="text-blue-300 font-bold">{rightCount}</span>
                  <span className="text-gray-500 ml-1">{rightCount === 1 ? t('lever.coin_singular') : t('lever.coin_plural')}</span>
                </div>
              </div>

              <button
                onClick={clearAll}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 text-xs font-bold transition-all"
              >
                <Trash2 size={12} />
                {t('lever.clear')}
              </button>
            </div>

            {/* Challenge status */}
            {challengeCompleted && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center animate-fade-in-up">
                <div className="text-lg mb-1">🏆</div>
                <div className="text-sm font-bold text-emerald-300">{t('lever.challenge_success')}</div>
                <p className="text-[10px] text-emerald-400/70 mt-1">{t('lever.challenge_success_desc')}</p>
              </div>
            )}
          </>
        )}

        {/* Weight List */}
        {weights.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('lever.weights_list')}</div>
            {weights.map(wt => (
              <div key={wt.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${mode !== 'free' ? 'rounded-full' : 'rounded'}`} style={{ backgroundColor: wt.color }}></div>
                  <span className="text-xs text-white font-mono">
                    {mode !== 'free' ? (wt.label || '') : `${wt.mass} kg`}
                    {mode !== 'free' && <span className="text-gray-500 ml-1">({wt.mass}g)</span>}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {wt.position < 0 ? t('lever.left') : t('lever.right')} ({Math.abs(wt.position).toFixed(2)}m)
                  </span>
                </div>
                <button
                  onClick={() => removeWeight(wt.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Torque Readout */}
        <div className="p-5 bg-black/40 rounded-xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t('lever.torques')}
            </span>
            <div className={`w-2 h-2 rounded-full ${isBalanced ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-yellow-400 shadow-[0_0_8px_#FBBF24] animate-pulse'}`}></div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-red-300">{t('lever.torque_left')} (Σ τ↺)</span>
              <span className="text-white font-bold">{torqueLeft.toFixed(mode === 'free' ? 1 : 4)} N·m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-300">{t('lever.torque_right')} (Σ τ↻)</span>
              <span className="text-white font-bold">{torqueRight.toFixed(mode === 'free' ? 1 : 4)} N·m</span>
            </div>

            {/* Torque balance bar */}
            <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="absolute left-0 h-full bg-gradient-to-r from-red-500 to-red-400 rounded-l-full transition-all duration-300"
                style={{ width: `${torqueLeft + torqueRight > 0 ? (torqueLeft / (torqueLeft + torqueRight)) * 100 : 50}%` }}
              />
              <div className="absolute right-0 h-full bg-gradient-to-l from-blue-500 to-blue-400 rounded-r-full transition-all duration-300"
                style={{ width: `${torqueLeft + torqueRight > 0 ? (torqueRight / (torqueLeft + torqueRight)) * 100 : 50}%` }}
              />
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 -translate-x-1/2"></div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className={`font-bold ${isBalanced ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {t('lever.net_torque')}
              </span>
              <span className={`text-lg font-bold ${isBalanced ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {netTorque.toFixed(mode === 'free' ? 1 : 4)} N·m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: darken/lighten a hex color
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `rgb(${r},${g},${b})`;
}
