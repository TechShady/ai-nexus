export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export type ItemStatus = 'draft' | 'active' | 'verified' | 'deprecated';

export interface SkillItem {
  id: string;
  skill: string;
  repoUrl: string;
  description: string;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  pinned?: boolean;
  status?: ItemStatus;
  rating?: number;
  ratingCount?: number;
  usageCount?: number;
  comments?: Comment[];
}

export interface PromptItem {
  id: string;
  prompt: string;
  promptText: string;
  description: string;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  pinned?: boolean;
  status?: ItemStatus;
  rating?: number;
  ratingCount?: number;
  usageCount?: number;
  comments?: Comment[];
}

export interface DashboardItem {
  id: string;
  name: string;
  dashboardUrl: string;
  description: string;
  author: string;
  repoUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  pinned?: boolean;
  status?: ItemStatus;
  rating?: number;
  ratingCount?: number;
  usageCount?: number;
  comments?: Comment[];
}

export interface AppItem {
  id: string;
  name: string;
  appUrl: string;
  description: string;
  author: string;
  repoUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  pinned?: boolean;
  status?: ItemStatus;
  rating?: number;
  ratingCount?: number;
  usageCount?: number;
  comments?: Comment[];
}

export interface BestPracticeItem {
  id: string;
  author: string;
  title: string;
  practices: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  status?: ItemStatus;
  rating?: number;
  ratingCount?: number;
  comments?: Comment[];
}

export interface CollectionItem {
  id: string;
  type: TabType;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  author: string;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export type AnyItem = SkillItem | PromptItem | DashboardItem | AppItem | BestPracticeItem;

export type TabType = 'skills' | 'prompts' | 'dashboards' | 'apps' | 'bestpractices';

export type SortField = 'updated' | 'created' | 'name' | 'rating' | 'usage';
export type SortDirection = 'asc' | 'desc';

export const TAG_COLORS = [
  '#4589FF', '#A56EFF', '#1192E8', '#08BDBA', '#EE5396',
  '#FA4D56', '#FF832B', '#24A148', '#6EA6FF', '#BE95FF',
  '#F1C21B', '#FF7EB6', '#3DDBD9', '#82CFFF', '#42BE65',
];

export const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: '#878D96', icon: '📝' },
  active: { label: 'Active', color: '#4589FF', icon: '✅' },
  verified: { label: 'Verified', color: '#24A148', icon: '🏆' },
  deprecated: { label: 'Deprecated', color: '#FA4D56', icon: '⚠️' },
};
