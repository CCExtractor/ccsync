import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelectProps } from '@/components/utils/types';
import { ChevronDown, Plus, Check, X } from 'lucide-react';
import { getFilteredItems, shouldShowCreateOption } from './multi-select-utils';

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      availableItems,
      selectedItems,
      onItemsChange,
      placeholder = 'Select or create items',
      disabled = false,
      className = '',
      showActions = false,
      onSave,
      onCancel,
    },
    ref
  ) => {
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
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredItems = getFilteredItems(
      availableItems,
      selectedItems,
      searchTerm
    );

    const handleItemSelect = (item: string) => {
      if (!selectedItems.includes(item)) {
        onItemsChange([...selectedItems, item]);
      }
      setSearchTerm('');
    };

    const handleItemRemove = (itemToRemove: string) => {
      onItemsChange(selectedItems.filter((item) => item !== itemToRemove));
    };

    const handleNewItemCreate = () => {
      const trimmedTerm = searchTerm.trim();
      if (
        trimmedTerm &&
        !selectedItems.includes(trimmedTerm) &&
        !availableItems.includes(trimmedTerm)
      ) {
        onItemsChange([...selectedItems, trimmedTerm]);
        setSearchTerm('');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchTerm.trim()) {
          if (filteredItems.length > 0) {
            handleItemSelect(filteredItems[0]);
          } else {
            handleNewItemCreate();
          }
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const showCreate = shouldShowCreateOption(
      searchTerm,
      availableItems,
      selectedItems
    );

    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between text-left font-normal"
          aria-label="Select items"
        >
          <span className="truncate">
            {selectedItems.length > 0
              ? `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} selected`
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>

        {selectedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {selectedItems.map((item) => (
              <Badge key={item} className="flex items-center gap-1">
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleItemRemove(item)}
                  className="ml-1 text-red-500 hover:text-red-700 text-xs"
                  disabled={disabled}
                  aria-label={`Remove ${item}`}
                >
                  ✖
                </button>
              </Badge>
            ))}
            {showActions && onSave && onCancel && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onSave}
                  className="h-8 w-8"
                  aria-label="Save items"
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b">
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or create..."
                className="h-8"
                autoFocus
              />
            </div>

            <div className="max-h-40 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item}
                  className="px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleItemSelect(item)}
                >
                  <span className="text-sm">{item}</span>
                </div>
              ))}

              {showCreate && (
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors border-t"
                  onClick={handleNewItemCreate}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">
                    Create "{searchTerm.trim()}"
                  </span>
                </div>
              )}

              {filteredItems.length === 0 && !showCreate && (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                  No items found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
