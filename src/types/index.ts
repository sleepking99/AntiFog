export interface Member {
  id: number;
  name: string;
  color: string;
  avatarText?: string;
}

export type RecordStatus = 'unavailable' | 'fog';

export interface UnavailableRecord {
  id?: number | string;
  member_id: number;
  date: string; // 'YYYY-MM-DD'
  status?: RecordStatus; // 'unavailable' (불가 - 꽉 찬 dot) | 'fog' (안개 - 비어있는 dot)
  created_at?: string;
}

export type ViewMode = 'all' | 'edit-unavailable' | 'edit-fog';
