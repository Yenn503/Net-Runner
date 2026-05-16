export const DESCRIPTION = 'Query the curated Net-Runner exploit arsenal by product/version/CVE. Native CLI equivalent of the MCP nr_arsenal_lookup tool.'

export const PROMPT = `Query the curated exploit arsenal (.netrunner/arsenal/index/*.yaml) for known-exploit leads matching a fingerprinted target.

Use this before fresh CVE research when you know product/version or CVE. Filter by product, version, cve, exploit_type, surface, or min_reliability. Results include affected versions, references, reliability, prerequisites, execution adapter, detection notes, and operator notes. Arsenal entries are leads, not proof; validate against the in-scope target before recording a finding.`
