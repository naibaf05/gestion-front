import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button, ButtonProps } from "./button";

interface ButtonTooltipProps extends ButtonProps {
    tooltipContent: React.ReactNode;
    children: React.ReactNode; // El ícono o contenido del botón
}

export const ButtonTooltip = React.forwardRef<HTMLButtonElement, ButtonTooltipProps>(
    ({ tooltipContent, children, ...buttonProps }, ref) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button {...buttonProps} ref={ref}>
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {tooltipContent}
            </TooltipContent>
        </Tooltip>
    )
);

ButtonTooltip.displayName = "ButtonTooltip";