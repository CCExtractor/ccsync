import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagMultiSelectProps } from '@/components/utils/types';
import { ChevronDown, Plus } from 'lucide-react';

export const TagMultiSelect = ({
  availableTags,
  selectedTags,
  onTagsChange,
  placeholder = 'Select or create tags',
  disabled = false,
  className = '',
}: TagMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFilteredTags = () => {
    return availableTags.filter(
      (tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedTags.includes(tag)
    );
  };

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
    setSearchTerm('');
  };

  const handleTagRemove = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleNewTagCreate = () => {
    const trimmedTerm = searchTerm.trim();
    if (
      trimmedTerm &&
      !selectedTags.includes(trimmedTerm) &&
      !availableTags.includes(trimmedTerm)
    ) {
      onTagsChange([...selectedTags, trimmedTerm]);
      setSearchTerm('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const filteredTags = getFilteredTags();
      if (filteredTags.length > 0) {
        handleTagSelect(filteredTags[0]);
      } else if (searchTerm.trim()) {
        handleNewTagCreate();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const showCreateOption =
    searchTerm.trim() &&
    !availableTags.includes(searchTerm.trim()) &&
    !selectedTags.includes(searchTerm.trim());

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between text-left font-normal"
      >
        <span className="truncate">
          {selectedTags.length > 0
            ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
            : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or create tags..."
              className="h-8"
              autoFocus
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {getFilteredTags().map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleTagSelect(tag)}
              >
                <input
                  type="checkbox"
                  checked={false}
                  readOnly
                  className="h-4 w-4"
                />
                <span className="flex-1 text-sm">{tag}</span>
              </div>
            ))}

            {showCreateOption && (
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors border-t"
                onClick={handleNewTagCreate}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm">
                  Create "{searchTerm.trim()}"
                </span>
              </div>
            )}

            {getFilteredTags().length === 0 && !showCreateOption && (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No tags found
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleTagRemove(tag)}
                className="ml-1 text-red-500 hover:text-red-700 text-xs"
                disabled={disabled}
              >
                ✖
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
