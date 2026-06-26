import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Page } from '@dynatrace/strato-components-preview/layouts';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Button } from '@dynatrace/strato-components/buttons';
import { Heading, Text } from '@dynatrace/strato-components/typography';
import {
  CodeIcon,
  DocumentIcon,
  ChartCollectionIcon,
  AppsIcon,
  SettingIcon,
  PlusIcon,
  UploadIcon,
  DownloadIcon,
  CheckmarkIcon,
  HelpIcon,
  HomeIcon,
} from '@dynatrace/strato-icons';

import { TabType, Tag, SkillItem, PromptItem, DashboardItem, AppItem, BestPracticeItem, Collection, SortField, SortDirection, Comment } from './types';
import {
  loadTags, saveTags,
  loadSkills, saveSkills,
  loadPrompts, savePrompts,
  loadDashboards, saveDashboards,
  loadApps, saveApps,
  loadBestPractices, saveBestPractices,
  loadCollections, saveCollections,
  loadDeletedIds, saveDeletedIds,
  generateId,
} from './storage';
import { ItemTable } from './components/ItemTable';
import { DetailModal } from './components/DetailModal';
import { EditModal } from './components/EditModal';
import { SettingsModal } from './components/SettingsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CsvImportModal } from './components/CsvImportModal';
import { SearchFilterBar } from './components/SearchFilterBar';
import { StatsOverview } from './components/StatsOverview';
import { BestPracticesTab } from './components/BestPracticesTab';
import { BestPracticeEditModal } from './components/BestPracticeEditModal';
import { HelpModal } from './components/HelpModal';
import { CollectionsPanel } from './components/CollectionsPanel';
import { exportToCsv } from './utils/csv';
import { loadAllFromDocStore, saveToDocStore, claimShares, bootstrapSharing } from './documentStore';

import './styles/app.css';

// Auto-tag suggestion based on description keywords
function suggestTags(description: string, existingTags: Tag[]): string[] {
  const text = description.toLowerCase();
  const suggestions: string[] = [];
  const keywords: Record<string, string[]> = {
    'K8s': ['kubernetes', 'k8s', 'pod', 'container', 'helm', 'cluster', 'deployment', 'namespace'],
    'Infrastructure': ['host', 'server', 'cpu', 'memory', 'disk', 'network', 'infrastructure', 'vm'],
    'Security': ['security', 'vulnerability', 'threat', 'attack', 'compliance', 'audit', 'cve'],
    'Observability': ['observability', 'monitoring', 'metric', 'trace', 'log', 'alert', 'slo', 'sli'],
    'Business': ['business', 'revenue', 'customer', 'conversion', 'funnel', 'kpi', 'sla'],
  };
  for (const [tagName, words] of Object.entries(keywords)) {
    if (existingTags.some(t => t.name === tagName) && words.some(w => text.includes(w))) {
      suggestions.push(tagName);
    }
  }
  return suggestions;
}

