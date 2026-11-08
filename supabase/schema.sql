-- ==========================================================
-- 1. 9명 모임 날짜 조율 데이터베이스 스키마 (지실 캘린더)
-- ==========================================================

-- 기존 테이블 삭제 (초기화 필요시)
-- DROP TABLE IF EXISTS unavailable_dates CASCADE;
-- DROP TABLE IF EXISTS members CASCADE;

-- 1) 9명 고정 멤버 테이블
CREATE TABLE IF NOT EXISTS members (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2) 멤버별 불가능한 날짜 테이블
CREATE TABLE IF NOT EXISTS unavailable_dates (
  id BIGSERIAL PRIMARY KEY,
  member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD' 형식 (간결하고 타임존 왜곡 없음)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, date)
);

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

-- 4) Row Level Security (RLS) 활성화 및 누구나 읽고 쓸 수 있도록 허용 (익명 접근 편의성)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (익명 읽기/쓰기 허용)
CREATE POLICY "Allow public read on members" 
  ON members FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow public read on unavailable_dates" 
  ON unavailable_dates FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow public insert on unavailable_dates" 
  ON unavailable_dates FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Allow public delete on unavailable_dates" 
  ON unavailable_dates FOR DELETE 
  TO public 
  USING (true);

-- 5) Supabase 실시간 동기화 (Realtime) 켜기
ALTER PUBLICATION supabase_realtime ADD TABLE unavailable_dates;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
