import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/components/utils/utils';
import { Input } from '@/components/ui/input';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';

const LocalPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]',
      className
    )}
    {...props}
  />
));
LocalPopoverContent.displayName = 'LocalPopoverContent';

interface SearchAndAddSelectorProps {
  options: string[];
  selected: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function SearchAndAddSelector({
  options,
  selected,
  onChange,
  placeholder = 'Search or create..',
}: SearchAndAddSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );

  const isNewItem =
    searchValue.trim() !== '' &&
    !options.some(
      (opt) => opt.toLowerCase() === searchValue.trim().toLowerCase()
    );

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const handleCreateItem = () => {
    const newItem = searchValue.trim();
    if (newItem && !selected.includes(newItem)) {
      onChange([...selected, newItem]);
      setSearchValue('');
    }
  };

  const handleRemoveItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isNewItem) {
      e.preventDefault();
      handleCreateItem();
    }
  };

  return (
    <div className={cn('w-full')}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] hover:bg-transparent"
          >
            <div className="flex flex-wrap gap-1 items-center flex-1">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((item) => (
                  <span
                    key={item}
                    className="px-2 py-0.5 rounded-md bg-muted text-sm flex items-center gap-1"
                  >
                    {item}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={(e) => handleRemoveItem(item, e)}
                    />
                  </span>
                ))
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverPrimitive.Trigger>

        <LocalPopoverContent className="w-full p-0" align="start">
          <div className="p-2">
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isNewItem && (
              <div
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-green-500"
                onClick={handleCreateItem}
              >
                <span className="mr-2">+</span>
                Create "{searchValue.trim()}"
              </div>
            )}

            {filteredOptions.length === 0 && !isNewItem ? (
              <div className="px-3 py-2 text-muted-foreground text-sm">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <div
                    key={option}
                    className={cn(
                      'flex items-center px-3 py-2 cursor-pointer hover:bg-accent',
                      isSelected && 'bg-accent/50'
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option}
                  </div>
                );
              })
            )}
          </div>
        </LocalPopoverContent>
      </PopoverPrimitive.Root>
    </div>
  );
}
