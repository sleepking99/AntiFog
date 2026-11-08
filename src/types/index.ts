export interface Member {
  id: number;
  name: string;
  color: string;
  avatarText?: string;
}

export interface UnavailableRecord {
  id?: number | string;
  member_id: number;
  date: string; // 'YYYY-MM-DD'
  created_at?: string;
}

export type ViewMode = 'view' | 'edit-unavailable';
