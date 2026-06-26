import React, { useState } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Button } from '@dynatrace/strato-components/buttons';
import { Text } from '@dynatrace/strato-components/typography';
import { FavoriteIcon, UnfavoriteIcon } from '@dynatrace/strato-icons';
import { Tag } from '../types';

export type SearchField = 'tags' | 'author' | 'description';

interface SearchFilterBarProps {
  searchQuery: string;
  searchField: SearchField;
  onSearchChange: (query: string) => void;
  onSearchFieldChange: (field: SearchField) => void;
  tags: Tag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  showFavoritesOnly: boolean;
  onFavoritesChange: (show: boolean) => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery, searchField, onSearchChange, onSearchFieldChange,
  tags, selectedTags, onTagsChange, showFavoritesOnly, onFavoritesChange,
}) => {
  const toggleTag = (tagName: string) => {
    onTagsChange(
      selectedTags.includes(tagName)
        ? selectedTags.filter(t => t !== tagName)
        : [...selectedTags, tagName]
    );
  };

  const clearFilters = () => {
    onSearchChange('');
    onTagsChange([]);
    onFavoritesChange(false);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || showFavoritesOnly;

  return (
    <div className="search-filter-bar">
      <Flex gap={12} alignItems="center" flexWrap="wrap">
        {/* Field selector dropdown + search input */}
        <div className="search-combo">
          <select
            className="search-field-select"
            value={searchField}
            onChange={(e) => onSearchFieldChange(e.target.value as SearchField)}
          >
            <option value="tags">Tags</option>
            <option value="author">Author</option>
            <option value="description">Description</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              searchField === 'tags' ? 'Filter by tag name...'
                : searchField === 'author' ? 'Filter by author...'
                : 'Filter by description...'
            }
            className="search-input"
          />
        </div>

        {/* Favorites toggle */}
        <Button
          onClick={() => onFavoritesChange(!showFavoritesOnly)}
          variant={showFavoritesOnly ? 'emphasized' : 'default'}
          className="favorites-btn"
        >
          <Button.Prefix>
            {showFavoritesOnly ? <FavoriteIcon /> : <UnfavoriteIcon />}
          </Button.Prefix>
          Favorites
        </Button>

        {/* Tag filter chips — quick select */}
        {searchField === 'tags' && (
          <Flex gap={6} flexWrap="wrap" alignItems="center">
            {tags.map(tag => (
              <span
                key={tag.id}
                className={`filter-tag-chip ${selectedTags.includes(tag.name) ? 'filter-tag-active' : ''}`}
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
        )}

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <Flex gap={8} alignItems="center">
            <Text style={{ fontSize: 12, opacity: 0.7 }}>
              Filtering by {searchField}{searchQuery ? `: "${searchQuery}"` : ''}
              {selectedTags.length > 0 ? ` + ${selectedTags.length} tag(s)` : ''}
              {showFavoritesOnly ? ' + favorites' : ''}
            </Text>
            <Button onClick={clearFilters} variant="default" className="clear-filters-btn">
              Clear filters
            </Button>
          </Flex>
        )}
      </Flex>
    </div>
  );
};
