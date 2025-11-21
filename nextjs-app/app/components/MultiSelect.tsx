"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent, Button } from "./ui"; // adjust path if needed
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "./ui";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

interface MultiSelectProps {
  terminals: { terminal: string; city: string }[];
  field: any; // from react-hook-form Controller
}

export default function MultiSelect({ terminals, field }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(field.value || []);

  useEffect(() => {
    field.onChange(selected);
  }, [selected]);

  useEffect(() => {
    setSelected(field.value || []);
  }, [field.value]);

  const toggleSelection = (value: string) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected.length ? selected.join(", ") : "Select middle terminals..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search terminals..." />
          <CommandList>
            <CommandEmpty>No terminals found.</CommandEmpty>
            <CommandGroup>
              {terminals.map((t) => (
                <CommandItem
                  key={t.terminal}
                  value={t.terminal}
                  onSelect={() => toggleSelection(t.terminal)}
                >
                  <CheckIcon
                    className={`mr-2 h-4 w-4 ${
                      selected.includes(t.terminal)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  {t.terminal} ({t.city})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
