import React from 'react';
import { UnavailableRecord } from '../types';
import { Sparkles, Trophy } from 'lucide-react';

interface Props {
  records: UnavailableRecord[];
  totalMembersCount: number;
  onSelectDate: (date: string) => void;
}

export const BestDaysBanner: React.FC<Props> = ({
  records,
  totalMembersCount,
  onSelectDate,
}) => {
  // 향후 60일간의 날짜 중에서 가장 참석 인원이 많은 날짜 3개 산출
  const today = new Date();
  const dayStats: { date: string; unavailableCount: number }[] = [];

  for (let i = 0; i < 45; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const unavailables = records.filter((r) => r.date === dateStr);
    dayStats.push({
      date: dateStr,
      unavailableCount: unavailables.length,
    });
  }

  // 1순위: 전원 참석 (불가 0명)
  // 2순위: 1명 불가
  const perfectDays = dayStats.filter((s) => s.unavailableCount === 0);
  const almostDays = dayStats.filter((s) => s.unavailableCount === 1);

  const topDays = [...perfectDays, ...almostDays].slice(0, 3);

  if (topDays.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 text-white shadow-lg mb-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-md">
          <Trophy className="w-5 h-5 text-amber-100" />
        </div>
        <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
          <span>모임 추천 날짜 (Best Days)</span>
          <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {topDays.map((item, idx) => {
          const [, m, d] = item.date.split('-');
          const isPerfect = item.unavailableCount === 0;

          return (
            <button
              key={item.date}
              onClick={() => onSelectDate(item.date)}
              className="bg-white/15 hover:bg-white/25 border border-white/25 rounded-2xl p-2.5 flex flex-col items-center justify-center transition active:scale-95 text-center backdrop-blur-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">
                {idx === 0 ? '👑 1순위' : `${idx + 1}순위`}
              </span>
              <span className="text-sm font-black mt-0.5">
                {Number(m)}/{Number(d)}
              </span>
              <span className="text-[11px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full bg-white/20">
                {isPerfect ? '전원 가능 🎉' : `${totalMembersCount - item.unavailableCount}명 가능`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
