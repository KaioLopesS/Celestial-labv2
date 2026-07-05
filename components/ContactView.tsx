import React, { useState } from 'react';
import { Mail, Copy, Check, ExternalLink } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const ContactView: React.FC = () => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const email = "kaio.lopesof@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full animate-fade-in-up">
      <div className="max-w-2xl w-full mx-4">
        {/* Main Card */}
        <div className="relative bg-celestial-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 overflow-hidden shadow-2xl">
          
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-celestial-accent/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-celestial-500/5 rounded-full blur-[80px] -ml-16 -mb-16 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            
            {/* Header Icon */}
            <div className="w-20 h-20 bg-celestial-900/50 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.15)] mb-2">
              <Mail size={36} className="text-celestial-accent" />
            </div>

            {/* Texts */}
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wide">
                {t('contact.title')}
              </h2>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                {t('contact.desc')}
              </p>
            </div>

            {/* Email Action Box */}
            <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-xl p-6 space-y-2 group hover:border-celestial-accent/30 transition-colors">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-3 text-left">
                 {t('contact.email_label')}
              </label>
              
              <div className="flex items-center justify-between gap-4 p-3 bg-celestial-900/50 rounded-lg border border-white/5">
                <span className="font-mono text-celestial-100 text-sm md:text-base break-all selection:bg-celestial-accent selection:text-black">
                  {email}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-all relative group/btn"
                    title={t('contact.copy')}
                  >
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    {copied && (
                       <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-green-500 text-black font-bold px-2 py-1 rounded">
                         {t('contact.copied')}
                       </span>
                    )}
                  </button>
                  
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};