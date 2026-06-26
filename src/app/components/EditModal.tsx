import React, { useState, useEffect } from 'react';
import { Modal } from '@dynatrace/strato-components/overlays';
import { Button } from '@dynatrace/strato-components/buttons';
import { Flex } from '@dynatrace/strato-components/layouts';
import { FormField, Label, TextInput, TextArea } from '@dynatrace/strato-components/forms';
import { Text } from '@dynatrace/strato-components/typography';
import { TabType, Tag, ItemStatus, STATUS_CONFIG } from '../types';

interface EditModalProps {
  item: any | null;
  tabType: TabType;
  tags: Tag[];
  mode: 'add' | 'edit';
  show: boolean;
  onSave: (item: any) => void;
  onDismiss: () => void;
  getTagSuggestions?: (description: string) => string[];
  getDuplicates?: (item: any) => any[];
}

export const EditModal: React.FC<EditModalProps> = ({ item, tabType, tags, mode, show, onSave, onDismiss, getTagSuggestions, getDuplicates }) => {
  const [formData, setFormData] = useState<any>(mode === 'edit' && item ? { ...item } : { status: 'active' });
  const [selectedTags, setSelectedTags] = useState<string[]>(mode === 'edit' && item ? (item.tags || []) : []);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Auto-suggest tags when description changes
  useEffect(() => {
    if (getTagSuggestions && formData.description) {
      const suggestions = getTagSuggestions(formData.description).filter(s => !selectedTags.includes(s));
      setSuggestedTags(suggestions);
    } else {
      setSuggestedTags([]);
    }
  }, [formData.description, selectedTags, getTagSuggestions]);

  // Detect duplicates
  useEffect(() => {
    if (getDuplicates && (formData.description || formData.skill || formData.prompt || formData.title)) {
      const dupes = getDuplicates({ ...formData, tags: selectedTags });
      setDuplicates(dupes);
    } else {
      setDuplicates([]);
    }
  }, [formData.description, formData.skill, formData.prompt, formData.title, formData.dashboardUrl, formData.appUrl, getDuplicates]);

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
  };

  const handleSubmit = () => {
    const result = { ...formData, tags: selectedTags };
    onSave(result);
  };

  const isValid = (): boolean => {
    if (tabType === 'skills') return !!(formData.skill && formData.description);
    if (tabType === 'prompts') return !!(formData.prompt && formData.description);
    if (tabType === 'dashboards') return !!(formData.name && formData.dashboardUrl && formData.description);
    return !!(formData.name && formData.appUrl && formData.description);
  };

  const title = mode === 'add'
    ? `Add ${tabType === 'skills' ? 'Skill' : tabType === 'prompts' ? 'Prompt' : tabType === 'dashboards' ? 'Dashboard' : 'App'}`
    : `Edit ${tabType === 'skills' ? 'Skill' : tabType === 'prompts' ? 'Prompt' : tabType === 'dashboards' ? 'Dashboard' : 'App'}`;

  const footer = (
    <Flex justifyContent="flex-end" gap={8}>
      <Button onClick={handleSubmit} variant="emphasized" disabled={!isValid()}>
        {mode === 'add' ? 'Add' : 'Save'}
      </Button>
      <Button onClick={onDismiss} variant="default">Cancel</Button>
    </Flex>
  );

  return (
    <Modal title={title} show={show} onDismiss={onDismiss} size="large" footer={footer}>
      <Flex flexDirection="column" gap={16} padding={8}>
        {/* Duplicate warning */}
        {duplicates.length > 0 && (
          <div className="duplicate-warning">
            ⚠️ Possible duplicate{duplicates.length > 1 ? 's' : ''} detected:
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {duplicates.map((d, i) => (
                <li key={i} style={{ fontSize: 12 }}>{d.skill || d.prompt || d.title || d.description || d.appUrl || d.dashboardUrl}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status selector */}
        <FormField>
          <Label>Status</Label>
          <Flex gap={8} flexWrap="wrap">
            {(Object.keys(STATUS_CONFIG) as ItemStatus[]).map(s => (
              <span key={s} className={`status-option ${formData.status === s ? 'status-option-active' : ''}`}
                style={{ borderColor: STATUS_CONFIG[s].color, color: formData.status === s ? STATUS_CONFIG[s].color : undefined }}
                onClick={() => handleFieldChange('status', s)}>
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </span>
            ))}
          </Flex>
        </FormField>

        {/* Name/URL fields */}
        {tabType === 'skills' && (
          <>
            <FormField><Label>Skill Name *</Label>
              <TextInput value={formData.skill || ''} onChange={(e: any) => handleFieldChange('skill', e)} placeholder="Enter skill name..." />
            </FormField>
            <FormField><Label>Repository URL</Label>
              <TextInput value={formData.repoUrl || ''} onChange={(e: any) => handleFieldChange('repoUrl', e)} placeholder="https://github.com/..." />
            </FormField>
          </>
        )}
        {tabType === 'prompts' && (
          <FormField><Label>Prompt Name *</Label>
            <TextInput value={formData.prompt || ''} onChange={(e: any) => handleFieldChange('prompt', e)} placeholder="Enter prompt name..." />
          </FormField>
        )}
        {tabType === 'dashboards' && (
          <>
            <FormField><Label>Name *</Label>
              <TextInput value={formData.name || ''} onChange={(e: any) => handleFieldChange('name', e)} placeholder="Enter dashboard name..." />
            </FormField>
            <FormField><Label>Dashboard URL *</Label>
              <TextInput value={formData.dashboardUrl || ''} onChange={(e: any) => handleFieldChange('dashboardUrl', e)} placeholder="https://..." />
            </FormField>
            <FormField><Label>Repository URL</Label>
              <TextInput value={formData.repoUrl || ''} onChange={(e: any) => handleFieldChange('repoUrl', e)} placeholder="https://github.com/..." />
            </FormField>
          </>
        )}
        {tabType === 'apps' && (
          <>
            <FormField><Label>Name *</Label>
              <TextInput value={formData.name || ''} onChange={(e: any) => handleFieldChange('name', e)} placeholder="Enter app name..." />
            </FormField>
            <FormField><Label>App URL *</Label>
              <TextInput value={formData.appUrl || ''} onChange={(e: any) => handleFieldChange('appUrl', e)} placeholder="https://..." />
            </FormField>
            <FormField><Label>Repository URL</Label>
              <TextInput value={formData.repoUrl || ''} onChange={(e: any) => handleFieldChange('repoUrl', e)} placeholder="https://github.com/..." />
            </FormField>
          </>
        )}

        {/* Author */}
        <FormField><Label>Author</Label>
          <TextInput value={formData.author || ''} onChange={(e: any) => handleFieldChange('author', e)} placeholder="Author name..." />
        </FormField>

        {/* Description */}
        <FormField><Label>Description *</Label>
          <TextArea value={formData.description || ''} onChange={(e: any) => handleFieldChange('description', e)} placeholder="Enter a detailed description..." rows={5} />
        </FormField>

        {/* Prompt text (prompts only) */}
        {tabType === 'prompts' && (
          <FormField><Label>Prompt</Label>
            <TextArea value={formData.promptText || ''} onChange={(e: any) => handleFieldChange('promptText', e)} placeholder="Paste the full prompt text here..." rows={6} />
          </FormField>
        )}

        {/* Tag suggestions */}
        {suggestedTags.length > 0 && (
          <div className="tag-suggestions">
            <Text style={{ fontSize: 12, opacity: 0.7 }}>💡 Suggested tags:</Text>
            <Flex gap={6} flexWrap="wrap" style={{ marginTop: 4 }}>
              {suggestedTags.map(tag => (
                <span key={tag} className="suggested-tag" onClick={() => toggleTag(tag)}>{tag} +</span>
              ))}
            </Flex>
          </div>
        )}

        {/* Tags */}
        <div>
          <Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tags</Text>
          <Flex gap={6} flexWrap="wrap">
            {tags.map(tag => (
              <span key={tag.id}
                className={`filter-tag-chip ${selectedTags.includes(tag.name) ? 'filter-tag-active' : ''}`}
                style={{ backgroundColor: selectedTags.includes(tag.name) ? `${tag.color}33` : 'transparent', color: tag.color, borderColor: selectedTags.includes(tag.name) ? tag.color : `${tag.color}44` }}
                onClick={() => toggleTag(tag.name)}>
                {tag.name}
              </span>
            ))}
          </Flex>
        </div>
      </Flex>
    </Modal>
  );
};
