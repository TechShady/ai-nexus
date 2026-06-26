import React, { useState } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Button } from '@dynatrace/strato-components/buttons';
import { Text } from '@dynatrace/strato-components/typography';
import { Modal } from '@dynatrace/strato-components/overlays';
import { FormField, Label, TextInput, TextArea } from '@dynatrace/strato-components/forms';
import { PlusIcon } from '@dynatrace/strato-icons';
import { Collection, CollectionItem, TabType } from '../types';

interface CollectionsPanelProps {
  collections: Collection[];
  allItems: { skills: any[]; prompts: any[]; dashboards: any[]; apps: any[]; bestPractices: any[] };
  onSave: (collection: Collection) => void;
  onDelete: (id: string) => void;
  onItemClick: (item: any, type: TabType) => void;
}

function getItemName(item: any, type: TabType): string {
  if (type === 'skills') return item.skill;
  if (type === 'prompts') return item.prompt;
  if (type === 'bestpractices') return item.title;
  return item.description?.slice(0, 50) || item.dashboardUrl || item.appUrl || 'Unnamed';
}

function getItemIcon(type: TabType): string {
  if (type === 'skills') return '💡';
  if (type === 'prompts') return '💬';
  if (type === 'dashboards') return '📊';
  if (type === 'apps') return '📱';
  return '✅';
}

export const CollectionsPanel: React.FC<CollectionsPanelProps> = ({ collections, allItems, onSave, onDelete, onItemClick }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedItems, setSelectedItems] = useState<CollectionItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allItemsList = [
    ...allItems.skills.map(i => ({ item: i, type: 'skills' as TabType, label: i.skill })),
    ...allItems.prompts.map(i => ({ item: i, type: 'prompts' as TabType, label: i.prompt })),
    ...allItems.dashboards.map(i => ({ item: i, type: 'dashboards' as TabType, label: i.description?.slice(0, 40) || i.dashboardUrl })),
    ...allItems.apps.map(i => ({ item: i, type: 'apps' as TabType, label: i.description?.slice(0, 40) || i.appUrl })),
    ...allItems.bestPractices.map(i => ({ item: i, type: 'bestpractices' as TabType, label: i.title })),
  ];

  const openCreate = () => {
    setName(''); setDescription(''); setAuthor(''); setSelectedItems([]);
    setEditCollection(null); setShowCreate(true);
  };

  const openEdit = (col: Collection) => {
    setName(col.name); setDescription(col.description); setAuthor(col.author);
    setSelectedItems([...col.items]); setEditCollection(col); setShowCreate(true);
  };

  const toggleItem = (id: string, type: TabType) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === id && i.type === type);
      if (exists) return prev.filter(i => !(i.id === id && i.type === type));
      return [...prev, { id, type }];
    });
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const col: Collection = {
      id: editCollection?.id || `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name, description, author,
      items: selectedItems,
      createdAt: editCollection?.createdAt || now,
      updatedAt: now,
    };
    onSave(col);
    setShowCreate(false);
  };

  const resolveItem = (ci: CollectionItem) => {
    const list = ci.type === 'skills' ? allItems.skills
      : ci.type === 'prompts' ? allItems.prompts
      : ci.type === 'dashboards' ? allItems.dashboards
      : ci.type === 'apps' ? allItems.apps
      : allItems.bestPractices;
    return list.find(i => i.id === ci.id);
  };

  return (
    <div className="collections-panel">
      <Flex justifyContent="space-between" alignItems="center" style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 700 }}>📦 Collections</Text>
        <Button onClick={openCreate} variant="emphasized"><Button.Prefix><PlusIcon /></Button.Prefix>New Collection</Button>
      </Flex>

      {collections.length === 0 && (
        <Text style={{ opacity: 0.5, fontSize: 13 }}>No collections yet. Create one to bundle related skills, prompts, and dashboards together.</Text>
      )}

      <div className="collections-grid">
        {collections.map(col => (
          <div key={col.id} className="collection-card">
            <div className="collection-card-header" onClick={() => setExpandedId(expandedId === col.id ? null : col.id)}>
              <Text style={{ fontWeight: 700, fontSize: 14 }}>📦 {col.name}</Text>
              <Text style={{ fontSize: 11, opacity: 0.6 }}>{col.items.length} items · by {col.author || 'Unknown'}</Text>
            </div>
            {col.description && <Text style={{ fontSize: 12, opacity: 0.7, padding: '0 12px' }}>{col.description}</Text>}
            {expandedId === col.id && (
              <div className="collection-items-list">
                {col.items.map((ci, idx) => {
                  const resolved = resolveItem(ci);
                  if (!resolved) return <div key={idx} className="collection-item-row" style={{ opacity: 0.4 }}>⚠️ Item not found</div>;
                  return (
                    <div key={idx} className="collection-item-row" onClick={() => onItemClick(resolved, ci.type)}>
                      <span>{getItemIcon(ci.type)}</span>
                      <span style={{ flex: 1 }}>{getItemName(resolved, ci.type)}</span>
                      <span className="collection-item-type">{ci.type}</span>
                    </div>
                  );
                })}
                <Flex gap={8} style={{ padding: '8px 12px' }}>
                  <button className="collection-action-btn" onClick={() => openEdit(col)}>✏️ Edit</button>
                  <button className="collection-action-btn collection-action-delete" onClick={() => onDelete(col.id)}>🗑️ Delete</button>
                </Flex>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreate && (
        <Modal title={editCollection ? 'Edit Collection' : 'New Collection'} show={showCreate} onDismiss={() => setShowCreate(false)} size="large"
          footer={<Flex justifyContent="flex-end" gap={8}><Button onClick={handleSave} variant="emphasized" disabled={!name.trim()}>{editCollection ? 'Save' : 'Create'}</Button><Button onClick={() => setShowCreate(false)} variant="default">Cancel</Button></Flex>}>
          <Flex flexDirection="column" gap={16} padding={8}>
            <FormField><Label>Collection Name *</Label>
              <TextInput value={name} onChange={(e: any) => setName(e)} placeholder="e.g. K8s Onboarding Kit" />
            </FormField>
            <FormField><Label>Description</Label>
              <TextArea value={description} onChange={(e: any) => setDescription(e)} placeholder="What is this collection about?" rows={2} />
            </FormField>
            <FormField><Label>Author</Label>
              <TextInput value={author} onChange={(e: any) => setAuthor(e)} placeholder="Your name..." />
            </FormField>

            <div>
              <Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Select Items ({selectedItems.length} selected)</Text>
              <div className="collection-item-picker">
                {allItemsList.map(({ item, type, label }) => {
                  const isSelected = selectedItems.some(si => si.id === item.id && si.type === type);
                  return (
                    <div key={`${type}-${item.id}`} className={`collection-picker-row ${isSelected ? 'collection-picker-selected' : ''}`}
                      onClick={() => toggleItem(item.id, type)}>
                      <span>{getItemIcon(type)}</span>
                      <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
                      <span className="collection-item-type">{type}</span>
                      <span style={{ fontSize: 14 }}>{isSelected ? '✓' : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Flex>
        </Modal>
      )}
    </div>
  );
};
