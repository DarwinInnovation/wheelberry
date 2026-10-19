# Wheelberry requirements register

> **Parked — background, not the plan.**
>
> Written between 11 and 18 October 2026 for a larger, funded version of Wheelberry, and moved here on 19 October 2026. The live plan is [`../plan.md`](../plan.md) and it supersedes this document. Nothing here is known to be wrong; it is ahead of where the project is.
>
> **What it is worth later:** the requirement register for a funded product. The traceability matrix is reusable as-is; F1-F32 are not needed until there is more than one user.

18 October 2026. Fourth workstream out of [spec-review.md](spec-review.md), following [movement-semantics.md](movement-semantics.md) and [home-assistant-decision.md](home-assistant-decision.md).

**This document is the authoritative list of requirements.** It consolidates F1–F14 and the non-functional table from [spec.md](spec.md) with everything the decision records changed or added, numbers the non-functional requirements so they can be traced like the functional ones, makes the milestone gates measurable, and adds the requirements the review found missing.

**The audit retention decisions were applied on 18 October 2026** — F14 and F26 revised, F29–F32 added, N-D1 and N-D3 revised, N-D5 and N-REG3 added, N-REG2 extended. The reasoning is in [audit-retention.md](audit-retention.md).

**The reconciliation list at the end of this document was applied to `spec.md` on 18 October 2026**, in full — every must-change and should-change row. `spec.md` no longer carries requirement text at all: it indexes the F-series by title and points here, so there is one authoritative copy rather than two. Read this document for requirements and `spec.md` for mission, users, scope, architecture and milestones. The only item not closed is the roadmap image, which needs regenerating.

## What this pass does

Requirements hygiene sounds like clerical work and mostly is. But four substantive things came out of it, and the first is the one to read:

1. **F8 promises something the hub cannot do.** It says clinician-set limits on *range*, *speed* and *allowed positions* are enforced. With no position sensing (movement-semantics decision 1), the hub can enforce none of those. Revised below, and flagged because a clinician reading F8 as written would reasonably assume a protection that does not exist.
2. **F2 and the M3 gate both say every channel is equivalent.** The channel capability matrix says the opposite, deliberately. Both need rewording, and the roadmap image needs regenerating.
3. **The spec's advice to use Bedberry's angle sensing for presets is now wrong** — it was written before position sensing was deferred, and it is exactly the assumption F15 exists to prevent.
4. **Audit retention had no requirement at all**, which left contradiction 5 (audit log against GDPR erasure) with nowhere to land. F26 created the slot, and the retention workstream has since filled it: six record classes, a lawful basis each, and the decision that every action is logged alike. The consequence of that last one is F32 — with the log complete, *reading* it becomes the thing that needs controlling, and permission to read someone's home history had been the same permission as acting on their devices.

## Numbering

| Prefix | Area | Note |
| --- | --- | --- |
| `F` | Functional | F1–F14 keep their original numbers; F15–F32 are new |
| `P` | Preconditions for unattended movement | Qualify F17; set in movement-semantics, P9 revised by the HA decision |
| `A` | Conditions on AI assistants | Qualify F18 |
| `N-S` | Non-functional: safety | N-S1–N-S4 set in movement-semantics |
| `N-SEC` | Non-functional: security | |
| `N-A` | Non-functional: accessibility | |
| `N-P` | Non-functional: performance | N-P1–N-P3 set in movement-semantics |
| `N-R` | Non-functional: reliability | N-R1–N-R2 set in the HA decision |
| `N-D` | Non-functional: data protection and privacy | `N-P` was already taken by performance. N-D5 set in audit-retention |
| `N-REG` | Non-functional: regulatory | N-REG3 set in audit-retention |
| `N-O` | Non-functional: openness | |

Status column: **Original** = unchanged from spec.md. **Revised** = changed by a decision record or by a hygiene pass. **New** = added the same way. "This pass" means the requirements hygiene pass of 18 October 2026; later changes name their decision record instead.

