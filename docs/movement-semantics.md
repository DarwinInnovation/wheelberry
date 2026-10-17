# Movement semantics: proposed resolution of F4, F9 and F10

Draft for Richard, 17 October 2026. First workstream out of [spec-review.md](spec-review.md). Nothing here is decided; the questions at the end are the ones that need answers before M2 architecture can start.

The problem: F4 wants routines that recline a seat on a schedule, F9 wants hold-to-run with stop on release, and F10 wants stop on every channel including the cloud. Taken literally, the three cannot coexist. The proposal below separates movement into three named modes, splits "stop" into three named things, and derives a single rule that decides which channels may move a person.

## The one rule everything else follows from

> A channel may command movement only if it can also deliver a stop within the local stop budget.

This single rule resolves the F10 contradiction, the AI and voice question, and the remote-carer question at once, without having to argue channel by channel. Cloud-routed channels fail the rule, so they never start movement, so there is nothing to stop from the cloud. Local channels pass it, and get both abilities together.

## Three movement modes

| Mode | What the user does | What stops it | Where it comes from |
| --- | --- | --- | --- |
| **M-HOLD** Hold-to-run | Holds a control for as long as the seat should move | Release, command timeout, connection loss, clinician range limit, hardware end-stop | The existing, tested model in `wheelberry_dongle_http_test_site` and the output module firmware |
| **M-PRESET** Attended preset move | Starts a named move ("sit up"), stays present, does not have to keep holding | Reaching the measured target position, loss of the presence heartbeat, any stop, range limit, end-stop, maximum run time | Bedberry's tilt sensor and angle presets |
| **M-UNATTENDED** Unattended move | Nothing; a schedule or routine triggers it | Target, stop, limit, end-stop | Nowhere yet. Recommended **prohibited** for now |

**M-HOLD** needs no change. Hub repeats the command at roughly 100 ms, firmware releases every output if no command arrives within the watchdog window, so release, crash, network loss and hub death all converge on the same safe state.

**M-PRESET** is the new mode, and it is the one worth getting right, because holding a switch for twenty seconds is exactly what many users cannot do. The distinction from M-HOLD is that the user proves presence rather than intent-per-instant:

