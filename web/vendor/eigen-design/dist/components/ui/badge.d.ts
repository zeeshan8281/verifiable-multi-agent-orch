import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';

declare const badgeVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Badge({ className, variant, asChild, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;

export { Badge, badgeVariants };
