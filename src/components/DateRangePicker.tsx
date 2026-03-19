import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown, Filter } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ date, setDate, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-sm text-black dark:text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 transition-colors"
      >
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        <span>
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd 'de' MMM", { locale: ptBR })} -{' '}
                {format(date.to, "dd 'de' MMM", { locale: ptBR })}
              </>
            ) : (
              format(date.from, "dd 'de' MMM", { locale: ptBR })
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50">
          <style>{`
            /* react-day-picker v9 — full green override */
            .rdp-root {
              --rdp-accent-color: #10B981 !important;
              --rdp-accent-background-color: rgba(16,185,129,0.15) !important;
              --rdp-range_middle-background-color: rgba(16,185,129,0.15) !important;
              --rdp-range_start-date-background-color: #10B981 !important;
              --rdp-range_end-date-background-color: #10B981 !important;
              --rdp-today-color: #10B981 !important;
              --rdp-selected-border: 2px solid #10B981 !important;
              --rdp-day-height: 36px;
              --rdp-day-width: 36px;
              --rdp-day_button-height: 34px;
              --rdp-day_button-width: 34px;
            }
            .rdp-chevron { fill: #10B981 !important; }
            .rdp-range_start .rdp-day_button,
            .rdp-range_end .rdp-day_button {
              background-color: #10B981 !important;
              color: #000 !important;
              font-weight: 700 !important;
            }
            .rdp-range_middle { background-color: rgba(16,185,129,0.15) !important; }
            .rdp-today:not(.rdp-outside) { color: #10B981 !important; font-weight: 700 !important; }
            .rdp-button_next:hover, .rdp-button_previous:hover { background-color: rgba(16,185,129,0.1) !important; }
          `}</style>
          <DayPicker
            mode="range"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            numberOfMonths={2}
            pagedNavigation
          />
        </div>
      )}
    </div>
  );
}
