import * as react_jsx_runtime from 'react/jsx-runtime';
import { ComponentProps } from 'react';
import { Dialog as Dialog$1 } from 'radix-ui';

declare function Dialog({ ...props }: ComponentProps<typeof Dialog$1.Root>): react_jsx_runtime.JSX.Element;
declare function DialogTrigger({ ...props }: ComponentProps<typeof Dialog$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DialogPortal({ ...props }: ComponentProps<typeof Dialog$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DialogClose({ ...props }: ComponentProps<typeof Dialog$1.Close>): react_jsx_runtime.JSX.Element;
declare function DialogOverlay({ className, ...props }: ComponentProps<typeof Dialog$1.Overlay>): react_jsx_runtime.JSX.Element;
declare function DialogContent({ className, children, showCloseButton, ...props }: ComponentProps<typeof Dialog$1.Content> & {
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DialogHeader({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DialogFooter({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DialogTitle({ className, ...props }: ComponentProps<typeof Dialog$1.Title>): react_jsx_runtime.JSX.Element;
declare function DialogDescription({ className, ...props }: ComponentProps<typeof Dialog$1.Description>): react_jsx_runtime.JSX.Element;

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
