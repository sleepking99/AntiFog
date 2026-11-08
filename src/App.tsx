import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_MEMBERS } from './config/members';
import { Member, RecordStatus, UnavailableRecord, ViewMode } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Calendar } from './components/Calendar';
import { MemberSelectModal } from './components/MemberSelectModal';
import { DateDetailModal } from './components/DateDetailModal';
import { AllStatusModal } from './components/AllStatusModal';
import { 
  Users, 
  CalendarDays, 
  CalendarCheck, 
  XCircle, 
  CloudFog,
  Radio, 
  Info, 
  HelpCircle
} from 'lucide-react';

const LOCAL_STORAGE_RECORDS_KEY = 'antifog_local_unavailable_records';
const LOCAL_STORAGE_MEMBER_KEY = 'antifog_my_member_id';

export default function App() {
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [records, setRecords] = useState<UnavailableRecord[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  
  // 모드: 'edit-unavailable'(아예 불가) vs 'edit-fog'(안개)
  const [mode, setMode] = useState<ViewMode>('edit-unavailable');
  
  // 모달 제어
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isAllStatusOpen, setIsAllStatusOpen] = useState(false);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // 1. 초기 사용자 복원 및 데이터 로드
  useEffect(() => {
    const savedMemberId = localStorage.getItem(LOCAL_STORAGE_MEMBER_KEY);
    if (savedMemberId) {
      const found = members.find((m) => m.id === Number(savedMemberId));
      if (found) {
        setCurrentMember(found);
      } else {
        setIsMemberModalOpen(true);
      }
    } else {
      setIsMemberModalOpen(true);
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: memberData } = await supabase.from('members').select('*').order('id');
        if (memberData && memberData.length > 0) {
          setMembers(memberData);
        }

        const { data: recordData, error } = await supabase.from('unavailable_dates').select('*');
        if (!error && recordData) {
          setRecords(recordData);
        }
      } catch (err) {
        console.error('Supabase 데이터 로드 실패, 로컬 모드로 동작합니다.', err);
        loadLocalRecords();
      }
    } else {
      loadLocalRecords();
    }
  };

  const loadLocalRecords = () => {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY);
    if (raw) {
      try {
        setRecords(JSON.parse(raw));
      } catch {
        setRecords([]);
      }
    }
  };

  // 2. Supabase Realtime 구독 (실시간 동기화)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unavailable_dates' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as UnavailableRecord;
            setRecords((prev) => {
              const filtered = prev.filter(
                (r) => !(r.member_id === newRecord.member_id && r.date === newRecord.date)
              );
              return [...filtered, newRecord];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as UnavailableRecord;
            setRecords((prev) =>
              prev.map((r) =>
                r.member_id === updated.member_id && r.date === updated.date ? updated : r
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as { id: number; member_id?: number; date?: string };
            setRecords((prev) => prev.filter((r) => r.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // 3. 내 멤버 선택 핸들러
  const handleSelectMember = (member: Member) => {
    setCurrentMember(member);
    localStorage.setItem(LOCAL_STORAGE_MEMBER_KEY, String(member.id));
    setIsMemberModalOpen(false);
  };

  // 4. 날짜 상태 직접 지정 핸들러 (null이면 삭제)
  const handleSetStatus = useCallback(
    async (date: string, status: RecordStatus | null) => {
      if (!currentMember) {
        setIsMemberModalOpen(true);
        return;
      }

      if (status === null) {
        // 삭제 (가능으로 변경)
        if (isSupabaseConfigured && supabase) {
          await supabase
            .from('unavailable_dates')
            .delete()
            .match({ member_id: currentMember.id, date });
        } else {
          const nextRecords = records.filter(
            (r) => !(r.member_id === currentMember.id && r.date === date)
          );
          setRecords(nextRecords);
          localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(nextRecords));
        }
      } else {
        // 등록 or 수정 (불가 or 안개)
        if (isSupabaseConfigured && supabase) {
          try {
            // upsert 시도
            const { error } = await supabase.from('unavailable_dates').upsert(
              {
                member_id: currentMember.id,
                date,
                status,
              },
              { onConflict: 'member_id,date' }
            );

            // status 컬럼이 아직 DB에 없을 때의 폴백
            if (error && error.message && error.message.includes('status')) {
              await supabase.from('unavailable_dates').upsert(
                {
                  member_id: currentMember.id,
                  date,
                },
                { onConflict: 'member_id,date' }
              );
            }
          } catch (e) {
            console.error('기록 저장 실패:', e);
          }
        } else {
          const filtered = records.filter(
            (r) => !(r.member_id === currentMember.id && r.date === date)
          );
          const nextRecords: UnavailableRecord[] = [
            ...filtered,
            { id: Date.now(), member_id: currentMember.id, date, status },
          ];
          setRecords(nextRecords);
          localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(nextRecords));
        }
      }
    },
    [currentMember, records]
  );

  // 5. 캘린더 날짜 클릭 핸들러 (현재 선택된 모드에 따라 토글)
  const handleDateClick = (date: string) => {
    if (!currentMember) {
      setIsMemberModalOpen(true);
      return;
    }

    const existing = records.find(
      (r) => r.member_id === currentMember.id && r.date === date
    );

    const targetStatus: RecordStatus = mode === 'edit-fog' ? 'fog' : 'unavailable';

    if (existing) {
      if (existing.status === targetStatus || (!existing.status && targetStatus === 'unavailable')) {
        // 같은 상태를 다시 누르면 해제(가능)
        handleSetStatus(date, null);
      } else {
        // 다른 상태면 전환 (불가 <-> 안개)
        handleSetStatus(date, targetStatus);
      }
    } else {
      // 새로운 등록
      handleSetStatus(date, targetStatus);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* 상단 네비게이션 바 */}
      <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black shadow-sm">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-800 leading-tight">
                지실 캘린더
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                {isSupabaseConfigured ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Radio className="w-3 h-3 animate-pulse" /> 실시간 동기화 ON
                  </span>
                ) : (
                  <button
                    onClick={() => setShowConfigHelp(true)}
                    className="flex items-center gap-1 text-amber-600 hover:underline"
                  >
                    <Info className="w-3 h-3" /> 로컬 데모 모드 (설정 안내)
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 상단 '전체 현황' 버튼 */}
            <button
              onClick={() => setIsAllStatusOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 bg-white transition active:scale-95 shadow-2xs text-xs font-bold text-slate-700"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>전체 현황</span>
            </button>

            {/* 현재 로그인 프로필 버튼 */}
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition active:scale-95 shadow-2xs"
            >
              {currentMember ? (
                <>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentMember.color }}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {currentMember.name}
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> 이름 선택
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="w-full max-w-2xl px-4 py-4 flex-1">
        {/* 모드 선택 토글 바: [ 아예 불가 ] | [ 안개 ] */}
        <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between mb-4 gap-1.5">
          <button
            onClick={() => setMode('edit-unavailable')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'edit-unavailable'
                ? 'bg-rose-50 text-rose-600 shadow-xs border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>아예 불가</span>
          </button>

          <button
            onClick={() => setMode('edit-fog')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'edit-fog'
                ? 'bg-amber-50 text-amber-600 shadow-xs border border-amber-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CloudFog className="w-4 h-4 text-amber-500" />
            <span>안개</span>
          </button>
        </div>

        {/* 현재 로그인 멤버 안내 */}
        {currentMember && (
          <div className="mb-2 px-2 flex items-center justify-end text-xs text-slate-500">
            <span className="text-[11px] text-slate-400">
              현재: <b style={{ color: currentMember.color }}>{currentMember.name}</b>
            </span>
          </div>
        )}

        {/* 메인 캘린더 */}
        <Calendar
          members={members}
          records={records}
          currentMember={currentMember}
          mode={mode}
          onDateClick={handleDateClick}
          selectedDate={selectedDateForDetail}
        />
      </main>

      {/* 하단 푸터 */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-auto leading-relaxed">
        <p>Copyright © 2026 지실</p>
        <p>모든 저작권은 지실에 있음. 무단 배포시 알아서 하셈.</p>
      </footer>

      {/* 모달들 */}
      <MemberSelectModal
        members={members}
        currentMember={currentMember}
        onSelectMember={handleSelectMember}
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />

      <DateDetailModal
        date={selectedDateForDetail}
        members={members}
        records={records}
        currentMember={currentMember}
        onSetStatus={handleSetStatus}
        onClose={() => setSelectedDateForDetail(null)}
      />

      <AllStatusModal
        isOpen={isAllStatusOpen}
        onClose={() => setIsAllStatusOpen(false)}
        members={members}
        records={records}
        onSelectDate={(date) => {
          setSelectedDateForDetail(date);
        }}
      />

      {/* Supabase 설정 안내 팝업 */}
      {showConfigHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <HelpCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Supabase 실시간 연동 방법</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 overflow-y-auto pr-1">
              <p>
                현재는 브라우저 로컬 저장소로 작동하는 데모 모드입니다.
                9명이 서로 실시간으로 일정을 공유하려면 무료 Supabase를 연결해주시면 됩니다:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li>supabase.com 회원가입 후 무료 프로젝트 1개 생성</li>
                <li>좌측 SQL Editor 메뉴에서 supabase/schema.sql 내용 실행</li>
                <li>Project Settings -&gt; API에서 Project URL과 anon public key 복사</li>
                <li>프로젝트 루트에 .env 파일을 만들고 붙여넣기</li>
              </ol>
            </div>
            <button
              onClick={() => setShowConfigHelp(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
