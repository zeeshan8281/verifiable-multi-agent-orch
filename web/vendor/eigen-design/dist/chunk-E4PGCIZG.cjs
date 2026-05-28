'use strict';

var chunkYUV2VNTR_cjs = require('./chunk-YUV2VNTR.cjs');
var jsxRuntime = require('react/jsx-runtime');

function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      "data-slot": "skeleton",
      className: chunkYUV2VNTR_cjs.cn("bg-accent animate-pulse rounded-md", className),
      ...props
    }
  );
}

exports.Skeleton = Skeleton;
//# sourceMappingURL=chunk-E4PGCIZG.cjs.map
//# sourceMappingURL=chunk-E4PGCIZG.cjs.map