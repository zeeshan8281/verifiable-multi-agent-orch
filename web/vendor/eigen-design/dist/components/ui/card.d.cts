import * as react_jsx_runtime from 'react/jsx-runtime';
import { ComponentProps } from 'react';

type CardSize = "default" | "sm";
declare function Card({ className, size, ...props }: ComponentProps<"div"> & {
    size?: CardSize;
}): react_jsx_runtime.JSX.Element;
declare function CardHeader({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardTitle({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardDescription({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardAction({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardContent({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardFooter({ className, ...props }: ComponentProps<"div">): react_jsx_runtime.JSX.Element;

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
