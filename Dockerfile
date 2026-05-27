# Single Dockerfile, parameterized by AGENT (researcher | reasoner | critic).
# Build with: docker build --platform linux/amd64 --build-arg AGENT=researcher -t <registry>/<image>:tag .

FROM --platform=linux/amd64 node:22-slim AS base

WORKDIR /app

# Install only what's needed for production runtime.
# We bundle the SDK source directly with the agent (no separate package).
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm i --no-audit --no-fund --no-save tsx@^4.19.0

COPY tsconfig.json ./
COPY lib ./lib
COPY agents ./agents

ARG AGENT
ENV AGENT=${AGENT}
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# tsx runs TS directly; for prod you'd prebuild with tsc, but this keeps the demo dead simple.
CMD ["sh", "-c", "node --import tsx agents/${AGENT}/index.ts"]
