import React from 'react';
import { Member } from '../types';
import { Check, User } from 'lucide-react';

interface Props {
  members: Member[];
  currentMember: Member | null;
  onSelectMember: (member: Member) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const MemberSelectModal: React.FC<Props> = ({
  members,
  currentMember,
  onSelectMember,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">본인의 이름을 선택해주세요</h2>
          <p className="text-xs text-slate-500 mt-1">
            선택한 이름으로 모임 불가능한 날짜를 등록할 수 있습니다.
          </p>
        </div>

        {/* 9명 3x3 그리드 */}
        <div className="grid grid-cols-3 gap-3 overflow-y-auto p-1">
          {members.map((member) => {
            const isSelected = currentMember?.id === member.id;
            return (
              <button
                key={member.id}
                onClick={() => {
                  onSelectMember(member);
                  if (onClose) onClose();
                }}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95 text-center ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-200'
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* 인원별 고유 컬러 아바타 */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm mb-2"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.slice(-2)}
                </div>

                <span className="text-sm font-semibold text-slate-800 truncate w-full">
                  {member.name}
                </span>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {currentMember && onClose && (
          <button
            onClick={onClose}
            className="mt-5 w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
};
