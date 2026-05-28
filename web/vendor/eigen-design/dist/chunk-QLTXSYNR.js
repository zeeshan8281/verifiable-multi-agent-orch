import { cn } from './chunk-DGPY4WP3.js';
import { Switch as Switch$1 } from 'radix-ui';
import { jsx } from 'react/jsx-runtime';

function Switch({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Switch$1.Root,
    {
      "data-slot": "switch",
      className: cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-foreground data-[state=unchecked]:bg-input",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        Switch$1.Thumb,
        {
          className: cn(
            "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          )
        }
      )
    }
  );
}

export { Switch };
//# sourceMappingURL=chunk-QLTXSYNR.js.map
//# sourceMappingURL=chunk-QLTXSYNR.js.map