import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#050505] flex flex-col items-center justify-center font-sans px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/20 mb-6">
        <TrendingUp className="w-7 h-7 text-black" strokeWidth={2.5} />
      </div>

      <h1 className="text-7xl font-bold text-black dark:text-white tracking-tight mb-2">404</h1>
      <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-1">Página não encontrada</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-sm mb-8">
        A página que você está procurando não existe ou foi movida para outro endereço.
      </p>

      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-[#10B981]/20"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao início
      </button>
    </div>
  );
}
