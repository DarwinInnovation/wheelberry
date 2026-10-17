# Home Assistant: backend, not platform

Draft for decision, 17 October 2026. Second workstream out of [spec-review.md](spec-review.md), following [movement-semantics.md](movement-semantics.md). Nothing here is decided; the five questions at the end are Richard's.

The spec contradicts itself on Home Assistant. The architecture section states *"Key decision: build on Home Assistant, not beside it"*, while the open questions still ask *"Should Wheelberry sit on top of Home Assistant (recommended) or stand alone?"*. This document closes the contradiction by separating a question that is genuinely settled from three that are not.

## The question is four questions

"Sit on top of HA or stand alone" conflates four decisions with different answers.

| # | The actual question | Status |
| --- | --- | --- |
| Q1 | Does Wheelberry reach lights, heating and blinds **through** Home Assistant rather than implementing Zigbee, Z-Wave and Matter itself? | **Settled.** Yes, and it should not be reopened |
| Q2 | Does the Wheelberry hub **run inside** Home Assistant as an add-on, or run as its own thing that talks to HA? | **Open.** This is the real question |
| Q3 | May the **safety path** — seating, stop, the dongle — traverse Home Assistant? | **Open.** Recommended answer: never |
| Q4 | Does Wheelberry **appear inside** Home Assistant as an integration, so HA sees Wheelberry devices? | **Open.** Recommended answer: later, and non-movement only |

Q1 is not in doubt. Home Assistant carries thousands of device integrations maintained by other people, and principle 7 (works with what people already own) plus a small team make rebuilding that absurd. Every argument below assumes Q1 is yes.

The spec's "not beside it" phrasing reads as an answer to Q2, but the sentence that follows — "the hub can run as a Home Assistant add-on **or on its own small computer**" — is the opposite answer. That is the sentence worth keeping.

## What the existing code says about this

Nothing, and that is useful to know before deciding.

- The `rework` branch is documentation only. There is no hub yet.
- The old monorepo on `main` (`apps/proxy`, `apps/wheelchair`, `apps/blanket`, `packages/`) contains **no reference to Home Assistant anywhere** — no integration, no client, no entity mapping.

So this is a greenfield decision with no sunk cost and no migration. It is also cheaper to decide now than at any later point, because the hub's process boundary is the first thing M1 fixes in place.

## The distinction that does the work

> Home Assistant is a **backend** Wheelberry depends on for home devices. It is not the **platform** Wheelberry runs on.

A backend is something you call over a documented interface and survive the absence of. A platform owns your lifecycle, your updates, your resources and your failure modes. The spec currently asks for the first and describes the second.

Everything in the rest of this document follows from holding that line.

## Options for Q2

| Option | Shape | Who owns the hub's lifecycle |
| --- | --- | --- |
| **A** Add-on first | Hub ships as a supervised HA add-on; HA OS is the supported environment | Home Assistant's supervisor and release cadence |
| **B** Standalone only | Hub is its own process on its own machine; HA reached as a client over its public API | Wheelberry |
| **C** Standalone reference, add-on packaging | Same hub, two deployments; the add-on is a convenience build of the standalone hub | Wheelberry, in both cases |

Option A buys a genuinely better first-run story: one box, one install, the supervisor handles backups and updates, and the installer tells the user "install Home Assistant, then add Wheelberry". For a lights-and-heating product it would be the right answer.

It is the wrong answer here, for four reasons that only apply because Wheelberry moves people.

**1. Availability of seating control stops being ours.** In add-on form, the hub's uptime is governed by a platform on a monthly release cadence that belongs to someone else. A user who needs to tilt to relieve pressure does not care whose update is running. The watchdog makes an interrupted move *safe* — outputs release, per N-S1 — but safe is not the same as available, and losing seating control for a minute is a real harm to someone who cannot reposition unaided.

**2. It puts N-S2 in competition for the same machine.** [movement-semantics.md](movement-semantics.md) adopted a 150 ms worst-case local stop "which must hold while the hub is under load". In add-on form the hub shares a CPU, a disk and an I/O queue with HA's Python stack and its recorder database. Holding a 150 ms worst case next to a neighbour whose write bursts we neither control nor observe is a measurement problem we would be creating for ourselves, and the M2 hazard analysis is the place it would surface — late and expensively.

