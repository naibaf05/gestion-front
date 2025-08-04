"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type SelectSingleProps<T> = {
    options: T[];
    value: string | number | undefined;
    onChange: (value: string) => void;
    valueKey: keyof T;
    labelKey: keyof T;
    placeholder: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    id: string;
    disabled?: boolean;
    className?: string;
    enableSearch?: boolean;
};

export function SelectSingle<T extends Record<string, any>>({
    options,
    value,
    onChange,
    valueKey,
    labelKey,
    placeholder,
    searchPlaceholder = "Buscar...",
    emptyMessage = "No se encontraron resultados",
    id,
    disabled = false,
    className,
    enableSearch = true,
}: SelectSingleProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    // Encuentra el elemento seleccionado
    const selectedOption = options.find(option => String(option[valueKey]) === String(value))
    
    // Filtra las opciones basándose en la búsqueda
    const filteredOptions = React.useMemo(() => {
        if (!searchValue || !enableSearch) return options
        
        return options.filter(option =>
            String(option[labelKey])
                .toLowerCase()
                .includes(searchValue.toLowerCase())
        )
    }, [options, searchValue, labelKey, enableSearch])

    const handleSelect = (selectedValue: string) => {
        if (selectedValue === value) {
            onChange("") // Deseleccionar si se hace clic en el mismo elemento
        } else {
            onChange(selectedValue)
        }
        setOpen(false)
        setSearchValue("")
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setSearchValue("")
        }
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !selectedOption && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? String(selectedOption[labelKey]) : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    {enableSearch && (
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={searchPlaceholder}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    )}
                    <CommandList className="max-h-[200px]">
                        {filteredOptions.length === 0 ? (
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {filteredOptions.map((option) => {
                                    const optionValue = String(option[valueKey])
                                    const isSelected = optionValue === String(value)
                                    
                                    return (
                                        <CommandItem
                                            key={optionValue}
                                            value={optionValue}
                                            onSelect={() => handleSelect(optionValue)}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="truncate">{String(option[labelKey])}</span>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}