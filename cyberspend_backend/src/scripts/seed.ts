import { db } from '../db/index.js'
import { assets, vulnerabilities, controls } from '../db/schema.js'

const assetSeed = [
  { id: 'A1', name: 'Customer Payments DB', category: 'Database', value: 45000000, criticality: 'Critical' as const, internetExposed: false },
  { id: 'A2', name: 'Public API Gateway', category: 'Network', value: 12000000, criticality: 'High' as const, internetExposed: true },
  { id: 'A3', name: 'Employee Email (O365)', category: 'SaaS', value: 8000000, criticality: 'Medium' as const, internetExposed: true },
  { id: 'A4', name: 'HR & Payroll System', category: 'Application', value: 15000000, criticality: 'High' as const, internetExposed: false },
  { id: 'A5', name: 'Corporate Website', category: 'Web', value: 3000000, criticality: 'Low' as const, internetExposed: true },
  { id: 'A6', name: 'Internal File Server', category: 'Storage', value: 6000000, criticality: 'Medium' as const, internetExposed: false },
  { id: 'A7', name: 'VPN Concentrator', category: 'Network', value: 5000000, criticality: 'High' as const, internetExposed: true },
  { id: 'A8', name: 'Dev/Staging Environment', category: 'Application', value: 2000000, criticality: 'Low' as const, internetExposed: true },
]

const vulnSeed = [
  { id: 'V1', assetId: 'A1', name: 'Unpatched PostgreSQL CVE (RCE)', cvss: 9.8, exploitAvailable: true, controlEffectiveness: 0.1 },
  { id: 'V2', assetId: 'A2', name: 'Missing MFA on Admin Console', cvss: 8.1, exploitAvailable: true, controlEffectiveness: 0.15 },
  { id: 'V3', assetId: 'A3', name: 'Phishing-susceptible mail flow', cvss: 6.5, exploitAvailable: true, controlEffectiveness: 0.35 },
  { id: 'V4', assetId: 'A4', name: 'Outdated TLS on internal portal', cvss: 5.4, exploitAvailable: false, controlEffectiveness: 0.4 },
  { id: 'V5', assetId: 'A5', name: 'Outdated CMS plugin (XSS)', cvss: 6.1, exploitAvailable: true, controlEffectiveness: 0.2 },
  { id: 'V6', assetId: 'A6', name: 'Weak share permissions', cvss: 5.9, exploitAvailable: false, controlEffectiveness: 0.3 },
  { id: 'V7', assetId: 'A7', name: 'No network segmentation from VPN', cvss: 7.2, exploitAvailable: false, controlEffectiveness: 0.25 },
  { id: 'V8', assetId: 'A2', name: 'No rate limiting on API', cvss: 6.8, exploitAvailable: true, controlEffectiveness: 0.2 },
  { id: 'V9', assetId: 'A8', name: 'Default credentials on staging', cvss: 7.5, exploitAvailable: true, controlEffectiveness: 0.05 },
  { id: 'V10', assetId: 'A1', name: 'Excessive DB privilege grants', cvss: 6.0, exploitAvailable: false, controlEffectiveness: 0.3 },
]

const controlSeed = [
  { id: 'C1', name: 'MFA Everywhere', cost: 800000, riskReductionPct: 0.35, category: 'Identity' },
  { id: 'C2', name: 'Patch Management Program', cost: 1500000, riskReductionPct: 0.4, category: 'Vulnerability Mgmt' },
  { id: 'C3', name: 'EDR Deployment', cost: 2200000, riskReductionPct: 0.3, category: 'Endpoint' },
  { id: 'C4', name: 'Network Segmentation', cost: 1800000, riskReductionPct: 0.25, category: 'Network' },
  { id: 'C5', name: 'API Rate Limiting & WAF', cost: 600000, riskReductionPct: 0.2, category: 'Application' },
  { id: 'C6', name: 'Security Awareness Training', cost: 300000, riskReductionPct: 0.15, category: 'People' },
]

async function seed() {
  console.log('Seeding database...')

  await db.delete(vulnerabilities)
  await db.delete(controls)
  await db.delete(assets)

  await db.insert(assets).values(assetSeed)
  await db.insert(vulnerabilities).values(vulnSeed)
  await db.insert(controls).values(controlSeed)

  console.log(`Inserted ${assetSeed.length} assets, ${vulnSeed.length} vulnerabilities, ${controlSeed.length} controls.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
