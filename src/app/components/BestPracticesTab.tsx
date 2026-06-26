import React, { useState } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Text } from '@dynatrace/strato-components/typography';
import { BestPracticeItem, Tag, STATUS_CONFIG } from '../types';
import { TagChips } from './TagChips';

interface BestPracticesTabProps {
  items: BestPracticeItem[];
  tags: Tag[];
  onEdit: (item: BestPracticeItem) => void;
  onDelete: (item: BestPracticeItem) => void;
  onDuplicate: (item: BestPracticeItem) => void;
  onTogglePin: (item: BestPracticeItem) => void;
  onCopy: (item: BestPracticeItem) => void;
  onRate: (item: BestPracticeItem, rating: number) => void;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const BestPracticesTab: React.FC<BestPracticesTabProps> = ({ items, tags, onEdit, onDelete, onDuplicate, onTogglePin, onCopy, onRate }) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (items.length === 0) {
    return (
      <Flex justifyContent="center" alignItems="center" padding={48} flexDirection="column" gap={12}>
        <Text className="empty-state-text">No best practices yet</Text>
        <Text className="empty-state-hint">Add cards using the button above to share team best practices</Text>
      </Flex>
    );
  }

  return (
    <div className="bp-grid bp-grid-enter">
      {items.map((item, idx) => {
        const isExpanded = !!expandedCards[item.id];
        const statusCfg = STATUS_CONFIG[(item.status || 'active') as keyof typeof STATUS_CONFIG];
        return (
          <div key={item.id} className={`bp-card ${isExpanded ? 'bp-card-expanded' : ''}`} style={{ animationDelay: `${idx * 0.07}s` }}>
            {/* Card Header */}
            <div className="bp-card-header">
              <Flex justifyContent="space-between" alignItems="center">
                <Flex flexDirection="column" gap={2}>
                  <Flex gap={6} alignItems="center">
                    {item.pinned && <span style={{ fontSize: 11 }}>📌</span>}
                    <Text className="bp-card-title">{item.title || 'Best Practices'}</Text>
                  </Flex>
                  <Flex gap={8} alignItems="center">
                    <Text className="bp-card-author">by {item.author || 'Unknown'}</Text>
                    <span className="status-badge-sm" style={{ color: statusCfg.color }}>{statusCfg.icon}</span>
                  </Flex>
                </Flex>
                <Flex gap={2} alignItems="center">
                  <button onClick={() => toggleExpand(item.id)} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title={isExpanded ? 'Minimize' : 'Maximize'}>{isExpanded ? '🔽' : '🔼'}</button>
                  <button onClick={() => onCopy(item)} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="Copy">📋</button>
                  <button onClick={() => onTogglePin(item)} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="Pin">📌</button>
                  <button onClick={() => onDuplicate(item)} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="Duplicate">📄</button>
                  <button onClick={() => onEdit(item)} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px' }} title="Edit">✏️</button>
                  <button onClick={() => onDelete(item)} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '13px', color: '#FA4D56' }} title="Delete">🗑️</button>
                </Flex>
              </Flex>
            </div>

            {/* Card Body */}
            <div className="bp-card-body">
              <ul className="bp-list">
                {item.practices.map((practice, i) => (
                  <li key={i} className="bp-list-item">{practice}</li>
                ))}
              </ul>
            </div>

            {/* Card Footer */}
            <div className="bp-card-footer">
              <Flex justifyContent="space-between" alignItems="center">
                <TagChips tagNames={item.tags || []} allTags={tags} />
                <Flex gap={8} alignItems="center">
                  <Flex gap={2} alignItems="center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star}
                        style={{ cursor: 'pointer', fontSize: 14, color: star <= ((hoverRating[item.id] || 0) || Math.round(item.rating || 0)) ? '#F1C21B' : 'rgba(128,128,128,0.3)' }}
                        onMouseEnter={() => setHoverRating(prev => ({ ...prev, [item.id]: star }))}
                        onMouseLeave={() => setHoverRating(prev => ({ ...prev, [item.id]: 0 }))}
                        onClick={() => onRate(item, star)}
                      >★</span>
                    ))}
                    {(item.rating || 0) > 0 && <span style={{ fontSize: 11, opacity: 0.7 }}>{item.rating}</span>}
                  </Flex>
                  <Text className="bp-card-date">{formatDate(item.updatedAt)}</Text>
                </Flex>
              </Flex>
            </div>
          </div>
        );
      })}
    </div>
  );
};
