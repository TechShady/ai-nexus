import React from 'react';
import { Modal } from '@dynatrace/strato-components/overlays';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Text } from '@dynatrace/strato-components/typography';
import {
  CodeIcon,
  DocumentIcon,
  ChartCollectionIcon,
  AppsIcon,
  CheckmarkIcon,
  SettingIcon,
} from '@dynatrace/strato-icons';

interface HelpModalProps {
  show: boolean;
  onDismiss: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ show, onDismiss }) => {
  if (!show) return null;

  return (
    <Modal title="AI Nexus — Help Guide" show={show} onDismiss={onDismiss} size="large">
      <Flex flexDirection="column" gap={0} padding={8}>

        <div className="help-section">
          <div className="help-section-title">Welcome to AI Nexus v0.6.0</div>
          <div className="help-section-body">
            AI Nexus is your team's central knowledge hub for AI-generated artifacts. Organize, search,
            rate, comment on, and share skills, prompts, dashboards, apps, and best practices.
            Data is persisted to the Dynatrace Document Store.
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">🏠 Home Page</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Global Search</strong> — Search across ALL tabs at once from the home page. Results show the type and name, click to view details.</li>
              <li><strong>Recently Added</strong> — Feed showing the last 10 items added in the past 7 days across all categories.</li>
              <li><strong>Most Popular</strong> — Items ranked by rating + usage count. Rate and use items to build this list.</li>
              <li><strong>Stale Items Warning</strong> — Alerts you when items haven't been updated in 90+ days, prompting review.</li>
              <li><strong>Quick Access Cards</strong> — Click any category card to jump directly to that tab.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title"><CodeIcon /> Skills &amp; <DocumentIcon /> Prompts</div>
          <div className="help-section-body">
            Store and manage AI agent skills and reusable prompt templates.
            <ul className="help-feature-list">
              <li><strong>Name, Description, Author, Tags</strong> — Core fields for organizing items.</li>
              <li><strong>Status Badges</strong> — Mark items as Draft, Active, Verified, or Deprecated.</li>
              <li><strong>Ratings</strong> — Rate items 1-5 stars. Average rating displayed in the table.</li>
              <li><strong>Usage Tracking (Uses column)</strong> — The "Uses" column shows how many times an item has been accessed. The count increments automatically when you view details or copy an item.</li>
              <li><strong>One-Click Copy</strong> — 📋 button copies the description to clipboard instantly.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title"><ChartCollectionIcon /> Dashboards &amp; <AppsIcon /> Apps</div>
          <div className="help-section-body">
            Track AI-generated dashboards and platform apps with URLs and repository links.
            <ul className="help-feature-list">
              <li><strong>Clickable URLs</strong> — Dashboard/App URLs open in new tabs. Repo URLs link to source code.</li>
              <li><strong>Author field</strong> — Track who created each dashboard or app.</li>
              <li><strong>All features from Skills/Prompts</strong> — Ratings, status, copy, pin, duplicate all work here too.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title"><CheckmarkIcon /> Best Practices</div>
          <div className="help-section-body">
            Card-based layout for capturing team best practices and lessons learned.
            <ul className="help-feature-list">
              <li><strong>Fixed-height cards</strong> — Cards show ~5 items by default with expand/collapse toggle.</li>
              <li><strong>Pin, Copy, Duplicate</strong> — Same actions available as other tabs.</li>
              <li><strong>Card grid layout</strong> — Visual card layout for easier scanning.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">⭐ Ratings &amp; Popularity</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Rate items</strong> — Open any item's detail view and click 1-5 stars to rate it.</li>
              <li><strong>Usage count</strong> — Automatically increments when you view details or copy an item.</li>
              <li><strong>Sort by Rating/Usage</strong> — Use the sort dropdown to find the most popular items.</li>
              <li><strong>Most Popular section</strong> — Home page shows top items ranked by combined rating + usage.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">💬 Comments</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Add comments</strong> — Open item details and scroll to the comments section.</li>
              <li><strong>Author name</strong> — Enter your name (remembered per comment). Leave blank for "Anonymous".</li>
              <li><strong>Useful for</strong> — "Works great with GPT-4o", "Needs update for new API", team feedback.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">📌 Pinned Items &amp; Favorites</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Pin</strong> — Click 📌 on any item to pin it to the top of the list. Survives sorting/filtering.</li>
              <li><strong>Favorite (★)</strong> — Click the star to mark favorites. Use the Favorites toggle to filter.</li>
              <li><strong>Combined</strong> — Pinned items always appear first, then sorted items within pinned/unpinned groups.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">🔄 Sort &amp; Filter</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Sort by</strong> — Updated, Created, Name, Rating, or Usage. Toggle ascending/descending with ↑/↓.</li>
              <li><strong>Filter by field</strong> — Use the dropdown to search by Tags, Author, or Description.</li>
              <li><strong>Tag filter chips</strong> — Click tags in the filter bar for quick multi-tag filtering.</li>
              <li><strong>Favorites only</strong> — Toggle to show only starred items.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">📦 Bulk Operations</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Bulk Select</strong> — Click "Bulk Select" to enable checkboxes. Select multiple items.</li>
              <li><strong>Delete Selected</strong> — Remove all selected items at once.</li>
              <li><strong>Tag Selected</strong> — Apply a tag to all selected items simultaneously.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">📄 Duplicate &amp; Copy</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Duplicate (📄)</strong> — Clone any item as a starting template with "(copy)" appended.</li>
              <li><strong>Copy (📋)</strong> — One-click copies the description/content to your clipboard. Increments usage count.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">🏷️ Status Badges</div>
          <div className="help-section-body">
            Mark items with a lifecycle status to signal maturity and confidence. The progression is:
            <br /><br />
            <strong>Draft → Active → Verified → Deprecated</strong>
            <ul className="help-feature-list">
              <li><strong>📝 Draft</strong> — Work in progress, not yet ready for team use.</li>
              <li><strong>✅ Active</strong> — The item is live and available but hasn't been formally reviewed or validated. This is the default status for newly created or imported items.</li>
              <li><strong>🏆 Verified</strong> — The item has been reviewed/validated and confirmed to be correct, high-quality, or officially approved. A step above Active indicating someone has vetted it.</li>
              <li><strong>⚠️ Deprecated</strong> — No longer recommended, kept for reference.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title">🤖 AI-Powered Features</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Auto-Tag Suggestions</strong> — When you type a description, AI suggests relevant tags based on keywords (e.g., mentioning "kubernetes" suggests "K8s").</li>
              <li><strong>Duplicate Detection</strong> — When adding/editing, a warning appears if a similar item already exists, preventing accidental duplicates.</li>
              <li><strong>Stale Review Reminders</strong> — Items not updated in 90+ days are flagged on the home page.</li>
            </ul>
          </div>
        </div>

        <div className="help-section">
          <div className="help-section-title"><SettingIcon /> Settings &amp; Import/Export</div>
          <div className="help-section-body">
            <ul className="help-feature-list">
              <li><strong>Tag Management</strong> — Add, edit, or delete tags with custom colors.</li>
              <li><strong>CSV Import</strong> — Bulk-add items by uploading a CSV file.</li>
              <li><strong>CSV Export</strong> — Download filtered items as CSV for backup or sharing.</li>
              <li><strong>Data Persistence</strong> — All data stored in Dynatrace Document Store, survives deployments.</li>
            </ul>
          </div>
        </div>

      </Flex>
    </Modal>
  );
};
