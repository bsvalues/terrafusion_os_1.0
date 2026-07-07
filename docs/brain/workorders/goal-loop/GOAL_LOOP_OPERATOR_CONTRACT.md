# Goal / Loop Operator Contract

Work order: WO-CODEX-OP-002
Program: codex-operator-playbook
Goal: GOAL-TF-CODEX-OPERATOR-WO-PLAYBOOK-001
Loop: LOOP-TF-CODEX-OPERATOR-WO-PLAYBOOK-001

## Contract

Every governed TerraFusion program starts with a `/goal` and a `/loop`.

| Primitive | Owns | Does not own |
|-----------|------|--------------|
| Goal | Intent, success state, program identity, authority boundary. | File edits, PR state, merge authority, production authority. |
| Loop | Repeated execution rules, continuation criteria, stop gates. | Permission to cross risk boundaries or ignore owner walls. |
| Work Order | Bounded packet: files, systems, deliverables, validation, stop type. | Unbounded program scope or future-lane authority. |
| Evidence | What happened, what did not happen, validation, risks, non-claims. | Authority to mutate beyond the Work Order. |
| PR | Review and branch-protection sync boundary. | Merge authority unless owner explicitly grants it. |

## Execution Rule

When a `/goal` plus `/loop` defines an ordered Work Order chain, Codex executes the next eligible Work
Order without asking the owner to copy another prompt.

Codex returns only when:

- the chain completes,
- merge authorization is required,
- a hook bypass is required,
- review requires scope expansion,
- validation fails outside Work Order scope,
- a protected system or owner authority wall appears.

## Completion Proof

A Work Order is complete only when its evidence and PR state support the claim:

- deliverables exist,
- validation ran,
- changed files match authorized scope,
- remote checks are green or explicitly acceptable,
- review threads are resolved,
- merge happened if the Work Order requires merged state,
- post-merge verification is complete if merge was authorized.

STOP_TYPE: GOAL_LOOP_OPERATOR_CONTRACT_DEFINED
