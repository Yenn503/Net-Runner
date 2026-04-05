import assert from 'node:assert/strict'
import test from 'node:test'

import { KnowledgeGraph } from './knowledgeGraph.ts'

// ---------------------------------------------------------------------------
// Entity CRUD
// ---------------------------------------------------------------------------

test('KnowledgeGraph addEntity creates and retrieves entity', () => {
  const kg = new KnowledgeGraph()
  const entity = kg.addEntity('host-1', 'host', { ip: '10.0.0.1' })
  assert.equal(entity.id, 'host-1')
  assert.equal(entity.type, 'host')
  assert.equal(entity.properties['ip'], '10.0.0.1')

  const retrieved = kg.getEntity('host-1')
  assert.ok(retrieved)
  assert.equal(retrieved.id, 'host-1')
})

test('KnowledgeGraph addEntity updates existing entity', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('host-1', 'host', { ip: '10.0.0.1' })
  kg.addEntity('host-1', 'host', { os: 'Linux' })

  const entity = kg.getEntity('host-1')
  assert.ok(entity)
  assert.equal(entity.properties['ip'], '10.0.0.1')
  assert.equal(entity.properties['os'], 'Linux')
})

test('KnowledgeGraph getEntitiesByType returns correct entities', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('h2', 'host', {})
  kg.addEntity('s1', 'service', {})

  const hosts = kg.getEntitiesByType('host')
  assert.equal(hosts.length, 2)

  const services = kg.getEntitiesByType('service')
  assert.equal(services.length, 1)
})

test('KnowledgeGraph findEntities filters by properties', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('v1', 'vulnerability', { severity: 'critical', type: 'sqli' })
  kg.addEntity('v2', 'vulnerability', { severity: 'low', type: 'xss' })
  kg.addEntity('v3', 'vulnerability', { severity: 'critical', type: 'rce' })

  const critical = kg.findEntities('vulnerability', { severity: 'critical' })
  assert.equal(critical.length, 2)

  const sqli = kg.findEntities('vulnerability', { type: 'sqli' })
  assert.equal(sqli.length, 1)
})

test('KnowledgeGraph removeEntity removes entity and its relations', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('s1', 'service', {})
  kg.addRelation('runs-on', 's1', 'h1')

  assert.equal(kg.entityCount, 2)
  assert.equal(kg.relationCount, 1)

  kg.removeEntity('h1')
  assert.equal(kg.entityCount, 1)
  assert.equal(kg.relationCount, 0)
  assert.equal(kg.getEntity('h1'), undefined)
})

// ---------------------------------------------------------------------------
// Relation CRUD
// ---------------------------------------------------------------------------

test('KnowledgeGraph addRelation creates relation between entities', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('s1', 'service', { port: 80 })
  kg.addEntity('h1', 'host', { ip: '10.0.0.1' })

  const rel = kg.addRelation('runs-on', 's1', 'h1')
  assert.ok(rel)
  assert.equal(rel.type, 'runs-on')
  assert.equal(rel.sourceId, 's1')
  assert.equal(rel.targetId, 'h1')
})

test('KnowledgeGraph addRelation returns null for missing entities', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})

  const rel = kg.addRelation('runs-on', 's1', 'h1')
  assert.equal(rel, null)
})

test('KnowledgeGraph addRelation deduplicates', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('v1', 'vulnerability', {})

  kg.addRelation('has-vuln', 'h1', 'v1')
  kg.addRelation('has-vuln', 'h1', 'v1', { extra: true })

  assert.equal(kg.relationCount, 1)
  const rels = kg.getRelationsFrom('h1')
  assert.equal(rels.length, 1)
  assert.equal(rels[0]!.properties['extra'], true)
})

test('KnowledgeGraph getRelationsFrom returns outgoing relations', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('v1', 'vulnerability', {})
  kg.addEntity('v2', 'vulnerability', {})
  kg.addRelation('has-vuln', 'h1', 'v1')
  kg.addRelation('has-vuln', 'h1', 'v2')

  const rels = kg.getRelationsFrom('h1')
  assert.equal(rels.length, 2)
})

test('KnowledgeGraph getRelationsTo returns incoming relations', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('s1', 'service', {})
  kg.addEntity('s2', 'service', {})
  kg.addRelation('runs-on', 's1', 'h1')
  kg.addRelation('runs-on', 's2', 'h1')

  const rels = kg.getRelationsTo('h1')
  assert.equal(rels.length, 2)
})

