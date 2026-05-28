import { cn } from './chunk-DGPY4WP3.js';
import { createContext, useContext } from 'react';
import { jsx } from 'react/jsx-runtime';

var CardSizeContext = createContext("default");
function Card({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(CardSizeContext.Provider, { value: size, children: /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs",
        className
      ),
      ...props
    }
  ) });
}
function CardHeader({ className, ...props }) {
  const size = useContext(CardSizeContext);
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
        size === "sm" ? "gap-1 p-3" : "gap-1 p-4",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  const size = useContext(CardSizeContext);
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn(
        "font-medium text-card-foreground",
        size === "sm" ? "text-sm leading-5" : "text-base leading-6",
        className
      ),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
}
function CardAction({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-action",
      className: cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      ),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  const size = useContext(CardSizeContext);
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn(
        size === "sm" ? "px-3 pb-3" : "px-4 pb-4",
        className
      ),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  const size = useContext(CardSizeContext);
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-footer",
      className: cn(
        "flex items-center border-t border-border bg-muted/50",
        size === "sm" ? "p-3" : "p-4",
        className
      ),
      ...props
    }
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
//# sourceMappingURL=chunk-KBVZOH7V.js.map
//# sourceMappingURL=chunk-KBVZOH7V.js.map