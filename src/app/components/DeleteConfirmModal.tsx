import React from 'react';
import { Modal } from '@dynatrace/strato-components/overlays';
import { Button } from '@dynatrace/strato-components/buttons';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Text, Paragraph } from '@dynatrace/strato-components/typography';
import { TabType } from '../types';

interface DeleteConfirmModalProps {
  item: any | null;
  tabType: TabType;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ item, tabType, onConfirm, onDismiss }) => {
  if (!item) return null;

  const itemName = tabType === 'skills' ? item.skill
    : tabType === 'prompts' ? item.prompt
    : tabType === 'dashboards' ? item.dashboardUrl
    : tabType === 'bestpractices' ? item.title
    : item.appUrl;

  const footer = (
    <Flex justifyContent="flex-end" gap={8}>
      <Button onClick={onConfirm} variant="emphasized">
        Delete
      </Button>
      <Button onClick={onDismiss} variant="default">Cancel</Button>
    </Flex>
  );

  return (
    <Modal title="Confirm Delete" show={!!item} onDismiss={onDismiss} size="small" footer={footer}>
      <Flex flexDirection="column" gap={12} padding={8}>
        <Paragraph>Are you sure you want to delete this item?</Paragraph>
        <Text style={{ fontWeight: 600 }}>{itemName}</Text>
        <Text className="delete-warning">This action cannot be undone.</Text>
      </Flex>
    </Modal>
  );
};
