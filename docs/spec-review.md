# Review of the Wheelberry spec

Review of `docs/spec.md` and `docs/mission-statement.md` as they stand on the `rework` branch, 17 October 2026. Cross-checked against the code in this monorepo. Written for Richard to react to; nothing here is a decision.

**All five workstreams have now been worked, and `spec.md` has been reconciled with every decision taken** (18 October 2026). [requirements.md](requirements.md) is the authoritative requirements list; `spec.md` now indexes it by title rather than carrying a second copy. This document remains the index of what the review found and what is left.

The fifth workstream, audit retention, is written up in [audit-retention.md](audit-retention.md) and is **worked but not yet decided** — it proposes six record classes, a lawful basis per class and the retention periods, and four decisions are with Richard. It is the one workstream where part of the answer needs a data-protection specialist rather than a product decision.

The spec is in good shape. The mission is clear, the layering (one device model, thin channel adapters, a safety and policy engine in between) is the right shape for this problem, and the risk section is honest about the seating work being both the most valuable and the only dangerous part. Everything below is about internal contradictions and gaps, not about direction.

The first item, movement semantics, is worked separately in [movement-semantics.md](movement-semantics.md) and is now **decided** — contradictions 1, 2 and 4 below are resolved there and are kept here only for the record. This document records the whole review so the rest does not get lost.

## Contradictions to resolve

1. **F4 against F9: scheduled movement.** F4's worked example is "Bedtime: recline seat, dim lights", runnable "by one action and on a schedule". F9 requires hold-to-run or explicit confirmation for movement, with stop on release, timeout or loss of connection. Both cannot be true: a schedule has nobody holding anything. Either unattended movement is prohibited outright, or presets are a defined third mode with their own rules. See [movement-semantics.md](movement-semantics.md).

2. **F10 against the safety NFR.** The safety NFR correctly says the independent stop circuit must not depend on software. F10 says stop is available on every channel and never blocked by the cloud, which reads as a promise that Alexa offers stop. A cloud-routed voice stop is seconds of latency and cannot be a safety stop. The fix is to name three different things (safety stop, local stop, convenience stop) and to allow movement only from channels that can also deliver a local stop. See [movement-semantics.md](movement-semantics.md).

3. **The Home Assistant decision is both made and open.** The architecture section states "Key decision: build on Home Assistant, not beside it", while the open questions still ask "Should Wheelberry sit on top of Home Assistant (recommended) or stand alone?". Close it one way and record it as a short decision record, including what it means for reliability that an add-on restarts when the HA host updates, and whether the safety path is allowed to traverse HA at all (suggested answer: never; seating talks to the hub directly and HA is only a home-device backend). Worked separately in [home-assistant-decision.md](home-assistant-decision.md) and now **decided**: the hub is standalone only, no safety path traverses HA, a Home-Assistant-free install is supported, the integration exposes read and non-movement control only, and users and carers may hold HA logins. The spec's "build on Home Assistant, not beside it" line should be replaced, and the architecture section gains a direction the review did not anticipate — Wheelberry may implement some home-control APIs directly, lighting first, making HA one backend among several.

4. **AI and voice reach for moving equipment.** The MCP server is described as letting assistants "see and control devices within the same permissions". Read literally, an LLM can tilt a seat. The same applies to the Alexa skill, and the existing-work section already notes the current skill moves the seat for a spoken number of seconds. Needs an explicit statement of which channels may touch which capability classes. Note the tension honestly: for some users speech is the only reliable input, so a blanket "voice cannot move the seat" excludes exactly the people the product is for. The problem is cloud latency, not speech.

5. **Audit log against GDPR erasure.** F14 wants an audit log of every action. The privacy NFR promises the user can export and delete their data, treated as health data under UK GDPR. There is no stated retention period, no distinction between the safety-relevant record and the usage record, and no anonymisation policy. Worth deciding what the lawful basis is for keeping a safety audit trail after an erasure request, and how long each class is kept. Worked in [audit-retention.md](audit-retention.md), which proposes the classes, the bases and the periods; **four decisions are with Richard**, and part of the answer needs a data-protection specialist. The contradiction itself is resolved in principle: Article 17(3) means erasure was never absolute, so the safety record can be kept — but only if its lawful basis is chosen in advance, the classes are separately deletable, and the user is told at onboarding. Two findings beyond the contradiction: the controller/processor relationship differs across the three deployment shapes and nobody had said so, and anonymising a single-occupant movement record is not anonymisation.

## Gaps worth closing

All eleven are now closed, each by a numbered requirement in [requirements.md](requirements.md): arbitration F23, degraded mode F24, numbered non-functional requirements and the traceability matrix throughout, the 300 ms split N-S1 against N-P1 and N-P3, safety timing N-S5, pairing lifecycle F25, service mode F16, standards N-S6 and N-REG2, the M1 gate in full, internationalisation F28 and N-A4, simulator F27. The original text is kept below for the record.