// Duplicate detection
function findDuplicates(newItem: any, existingItems: any[], tabType: TabType): any[] {
  const getSearchText = (item: any) => {
    if (tabType === 'skills') return `${item.skill || ''} ${item.description || ''}`.toLowerCase();
    if (tabType === 'prompts') return `${item.prompt || ''} ${item.description || ''}`.toLowerCase();
    if (tabType === 'dashboards') return `${item.dashboardUrl || ''} ${item.description || ''}`.toLowerCase();
    if (tabType === 'apps') return `${item.appUrl || ''} ${item.description || ''}`.toLowerCase();
    return `${item.title || ''} ${(item.practices || []).join(' ')}`.toLowerCase();
  };
  const newText = getSearchText(newItem);
  if (newText.trim().length < 10) return [];
  const newWords = new Set(newText.split(/\s+/).filter(w => w.length > 3));
  return existingItems.filter(existing => {
    if (existing.id === newItem.id) return false;
    const existingText = getSearchText(existing);
    const existingWords = new Set(existingText.split(/\s+/).filter((w: string) => w.length > 3));
    const intersection = [...newWords].filter(w => existingWords.has(w));
    const union = new Set([...newWords, ...existingWords]);
    return union.size > 0 && intersection.length / union.size > 0.6;
  }).slice(0, 3);
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [tags, setTags] = useState<Tag[]>(loadTags);
  const [skills, setSkills] = useState<SkillItem[]>(loadSkills);
  const [prompts, setPrompts] = useState<PromptItem[]>(loadPrompts);
  const [dashboards, setDashboards] = useState<DashboardItem[]>(loadDashboards);
  const [apps, setApps] = useState<AppItem[]>(loadApps);
  const [bestPractices, setBestPractices] = useState<BestPracticeItem[]>(loadBestPractices);
  const [collections, setCollections] = useState<Collection[]>(loadCollections);
  const [deletedIds, setDeletedIds] = useState<{ id: string; deletedAt: string }[]>(loadDeletedIds);

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const detectTheme = () => {
      const shellTheme = document.documentElement.getAttribute('data-theme');
      if (!shellTheme) {
        const bg = getComputedStyle(document.body).backgroundColor;
        const match = bg.match(/\d+/g);
        if (match) {
          const luminance = (0.299 * Number(match[0]) + 0.587 * Number(match[1]) + 0.114 * Number(match[2])) / 255;
          if (luminance < 0.5) document.documentElement.setAttribute('data-theme', 'dark');
        }
      }
    };
    detectTheme();
    const timer = setTimeout(detectTheme, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // First claim any existing shares (for non-owners), then load data
    claimShares().finally(() => {
      loadAllFromDocStore().then(data => {
        // Merge: DocStore is source of truth, but also include any local-only items (union by id)
        const merge = <T extends { id: string }>(remote: T[] | null, local: T[]): T[] => {
          if (!remote || remote.length === 0) return local;
          if (local.length === 0) return remote;
          const ids = new Set(remote.map(r => r.id));
          return [...remote, ...local.filter(l => !ids.has(l.id))];
        };

        // Merge deleted IDs first so we can filter everything else
        const mergedDeleted = merge(data.deletedIds, loadDeletedIds());
        const deletedSet = new Set(mergedDeleted.map(d => d.id));
        const purge = <T extends { id: string }>(items: T[]): T[] => items.filter(i => !deletedSet.has(i.id));

        const mergedTags = merge(data.tags, loadTags());
        const mergedSkills = purge(merge(data.skills, loadSkills()));
        const mergedPrompts = purge(merge(data.prompts, loadPrompts()));
        const mergedDashboards = purge(merge(data.dashboards, loadDashboards()));
        const mergedApps = purge(merge(data.apps, loadApps()));
        const mergedBP = purge(merge(data.bestPractices, loadBestPractices()));
        const mergedCollections = merge(data.collections, loadCollections());

        setTags(mergedTags); saveTags(mergedTags);
        setSkills(mergedSkills); saveSkills(mergedSkills);
        setPrompts(mergedPrompts); savePrompts(mergedPrompts);
        setDashboards(mergedDashboards); saveDashboards(mergedDashboards);
        setApps(mergedApps); saveApps(mergedApps);
        setBestPractices(mergedBP); saveBestPractices(mergedBP);
        setCollections(mergedCollections); saveCollections(mergedCollections);
        setDeletedIds(mergedDeleted); saveDeletedIds(mergedDeleted);

        // Re-save all to DocStore and bootstrap sharing (makes public + creates shares)
        saveToDocStore('tags', mergedTags);
        saveToDocStore('skills', mergedSkills);
        saveToDocStore('prompts', mergedPrompts);
        saveToDocStore('dashboards', mergedDashboards);
        saveToDocStore('apps', mergedApps);
        saveToDocStore('bestPractices', mergedBP);
        saveToDocStore('collections', mergedCollections);
        saveToDocStore('deletedIds', mergedDeleted);
        bootstrapSharing();

        setLoaded(true);
      }).catch(() => setLoaded(true));
    });
  }, []);

  const persistTags = useCallback((t: Tag[]) => { saveTags(t); saveToDocStore('tags', t); }, []);
  const persistSkills = useCallback((s: SkillItem[]) => { saveSkills(s); saveToDocStore('skills', s); }, []);
  const persistPrompts = useCallback((p: PromptItem[]) => { savePrompts(p); saveToDocStore('prompts', p); }, []);
  const persistDashboards = useCallback((d: DashboardItem[]) => { saveDashboards(d); saveToDocStore('dashboards', d); }, []);
  const persistApps = useCallback((a: AppItem[]) => { saveApps(a); saveToDocStore('apps', a); }, []);
  const persistBestPractices = useCallback((b: BestPracticeItem[]) => { saveBestPractices(b); saveToDocStore('bestPractices', b); }, []);
  const persistCollections = useCallback((c: Collection[]) => { saveCollections(c); saveToDocStore('collections', c); }, []);
  const persistDeletedIds = useCallback((d: { id: string; deletedAt: string }[]) => { saveDeletedIds(d); saveToDocStore('deletedIds', d); }, []);

  // Modal state
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('edit');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [bpEditItem, setBpEditItem] = useState<BestPracticeItem | null>(null);
  const [bpEditMode, setBpEditMode] = useState<'add' | 'edit'>('add');
  const [showBpEdit, setShowBpEdit] = useState(false);
  const [bpDeleteItem, setBpDeleteItem] = useState<BestPracticeItem | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'tags' | 'author' | 'description'>('tags');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Global search
  const [globalSearch, setGlobalSearch] = useState('');

  // Bulk select
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const currentTabType: TabType = activeTab !== null
    ? (['skills', 'prompts', 'dashboards', 'apps', 'bestpractices'] as const)[activeTab]
    : 'skills';

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setSelectedItems(new Set());
    setShowBulkActions(false);
  };

  // Sort helper
  const sortItems = useCallback(<T extends { updatedAt: string; createdAt: string; rating?: number; usageCount?: number }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'updated') cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      else if (sortField === 'created') cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sortField === 'name') {
        const aName = (a as any).skill || (a as any).prompt || (a as any).dashboardUrl || (a as any).appUrl || (a as any).title || '';
        const bName = (b as any).skill || (b as any).prompt || (b as any).dashboardUrl || (b as any).appUrl || (b as any).title || '';
        cmp = aName.localeCompare(bName);
      }
      else if (sortField === 'rating') cmp = (b.rating || 0) - (a.rating || 0);
      else if (sortField === 'usage') cmp = (b.usageCount || 0) - (a.usageCount || 0);
      return sortDirection === 'asc' ? -cmp : cmp;
    });
  }, [sortField, sortDirection]);

  // Filter logic
  const filterItems = useCallback(<T extends { tags: string[]; favorite?: boolean; description?: string; author?: string; pinned?: boolean }>(items: T[]): T[] => {
    const filtered = items.filter(item => {
      if (showFavoritesOnly && !(item as any).favorite) return false;
      if (selectedTags.length > 0 && !(item.tags || []).some((t: string) => selectedTags.includes(t))) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (searchField === 'tags') return (item.tags || []).some((t: string) => t.toLowerCase().includes(query));
        else if (searchField === 'author') return ((item as any).author || '').toLowerCase().includes(query);
        else return ((item as any).description || '').toLowerCase().includes(query);
      }
      return true;
    });
    const pinned = filtered.filter(i => (i as any).pinned);
    const unpinned = filtered.filter(i => !(i as any).pinned);
    return [...pinned, ...unpinned];
  }, [searchQuery, searchField, selectedTags, showFavoritesOnly]);

  const filteredSkills = useMemo(() => sortItems(filterItems(skills)), [skills, filterItems, sortItems]);
  const filteredPrompts = useMemo(() => sortItems(filterItems(prompts)), [prompts, filterItems, sortItems]);
  const filteredDashboards = useMemo(() => sortItems(filterItems(dashboards)), [dashboards, filterItems, sortItems]);
  const filteredApps = useMemo(() => sortItems(filterItems(apps)), [apps, filterItems, sortItems]);
  const filteredBestPractices = useMemo(() => {
    const filtered = bestPractices.filter(item => {
      if (selectedTags.length > 0 && !(item.tags || []).some((t: string) => selectedTags.includes(t))) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (searchField === 'tags') return (item.tags || []).some((t: string) => t.toLowerCase().includes(query));
        else if (searchField === 'author') return (item.author || '').toLowerCase().includes(query);
        else return (item.title || '').toLowerCase().includes(query) || (item.practices || []).some(p => p.toLowerCase().includes(query));
      }
      return true;
    });
    const pinned = filtered.filter(i => i.pinned);
    const unpinned = filtered.filter(i => !i.pinned);
    return sortItems([...pinned, ...unpinned]);
  }, [bestPractices, searchQuery, searchField, selectedTags, sortItems]);

  // Global search results
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    const results: { item: any; type: TabType; label: string }[] = [];
    skills.forEach(i => { if (`${i.skill} ${i.description} ${i.author}`.toLowerCase().includes(q)) results.push({ item: i, type: 'skills', label: i.skill }); });
    prompts.forEach(i => { if (`${i.prompt} ${i.description} ${i.author}`.toLowerCase().includes(q)) results.push({ item: i, type: 'prompts', label: i.prompt }); });
    dashboards.forEach(i => { if (`${i.dashboardUrl} ${i.description} ${i.author}`.toLowerCase().includes(q)) results.push({ item: i, type: 'dashboards', label: i.description }); });
    apps.forEach(i => { if (`${i.appUrl} ${i.description} ${i.author}`.toLowerCase().includes(q)) results.push({ item: i, type: 'apps', label: i.description }); });
    bestPractices.forEach(i => { if (`${i.title} ${i.author} ${i.practices.join(' ')}`.toLowerCase().includes(q)) results.push({ item: i, type: 'bestpractices', label: i.title }); });
    return results.slice(0, 20);
  }, [globalSearch, skills, prompts, dashboards, apps, bestPractices]);

  // Recently added (last 7 days)
  const recentItems = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const all: { item: any; type: TabType; label: string; date: string }[] = [];
    skills.forEach(i => { if (new Date(i.createdAt).getTime() > cutoff) all.push({ item: i, type: 'skills', label: i.skill, date: i.createdAt }); });
    prompts.forEach(i => { if (new Date(i.createdAt).getTime() > cutoff) all.push({ item: i, type: 'prompts', label: i.prompt, date: i.createdAt }); });
    dashboards.forEach(i => { if (new Date(i.createdAt).getTime() > cutoff) all.push({ item: i, type: 'dashboards', label: i.description, date: i.createdAt }); });
    apps.forEach(i => { if (new Date(i.createdAt).getTime() > cutoff) all.push({ item: i, type: 'apps', label: i.description, date: i.createdAt }); });
    bestPractices.forEach(i => { if (new Date(i.createdAt).getTime() > cutoff) all.push({ item: i, type: 'bestpractices', label: i.title, date: i.createdAt }); });
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [skills, prompts, dashboards, apps, bestPractices]);

  // Most popular
  const popularItems = useMemo(() => {
    const all: { item: any; type: TabType; label: string; score: number }[] = [];
    skills.forEach(i => all.push({ item: i, type: 'skills', label: i.skill, score: (i.usageCount || 0) + (i.rating || 0) * 10 }));
    prompts.forEach(i => all.push({ item: i, type: 'prompts', label: i.prompt, score: (i.usageCount || 0) + (i.rating || 0) * 10 }));
    dashboards.forEach(i => all.push({ item: i, type: 'dashboards', label: i.description, score: (i.usageCount || 0) + (i.rating || 0) * 10 }));
    apps.forEach(i => all.push({ item: i, type: 'apps', label: i.description, score: (i.usageCount || 0) + (i.rating || 0) * 10 }));
    return all.filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [skills, prompts, dashboards, apps]);

  // Stale items count
  const staleCount = useMemo(() => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    return [...skills, ...prompts, ...dashboards, ...apps, ...bestPractices]
      .filter(i => new Date(i.updatedAt).getTime() < cutoff).length;
  }, [skills, prompts, dashboards, apps, bestPractices]);

  // Activity feed
  const [activityPaused, setActivityPaused] = useState(false);
  const activityFeed = useMemo(() => {
    const entries: { text: string; time: number }[] = [];
    const now = Date.now();
    const cutoff = now - 30 * 24 * 60 * 60 * 1000; // last 30 days
    skills.forEach(i => {
      if (new Date(i.createdAt).getTime() > cutoff) entries.push({ text: `${i.author || 'Someone'} added a skill: ${i.skill}`, time: new Date(i.createdAt).getTime() });
      else if (new Date(i.updatedAt).getTime() > cutoff && i.updatedAt !== i.createdAt) entries.push({ text: `${i.author || 'Someone'} edited a skill: ${i.skill}`, time: new Date(i.updatedAt).getTime() });
    });
    prompts.forEach(i => {
      if (new Date(i.createdAt).getTime() > cutoff) entries.push({ text: `${i.author || 'Someone'} added a prompt: ${i.prompt}`, time: new Date(i.createdAt).getTime() });
      else if (new Date(i.updatedAt).getTime() > cutoff && i.updatedAt !== i.createdAt) entries.push({ text: `${i.author || 'Someone'} edited a prompt: ${i.prompt}`, time: new Date(i.updatedAt).getTime() });
    });
    dashboards.forEach(i => {
      if (new Date(i.createdAt).getTime() > cutoff) entries.push({ text: `${i.author || 'Someone'} added a dashboard: ${i.description.slice(0, 40)}`, time: new Date(i.createdAt).getTime() });
      else if (new Date(i.updatedAt).getTime() > cutoff && i.updatedAt !== i.createdAt) entries.push({ text: `${i.author || 'Someone'} edited a dashboard: ${i.description.slice(0, 40)}`, time: new Date(i.updatedAt).getTime() });
    });
    apps.forEach(i => {
      if (new Date(i.createdAt).getTime() > cutoff) entries.push({ text: `${i.author || 'Someone'} added an app: ${i.description.slice(0, 40)}`, time: new Date(i.createdAt).getTime() });
      else if (new Date(i.updatedAt).getTime() > cutoff && i.updatedAt !== i.createdAt) entries.push({ text: `${i.author || 'Someone'} edited an app: ${i.description.slice(0, 40)}`, time: new Date(i.updatedAt).getTime() });
    });
    bestPractices.forEach(i => {
      if (new Date(i.createdAt).getTime() > cutoff) entries.push({ text: `${i.author || 'Someone'} added a best practice: ${i.title}`, time: new Date(i.createdAt).getTime() });
      else if (new Date(i.updatedAt).getTime() > cutoff && i.updatedAt !== i.createdAt) entries.push({ text: `${i.author || 'Someone'} edited a best practice: ${i.title}`, time: new Date(i.updatedAt).getTime() });
    });
    // Add rating activities from comments (most recent indicator)
    [...skills, ...prompts, ...dashboards, ...apps, ...bestPractices].forEach(i => {
      (i.comments || []).forEach((c: Comment) => {
        if (new Date(c.createdAt).getTime() > cutoff) {
          const itemName = (i as any).skill || (i as any).prompt || (i as any).title || (i as any).description?.slice(0, 30) || 'an item';
          entries.push({ text: `${c.author} commented on: ${itemName}`, time: new Date(c.createdAt).getTime() });
        }
      });
    });
    return entries.sort((a, b) => b.time - a.time).slice(0, 30);
  }, [skills, prompts, dashboards, apps, bestPractices]);

  // Related items (by shared tags)
  const getRelatedItems = useCallback((item: any, type: TabType) => {
    if (!item || !item.tags || item.tags.length === 0) return [];
    const itemTags = new Set(item.tags as string[]);
    const results: { item: any; type: TabType; label: string; sharedTags: string[] }[] = [];
    const check = (list: any[], listType: TabType, getLabel: (i: any) => string) => {
      list.forEach(i => {
        if (i.id === item.id && listType === type) return;
        const shared = (i.tags || []).filter((t: string) => itemTags.has(t));
        if (shared.length > 0) results.push({ item: i, type: listType, label: getLabel(i), sharedTags: shared });
      });
    };
    check(skills, 'skills', i => i.skill);
    check(prompts, 'prompts', i => i.prompt);
    check(dashboards, 'dashboards', i => i.description?.slice(0, 40) || i.dashboardUrl);
    check(apps, 'apps', i => i.description?.slice(0, 40) || i.appUrl);
    check(bestPractices, 'bestpractices', i => i.title);
    return results.sort((a, b) => b.sharedTags.length - a.sharedTags.length).slice(0, 5);
  }, [skills, prompts, dashboards, apps, bestPractices]);

  // Collection handlers
  const handleSaveCollection = (col: Collection) => {
    const exists = collections.find(c => c.id === col.id);
    const updated = exists ? collections.map(c => c.id === col.id ? col : c) : [...collections, col];
    setCollections(updated); persistCollections(updated);
    showToast(exists ? 'Collection saved' : 'Collection created');
  };
  const handleDeleteCollection = (id: string) => {
    const updated = collections.filter(c => c.id !== id);
    setCollections(updated); persistCollections(updated);
    showToast('Collection deleted');
  };

  // CRUD handlers
  const handleAdd = () => { setEditItem(null); setEditMode('add'); setShowEditModal(true); };
  const handleEdit = (item: any) => { setEditItem(item); setEditMode('edit'); setShowEditModal(true); };
  const handleDelete = (item: any) => { setDeleteItem(item); };

  const handleToggleFavorite = (item: any) => {
    const toggle = (list: any[], setList: (l: any[]) => void, save: (l: any[]) => void) => {
      const updated = list.map(i => i.id === item.id ? { ...i, favorite: !i.favorite } : i);
      setList(updated); save(updated);
    };
    if (currentTabType === 'skills') toggle(skills, setSkills, persistSkills);
    else if (currentTabType === 'prompts') toggle(prompts, setPrompts, persistPrompts);
    else if (currentTabType === 'dashboards') toggle(dashboards, setDashboards, persistDashboards);
    else if (currentTabType === 'apps') toggle(apps, setApps, persistApps);
  };

  const handleTogglePin = (item: any) => {
    const toggle = (list: any[], setList: (l: any[]) => void, save: (l: any[]) => void) => {
      const updated = list.map(i => i.id === item.id ? { ...i, pinned: !i.pinned } : i);
      setList(updated); save(updated);
    };
    if (currentTabType === 'skills') toggle(skills, setSkills, persistSkills);
    else if (currentTabType === 'prompts') toggle(prompts, setPrompts, persistPrompts);
    else if (currentTabType === 'dashboards') toggle(dashboards, setDashboards, persistDashboards);
    else if (currentTabType === 'apps') toggle(apps, setApps, persistApps);
    else if (currentTabType === 'bestpractices') toggle(bestPractices, setBestPractices, persistBestPractices);
    showToast(item.pinned ? 'Unpinned' : 'Pinned to top');
  };

  const handleRate = (item: any, rating: number) => {
    const rate = (list: any[], setList: (l: any[]) => void, save: (l: any[]) => void) => {
      const updated = list.map(i => {
        if (i.id !== item.id) return i;
        const oldCount = i.ratingCount || 0;
        const oldRating = i.rating || 0;
        const newCount = oldCount + 1;
        const newRating = ((oldRating * oldCount) + rating) / newCount;
        return { ...i, rating: Math.round(newRating * 10) / 10, ratingCount: newCount };
      });
      setList(updated); save(updated);
    };
    if (currentTabType === 'skills') rate(skills, setSkills, persistSkills);
    else if (currentTabType === 'prompts') rate(prompts, setPrompts, persistPrompts);
    else if (currentTabType === 'dashboards') rate(dashboards, setDashboards, persistDashboards);
    else if (currentTabType === 'apps') rate(apps, setApps, persistApps);
    else if (currentTabType === 'bestpractices') rate(bestPractices, setBestPractices, persistBestPractices);
    showToast(`Rated ${rating}/5`);
  };

  const handleTrackUsage = (item: any) => {
    const track = (list: any[], setList: (l: any[]) => void, save: (l: any[]) => void) => {
      const updated = list.map(i => i.id === item.id ? { ...i, usageCount: (i.usageCount || 0) + 1 } : i);
      setList(updated); save(updated);
    };
    if (currentTabType === 'skills') track(skills, setSkills, persistSkills);
    else if (currentTabType === 'prompts') track(prompts, setPrompts, persistPrompts);
    else if (currentTabType === 'dashboards') track(dashboards, setDashboards, persistDashboards);
    else if (currentTabType === 'apps') track(apps, setApps, persistApps);
  };

  const handleAddComment = (item: any, text: string, author: string) => {
    const newComment: Comment = { id: generateId(), author: author || 'Anonymous', text, createdAt: new Date().toISOString() };
    const addComment = (list: any[], setList: (l: any[]) => void, save: (l: any[]) => void) => {
      const updated = list.map(i => i.id === item.id ? { ...i, comments: [...(i.comments || []), newComment] } : i);
      setList(updated); save(updated);
    };
    if (currentTabType === 'skills') addComment(skills, setSkills, persistSkills);
    else if (currentTabType === 'prompts') addComment(prompts, setPrompts, persistPrompts);
    else if (currentTabType === 'dashboards') addComment(dashboards, setDashboards, persistDashboards);
    else if (currentTabType === 'apps') addComment(apps, setApps, persistApps);
    else if (currentTabType === 'bestpractices') addComment(bestPractices, setBestPractices, persistBestPractices);
    showToast('Comment added');
  };

  const handleDuplicate = (item: any) => {
    const now = new Date().toISOString();
    const newItem = { ...item, id: generateId(), createdAt: now, updatedAt: now, favorite: false, pinned: false, rating: 0, ratingCount: 0, usageCount: 0, comments: [] };
    if (currentTabType === 'skills') { newItem.skill = `${item.skill} (copy)`; const n = [...skills, newItem]; setSkills(n); persistSkills(n); }
    else if (currentTabType === 'prompts') { newItem.prompt = `${item.prompt} (copy)`; const n = [...prompts, newItem]; setPrompts(n); persistPrompts(n); }
    else if (currentTabType === 'dashboards') { newItem.description = `${item.description} (copy)`; const n = [...dashboards, newItem]; setDashboards(n); persistDashboards(n); }
    else if (currentTabType === 'apps') { newItem.description = `${item.description} (copy)`; const n = [...apps, newItem]; setApps(n); persistApps(n); }
    else if (currentTabType === 'bestpractices') { newItem.title = `${item.title} (copy)`; const n = [...bestPractices, newItem]; setBestPractices(n); persistBestPractices(n); }
    showToast('Item duplicated');
  };

  const handleCopyDescription = (item: any) => {
    const text = item.description || item.practices?.join('\n') || '';
    navigator.clipboard.writeText(text);
    handleTrackUsage(item);
    showToast('Copied to clipboard');
  };

  const handleSaveItem = (item: any) => {
    const now = new Date().toISOString();
    if (editMode === 'add') {
      const newItem = { ...item, id: generateId(), createdAt: now, updatedAt: now, favorite: false, pinned: false, status: item.status || 'active', rating: 0, ratingCount: 0, usageCount: 0, comments: [] };
      if (currentTabType === 'skills') { const n = [...skills, newItem]; setSkills(n); persistSkills(n); }
      else if (currentTabType === 'prompts') { const n = [...prompts, newItem]; setPrompts(n); persistPrompts(n); }
      else if (currentTabType === 'dashboards') { const n = [...dashboards, newItem]; setDashboards(n); persistDashboards(n); }
      else if (currentTabType === 'apps') { const n = [...apps, newItem]; setApps(n); persistApps(n); }
    } else {
      const updated = { ...item, updatedAt: now };
      if (currentTabType === 'skills') { const n = skills.map(i => i.id === updated.id ? updated : i); setSkills(n); persistSkills(n); }
      else if (currentTabType === 'prompts') { const n = prompts.map(i => i.id === updated.id ? updated : i); setPrompts(n); persistPrompts(n); }
      else if (currentTabType === 'dashboards') { const n = dashboards.map(i => i.id === updated.id ? updated : i); setDashboards(n); persistDashboards(n); }
      else if (currentTabType === 'apps') { const n = apps.map(i => i.id === updated.id ? updated : i); setApps(n); persistApps(n); }
    }
    setEditItem(null); setShowEditModal(false);
    showToast(editMode === 'add' ? 'Item added' : 'Item saved');
  };

  const markDeleted = useCallback((ids: string[]) => {
    const now = new Date().toISOString();
    const newEntries = ids.map(id => ({ id, deletedAt: now }));
    const updated = [...deletedIds, ...newEntries];
    setDeletedIds(updated);
    persistDeletedIds(updated);
  }, [deletedIds, persistDeletedIds]);

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    markDeleted([deleteItem.id]);
    if (currentTabType === 'skills') { const n = skills.filter(i => i.id !== deleteItem.id); setSkills(n); persistSkills(n); }
    else if (currentTabType === 'prompts') { const n = prompts.filter(i => i.id !== deleteItem.id); setPrompts(n); persistPrompts(n); }
    else if (currentTabType === 'dashboards') { const n = dashboards.filter(i => i.id !== deleteItem.id); setDashboards(n); persistDashboards(n); }
    else if (currentTabType === 'apps') { const n = apps.filter(i => i.id !== deleteItem.id); setApps(n); persistApps(n); }
    setDeleteItem(null); showToast('Item deleted');
  };

  // Bulk operations
  const handleBulkDelete = () => {
    const ids = selectedItems;
    markDeleted([...ids]);
    if (currentTabType === 'skills') { const n = skills.filter(i => !ids.has(i.id)); setSkills(n); persistSkills(n); }
    else if (currentTabType === 'prompts') { const n = prompts.filter(i => !ids.has(i.id)); setPrompts(n); persistPrompts(n); }
    else if (currentTabType === 'dashboards') { const n = dashboards.filter(i => !ids.has(i.id)); setDashboards(n); persistDashboards(n); }
    else if (currentTabType === 'apps') { const n = apps.filter(i => !ids.has(i.id)); setApps(n); persistApps(n); }
    setSelectedItems(new Set()); setShowBulkActions(false);
    showToast(`Deleted ${ids.size} items`);
  };

  const handleBulkTag = (tagName: string) => {
    const ids = selectedItems;
    const addTag = (list: any[], setList: (l: any[]) => void, save: (l: any[]) => void) => {
      const updated = list.map(i => ids.has(i.id) ? { ...i, tags: [...new Set([...(i.tags || []), tagName])] } : i);
      setList(updated); save(updated);
    };
    if (currentTabType === 'skills') addTag(skills, setSkills, persistSkills);
    else if (currentTabType === 'prompts') addTag(prompts, setPrompts, persistPrompts);
    else if (currentTabType === 'dashboards') addTag(dashboards, setDashboards, persistDashboards);
    else if (currentTabType === 'apps') addTag(apps, setApps, persistApps);
    setSelectedItems(new Set()); setShowBulkActions(false);
    showToast(`Tagged ${ids.size} items with "${tagName}"`);
  };

  const handleCsvImport = (items: any[]) => {
    const now = new Date().toISOString();
    const newItems = items.map(item => ({ ...item, id: generateId(), createdAt: now, updatedAt: now, favorite: false, pinned: false, status: 'active', rating: 0, ratingCount: 0, usageCount: 0, comments: [] }));
    if (currentTabType === 'skills') { const n = [...skills, ...newItems]; setSkills(n); persistSkills(n); }
    else if (currentTabType === 'prompts') { const n = [...prompts, ...newItems]; setPrompts(n); persistPrompts(n); }
    else if (currentTabType === 'dashboards') { const n = [...dashboards, ...newItems]; setDashboards(n); persistDashboards(n); }
    else if (currentTabType === 'apps') { const n = [...apps, ...newItems]; setApps(n); persistApps(n); }
    setShowCsvImport(false); showToast(`Imported ${newItems.length} items`);
  };

  const handleExport = () => {
    if (currentTabType === 'skills') exportToCsv(filteredSkills, 'skills');
    else if (currentTabType === 'prompts') exportToCsv(filteredPrompts, 'prompts');
    else if (currentTabType === 'dashboards') exportToCsv(filteredDashboards, 'dashboards');
    else exportToCsv(filteredApps, 'apps');
    showToast('Exported to CSV');
  };

  const handleSaveTags = (newTags: Tag[]) => { setTags(newTags); persistTags(newTags); };

  // Best Practices handlers
  const handleBpAdd = () => { setBpEditItem(null); setBpEditMode('add'); setShowBpEdit(true); };
  const handleBpEdit = (item: BestPracticeItem) => { setBpEditItem(item); setBpEditMode('edit'); setShowBpEdit(true); };
  const handleBpDelete = (item: BestPracticeItem) => { setBpDeleteItem(item); };
  const handleBpConfirmDelete = () => {
    if (!bpDeleteItem) return;
    markDeleted([bpDeleteItem.id]);
    const n = bestPractices.filter(i => i.id !== bpDeleteItem.id);
    setBestPractices(n); persistBestPractices(n); setBpDeleteItem(null); showToast('Deleted');
  };
  const handleBpSave = (item: BestPracticeItem) => {
    const now = new Date().toISOString();
    if (bpEditMode === 'add') {
      const newItem = { ...item, id: generateId(), createdAt: now, updatedAt: now, pinned: false, status: 'active' as any, rating: 0, ratingCount: 0, comments: [] };
      const n = [...bestPractices, newItem]; setBestPractices(n); persistBestPractices(n);
    } else {
      const updated = { ...item, updatedAt: now };
      const n = bestPractices.map(i => i.id === updated.id ? updated : i); setBestPractices(n); persistBestPractices(n);
    }
    setShowBpEdit(false); setBpEditItem(null); showToast(bpEditMode === 'add' ? 'Added' : 'Saved');
  };

  const getTagSuggestions = useCallback((description: string) => suggestTags(description, tags), [tags]);
  const getDuplicates = useCallback((item: any) => {
    const list = currentTabType === 'skills' ? skills : currentTabType === 'prompts' ? prompts : currentTabType === 'dashboards' ? dashboards : currentTabType === 'apps' ? apps : bestPractices;
    return findDuplicates(item, list, currentTabType);
  }, [currentTabType, skills, prompts, dashboards, apps, bestPractices]);

  return (
    <Page>
      <Page.Main>
        <Flex flexDirection="column" gap={16} padding={24}>
          {/* Header */}
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Flex flexDirection="column" gap={4}>
              <Flex alignItems="center" gap={12}>
                <Heading level={1}>AI Nexus</Heading>
                <Text className="app-subtitle">Your team's AI knowledge hub</Text>
              </Flex>
              <div className="header-tabs">
                <span className={`header-tab ${activeTab === null ? 'header-tab-active' : ''}`} onClick={() => setActiveTab(null)}><HomeIcon /> Home</span>
                {[
                  { label: 'Skills', icon: <CodeIcon />, idx: 0 },
                  { label: 'Prompts', icon: <DocumentIcon />, idx: 1 },
                  { label: 'Dashboards', icon: <ChartCollectionIcon />, idx: 2 },
                  { label: 'Apps', icon: <AppsIcon />, idx: 3 },
                  { label: 'Best Practices', icon: <CheckmarkIcon />, idx: 4 },
                ].map(tab => (
                  <span key={tab.idx} className={`header-tab ${activeTab === tab.idx ? 'header-tab-active' : ''}`} onClick={() => handleTabChange(tab.idx)}>
                    {tab.icon} {tab.label}
                  </span>
                ))}
              </div>
            </Flex>
            <Flex gap={8} alignItems="center">
              <Button onClick={() => setShowHelp(true)} variant="default"><Button.Prefix><HelpIcon /></Button.Prefix>Help</Button>
              <Button onClick={() => setShowSettings(true)} variant="default"><Button.Prefix><SettingIcon /></Button.Prefix>Settings</Button>
              <Text style={{ opacity: 0.4, fontSize: 11 }}>v0.6.0</Text>
            </Flex>
          </Flex>

          <StatsOverview skillsCount={skills.length} promptsCount={prompts.length} dashboardsCount={dashboards.length}
            appsCount={apps.length} bestPracticesCount={bestPractices.length} tagsCount={tags.length}
            recentCount={[...skills, ...prompts, ...dashboards, ...apps, ...bestPractices].filter(i => new Date(i.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            onStatClick={(action) => { if (action === 'settings') setShowSettings(true); else if (action.startsWith('tab-')) setActiveTab(Number(action.split('-')[1])); }}
          />

          {/* Home page */}
          {activeTab === null && (
            <div className="landing-page">
              <Flex flexDirection="column" gap={24} padding={24}>
                {/* Global Search */}
                <div className="global-search-container">
                  <input type="text" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="🔍 Search across all skills, prompts, dashboards, apps, and best practices..."
                    className="global-search-input" />
                  {globalSearch && (
                    <div className="global-search-results">
                      {globalSearchResults.length > 0 ? globalSearchResults.map((r, idx) => (
                        <div key={idx} className="global-search-item" onClick={() => { setDetailItem(r.item); setGlobalSearch(''); }}>
                          <span className="global-search-type">{r.type}</span>
                          <span className="global-search-label">{r.label}</span>
                        </div>
                      )) : <div className="global-search-item" style={{ opacity: 0.5 }}>No results found</div>}
                    </div>
                  )}
                </div>

                {/* Quick access */}
                <Flex gap={16} flexWrap="wrap" justifyContent="center">
                  {[
                    { label: 'Skills', icon: <CodeIcon />, idx: 0, count: skills.length },
                    { label: 'Prompts', icon: <DocumentIcon />, idx: 1, count: prompts.length },
                    { label: 'Dashboards', icon: <ChartCollectionIcon />, idx: 2, count: dashboards.length },
                    { label: 'Apps', icon: <AppsIcon />, idx: 3, count: apps.length },
                    { label: 'Best Practices', icon: <CheckmarkIcon />, idx: 4, count: bestPractices.length },
                  ].map(card => (
                    <div key={card.idx} className="landing-card" onClick={() => handleTabChange(card.idx)}>
                      <div className="landing-card-icon">{card.icon}</div>
                      <Text className="landing-card-label">{card.label}</Text>
                      <Text className="landing-card-count">{card.count} items</Text>
                    </div>
                  ))}
                </Flex>

                {/* Recently Added + Most Popular */}
                <Flex gap={24} flexWrap="wrap">
                  <div className="home-section">
                    <Text className="home-section-title">📅 Recently Added</Text>
                    {recentItems.length === 0 && <Text style={{ opacity: 0.5, fontSize: 13 }}>No items added in the last 7 days</Text>}
                    <div className="home-list">
                      {recentItems.map((r, idx) => (
                        <div key={idx} className="home-list-item" onClick={() => setDetailItem(r.item)}>
                          <span className="home-item-type">{r.type}</span>
                          <span className="home-item-label">{r.label}</span>
                          <span className="home-item-date">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="home-section">
                    <Text className="home-section-title">🔥 Most Popular</Text>
                    {popularItems.length === 0 && <Text style={{ opacity: 0.5, fontSize: 13 }}>Rate and use items to see popularity</Text>}
                    <div className="home-list">
                      {popularItems.map((r, idx) => (
                        <div key={idx} className="home-list-item" onClick={() => setDetailItem(r.item)}>
                          <span className="home-item-type">{r.type}</span>
                          <span className="home-item-label">{r.label}</span>
                          <span className="home-item-score">⭐ {r.item.rating || 0} · {r.item.usageCount || 0} uses</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Flex>

                {staleCount > 0 && (
                  <div className="stale-warning">⚠️ {staleCount} item{staleCount > 1 ? 's' : ''} not updated in 90+ days — consider reviewing.</div>
                )}

                {/* Collections */}
                <CollectionsPanel
                  collections={collections}
                  allItems={{ skills, prompts, dashboards, apps, bestPractices }}
                  onSave={handleSaveCollection}
                  onDelete={handleDeleteCollection}
                  onItemClick={(item, type) => setDetailItem(item)}
                />
              </Flex>
            </div>
          )}

          {/* Tab content */}
          {activeTab !== null && (
            <>
              <Flex gap={8} alignItems="flex-end" flexWrap="wrap">
                <div style={{ flex: 1 }}>
                  <SearchFilterBar searchQuery={searchQuery} searchField={searchField}
                    onSearchChange={setSearchQuery} onSearchFieldChange={setSearchField}
                    tags={tags} selectedTags={selectedTags} onTagsChange={setSelectedTags}
                    showFavoritesOnly={showFavoritesOnly} onFavoritesChange={setShowFavoritesOnly} />
                </div>
                <div className="sort-controls">
                  <select className="sort-select" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
                    <option value="updated">Sort: Updated</option>
                    <option value="created">Sort: Created</option>
                    <option value="name">Sort: Name</option>
                    <option value="rating">Sort: Rating</option>
                    <option value="usage">Sort: Usage</option>
                  </select>
                  <button className="sort-dir-btn" onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </Flex>

              <Flex justifyContent="space-between" gap={8} alignItems="center">
                <Flex gap={8} alignItems="center">
                  {currentTabType !== 'bestpractices' && (
                    <Button onClick={() => setShowBulkActions(!showBulkActions)} variant="default">
                      {showBulkActions ? 'Cancel Select' : 'Bulk Select'}
                    </Button>
                  )}
                  {showBulkActions && selectedItems.size > 0 && (
                    <>
                      <Text style={{ fontSize: 12, opacity: 0.7 }}>{selectedItems.size} selected</Text>
                      <Button onClick={handleBulkDelete} variant="default" style={{ color: '#FA4D56' }}>Delete Selected</Button>
                      {tags.length > 0 && (
                        <select className="bulk-tag-select" onChange={(e) => { if (e.target.value) handleBulkTag(e.target.value); e.target.value = ''; }}>
                          <option value="">Tag selected...</option>
                          {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                      )}
                    </>
                  )}
                </Flex>
                <Flex gap={8}>
                  {currentTabType === 'bestpractices' ? (
                    <Button onClick={handleBpAdd} variant="emphasized"><Button.Prefix><PlusIcon /></Button.Prefix>Add Best Practice</Button>
                  ) : (
                    <>
                      <Button onClick={handleAdd} variant="emphasized">
                        <Button.Prefix><PlusIcon /></Button.Prefix>
                        Add {currentTabType === 'skills' ? 'Skill' : currentTabType === 'prompts' ? 'Prompt' : currentTabType === 'dashboards' ? 'Dashboard' : 'App'}
                      </Button>
                      <Button onClick={() => setShowCsvImport(true)} variant="default"><Button.Prefix><UploadIcon /></Button.Prefix>Import CSV</Button>
                      <Button onClick={handleExport} variant="default"><Button.Prefix><DownloadIcon /></Button.Prefix>Export CSV</Button>
                    </>
                  )}
                </Flex>
              </Flex>

              {activeTab === 0 && <ItemTable tabType="skills" items={filteredSkills} tags={tags} onRowClick={(item) => { setDetailItem(item); handleTrackUsage(item); }} onEdit={handleEdit} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onDuplicate={handleDuplicate} onTogglePin={handleTogglePin} onCopy={handleCopyDescription} showBulkSelect={showBulkActions} selectedItems={selectedItems} onSelectionChange={setSelectedItems} />}
              {activeTab === 1 && <ItemTable tabType="prompts" items={filteredPrompts} tags={tags} onRowClick={(item) => { setDetailItem(item); handleTrackUsage(item); }} onEdit={handleEdit} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onDuplicate={handleDuplicate} onTogglePin={handleTogglePin} onCopy={handleCopyDescription} showBulkSelect={showBulkActions} selectedItems={selectedItems} onSelectionChange={setSelectedItems} />}
              {activeTab === 2 && <ItemTable tabType="dashboards" items={filteredDashboards} tags={tags} onRowClick={(item) => { setDetailItem(item); handleTrackUsage(item); }} onEdit={handleEdit} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onDuplicate={handleDuplicate} onTogglePin={handleTogglePin} onCopy={handleCopyDescription} showBulkSelect={showBulkActions} selectedItems={selectedItems} onSelectionChange={setSelectedItems} />}
              {activeTab === 3 && <ItemTable tabType="apps" items={filteredApps} tags={tags} onRowClick={(item) => { setDetailItem(item); handleTrackUsage(item); }} onEdit={handleEdit} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onDuplicate={handleDuplicate} onTogglePin={handleTogglePin} onCopy={handleCopyDescription} showBulkSelect={showBulkActions} selectedItems={selectedItems} onSelectionChange={setSelectedItems} />}
              {activeTab === 4 && <BestPracticesTab items={filteredBestPractices} tags={tags} onEdit={handleBpEdit} onDelete={handleBpDelete} onDuplicate={handleDuplicate} onTogglePin={handleTogglePin} onCopy={handleCopyDescription} onRate={handleRate} />}
            </>
          )}
        </Flex>

        {/* Modals */}
        <DetailModal item={detailItem} tabType={currentTabType} tags={tags} onDismiss={() => setDetailItem(null)} onEdit={(item) => { setDetailItem(null); handleEdit(item); }} onRate={handleRate} onAddComment={handleAddComment} onCopy={handleCopyDescription} relatedItems={detailItem ? getRelatedItems(detailItem, currentTabType) : []} onRelatedClick={(item, type) => { setDetailItem(item); }} />
        {showEditModal && <EditModal item={editItem} tabType={currentTabType} tags={tags} mode={editMode} show={showEditModal} onSave={handleSaveItem} onDismiss={() => { setShowEditModal(false); setEditItem(null); setEditMode('edit'); }} getTagSuggestions={getTagSuggestions} getDuplicates={getDuplicates} />}
        <DeleteConfirmModal item={deleteItem} tabType={currentTabType} onConfirm={handleConfirmDelete} onDismiss={() => setDeleteItem(null)} />
        <SettingsModal show={showSettings} tags={tags} onSave={handleSaveTags} onDismiss={() => setShowSettings(false)} />
        <CsvImportModal show={showCsvImport} tabType={currentTabType} onImport={handleCsvImport} onDismiss={() => setShowCsvImport(false)} />
        <BestPracticeEditModal item={bpEditItem} tags={tags} mode={bpEditMode} show={showBpEdit} onSave={handleBpSave} onDismiss={() => { setShowBpEdit(false); setBpEditItem(null); }} />
        <DeleteConfirmModal item={bpDeleteItem} tabType="bestpractices" onConfirm={handleBpConfirmDelete} onDismiss={() => setBpDeleteItem(null)} />
        <HelpModal show={showHelp} onDismiss={() => setShowHelp(false)} />

        {toast && <div className="toast-notification">{toast}</div>}

        {/* Activity Feed Marquee */}
        {activityFeed.length > 0 && (
          <div className="activity-marquee-bar">
            <div className={`activity-marquee-track ${activityPaused ? 'activity-paused' : ''}`}>
              {activityFeed.map((entry, idx) => (
                <span key={idx} className="activity-marquee-item">
                  <span className="activity-marquee-dot">●</span> {entry.text}
                </span>
              ))}
              {activityFeed.map((entry, idx) => (
                <span key={`dup-${idx}`} className="activity-marquee-item">
                  <span className="activity-marquee-dot">●</span> {entry.text}
                </span>
              ))}
            </div>
            <button className="activity-toggle-btn" onClick={() => setActivityPaused(!activityPaused)} title={activityPaused ? 'Resume scroll' : 'Pause scroll'}>
              {activityPaused ? '▶' : '⏸'}
            </button>
          </div>
        )}
      </Page.Main>
    </Page>
  );
};
