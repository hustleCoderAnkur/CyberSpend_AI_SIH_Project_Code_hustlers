import { Router } from 'express'
import { db } from '../db/index.js'
import { controls } from '../db/schema.js'

export const complianceRouter = Router()

// Static prototype mapping: control name -> relevant framework clauses.
// Replace with a real framework database as this matures.
const FRAMEWORK_MAP: Record<string, Record<string, string[]>> = {
  'MFA Everywhere': {
    'ISO 27001': ['A.9.4.2 Secure log-on procedures'],
    'NIST CSF': ['PR.AC-7'],
    'CIS Controls': ['CIS 6 - Access Control Management'],
    RBI: ['Cyber Security Framework - Access Controls'],
    SEBI: ['CSCRF - Identity & Access Management'],
  },
  'Patch Management Program': {
    'ISO 27001': ['A.8.8 Management of technical vulnerabilities'],
    'NIST CSF': ['PR.IP-12'],
    'CIS Controls': ['CIS 7 - Continuous Vulnerability Management'],
    RBI: ['Cyber Security Framework - Patch Management'],
    SEBI: ['CSCRF - Vulnerability Management'],
  },
  'EDR Deployment': {
    'ISO 27001': ['A.8.7 Protection against malware'],
    'NIST CSF': ['DE.CM-4'],
    'CIS Controls': ['CIS 10 - Malware Defenses'],
    RBI: ['Cyber Security Framework - Endpoint Security'],
    SEBI: ['CSCRF - Endpoint Detection & Response'],
  },
  'Network Segmentation': {
    'ISO 27001': ['A.8.22 Segregation of networks'],
    'NIST CSF': ['PR.AC-5'],
    'CIS Controls': ['CIS 12 - Network Infrastructure Management'],
    RBI: ['Cyber Security Framework - Network Segmentation'],
    SEBI: ['CSCRF - Network Security'],
  },
  'API Rate Limiting & WAF': {
    'ISO 27001': ['A.8.26 Application security requirements'],
    'NIST CSF': ['PR.DS-5'],
    'CIS Controls': ['CIS 4 - Secure Configuration'],
    RBI: ['Cyber Security Framework - Application Security'],
    SEBI: ['CSCRF - Application Security Controls'],
  },
  'Security Awareness Training': {
    'ISO 27001': ['A.6.3 Information security awareness, education and training'],
    'NIST CSF': ['PR.AT-1'],
    'CIS Controls': ['CIS 14 - Security Awareness and Skills Training'],
    RBI: ['Cyber Security Framework - Training'],
    SEBI: ['CSCRF - Awareness Program'],
  },
}

complianceRouter.get('/', async (_req, res) => {
  const rows = await db.select().from(controls)
  const mapped = rows.map((c) => ({
    control: c.name,
    frameworks: FRAMEWORK_MAP[c.name] ?? {},
  }))
  res.json(mapped)
})
