import * as react_jsx_runtime from 'react/jsx-runtime';
import { ComponentProps } from 'react';
import { Tooltip as Tooltip$1 } from 'radix-ui';

declare function TooltipProvider({ delayDuration, ...props }: ComponentProps<typeof Tooltip$1.Provider>): react_jsx_runtime.JSX.Element;
declare function Tooltip(props: ComponentProps<typeof Tooltip$1.Root>): react_jsx_runtime.JSX.Element;
declare function TooltipTrigger(props: ComponentProps<typeof Tooltip$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function TooltipContent({ className, sideOffset, ...props }: ComponentProps<typeof Tooltip$1.Content>): react_jsx_runtime.JSX.Element;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