## Functional requirements

### Devices and control

| ID | Requirement | Status |
| --- | --- | --- |
| **F1** | Represent every device as a set of typed capabilities (switch, level, position, temperature, scene) grouped by room. | Original |
| **F2** | Let a user run any action permitted to them *on that channel* from any enabled channel, with the same policy evaluation and the same safety checks. Channels differ in which capability classes they may command; see the capability matrix in movement-semantics. Where a channel may not perform an action, refuse it with a reason rather than hiding it without explanation. | **Revised, this pass** |
| **F3** | Report device state back to every channel within the same interaction (visible, spoken, or both), including when an action failed or was refused. Where a capability has no measured state, report what was commanded and when, and do not present it as a measurement. | **Revised, this pass** |
| **F4** | Support scenes and routines ("Bedtime": recline seat, dim lights, set heating), runnable by one action and on a schedule. A routine that moves a person runs as an unattended move and must satisfy F17. | Revised (movement-semantics) |

### Personalisation and access

| ID | Requirement | Status |
| --- | --- | --- |
| **F5** | Hold a profile per user: input method, scanning speed, layout, text size, contrast, voice phrases, locale. | Revised (locale added, this pass) |
| **F6** | Let installers and users build simple control layouts per person, with few large targets as the default. | Original |
| **F7** | Enforce permissions per user, per device and per channel for every action taken through a Wheelberry channel. Where a device is reached through a third-party platform that cannot express these permissions, record that the platform's own access is outside Wheelberry's control, and state it in installer documentation and in the onboarding flow that enables the platform. | Revised (HA decision) |

### Safety for moving equipment

| ID | Requirement | Status |
| --- | --- | --- |
| **F8** | Enforce clinician configuration on every moving capability, and record for each limit whether Wheelberry or the chair enforces it. Wheelberry enforces: which axes may move, in which modes, by which actors, for how long (N-S3), and how often (P4). The chair's own configured range and end-stops enforce position, and are set at installation. Where a limit is not enforceable by Wheelberry, it must not be presented in any clinician interface as though it were. | **Revised, this pass** |
| **F9** | Require hold-to-run, an attended bounded run, or a compliant unattended bounded run for every movement of a person, configurable per user and per axis. Hold-to-run stops on release, timeout or loss of connection. An attended run stops on its run-time cap, on loss of the presence heartbeat, or on any stop. No movement of a person may run without a recorded stop authority. | Revised (movement-semantics) |
| **F10** | Provide a safety stop independent of all software, a local stop from every local channel that bypasses permissions and queues, and a best-effort convenience stop from cloud channels. Convenience stop is never presented as a safety feature. | Revised (movement-semantics) |
| **F15** | Where an axis has no measured position, bound its movement by time and by the chair's own configured range, treat every position in that range as a position the user may be left in, and never present a nominal preset as a measured one. | New (movement-semantics) |
| **F16** | Provide a service mode for installers that permits movement only with no occupant, is time-limited, requires physical presence at the hub, and is audited. | New (movement-semantics) |
| **F17** | Permit unattended movement only under clinician opt-in per user and per axis, one axis at a time, within a run-time cap and daily budget, after a cancellable announcement, and never while an attended session is active. Any human command cancels it. Qualified by P1–P9. | New (movement-semantics) |
| **F18** | Restrict AI assistants to named presets under their own clinician opt-in, treat assistant-initiated movement as unattended unless a present human holds the stop, and record the requesting assistant and originating request in the audit log. Qualified by A1–A6. | New (movement-semantics) |
| **F23** | Make movement exclusive per axis: one actor holds a movement lease and a competing command is refused with a reason, never queued. Stop is never exclusive — anyone who can reach the hub may stop, lease or no lease, permission or no permission. A carer may stop a user's session but not preempt it. Unattended movement always yields to any human command. A clinician's configuration change takes effect at the start of the next session, never mid-move. Loss of the controlling channel ends the lease and stops the movement; it does not transfer. | **New, this pass** (from the arbitration rules in movement-semantics, which had no numbered requirement) |

