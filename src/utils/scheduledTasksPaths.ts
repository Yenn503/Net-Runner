import { join } from 'path'

export const PRIMARY_SCHEDULED_TASKS_DIR = '.netrunner'
export const SCHEDULED_TASKS_FILENAME = 'scheduled_tasks.json'
export const SCHEDULED_TASKS_LOCK_FILENAME = 'scheduled_tasks.lock'

export function getScheduledTasksFilePath(root: string): string {
  return resolveScheduledTasksPath(root, SCHEDULED_TASKS_FILENAME)
}

export function getScheduledTasksLockPath(root: string): string {
  return resolveScheduledTasksPath(root, SCHEDULED_TASKS_LOCK_FILENAME)
}

function resolveScheduledTasksPath(root: string, filename: string): string {
  return join(root, PRIMARY_SCHEDULED_TASKS_DIR, filename)
}
