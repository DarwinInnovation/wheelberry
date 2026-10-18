# Movement semantics: F4, F9 and F10 resolved

Second revision, 17 October 2026. The first revision proposed options; Richard decided all six questions the same day, and this revision implements those decisions rather than re-arguing them. First workstream out of [spec-review.md](spec-review.md).

The original problem: F4 wants routines that recline a seat on a schedule, F9 wants hold-to-run with stop on release, and F10 wants stop on every channel including the cloud. Taken literally the three cannot coexist. What follows separates movement by **attendance**, splits "stop" into three named things, and derives the rules that make the decisions below implementable.

## Decisions taken

| # | Question | Decision |
| --- | --- | --- |
| 1 | Which seating axes have measured position in M2? | **None.** Position sensing deferred to a distant milestone |
| 2 | May a schedule or routine move a person with nobody present? | **Yes, under strict preconditions** |
| 3 | Fund a local (on-hub) voice path? | **Decide later** |
| 4 | May an AI assistant over MCP move a person? | **Yes**, movement allowed |
| 5 | May a carer who is physically present operate the user's seating? | **Yes, at the user's discretion** |
| 6 | Local stop budget of 150 ms? | **Adopted provisionally** |

Two of these reverse recommendations in the first revision, and one of them removes the hardware the first revision assumed. The rest of this document is written to the decisions as taken.

## What the decisions change

The first revision's governing rule was *a channel may command movement only if it can also deliver a stop within the local stop budget*. Decisions 2 and 4 retire it: a schedule has no channel and an assistant has no reflexes, yet both may now move a person. Decision 1 removes the other load-bearing assumption, because an attended preset was defined as a move to a **measured** position and there is nothing to measure with.

So the organising property is not which channel sent the command. It is whether anyone is there.

## The governing rule

> Every movement of a person must have, for its whole duration, something able to stop it: either a present human with a stop they can actually reach, or — when nobody is present — an envelope narrow enough that the move is acceptable **unstopped**.

Put less formally: if nothing can stop it, it has to be safe when nothing does. That is the price of permitting unattended movement, and it is payable, but it has to be paid per axis rather than once for the product.

Two corollaries follow immediately from decision 1, and they do more work than anything else in this document.

**C-1. Without position sensing, the only bound the hub can enforce is time.** A clinician cannot say "tilt no further than 20°" and have Wheelberry honour it, because Wheelberry cannot tell where 20° is. The hub can enforce *how long* an output is energised and nothing else. The only enforceable **position** bound is the chair's own configured range, programmed into the LiNX system at installation and enforced by the chair. Narrowing an unattended envelope therefore means reprogramming the chair, not adding hub logic — an installer task with a lead time, not a settings toggle.

**C-2. An open-loop move must be safe at every point of its travel, not merely at its endpoint.** The hub can lose power, the watchdog can fire, a stop can land mid-run. Any of these leaves the axis somewhere arbitrary within its configured range. A move is only permissible if every position it passes through is a position the user may safely be left in.

Together these say the clinical question for each axis is not "is the target safe" but **"is this axis's entire configured travel safe to occupy, unattended, indefinitely?"** Where the answer is no, the remedy is to narrow the chair's configured range at install, or not to permit unattended movement on that axis.

## Movement modes

| Mode | Attendance | What bounds it | Status |
| --- | --- | --- | --- |
| **M-HOLD** Hold-to-run | User holds a control throughout | Release, command timeout, connection loss, chair range limits, end-stops | Existing and tested; unchanged |
| **M-PRESET** Attended bounded run | User present, proves presence, does not keep holding | Run-time cap, presence heartbeat, any stop, chair range limits, end-stops | New in M2, open-loop |
| **M-UNATTENDED** Unattended bounded run | Nobody present | Run-time cap, chair range limits, end-stops, and the envelope only | New in M2, under the preconditions below |
| **M-TARGET** Measured move | Either | Reaching the **measured** position, plus everything above | Deferred with position sensing |

**M-HOLD** needs no change. The hub repeats the command at roughly 100 ms and the firmware releases every output if no command arrives within the watchdog window, so release, crash, network loss and hub death all converge on the same safe state. It remains the preferred mode for anyone who can use it.