### Platform, backends and resilience

| ID | Requirement | Status |
| --- | --- | --- |
| **F19** | The hub owns its own lifecycle and runs as its own process. No home-device platform may host it, manage its updates, or be required for it to start. | New (HA decision) |
| **F20** | The hub must provide seating control, chair-switch input, local stop and its own user interface when any home-device platform is absent, unreachable or restarting, showing affected devices as unavailable without degrading anything else. | New (HA decision) |
| **F21** | Where Wheelberry exposes its devices into a third-party platform, expose read and non-movement control only. Commands arriving from that platform are attributed to a single Wheelberry actor and evaluated against the full policy engine with no privileged path. Movement of a person is refused, with a reason the platform can report. | Revised (HA decision) |
| **F22** | Reach every home device through a backend adapter into one capability model, with exactly one backend owning a device at a time and no automatic failover between backends for the same device. | New (HA decision) |
| **F24** | Define and implement degraded-mode behaviour explicitly: permission and configuration changes made while the hub is offline take effect locally and reconcile on reconnection with a stated conflict rule; audit records are buffered locally and shipped without loss when connectivity returns; a remote carer's session ends rather than hanging; and a cloud channel reconnecting may not replay a command older than a stated staleness limit. | **New, this pass** |

### Lifecycle, management and record-keeping

| ID | Requirement | Status |
| --- | --- | --- |
| **F11** | Onboard a home: discover devices, connect home-device backends, pair Wheelberry controllers. | Revised (backends generalised, this pass) |
| **F12** | Manage users, roles and organisations across many homes. | Original |
| **F13** | Monitor hub and controller health, push firmware updates, and offer remote support only with the end user's consent. | Original |
| **F14** | Keep an audit log of every action taken through a Wheelberry channel: who, which channel, which device, result. **Every action is logged alike**, including a user's own actions on their own devices: the log is not cut by who acted, and the record of a user's own activity is as complete as the record of an action taken on them (decision, 18 October 2026). Where a device is reached through a third-party platform, record that the command was issued and its result, and state in the log that actions taken directly in that platform are outside Wheelberry's record. | **Revised (audit retention)** |
| **F25** | Support the whole pairing lifecycle, not only the first pairing: rotate per-device keys on a stated schedule and on demand; revoke a controller's credentials from the portal; decommission a device so that its historical audit records survive but it can no longer act; and transfer a chair or bed to a new user with a documented procedure that clears the previous user's configuration and personal data. Secondhand powered chairs are common and this is a foreseeable state, not an edge case. | **New, this pass** |
| **F26** | Classify every audit and usage record into one of the six classes C1–C6 defined in audit-retention, and record for each class a retention period, an Article 6 lawful basis and, where applicable, an Article 9 condition. Store classes so that deletion by class and by data subject is a tested operation. Stamp each record with its class, its retention expiry and, for C1 and C2, its retention tier at write time, and enforce expiry automatically; a record with no tier is reported as an exception rather than given a default. Never rely on consent as the basis for any record that must survive the withdrawal of that consent. The policy is written down before M1 ships an audit log. | **Revised (audit retention)** |
| **F29** | Determine the controller and processor relationship for each deployment shape, and implement erasure and subject-access handling accordingly: answer directly where Wheelberry is the controller, and route the request to the controller and tell the requester it has been routed where it is not. A request is never silently refused. | **New (audit retention)** |
| **F30** | Make the audit log append-only and tamper-evident, with per-record or per-subject encryption, so that erasure can be performed by destroying a key without breaking verifiability. | **New (audit retention)** |
| **F31** | Provide the user with an in-product view of every record held about them, by class, with its retention period, who else has read it, and whether it can be deleted on request. Disclose both the non-deletable safety record and the completeness of their own-action record before powered seating is enabled, in the onboarding flow rather than only in a policy document. | **New (audit retention)** |
| **F32** | Enforce read access to audit records per class and per role, separately from permission to act on a device: a user reads everything about themselves; a carer or family member reads their own actions and the sessions they conducted; a clinician reads C1 and C2 for the user in their care; an organisation admin reads C3 and C4 for their staff and C1 for a named incident under investigation, but never C5; Darwin support reads only within a consented F13 session. Record every read of a C1, C2, C3 or C5 record as a C4 event visible to the data subject. C5 is used only to show the user their own history and to diagnose faults — never for analytics, research, or disclosure to an organisation. | **New (audit retention)** |

