import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Sparkles, Monitor, Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme, AppTheme } from '../context/ThemeContext';

interface ThemeOption {
  id: AppTheme;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  previewColors: [string, string, string];
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    label: 'Modo Claro',
    sublabel: 'Interface limpa e minimalista',
    icon: <Sun className="w-4 h-4 text-amber-500" />,
    previewColors: ['#ffffff', '#f8fafc', '#4f46e5'],
  },
  {
    id: 'dark',
    label: 'Modo Escuro',
    sublabel: 'Fundo escuro e alto contraste',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    previewColors: ['#131b28', '#0b0f17', '#6366f1'],
  },
  {
    id: 'midnight',
    label: 'Pixel Nexo Midnight',
    sublabel: 'Roxo profundo com dourado exclusivo',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    previewColors: ['#230836', '#150422', '#ffd000'],
  },
  {
    id: 'emerald',
    label: 'Finanças Emerald',
    sublabel: 'Verde esmeralda sofisticado',
    icon: <Palette className="w-4 h-4 text-emerald-400" />,
    previewColors: ['#08241b', '#031711', '#10b981'],
  },
  {
    id: 'system',
    label: 'Automático (Sistema)',
    sublabel: 'Sincroniza com as preferências do dispositivo',
    icon: <Monitor className="w-4 h-4 text-slate-400" />,
    previewColors: ['#e2e8f0', '#94a3b8', '#64748b'],
  },
];

export const ThemeSelector: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="w-3.5 h-3.5 text-slate-500" />;
    if (resolvedTheme === 'midnight') return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    if (resolvedTheme === 'emerald') return <Palette className="w-3.5 h-3.5 text-emerald-500" />;
    if (resolvedTheme === 'dark') return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    return <Sun className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="btn-theme-selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition cursor-pointer"
        title="Alterar tema visual"
        aria-label="Opções de tema"
        aria-expanded={isOpen}
      >
        {getThemeIcon()}
        <span className="hidden sm:inline">Tema</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="theme-selector-dropdown"
          className="origin-top-right absolute right-0 mt-2 w-72 sm:w-80 rounded-xl shadow-xl bg-white border border-slate-200 z-50 p-2 focus:outline-none animate-in fade-in zoom-in-95 duration-150"
          role="menu"
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                Aparência & Tema
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                Personalizar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Escolha a paleta de cores para sua experiência</p>
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`btn-theme-option-${opt.id}`}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-950 font-bold border border-indigo-200'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center bg-slate-100 border border-slate-200">
                      {opt.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{opt.label}</span>
                        {opt.id === 'midnight' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-700 border border-amber-300/40">
                            Exclusivo
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">{opt.sublabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Swatch preview circles */}
                    <div className="flex -space-x-1 items-center">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs inline-block"
                        style={{ backgroundColor: opt.previewColors[0] }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs inline-block"
                        style={{ backgroundColor: opt.previewColors[1] }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs inline-block"
                        style={{ backgroundColor: opt.previewColors[2] }}
                      />
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
