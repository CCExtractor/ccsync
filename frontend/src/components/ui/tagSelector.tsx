import * as React from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';

import { cn } from '@/components/utils/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TagSelectorProps {
  options: string[]; // all existing tags (uniqueTags)
  selected: string[]; // currently selected tags
  onChange: (tags: string[]) => void; // update parent state
  placeholder?: string; // optional placeholder text
}

export function TagSelector({
  options,
  selected,
  onChange,
  placeholder = 'Select or create tags…',
}: TagSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const handleCreateTag = () => {
    const newTag = search.trim();

    if (!newTag) return;
    if (selected.includes(newTag)) return;

    onChange([...selected, newTag]);
    setSearch('');
  };

  // Toggle existing tag selection
  const handleSelectTag = (tag: string) => {
    const alreadySelected = selected.includes(tag);

    if (alreadySelected) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  // Remove a tag when X inside the chip is clicked
  const removeTagInsideChip = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((t) => t !== tag));
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] group"
          >
            <div className="flex flex-wrap gap-2 items-center">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md bg-muted text-sm flex items-center gap-1 hover:text-neutral-300
                                group-hover:bg-black group-hover:text-muted-foreground transition-colors"
                  >
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={(e) => removeTagInsideChip(tag, e)}
                    />
                  </span>
                ))
              )}
            </div>

            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-full md:w-[220px] bg-background"
          align="start"
          side="bottom"
        >
          <Command>
            <CommandInput
              placeholder="Search or create tag..."
              value={search}
              onInput={(e: any) => setSearch(e.target.value)}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              <CommandGroup>
                {/* CREATE NEW TAG OPTION */}
                {search.trim() !== '' && !options.includes(search.trim()) && (
                  <CommandItem
                    onSelect={() => handleCreateTag()}
                    className="flex items-center cursor-pointer text-green-500"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{search}"
                  </CommandItem>
                )}

                {/* EXISTING TAGS */}
                {options.map((tag) => {
                  const isSelected = selected.includes(tag);

                  return (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={() => handleSelectTag(tag)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {tag}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
