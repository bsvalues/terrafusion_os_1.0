# TerraFusion — 5-Question Vendor Call Script

**Purpose**: Control the first 10 minutes of a vendor discovery call  
**Posture**: Benton runtime pilot, proof-gated expansion, no overclaim  
**Date**: June 2026

---

## Opening (60 seconds)

> I'm not here with a generic platform pitch. I'm here with a defined assessor-modernization asset package that can be licensed exclusively in the assessor/CAMA field. The honest anchor is a Benton County runtime pilot, with a proof-gated 39-county provenance inventory as the expansion path — not a 39-county launch.

Pause. Let them respond. If they ask "what does it do," say:

> What it primarily solves is migration risk, workflow fragmentation, and operational discontinuity — the three things that kill county modernization projects.

Do NOT elaborate on architecture yet. Wait for their question.

---

## The 5 Questions (you ask them)

These control the conversation. Ask them in order. Each one surfaces what they actually need so you can position the asset precisely.

### Q1: "What's the biggest pain point your county customers raise about their current assessment workflow?"

**Why you ask this**: You need their language for the problem. Whatever words they use, mirror them back later. If they say "data silos," you say "data silos." If they say "manual reconciliation," you say "manual reconciliation."

**If they deflect or go broad**: Narrow it — "Specifically around the valuation-to-tax-roll pipeline, what breaks?"

**What you're listening for**: Whether their pain is (a) data fragmentation, (b) vendor lock-in / migration fear, (c) workflow gaps between legacy systems, or (d) compliance burden. Your asset addresses all four, but lead with whichever one they name.

---

### Q2: "When a county wants to modernize off their legacy CAMA system, what does that migration typically look like for you today?"

**Why you ask this**: This reveals their current migration cost, timeline, and failure modes. Every vendor has migration horror stories. You want them to tell you theirs.

**If they say it's smooth**: They're selling. Ask: "How long does the typical cutover take, and what's the data-loss risk during that window?"

**What you're listening for**: Migration duration (months? years?), data conversion cost, whether they build custom ETL per county. Your asset's transition-safe architecture is the answer to whatever pain they describe here.

---

### Q3: "How do you handle the gap between the legacy system's data model and your target platform's data model?"

**Why you ask this**: This is the technical credibility question. It tells you whether they have a real data governance layer or just brute-force ETL scripts. It also lets you introduce the doctrine/provenance concept naturally.

**Your bridge statement** (after they answer):

> That's exactly the problem we solved first. We built a proof-gated sync pipeline with full provenance tracking — every record carries its origin, transformation history, and promotion evidence. The doctrine layer classifies records by universe before they enter the canonical model. That's not something you bolt on later.

**Do NOT demo or show code.** Just plant the concept. If they want to see it, that's a second meeting.

---

### Q4: "If you could license a transition-safe modernization asset — already proven against real county data — instead of building migration tooling from scratch, what would that need to look like for you?"

**Why you ask this**: This is the framing question. You're not asking "would you buy this." You're asking them to describe their ideal acquisition shape. Whatever they say becomes the structure of your offer.

**If they say "we'd need to see it"**: Good. Say: "That's the second conversation. Right now I want to understand what structure works for your organization."

**If they name specific requirements**: Write them down verbatim. These become your term sheet customization points.

**What you're listening for**: Do they want (a) a white-label embed, (b) a technology acquisition, (c) a joint venture, or (d) a licensing deal? Your term sheet accommodates all four, but you position differently for each.

---

### Q5: "Who else would need to be in the room for a technical deep-dive and a deal-shape conversation?"

**Why you ask this**: This closes the call by establishing next steps and identifying the real decision-makers. If they can't name anyone, the interest isn't real.

**If they name people**: Confirm titles and say: "I'll prepare materials calibrated for that audience."

**If they say 'just me'**: Ask: "Are you authorized to evaluate a licensing structure, or would legal/corporate development need to weigh in?"

---

## Responses to Expected Questions

### "What's production-ready today?"

> A Benton County runtime pilot with real Harris PACS data — 89,000+ parcels — running through a proof-gated sync pipeline with full doctrine governance. Working valuation surfaces, parcel management, and a provenance-tracked data model. The 39-county provenance inventory is documented but expansion is proof-gated, not assumed.

Stop there. Do not elaborate unless they ask a specific follow-up.

### "How many counties are live?"

> One. Benton County, Washington. That's the honest anchor. The asset package includes a 39-county provenance inventory as the expansion blueprint, but I'm not going to claim 39 counties are running. What IS running is a complete doctrine-governed data pipeline against real county data.

### "What's your team size?"

> Solo developer to date. All governance — branch protection, CI gates, constitutional review — was designed for solo dev with CI as the integrity layer. That's actually a feature for licensing: the entire codebase has one consistent architectural voice with no committee drift.

### "Why not just build this yourself?"

> You could. The question is time-to-market and migration risk. This asset has 18 months of domain-specific architecture against real county data. The doctrine layer alone — universe classification, provenance tracking, proof-gated promotion — took months to get right. Licensing it gets you past the hardest part.

### "What about Harris/Tyler/Aumentum compatibility?"

> The current runtime proof is against Harris PACS 9.0. The sync architecture is source-agnostic by design — the landing layer, doctrine classification, and provenance tracking work the same regardless of source system. Extending to Tyler or Aumentum is connector work, not architecture work.

---

## Do-Not-Say List

| Instead of | Say |
|------------|-----|
| "39-county platform" | "39-county provenance inventory" |
| "production system" | "runtime pilot" |
| "system of record" | "transition-safe modernization asset" (unless they ask about data authority) |
| "AI-powered" | "doctrine-governed" (unless they specifically ask about AI) |
| "1,008 agents" | Nothing. Do not mention the swarm unprompted. |
| "FISMA-HIGH compliant" | "FISMA-HIGH posture target" |
| "we" (implying a team) | "I" or "the asset" |
| Any specific price | "That depends on deal structure — let's get the shape right first" |

---

## Call Logistics

- **Duration target**: 10 minutes for discovery, 5 minutes for next-step agreement
- **Your goal**: Get a second meeting with technical + business stakeholders
- **Their goal**: Figure out if this is real. Your job is to make that easy by being honest.
- **Materials to have ready**: One-pager (01), asset inventory, term sheet. Do NOT send before the call. Send after, calibrated to what they asked about.
- **Follow-up within**: 24 hours. Reference their exact words from Q1 and Q2 in the follow-up email.

---

## Post-Call Debrief Checklist

After every call, write down:

1. What pain point did they name first? (Q1 answer)
2. What's their current migration approach? (Q2 answer)
3. Do they have a data governance layer? (Q3 answer)
4. What acquisition shape did they describe? (Q4 answer)
5. Who are the real decision-makers? (Q5 answer)
6. What specific follow-up materials should I send?
7. What should I NOT send based on what they revealed?
