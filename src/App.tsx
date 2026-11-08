import { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { DEFAULT_MEMBERS } from './config/members';
import { Member, UnavailableRecord, ViewMode } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Calendar } from './components/Calendar';
import { MemberSelectModal } from './components/MemberSelectModal';
import { DateDetailModal } from './components/DateDetailModal';
import { BestDaysBanner } from './components/BestDaysBanner';
import { 
  Users, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  Radio, 
  Info, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

const LOCAL_STORAGE_RECORDS_KEY = 'antifog_local_unavailable_records';
const LOCAL_STORAGE_MEMBER_KEY = 'antifog_my_member_id';

export default function App() {
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [records, setRecords] = useState<UnavailableRecord[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  
  // 모드: 'view'(상세보기) vs 'edit-unavailable'(불가 날짜 터치 선택 모드)
  const [mode, setMode] = useState<ViewMode>('edit-unavailable');
  
  // 모달 제어
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // 1. 초기 사용자 복원 및 데이터 로드
  useEffect(() => {
    // 저장된 내 멤버 ID 복원
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

    // 데이터베이스 또는 로컬 스토리지에서 기록 불러오기
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        // 멤버 목록 가져오기
        const { data: memberData } = await supabase.from('members').select('*');
        if (memberData && memberData.length > 0) {
          setMembers(memberData);
        }

        // 불가능 날짜 기록 가져오기
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
              if (prev.some((r) => r.member_id === newRecord.member_id && r.date === newRecord.date)) {
                return prev;
              }
              return [...prev, newRecord];
            });
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

  // 4. 불가능 날짜 토글 핸들러
  const handleToggleUnavailableDate = useCallback(
    async (date: string) => {
      if (!currentMember) {
        setIsMemberModalOpen(true);
        return;
      }

      const existing = records.find(
        (r) => r.member_id === currentMember.id && r.date === date
      );

      if (existing) {
        // 이미 불가능 등록되어 있으면 -> 삭제(가능으로 변경)
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase
            .from('unavailable_dates')
            .delete()
            .match({ member_id: currentMember.id, date });
          if (error) console.error('삭제 오류:', error);
        } else {
          // 로컬 모드
          const nextRecords = records.filter(
            (r) => !(r.member_id === currentMember.id && r.date === date)
          );
          setRecords(nextRecords);
          localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(nextRecords));
        }
      } else {
        // 새로 불가능 등록
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from('unavailable_dates').insert({
            member_id: currentMember.id,
            date,
          });
          if (error) console.error('등록 오류:', error);
        } else {
          // 로컬 모드
          const nextRecords: UnavailableRecord[] = [
            ...records,
            { id: Date.now(), member_id: currentMember.id, date },
          ];
          setRecords(nextRecords);
          localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(nextRecords));
        }
      }
    },
    [currentMember, records]
  );

  // 5. 캘린더 날짜 클릭 핸들러
  const handleDateClick = (date: string) => {
    if (mode === 'edit-unavailable') {
      // 바로 불가능 날짜 토글
      handleToggleUnavailableDate(date);
    } else {
      // 상세 보기 모달 오픈
      setSelectedDateForDetail(date);
    }
  };

  // 추천 날짜 클릭 시 축하 이펙트 & 상세 오픈
  const handleSelectBestDate = (date: string) => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    setSelectedDateForDetail(date);
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
                9인의 모임 날짜 조율
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

          {/* 현재 로그인 프로필 버튼 */}
          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition active:scale-95 shadow-2xs"
          >
            {currentMember ? (
              <>
                <span
                  className="w-3.5 h-3.5 rounded-full"
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
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="w-full max-w-2xl px-4 py-4 flex-1">
        {/* 모드 선택 토글 바 */}
        <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between mb-4">
          <button
            onClick={() => setMode('edit-unavailable')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'edit-unavailable'
                ? 'bg-rose-50 text-rose-600 shadow-xs border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>❌ 불가 날짜 선택 모드</span>
          </button>

          <button
            onClick={() => setMode('view')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'view'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-indigo-500" />
            <span>👀 전체 현황 보기 모드</span>
          </button>
        </div>

        {/* 현재 모드 안내 문구 */}
        <div className="mb-3 px-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            {mode === 'edit-unavailable' ? (
              <span className="font-semibold text-rose-600">
                👉 달력에서 내가 <b>안 되는 날짜</b>를 탭하면 즉시 등록/해제됩니다.
              </span>
            ) : (
              <span className="font-semibold text-indigo-600">
                👉 달력의 날짜를 탭하면 누가 되는지 <b>상세 명단</b>을 봅니다.
              </span>
            )}
          </span>
          {currentMember && (
            <span className="text-[11px] text-slate-400">
              현재: <b style={{ color: currentMember.color }}>{currentMember.name}</b>
            </span>
          )}
        </div>

        {/* 1순위 추천 Best Days 배너 */}
        <BestDaysBanner
          records={records}
          totalMembersCount={members.length}
          onSelectDate={handleSelectBestDate}
        />

        {/* 메인 캘린더 */}
        <Calendar
          members={members}
          records={records}
          currentMember={currentMember}
          mode={mode}
          onDateClick={handleDateClick}
          selectedDate={selectedDateForDetail}
        />

        {/* 9명 멤버 식별 색상 가이드 카드 */}
        <div className="mt-5 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>9명의 고유 식별 색상</span>
            </h3>
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="text-[11px] text-indigo-600 font-semibold hover:underline"
            >
              내 이름 변경
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {members.map((m) => {
              const isMe = currentMember?.id === m.id;
              const unavailCount = records.filter((r) => r.member_id === m.id).length;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMember(m)}
                  className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition active:scale-95 ${
                    isMe
                      ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-300'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: m.color }}
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {m.name} {isMe && '★'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      불가 {unavailCount}일
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-auto">
        <p className="flex items-center justify-center gap-1">
          <span>별도 앱 설치 없이 링크만으로 공유하는 모임 조율기</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </p>
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
        onToggleDate={handleToggleUnavailableDate}
        onClose={() => setSelectedDateForDetail(null)}
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
                현재는 브라우저 로컬 저장소로 작동하는 <b>데모 모드</b>입니다.
                9명이 서로 실시간으로 일정을 공유하려면 <b>무료 Supabase</b>를 연결해주시면 됩니다:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li><b>supabase.com</b> 회원가입 후 무료 프로젝트 1개 생성</li>
                <li>좌측 <b>SQL Editor</b> 메뉴에 들어가서 프로젝트 루트의 <code className="bg-slate-200 px-1 py-0.5 rounded">supabase/schema.sql</code> 내용 복사-붙여넣기 후 Run 클릭</li>
                <li><b>Project Settings -&gt; API</b>에서 Project URL과 anon public key 복사</li>
                <li>프로젝트 루트에 <code className="bg-slate-200 px-1 py-0.5 rounded">.env</code> 파일을 만들고 위 키를 붙여넣기</li>
              </ol>
              <p className="text-[11px] text-slate-400">
                GitHub에 커밋 후 Vercel에 배포할 때는 Vercel 프로젝트의 Environment Variables에 이 두 값을 넣어주시면 즉시 배포됩니다.
              </p>
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
