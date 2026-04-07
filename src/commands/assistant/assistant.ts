// Stub — assistant installer UI is not included in this source snapshot.
import React from 'react'

export interface NewInstallWizardProps {
  defaultDir: string
  onInstalled: (dir: string) => void
  onCancel: () => void
  onError: (message: string) => void
}

export const isAssistantInstallerAvailable = false

export async function computeDefaultInstallDir(): Promise<string> {
  return process.cwd()
}

export function NewInstallWizard(_props: NewInstallWizardProps): React.ReactNode {
  return null
}

export default null
