import React from 'react';
import { Member, UnavailableRecord } from '../types';
import { CalendarCheck, X, Users, CloudFog, XCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  records: UnavailableRecord[];
  onSelectDate: (date: string) => void;
}

export const AllStatusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  members,
  records,
  onSelectDate,
}) => {
  if (!isOpen) return null;

  // 향후 30일간 전원 가능한 날짜 계산
  const today = new Date();
  const availableDays: { date: string; dayStr: string; fogCount: number }[] = [];

  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayRecords = records.filter((r) => r.date === dateStr);
    const hasUnavailable = dayRecords.some((r) => (r.status || 'unavailable') === 'unavailable');

    if (!hasUnavailable) {
      const fogCount = dayRecords.filter((r) => r.status === 'fog').length;
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];

      availableDays.push({
        date: dateStr,
        dayStr: `${month}월 ${day}일 (${dayOfWeek})`,
        fogCount,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col relative max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">전체 현황 요약</h2>
            <p className="text-xs text-slate-500">모임 가능 후보일 및 멤버별 입력 현황</p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          {/* 불가자 없는 추천 후보일 목록 */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>불가 인원이 없는 날 (향후 35일 기준)</span>
            </h3>

            {availableDays.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-2xl text-center">
                현재 전원 가능한 날이 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableDays.map((item) => (
                  <button
                    key={item.date}
                    onClick={() => {
                      onSelectDate(item.date);
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl border border-slate-100 hover:border-indigo-300 bg-slate-50/60 hover:bg-indigo-50/40 text-left transition active:scale-95 flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-slate-800">
                      {item.dayStr}
                    </span>
                    <span className="text-[11px] font-semibold mt-1">
                      {item.fogCount === 0 ? (
                        <span className="text-emerald-600">9명 전원 가능</span>
                      ) : (
                        <span className="text-amber-600">안개 {item.fogCount}명</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 멤버별 입력 일수 */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>멤버별 등록 현황</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {members.map((m) => {
                const memberRecords = records.filter((r) => r.member_id === m.id);
                const unavailCount = memberRecords.filter((r) => (r.status || 'unavailable') === 'unavailable').length;
                const fogCount = memberRecords.filter((r) => r.status === 'fog').length;

                return (
                  <div
                    key={m.id}
                    className="p-2 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {m.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-0.5 text-rose-600 font-semibold">
                        <XCircle className="w-3 h-3" /> {unavailCount}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                        <CloudFog className="w-3 h-3" /> {fogCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