### Development and reach

| ID | Requirement | Status |
| --- | --- | --- |
| **F27** | Provide a device and controller simulator that exercises the capability model, the policy engine and the movement modes with no hardware present, including fault injection for watchdog release, connection loss and stop. It is promised to the developer persona, it is already an M0 deliverable on the roadmap, and it is what lets the safety logic be tested in CI. | **New, this pass** |
| **F28** | Externalise every user-facing string, date, number and voice phrase for translation, and select locale per user from their profile (F5). No translations are committed to beyond English for now; the requirement is that adding one is not a rewrite. | **New, this pass** |

## Preconditions for unattended movement (qualify F17)

Set in [movement-semantics.md](movement-semantics.md); P9 revised by [home-assistant-decision.md](home-assistant-decision.md). Restated here only by title — the normative text is in those documents.

| ID | Precondition |
| --- | --- |
| **P1** | Clinician opt-in, per user and per axis. Off by default |
| **P2** | The axis's full configured travel passes the C-2 test, recorded by name with who judged it |
| **P3** | One axis at a time |
| **P4** | A run-time cap and a total daily movement budget per axis |
| **P5** | Audible and visible pre-announcement with a cancel window, at least 10 s |
| **P6** | No unattended movement during an attended lease, or within a cool-down of a manual stop |
| **P7** | Permitted only on axes where the clinician has explicitly accepted the entrapment residual risk |
| **P8** | Audited with trigger, envelope, and whether the cancel window elapsed unanswered |
| **P9** | No actor outside Wheelberry may command movement. Reopening requires a distinct clinician opt-in, preset-request entities rather than settable positions, and a recorded accepted hazard |

## Conditions on AI assistants (qualify F18)

| ID | Condition |
| --- | --- |
| **A1** | Named presets only; never raw axis or direction commands |
| **A2** | Clinician opt-in per axis, separate from the human opt-in, revocable without an assistant in the loop |
| **A3** | Full unattended envelope (P1–P8) unless a present human holds the stop |
| **A4** | Rate limited and non-repeating; a refused or cancelled move is not retried without fresh human intent |
| **A5** | Audit captures the assistant, the tool call, and the user utterance behind it |
| **A6** | Never during another actor's lease, never part of a composite action |

## Non-functional requirements

Safety and accessibility are pass/fail gates for every release. Targets marked *proposed* are not yet confirmed with users or measured on hardware.

### Safety (N-S)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-S1** | Watchdog release: last command received to outputs released | 300 ms, resend at 100 ms. Implemented and unit tested in the output module firmware |
| **N-S2** | Local stop: user action to outputs released | 150 ms worst case, **provisional**. Must hold under hub load. Confirmed or revised by the M2 hazard analysis, measured end to end on real hardware; may be tightened on that evidence, not loosened without the independent safety review seeing it |
| **N-S3** | Run-time cap per axis | Per axis, set with the clinician. The only enforceable bound on an open-loop move |
| **N-S4** | Unattended cancel window | 10 s minimum, per axis |
| **N-S5** | All safety timing lives in the STM32 firmware, never in the hub's Node event loop. The hub's job is to stop sending, not to guarantee when something stops | Architecture rule; verified by review, not measurement |
| **N-S6** | Moving equipment follows a documented risk-management process to ISO 14971. Assess ISO 7176-14 (wheelchair electrical systems) and EN 12182 for applicability to the dongle and record the conclusion | Risk file live from M0, reviewed at every gate |
| **N-S7** | Hardware end-stops and an independent stop circuit do not depend on software. Movement stops if the controller loses contact with the hub | Pass/fail, demonstrated on the bench rig |

