---
name: polysync-mcp
description: Multi-Repo Cross-Language AST Type Synchronizer & Boundary Enforcer for Autonomous Coding Agents.
version: 1.0.0
tags:
  - typescript
  - python
  - golang
  - polyglot
  - type-sync
  - cross-repo
  - ast
---

# PolySync: Multi-Repo Cross-Language AST Type Synchronizer

PolySync enforces type integrity across polyglot architectures (e.g. Python FastAPI / Go backend + TypeScript/React frontend), ensuring that data model changes in one repository never desynchronize from companion client repositories.

## The Problem

Agents working across fullstack or multi-repo projects frequently cause silent contract breaks:
1. **Unilateral Field Changes**: The agent alters a field name in a Python Pydantic model (`user_id: str` -> `accountId: str`) to fix a backend issue, but leaves the React TypeScript interface untouched.
2. **Nullability Mismatches**: A backend field becomes optional (`Optional[str]`), but frontend components continue treating it as required, causing production runtime crashes.
3. **Context Silos**: Single-repo agent sessions lack awareness of external consuming repositories.

## Core Capabilities

1. **Language-Agnostic Schema IR**:
   - Parses TypeScript interfaces, Python Pydantic models, and Go structs into a canonical schema representation.
2. **Cross-Language Differential Engine**:
   - Detects omitted fields, type incompatibilities, and nullability conflicts between client and server schemas.
3. **Automated Target Transpilation**:
   - Synthesizes clean, idiomatic target language types directly from the canonical backend models.
4. **Pre-Commit Boundary Hook**:
   - Halts commits if boundary entity modifications are detected without synchronized client interface updates.

## Available MCP Tools

- `extract_entity_schema`: Extracts canonical schema IR from TypeScript, Python, or Go source code.
- `compare_cross_language_types`: Identifies divergence between source models and target type definitions.
- `generate_synchronized_target`: Transpiles source models into synchronized target language files.

## Hook Integration

PolySync registers a `PreToolUse` hook in `hooks/hooks.json` to block commits when model changes have not been propagated across repo boundaries.
