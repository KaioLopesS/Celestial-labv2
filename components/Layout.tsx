import React from 'react';
import { Logo } from './Logo';
import { SimulationType } from '../types';
import { useLanguage } from '../LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: SimulationType;
  onNavigate: (view: SimulationType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-celestial-900 text-celestial-100 flex flex-col selection:bg-celestial-accent selection:text-celestial-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-celestial-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <button 
            onClick={() => onNavigate(SimulationType.HOME)}
            className="hover:opacity-80 transition-opacity focus:outline-none"
          >
            <Logo size={36} />
          </button>

          <div className="flex gap-4 sm:gap-6 items-center">
            {/* Contact Button */}
            <button
              onClick={() => onNavigate(SimulationType.CONTACT)}
              className={`text-xs sm:text-sm uppercase tracking-widest hover:text-celestial-accent transition-colors font-semibold ${currentView === SimulationType.CONTACT ? 'text-celestial-accent' : 'text-gray-400'}`}
            >
              {t('nav.contact')}
            </button>

            {currentView !== SimulationType.HOME && (
              <button
                onClick={() => onNavigate(SimulationType.HOME)}
                className="text-xs sm:text-sm uppercase tracking-widest hover:text-celestial-accent transition-colors font-semibold"
              >
                {t('nav.menu')}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative overflow-hidden">
        {/* Background ambient effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10 h-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-white/30 text-xs uppercase tracking-widest">
        {t('footer')}
      </footer>
    </div>
  );
};