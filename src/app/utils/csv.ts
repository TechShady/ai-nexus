import { TabType } from '../types';

export function parseCsv(text: string, tabType: TabType): any[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());
  const items: any[] = [];

  const fieldMap: Record<TabType, Record<string, string>> = {
    skills: { skill: 'skill', description: 'description', author: 'author', tags: 'tags' },
    prompts: { prompt: 'prompt', description: 'description', author: 'author', tags: 'tags' },
    dashboards: { dashboardurl: 'dashboardUrl', 'dashboard url': 'dashboardUrl', description: 'description', repourl: 'repoUrl', 'repo url': 'repoUrl', tags: 'tags' },
    apps: { appurl: 'appUrl', 'app url': 'appUrl', description: 'description', repourl: 'repoUrl', 'repo url': 'repoUrl', tags: 'tags' },
    bestpractices: { title: 'title', author: 'author', practices: 'practices', tags: 'tags' },
  };

  const mapping = fieldMap[tabType];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const item: any = {};

    headers.forEach((header, idx) => {
      const field = mapping[header];
      if (field && idx < values.length) {
        if (field === 'tags') {
          item.tags = values[idx].split(/[;|,]/).map(t => t.trim()).filter(Boolean);
        } else {
          item[field] = values[idx].trim();
        }
      }
    });

    // Validate required fields
    if (tabType === 'skills' && item.skill) items.push(item);
    else if (tabType === 'prompts' && item.prompt) items.push(item);
    else if (tabType === 'dashboards' && item.dashboardUrl) items.push(item);
    else if (tabType === 'apps' && item.appUrl) items.push(item);
  }

  return items;
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function exportToCsv(items: any[], tabType: TabType): void {
  const headerMap: Record<TabType, string[]> = {
    skills: ['skill', 'description', 'author', 'tags'],
    prompts: ['prompt', 'description', 'author', 'tags'],
    dashboards: ['dashboardUrl', 'description', 'repoUrl', 'tags'],
    apps: ['appUrl', 'description', 'repoUrl', 'tags'],
    bestpractices: ['title', 'author', 'practices', 'tags'],
  };

  const headers = headerMap[tabType];
  const rows = items.map(item =>
    headers.map(h => {
      const val = item[h];
      if (Array.isArray(val)) return `"${val.join(';')}"`;
      const str = String(val || '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-nexus-${tabType}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
