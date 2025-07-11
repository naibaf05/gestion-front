import * as React from "react";
import { cn } from "@/lib/utils";

type InputPositiveIntegerProps = React.ComponentProps<"input"> & {
    error?: string;
};

const InputPositiveInteger = React.forwardRef<HTMLInputElement, InputPositiveIntegerProps>(
    ({ className, value, onChange, error, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            if (val === "" || /^[0-9]+$/.test(val)) {
                onChange?.(e);
            }
        };

        return (
            <div>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        error && "border-red-500",
                        className
                    )}
                    ref={ref}
                    value={value}
                    onChange={handleChange}
                    {...props}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        );
    }
);

InputPositiveInteger.displayName = "InputPositiveInteger";

export { InputPositiveInteger };