import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from '@/components/utils/utils';
import { Badge } from '@/components/ui/badge';
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

interface MultiSelectFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

export function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onSelectionChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((item) => item !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleDeselect = (value: string) => {
    onSelectionChange(selectedValues.filter((item) => item !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-[200px] justify-between h-auto min-h-[40px]" // Set min-height
        >
          <div className="flex flex-wrap gap-1 items-center">
            <span className="font-medium">{title}</span>

            {selectedValues.length > 0 && (
              <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700 mx-2"></div>
            )}

            {selectedValues.map((value) => (
              <Badge
                variant="secondary"
                key={value}
                className="mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeselect(value);
                }}
              >
                {value}
                <X className="ml-1 h-3 w-3 cursor-pointer" />
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full md:w-[200px] p-0">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <CommandItem
                    key={option}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
