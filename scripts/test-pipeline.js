/**
 * Automated Verification Script for DrawToStory AI Pipeline & Business Rules
 * Imports real production modules directly from src/features/ai/utils/pipelineRules.js:
 * 1. Image classification & Input safety checks (blocking non-drawings, real faces, PII, block rules)
 * 2. Strict drawing setting toggle (strict_drawing_check = true vs false)
 * 3. Layer 3 Output Judge final status resolution (risk_score, faithfulness_score, manual_all mode)
 * 4. Child name normalization (preventing duplicate "Bé Bé Hà" prefix)
 */

import fs from 'fs';
import path from 'path';
import {
  evaluateInputSafety,
  computeModerationDecision,
  formatChildName,
  stripChildPrefix,
} from '../src/features/ai/utils/pipelineRules.js';

function runFixtureTests() {
  const fixturesDir = path.resolve(process.cwd(), 'tests', 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    console.error('Fixtures directory not found:', fixturesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.json'));
  console.log('=== AI PIPELINE & BUSINESS LOGIC VERIFICATION (PRODUCTION MODULE) ===');
  console.log(`Found ${files.length} test fixtures in tests/fixtures/\n`);

  let allPassed = true;
  const resultsTable = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
    const fixture = JSON.parse(raw);

    const safetyResult = evaluateInputSafety(fixture.simulatedInspection, [], true);
    const actualCanProceed = safetyResult.isSafe;
    const actualErrorCode = safetyResult.errorCode || 'NONE';

    const expectedCanProceed = fixture.expected.canProceed;
    const expectedErrorCode = fixture.expected.expectedErrorCode || 'NONE';

    const isMatch =
      actualCanProceed === expectedCanProceed &&
      actualErrorCode === expectedErrorCode;

    if (!isMatch) {
      allPassed = false;
    }

    resultsTable.push({
      ID: fixture.id.replace('fixture-', ''),
      Name: fixture.name.substring(0, 32),
      'Type Expected': fixture.expected.image_type,
      'Can Proceed Exp': expectedCanProceed ? 'YES' : 'NO',
      'Can Proceed Act': actualCanProceed ? 'YES' : 'NO',
      'Error Code Exp': expectedErrorCode,
      'Error Code Act': actualErrorCode,
      Status: isMatch ? '✓ PASS' : '✗ FAIL',
    });
  }

  console.table(resultsTable);

  // 2. Test strict_drawing_check toggle
  const artworkTestInspection = {
    is_drawing: true,
    image_type: 'artwork',
    confidence: 0.95,
    contains_real_person_face: false,
    pii_detected: false,
  };

  const strictBlock = evaluateInputSafety(artworkTestInspection, [], true);
  const relaxedAllow = evaluateInputSafety(artworkTestInspection, [], false);

  console.log('\n--- Strict Drawing Check Toggle ---');
  console.log(
    `strict_drawing_check = true  -> artwork blocked? ${strictBlock.isSafe === false ? 'YES' : 'NO'} (${strictBlock.errorCode})`
  );
  console.log(
    `strict_drawing_check = false -> artwork allowed? ${relaxedAllow.isSafe === true ? 'YES' : 'NO'}`
  );

  if (strictBlock.isSafe !== false || relaxedAllow.isSafe !== true) {
    console.error('✗ Strict drawing setting toggle failed.');
    allPassed = false;
  }

  // 3. Test Layer 3 Judge Moderation Thresholds
  const safeDecision = computeModerationDecision(
    { risk_score: 8, faithfulness_score: 92, recommended_action: 'auto_approved' },
    { moderationMode: 'auto', autoApproveMaxRisk: 25 }
  );
  const lowFaithfulnessDecision = computeModerationDecision(
    { risk_score: 10, faithfulness_score: 48, recommended_action: 'auto_approved' },
    { moderationMode: 'auto', autoApproveMaxRisk: 25 }
  );
  const highRiskDecision = computeModerationDecision(
    {
      risk_score: 75,
      faithfulness_score: 90,
      recommended_action: 'rejected',
      pedagogical_feedback: 'Có chi tiết bạo lực.',
    },
    { moderationMode: 'auto', autoApproveMaxRisk: 25 }
  );

  if (
    safeDecision.finalStatus !== 'auto_approved' ||
    lowFaithfulnessDecision.finalStatus !== 'pending_review' ||
    lowFaithfulnessDecision.rejectionReason !== 'LOW_FAITHFULNESS' ||
    highRiskDecision.finalStatus !== 'rejected'
  ) {
    console.error('✗ Layer 3 moderation decision test failed.');
    allPassed = false;
  } else {
    console.log('✓ Layer 3 moderation thresholds (auto_approved / LOW_FAITHFULNESS / rejected) verified.');
  }

  // 4. Test Child Name Formatting (No "Bé Bé Hà")
  const nameCases = [
    ['Hà', 'Bé Hà'],
    ['Bé Hà', 'Bé Hà'],
    ['bé   Bé Hà ', 'Bé Hà'],
    ['Bơ', 'Bé Bơ'],
    ['', 'Bé yêu'],
  ];
  for (const [input, expected] of nameCases) {
    const actual = formatChildName(input);
    if (actual !== expected) {
      console.error(`✗ formatChildName(${JSON.stringify(input)}) = ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
      allPassed = false;
    }
  }
  if (stripChildPrefix('Bé Hà') !== 'Hà') {
    console.error('✗ stripChildPrefix failed.');
    allPassed = false;
  } else {
    console.log('✓ Child nickname normalization (no duplicate "Bé Bé ...") verified.\n');
  }

  if (!allPassed) {
    console.error('Pipeline & business logic tests failed!');
    process.exit(1);
  } else {
    console.log('All pipeline & business logic tests passed successfully!');
  }
}

runFixtureTests();
