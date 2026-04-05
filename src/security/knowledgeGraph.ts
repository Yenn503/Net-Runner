/**
 * Knowledge Graph — in-memory entity/relation graph for cross-referencing pentest findings.
 *
 * Stores discovered hosts, services, vulnerabilities, credentials, and access levels
 * as a queryable graph. The engagement-lead uses this to make smarter routing decisions
 * and the MCTS planner can seed its initial state from graph data.
 *
 * Inspired by AutoRedTeam-Orchestrator's core/knowledge/manager.py but redesigned for
 * Net-Runner's TypeScript architecture with:
 * - Typed entity/relation schemas
 * - BFS path finding between entities
 * - LRU-style eviction when entity count exceeds limit
 * - Evidence ledger integration (can ingest from JSONL evidence entries)
 * - Structured prompt output for agent consumption
 */

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export type EntityType = 'host' | 'service' | 'vulnerability' | 'credential' | 'access' | 'technology' | 'finding'

export type KnowledgeEntity = {
  id: string
  type: EntityType
  properties: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Relation types
// ---------------------------------------------------------------------------

export type RelationType =
  | 'runs-on'       // service → host
  | 'has-vuln'      // service/host → vulnerability
  | 'exploits'      // credential/access → vulnerability
  | 'authenticates' // credential → service
  | 'lateral-to'    // access → host
  | 'uses-tech'     // host/service → technology
  | 'found-by'      // finding → any (provenance)
  | 'leads-to'      // vulnerability → access

export type KnowledgeRelation = {
  id: string
  type: RelationType
  sourceId: string
  targetId: string
  properties: Record<string, unknown>
  createdAt: number
}

// ---------------------------------------------------------------------------
// Query results
// ---------------------------------------------------------------------------

export type GraphPath = {
  entities: KnowledgeEntity[]
  relations: KnowledgeRelation[]
  length: number
}

export type GraphQueryResult = {
  entities: KnowledgeEntity[]
  relations: KnowledgeRelation[]
}

// ---------------------------------------------------------------------------
// Knowledge Graph
// ---------------------------------------------------------------------------

export type KnowledgeGraphOptions = {
  maxEntities?: number
}

export class KnowledgeGraph {
  private entities = new Map<string, KnowledgeEntity>()
  private relations = new Map<string, KnowledgeRelation>()
  private entityTypeIndex = new Map<EntityType, Set<string>>()
  private outRelations = new Map<string, Set<string>>() // entityId → set of relationIds
  private inRelations = new Map<string, Set<string>>()  // entityId → set of relationIds
  private maxEntities: number
  private relationCounter = 0

  constructor(options: KnowledgeGraphOptions = {}) {
    this.maxEntities = options.maxEntities ?? 10_000
  }

  // -----------------------------------------------------------------------
  // Entity CRUD
  // -----------------------------------------------------------------------

  addEntity(id: string, type: EntityType, properties: Record<string, unknown> = {}): KnowledgeEntity {
    const existing = this.entities.get(id)
    if (existing) {
      existing.properties = { ...existing.properties, ...properties }
      existing.updatedAt = Date.now()
      return existing
    }

    if (this.entities.size >= this.maxEntities) {
      this.evictOldest()
    }

    const entity: KnowledgeEntity = {
      id,
      type,
      properties,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.entities.set(id, entity)

    if (!this.entityTypeIndex.has(type)) {
      this.entityTypeIndex.set(type, new Set())
    }
    this.entityTypeIndex.get(type)!.add(id)

    return entity
  }

  getEntity(id: string): KnowledgeEntity | undefined {
    return this.entities.get(id)
  }

  getEntitiesByType(type: EntityType): KnowledgeEntity[] {
    const ids = this.entityTypeIndex.get(type)
    if (!ids) return []
    const result: KnowledgeEntity[] = []
    for (const id of Array.from(ids)) {
      const e = this.entities.get(id)
      if (e) result.push(e)
    }
    return result
  }

  findEntities(type: EntityType, filter: Record<string, unknown>): KnowledgeEntity[] {
    return this.getEntitiesByType(type).filter(e => {
      for (const [key, value] of Object.entries(filter)) {
        if (e.properties[key] !== value) return false
      }
      return true
    })
  }

  removeEntity(id: string): boolean {
    const entity = this.entities.get(id)
    if (!entity) return false

    // Remove all relations involving this entity
    const outRels = this.outRelations.get(id)
    if (outRels) {
      for (const relId of Array.from(outRels)) this.relations.delete(relId)
    }
    const inRels = this.inRelations.get(id)
    if (inRels) {
      for (const relId of Array.from(inRels)) this.relations.delete(relId)
    }

    this.outRelations.delete(id)
    this.inRelations.delete(id)
    this.entityTypeIndex.get(entity.type)?.delete(id)
    this.entities.delete(id)
    return true
  }

  // -----------------------------------------------------------------------
  // Relation CRUD
  // -----------------------------------------------------------------------

  addRelation(
    type: RelationType,
    sourceId: string,
    targetId: string,
    properties: Record<string, unknown> = {},
  ): KnowledgeRelation | null {
    if (!this.entities.has(sourceId) || !this.entities.has(targetId)) return null

    // Check for duplicate
    const outRels = this.outRelations.get(sourceId)
    if (outRels) {
      for (const relId of Array.from(outRels)) {
        const existing = this.relations.get(relId)
        if (existing && existing.type === type && existing.targetId === targetId) {
          existing.properties = { ...existing.properties, ...properties }
          return existing
        }
      }
    }

    const id = `rel-${++this.relationCounter}`
    const relation: KnowledgeRelation = {
      id,
      type,
      sourceId,
      targetId,
      properties,
      createdAt: Date.now(),
    }
    this.relations.set(id, relation)

    if (!this.outRelations.has(sourceId)) this.outRelations.set(sourceId, new Set())
    this.outRelations.get(sourceId)!.add(id)

    if (!this.inRelations.has(targetId)) this.inRelations.set(targetId, new Set())
    this.inRelations.get(targetId)!.add(id)

    return relation
  }

  getRelationsFrom(entityId: string): KnowledgeRelation[] {
    const ids = this.outRelations.get(entityId)
    if (!ids) return []
    const result: KnowledgeRelation[] = []
    for (const id of Array.from(ids)) {
      const r = this.relations.get(id)
      if (r) result.push(r)
    }
    return result
  }

  getRelationsTo(entityId: string): KnowledgeRelation[] {
    const ids = this.inRelations.get(entityId)
    if (!ids) return []
    const result: KnowledgeRelation[] = []
    for (const id of Array.from(ids)) {
      const r = this.relations.get(id)
      if (r) result.push(r)
    }
    return result
  }

  // -----------------------------------------------------------------------
  // Graph queries
  // -----------------------------------------------------------------------

  /** BFS shortest path between two entities. */
  findPath(fromId: string, toId: string, maxDepth = 10): GraphPath | null {
    if (!this.entities.has(fromId) || !this.entities.has(toId)) return null
    if (fromId === toId) {
      return { entities: [this.entities.get(fromId)!], relations: [], length: 0 }
    }

    const visited = new Set<string>([fromId])
    const queue: Array<{ entityId: string; path: Array<{ entityId: string; relationId: string }> }> = [
      { entityId: fromId, path: [] },
    ]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.path.length >= maxDepth) continue

      const outRels = this.outRelations.get(current.entityId)
      if (!outRels) continue

      for (const relId of Array.from(outRels)) {
        const rel = this.relations.get(relId)
        if (!rel) continue
        if (visited.has(rel.targetId)) continue

        const newPath = [...current.path, { entityId: rel.targetId, relationId: relId }]

        if (rel.targetId === toId) {
          const entities: KnowledgeEntity[] = [this.entities.get(fromId)!]
          const relations: KnowledgeRelation[] = []
          for (const step of newPath) {
            entities.push(this.entities.get(step.entityId)!)
            relations.push(this.relations.get(step.relationId)!)
          }
          return { entities, relations, length: newPath.length }
        }

        visited.add(rel.targetId)
        queue.push({ entityId: rel.targetId, path: newPath })
      }
    }

    return null
  }

  /** Get the full neighborhood of an entity (1-hop). */
  getNeighborhood(entityId: string): GraphQueryResult {
    const entities: KnowledgeEntity[] = []
    const relations: KnowledgeRelation[] = []
    const seen = new Set<string>()

    const entity = this.entities.get(entityId)
    if (!entity) return { entities, relations }

    entities.push(entity)
    seen.add(entityId)

    for (const rel of this.getRelationsFrom(entityId)) {
      relations.push(rel)
      if (!seen.has(rel.targetId)) {
        const target = this.entities.get(rel.targetId)
        if (target) entities.push(target)
        seen.add(rel.targetId)
      }
    }

    for (const rel of this.getRelationsTo(entityId)) {
      relations.push(rel)
      if (!seen.has(rel.sourceId)) {
        const source = this.entities.get(rel.sourceId)
        if (source) entities.push(source)
        seen.add(rel.sourceId)
      }
    }

    return { entities, relations }
  }

  // -----------------------------------------------------------------------
  // Statistics
  // -----------------------------------------------------------------------

  get entityCount(): number {
    return this.entities.size
  }

  get relationCount(): number {
    return this.relations.size
  }

  getStats(): Record<string, number> {
    const stats: Record<string, number> = {
      totalEntities: this.entities.size,
      totalRelations: this.relations.size,
    }
    for (const [type, ids] of Array.from(this.entityTypeIndex.entries())) {
      stats[`entities_${type}`] = ids.size
    }
    return stats
  }

  // -----------------------------------------------------------------------
  // Eviction
  // -----------------------------------------------------------------------

  private evictOldest(): void {
    let oldest: KnowledgeEntity | null = null
    for (const entity of Array.from(this.entities.values())) {
      if (!oldest || entity.updatedAt < oldest.updatedAt) {
        oldest = entity
      }
    }
    if (oldest) this.removeEntity(oldest.id)
  }

  // -----------------------------------------------------------------------
  // Bulk operations
  // -----------------------------------------------------------------------

  clear(): void {
    this.entities.clear()
    this.relations.clear()
    this.entityTypeIndex.clear()
    this.outRelations.clear()
    this.inRelations.clear()
    this.relationCounter = 0
  }

  /** Import from a flat array of evidence entries (e.g., from JSONL evidence ledger). */
  ingestEvidenceEntries(entries: Array<Record<string, unknown>>): number {
    let imported = 0
    for (const entry of entries) {
      const type = entry['type'] as string | undefined
      const target = entry['target'] as string | undefined

      if (type === 'host' && target) {
        this.addEntity(target, 'host', { ip: target, ...entry })
        imported++
      } else if (type === 'service' && target) {
        const port = entry['port'] as number | undefined
        const id = port ? `${target}:${port}` : target
        this.addEntity(id, 'service', { ...entry })
        if (target) {
          this.addEntity(target, 'host', { ip: target })
          this.addRelation('runs-on', id, target)
        }
        imported++
      } else if (type === 'vulnerability') {
        const vulnId = (entry['id'] as string) ?? `vuln-${imported}`
        this.addEntity(vulnId, 'vulnerability', { ...entry })
        if (target) {
          this.addEntity(target, 'host', { ip: target })
          this.addRelation('has-vuln', target, vulnId)
        }
        imported++
      } else if (type === 'credential') {
        const username = entry['username'] as string ?? 'unknown'
        const credId = `cred-${username}-${imported}`
        this.addEntity(credId, 'credential', { ...entry })
        if (target) {
          this.addRelation('authenticates', credId, target)
        }
        imported++
      }
    }
    return imported
  }

  // -----------------------------------------------------------------------
  // Agent prompt output
  // -----------------------------------------------------------------------

  formatForAgent(): string {
    const stats = this.getStats()
    const lines = [
      '[Knowledge Graph Summary]',
      `Entities: ${stats['totalEntities']}, Relations: ${stats['totalRelations']}`,
    ]

    const hosts = this.getEntitiesByType('host')
    if (hosts.length > 0) {
      lines.push(`\nHosts (${hosts.length}):`)
      for (const h of hosts.slice(0, 10)) {
        const vulnCount = this.getRelationsFrom(h.id).filter(r => r.type === 'has-vuln').length
        const serviceCount = this.getRelationsTo(h.id).filter(r => r.type === 'runs-on').length
        lines.push(`  ${h.id}: ${serviceCount} services, ${vulnCount} vulns`)
      }
      if (hosts.length > 10) lines.push(`  ... and ${hosts.length - 10} more`)
    }

    const vulns = this.getEntitiesByType('vulnerability')
    if (vulns.length > 0) {
      const critical = vulns.filter(v => v.properties['severity'] === 'critical').length
      const high = vulns.filter(v => v.properties['severity'] === 'high').length
      lines.push(`\nVulnerabilities (${vulns.length}): ${critical} critical, ${high} high`)
    }

    const creds = this.getEntitiesByType('credential')
    if (creds.length > 0) {
      lines.push(`\nCredentials: ${creds.length} harvested`)
    }

    return lines.join('\n')
  }
}
