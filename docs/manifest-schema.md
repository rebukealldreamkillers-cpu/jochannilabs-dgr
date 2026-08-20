# Governance Manifest — JSON Schema Specification
## DAL-X Policy Configuration Format v2.0

This document is the authoritative contract between the Decision Governance Review and DAL-X.
The DGR app generates this manifest. The executive sponsor signs it. DAL-X loads the signed
version as its runtime enforcement configuration.

**Three-act rule:** A PROPOSED manifest is not a signed policy. A SIGNED manifest is not yet
an enforced policy. Enforcement begins only when DAL-X loads a manifest the named sponsor
has signed. These states must never be conflated.

---

## Top-Level Structure

```json
{
  "manifestVersion": "2.0",
  "manifestStatus": "PROPOSED | SIGNED | SUPERSEDED",
  "engagementId": "<uuid>",
  "companyName": "<string>",
  "generatedAt": "<ISO8601>",
  "signedAt": "<ISO8601 | null>",
  "signedBy": {
    "name": "<string>",
    "title": "<string>",
    "email": "<string>"
  },
  "summary": {
    "totalAgents": "<int>",
    "postureBreakdown": {
      "KEEP": "<int>",
      "DOWNSIZE": "<int>",
      "REPLACE": "<int>",
      "KILL": "<int>"
    },
    "totalLockedPostures": "<int>"
  },
  "agents": [ "<AgentEntry[]>" ]
}
```

**Field notes:**
- `manifestStatus`: Must be `PROPOSED` until the sponsor signs. Transitions to `SIGNED` on
  signing. Transitions to `SUPERSEDED` when a new review cycle begins and a new PROPOSED
  manifest is generated. SUPERSEDED manifests are never deleted.
- `signedAt` / `signedBy`: Null when PROPOSED. Populated on signing. Immutable after signing.

---

## AgentEntry

One entry per registered AI agent in the engagement.

```json
{
  "agentId": "<uuid>",
  "name": "<string>",
  "registrationStatus": "ACTIVE | SUSPENDED | DECOMMISSIONING | CLOSED",
  "permittedPurpose": "<string>",
  "authorityChain": { "<AuthorityChain>" },
  "evidenceStandard": { "<EvidenceStandard>" },
  "costBoundaries": { "<CostBoundaries>" },
  "alternativeMechanism": { "<AlternativeMechanism>" },
  "riskConditions": [ "<RiskCondition[]>" ],
  "governancePosture": { "<GovernancePosture>" }
}
```

**Field notes:**
- `registrationStatus`: Reflects the agent's current operational status. DAL-X uses this to
  determine whether to evaluate the agent at all. CLOSED agents have no active enforcement.
- `permittedPurpose`: The explicit statement of what this agent is authorized to do. DAL-X
  validates execution requests against this boundary.

---

## AuthorityChain

Who owns this agent and who DAL-X validates before authorizing execution.

```json
{
  "sponsorName": "<string>",
  "sponsorTitle": "<string>",
  "sponsorEmail": "<string>",
  "authorizedAt": "<ISO8601 | null>"
}
```

**Field notes:**
- `authorizedAt`: Null until the sponsor signs the manifest. Populated on signing.
- The sponsor is a named individual, not a department or role. DAL-X cannot validate
  authority against a title alone.

---

## EvidenceStandard

The evidence threshold required before this agent may be activated or its authority expanded.
DAL-X verifies that the required validation STATUS exists — it does not re-evaluate the
underlying business evidence on each execution.

```json
{
  "type": "NONE | ANECDOTAL | DOCUMENTED",
  "activationThreshold": "<string | null>",
  "expansionConditions": "<string | null>"
}
```

