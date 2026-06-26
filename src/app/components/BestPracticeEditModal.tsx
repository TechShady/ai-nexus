import React, { useState, useEffect } from 'react';
import { Modal } from '@dynatrace/strato-components/overlays';
import { Button } from '@dynatrace/strato-components/buttons';
import { Flex } from '@dynatrace/strato-components/layouts';
import { FormField, Label, TextInput } from '@dynatrace/strato-components/forms';
import { Text } from '@dynatrace/strato-components/typography';
import { PlusIcon, DeleteIcon } from '@dynatrace/strato-icons';
import { BestPracticeItem, Tag } from '../types';

interface BestPracticeEditModalProps {
  item: BestPracticeItem | null;
  tags: Tag[];
  mode: 'add' | 'edit';
  show: boolean;
  onSave: (item: BestPracticeItem) => void;
  onDismiss: () => void;
}

export const BestPracticeEditModal: React.FC<BestPracticeEditModalProps> = ({
  item, tags, mode, show, onSave, onDismiss,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [practices, setPractices] = useState<string[]>(['']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (mode === 'edit' && item) {
      setTitle(item.title || '');
      setAuthor(item.author || '');
      setPractices(item.practices.length > 0 ? [...item.practices] : ['']);
      setSelectedTags(item.tags || []);
    } else {
      setTitle('');
      setAuthor('');
      setPractices(['']);
      setSelectedTags([]);
    }
  }, [item, mode, show]);

  const handlePracticeChange = (index: number, value: string) => {
    const updated = [...practices];
    updated[index] = value;
    setPractices(updated);
  };

  const addPractice = () => {
    setPractices([...practices, '']);
  };

  const removePractice = (index: number) => {
    if (practices.length <= 1) return;
    setPractices(practices.filter((_, i) => i !== index));
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const handleSubmit = () => {
    const cleanPractices = practices.map(p => p.trim()).filter(Boolean);
    const result: any = {
      ...(item || {}),
      title: title.trim(),
      author: author.trim(),
      practices: cleanPractices,
      tags: selectedTags,
    };
    onSave(result);
  };

  const isValid = title.trim() && author.trim() && practices.some(p => p.trim());

  const footer = (
    <Flex justifyContent="flex-end" gap={8}>
      <Button onClick={handleSubmit} variant="emphasized" disabled={!isValid}>
        {mode === 'add' ? 'Add Card' : 'Save'}
      </Button>
      <Button onClick={onDismiss} variant="default">Cancel</Button>
    </Flex>
  );

  return (
    <Modal
      title={mode === 'add' ? 'Add Best Practice Card' : 'Edit Best Practice Card'}
      show={show}
      onDismiss={onDismiss}
      size="large"
      footer={footer}
    >
      <Flex flexDirection="column" gap={16} padding={8}>
        <FormField>
          <Label>Card Title *</Label>
          <TextInput
            value={title}
            onChange={(e: any) => setTitle(e)}
            placeholder="e.g., DQL Query Writing, Dashboard Design..."
          />
        </FormField>

        <FormField>
          <Label>Author *</Label>
          <TextInput
            value={author}
            onChange={(e: any) => setAuthor(e)}
            placeholder="Author name..."
          />
        </FormField>

        {/* Best Practice Items */}
        <div>
          <Flex justifyContent="space-between" alignItems="center" style={{ marginBottom: 8 }}>
            <Label>Best Practices *</Label>
            <Button onClick={addPractice} variant="default">
              <Button.Prefix><PlusIcon /></Button.Prefix>
              Add Item
            </Button>
          </Flex>

          <Flex flexDirection="column" gap={8}>
            {practices.map((practice, index) => (
              <Flex key={index} gap={8} alignItems="center">
                <span className="bp-bullet-num">{index + 1}.</span>
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={practice}
                    onChange={(e: any) => handlePracticeChange(index, e)}
                    placeholder="Enter a best practice tip..."
                  />
                </div>
                {practices.length > 1 && (
                  <span
                    className="action-btn action-btn-danger"
                    onClick={() => removePractice(index)}
                  >
                    <DeleteIcon />
                  </span>
                )}
              </Flex>
            ))}
          </Flex>
        </div>

        {/* Tags */}
        <div>
          <Text className="detail-label">Tags</Text>
          <Flex gap={8} flexWrap="wrap" style={{ marginTop: 8 }}>
            {tags.map(tag => (
              <span
                key={tag.id}
                className={`tag-chip-select ${selectedTags.includes(tag.name) ? 'tag-chip-selected' : ''}`}
                style={{
                  backgroundColor: selectedTags.includes(tag.name) ? `${tag.color}33` : 'transparent',
                  color: tag.color,
                  borderColor: selectedTags.includes(tag.name) ? tag.color : `${tag.color}44`,
                }}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </span>
            ))}
          </Flex>
        </div>
      </Flex>
    </Modal>
  );
};
