import { Member } from '../types';

/**
 * 9명의 기본 멤버 정보
 * 이름은 실제 모임 인원 이름으로 언제든 변경할 수 있습니다.
 */
export const DEFAULT_MEMBERS: Member[] = [
  { id: 1, name: '멤버 1', color: '#EF4444' }, // Red
  { id: 2, name: '멤버 2', color: '#F97316' }, // Orange
  { id: 3, name: '멤버 3', color: '#F59E0B' }, // Amber
  { id: 4, name: '멤버 4', color: '#10B981' }, // Emerald
  { id: 5, name: '멤버 5', color: '#06B6D4' }, // Cyan
  { id: 6, name: '멤버 6', color: '#3B82F6' }, // Blue
  { id: 7, name: '멤버 7', color: '#6366F1' }, // Indigo
  { id: 8, name: '멤버 8', color: '#8B5CF6' }, // Purple
  { id: 9, name: '멤버 9', color: '#EC4899' }, // Pink
];
