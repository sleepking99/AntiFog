-- ==========================================================
-- 지실 캘린더 데이터베이스 스키마
-- ==========================================================

-- 1) 9명 고정 멤버 테이블
CREATE TABLE IF NOT EXISTS members (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2) 멤버별 일정 상태 테이블 (불가 or 안개)
CREATE TABLE IF NOT EXISTS unavailable_dates (
  id BIGSERIAL PRIMARY KEY,
  member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
  status VARCHAR(20) DEFAULT 'unavailable', -- 'unavailable'(불가) or 'fog'(안개)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- 기존 테이블이 이미 생성되어 있는 경우 status 컬럼 추가
ALTER TABLE unavailable_dates ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unavailable';

-- 3) 기본 9명 멤버 등록
INSERT INTO members (id, name, color) VALUES
  (1, '정인수', '#EF4444'),
  (2, '서일훈', '#F97316'),
  (3, '한태환', '#F59E0B'),
  (4, '박상준', '#10B981'),
  (5, '이상재', '#06B6D4'),
  (6, '이찬빈', '#3B82F6'),
  (7, '그거',   '#6366F1'),
  (8, '이재훈', '#8B5CF6'),
  (9, '정일환', '#EC4899')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, color = EXCLUDED.color;

-- 4) Row Level Security (RLS) 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- 5) 실시간(Realtime) 동기화 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE unavailable_dates;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