**M-PRESET** is a *timed* run in this milestone, not a move to a position. The first revision said a timed preset was not acceptable; with decision 1 that position is untenable, because a timed run is the only kind of preset available and hold-to-run alone excludes the users who cannot hold anything. What makes a timed run acceptable is C-2 plus a present human:

- A hard **run-time cap per axis**, set with the clinician, enforced by the hub and backstopped by the firmware watchdog.
- A **presence heartbeat** from the controlling channel for the duration. Losing it stops the move, by the same path as releasing a hold.
- Stop reachable by the user's own input method for the whole move, with no confirmation step.
- Clinician configuration decides, per user and per axis, whether presets exist at all and what their durations are.
- The named position is **nominal**, so the UI must not claim the seat is at it. "Tilt back" is honest; "Tilt to 20°" is not, until M-TARGET.

**M-UNATTENDED** is permitted per decision 2. Preconditions, all required:

- **P1** Clinician opt-in, per user and per axis. Off by default.
- **P2** The axis's full configured travel passes the C-2 test, recorded by name in the risk file with who judged it.
- **P3** One axis at a time. No composite unattended moves.
- **P4** A run-time cap, and a total daily movement budget per axis so a stuck routine cannot cycle.
- **P5** An audible and visible pre-announcement with a cancel window, on every channel the user can perceive, defaulting to at least 10 seconds.
- **P6** No unattended movement while any attended session holds a lease, and none within a cool-down of a manual stop.
- **P7** Entrapment cannot be detected without sensing, so unattended movement is permitted only on axes where the clinician has accepted that residual risk explicitly. See the open hardware question about stall and current sensing.
- **P8** Every unattended move is audited with its trigger, its envelope, and whether the cancel window elapsed unanswered.
- **P9** No actor outside Wheelberry may command movement of a person. A third-party platform automation is refused, with a reason that platform can report. Reopening this for a given platform requires a clinician opt-in **distinct from** the opt-in for Wheelberry's own routines and revocable by the user from any channel, movement exposed as preset requests and read-only status rather than settable positions, and the platform's inability to identify the human behind a session recorded as an accepted hazard. Added by [home-assistant-decision.md](home-assistant-decision.md), which also notes that P4's daily budget and P5's cancel window would be the primary controls in that event rather than belt-and-braces.

F4's "Bedtime" therefore works as written: lights, heating and a recline, on a schedule. The recline announces itself first and is cancellable.

## Three kinds of stop

| Name | Guarantee | Depends on | Available from |
| --- | --- | --- | --- |
| **Safety stop** | Movement ceases regardless of the state of any software | Hardware only: the chair's own stop and end-stops, the independent stop circuit, the firmware watchdog releasing outputs when commands stop arriving | Physical controls, always |
| **Local stop** | Outputs released within N-S2 | Hub and local network, not the cloud | Any local channel: PWA or phone app on the home network, the chair's own switches via the DLX-IN200, a hardware button on the hub |
| **Convenience stop** | Best effort, no latency guarantee | Cloud round trip, voice platform, third-party service | Cloud channels: Alexa, Siri, remote portal |

Rules:

- A convenience stop must never be presented to a user or clinician as a safety feature. It exists so that "stop" does something sensible wherever it is said.
- A local stop bypasses permissions, queues, rate limits and policy evaluation. Anyone who can reach the hub may stop movement, including a carer with no permission to cause it.
- The safety stop is the only one that satisfies the safety NFR, and it is entirely outside software. The spec should say so rather than imply it.
- Every movement session records its **stop authority**: the present human for M-HOLD and M-PRESET, and the envelope for M-UNATTENDED. A session with neither must not start.

## Channel capability matrix

Capability classes:

- **C1 Read** — device and hub state, history.
- **C2 Non-movement control** — lights, plugs, heating, TV, scenes made only of these.
- **C3 Movement of a person** — seat tilt, recline, leg rests, beds, hoists.
- **C4 Safety and system configuration** — clinician limits, presets, permissions, pairing, firmware.

"Local" means on the home network with a direct path to the hub. "Cloud" means routed through the Wheelberry cloud or a third-party voice platform.

