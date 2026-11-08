import React, { useState } from 'react';
import { Member, UnavailableRecord, ViewMode } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  members: Member[];
  records: UnavailableRecord[];
  currentMember: Member | null;
  mode: ViewMode;
  onDateClick: (date: string) => void;
  selectedDate: string | null;
}

export const Calendar: React.FC<Props> = ({
  members,
  records,
  currentMember,
  mode,
  onDateClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 ~ 11

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 해당 월 캘린더 일자 계산
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0: 일요일
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 날짜 스트링 빌더 (YYYY-MM-DD)
  const formatDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
      {/* 캘린더 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {year}년 {month + 1}월
          </h2>
          <button
            onClick={handleToday}
            className="text-[11px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
          >
            오늘
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs mb-2">
        <span className="text-rose-500 py-1">일</span>
        <span className="text-slate-500 py-1">월</span>
        <span className="text-slate-500 py-1">화</span>
        <span className="text-slate-500 py-1">수</span>
        <span className="text-slate-500 py-1">목</span>
        <span className="text-slate-500 py-1">금</span>
        <span className="text-blue-500 py-1">토</span>
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* 첫째 주 빈 칸 */}
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square rounded-2xl bg-slate-50/50" />
        ))}

        {/* 날짜 셀들 */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNumber = idx + 1;
          const dateStr = formatDateStr(dayNumber);
          const isToday = dateStr === todayStr;

          // 이 날의 기록들 (불가 or 안개)
          const dayRecords = records.filter((r) => r.date === dateStr);
          
          // 멤버별 가장 최근 상태 매핑
          const recordMap = new Map<number, UnavailableRecord>();
          dayRecords.forEach((r) => {
            recordMap.set(r.member_id, r);
          });

          const unavailCount = Array.from(recordMap.values()).filter(
            (r) => (r.status || 'unavailable') === 'unavailable'
          ).length;

          const fogCount = Array.from(recordMap.values()).filter(
            (r) => r.status === 'fog'
          ).length;

          // 현재 로그인한 사용자의 상태
          const myRecord = currentMember ? recordMap.get(currentMember.id) : undefined;
          const isMeUnavailable = myRecord && (myRecord.status || 'unavailable') === 'unavailable';
          const isMeFog = myRecord && myRecord.status === 'fog';

          // 요일별 글자색
          const dayOfWeek = (firstDayOfMonth + idx) % 7;
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={`relative aspect-square rounded-2xl p-1.5 flex flex-col justify-between transition-all duration-200 active:scale-95 text-left border ${
                isMeUnavailable
                  ? 'bg-rose-50/60 border-rose-200'
                  : isMeFog
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-slate-100 hover:border-slate-300 shadow-2xs'
              } ${isToday ? 'ring-2 ring-indigo-500 font-bold' : ''}`}
            >
              {/* 상단: 날짜 번호 및 인원수 요약 */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs sm:text-sm font-extrabold ${
                    isSunday
                      ? 'text-rose-500'
                      : isSaturday
                      ? 'text-blue-500'
                      : 'text-slate-700'
                  }`}
                >
                  {dayNumber}
                </span>

                <div className="flex items-center gap-0.5">
                  {unavailCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-500 px-1 rounded-md bg-rose-100/80">
                      -{unavailCount}
                    </span>
                  )}
                  {fogCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 px-1 rounded-md bg-amber-100/80">
                      ~{fogCount}
                    </span>
                  )}
                </div>
              </div>

              {/* 하단: 9개 도트 시각화 영역 */}
              <div className="mt-auto pt-1">
                {mode === 'edit-unavailable' && isMeUnavailable ? (
                  <div
                    className="text-[9px] font-bold px-1 py-0.5 rounded text-white text-center truncate"
                    style={{ backgroundColor: currentMember?.color }}
                  >
                    내 불가
                  </div>
                ) : mode === 'edit-fog' && isMeFog ? (
                  <div
                    className="text-[9px] font-bold px-1 py-0.5 rounded text-center truncate border bg-white"
                    style={{ borderColor: currentMember?.color, color: currentMember?.color }}
                  >
                    내 안개
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-0.5 sm:gap-1 place-items-center">
                    {members.map((member) => {
                      const rec = recordMap.get(member.id);
                      if (!rec) return null;

                      const isFog = rec.status === 'fog';

                      return isFog ? (
                        /* 비어있는 도트 (안개) */
                        <div
                          key={member.id}
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 bg-white shadow-2xs"
                          style={{ borderColor: member.color }}
                          title={`${member.name} 안개`}
                        />
                      ) : (
                        /* 꽉 찬 도트 (불가) */
                        <div
                          key={member.id}
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-2xs"
                          style={{ backgroundColor: member.color }}
                          title={`${member.name} 불가`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 하단 캘린더 안내 범례 */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
            <span>꽉 찬 점: 불가</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-700 bg-white inline-block"></span>
            <span>빈 점: 안개</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400">
          날짜를 누르면 상세 현황을 확인합니다
        </span>
      </div>
    </div>
  );
};
