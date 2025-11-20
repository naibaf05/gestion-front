import React from "react"
import ReactSelect, { MultiValue, Options } from "react-select"

export interface OptionType {
    value: string
    label: string
}

interface SelectMultipleProps {
    options: OptionType[]
    value: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    isFilter?: boolean
    disabled?: boolean
}

export const SelectMultiple: React.FC<SelectMultipleProps> = ({
    options,
    value,
    onChange,
    placeholder = "Selecciona opciones",
    isFilter = false,
    disabled = false
}) => {
    return (
        <ReactSelect
            isMulti
            isDisabled={disabled}
            options={options}
            value={options.filter(opt => (value ? value.includes(opt.value) : false))}
            onChange={(selected: MultiValue<OptionType>) => {
                if (disabled) return
                onChange(selected.map(opt => opt.value))
            }}
            placeholder={placeholder}
            classNamePrefix="react-select"
            styles={{
                control: (base, state) => ({
                    ...base,
                    backgroundColor: 'white',
                    fontSize: isFilter ? '0.75rem' : '0.875rem',
                    lineHeight: isFilter ? '1rem' : '1.25rem',
                    borderColor: '#e2e8f0',
                    boxShadow: state.isFocused ? '0 0 0 2px #090a16' : 'none',
                    minHeight: 40,
                    '&:hover': { borderColor: 'none' },
                    opacity: disabled ? 0.6 : 1,
                    pointerEvents: disabled ? 'none' : 'auto'
                }),
                multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                }),
                option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                        ? '#2563eb'
                        : state.isFocused
                            ? '#dbeafe'
                            : 'white',
                    color: state.isSelected ? 'white' : '#1e293b',
                    cursor: 'pointer',
                }),
                menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                }),
                placeholder: (base) => ({
                    ...base,
                    color: '#657283',
                }),
            }}
        />
    )
}