| Channel | C1 | C2 | C3 M-HOLD | C3 M-PRESET | C3 M-UNATTENDED | C4 | Stop offered |
| --- | --- | --- | --- | --- | --- | --- | --- |
| User PWA, local | Yes | Yes | Yes | Yes | n/a | Own profile | Local |
| User PWA, via cloud tunnel | Yes | Yes | No | No | n/a | Own profile | Convenience |
| Phone app, local | Yes | Yes | Yes | Yes | n/a | Own profile | Local |
| Phone app, away | Yes | Yes | No | No | n/a | Own profile | Convenience |
| Chair's own switches (DLX-IN200) | n/a | Yes | Yes | Yes | n/a | No | Local, and preferred |
| Voice via Alexa or Siri cloud | Yes | Yes | No | Only with a reachable local stop | Within envelope | No | Convenience |
| Voice, on-hub path | Yes | Yes | No | Yes | n/a | No | Local |
| AI assistant over MCP | Yes | Allow-list | No | Only with a reachable local stop | Within envelope | Never | Convenience |
| Carer, local presence | Yes | If permitted | If permitted | If permitted | n/a | No | Local |
| Carer, remote portal | If permitted | If permitted | No | No | No | No | Convenience |
| Clinician portal | Yes | No | No | No | No | Limits, presets, opt-ins | n/a |
| Installer, service mode | Yes | Yes | Bench only, no occupant | Bench only | No | Pairing, firmware, diagnostics | Local |
| Organisation admin | Audit only | No | No | No | No | Users and roles | n/a |
| Routine or schedule engine | n/a | Yes | No | If the user accepts the prompt | Within envelope | No | n/a |
| Home Assistant automation, via the Wheelberry integration | Yes | Yes | No | No | No, per P9 | No | n/a |

The "only with a reachable local stop" cells are the honest form of the attendance rule. A cloud channel can start an attended preset when the user has some *other* local means of stopping it — their chair switches, the PWA, a carer in the room. If they do not, the same command is unattended-class and must meet the envelope instead. The channel does not decide this; the user's available stop does, and the hub knows which local channels are live.

The on-hub voice row is drawn in because the design should not have to change when it arrives. Decision 3 defers funding it, not designing for it.

## AI over MCP

Decision 4 permits assistants to move a person, reversing the first revision's recommendation. Implementing that honestly means naming what makes it different from a button press: the assistant is not present, cannot perceive the user, and can be argued into an action by whatever text reaches its context. It is therefore treated as an **unattended-class actor** unless a present human holds the stop, and it carries conditions of its own:

- **A1** Named presets only. An assistant never issues raw axis or direction commands.
- **A2** Clinician opt-in per axis, separate from the human opt-in, and revocable by the user at any time from any channel without an assistant in the loop.
- **A3** Every assistant-initiated move takes the full unattended envelope, P1 to P8, including the announcement and cancel window, unless a present human holds the stop.
- **A4** Rate limited and non-repeating: a refused or cancelled move is not retried without fresh human intent.
- **A5** The audit record captures the requesting assistant, the conversation or tool call that produced it, and the user utterance behind it. "Who decided to tilt the seat" must have an answer in the log.
- **A6** Never during another actor's lease, and never as part of a composite action.

Residual risk, stated once and then carried in the risk file rather than relitigated here: prompt injection against an assistant with C3 access is a route to moving a person without their intent, which A1 to A6 reduce but do not eliminate. It belongs in the ISO 14971 analysis as an accepted hazard with these controls, so that the independent safety review can see it rather than discover it.

This also means the spec's current line — that the MCP server acts "within the same permissions" as the user — is no longer accurate. Its permissions are a constrained subset, and the subset is the point.

## Voice

Decision 3 defers an on-hub voice path, so for this milestone speech means Alexa or Siri, over the cloud. Three consequences worth stating plainly:

- Cloud voice cannot provide the stop for a move it starts. A spoken "stop" is a convenience stop.
- A user who can reach some other local stop can therefore use cloud voice for attended presets today.
- A user for whom speech is the **only** reliable input has no local stop, so every spoken movement command is unattended-class and is confined to the envelope. That is a usable answer for them rather than an exclusion, but it is a narrower one, and it is the strongest argument for funding the on-hub path when decision 3 is revisited.

The existing Alexa skill's "tilt up 5 seconds" is closer to M-PRESET than it looked in the first revision — it is a timed open-loop run. What it lacks is the run-time cap, the clinician opt-in, the announcement and the audit. It should be brought under those rules rather than rewritten.

## Arbitration during movement

