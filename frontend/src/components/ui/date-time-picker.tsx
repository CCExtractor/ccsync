'use client';

import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateTimePickerProps {
  date: Date | undefined;
  onDateTimeChange: (date: Date | undefined, hasTime?: boolean) => void;
  placeholder?: string;
  className?: string;
}

export const DateTimePicker = React.forwardRef<
  HTMLButtonElement,
  DateTimePickerProps
>(function DatePicker(
  { date, onDateTimeChange, placeholder = 'Pick a date', className },
  ref
) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    date
  );
  const [hasTime, setHasTime] = React.useState(false);
  const isInternalUpdate = React.useRef(false);

  React.useEffect(() => {
    if (!isInternalUpdate.current) {
      setInternalDate(date);
      setHasTime(false);
    }
    isInternalUpdate.current = false;
  }, [date]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0,
        0,
        0,
        0
      );
      setInternalDate(newDate);

      isInternalUpdate.current = true;
      onDateTimeChange(newDate, false);
      setIsOpen((prev) => {
        console.log('Closing popover, prev was:', prev);
        return false;
      });
    } else {
      setInternalDate(undefined);
      setHasTime(false);
      isInternalUpdate.current = true;
      onDateTimeChange(undefined, false);
    }
  };

  const handleTimeChange = (
    type: 'hour' | 'minute' | 'ampm',
    value: string
  ) => {
    if (!internalDate) {
      return;
    }

    setHasTime(true);

    const newDate = new Date(internalDate);

    if (type === 'hour') {
      const hour = parseInt(value);
      const currentHours = newDate.getHours();
      const isPM = currentHours >= 12;

      if (hour === 12) {
        newDate.setHours(isPM ? 12 : 0);
      } else {
        newDate.setHours(isPM ? hour + 12 : hour);
      }
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(value));
    } else if (type === 'ampm') {
      const currentHours = newDate.getHours();
      if (value === 'PM' && currentHours < 12) {
        newDate.setHours(currentHours + 12);
      } else if (value === 'AM' && currentHours >= 12) {
        newDate.setHours(currentHours - 12);
      }
    }

    setInternalDate(newDate);
    isInternalUpdate.current = true;
    onDateTimeChange(newDate, true);
  };

  const getCurrentHour12 = () => {
    if (!internalDate || !hasTime) return 12;
    const hours = internalDate.getHours();
    if (hours === 0) return 12;
    if (hours > 12) return hours - 12;
    return hours;
  };

  const getCurrentMinutes = () => {
    if (!internalDate || !hasTime) return 0;
    return internalDate.getMinutes();
  };

  const getCurrentAMPM = () => {
    if (!internalDate || !hasTime) return 'AM';
    return internalDate.getHours() >= 12 ? 'PM' : 'AM';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          aria-label="calender-button"
          ref={ref}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            hasTime ? (
              `${format(date, 'PPP')} ${format(date, 'hh:mm aa')}`
            ) : (
              format(date, 'PPP')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 z-[9999]"
        side="bottom"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="sm:flex max-w-fit">
          <Calendar
            mode="single"
            selected={internalDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <div className="w-64 sm:w-auto sm:h-full overflow-y-auto">
              <div className="flex sm:flex-col p-2 gap-1 sm:h-full">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={
                      hasTime && getCurrentHour12() === hour
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    disabled={!internalDate}
                    onClick={() => handleTimeChange('hour', hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </div>
            <div className="w-64 sm:w-auto sm:h-full overflow-y-auto">
              <div className="flex sm:flex-col p-2 gap-1 sm:h-full">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      hasTime && getCurrentMinutes() === minute
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    disabled={!internalDate}
                    onClick={() =>
                      handleTimeChange('minute', minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </div>
            <div className="sm:w-auto sm:h-full">
              <div className="flex sm:flex-col p-2 gap-1 sm:h-full sm:justify-start">
                {['AM', 'PM'].map((ampm) => (
                  <Button
                    key={ampm}
                    size="icon"
                    variant={
                      hasTime && getCurrentAMPM() === ampm ? 'default' : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    disabled={!internalDate}
                    onClick={() => handleTimeChange('ampm', ampm)}
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
