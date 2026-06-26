import React, { useMemo } from 'react';
import { DataTable } from '@dynatrace/strato-components/tables';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Text } from '@dynatrace/strato-components/typography';
import { TabType, Tag, STATUS_CONFIG } from '../types';
import { TagChips } from './TagChips';

interface ItemTableProps {
  tabType: TabType;
  items: any[];
  tags: Tag[];
  onRowClick: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onToggleFavorite: (item: any) => void;
  onDuplicate: (item: any) => void;
  onTogglePin: (item: any) => void;
  onCopy: (item: any) => void;
  showBulkSelect?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (items: Set<string>) => void;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '\u2026' : text;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ItemTable: React.FC<ItemTableProps> = ({
  tabType, items, tags, onRowClick, onEdit, onDelete, onToggleFavorite,
  onDuplicate, onTogglePin, onCopy, showBulkSelect, selectedItems, onSelectionChange,
}) => {
  const columns = useMemo(() => {
    const baseColumns: any[] = [];

    // Bulk select checkbox
    if (showBulkSelect) {
      baseColumns.push({
        accessor: 'id',
        header: '☐',
        width: 36,
        id: 'select',
        cell: ({ value }: any) => {
          const checked = selectedItems?.has(value);
          return (
            <input type="checkbox" checked={!!checked} onChange={() => {
              const next = new Set(selectedItems);
              if (checked) next.delete(value); else next.add(value);
              onSelectionChange?.(next);
            }} style={{ cursor: 'pointer' }} />
          );
        },
      });
    }

    // Favorite + Pin column
    baseColumns.push({
      accessor: 'favorite',
      header: '★',
      width: 50,
      cell: ({ value, rowData }: any) => {
        if (!rowData) return null;
        return (
          <span style={{ display: 'flex', gap: 2 }}>
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(rowData); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px' }}
              title={rowData.favorite ? 'Unfavorite' : 'Favorite'}>
              {rowData.favorite ? '★' : '☆'}
            </button>
            {rowData.pinned && <span title="Pinned" style={{ fontSize: 11 }}>📌</span>}
          </span>
        );
      },
    });

    // Status badge
    baseColumns.push({
      accessor: 'status',
      header: 'Status',
      width: 90,
      cell: ({ value }: any) => {
        const cfg = STATUS_CONFIG[value as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
        return <span className="status-badge" style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>{cfg.icon} {cfg.label}</span>;
      },
    });

    if (tabType === 'skills') {
      baseColumns.push(
        { accessor: 'skill', header: 'Skill', width: 160, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{value || ''}</span> },
        { accessor: 'description', header: 'Description', cell: ({ value }: any) => <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 50)}</span> },
        { accessor: 'author', header: 'Author', width: 100, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{value || ''}</span> },
      );
    } else if (tabType === 'prompts') {
      baseColumns.push(
        { accessor: 'prompt', header: 'Prompt', width: 160, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{value || ''}</span> },
        { accessor: 'description', header: 'Description', cell: ({ value }: any) => <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 50)}</span> },
        { accessor: 'author', header: 'Author', width: 100, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{value || ''}</span> },
      );
    } else if (tabType === 'dashboards') {
      baseColumns.push(
        { accessor: 'name', header: 'Name', width: 150, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontWeight: 600 }}>{value || ''}</span> },
        { accessor: 'dashboardUrl', header: 'Dashboard URL', width: 190, cell: ({ value }: any) => (<a href={value} target="_blank" rel="noopener noreferrer" className="url-link" onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 26)}</a>) },
        { accessor: 'description', header: 'Description', cell: ({ value }: any) => <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 40)}</span> },
        { accessor: 'author', header: 'Author', width: 100, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{value || ''}</span> },
        { accessor: 'repoUrl', header: 'Repo URL', width: 150, cell: ({ value }: any) => (<a href={value} target="_blank" rel="noopener noreferrer" className="url-link" onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 22)}</a>) },
      );
    } else {
      baseColumns.push(
        { accessor: 'name', header: 'Name', width: 150, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontWeight: 600 }}>{value || ''}</span> },
        { accessor: 'appUrl', header: 'App URL', width: 180, cell: ({ value }: any) => (<a href={value} target="_blank" rel="noopener noreferrer" className="url-link" onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 24)}</a>) },
        { accessor: 'description', header: 'Description', width: 180, cell: ({ value }: any) => <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 30)}</span> },
        { accessor: 'author', header: 'Author', width: 100, cell: ({ value }: any) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{value || ''}</span> },
        { accessor: 'repoUrl', header: 'Repo URL', width: 150, cell: ({ value }: any) => (<a href={value} target="_blank" rel="noopener noreferrer" className="url-link" onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{truncate(value || '', 22)}</a>) },
      );
    }

    // Rating column
    baseColumns.push({
      accessor: 'rating',
      header: '⭐',
      width: 60,
      cell: ({ value, rowData }: any) => <span style={{ fontSize: 12 }}>{value ? `${value}/5` : '—'}</span>,
    });

    // Usage column
    baseColumns.push({
      accessor: 'usageCount',
      header: 'Uses',
      width: 50,
      cell: ({ value }: any) => <span style={{ fontSize: 12 }}>{value || 0}</span>,
    });

    // Tags column
    baseColumns.push({
      accessor: 'tags',
      header: 'Tags',
      width: 160,
      cell: ({ value }: any) => <TagChips tagNames={value || []} allTags={tags} />,
    });

    // Date column
    baseColumns.push({
      accessor: 'updatedAt',
      header: 'Updated',
      width: 100,
      cell: ({ value }: any) => <Text style={{ fontSize: 12 }}>{formatDate(value)}</Text>,
    });

    // Actions column
    baseColumns.push({
      accessor: 'id',
      header: 'Actions',
      width: 160,
      id: 'actions',
      cell: ({ rowData }: any) => {
        if (!rowData) return null;
        return (
          <Flex gap={2}>
            <button onClick={(e) => { e.stopPropagation(); onRowClick(rowData); }} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="View">🔍</button>
            <button onClick={(e) => { e.stopPropagation(); onCopy(rowData); }} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="Copy">📋</button>
            <button onClick={(e) => { e.stopPropagation(); onTogglePin(rowData); }} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title={rowData.pinned ? 'Unpin' : 'Pin'}>📌</button>
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(rowData); }} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="Duplicate">📄</button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(rowData); }} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="Edit">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(rowData); }} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px', color: '#FA4D56' }} title="Delete">🗑️</button>
          </Flex>
        );
      },
    });

    return baseColumns;
  }, [tabType, tags, onRowClick, onEdit, onDelete, onToggleFavorite, onDuplicate, onTogglePin, onCopy, showBulkSelect, selectedItems, onSelectionChange]);

  if (items.length === 0) {
    return (
      <Flex justifyContent="center" alignItems="center" padding={48} flexDirection="column" gap={12}>
        <Text className="empty-state-text">No items found</Text>
        <Text className="empty-state-hint">Add items using the button above or import from CSV</Text>
      </Flex>
    );
  }

  return (
    <div className="table-container table-enter">
      <DataTable data={items} columns={columns} fullWidth
        variant={{ rowSeparation: 'horizontalDividers', rowDensity: 'comfortable' }} resizable />
    </div>
  );
};
