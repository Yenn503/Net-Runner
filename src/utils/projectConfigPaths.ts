import { statSync } from 'fs'
import { join } from 'path'
import { isFsInaccessible } from './errors.js'

export const PRIMARY_PROJECT_CONFIG_DIR = '.netrunner'

export function getPrimaryProjectConfigDir(root: string): string {
  return join(root, PRIMARY_PROJECT_CONFIG_DIR)
}

export function getPrimaryProjectConfigSubdir(
  root: string,
  subdir: string,
): string {
  return join(getPrimaryProjectConfigDir(root), subdir)
}

export function getProjectConfigSubdirCandidates(
  root: string,
  subdir: string,
): string[] {
  return [getPrimaryProjectConfigSubdir(root, subdir)]
}

export function getExistingProjectConfigSubdirs(
  root: string,
  subdir: string,
): string[] {
  const primary = getPrimaryProjectConfigSubdir(root, subdir)
  return pathExists(primary) ? [primary] : []
}

export function getPrimaryProjectSettingsPath(
  root: string,
  source: 'projectSettings' | 'localSettings',
): string {
  return join(
    getPrimaryProjectConfigDir(root),
    source === 'projectSettings' ? 'settings.json' : 'settings.local.json',
  )
}

export function getProjectInstructionFileCandidates(root: string): string[] {
  return [
    join(root, 'NETRUNNER.md'),
    join(getPrimaryProjectConfigDir(root), 'NETRUNNER.md'),
  ]
}

export function getProjectInstructionDirCandidates(root: string): string[] {
  const dirs: string[] = []
  const primaryRules = getPrimaryProjectConfigSubdir(root, 'rules')
  const primaryInstructions = getPrimaryProjectConfigSubdir(root, 'instructions')

  if (pathExists(primaryRules)) {
    dirs.push(primaryRules)
  }
  if (pathExists(primaryInstructions)) {
    dirs.push(primaryInstructions)
  }

  return dirs
}

function pathExists(path: string): boolean {
  try {
    statSync(path)
    return true
  } catch (error) {
    if (!isFsInaccessible(error)) {
      throw error
    }
    return false
  }
}
