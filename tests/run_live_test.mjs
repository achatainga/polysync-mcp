import assert from 'node:assert';
import { PolySyncEngine } from '../src/engine.mjs';

async function runAllTests() {
  console.log('🧪 Starting PolySync MCP Live Test Gauntlet...');
  const engine = new PolySyncEngine();

  const pythonBackendModel = `
class OrderPayload(BaseModel):
    order_id: str
    customer_id: str
    total_amount: float
    is_settled: bool
    notes: Optional[str] = None
`;

  const tsFrontendOutdated = `
export interface OrderPayload {
    order_id: string;
    customer_id: string;
    total_amount: string; // Outdated! Backend is float/number
    // missing is_settled!
}
`;

  // Test 1: Schema IR Extraction
  console.log('\n[Test 1] Extracting entity schema from Python Pydantic model...');
  const pyIR = engine.extractEntitySchema(pythonBackendModel, 'python');
  assert.strictEqual(pyIR.entityName, 'OrderPayload');
  assert.strictEqual(pyIR.fieldCount, 5);
  assert.strictEqual(pyIR.fields.total_amount.type, 'number');
  assert.strictEqual(pyIR.fields.notes.optional, true);
  console.log('  ✅ Extracted 5 fields from Python model into canonical IR.');

  // Test 2: TypeScript IR Extraction
  console.log('\n[Test 2] Extracting entity schema from TypeScript interface...');
  const tsIR = engine.extractEntitySchema(tsFrontendOutdated, 'typescript');
  assert.strictEqual(tsIR.entityName, 'OrderPayload');
  assert.strictEqual(tsIR.fields.total_amount.type, 'string');
  console.log('  ✅ Extracted fields from TypeScript interface.');

  // Test 3: Detecting Cross-Language Desynchronization
  console.log('\n[Test 3] Detecting cross-repo contract drift and type mismatch...');
  const comparison = engine.compareCrossLanguageTypes(pyIR, tsIR);
  assert.strictEqual(comparison.isSynchronized, false);
  assert.ok(comparison.discrepancies.some(d => d.type === 'MISSING_FIELD_IN_TARGET' && d.field === 'is_settled'));
  assert.ok(comparison.discrepancies.some(d => d.type === 'TYPE_MISMATCH' && d.field === 'total_amount'));
  console.log('  ✅ Successfully detected missing field (is_settled) and type mismatch (total_amount).');

  // Test 4: Generating Synchronized Target Types
  console.log('\n[Test 4] Transpiling synchronized TypeScript interface...');
  const generatedTS = engine.generateSynchronizedTarget(pyIR, 'typescript');
  assert.ok(generatedTS.includes('total_amount: number;'));
  assert.ok(generatedTS.includes('is_settled: boolean;'));
  assert.ok(generatedTS.includes('notes?: string;'));

  // Re-verify synchronized types
  const reExtractedTS = engine.extractEntitySchema(generatedTS, 'typescript');
  const recheck = engine.compareCrossLanguageTypes(pyIR, reExtractedTS);
  assert.strictEqual(recheck.isSynchronized, true);
  assert.strictEqual(recheck.discrepancyCount, 0);
  console.log('  ✅ Re-validation complete: Generated interface is 100% synchronized with backend.');

  console.log('\n🎉 ALL 4 GAUNTLET TESTS PASSED WITH 100% SUCCESS RATE!');
}

runAllTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
