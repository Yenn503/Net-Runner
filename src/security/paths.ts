import { join } from 'path'

export const NET_RUNNER_PROJECT_DIR = '.netrunner'

export function getNetRunnerProjectDir(cwd: string): string {
  return join(cwd, NET_RUNNER_PROJECT_DIR)
}

export function getEngagementManifestPath(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'engagement.json')
}

export function getEngagementVariablesPath(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'variables.env')
}

export function getEngagementSecretsPath(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'secrets.env')
}

export function getEngagementInstructionsDir(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'instructions')
}

export function getEngagementMemoryDir(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'memory')
}

export function getEngagementAgentMemoryRoot(cwd: string): string {
  return join(getEngagementMemoryDir(cwd), 'agents')
}

export function getEngagementAgentMemoryDir(
  cwd: string,
  agentType: string,
): string {
  return join(getEngagementAgentMemoryRoot(cwd), agentType)
}

export function getEvidenceDir(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'evidence')
}

export function getEvidenceLedgerPath(cwd: string): string {
  return join(getEvidenceDir(cwd), 'ledger.jsonl')
}

export function getRunStatePath(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'run-state.json')
}

export function getArtifactsDir(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'artifacts')
}

export function getFindingsDir(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'findings')
}

export function getReportsDir(cwd: string): string {
  return join(getNetRunnerProjectDir(cwd), 'reports')
}