// ---------------------------------------------------------------------------
// Graph queries
// ---------------------------------------------------------------------------

test('KnowledgeGraph findPath finds shortest path', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('v1', 'vulnerability', {})
  kg.addEntity('a1', 'access', {})
  kg.addRelation('has-vuln', 'h1', 'v1')
  kg.addRelation('leads-to', 'v1', 'a1')

  const path = kg.findPath('h1', 'a1')
  assert.ok(path)
  assert.equal(path.length, 2)
  assert.equal(path.entities.length, 3)
  assert.equal(path.entities[0]!.id, 'h1')
  assert.equal(path.entities[2]!.id, 'a1')
})

test('KnowledgeGraph findPath returns null when no path exists', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('h2', 'host', {})

  const path = kg.findPath('h1', 'h2')
  assert.equal(path, null)
})

test('KnowledgeGraph findPath returns zero-length path for same entity', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})

  const path = kg.findPath('h1', 'h1')
  assert.ok(path)
  assert.equal(path.length, 0)
})

test('KnowledgeGraph getNeighborhood returns 1-hop neighbors', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('s1', 'service', {})
  kg.addEntity('v1', 'vulnerability', {})
  kg.addEntity('h2', 'host', {}) // Not connected
  kg.addRelation('runs-on', 's1', 'h1')
  kg.addRelation('has-vuln', 'h1', 'v1')

  const neighborhood = kg.getNeighborhood('h1')
  assert.equal(neighborhood.entities.length, 3) // h1, s1, v1
  assert.equal(neighborhood.relations.length, 2)
})

// ---------------------------------------------------------------------------
// Eviction
// ---------------------------------------------------------------------------

test('KnowledgeGraph evicts oldest entity when maxEntities exceeded', () => {
  const kg = new KnowledgeGraph({ maxEntities: 3 })
  kg.addEntity('e1', 'host', {})
  kg.addEntity('e2', 'host', {})
  kg.addEntity('e3', 'host', {})

  // Adding e4 should evict the oldest and maintain maxEntities
  kg.addEntity('e4', 'host', {})
  assert.equal(kg.entityCount, 3)
  assert.ok(kg.getEntity('e4')) // e4 is new, should always survive
})

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

test('KnowledgeGraph ingestEvidenceEntries imports structured data', () => {
  const kg = new KnowledgeGraph()
  const entries = [
    { type: 'host', target: '10.0.0.1', os: 'Linux' },
    { type: 'service', target: '10.0.0.1', port: 80, name: 'http' },
    { type: 'vulnerability', target: '10.0.0.1', id: 'CVE-2024-1234', severity: 'critical' },
    { type: 'credential', target: '10.0.0.1:80', username: 'admin' },
  ]

  const imported = kg.ingestEvidenceEntries(entries)
  assert.equal(imported, 4)
  assert.ok(kg.getEntity('10.0.0.1'))
  assert.ok(kg.getEntity('10.0.0.1:80'))
  assert.ok(kg.getEntity('CVE-2024-1234'))
  assert.ok(kg.getEntitiesByType('credential').length > 0)
})

test('KnowledgeGraph clear removes everything', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('v1', 'vulnerability', {})
  kg.addRelation('has-vuln', 'h1', 'v1')

  kg.clear()
  assert.equal(kg.entityCount, 0)
  assert.equal(kg.relationCount, 0)
})

// ---------------------------------------------------------------------------
// Statistics and formatting
// ---------------------------------------------------------------------------

test('KnowledgeGraph getStats returns counts by type', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('h1', 'host', {})
  kg.addEntity('h2', 'host', {})
  kg.addEntity('v1', 'vulnerability', {})

  const stats = kg.getStats()
  assert.equal(stats['totalEntities'], 3)
  assert.equal(stats['entities_host'], 2)
  assert.equal(stats['entities_vulnerability'], 1)
})

test('KnowledgeGraph formatForAgent produces readable output', () => {
  const kg = new KnowledgeGraph()
  kg.addEntity('10.0.0.1', 'host', {})
  kg.addEntity('v1', 'vulnerability', { severity: 'critical' })
  kg.addRelation('has-vuln', '10.0.0.1', 'v1')

  const output = kg.formatForAgent()
  assert.ok(output.includes('Knowledge Graph Summary'))
  assert.ok(output.includes('10.0.0.1'))
  assert.ok(output.includes('1 critical'))
})
