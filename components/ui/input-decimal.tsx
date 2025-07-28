import * as React from "react";
import { cn } from "@/lib/utils";

type InputDecimalProps = React.ComponentProps<"input"> & {
    error?: string;
    decimalPlaces?: number;
    maxLength?: number;
    disabled?: boolean;
};

const InputDecimal = React.forwardRef<HTMLInputElement, InputDecimalProps>(
    (
        {
            className,
            value,
            onChange,
            error,
            decimalPlaces = 2,
            min = 0,
            step = "0.01",
            maxLength = 10,
            disabled = false,
            ...props
        },
        ref
    ) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let val = e.target.value;
            // Solo permite dígitos y un solo punto decimal
            val = val.replace(/[^0-9.]/g, "");
            const parts = val.split(".");
            if (parts.length > 2) {
                // Más de un punto decimal, inválido
                return;
            }
            if (parts[1]?.length > decimalPlaces) {
                parts[1] = parts[1].slice(0, decimalPlaces);
                val = parts.join(".");
            }
            // Si min es 0, no permitir "-"
            if (min === 0 && val.startsWith("-")) {
                return;
            }
            // Limitar la longitud máxima
            if (val.length > maxLength) {
                val = val.slice(0, maxLength);
            }
            onChange?.({
                ...e,
                target: { ...e.target, value: val },
            });
        };

        return (
            <div>
                <input
                    type="text"
                    inputMode="decimal"
                    pattern={`^\\d*(\\.\\d{0,${decimalPlaces}})?$`}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        error && "border-red-500",
                        className
                    )}
                    ref={ref}
                    value={value}
                    onChange={handleChange}
                    min={min}
                    step={step}
                    maxLength={maxLength}
                    autoComplete="off"
                    disabled={disabled}
                    {...props}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        );
    }
);

InputDecimal.displayName = "InputDecimal";

export { InputDecimal };