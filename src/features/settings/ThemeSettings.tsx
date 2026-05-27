import { useThemeStore, LIST_OF_THEMES, VisualThemeId } from '../../stores/themeStore';
import { Palette, Layers, Sparkles, Sliders, Check, Layout, Grid, HelpCircle } from 'lucide-react';

interface ThemeSettingsProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function ThemeSettings({ onShowToast }: ThemeSettingsProps) {
  const {
    currentThemeId,
    borderRadius,
    uiDensity,
    glowIntensity,
    setTheme,
    setBorderRadius,
    setUiDensity,
    setGlowIntensity
  } = useThemeStore();

  const handleSelectTheme = (id: VisualThemeId) => {
    setTheme(id);
    onShowToast(`Tema cambiado a ${id.replace('-', ' ')} con éxito`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header section with instructions */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-[var(--app-text-primary)]">
          <Palette className="w-5.5 h-5.5 text-[var(--app-accent)] animate-pulse" />
          Temas y Apariencia Premium
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          Ajustes visuales y tokens de diseño para adaptar el sistema a la estética corporativa de tu bar/restaurante.
        </p>
      </div>

      {/* Grid of the 4 core professional themes */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[var(--app-text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Estilos Corporativos Seleccionables ({LIST_OF_THEMES.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LIST_OF_THEMES.map((theme) => {
            const isSelected = theme.id === currentThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`text-left p-5 rounded-[24px] transition-all duration-350 relative overflow-hidden flex flex-col justify-between h-46 border ${
                  isSelected
                    ? 'border-[var(--app-accent)] shadow-[0_0_25px_rgba(var(--app-accent-rgb),0.1)] bg-slate-900/80 scale-[1.01]'
                    : 'border-white/5 hover:border-white/10 bg-slate-900/30 hover:bg-slate-900/50'
                }`}
                style={{
                  background: theme.colors.meshGradient !== 'none' 
                    ? `linear-gradient(135deg, ${theme.colors.bgSecondary} 0%, ${theme.colors.bgPrimary} 100%), ${theme.colors.meshGradient}`
                    : theme.colors.bgSecondary
                }}
              >
                {/* Visual miniature elements to represent how dashboard buttons look */}
                <div className="w-full flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black block" style={{ color: theme.colors.textPrimary }}>
                      {theme.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {theme.id === 'light-elegant' ? 'Estilo Claro de Alta Claridad' : 'Estilo Oscuro Imersivo'}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full uppercase bg-black/30 text-slate-400 font-bold">
                      {theme.isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  )}
                </div>

                {/* Simulated visual layout miniature */}
                <div className="my-2.5 space-y-2 w-full bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex gap-1.5 items-center">
                    <span 
                      className="w-1.5 h-1.5 rounded-full animate-ping" 
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div className="h-2 w-16 rounded bg-white/20" />
                    <div className="h-2 w-10 rounded bg-white/10" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-6 rounded border border-white/5 flex items-center justify-center text-[8px] uppercase tracking-wider font-extrabold" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.borderColor }}>
                      POS
                    </div>
                    <div className="h-6 rounded border border-white/5 flex items-center justify-center text-[8px] uppercase tracking-wider font-extrabold" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.borderColor }}>
                      Mesa
                    </div>
                    <div className="h-6 rounded flex items-center justify-center text-[8px] font-black text-slate-950 uppercase" style={{ backgroundColor: theme.colors.accent }}>
                      COP
                    </div>
                  </div>
                </div>

                {/* Subtitle list of active colors */}
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: theme.colors.bgPrimary }} title="Fondo Primario" />
                  <span className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: theme.colors.bgSecondary }} title="Fondo Secundario" />
                  <span className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: theme.colors.accent }} title="Color de Acento" />
                  <span className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: theme.colors.borderColor }} title="Línea de Borde" />
                  <span className="text-[10px] text-slate-500 ml-auto font-mono">Accent: {theme.colors.accent}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Interactive Operational POS Preview Panel */}
      <div className="glass-panel border border-white/5 bg-slate-900/20 p-6 rounded-[24px] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-[var(--app-text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            Control Operacional y Contraste de Mesas
          </h3>
          <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold uppercase tracking-widest">
            WCAG Compliant
          </span>
        </div>
        
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Los colores de estado de las mesas son fijos e independientes del tema activo para garantizar la máxima velocidad operativa. El personal identificará la situación en milisegundos:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 hover:bg-black/30 transition-all">
            <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: 'var(--table-free)' }} />
            <span className="text-xs font-black text-[var(--app-text-primary)]">Mesa Libre</span>
            <span className="text-[9px] text-slate-500 font-mono">--table-free</span>
          </div>

          <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 hover:bg-black/30 transition-all">
            <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: 'var(--table-occupied)' }} />
            <span className="text-xs font-black text-[var(--app-text-primary)]">Mesa Ocupada</span>
            <span className="text-[9px] text-slate-500 font-mono">--table-occupied</span>
          </div>

          <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 hover:bg-black/30 transition-all">
            <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: 'var(--table-ready)' }} />
            <span className="text-xs font-black text-[var(--app-text-primary)]">Cuenta Lista</span>
            <span className="text-[9px] text-slate-500 font-mono">--table-ready</span>
          </div>

          <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 hover:bg-black/30 transition-all">
            <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: 'var(--table-selected)' }} />
            <span className="text-xs font-black text-[var(--app-text-primary)]">Seleccionada</span>
            <span className="text-[9px] text-slate-500 font-mono">--table-selected</span>
          </div>
        </div>
      </div>

      {/* Advanced Layout controls  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Glow and Rounded Radius Controls */}
        <div className="glass-panel border border-white/5 bg-slate-900/35 p-6 rounded-[24px] space-y-5">
          <h3 className="text-xs font-extrabold text-[var(--app-text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Efectos y Bordes
          </h3>

          {/* Slider for Border Radius */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Borde de Paneles (Border Radius)</span>
              <span className="font-mono text-[var(--app-accent)] font-bold">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="24"
              step="4"
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[var(--app-accent)]"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Cuadrado (8px)</span>
              <span>Medio (16px)</span>
              <span>Orgánico (24px)</span>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Buttons for Glow Intensity */}
          <div className="space-y-2.5">
            <span className="text-xs text-slate-400 font-medium block">Intensidad de Brillo (Neon Glow)</span>
            <div className="grid grid-cols-3 gap-2">
              {(['default', 'subtle', 'none'] as const).map((g) => {
                const active = glowIntensity === g;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setGlowIntensity(g);
                      onShowToast(`Brillo ajustado a: ${g}`, 'info');
                    }}
                    className={`px-3 py-2 rounded-xl text-center text-xs border transition-all duration-300 capitalize ${
                      active
                        ? 'bg-[var(--app-accent)]/15 text-[var(--app-accent)] border-[var(--app-accent)]/30 font-bold'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    {g === 'default' ? 'Estándar' : g === 'subtle' ? 'Bajo' : 'Desactivado'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dense / Compact layout modes */}
        <div className="glass-panel border border-white/5 bg-slate-900/35 p-6 rounded-[24px] space-y-5">
          <h3 className="text-xs font-extrabold text-[var(--app-text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            Densidad e Ingress
          </h3>

          <div className="space-y-3">
            <span className="text-xs text-slate-400 font-medium block">Modo de Densidad POS</span>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              El modo compacto reduce los márgenes y optimiza el espaciado para pantallas táctiles de tabletas pequeñas, permitiendo ver más mesas y productos simultáneamente.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  setUiDensity('standard');
                  onShowToast('Densidad estándar aplicada', 'info');
                }}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 text-xs ${
                  uiDensity === 'standard'
                    ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20 font-bold shadow-[0_0_10px_rgba(0,242,255,0.05)]'
                    : 'border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                Estándar
              </button>
              <button
                onClick={() => {
                  setUiDensity('compact');
                  onShowToast('Densidad compacta habilitada', 'success');
                }}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 text-xs ${
                  uiDensity === 'compact'
                    ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20 font-bold shadow-[0_0_10px_rgba(0,242,255,0.05)]'
                    : 'border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Compacto
              </button>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Quick info check */}
          <div className="text-[10px] text-slate-500 bg-black/10 p-3 rounded-xl border border-white/5 flex gap-2 items-start">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Los cambios de apariencia se sincronizan al instante en todo el portal y se almacenan automáticamente en caché local.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