- The move targets a **measured** position, not a duration. No sensing on an axis means no presets on that axis; a timed "tilt for five seconds" preset is not acceptable (this is what the current Alexa skill does, and why it conflicts with F9).
- The controlling channel sends a **presence heartbeat** for the duration; losing it stops the move, same path as releasing a hold.
- Stop is on screen (or otherwise reachable by the user's input method) for the whole move, and no further confirmation is needed to use it.
- A **maximum run time** per axis bounds any sensing fault. If the target is not reached in time, stop and report a fault rather than keep going.
- Clinician configuration decides, per user and per axis, whether presets are allowed at all and which targets exist.

**M-UNATTENDED** is the F4 question. Two options:

- **Option A, recommended: prohibit it.** Routines and schedules may contain non-movement capabilities only. A routine that includes movement becomes a *staged* action: at the trigger time the user gets a prompt on their channels ("Bedtime: recline seat?"), and the lights and heating part runs as scheduled. Accepting the prompt runs the movement as M-PRESET. "Bedtime" from F4 still exists and still feels like one action, it just will not move a person while nobody is paying attention.
- **Option B: permit it under strict preconditions.** Clinician opt-in per user per axis, position sensing plus end-stops, an audible pre-announcement with a cancel window, a restricted safe sub-range (narrower than the attended range), one axis at a time, and its own entry in the risk file. This is a considerably larger safety argument for a feature nobody has asked for yet.

Recommendation: adopt Option A for M2 and record Option B as a possible later addition behind its own safety review. If Option A is adopted, F4's example in the spec should be reworded so it no longer promises unattended reclining.

## Three kinds of stop

| Name | Guarantee | Depends on | Available from |
| --- | --- | --- | --- |
| **Safety stop** | Movement ceases regardless of the state of any software | Hardware only: the chair's own stop and end-stops, the independent stop circuit, and the firmware watchdog releasing outputs when commands stop arriving | Physical controls, always |
| **Local stop** | Outputs released within the local stop budget | Hub and local network, not the cloud | Any local channel: PWA on the home network, phone app on the home network, the chair's own switches via the DLX-IN200, a hardware button on the hub |
| **Convenience stop** | Best effort, no latency guarantee | Cloud round trip, voice platform, third-party service | Cloud channels: Alexa, Siri via cloud, remote portal |

Three rules follow:

- A convenience stop must never be presented to a user or a clinician as a safety feature. It is a nicety, and it exists mostly so that "stop" does something sensible wherever it is said.
- A local stop must bypass permissions, queues, rate limits and policy evaluation. Anyone who can reach the hub can stop movement, including a carer who has no permission to cause it.
- The safety stop is the only one that satisfies the safety NFR, and it is entirely outside software. This should be stated in the spec rather than implied.

## Channel capability matrix

Capability classes, so the matrix stays short:

- **C1 Read** — device and hub state, history.
- **C2 Non-movement control** — lights, plugs, heating, TV, scenes made only of these.
- **C3 Movement of a person** — seat tilt, recline, leg rests, beds, hoists.
- **C4 Safety and system configuration** — clinician limits, presets, permissions, pairing, firmware.

"Local" means on the home network with a direct path to the hub. "Cloud" means routed through the Wheelberry cloud or a third-party voice platform.

| Channel | C1 Read | C2 Non-movement | C3 M-HOLD | C3 M-PRESET | C4 Config | Stop offered |
| --- | --- | --- | --- | --- | --- | --- |
| User PWA, local | Yes | Yes | Yes | Yes | Own profile only | Local |
| User PWA, via cloud tunnel | Yes | Yes | No | No | Own profile only | Convenience |
| Phone app, local | Yes | Yes | Yes | Yes | Own profile only | Local |
| Phone app, away | Yes | Yes | No | No | Own profile only | Convenience |
| Chair's own switches (DLX-IN200) | n/a | Yes | Yes | Yes | No | Local, and the preferred one |
| Voice, local path (see below) | Yes | Yes | No | Yes, if sensed | No | Local |
| Voice via Alexa or Siri cloud | Yes | Yes | No | No | No | Convenience |
| AI assistant over MCP | Yes | Yes, per-capability allow-list | Never | Never | Never | Convenience |
| Carer, local presence | Yes | If permitted | If permitted | If permitted | No | Local |
| Carer, remote portal | If permitted | If permitted | No | No | No | Convenience |
| Clinician portal | Yes | No | No | No | Limits and presets | n/a |
| Installer, service mode | Yes | Yes | Bench only, no occupant | Bench only | Pairing, firmware, diagnostics | Local |
| Organisation admin | Audit only | No | No | No | Users and roles | n/a |
| Routine or schedule engine | n/a | Yes | No | Staged only (Option A) | No | n/a |

Two entries deserve explaining.

**AI over MCP is never allowed to move a person**, in any mode, even with permission, and this is a deliberate asymmetry rather than an oversight. An assistant can be talked into things by whatever text lands in its context, and the audit question "who decided to tilt the seat" has no satisfying answer. Reading state and controlling lights is genuinely useful and carries no such risk. This also means the MCP server's permissions are *not* simply the user's permissions, which is a change to how the spec describes it today.

**Local voice is the interesting case.** The spec's existing note says voice should only call presets once limits exist, while the matrix above denies cloud voice any movement at all. These can both hold if voice is split by transport, not by modality: speech recognition that runs on or near the hub meets the local stop budget and can therefore drive M-PRESET, whereas a round trip through Amazon cannot. This matters because for some users speech is the only reliable input, and a blanket ban on voice movement would exclude exactly the people Wheelberry exists for. Suggest treating a local voice path as an M3 deliverable in its own right rather than assuming Alexa covers voice.

## Timing budget

The spec currently uses 300 ms for two unrelated things, which will cause confusion in review. Proposed split, as numbered non-functional requirements:

| Proposed ID | Quantity | Proposed target | Notes |
| --- | --- | --- | --- |
| N-S1 | Watchdog release: last command received to outputs released | 300 ms, resend at 100 ms | Already implemented and unit tested in the output module firmware. Do not change this number to match anything else |
| N-S2 | Local stop: user action to outputs released | 150 ms worst case | Must hold while the hub is under load |
| N-S3 | Preset overrun guard: maximum run time per axis | Per axis, set with the clinician | Backstop for a sensing fault |
| N-P1 | Movement responsiveness: input to command on the wire | 150 ms | Seating path only, never through Home Assistant |
| N-P2 | Home device responsiveness: input to acknowledged state change | 800 ms typical | Zigbee or Z-Wave round trips through HA will not fit 300 ms; holding them to it sets up a target that is missed by design |
| N-P3 | Feedback: input to visible or spoken confirmation | 300 ms | Confirmation that the request was accepted, distinct from the device having acted |

Architecture rule to state alongside these: **all safety timing lives in the STM32 firmware.** The hub's Node event loop is not a real-time environment and garbage collection can stall it for longer than N-S2 allows. The hub's job is to stop sending, not to guarantee when something stops.

## Arbitration during movement

The gaps list in the review flagged that nothing says who wins. For movement specifically, proposed rules:

- Movement is **exclusive per axis**. One actor holds a movement lease; a competing command is rejected with a clear reason, never queued. Queued movement is a bug waiting to hurt someone.
- **Stop is never exclusive.** Anyone who can reach the hub may stop, lease or no lease, permission or no permission.
- A carer **cannot preempt** a user's movement session, only stop it. Taking over requires the user's session to end first.
- A clinician's limit change takes effect **at the start of the next session**, never mid-move. Tightening a limit under a moving seat is its own hazard.
- Loss of the controlling channel ends the lease and stops the movement. It does not transfer.

## Proposed requirement wording

Offered as replacement text for the spec, to be argued with rather than accepted:

- **F4** Support scenes and routines ("Bedtime": dim lights, set heating), runnable by one action and on a schedule. A routine that includes movement of a person is staged, not automatic: the non-movement parts run on the schedule, and the movement part waits for the user to start it as an attended preset.
- **F9** Require either hold-to-run or an attended preset move for every movement of a person, configurable per user and per axis. Hold-to-run stops on release, timeout or loss of connection. An attended preset moves to a measured position and stops on reaching it, on loss of the presence heartbeat, on stop, or on exceeding its maximum run time. Movement for a requested duration is not permitted.
- **F10** Provide a safety stop that is independent of all software, a local stop from every local channel that bypasses permissions and queues, and a best-effort convenience stop from cloud channels. A channel may command movement only if it can deliver a local stop within N-S2. Convenience stop is never presented as a safety feature.
- **F15, new** Represent movement capabilities only where the position is measured or the axis has hardware end-stops, and expose the measured position to every channel.
- **F16, new** Provide a service mode for installers that permits movement only with no occupant, is time-limited, requires physical presence at the hub, and is recorded in the audit log.

## Questions for Richard

1. **Unattended movement: Option A or Option B?** Recommendation is A, prohibit it, and reword F4 accordingly.
2. **Is a local voice path worth funding** as its own piece of work, given that cloud voice cannot move a seat under the rule above? This decides whether speech-only users can operate seating at all.
3. **Is the AI-never-moves asymmetry acceptable**, or do you want a route by which an assistant can trigger a preset that the user then confirms locally?
4. **Does a carer with local presence get movement rights** at the user's discretion, as the matrix assumes, or never?
5. **Which axes will actually have position sensing** on the LiNX dongle path? Presets depend entirely on this, and if the answer is none in M2, M-PRESET has no hardware and the mode list collapses back to hold-to-run only.
6. **Is 150 ms for N-S2 the right number**, or should it be derived from the risk assessment rather than chosen now?
