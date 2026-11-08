import React from 'react';
import { Member, UnavailableRecord } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, X } from 'lucide-react';

interface Props {
  date: string | null; // 'YYYY-MM-DD'
  members: Member[];
  records: UnavailableRecord[];
  currentMember: Member | null;
  onToggleDate: (date: string) => void;
  onClose: () => void;
}

export const DateDetailModal: React.FC<Props> = ({
  date,
  members,
  records,
  currentMember,
  onToggleDate,
  onClose,
}) => {
  if (!date) return null;

  // 해당 날짜에 불가능한 사람의 ID 세트
  const unavailableMemberIds = new Set(
    records.filter((r) => r.date === date).map((r) => r.member_id)
  );

  const unavailableMembers = members.filter((m) => unavailableMemberIds.has(m.id));
  const availableMembers = members.filter((m) => !unavailableMemberIds.has(m.id));

  const isCurrentMemberUnavailable = currentMember
    ? unavailableMemberIds.has(currentMember.id)
    : false;

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
              참여 가능 {availableMembers.length}명 / 불가 {unavailableMembers.length}명
            </p>
          </div>
        </div>

        {/* 내 상태 토글 버튼 */}
        {currentMember && (
          <button
            onClick={() => onToggleDate(date)}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-4 transition-all active:scale-95 shadow-sm ${
              isCurrentMemberUnavailable
                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isCurrentMemberUnavailable ? (
              <>
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>나({currentMember.name}): 현재 <b>불가</b> (가능으로 변경)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>나({currentMember.name}): 현재 <b>가능</b> (불가로 변경)</span>
              </>
            )}
          </button>
        )}

        <div className="space-y-4 overflow-y-auto max-h-60 pr-1">
          {/* 불가 인원 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 mb-2">
              <XCircle className="w-4 h-4" />
              <span>불가능한 멤버 ({unavailableMembers.length}명)</span>
            </div>
            {unavailableMembers.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl text-center">
                🎉 모든 인원이 참여 가능합니다!
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {unavailableMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-xs"
                    style={{ backgroundColor: m.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
                    {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 가능 인원 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-2">
              <CheckCircle2 className="w-4 h-4" />
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
          className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
        >
          확인 완료
        </button>
      </div>
    </div>
  );
};
