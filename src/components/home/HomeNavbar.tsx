import React, { useState, useEffect } from 'react';
import { Terminal, Menu, X, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HomeNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;
    
    const handleScroll = () => {
      setIsScrolled(mainContainer.scrollTop > 20);
    };

    mainContainer.addEventListener('scroll', handleScroll);
    return () => mainContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'The Problem', href: '#problem' },
    { label: 'Why ReproX', href: '#workflow' },
    { label: 'Features', href: '#features' },
    { label: 'Privacy', href: '#privacy' },
  ];

  const handleScrollTo = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav 
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        isScrolled 
          ? 'glass-nav border-slate-700/50 shadow-lg shadow-black/20 py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              ReproX
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <button 
                  key={link.label}
                  onClick={() => handleScrollTo(link.href)}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => navigate('/playground')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-dark-950 font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Playground</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white focus:outline-none rounded-lg hover:bg-slate-800/50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass-nav border-b border-slate-700/50 animate-fadeIn shadow-2xl">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleScrollTo(link.href)}
                className="block w-full text-left px-3 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 pb-2 px-3">
              <button
                onClick={() => navigate('/playground')}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-dark-950 font-bold text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Playground</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
