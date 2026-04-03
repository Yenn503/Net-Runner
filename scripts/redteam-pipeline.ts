import { execa } from 'execa'

type PipelineStep = {
  name: string
  command: string
  args: string[]
}

const steps: PipelineStep[] = [
  {
    name: 'runtime hardening checks',
    command: 'bun',
    args: ['run', 'hardening:check'],
  },
  {
    name: 'security slice tests',
    command: 'npm',
    args: ['run', 'test:security-slice'],
  },
  {
    name: 'agent/capability alignment validation',
    command: 'bun',
    args: ['run', 'validate:redteam-alignment'],
  },
  {
    name: 'engagement/report command smoke',
    command: 'bun',
    args: ['run', 'smoke:redteam-commands'],
  },
]

for (const step of steps) {
  console.log(`\n==> ${step.name}`)
  await execa(step.command, step.args, {
    stdio: 'inherit',
    reject: true,
  })
}

console.log('\nRed-team pipeline passed.')

