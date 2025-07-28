import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SelectSingleProps<T> = {
    options: T[];
    value: string | number | undefined;
    onChange: (value: string) => void;
    valueKey: keyof T;
    labelKey: keyof T;
    placeholder: string;
    id: string;
    disabled?: boolean;
};

export function SelectSingle<T extends Record<string, any>>({
    options,
    value,
    onChange,
    valueKey,
    labelKey,
    placeholder,
    id,
    disabled = false,
}: SelectSingleProps<T>) {
    return (
        <Select
            value={value !== undefined && value !== null ? String(value) : ""}
            onValueChange={onChange}
        >
            <SelectTrigger id={id} disabled={disabled}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={String(option[valueKey])} value={String(option[valueKey])}>
                        {option[labelKey]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}