### Security (N-SEC)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-SEC1** | Every user, device and channel authenticates | Pass/fail |
| **N-SEC2** | Per-device pairing keys, rotatable and revocable (F25) | Pass/fail |
| **N-SEC3** | TLS on every link, including inside the home | Pass/fail |
| **N-SEC4** | No default passwords anywhere in hub, controller or portal | Pass/fail |
| **N-SEC5** | Signed firmware and signed hub updates | Pass/fail |
| **N-SEC6** | Independent penetration test before any pilot outside the team, with no unresolved high or critical findings | M4→M5 gate |

### Accessibility (N-A)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-A1** | WCAG 2.2 AA as a floor for every user-facing surface | Pass/fail, automated plus manual |
| **N-A2** | Tested each release with real users of switch, scanning, eye-gaze and screen-reader setups | At least one user per input method in scope |
| **N-A3** | Every action reachable by more than one input method | Pass/fail per action |
| **N-A4** | Layouts tolerate text expansion and do not break on longer translated strings (supports F28) | 40% expansion, proposed |

### Performance (N-P)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-P1** | Movement responsiveness: input to command on the wire | 150 ms. Seating path only, never through a home-automation platform |
| **N-P2** | Home device responsiveness: input to acknowledged state change | 800 ms typical. Written for Zigbee and Z-Wave round trips through HA; split per backend once a direct IP backend ships, rather than holding every backend to the slowest path |
| **N-P3** | Feedback: input to visible or spoken confirmation | 300 ms. Confirmation that the request was accepted, distinct from the device having acted |

### Reliability (N-R)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-R1** | Hub availability is independent of any home-device platform: no planned or automatic update of that platform may interrupt seating control or local stop | Pass/fail |
| **N-R2** | The hub returns to full local function unaided after power loss, with no dependency on a third-party platform having started first | Target to be set in M1 |
| **N-R3** | Local control of every locally-reachable device keeps working with the internet down | Pass/fail, in the M1 gate task list |
| **N-R4** | No audit record is lost to a connectivity outage; records buffer locally and ship on reconnection (supports F24 and F26) | Pass/fail, with a stated local buffer capacity |

### Data protection (N-D)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-D1** | Usage and seating data are treated as health data under UK GDPR. Minimisation applies to the fields held in each record and to who may read them (F32), not to which actions are recorded: every action is recorded alike by decision, 18 October 2026 | Pass/fail |
| **N-D2** | Personal data stored in the UK or EU | Pass/fail |
| **N-D3** | The user can export and delete their data, subject to the retention classes of F26. C5 and C6 are deleted in full and immediately on request, and the user may set a shorter retention for C5. C1 and C2 are retained under their stated lawful basis, with the refusal explained in plain, accessible language naming the basis and the period. Pseudonymisation is never described to a user as erasure | Pass/fail |
| **N-D4** | Seating state exposed into a third-party platform is health-adjacent data outside Wheelberry's access control, and is assessed in the DPIA. If the DPIA objects, expose a coarse status rather than withdrawing read access | DPIA conclusion recorded |
| **N-D5** | Retention of C1 and C2 differentiates by retention tier — standard, minor, extended — where limitation periods differ. The store holds the tier and who set it, never a capacity assessment and never a date of birth. Tiers are reviewed with the clinical configuration, shortened only by a recorded decision, and the policy is reviewed whenever N-REG1's conclusion changes | Pass/fail, with the tier required before powered seating is enabled |

