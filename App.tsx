import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Logo } from './components/Logo';
import { ContactView } from './components/ContactView';
import { SimulationType, SimulationConfig } from './types';
import { ElectromagneticWave } from './simulations/ElectromagneticWave';
import { IdealGasSim } from './simulations/IdealGasSim';
import { LeverEquilibriumSim } from './simulations/LeverEquilibriumSim';
import { VectorFieldSim } from './simulations/VectorFieldSim';
import { FaradayLawSim } from './simulations/FaradayLawSim';
import { GradientSim } from './simulations/GradientSim';
import { Waves, Flame, Scale, Wind, TrendingUp, Magnet } from 'lucide-react';
import { useLanguage } from './LanguageContext';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<SimulationType>(SimulationType.HOME);
  const { t } = useLanguage();

  const simulations: SimulationConfig[] = [
    {
      id: SimulationType.EM_WAVE,
      title: t('sim.em_wave.title'),
      description: t('sim.em_wave.desc'),
      thumbnailIcon: <Waves size={48} className="text-celestial-accent" />
    },
    {
      id: SimulationType.IDEAL_GAS,
      title: t('sim.gas.title'),
      description: t('sim.gas.desc'),
      thumbnailIcon: <Flame size={48} className="text-orange-400" />
    },
    {
      id: SimulationType.LEVER_EQUILIBRIUM,
      title: t('sim.lever.title'),
      description: t('sim.lever.desc'),
      thumbnailIcon: <Scale size={48} className="text-violet-400" />
    },
    {
      id: SimulationType.VECTOR_FIELD,
      title: t('sim.vector.title'),
      description: t('sim.vector.desc'),
      thumbnailIcon: <Wind size={48} className="text-emerald-400" />
    },
    /*{
      id: SimulationType.FARADAY_LAW,
      title: t('sim.faraday.title'),
      description: t('sim.faraday.desc'),
      thumbnailIcon: <Magnet size={48} className="text-[#00CFFF]" />
    }*/
   {
      id: SimulationType.GRADIENT,
      title: t('grad.title'),
      description: t('grad.desc'),
      thumbnailIcon: <TrendingUp size={48} className="text-indigo-400" />
    }
  ];

  const renderContent = () => {
    switch (currentView) {
      case SimulationType.EM_WAVE:
        return <ElectromagneticWave />;
      case SimulationType.IDEAL_GAS:
        return <IdealGasSim />;
      case SimulationType.LEVER_EQUILIBRIUM:
        return <LeverEquilibriumSim />;
      case SimulationType.VECTOR_FIELD:
        return <VectorFieldSim />;
      case SimulationType.GRADIENT:
        return <GradientSim />;
      case SimulationType.FARADAY_LAW:
        return <FaradayLawSim />;
      case SimulationType.CONTACT:
        return <ContactView />;
      case SimulationType.HOME:
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 sm:space-y-16 py-4">
            {/* Hero Section with Big Logo */}
            <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 animate-fade-in-up px-4">
              <div className="transform hover:scale-105 transition-transform duration-700">
                <div className="block sm:hidden">
                  <Logo size={120} vertical={true} />
                </div>
                <div className="hidden sm:block">
                  <Logo size={180} vertical={true} />
                </div>
              </div>
              
              <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
                <h2 className="text-lg md:text-2xl font-light tracking-widest text-celestial-100/80 uppercase border-b border-white/10 pb-4">
                  Celestial Lab v1
                </h2>
                <p className="text-gray-400 text-sm sm:text-lg">
                  {t('home.subtitle')}
                </p>
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 w-full max-w-7xl px-2 sm:px-4 justify-items-center">
              {simulations.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => setCurrentView(sim.id)}
                  className="group relative bg-celestial-800/30 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-2xl text-left transition-all duration-300 hover:bg-celestial-800/50 hover:border-celestial-accent/30 hover:translate-y-[-4px] hover:shadow-[0_10px_30px_-10px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col w-full"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-celestial-accent/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none" />
                  
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-celestial-900/80 rounded-2xl w-min group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-lg">
                    {sim.thumbnailIcon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 group-hover:text-celestial-accent transition-colors font-serif tracking-wide">
                    {sim.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 flex-grow">
                    {sim.description}
                  </p>
                  
                  <div className="mt-4 sm:mt-6 flex items-center text-[10px] font-bold text-celestial-accent uppercase tracking-widest opacity-0 sm:opacity-100 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    {t('home.start')}
                    <svg className="ml-2 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;