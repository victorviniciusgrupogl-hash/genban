import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const assets = [
  { symbol: 'EUR/USD', price: '1.0845', change: '+0.12%', isUp: true },
  { symbol: 'GBP/USD', price: '1.2630', change: '-0.05%', isUp: false },
  { symbol: 'USD/JPY', price: '150.20', change: '+0.34%', isUp: true },
  { symbol: 'AUD/USD', price: '0.6540', change: '-0.18%', isUp: false },
  { symbol: 'USD/CAD', price: '1.3480', change: '+0.08%', isUp: true },
  { symbol: 'BTC/USD', price: '51200.00', change: '+1.20%', isUp: true },
  { symbol: 'ETH/USD', price: '2950.50', change: '-0.45%', isUp: false },
  { symbol: 'XAU/USD', price: '2025.10', change: '+0.25%', isUp: true },
];

export function AssetTicker() {
  return (
    <div className="w-full bg-[#0a0a0a] border-b border-white/[0.07] overflow-hidden flex items-center h-9 relative shrink-0">
      <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee whitespace-nowrap">
        {[...assets, ...assets].map((asset, index) => (
          <div
            key={`${asset.symbol}-${index}`}
            className="flex items-center gap-2 px-5 border-r border-white/[0.06] last:border-none"
          >
            <span className="text-[11px] font-bold text-gray-400">{asset.symbol}</span>
            <span className="text-[11px] font-mono font-semibold text-white">{asset.price}</span>
            <span className={cn(
              'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
              asset.isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
            )}>
              {asset.isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {asset.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