**3. The regulatory boundary gets much harder to describe.** M0 assesses whether the seating controller is a medical device or accessory under UK and EU MDR. If it is, the technical file must describe the software environment it runs in. "Our own hub image, which we version and test" is a boundary we can state and defend. "A third-party platform that changes monthly, whose supervisor may restart us, and whose APIs may deprecate" is a boundary that keeps moving under the file. This is the strongest argument of the four and the spec does not currently make it.

**4. The spec already contradicts option A elsewhere.** The risk table's mitigation for "Home Assistant is hard for non-technical installers" is "offer a preconfigured hub". A preconfigured hub *is* the standalone answer. Option A would make the HA install a prerequisite for the product rather than something Wheelberry hides.

### Recommendation on Q2

**Option C, with standalone as the reference and only supported configuration where seating is involved.**

Ship the add-on, because people who already run HA OS will want it and it costs little once the hub treats HA strictly as a remote backend. But the add-on is a packaging decision, not an architecture: it must use the same HA client code as the standalone hub, over HA's documented WebSocket and REST APIs with a long-lived token, and must never call supervisor-internal APIs. The moment add-on-only shortcuts appear in the code, the two deployments diverge and the standalone hub becomes the unsupported one by neglect.

Where a user has seating on the dongle path, the supported configuration is the standalone hub.

## What an add-on restart actually means

The review asked this specifically, so here it is concretely rather than as a worry.

| Event | Who triggers it | Effect in add-on form | Effect in standalone form |
| --- | --- | --- | --- |
| HA Core restart (config reload, Core update) | User, or HA auto-update | Hub process survives; its HA connection drops for roughly 10–60 s, so home devices go unavailable | Identical: HA connection drops, home devices unavailable, seating unaffected |
| HA OS update | HA, often automatically | Host reboots; **the hub goes down with it** | Nothing. Different machine, or at worst a container the user controls |
| Supervisor restarts the add-on (watchdog, config change, add-on update) | HA supervisor | **Hub restarts**, outside our control | Not applicable |
| Wheelberry update | Us | Hub restarts, as scheduled | Hub restarts, as scheduled |

The second and third rows are the whole argument. An installer can disable HA auto-updates to mitigate them, but that moves a safety-relevant property of the system into a setting on someone else's product that nobody will audit. Note also that the first row is identical in both deployments — losing the HA connection is a condition the hub has to handle gracefully regardless, which is why F20 below is needed either way.

## Three things Home Assistant cannot do for us

Worth stating plainly, because "build on Home Assistant" invites the assumption that it covers more than it does.

**It cannot express F7.** Wheelberry grants permissions per user, per device and per channel. Home Assistant's authentication model has no comparable per-user, per-entity authorisation — an HA user who can see the dashboard can generally act on what is on it. So Wheelberry's permission model can only be enforced **above** HA, at the hub, with the hub holding the only HA credential. The consequence is a product rule, not just a code rule: **Home Assistant is an installer-facing privileged backend, and end users and carers are not given HA logins.** If they are, F7 is bypassable by design and the audit trail is bypassable with it.

**It cannot complete F14.** Any action taken in HA's own UI, app or automations never passes through Wheelberry and cannot appear in Wheelberry's audit log. F14's promise of "every action" is therefore only truthful if it is scoped to actions through Wheelberry channels. That wording needs fixing, and it is better fixed now than discovered by an organisation admin reading an incomplete log during an incident.

**It must not carry anything safety-relevant.** N-P1 already says the seating path never goes through Home Assistant. Q3 generalises it: the dongle path, the local stop and every movement decision live in the hub and the firmware. HA is a peer-level consumer of home devices and nothing more. There is no benefit on offer in routing seating through HA, and the cost is an unreviewable dependency inside the safety case.

## Exposing Wheelberry inside Home Assistant (Q4)

The scope table promises this is "two-way": Wheelberry uses HA as a backend and also shows up inside it as an integration. That second half creates a problem the channel capability matrix does not yet cover.

If Wheelberry devices appear as HA entities, then **HA automations become an actor that can command Wheelberry devices** — and HA automations are written by users and installers in a tool that sits entirely outside Wheelberry's safety review, with no clinician opt-in, no presence model and no audit. An HA automation that tilts a seat is exactly the unattended movement that [movement-semantics.md](movement-semantics.md) spent eight preconditions constraining, arriving through a side door.

Proposed row for the capability matrix, in the same form as the others:

| Channel | C1 | C2 | C3 M-HOLD | C3 M-PRESET | C3 M-UNATTENDED | C4 | Stop offered |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home Assistant automation, via the Wheelberry integration | Yes | Yes | No | No | **No** | No | n/a |

So: expose read and non-movement control, never movement. A user who wants a scheduled recline uses Wheelberry's own routine engine, where P1–P8 apply. This also keeps the HA integration a genuinely small piece of work, which argues for leaving it where the spec has it — a later release, not the MVP.

## Consequences if these recommendations are taken

1. The hub is a standalone process owning its own lifecycle. Home Assistant is reached as a client over its documented WebSocket and REST APIs, with a long-lived token held only by the hub.
2. No supervisor-internal APIs, ever. One HA client, used identically by both deployments.
3. The hub starts, runs and provides seating, chair-switch input and local stop with Home Assistant absent, unreachable or restarting. HA-backed devices are shown unavailable; nothing else degrades.
4. HA entities are mapped into Wheelberry's own capability model (F1) inside one adapter, rather than passed through. This is what makes "Node-RED and openHAB later" a bounded piece of work instead of a rewrite, and it is the same adapter boundary the spec's platform ambitions already assume.
5. Home Assistant is installer-facing. End users and carers reach devices through Wheelberry, so that F7 and F14 mean what they say.
6. A seating-only installation with no Home Assistant at all is a supported configuration, because nothing in the safety path depends on HA. This matters for the first pilot users, who may have a chair and no smart home.
7. The HA integration (Q4) is read and non-movement only, and stays in a later release.

## Proposed requirement wording

Continuing the numbering from [movement-semantics.md](movement-semantics.md), which ended at F18 and N-P3.

- **F14, revised** Keep an audit log of every action taken through a Wheelberry channel: who, which channel, which device, result. Where a device is reached through a third-party platform, record that the command was issued and its result, and state in the log that actions taken directly in that platform are outside Wheelberry's record.
- **F19, new** The hub owns its own lifecycle. Home-device platforms are reached as clients over their documented public interfaces, and no home-device platform may host the hub, manage its updates, or be required for it to start.
- **F20, new** The hub must provide seating control, chair-switch input, local stop and its own user interface when any home-device platform is absent, unreachable or restarting, showing affected devices as unavailable without degrading anything else.
- **F21, new** Where Wheelberry exposes its devices into a third-party home-automation platform, that platform's automations are a read and non-movement actor only, and may never command movement of a person.
- **N-R1, new** Hub availability is independent of any home-device platform: no planned or automatic update of that platform may interrupt seating control or local stop.
- **N-R2, new** The hub returns to full local function unaided after power loss, within a target to be set in M1, with no dependency on a third-party platform having started first.

The safety path rule from [movement-semantics.md](movement-semantics.md) — all safety timing in the STM32 firmware — gains a companion worth stating in the architecture section: **no safety-relevant path traverses Home Assistant.**

## Decisions needed

1. **Q2, deployment.** Standalone reference with add-on packaging (recommended), add-on first, or standalone only?
2. **Q3, the safety path.** Confirm that no safety-relevant path — seating commands, stop, dongle traffic — ever traverses Home Assistant?
3. **Seating-only installs.** Must Wheelberry be useful with no Home Assistant present at all? This costs an abstraction and buys the pilot user who has a chair and no smart home.
4. **Q4, the Wheelberry integration inside HA.** Non-movement only (recommended), full capability, or drop it?
5. **HA access policy.** Is Home Assistant installer-facing only, with end users and carers never given HA logins? Answering no means F7 and F14 are bypassable and should be reworded to say so.

## Still open, not blocking

- **Which HA installation types do we support as a backend?** HA OS, Container, Core and Supervised differ in how they are updated and how reachable they are. Probably an installer-documentation question rather than an architecture one, but it decides what "supported" means in a support call.
- **HA authentication lifecycle.** Long-lived access tokens do not rotate themselves. Token rotation and revocation belong with the pairing lifecycle gap already recorded in [spec-review.md](spec-review.md).
- **Whether the preconfigured hub ships with HA on it.** A single physical box running the standalone hub *and* Home Assistant as separate services is a product packaging choice, and it is compatible with everything above — the process boundary is what matters, not the box count. It does, however, reintroduce the resource-contention point in argument 2, so N-S2 would need measuring in that configuration specifically.
