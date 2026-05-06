import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  appendEvidenceEntry,
  countEvidenceEntriesByType,
  readEvidenceEntries,
} from './evidence.ts'
import { verifyEvidenceChain } from './evidenceHash.ts'
import { redactPii } from './piiRedactor.ts'
import { getEvidenceLedgerPath } from './paths.ts'

test('evidence ledger stores append-only findings and notes', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'net-runner-evidence-'))

  await appendEvidenceEntry(cwd, {
    type: 'note',
    note: 'Captured initial recon scope.',
  })
  await appendEvidenceEntry(cwd, {
    type: 'finding',
    title: 'Exposed debug endpoint',
    severity: 'medium',
    evidence: 'GET /debug returned internal stack traces.',
    recommendation: 'Disable the endpoint outside internal environments.',
  })

  const entries = await readEvidenceEntries(cwd)
  const counts = countEvidenceEntriesByType(entries)

  assert.equal(entries.length, 2)
  assert.equal(counts.note, 1)
  assert.equal(counts.finding, 1)
})

test('chain integrity over 3 entries', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-chain-'))

  await appendEvidenceEntry(cwd, { type: 'note', note: 'entry one' })
  await appendEvidenceEntry(cwd, { type: 'note', note: 'entry two' })
  await appendEvidenceEntry(cwd, { type: 'note', note: 'entry three' })

  const result = await verifyEvidenceChain(cwd)
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.length, 3)
  }
})

test('tamper detection: mutating middle entry breaks chain at correct index', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-tamper-'))

  await appendEvidenceEntry(cwd, { type: 'note', note: 'entry one' })
  await appendEvidenceEntry(cwd, { type: 'note', note: 'entry two' })
  await appendEvidenceEntry(cwd, { type: 'note', note: 'entry three' })

  const ledgerPath = getEvidenceLedgerPath(cwd)
  const raw = await readFile(ledgerPath, 'utf8')
  const lines = raw.split('\n').filter(Boolean)

  const middle = JSON.parse(lines[1])
  middle.note = 'TAMPERED'
  lines[1] = JSON.stringify(middle)

  await writeFile(ledgerPath, lines.join('\n') + '\n', 'utf8')

  const result = await verifyEvidenceChain(cwd)
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.breakAtIndex, 1)
  }
})

test('backwards-compat: un-hashed legacy entries parse OK and chain reports ok', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-legacy-'))
  const ledgerPath = getEvidenceLedgerPath(cwd)

  const { mkdir } = await import('node:fs/promises')
  const { dirname } = await import('node:path')
  await mkdir(dirname(ledgerPath), { recursive: true })

  const legacyEntry = JSON.stringify({
    id: 'legacy-id-001',
    createdAt: new Date().toISOString(),
    type: 'note',
    note: 'old entry without hash',
  })
  await writeFile(ledgerPath, legacyEntry + '\n', 'utf8')

  const entries = await readEvidenceEntries(cwd)
  assert.equal(entries.length, 1)

  await appendEvidenceEntry(cwd, { type: 'note', note: 'new chained entry' })

  const entriesAfter = await readEvidenceEntries(cwd)
  assert.equal(entriesAfter.length, 2)

  const result = await verifyEvidenceChain(cwd)
  assert.equal(result.ok, true)
})

test('PII redactor: email', () => {
  const { redacted, redactionCount } = redactPii('Contact user@example.com for details')
  assert.ok(redacted.includes('[REDACTED:EMAIL]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: phone (US format)', () => {
  const { redacted, redactionCount } = redactPii('Call me at 555-867-5309 anytime')
  assert.ok(redacted.includes('[REDACTED:PHONE]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: phone (E.164)', () => {
  const { redacted, redactionCount } = redactPii('Intl: +447700900123')
  assert.ok(redacted.includes('[REDACTED:PHONE]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: IPv4', () => {
  const { redacted, redactionCount } = redactPii('Host is at 192.168.1.100')
  assert.ok(redacted.includes('[REDACTED:IPV4]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: JWT', () => {
  const { redacted, redactionCount } = redactPii(
    'Token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  )
  assert.ok(redacted.includes('[REDACTED:JWT]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: AWS access key', () => {
  const { redacted, redactionCount } = redactPii('Key: AKIAIOSFODNN7EXAMPLE00')
  assert.ok(redacted.includes('[REDACTED:AWS_KEY]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: GitHub PAT', () => {
  const { redacted, redactionCount } = redactPii(
    'Token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij',
  )
  assert.ok(redacted.includes('[REDACTED:GITHUB_PAT]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: generic Bearer token', () => {
  const { redacted, redactionCount } = redactPii(
    'Authorization: Bearer eyALongTokenStringThatExceedsTwentyChars',
  )
  assert.ok(redacted.includes('[REDACTED:BEARER_TOKEN]'))
  assert.equal(redactionCount, 1)
})

test('PII redactor: private key header', () => {
  const { redacted, redactionCount } = redactPii(
    '-----BEGIN RSA PRIVATE KEY-----\nMIIEo...',
  )
  assert.ok(redacted.includes('[REDACTED:PRIVATE_KEY]'))
  assert.equal(redactionCount, 1)
})

test('PII redaction wired into appendEvidenceEntry', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-pii-'))

  const entry = await appendEvidenceEntry(cwd, {
    type: 'note',
    note: 'Contact admin@target.com or call +15551234567',
  })

  const note = (entry as any).note as string
  assert.ok(note.includes('[REDACTED:EMAIL]'), `expected email redacted in: ${note}`)
  assert.ok(note.includes('[REDACTED:PHONE]'), `expected phone redacted in: ${note}`)
  assert.ok(typeof (entry as any).redactionCount === 'number')
  assert.ok((entry as any).redactionCount >= 2)
})

test('PII redaction can be disabled via options', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-noredact-'))

  const entry = await appendEvidenceEntry(
    cwd,
    { type: 'note', note: 'Contact admin@target.com' },
    { redactPii: false },
  )

  const note = (entry as any).note as string
  assert.ok(note.includes('admin@target.com'), `expected original value preserved in: ${note}`)
})
