import { feature } from 'bun:bundle'
import { registerBatchSkill } from './batch.js'
import { registerAttackPathAnalysisSkill } from './attackPathAnalysis.js'
import { registerDebugSkill } from './debug.js'
import { registerEngagementSetupSkill } from './engagementSetup.js'
import { registerEvidenceCaptureSkill } from './evidenceCapture.js'
import { registerExploitValidationSkill } from './exploitValidation.js'
import { registerKeybindingsSkill } from './keybindings.js'
import { registerLoremIpsumSkill } from './loremIpsum.js'
import { registerPostExploitationPlanSkill } from './postExploitationPlan.js'
import { registerReconPlanSkill } from './reconPlan.js'
import { registerRememberSkill } from './remember.js'
import { registerReportGenerationSkill } from './reportGeneration.js'
import { registerSimplifySkill } from './simplify.js'
import { registerScopeGuardSkill } from './scopeGuard.js'
import { registerSkillifySkill } from './skillify.js'
import { registerStuckSkill } from './stuck.js'
import { registerTargetFingerprintingSkill } from './targetFingerprinting.js'
import { registerUpdateConfigSkill } from './updateConfig.js'
import { registerVerifySkill } from './verify.js'
import { registerVulnAssessmentSkill } from './vulnAssessment.js'
import { registerAptSimulationSkill } from './aptSimulation.js'
import { registerFeedbackLoopSkill } from './feedbackLoop.js'
import { registerStatisticalVerificationSkill } from './statisticalVerification.js'
import { registerWafDetectionSkill } from './wafDetection.js'
import { registerMctsPlanningSkill } from './mctsPlanning.js'
import { registerOobVerificationSkill } from './oobVerification.js'

/**
 * Initialize all bundled skills.
 * Called at startup to register skills that ship with the CLI.
 *
 * To add a new bundled skill:
 * 1. Create a new file in src/skills/bundled/ (e.g., myskill.ts)
 * 2. Export a register function that calls registerBundledSkill()
 * 3. Import and call that function here
 */
export function initBundledSkills(): void {
  registerEngagementSetupSkill()
  registerScopeGuardSkill()
  registerReconPlanSkill()
  registerTargetFingerprintingSkill()
  registerEvidenceCaptureSkill()
  registerVulnAssessmentSkill()
  registerExploitValidationSkill()
  registerPostExploitationPlanSkill()
  registerReportGenerationSkill()
  registerAttackPathAnalysisSkill()
  registerAptSimulationSkill()
  registerFeedbackLoopSkill()
  registerStatisticalVerificationSkill()
  registerWafDetectionSkill()
  registerMctsPlanningSkill()
  registerOobVerificationSkill()
  registerUpdateConfigSkill()
  registerKeybindingsSkill()
  registerVerifySkill()
  registerDebugSkill()
  registerLoremIpsumSkill()
  registerSkillifySkill()
  registerRememberSkill()
  registerSimplifySkill()
  registerBatchSkill()
  registerStuckSkill()
  if (feature('KAIROS') || feature('KAIROS_DREAM')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerDreamSkill } = require('./dream.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerDreamSkill()
  }
  if (feature('REVIEW_ARTIFACT')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerHunterSkill } = require('./hunter.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerHunterSkill()
  }
  if (feature('AGENT_TRIGGERS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerLoopSkill } = require('./loop.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // /loop's isEnabled delegates to isKairosCronEnabled() — same lazy
    // per-invocation pattern as the cron tools. Registered unconditionally;
    // the skill's own isEnabled callback decides visibility.
    registerLoopSkill()
  }
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const {
      registerScheduleRemoteAgentsSkill,
    } = require('./scheduleRemoteAgents.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerScheduleRemoteAgentsSkill()
  }
  if (feature('BUILDING_CLAUDE_APPS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerClaudeApiSkill } = require('./claudeApi.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerClaudeApiSkill()
  }
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const {
      shouldAutoEnableClaudeInChrome,
    } = require('src/utils/claudeInChrome/setup.js') as typeof import('src/utils/claudeInChrome/setup.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    if (shouldAutoEnableClaudeInChrome()) {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { registerClaudeInChromeSkill } = require('./claudeInChrome.js')
      /* eslint-enable @typescript-eslint/no-require-imports */
      registerClaudeInChromeSkill()
    }
  } catch {
    // Browser bridge skill is optional. If its package is absent, keep the
    // rest of the bundled security skill surface available.
  }
  if (feature('RUN_SKILL_GENERATOR')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerRunSkillGeneratorSkill } = require('./runSkillGenerator.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerRunSkillGeneratorSkill()
  }
}
