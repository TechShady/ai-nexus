import React, { useState } from 'react';
import { Modal } from '@dynatrace/strato-components/overlays';
import { Button } from '@dynatrace/strato-components/buttons';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Text, Paragraph } from '@dynatrace/strato-components/typography';
import { UploadIcon } from '@dynatrace/strato-icons';
import { TabType } from '../types';
import { parseCsv } from '../utils/csv';

interface CsvImportModalProps {
  show: boolean;
  tabType: TabType;
  onImport: (items: any[]) => void;
  onDismiss: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ show, tabType, onImport, onDismiss }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState('');

  const expectedHeaders: Record<TabType, string[]> = {
    skills: ['skill', 'description', 'author', 'tags'],
    prompts: ['prompt', 'description', 'author', 'tags'],
    dashboards: ['dashboardUrl', 'description', 'repoUrl', 'tags'],
    apps: ['appUrl', 'description', 'repoUrl', 'tags'],
    bestpractices: ['title', 'author', 'practices', 'tags'],
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const items = parseCsv(text, tabType);
        setPreview(items.slice(0, 5));
        if (items.length === 0) {
          setError('No valid rows found. Check CSV format.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV');
        setPreview([]);
      }
    };
    reader.readAsText(f);
  };

  const handleImport = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const items = parseCsv(text, tabType);
        onImport(items);
        setFile(null);
        setPreview([]);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleDismiss = () => {
    setFile(null);
    setPreview([]);
    setError('');
    onDismiss();
  };

  const footer = (
    <Flex justifyContent="flex-end" gap={8}>
      <Button onClick={handleImport} variant="emphasized" disabled={!file || preview.length === 0}>
        <Button.Prefix><UploadIcon /></Button.Prefix>
        Import {preview.length > 0 ? `(${preview.length}+ rows)` : ''}
      </Button>
      <Button onClick={handleDismiss} variant="default">Cancel</Button>
    </Flex>
  );

  return (
    <Modal title="Import from CSV" show={show} onDismiss={handleDismiss} size="medium" footer={footer}>
      <Flex flexDirection="column" gap={16} padding={8}>
        <Paragraph>
          Upload a CSV file with the following columns:
        </Paragraph>
        <Text style={{ fontFamily: 'monospace' }}>
          {expectedHeaders[tabType].join(', ')}
        </Text>
        <Text className="empty-state-hint">
          Tags should be separated by semicolons (e.g., "Business;K8s")
        </Text>

        <div className="csv-upload-area">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="csv-file-input"
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input" className="csv-upload-label">
            <UploadIcon />
            <Text>{file ? file.name : 'Click to select CSV file'}</Text>
          </label>
        </div>

        {error && <Text className="error-text">{error}</Text>}

        {preview.length > 0 && (
          <div>
            <Text style={{ fontWeight: 600 }}>Preview (first {preview.length} rows):</Text>
            <div className="csv-preview">
              {preview.map((row, i) => (
                <div key={i} className="csv-preview-row">
                  {Object.entries(row).map(([key, val]) => (
                    <span key={key}><strong>{key}:</strong> {String(val)}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Flex>
    </Modal>
  );
};