- Movement is **exclusive per axis**. One actor holds a movement lease; a competing command is rejected with a reason, never queued. Queued movement is a bug waiting to hurt someone.
- **Stop is never exclusive.** Anyone who can reach the hub may stop, lease or no lease, permission or no permission.
- A carer cannot preempt a user's movement session, only stop it. Taking over requires the user's session to end first.
- **Unattended always yields.** Any human command, on any channel, cancels an in-progress unattended move or its cancel window. Unattended movement never preempts anything.
- A clinician's limit or opt-in change takes effect at the start of the next session, never mid-move.
- Loss of the controlling channel ends the lease and stops the movement. It does not transfer.

## Timing budget

The spec uses 300 ms for two unrelated quantities. Proposed split as numbered non-functional requirements:

| ID | Quantity | Target | Notes |
| --- | --- | --- | --- |
| N-S1 | Watchdog release: last command received to outputs released | 300 ms, resend at 100 ms | Already implemented and unit tested in the output module firmware. Do not change this number to match anything else |
| N-S2 | Local stop: user action to outputs released | **150 ms worst case, provisional** | Adopted per decision 6. Must hold while the hub is under load |
| N-S3 | Run-time cap per axis | Per axis, set with the clinician | The only enforceable bound on an open-loop move |
| N-S4 | Unattended cancel window | 10 s minimum, per axis | Announcement to movement start |
| N-P1 | Movement responsiveness: input to command on the wire | 150 ms | Seating path only, never through Home Assistant |
| N-P2 | Home device responsiveness: input to acknowledged state change | 800 ms typical | Zigbee and Z-Wave round trips through HA will not fit 300 ms |
| N-P3 | Feedback: input to visible or spoken confirmation | 300 ms | Confirmation that the request was accepted, distinct from the device having acted |

"Provisional" needs an exit, or it becomes permanent by neglect. Proposed: N-S2 is confirmed or revised by the M2 hazard analysis, measured end to end on real hardware under load rather than calculated, and may be tightened on that evidence but not loosened without the independent safety review seeing it.

Architecture rule to state alongside these: **all safety timing lives in the STM32 firmware.** The hub's Node event loop is not a real-time environment and garbage collection can stall it for longer than N-S2 allows. The hub's job is to stop sending, not to guarantee when something stops.

## Proposed requirement wording

Replacement text for the spec:

- **F4** Support scenes and routines ("Bedtime": recline seat, dim lights, set heating), runnable by one action and on a schedule. A routine that moves a person runs as an unattended move and must satisfy F11-new.
- **F9** Require hold-to-run, an attended bounded run, or a compliant unattended bounded run for every movement of a person, configurable per user and per axis. Hold-to-run stops on release, timeout or loss of connection. An attended run stops on its run-time cap, on loss of the presence heartbeat, or on any stop. No movement of a person may run without a recorded stop authority.
- **F10** Provide a safety stop independent of all software, a local stop from every local channel that bypasses permissions and queues, and a best-effort convenience stop from cloud channels. Convenience stop is never presented as a safety feature.
- **F15, new** Where an axis has no measured position, bound its movement by time and by the chair's own configured range, treat every position in that range as a position the user may be left in, and never present a nominal preset as a measured one.
- **F16, new** Provide a service mode for installers that permits movement only with no occupant, is time-limited, requires physical presence at the hub, and is audited.
- **F17, new** Permit unattended movement only under clinician opt-in per user and per axis, one axis at a time, within a run-time cap and daily budget, after a cancellable announcement, and never while an attended session is active. Any human command cancels it.
- **F18, new** Restrict AI assistants to named presets under their own clinician opt-in, treat assistant-initiated movement as unattended unless a present human holds the stop, and record the requesting assistant and originating request in the audit log.

## Still open, not blocking

Three questions this document cannot answer from the repository. None of them stops M2 architecture starting; all three change the risk file.

1. **Does the dongle or LiNX path expose motor current or stall detection?** With no position sensing, current is the only available signal that something is trapped. If it exists, P7 gets a real control instead of an accepted risk, and it is cheap to add now.
2. **Per axis, is the full configured travel safe to occupy unattended?** The C-2 test. A clinician and an installer answer this together, once per user, and it decides which axes get decision 2 at all.
3. **Can LiNX range limits be programmed per user at installation?** If yes, the unattended envelope is narrowable where question 2 fails. If no, unattended movement is all-or-nothing per axis.
