/**
 * PolySync Engine (Stateless MCP 2026-07-28 Spec)
 * Multi-Repo Cross-Language AST Type Synchronizer & Boundary Enforcer
 */

export class PolySyncEngine {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Normalizes language-specific primitives into canonical IR types.
   */
  normalizeType(rawType) {
    let t = rawType.trim().toLowerCase();
    // Unwrap Optional[...]
    const optMatch = t.match(/^optional\[(.*)\]$/);
    if (optMatch) {
      t = optMatch[1].trim();
    }

    if (['str', 'string', 'text'].includes(t)) return 'string';
    if (['int', 'float', 'number', 'int64', 'int32', 'float64'].includes(t)) return 'number';
    if (['bool', 'boolean'].includes(t)) return 'boolean';
    if (t.includes('[]') || t.startsWith('list[') || t.startsWith('array<')) return 'array';
    return 'object';
  }

  /**
   * Extracts entity schema IR from source code snippets (Python, Go, or TypeScript).
   */
  extractEntitySchema(codeText, language = 'python') {
    const fields = {};
    let entityName = 'UnnamedEntity';

    if (language === 'python') {
      const classMatch = codeText.match(/class\s+([A-Za-z0-9_]+)\s*\((?:BaseModel|[A-Za-z0-9_,\s]+)\):/);
      if (classMatch) entityName = classMatch[1];

      const lines = codeText.split('\n');
      for (const line of lines) {
        const fieldMatch = line.trim().match(/^([a-zA-Z0-9_]+)\s*:\s*([A-Za-z0-9_\[\],]+)/);
        if (fieldMatch && !['class', 'def', 'from', 'import'].includes(fieldMatch[1])) {
          const isOptional = fieldMatch[2].includes('Optional') || line.includes('None') || line.includes('=');
          fields[fieldMatch[1]] = {
            type: this.normalizeType(fieldMatch[2]),
            optional: isOptional,
            rawType: fieldMatch[2]
          };
        }
      }
    } else if (language === 'typescript') {
      const ifaceMatch = codeText.match(/(?:interface|type)\s+([A-Za-z0-9_]+)/);
      if (ifaceMatch) entityName = ifaceMatch[1];

      const lines = codeText.split('\n');
      for (const line of lines) {
        const propMatch = line.trim().match(/^([a-zA-Z0-9_]+)(\??)\s*:\s*([^;]+)/);
        if (propMatch && !['interface', 'type', 'export'].includes(propMatch[1])) {
          fields[propMatch[1]] = {
            type: this.normalizeType(propMatch[3]),
            optional: propMatch[2] === '?',
            rawType: propMatch[3].trim()
          };
        }
      }
    } else if (language === 'golang') {
      const structMatch = codeText.match(/type\s+([A-Za-z0-9_]+)\s+struct/);
      if (structMatch) entityName = structMatch[1];

      const lines = codeText.split('\n');
      for (const line of lines) {
        const goFieldMatch = line.trim().match(/^([A-Za-z0-9_]+)\s+([*]?[A-Za-z0-9_\[\]]+)/);
        if (goFieldMatch && !['type', 'struct', 'package', 'import', '//'].includes(goFieldMatch[1])) {
          const raw = goFieldMatch[2];
          const fieldName = goFieldMatch[1].charAt(0).toLowerCase() + goFieldMatch[1].slice(1);
          fields[fieldName] = {
            type: this.normalizeType(raw),
            optional: raw.startsWith('*'),
            rawType: raw
          };
        }
      }
    }

    return {
      entityName,
      language,
      fieldCount: Object.keys(fields).length,
      fields
    };
  }

  /**
   * Compares source and target schema IRs to detect desynchronizations.
   */
  compareCrossLanguageTypes(sourceIR, targetIR) {
    const discrepancies = [];

    for (const [field, srcDef] of Object.entries(sourceIR.fields)) {
      if (!targetIR.fields[field]) {
        discrepancies.push({
          type: 'MISSING_FIELD_IN_TARGET',
          field,
          sourceType: srcDef.type,
          severity: srcDef.optional ? 'WARNING' : 'BLOCKING',
          message: `Field '${field}' defined in ${sourceIR.language} (${sourceIR.entityName}) is missing in ${targetIR.language} (${targetIR.entityName}).`
        });
      } else {
        const tgtDef = targetIR.fields[field];
        if (srcDef.type !== tgtDef.type) {
          discrepancies.push({
            type: 'TYPE_MISMATCH',
            field,
            sourceType: srcDef.type,
            targetType: tgtDef.type,
            severity: 'CRITICAL',
            message: `Field '${field}' has type '${srcDef.type}' in source, but '${tgtDef.type}' in target.`
          });
        }
        if (srcDef.optional !== tgtDef.optional) {
          discrepancies.push({
            type: 'NULLABILITY_MISMATCH',
            field,
            sourceOptional: srcDef.optional,
            targetOptional: tgtDef.optional,
            severity: 'WARNING',
            message: `Field '${field}' optionality mismatch (source optional=${srcDef.optional}, target optional=${tgtDef.optional}).`
          });
        }
      }
    }

    return {
      sourceEntity: sourceIR.entityName,
      targetEntity: targetIR.entityName,
      isSynchronized: discrepancies.length === 0,
      discrepancyCount: discrepancies.length,
      discrepancies
    };
  }

  /**
   * Transpiles canonical source IR into a synchronized TypeScript interface.
   */
  generateSynchronizedTarget(sourceIR, targetLanguage = 'typescript') {
    if (targetLanguage === 'typescript') {
      const lines = [`export interface ${sourceIR.entityName} {`];
      for (const [field, def] of Object.entries(sourceIR.fields)) {
        const opt = def.optional ? '?' : '';
        lines.push(`  ${field}${opt}: ${def.type};`);
      }
      lines.push('}');
      return lines.join('\n');
    }
    throw new Error(`Target language '${targetLanguage}' is not yet supported.`);
  }
}

// Standalone CLI runner
if (process.argv[1]?.endsWith('engine.mjs')) {
  const engine = new PolySyncEngine();
  const pyCode = `
class UserAccount(BaseModel):
    user_id: str
    email: str
    is_active: bool
    balance: float
`;
  const ir = engine.extractEntitySchema(pyCode, 'python');
  console.log(JSON.stringify(ir, null, 2));
  console.log(engine.generateSynchronizedTarget(ir, 'typescript'));
}
