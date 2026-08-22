import React from 'react';
import { Sun, CloudSun, CloudRain, ShieldAlert, Sparkles, Shirt, Umbrella } from 'lucide-react';

interface HourlyWeatherTimelineProps {
  dayName: string;
  meteoLine?: string;
}

interface TimeSlotWeather {
  slot: string;
  time: string;
  temp: string;
  icon: string;
  condition: string;
  advice: string;
}

const getSmartAdvice = (icon: string, tempNum: number): { text: string; icon: any; color: string } => {
  if (icon.includes('???') || icon.includes('??') || icon.includes('??')) {
    return {
      text: 'Ombrello leggero e giacca impermeabile obbligatori per i bambini.',
      icon: Umbrella,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };
  }
  if (tempNum >= 22 || icon.includes('??')) {
    return {
      text: 'Sole piacevole: consigliati cappellino, occhiali da sole e borraccia.',
      icon: Sun,
      color: 'bg-amber-50 border-amber-200 text-amber-900'
    };
  }
  if (tempNum <= 12) {
    return {
      text: 'Temperature fresche: consigliato abbigliamento a strati con giacca antivento.',
      icon: Shirt,
      color: 'bg-blue-50 border-blue-200 text-blue-900'
    };
  }
  return {
    text: "Clima ideale per attivit� all'aperto. Abbigliamento comodo e scarpe da ginnastica.",
    icon: Sparkles,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-900'
  };
};

export const HourlyWeatherTimeline: React.FC<HourlyWeatherTimelineProps> = ({ dayName, meteoLine }) => {
  // Parse meteo format: DAY|MORNING_ICON|TEMP|AFTERNOON_ICON|TEMP|NIGHT_ICON|TEMP
  let morningIcon = '??';
  let morningTemp = '20�';
  let afternoonIcon = '?';
  let afternoonTemp = '22�';
  let nightIcon = '??';
  let nightTemp = '16�';

  if (meteoLine && meteoLine.includes('|')) {
    const parts = meteoLine.split('|').map(p => p.trim());
    if (parts.length >= 7) {
      morningIcon = parts[1] || morningIcon;
      morningTemp = parts[2] || morningTemp;
      afternoonIcon = parts[3] || afternoonIcon;
      afternoonTemp = parts[4] || afternoonTemp;
      nightIcon = parts[5] || nightIcon;
      nightTemp = parts[6] || nightTemp;
    }
  }

  const morningTempNum = parseInt(morningTemp.replace(/D/g, '')) || 20;
  const afternoonTempNum = parseInt(afternoonTemp.replace(/D/g, '')) || 22;

  const slots: TimeSlotWeather[] = [
    {
      slot: 'Mattina',
      time: '09:00 - 12:00',
      temp: morningTemp,
      icon: morningIcon,
      condition: morningIcon.includes('??') ? 'Soleggiato' : morningIcon.includes('???') ? 'Pioggia' : 'Variabile',
      advice: getSmartAdvice(morningIcon, morningTempNum).text
    },
    {
      slot: 'Pranzo & Pomeriggio',
      time: '12:30 - 18:00',
      temp: afternoonTemp,
      icon: afternoonIcon,
      condition: afternoonIcon.includes('??') ? 'Sole Caldo' : afternoonIcon.includes('???') ? 'Pioggia' : 'Piacevole',
      advice: getSmartAdvice(afternoonIcon, afternoonTempNum).text
    },
    {
      slot: 'Sera & Rientro',
      time: '18:30 - 21:00',
      temp: nightTemp,
      icon: nightIcon,
      condition: 'Fresco Serale',
      advice: 'Serata fresca: consigliata una felpa per il rientro.'
    }
  ];

  const overallAdvice = getSmartAdvice(afternoonIcon, afternoonTempNum);
  const AdviceIcon = overallAdvice.icon;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-base leading-none">Previsioni Meteo Orarie</h4>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{dayName}</p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Live Forecast</span>
        </div>
      </div>

      {/* 3 Hourly Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {slots.map((s, idx) => (
          <div
            key={idx}
            className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300"
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.slot}</span>
            <span className="text-[10px] font-bold text-indigo-600 mb-3">{s.time}</span>
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
            <span className="text-2xl font-black text-slate-900 leading-none mb-1">{s.temp}</span>
            <span className="text-xs font-bold text-slate-500">{s.condition}</span>
          </div>
        ))}
      </div>

      {/* Smart Advice Banner */}
      <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${overallAdvice.color}`}>
        <div className="p-2 rounded-xl bg-white/80 shadow-sm shrink-0">
          <AdviceIcon className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold leading-relaxed">
          <span className="font-black uppercase tracking-wider block text-[10px] opacity-80 mb-0.5">Consiglio Abbigliamento Famiglia:</span>
          {overallAdvice.text}
        </p>
      </div>
    </div>
  );
};
