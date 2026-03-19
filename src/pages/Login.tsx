import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { supabase } from '@/lib/supabase';
import { useExpertTheme } from '@/contexts/ExpertThemeContext';

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');
  const navigate  = useNavigate();
  const { theme, loading: themeLoading } = useExpertTheme();

  // Detect if we're in expert-branded mode (URL has ?expertId=)
  const isExpertBranded = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).has('expertId');

  const p  = theme.primaryColor;   // accent / primary
  const p2 = theme.secondaryColor; // secondary (hover)
  const bg = theme.backgroundColor;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!supabase) {
        await new Promise(r => setTimeout(r, 600));
        if (email.toLowerCase().includes('admin'))        navigate('/admin');
        else if (email.toLowerCase().includes('expert'))  navigate('/expert');
        else                                              navigate('/student');
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError('Email ou senha incorretos. Verifique seus dados e tente novamente.');
        return;
      }

      if (!data.user) {
        setError('Erro ao autenticar. Tente novamente.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = profile?.role ?? data.user.user_metadata?.role ?? 'student';

      if (role === 'admin')       navigate('/admin');
      else if (role === 'expert') navigate('/expert');
      else                        navigate('/student');

    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show spinner while loading expert theme from URL param
  if (isExpertBranded && themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="w-10 h-10 rounded-full border-2 border-white/10 animate-spin" style={{ borderTopColor: p }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-hidden relative"
      style={{ background: isExpertBranded ? bg : '#050505' }}
    >
      {/* Animated grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${p}0f 1px, transparent 1px), linear-gradient(to right, ${p}0f 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow */}
      <div
        className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: `${p}1a` }}
      />
      <div
        className="absolute bottom-0 right-[-100px] w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: `${p}0d` }}
      />

      {/* Mode toggle — hide in expert-branded mode to keep it clean */}
      {!isExpertBranded && (
        <div className="absolute top-4 right-4 z-10">
          <ModeToggle />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center py-12 px-4 relative z-10">
        {/* Logo / Brand */}
        <div className="sm:mx-auto sm:w-full sm:max-w-[400px] text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl blur-2xl scale-[1.8]"
                style={{ background: `${p}40` }}
              />
              {isExpertBranded && theme.logoUrl ? (
                /* Expert custom logo */
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border overflow-hidden"
                  style={{ background: `${p}20`, borderColor: `${p}50` }}
                >
                  <img
                    src={theme.logoUrl}
                    alt={theme.brandName}
                    className="w-full h-full object-contain p-1"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ) : (
                /* Default icon */
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border"
                  style={{
                    background: `linear-gradient(135deg, ${p}, ${p2})`,
                    borderColor: `${p}50`,
                    boxShadow: `0 20px 60px ${p}40`,
                  }}
                >
                  <TrendingUp className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>

          {/* Platform name */}
          <h1 className="text-3xl font-black tracking-tight" style={{ color: theme.textColor }}>
            {isExpertBranded
              ? <span style={{ color: p }}>{theme.brandName}</span>
              : <>Gerenciador de <span style={{ color: p }}>Banca</span></>
            }
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isExpertBranded ? 'Área exclusiva para alunos' : 'Plataforma profissional para traders'}
          </p>
          <div
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border"
            style={{ background: `${p}1a`, borderColor: `${p}33` }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: p }}>
              Sistema Online
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="sm:mx-auto sm:w-full sm:max-w-[400px]">
          <div
            className="rounded-2xl border shadow-2xl shadow-black/60 overflow-hidden"
            style={{
              background: isExpertBranded ? `${bg}e6` : '#0a0a0a',
              borderColor: `${p}12`,
            }}
          >
            {/* Top accent line */}
            <div
              className="h-px w-full"
              style={{ background: `linear-gradient(to right, transparent, ${p}99, transparent)` }}
            />

            <div className="px-8 py-8">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">
                Acesse sua conta
              </p>

              <form className="space-y-5" onSubmit={handleLogin}>
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
                    <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-600 group-focus-within:transition-colors" style={{ '--tw-text-opacity': '1' } as any} />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none transition-all text-sm text-white placeholder:text-gray-700"
                      style={{ '--focus-ring': p } as any}
                      onFocus={e => { e.currentTarget.style.borderColor = `${p}99`; e.currentTarget.style.boxShadow = `0 0 0 2px ${p}25`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Senha
                    </label>
                    <a href="#" className="text-[11px] font-medium transition-colors" style={{ color: p }}>
                      Esqueceu?
                    </a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-600" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none transition-all text-sm text-white placeholder:text-gray-700"
                      onFocus={e => { e.currentTarget.style.borderColor = `${p}99`; e.currentTarget.style.boxShadow = `0 0 0 2px ${p}25`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-700 bg-white/5 cursor-pointer"
                    style={{ accentColor: p }}
                  />
                  <label htmlFor="remember-me" className="text-xs text-gray-600 cursor-pointer select-none">
                    Lembrar por 30 dias
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white focus:outline-none transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${p}, ${p2})`,
                    boxShadow: `0 8px 30px ${p}33`,
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${p2}, ${p2})`; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${p}, ${p2})`; }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Autenticando...
                    </>
                  ) : (
                    <> Entrar <ArrowRight className="w-4 h-4" /> </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-700">
            {isExpertBranded
              ? `${theme.brandName} · Acesso restrito`
              : 'Acesso restrito · Apenas usuários cadastrados'}
          </p>
        </div>
      </div>
    </div>
  );
}
