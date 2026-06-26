import React from 'react';
import { Tag } from '../types';

interface TagChipsProps {
  tagNames: string[];
  allTags: Tag[];
}

export const TagChips: React.FC<TagChipsProps> = ({ tagNames, allTags }) => {
  if (!tagNames || tagNames.length === 0) return null;

  return (
    <div className="tag-chips">
      {tagNames.map(name => {
        const tag = allTags.find(t => t.name === name);
        const color = tag?.color || '#4589FF';
        return (
          <span
            key={name}
            className="tag-chip"
            style={{ backgroundColor: `${color}30`, color: color, borderColor: `${color}55`, textShadow: `0 0 1px ${color}` }}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
};