### Regulatory (N-REG)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-REG1** | Assess whether the seating controller is a medical device or accessory under UK MDR and EU MDR, and plan for it if so | M0 deliverable, before hardware design is fixed |
| **N-REG2** | Complete a DPIA covering health-grade data and vulnerable users, including N-D4, the six audit classes of F26, the per-deployment controller analysis, the capacity-differentiated retention of C1 and C2, the completeness of C5 as an accepted privacy risk, and the conclusion that pseudonymising the movement record is not anonymisation. Name which of its conclusions are provisional pending N-REG3 | M0 deliverable |
| **N-REG3** | A data-protection specialist reviews the record classes, lawful bases, retention tiers and read-access model, and the conclusions are recorded. The brief is the eight questions in audit-retention | Before any organisational deployment or sale (M4 scope) |

### Openness (N-O)

| ID | Requirement | Target |
| --- | --- | --- |
| **N-O1** | Open source code and hardware designs. Licence to decide — an open question in spec.md | Licence chosen by M0; public release at M5 |
| **N-O2** | Documented public APIs, sufficient for the developer persona to build an integration against | Pass/fail |

## Milestone gates, made decidable

Milestone names and gates are as drawn on the roadmap. The gate wording there is directional; what follows states what each gate means in practice, so that passing it is an observation rather than an opinion. **The M1 gate is provisionally adopted** (see below); the other four remain proposals.

| Gate | As drawn | Proposed measurable form |
| --- | --- | --- |
| M0 → M1 | Pilot users named, seating classification known | Pilot users named with their input methods recorded; N-REG1 conclusion written down with its reasoning; N-REG2 DPIA complete; risk file open (N-S6); licence chosen (N-O1); **and the M1 task list below agreed and written down** |
| M1 → M2/M3 | Pilot user runs daily tasks unaided | See below |
| M2 → M4 | Safety review signed off | Reviewer independent of the development team; reviews the risk file, the hazard analysis including the two accepted hazards (prompt injection, entrapment without sensing), P1–P9 as implemented, and N-S1, N-S2 and N-S7 **measured on hardware under load**, not calculated |
| M3 → M4 | *(none drawn)* | Proposed: the channel capability matrix is implemented and tested per channel, including that a refused action is refused with a legible reason (F2, F21) |
| M4 → M5 | Penetration test and accessibility audit passed | N-SEC6 with no unresolved high or critical findings; N-A1 with no blocking issues on the core journeys; N-A2 satisfied with real users across every input method in scope; **N-REG3 complete** |

**N-REG3 is also a condition on anything organisational inside M4**, not only on the M5 transition: no organisational pilot, procurement response or sale proceeds before the specialist review is recorded. That is where decision 4 placed it — the specialist comes later than this document recommended, so the point at which "later" has run out needs to be a gate rather than an intention.

### The M1 gate in full

**Status: provisionally adopted, 18 October 2026.** Richard adopted the thresholds below with one condition — **they are confirmed with the pilot user before M0 closes.** Until that conversation happens they are the working definition of the gate, not a negotiating position: work planned against M1 should assume them. What the pilot user may reasonably change is the task list, the number of attempts and the number of days, because those describe their life. What is not theirs to loosen is the meaning of *unaided* or the requirement that they score it themselves, since those are what make the gate a measurement.

Confirming it means: the pilot user and their OT read this section, agree or amend the task list and the numbers, and the result is written down and dated. If the pilot user wants a weaker threshold, that is their call and it is recorded with their reason. If no pilot user is named in time, the gate stays provisional and M0 has not closed — M0's own gate requires the task list agreed and written down.

"Pilot user runs daily tasks unaided" is the gate that decides whether the product works, so it needs to be unambiguous before M1 starts rather than interpreted after it ends.

**The task list is agreed in M0, with the pilot user and their OT, and written down before any M1 code.** That ordering is the point: a task list written after the build measures what was built.

Each task states its start state, the user's own input method, and what counts as done. Eight to twelve tasks, covering at minimum: turning a light on and off, setting heating, running a multi-device routine, checking a device's state, and recovering from a device being unavailable.

