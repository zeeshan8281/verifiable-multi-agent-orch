import * as react_jsx_runtime from 'react/jsx-runtime';
import { ComponentProps } from 'react';
import { DropdownMenu as DropdownMenu$1 } from 'radix-ui';

declare function DropdownMenu({ ...props }: ComponentProps<typeof DropdownMenu$1.Root>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuPortal({ ...props }: ComponentProps<typeof DropdownMenu$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuTrigger({ ...props }: ComponentProps<typeof DropdownMenu$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuContent({ className, sideOffset, ...props }: ComponentProps<typeof DropdownMenu$1.Content>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuGroup({ ...props }: ComponentProps<typeof DropdownMenu$1.Group>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuItem({ className, inset, variant, ...props }: ComponentProps<typeof DropdownMenu$1.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}): react_jsx_runtime.JSX.Element;
declare function DropdownMenuCheckboxItem({ className, children, checked, ...props }: ComponentProps<typeof DropdownMenu$1.CheckboxItem>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuRadioGroup({ ...props }: ComponentProps<typeof DropdownMenu$1.RadioGroup>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof DropdownMenu$1.RadioItem>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuLabel({ className, inset, ...props }: ComponentProps<typeof DropdownMenu$1.Label> & {
    inset?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenu$1.Separator>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSub({ ...props }: ComponentProps<typeof DropdownMenu$1.Sub>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSubTrigger({ className, inset, children, ...props }: ComponentProps<typeof DropdownMenu$1.SubTrigger> & {
    inset?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSubContent({ className, ...props }: ComponentProps<typeof DropdownMenu$1.SubContent>): react_jsx_runtime.JSX.Element;

export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger };
