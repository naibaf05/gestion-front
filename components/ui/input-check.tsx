import * as React from "react";
import { cn } from "@/lib/utils";

type InputCheckProps = React.ComponentProps<"input"> & {
    label?: string;
};

const InputCheck = React.forwardRef<HTMLInputElement, InputCheckProps>(
    ({ className, label, checked, ...props }, ref) => {
        return (
            <label className="inline-flex items-center space-x-2">
                <input
                    type="checkbox"
                    className={cn(
                        "rounded border border-input bg-background text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    checked={checked}
                    autoComplete="off"
                    {...props}
                />
                {label && <span>{label}</span>}
            </label>
        );
    }
);

InputCheck.displayName = "InputCheck";

export { InputCheck };