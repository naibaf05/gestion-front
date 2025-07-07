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
}

export const SelectMultiple: React.FC<SelectMultipleProps> = ({
    options,
    value,
    onChange,
    placeholder = "Selecciona opciones",
}) => {
    return (
        <ReactSelect
            isMulti
            options={options}
            value={options.filter(opt => value.includes(opt.value))}
            onChange={(selected: MultiValue<OptionType>) => {
                onChange(selected.map(opt => opt.value))
            }}
            placeholder={placeholder}
            classNamePrefix="react-select"
            styles={{
                control: (base, state) => ({
                    ...base,
                    backgroundColor: 'white',
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem',
                    borderColor: '#e2e8f0',
                    boxShadow: state.isFocused ? '0 0 0 2px #090a16' : 'none',
                    minHeight: 40,
                    '&:hover': { borderColor: 'none' },
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
                    color: '#020817',
                }),
            }}
        />
    )
}