- **Multi-actor arbitration.** F7 says who may act. Nothing says who wins when a carer and the user command the same device at once, whether a carer may override a user mid-movement, or what happens when a clinician changes a limit during a movement session.
- **Degraded-mode behaviour.** "Local control keeps working with the internet down" is asserted but not specified. What happens to permission changes made while offline, to audit records that cannot be shipped, to a remote carer mid-session, and to a cloud-only channel that comes back and replays a stale command.
- **The non-functional requirements are not numbered.** F1 to F14 can be traced from tests and issues; the NFR table cannot. Suggest N1 onwards, split into safety (N-S), security, accessibility, performance, and a requirement-to-milestone traceability matrix.
- **The 300 ms collision.** The responsiveness target (under 300 ms input to device command) is the same number as the dongle's watchdog timeout, and they are unrelated quantities that will be confused in review. They also need splitting per hop: a Zigbee round trip through Home Assistant will not fit a 300 ms budget, and should not be held to the same number as the seating path.
- **Safety timing must stay out of Node.** Worth stating as an architecture rule: the fail-safe watchdog lives in the STM32 firmware, where it already exists and is unit tested, and never in the hub's event loop. Node's garbage collector makes it unsuitable for hard timing.
- **Pairing lifecycle.** F13 covers firmware updates but not key rotation, device decommissioning, or what happens when a chair is sold, serviced, or reassigned to another user. Secondhand powered chairs are common.
- **Service and bench mode.** Installers need to exercise seating with nobody in the chair. That is a distinct mode with distinct rules and is currently unnamed.
- **Standards naming.** ISO 14971 is cited. For the dongle, ISO 7176-14 (wheelchair electrical systems) and EN 12182 are probably also in play. A DPIA should be a named M0 deliverable alongside the UK and EU MDR assessment, given health-grade data and vulnerable users.
- **M1's gate is not measurable.** "Pilot user runs daily tasks unaided" needs a defined task list, a success threshold, and who judges it.
- **No internationalisation requirement**, though voice phrases, layouts and text expansion imply English-only today. Cheap to state now, expensive to retrofit.
- **No simulator requirement**, although the developer persona is promised "a simulator to test against". It should be a numbered requirement, and it is also what lets the safety logic be tested without hardware.

## Factual corrections

- The personal email address is in **both** `apps/proxy/cfg/wheelchair.json5` and `apps/proxy/cfg/blanket.json5` (`user@example.com`), not only the file the spec names. It is also in the git history, so if the repository is public, removing it from HEAD alone does not fix the exposure; it needs a history rewrite or an accepted decision to leave it.
- The existing proxy uses **MongoDB** (`apps/proxy/src/db/connection.ts`, Mongoose models under `apps/proxy/src/db/models/`), while the cloud plan specifies Postgres. That is a real rewrite cost sitting inside the "reuse Alexa account linking, portal shell" line, because the account linking is coupled to the Mongo user and token models.
- Minor: the scope table lists Alexa and Siri, while the architecture diagram says "Alexa skill, Google Home later" and omits Siri. One of the two is out of date.
- Minor: release numbering is inconsistent. The scope tables say "MVP / Second release / Release 3 / Release 4" while the milestones section uses M0 to M5. Suggest unifying on milestone numbers everywhere.

## Suggested order of work

Each decision constrains the next, so a single pass over everything would waste effort.

1. ~~**Movement semantics.**~~ Decided 17 October 2026; see [movement-semantics.md](movement-semantics.md) for the six decisions and the replacement wording for F4, F9, F10 and four new requirements.
2. ~~**Home Assistant decision.**~~ Decided 18 October 2026; see [home-assistant-decision.md](home-assistant-decision.md) for six decisions, a revised capability-matrix row for HA automations, precondition P9, and replacement wording for F7, F14, F21 and three new requirements.
3. ~~**Channel capability matrix.**~~ Drafted and decided as part of item 1.
4. ~~**Requirements hygiene.**~~ Done 18 October 2026; see [requirements.md](requirements.md) for the consolidated register, the numbered non-functional requirements, the milestone traceability matrix, the measurable M1 gate, six new requirements (F23–F28) and the list of changes `spec.md` needs. It also found F8 to be unenforceable as written.
5. **Existing-work truth pass.** Verify the repository table against the actual repositories. Only this monorepo is visible from here, so the Mongo and email findings above are the only ones confirmed against code.

Two things fall out of item 4 that are not workstreams of their own but need doing: applying the reconciliation list to `spec.md`, and regenerating `images/roadmap.png`, whose M3 caption contradicts the capability matrix.
