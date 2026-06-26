import React, { useState, useEffect } from 'react';
import { Modal } from '@dynatrace/strato-components/overlays';
import { Button } from '@dynatrace/strato-components/buttons';
import { Flex } from '@dynatrace/strato-components/layouts';
import { FormField, Label, TextInput } from '@dynatrace/strato-components/forms';
import { Heading, Text } from '@dynatrace/strato-components/typography';
import { PlusIcon, DeleteIcon } from '@dynatrace/strato-icons';
import { Tag, TAG_COLORS } from '../types';
import { generateId } from '../storage';

interface SettingsModalProps {
  show: boolean;
  tags: Tag[];
  onSave: (tags: Tag[]) => void;
  onDismiss: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ show, tags, onSave, onDismiss }) => {
  const [localTags, setLocalTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    setLocalTags([...tags]);
  }, [tags, show]);

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    if (localTags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) return;
    setLocalTags([...localTags, { id: generateId(), name: newTagName.trim(), color: selectedColor }]);
    setNewTagName('');
    setSelectedColor(TAG_COLORS[(localTags.length + 1) % TAG_COLORS.length]);
  };

  const handleRemoveTag = (id: string) => {
    setLocalTags(localTags.filter(t => t.id !== id));
  };

  const handleSave = () => {
    onSave(localTags);
    onDismiss();
  };

  const footer = (
    <Flex justifyContent="flex-end" gap={8}>
      <Button onClick={handleSave} variant="emphasized">Save</Button>
      <Button onClick={onDismiss} variant="default">Cancel</Button>
    </Flex>
  );

  return (
    <Modal title="Settings — Manage Tags" show={show} onDismiss={onDismiss} size="medium" footer={footer}>
      <Flex flexDirection="column" gap={20} padding={8}>
        <Text>Tags help organize items across all tabs. Add, edit, or remove tags below.</Text>

        {/* Add new tag */}
        <Flex gap={8} alignItems="flex-end">
          <FormField style={{ flex: 1 }}>
            <Label>New Tag Name</Label>
            <TextInput
              value={newTagName}
              onChange={(e: any) => setNewTagName(e)}
              placeholder="Enter tag name..."
              onKeyDown={(e: any) => { if (e.key === 'Enter') handleAddTag(); }}
            />
          </FormField>
          <div>
            <Label>Color</Label>
            <Flex gap={4} flexWrap="wrap" style={{ marginTop: 4 }}>
              {TAG_COLORS.map(color => (
                <span
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'color-swatch-selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </Flex>
          </div>
          <Button onClick={handleAddTag} variant="emphasized" disabled={!newTagName.trim()}>
            <Button.Prefix><PlusIcon /></Button.Prefix>
            Add
          </Button>
        </Flex>

        {/* Existing tags */}
        <div>
          <Heading level={4}>Existing Tags ({localTags.length})</Heading>
          <Flex flexDirection="column" gap={8} style={{ marginTop: 12 }}>
            {localTags.map(tag => (
              <Flex key={tag.id} alignItems="center" justifyContent="space-between" className="tag-row">
                <Flex alignItems="center" gap={8}>
                  <span className="tag-color-dot" style={{ backgroundColor: tag.color }} />
                  <Text>{tag.name}</Text>
                </Flex>
                <span className="action-btn action-btn-danger" onClick={() => handleRemoveTag(tag.id)}>
                  <DeleteIcon />
                </span>
              </Flex>
            ))}
            {localTags.length === 0 && (
              <Text className="empty-state-hint">No tags defined. Add one above.</Text>
            )}
          </Flex>
        </div>
      </Flex>
    </Modal>
  );
};
