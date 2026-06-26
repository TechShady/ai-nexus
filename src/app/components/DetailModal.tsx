import React, { useState } from 'react';
import { Modal } from '@dynatrace/strato-components/overlays';
import { Button } from '@dynatrace/strato-components/buttons';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Text, Paragraph } from '@dynatrace/strato-components/typography';
import { EditIcon, CopyIcon } from '@dynatrace/strato-icons';
import { TabType, Tag, STATUS_CONFIG, Comment } from '../types';
import { TagChips } from './TagChips';
import { MarkdownText } from './MarkdownText';

interface RelatedItem {
  item: any;
  type: TabType;
  label: string;
  sharedTags: string[];
}

interface DetailModalProps {
  item: any | null;
  tabType: TabType;
  tags: Tag[];
  onDismiss: () => void;
  onEdit: (item: any) => void;
  onRate: (item: any, rating: number) => void;
  onAddComment: (item: any, text: string, author: string) => void;
  onCopy: (item: any) => void;
  relatedItems?: RelatedItem[];
  onRelatedClick?: (item: any, type: TabType) => void;
}

function formatDate(iso: string): string {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, tabType, tags, onDismiss, onEdit, onRate, onAddComment, onCopy, relatedItems, onRelatedClick }) => {
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  if (!item) return null;

  const title = tabType === 'skills' ? item.skill
    : tabType === 'prompts' ? item.prompt
    : tabType === 'dashboards' ? 'Dashboard Details'
    : tabType === 'apps' ? 'App Details' : item.title || 'Details';

  const statusCfg = STATUS_CONFIG[(item.status || 'active') as keyof typeof STATUS_CONFIG];

  const footer = (
    <Flex justifyContent="space-between" alignItems="center">
      <Flex gap={8}>
        <Button onClick={() => onCopy(item)} variant="default"><Button.Prefix><CopyIcon /></Button.Prefix>Copy</Button>
      </Flex>
      <Flex gap={8}>
        <Button onClick={() => onEdit(item)} variant="emphasized"><Button.Prefix><EditIcon /></Button.Prefix>Edit</Button>
        <Button onClick={onDismiss} variant="default">Close</Button>
      </Flex>
    </Flex>
  );

  const submitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(item, commentText.trim(), commentAuthor.trim());
    setCommentText('');
  };

  return (
    <Modal title={title} show={!!item} onDismiss={onDismiss} size="large" footer={footer}>
      <Flex flexDirection="column" gap={16} padding={8}>
        {/* Status badge */}
        <Flex gap={12} alignItems="center">
          <span className="status-badge" style={{ background: `${statusCfg.color}22`, color: statusCfg.color, border: `1px solid ${statusCfg.color}44` }}>
            {statusCfg.icon} {statusCfg.label}
          </span>
          {item.pinned && <span style={{ fontSize: 12 }}>📌 Pinned</span>}
          <span style={{ fontSize: 12, opacity: 0.6 }}>Used {item.usageCount || 0} times</span>
        </Flex>

        {/* Rating */}
        <div className="detail-field">
          <Text className="detail-label">Rating ({item.ratingCount || 0} votes)</Text>
          <Flex gap={4} alignItems="center">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className="rating-star"
                onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                onClick={() => onRate(item, star)}
                style={{ cursor: 'pointer', fontSize: 20, color: star <= (hoverRating || Math.round(item.rating || 0)) ? '#F1C21B' : 'rgba(128,128,128,0.3)' }}>
                ★
              </span>
            ))}
            <Text style={{ fontSize: 13, marginLeft: 8 }}>{item.rating ? `${item.rating}/5` : 'Not rated'}</Text>
          </Flex>
        </div>

        {/* Name/Title */}
        {(tabType === 'skills' || tabType === 'prompts') && (
          <div className="detail-field">
            <Text className="detail-label">{tabType === 'skills' ? 'Skill Name' : 'Prompt Name'}</Text>
            <Text className="detail-value">{tabType === 'skills' ? item.skill : item.prompt}</Text>
          </div>
        )}

        {/* Skill Repo URL */}
        {tabType === 'skills' && item.repoUrl && (
          <div className="detail-field">
            <Text className="detail-label">Repository URL</Text>
            <Flex alignItems="center" gap={8}>
              <a href={item.repoUrl} target="_blank" rel="noopener noreferrer" className="detail-url">{item.repoUrl}</a>
              <span className="copy-btn" onClick={() => copyToClipboard(item.repoUrl)}><CopyIcon /></span>
            </Flex>
          </div>
        )}

        {/* URLs */}
        {(tabType === 'dashboards' || tabType === 'apps') && (
          <>
            <div className="detail-field">
              <Text className="detail-label">{tabType === 'dashboards' ? 'Dashboard URL' : 'App URL'}</Text>
              <Flex alignItems="center" gap={8}>
                <a href={tabType === 'dashboards' ? item.dashboardUrl : item.appUrl} target="_blank" rel="noopener noreferrer" className="detail-url">
                  {tabType === 'dashboards' ? item.dashboardUrl : item.appUrl}
                </a>
                <span className="copy-btn" onClick={() => copyToClipboard(tabType === 'dashboards' ? item.dashboardUrl : item.appUrl)}><CopyIcon /></span>
              </Flex>
            </div>
            <div className="detail-field">
              <Text className="detail-label">Repository URL</Text>
              <Flex alignItems="center" gap={8}>
                <a href={item.repoUrl} target="_blank" rel="noopener noreferrer" className="detail-url">{item.repoUrl}</a>
                <span className="copy-btn" onClick={() => copyToClipboard(item.repoUrl)}><CopyIcon /></span>
              </Flex>
            </div>
          </>
        )}

        {/* Author */}
        <div className="detail-field">
          <Text className="detail-label">Author</Text>
          <Text className="detail-value">{item.author || 'Unknown'}</Text>
        </div>

        {/* Description */}
        <div className="detail-field">
          <Text className="detail-label">Description</Text>
          <div className="detail-description">
            <MarkdownText text={item.description} />
          </div>
        </div>

        {/* Prompt text (click to copy) */}
        {tabType === 'prompts' && item.promptText && (
          <div className="detail-field">
            <Flex alignItems="center" gap={8}>
              <Text className="detail-label">Prompt</Text>
              <span className="copy-btn" onClick={() => copyToClipboard(item.promptText)} title="Click to copy prompt">
                <CopyIcon /> <span style={{ fontSize: 11 }}>Copy</span>
              </span>
            </Flex>
            <div className="detail-prompt-text" onClick={() => copyToClipboard(item.promptText)} title="Click to copy">
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontSize: 13, fontFamily: 'monospace' }}>{item.promptText}</pre>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="detail-field">
          <Text className="detail-label">Tags</Text>
          <TagChips tagNames={item.tags || []} allTags={tags} />
        </div>

        {/* Metadata */}
        <Flex gap={24}>
          <div className="detail-field">
            <Text className="detail-label">Created</Text>
            <Text className="detail-value">{formatDate(item.createdAt)}</Text>
          </div>
          <div className="detail-field">
            <Text className="detail-label">Last Updated</Text>
            <Text className="detail-value">{formatDate(item.updatedAt)}</Text>
          </div>
        </Flex>

        {/* Related Items */}
        {relatedItems && relatedItems.length > 0 && (
          <div className="detail-field">
            <Text className="detail-label">🔗 Related Items</Text>
            <div className="related-items-list">
              {relatedItems.map((ri, idx) => (
                <div key={idx} className="related-item-row" onClick={() => onRelatedClick?.(ri.item, ri.type)}>
                  <span className="related-item-icon">{ri.type === 'skills' ? '💡' : ri.type === 'prompts' ? '💬' : ri.type === 'dashboards' ? '📊' : ri.type === 'apps' ? '📱' : '✅'}</span>
                  <span className="related-item-label">{ri.label}</span>
                  <span className="related-item-tags">{ri.sharedTags.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="detail-field">
          <Text className="detail-label">Comments ({(item.comments || []).length})</Text>
          <div className="comments-section">
            {(item.comments || []).length === 0 && <Text style={{ opacity: 0.5, fontSize: 13 }}>No comments yet</Text>}
            {(item.comments || []).map((c: Comment) => (
              <div key={c.id} className="comment-item">
                <Flex justifyContent="space-between" alignItems="center">
                  <Text style={{ fontWeight: 600, fontSize: 12 }}>{c.author}</Text>
                  <Text style={{ fontSize: 11, opacity: 0.5 }}>{formatDate(c.createdAt)}</Text>
                </Flex>
                <Text style={{ fontSize: 13 }}>{c.text}</Text>
              </div>
            ))}
            <div className="comment-form">
              <input type="text" value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Your name..." className="comment-author-input" />
              <Flex gap={8}>
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..." className="comment-text-input"
                  onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }} />
                <Button onClick={submitComment} variant="default" disabled={!commentText.trim()}>Post</Button>
              </Flex>
            </div>
          </div>
        </div>
      </Flex>
    </Modal>
  );
};