Thresholds, as adopted:

- Every task completed **unaided** on at least 9 of 10 attempts.
- Attempts spread over at least 10 separate days of ordinary use, not a single session.
- At least 2 of those days with the internet disconnected (N-R3), with the same threshold.
- **Unaided** means no other person touches any control, and no member of the team is present or on a call.
- Judged by the pilot user's own report as the primary measure, countersigned by their OT. A Wheelberry engineer may observe but does not score.
- Every failure is logged with its cause, and causes are triaged before the gate is called either way.
- No task may depend on a channel outside M1 scope.
- WCAG 2.2 AA checked on the journeys the task list covers (N-A1).

One pilot user is a sample of one, and the gate is a judgement about this user's daily life rather than a statistical claim. That is the right call at M1 — M5 is where reliability and task success are measured across several homes — but it should be stated rather than implied, because "9 of 10" reads like statistics and is not.

## Traceability

Where each requirement first has to hold. Later milestones extend many of them; this records the first milestone that cannot ship without it.

| Milestone | Functional | Non-functional |
| --- | --- | --- |
| **M0** Foundations | F26 (policy written), F27, F29 (controller analysis) | N-S6, N-REG1, N-REG2, N-O1 (licence) |
| **M1** Local MVP | F1, F2, F3, F4 (non-movement), F5, F6, F7, F11, F14, F19, F20, F21, F22, F24, F26 (class, expiry and tier stamped at write time), F28, F30, F31 (own-action completeness disclosed), F32 | N-SEC1, N-SEC3, N-SEC4, N-A1, N-A2, N-A3, N-A4, N-P2, N-P3, N-R1, N-R2, N-R3, N-R4, N-D1, N-D4, N-O2 |
| **M2** Seating via the dongle | F4 (movement), F8, F9, F10 (safety and local stop), F15, F16, F17, F23, F25 (pairing and rotation), F31 (safety record disclosed before seating is enabled, and the record view) | N-S1, N-S2, N-S3, N-S4, N-S5, N-S7, N-SEC2, N-SEC5, N-P1, N-D5 |
| **M3** Voice and AI | F10 (convenience stop), F18 | — |
| **M4** Phone app, remote access and portal | F12, F13, F25 (decommission and transfer at fleet scale), F29 (erasure requests routed) | N-SEC6, N-D2, N-D3, N-REG3 |
| **M5** Multi-home pilot | — | N-O1 (public release) |

Two things this matrix makes visible that the prose did not:

- **M1 carries almost all of the non-functional load.** Sixteen of the thirty-four non-functional requirements must hold before the first pilot user does anything, which is a larger M1 than "lights and heating in one home" suggests. The retention work added four functional requirements to M1 as well, all of them properties of the audit log that cannot be retrofitted once records exist.
- **M3 adds no non-functional requirements and no gate of its own.** Voice and AI arrive carrying only F18 and the convenience stop, which is a thin gate for the channel class most able to surprise a user.

## Reconciling spec.md

**Applied in full on 18 October 2026.** The list is kept as the record of what changed and why, since "the spec says X" questions are easier to answer against a list than against a diff. One row remains open: the roadmap image, below, which cannot be fixed by editing text.

Three changes were made beyond the list, all of the same kind — the same contradiction in a place the list had not looked:

- **Principle 3** claimed a new device "works everywhere at once", which is the channel-equivalence claim the capability matrix denies. Now says it *appears* everywhere, with one safety engine and per-channel command limits.
- **The channels table** gained a note that the capability matrix is authoritative over it, so the two tables cannot drift apart again.
- **Open questions** gained the six questions the review opened, including the three hardware questions, which were recorded only in the decision records and so were invisible to anyone reading the spec for what is undecided.

### Must change: contradicted by a decision

