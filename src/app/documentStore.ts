import { documentsClient } from '@dynatrace-sdk/client-document';

/**
 * Multi-user Document Store strategy:
 * - Each user writes to their OWN document per collection (owner always has write permission)
 * - All documents are made public (isPrivate: false) so everyone can READ them
 * - On load: listDocuments by type → read all → merge items by ID (latest updatedAt wins)
 * - Result: everyone sees everyone's contributions without needing environment shares
 */

const COLLECTION_TYPES: Record<string, string> = {
  tags: 'ai-nexus-tags',
  skills: 'ai-nexus-skills',
  prompts: 'ai-nexus-prompts',
  dashboards: 'ai-nexus-dashboards',
  apps: 'ai-nexus-apps',
  bestPractices: 'ai-nexus-bestpractices',
  collections: 'ai-nexus-collections',
  deletedIds: 'ai-nexus-deletedids',
};

const MY_DOC_IDS_KEY = 'ai-nexus-my-doc-ids';

/** Get or create a stable per-user document ID for a collection */
function getMyDocId(collection: string): string {
  const stored = localStorage.getItem(MY_DOC_IDS_KEY);
  const ids: Record<string, string> = stored ? JSON.parse(stored) : {};
  if (!ids[collection]) {
    // Generate a unique doc ID (must not be a bare UUID, allowed: A-Za-z0-9-)
    ids[collection] = `ai-nexus-${collection}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(MY_DOC_IDS_KEY, JSON.stringify(ids));
  }
  return ids[collection];
}

async function getDocVersion(docId: string): Promise<string | null> {
  try {
    const meta = await documentsClient.getDocumentMetadata({ id: docId });
    return meta.version;
  } catch {
    return null;
  }
}

/** Load all documents of a given type from all users, merge items by ID */
export async function loadFromDocStore<T extends { id: string; updatedAt?: string }>(key: string): Promise<T[] | null> {
  const docType = COLLECTION_TYPES[key];
  if (!docType) return null;

  try {
    // List all documents of this type (includes own + public + shared)
    const list = await documentsClient.listDocuments({
      filter: `type = '${docType}'`,
      pageSize: 100,
    });

    if (!list.documents || list.documents.length === 0) return null;

    // Read content of each document and merge
    const seenIds = new Map<string, T>();

    for (const doc of list.documents) {
      try {
        const response = await documentsClient.getDocument({ id: doc.id });
        if (!response.content) continue;
        const text = await response.content.get('text');
        const items: T[] = JSON.parse(text);
        for (const item of items) {
          const existing = seenIds.get(item.id);
          if (!existing) {
            seenIds.set(item.id, item);
          } else {
            // Keep the most recently updated version
            const existingTime = (existing as any).updatedAt || '';
            const newTime = (item as any).updatedAt || '';
            if (newTime > existingTime) {
              seenIds.set(item.id, item);
            }
          }
        }
      } catch {
        // Skip unreadable documents
      }
    }

    return seenIds.size > 0 ? Array.from(seenIds.values()) : null;
  } catch (e) {
    console.error(`[DocStore] Failed to load ${key}:`, e);
    return null;
  }
}

/** Save data to the current user's own document for a collection */
export async function saveToDocStore<T>(key: string, data: T[]): Promise<void> {
  const docType = COLLECTION_TYPES[key];
  if (!docType) return;

  const docId = getMyDocId(key);
  const content = new Blob([JSON.stringify(data)], { type: 'application/json' });

  try {
    const version = await getDocVersion(docId);
    if (version) {
      await documentsClient.updateDocument({
        id: docId,
        optimisticLockingVersion: version,
        body: { content, isPrivate: false },
      });
    } else {
      await documentsClient.createDocument({
        body: { id: docId, name: `AI Nexus ${key}`, type: docType, content },
      });
      // Make it public so others can read it
      try {
        const newVersion = await getDocVersion(docId);
        if (newVersion) {
          await documentsClient.updateDocument({
            id: docId,
            optimisticLockingVersion: newVersion,
            body: { isPrivate: false },
          });
        }
      } catch {
        // Best effort
      }
    }
  } catch (e) {
    console.error(`[DocStore] Failed to save ${key}:`, e);
  }
}

export async function loadAllFromDocStore(): Promise<{
  tags: any[] | null;
  skills: any[] | null;
  prompts: any[] | null;
  dashboards: any[] | null;
  apps: any[] | null;
  bestPractices: any[] | null;
  collections: any[] | null;
  deletedIds: any[] | null;
}> {
  const [tags, skills, prompts, dashboards, apps, bestPractices, collections, deletedIds] = await Promise.all([
    loadFromDocStore('tags'),
    loadFromDocStore('skills'),
    loadFromDocStore('prompts'),
    loadFromDocStore('dashboards'),
    loadFromDocStore('apps'),
    loadFromDocStore('bestPractices'),
    loadFromDocStore('collections'),
    loadFromDocStore('deletedIds'),
  ]);
  return { tags, skills, prompts, dashboards, apps, bestPractices, collections, deletedIds };
}

// Legacy exports (no-ops, kept for API compatibility with App.tsx)
export async function claimShares(): Promise<void> {}
export async function bootstrapSharing(): Promise<void> {}
