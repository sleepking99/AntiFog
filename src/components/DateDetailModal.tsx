import React from 'react';
import { Member, RecordStatus, UnavailableRecord } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, CloudFog, X } from 'lucide-react';

interface Props {
  date: string | null; // 'YYYY-MM-DD'
  members: Member[];
  records: UnavailableRecord[];
  currentMember: Member | null;
  onSetStatus: (date: string, status: RecordStatus | null) => void;
  onClose: () => void;
}

export const DateDetailModal: React.FC<Props> = ({
  date,
  members,
  records,
  currentMember,
  onSetStatus,
  onClose,
}) => {
  if (!date) return null;

  // 해당 날짜의 기록
  const dayRecords = records.filter((r) => r.date === date);
  const recordMap = new Map<number, UnavailableRecord>();
  dayRecords.forEach((r) => recordMap.set(r.member_id, r));

  const unavailableMembers: Member[] = [];
  const fogMembers: Member[] = [];
  const availableMembers: Member[] = [];

  members.forEach((m) => {
    const rec = recordMap.get(m.id);
    if (!rec) {
      availableMembers.push(m);
    } else if (rec.status === 'fog') {
      fogMembers.push(m);
    } else {
      unavailableMembers.push(m);
    }
  });

  const myRecord = currentMember ? recordMap.get(currentMember.id) : undefined;
  const myCurrentStatus: RecordStatus | 'available' = myRecord
    ? myRecord.status === 'fog'
      ? 'fog'
      : 'unavailable'
    : 'available';

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeekStr = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col relative max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 날짜 헤더 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {month}월 {day}일 ({dayOfWeekStr})
            </h3>
            <p className="text-xs text-slate-500">
              가능 {availableMembers.length}명 · 안개 {fogMembers.length}명 · 불가 {unavailableMembers.length}명
            </p>
          </div>
        </div>

        {/* 내 상태 선택 버튼 3단 컨트롤러 */}
        {currentMember && (
          <div className="mb-4 p-2 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 mb-1.5 px-1">
              내 일정 설정 ({currentMember.name})
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onSetStatus(date, 'unavailable')}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                  myCurrentStatus === 'unavailable'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>불가</span>
              </button>

              <button
                onClick={() => onSetStatus(date, 'fog')}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                  myCurrentStatus === 'fog'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                }`}
              >
                <CloudFog className="w-4 h-4" />
                <span>안개</span>
              </button>

              <button
                onClick={() => onSetStatus(date, null)}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                  myCurrentStatus === 'available'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>가능</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3.5 overflow-y-auto max-h-56 pr-1">
          {/* 불가 인원 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>불가능한 멤버 ({unavailableMembers.length}명)</span>
            </div>
            {unavailableMembers.length === 0 ? (
              <p className="text-[11px] text-slate-400 pl-4">없음</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {unavailableMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-2xs"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 안개 인원 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-white"></span>
              <span>안개 (미정) 멤버 ({fogMembers.length}명)</span>
            </div>
            {fogMembers.length === 0 ? (
              <p className="text-[11px] text-slate-400 pl-4">없음</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {fogMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border-2 bg-white"
                    style={{ borderColor: m.color, color: m.color }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 가능 인원 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>가능한 멤버 ({availableMembers.length}명)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableMembers.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: m.color }}
                  ></span>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
        >
          확인 완료
        </button>
      </div>
    </div>
  );
};