| Location | Current text | Change |
| --- | --- | --- |
| Scope, *Home control* row | "Through Home Assistant, which already speaks Zigbee…" | Through a home-device backend; Home Assistant first, direct IP APIs case by case (F22, HA decision 3) |
| Scope, *Open source platforms* row | "also shows up inside it as an integration" | Add: read and non-movement control only (F21) |
| Existing work, second bullet | "voice should only call preset positions… Bedberry's angle sensing shows how to make presets that stop at a measured position" | Wrong since movement-semantics decision 1. Presets are timed and open-loop; see F15. The Alexa skill's "tilt up 5 seconds" needs the run-time cap, opt-in, announcement and audit, not a rewrite to measured positions |
| F2 | "with the same result and the same safety checks" | Replace with F2 above |
| F4, F7, F8, F9, F10, F11, F14 | — | Replace with the text in this register |
| Non-functional table | Unnumbered, eight rows | Replace with the N-series above |
| Architecture | "**Key decision: build on Home Assistant, not beside it.** … The hub can run as a Home Assistant add-on or on its own small computer." | Replace with: Home Assistant is a backend Wheelberry depends on, not the platform it runs on. Standalone only; no add-on (HA decisions 1–3) |
| Architecture, channels prose | "AI assistants talk to the hub directly" | Unchanged, but add the capability matrix reference |
| Technology table, *Hub* row | "Raspberry Pi 5 or Home Assistant add-on" | Drop the add-on |
| Technology table, *AI assistants* row | "under the user's permissions" | A constrained subset of the user's permissions (F18, A1–A6) |
| Scope, *AI assistants* channel row | "see and control devices within the same permissions" | Same change |
| Open questions | "Should Wheelberry sit on top of Home Assistant (recommended) or stand alone?" | Answered 18 October 2026; tick it and link the decision record |

### Should change: inconsistent or incomplete

| Location | Issue | Change |
| --- | --- | --- |
| Scope tables | "MVP / Second release / Release 3 / Release 4" | Unify on M1–M4 |
| Scope, channels | Siri listed; architecture diagram says "Alexa skill, Google Home later" and omits Siri | Decide which is current and make both agree |
| Out of scope | "Building our own home-automation protocols or radios" | Correct as written, but add that the line is the radio, not the integration — direct IP device APIs are in scope case by case |
| Risk table | "Home Assistant is hard for non-technical installers → offer a preconfigured hub" | Now the only one-box story, so it is the supported path for that user rather than a mitigation |
| Risk table | Two accepted hazards are recorded only in the decision records | Add prompt injection against an assistant with movement access, and entrapment undetectable without sensing |
| Existing work | `user@example.com` named in one config file | It is in both `wheelchair.json5` and `blanket.json5`, and in git history |
| Existing work, monorepo row | "reuse Alexa account linking, portal shell" | Account linking is coupled to MongoDB user and token models; the cloud plan specifies Postgres |

### Needs a new image

The roadmap caption for **M3** reads "Same permissions and safety on every channel." Same *safety engine*, yes; same *permissions*, no — that is precisely what the capability matrix denies. `images/roadmap.png` needs regenerating with wording like "One safety engine, per-channel capability limits". The M1 gate caption could also carry the task-list threshold.

## Still open

Carried forward rather than answered here.

- ~~**Audit retention periods and the erasure answer.**~~ Decided 18 October 2026 and applied above; see [audit-retention.md](audit-retention.md) for the six record classes, the lawful basis per class, the retention periods and the four decisions. What remains open from it: **the eight specialist questions**, deferred by decision 4 to before the first organisational sale (N-REG3), and whether a user may shorten their own C5 retention, which is my reading of decision 1 rather than an instruction.
- **Which wheelchair control systems beyond LiNX**, and the other open questions in spec.md, which this pass does not touch.
- **N-R2's recovery target**, to be set in M1.
- **Whether the preconfigured hub runs HA on the same box**, an M1 packaging decision whose criterion is N-S2 measured in that configuration.
- **The three hardware questions** from movement-semantics: motor current or stall detection, per-axis travel safety, and per-user LiNX range programming.