**Field notes:**
- `activationThreshold`: The evidence standard that must be met before this agent is
  activated or reactivated (e.g., "Documented performance against RCM denial rate baseline
  required before any volume increase"). Null if type is NONE.
- `expansionConditions`: Conditions under which this agent's authority boundary may be
  expanded. Null if no expansion path is defined.

---

## CostBoundaries

The approved cost parameters DAL-X enforces at the call site.

```json
{
  "approvedCostPerCallUsd": "<decimal | null>",
  "approvedMonthlyVolumeLimit": "<int | null>",
  "approvedMonthlyTotalUsd": "<decimal | null>",
  "interceptionThresholdUsd": "<decimal | null>",
  "escalationThresholdUsd": "<decimal | null>"
}
```

**Field notes:**
- `interceptionThresholdUsd`: Cost per call at which DAL-X intercepts the execution request
  for review. If null, cost-based interception is not active for this agent.
- `escalationThresholdUsd`: Monthly cumulative spend at which DAL-X escalates to the named
  sponsor. If null, spend-based escalation is not active.
- DAL-X enforces these boundaries. It does not modify them. Changes require a new manifest
  signed by the named sponsor.

---

## AlternativeMechanism

The approved lower-cost alternative identified in Q4. DAL-X can block the current agent and
authorize the alternative once implemented. DAL-X does not build the alternative route —
the client's technical team is responsible for implementation.

```json
{
  "type": "RULES_BASED | RPA | SMALLER_MODEL | NO_MODEL | OTHER | null",
  "description": "<string | null>",
  "estimatedCostPerCallUsd": "<decimal | null>",
  "migrationConditions": "<string | null>",
  "clientImplementationRequired": "<boolean>"
}
```

**Field notes:**
- `migrationConditions`: The conditions the client's technical team must satisfy before the
  alternative becomes the authorized execution path. Required when type is not NO_MODEL or null.
- `clientImplementationRequired`: True whenever an alternative mechanism has been identified
  and must be implemented by the client. DAL-X uses this to flag whether an alternative
  route is expected to exist in the client environment.

---

## RiskCondition

One entry per risk identified in Q5. These are the conditions that drive DAL-X escalation
triggers and prohibited execution conditions.

```json
{
  "id": "<uuid>",
  "description": "<string>",
  "category": "OPERATIONAL | REGULATORY | COMPLIANCE | REPUTATIONAL",
  "severity": "LOW | MEDIUM | HIGH",
  "outputConditions": "<string>",
  "escalationTrigger": "<string>",
  "requiredReviewer": {
    "name": "<string>",
    "title": "<string>"
  },
  "prohibitedExecutionConditions": "<string | null>"
}
```

**Field notes:**
- `outputConditions`: The specific output characteristics of this agent that create or
  indicate this risk (e.g., "outputs that modify patient treatment codes without documented
  physician review").
- `escalationTrigger`: The condition that causes DAL-X to fire an escalation event for this
  risk (e.g., "any output in category X exceeding confidence threshold Y").
- `requiredReviewer`: The named individual who must review escalations triggered by this
  risk condition. Must be a person, not a department.
- `prohibitedExecutionConditions`: If present, DAL-X blocks execution entirely when these
  conditions are detected. No token is issued. Null if there are no absolute prohibitions
  for this risk.

---

## GovernancePosture

The governance posture proposed by DGR and, once signed, enforced by DAL-X.

```json
{
  "posture": "KEEP | DOWNSIZE | REPLACE | KILL",
  "dalxEnforcementPosture": "<string>",
  "reason": "<string>",
  "evidenceSummary": "<string | null>",
  "conditionForChange": "<string>",
  "proposedAt": "<ISO8601 | null>",
  "lockedAt": "<ISO8601 | null>"
}
```

**DAL-X enforcement posture by verdict:**

| Posture | DAL-X Enforcement |
|---------|------------------|
| KEEP | Maintains the approved authority boundary. Valid execution requests may receive authorization tokens. Defined cost, volume, review, and escalation controls remain active. |
| DOWNSIZE | Restricts the agent to the approved reduced scope. Requests outside that scope are blocked or escalated. Approved alternative routes may be invoked where the client has configured them. |
| REPLACE | Revokes execution authority from the current agent. No authorization token is issued for the replaced mechanism. The approved alternative becomes the authorized execution path once implemented and validated. |
| KILL | Revokes all execution authority. No authorization token is issued. The agent remains blocked until decommissioning is confirmed and its registration is formally closed. |

**Field notes:**
- `dalxEnforcementPosture`: The full text DAL-X displays and logs for this agent's enforcement
  state. Populated from the posture derivation engine at manifest generation time.
- `reason`: The evidence-derived reason for this posture. Not asserted independently of Q1–Q5.
- `conditionForChange`: The specific condition under which this posture would change if new
  evidence appeared.
- `lockedAt`: Null until the analyst locks the posture in the registry. A locked posture is
  a prerequisite for manifest generation. Postures cannot be changed after the manifest is SIGNED.

---

## State Transitions

```
PROPOSED → SIGNED      (executive sponsor signs via /api/sign/[token])
SIGNED   → SUPERSEDED  (new review cycle begins; new PROPOSED manifest created)
```

SUPERSEDED manifests are read-only historical records. They are never deleted.
DAL-X should be notified by Jochanni Labs FDE when a manifest transitions to SUPERSEDED,
so the new SIGNED manifest can be loaded as the active enforcement configuration.

---

## What DAL-X Does NOT Do

- DAL-X does not re-validate business evidence on each execution request. It verifies that
  the required validation status exists in the signed manifest.
- DAL-X does not build or configure the alternative mechanism route. The client's technical
  environment must provide that route. DAL-X authorizes or blocks against it.
- DAL-X does not modify the signed manifest. Changes require a new DGR review cycle,
  a new proposed manifest, and a new sponsor signature.
- DAL-X does not generate its own authority. It enforces the authority the named sponsor
  has signed.
