# PolySync MCP

> Multi-Repo Cross-Language AST Type Synchronizer & Boundary Enforcer for Autonomous Coding Agents.

[![MCP 2026-07-28](https://img.shields.io/badge/MCP-2026--07--28-blue.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## The Problem
When autonomous agents work across polyglot architectures (Python FastAPI / Go backend + TypeScript/React frontend):
1. **Unilateral Field Mutation**: An agent alters a field name or type in the backend model, breaking the frontend contract.
2. **Context Window Isolation**: Single-repo sessions lack awareness of external consuming repositories.
3. **Silent Runtime Crashes**: Production services deploy with null dereferences and unhandled shape mismatches.

## The Solution
PolySync MCP enforces cross-language type contracts across repository boundaries:
- **Language-Agnostic Schema IR**: Normalizes Python Pydantic models, Go structs, and TypeScript interfaces into a common intermediate representation.
- **Cross-Repo Boundary Hook**: Blocks git commits if backend entity changes have not been propagated to client type definitions.
- **Zero-Friction Transpilation**: Generates synchronized client TypeScript interfaces directly from backend models.

## Available MCP Tools

### `extract_entity_schema`
Extracts schema IR from Python, Go, or TypeScript source files.

### `compare_cross_language_types`
Identifies contract drift, missing properties, and type incompatibilities across languages.

### `generate_synchronized_target`
Synthesizes synchronized target language definitions from canonical backend models.

## Live Verification
```bash
node tests/run_live_test.mjs
```

## License
MIT © 2026 PolySync Systems
