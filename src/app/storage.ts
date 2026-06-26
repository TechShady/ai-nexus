import { Tag, SkillItem, PromptItem, DashboardItem, AppItem, BestPracticeItem, Collection } from './types';

const STORAGE_KEYS = {
  tags: 'ai-nexus-tags',
  skills: 'ai-nexus-skills',
  prompts: 'ai-nexus-prompts',
  dashboards: 'ai-nexus-dashboards',
  apps: 'ai-nexus-apps',
  bestPractices: 'ai-nexus-best-practices',
  collections: 'ai-nexus-collections',
  deletedIds: 'ai-nexus-deleted-ids',
} as const;

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Tags
export function loadTags(): Tag[] {
  return loadFromStorage<Tag>(STORAGE_KEYS.tags, [
    { id: 'tag-1', name: 'Business', color: '#4589FF' },
    { id: 'tag-2', name: 'K8s', color: '#6929C4' },
    { id: 'tag-3', name: 'Infrastructure', color: '#1192E8' },
    { id: 'tag-4', name: 'Security', color: '#9F1853' },
    { id: 'tag-5', name: 'Observability', color: '#198038' },
  ]);
}

export function saveTags(tags: Tag[]): void {
  saveToStorage(STORAGE_KEYS.tags, tags);
}

// Skills
export function loadSkills(): SkillItem[] {
  return loadFromStorage<SkillItem>(STORAGE_KEYS.skills, []);
}

export function saveSkills(items: SkillItem[]): void {
  saveToStorage(STORAGE_KEYS.skills, items);
}

// Prompts
export function loadPrompts(): PromptItem[] {
  return loadFromStorage<PromptItem>(STORAGE_KEYS.prompts, []);
}

export function savePrompts(items: PromptItem[]): void {
  saveToStorage(STORAGE_KEYS.prompts, items);
}

// Dashboards
export function loadDashboards(): DashboardItem[] {
  return loadFromStorage<DashboardItem>(STORAGE_KEYS.dashboards, []);
}

export function saveDashboards(items: DashboardItem[]): void {
  saveToStorage(STORAGE_KEYS.dashboards, items);
}

// Apps
export function loadApps(): AppItem[] {
  return loadFromStorage<AppItem>(STORAGE_KEYS.apps, []);
}

export function saveApps(items: AppItem[]): void {
  saveToStorage(STORAGE_KEYS.apps, items);
}

// Best Practices
export function loadBestPractices(): BestPracticeItem[] {
  return loadFromStorage<BestPracticeItem>(STORAGE_KEYS.bestPractices, []);
}

export function saveBestPractices(items: BestPracticeItem[]): void {
  saveToStorage(STORAGE_KEYS.bestPractices, items);
}

// Collections
export function loadCollections(): Collection[] {
  return loadFromStorage<Collection>(STORAGE_KEYS.collections, []);
}

export function saveCollections(items: Collection[]): void {
  saveToStorage(STORAGE_KEYS.collections, items);
}

// Deleted IDs (tombstones)
export function loadDeletedIds(): { id: string; deletedAt: string }[] {
  return loadFromStorage<{ id: string; deletedAt: string }>(STORAGE_KEYS.deletedIds, []);
}

export function saveDeletedIds(items: { id: string; deletedAt: string }[]): void {
  saveToStorage(STORAGE_KEYS.deletedIds, items);
}
