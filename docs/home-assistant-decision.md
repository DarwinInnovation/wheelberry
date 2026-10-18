# Home Assistant: backend, not platform

Third revision, 18 October 2026. The first revision proposed options; Richard decided all five questions; the second revision implemented them and surfaced one consequence he then acted on, reversing decision 4. This revision is written to the decisions as they now stand. Second workstream out of [spec-review.md](spec-review.md), following [movement-semantics.md](movement-semantics.md).

The spec contradicted itself on Home Assistant: the architecture section states *"Key decision: build on Home Assistant, not beside it"*, while the open questions still ask *"Should Wheelberry sit on top of Home Assistant (recommended) or stand alone?"*. That contradiction is now closed.

## Decisions taken

| # | Question | Decision |
| --- | --- | --- |
| 1 | Does the hub run inside Home Assistant, or as its own thing? | **Standalone only.** No add-on is shipped |
| 2 | May a safety-relevant path ever traverse Home Assistant? | **Never.** HA is a home-device backend only |
| 3 | Must Wheelberry work with no Home Assistant present? | **Yes** — and Wheelberry may implement some home-control APIs directly, lighting first |
| 4 | What may HA automations do with Wheelberry devices? | **Read and non-movement control. No movement, in any mode** |
| 5 | Is Home Assistant installer-facing only? | **No.** Users and carers may hold HA logins |
| 6 | May the preconfigured hub run HA on the same box? | **Decide in M1**, as a packaging question |

Decision 4 moved twice. The first revision recommended non-movement only; Richard's first answer was full capability including movement; and when the second revision set out what that meant alongside decision 5, he reversed it to non-movement only. Decision 3 adds a direction the first revision did not consider. Decisions 1 and 2 go at least as far as it recommended. The rest of this document is written to the decisions as they now stand.

## The distinction that still does the work

> Home Assistant is a **backend** Wheelberry depends on for home devices. It is not the **platform** Wheelberry runs on.

A backend is something you call over a documented interface and survive the absence of. A platform owns your lifecycle, your updates, your resources and your failure modes. Decisions 1, 2 and 3 all say *backend*; the spec's "not beside it" phrasing says *platform* and should be replaced.

Worth recording that this was a greenfield decision: the `rework` branch is documentation only, and the old monorepo on `main` contains **no reference to Home Assistant anywhere** — no integration, no client, no entity mapping. The "key decision" had no code behind it, so nothing is being migrated.

## 1. Standalone only

The hub is its own process on its own machine. Home Assistant is reached as a client over its documented WebSocket and REST APIs with a long-lived token held by the hub. No add-on is built, so no supervisor API is ever called and there is one supported software environment rather than two.

Three things this buys, the third being the one that mattered:

1. **Availability of seating control stays ours.** A user who needs to tilt to relieve pressure does not care whose update is running. The watchdog makes an interrupted move *safe* (N-S1), but safe is not available, and losing seating control for a minute is a real harm to someone who cannot reposition unaided.
2. **N-S2 is not in competition for the machine.** The 150 ms worst-case local stop must hold under load. Sharing a CPU and a disk queue with HA's recorder database would have meant holding that worst case next to a neighbour whose write bursts we neither control nor observe.
3. **The regulatory boundary is describable.** If M0 finds the seating controller is a medical device or accessory, the technical file must state the software environment. "Our own hub image, which we version and test" is defensible. "A third-party platform that changes monthly and whose supervisor may restart us" is a boundary that keeps moving under the file.

Note that losing the HA connection for 10–60 seconds during an HA Core restart happens in *any* deployment. That is why F20 is needed regardless: home devices go unavailable, and nothing else may degrade.

### What decision 1 costs, and the one question it leaves

It loses the person who already runs HA OS and wants one box. The spec's own risk table already answers them — its mitigation for "Home Assistant is hard for non-technical installers" is "offer a preconfigured hub" — and with no add-on, that preconfigured hub is now the *only* one-box story, so it moves from a nice-to-have to the supported path for that user.

That raises the question decision 1 leaves behind: **may the preconfigured hub also run Home Assistant on the same machine, as a separate service?** Decision 6 defers it to M1, which is the right place: it is a packaging choice, not an architecture one, and nothing in M1 is blocked by leaving it open.

What deferring it costs, so that M1 inherits the condition rather than the surprise: one box is compatible with everything in this document, because the process boundary is what matters and not the box count. But it reintroduces the resource contention of argument 2 above. So if the preconfigured hub ships with HA on the same machine, **N-S2 must be measured in that configuration specifically**, under HA recorder write load, rather than inferred from the separate-machine case. That measurement is the decision criterion in M1, not a follow-up to it.

## 2. The safety path never traverses Home Assistant

Confirmed, generalising N-P1 from the seating path to everything safety-relevant: seating commands, the local stop, dongle traffic and every movement decision live in the hub and the firmware. HA is a peer-level consumer of home devices and nothing more.

This belongs in the architecture section as a rule, alongside the one from [movement-semantics.md](movement-semantics.md) that all safety timing lives in the STM32 firmware:

> **No safety-relevant path traverses a third-party home-automation platform.**

Stated as a general rule rather than one about HA specifically, because decision 3 means HA will not be the only backend.

## 3. No Home Assistant required — and backends beyond it

A seating-only installation with no Home Assistant at all is a supported configuration. Nothing in the safety path depends on HA, so this largely falls out of decisions 1 and 2, and it matters for the first pilot users, who may have a chair and no smart home.

The second half of the answer is the consequential part: **Wheelberry may implement some home-control APIs directly, lighting first.** That reopens what the first revision called settled, and narrows it rather than overturning it.

### What stays settled, and what does not

| | Status |
| --- | --- |
| Implementing **radio protocol stacks** ourselves — Zigbee, Z-Wave, Thread and Matter | **Still ruled out.** Radio hardware, certification, and a maintenance burden a small team cannot carry. Principle 7 says use what people already own, and HA carries thousands of integrations maintained by other people |
| Implementing **IP device APIs** directly — a Hue bridge on the LAN, LIFX, a vendor cloud API | **Case by case.** No radio stack, no certification, and a bounded amount of code per vendor |

The line is the radio, not the integration. That is a defensible place to draw it: a LAN REST API is a week of work and a test fixture, while a Zigbee stack is a product in itself.

### When to go direct

Proposed test, all four to hold before a direct backend is built:

- It is an IP or LAN API, with no radio stack and no certification.
- The device class is load-bearing in a core journey, so HA's availability and latency are felt by the user rather than merely observed by us.
- Going direct removes an install step for a user who would otherwise need HA for nothing else.
- We can maintain it, including when the vendor changes the API.

Lighting passes all four, which is why it is the named first candidate: it is the most-used non-movement capability, and it is exactly what the seating-only pilot user will want next after the chair.

### The rule that keeps this from becoming a mess

Two backends that can both reach the same lamp is a source of split-brain state, double commands and an unanswerable "which path failed". So:

> **Exactly one backend owns a device at a time.** Ownership is explicit in configuration, visible in the UI, and changing it is a deliberate act, not a fallback.

No automatic failover between a direct backend and HA for the same device. If the owning backend is down, the device is unavailable — which is the same behaviour F20 already requires for HA.

This makes the adapter boundary load-bearing rather than tidy-minded: HA entities and direct-API devices are both mapped into Wheelberry's own capability model (F1) inside their own adapters, never passed through. It is also what makes the spec's "Node-RED and openHAB later" ambition a bounded piece of work.

## 4. Movement is not exposed into Home Assistant

This decision moved twice, and the path matters because it is the reasoning that should survive, not the preference.

The first revision recommended non-movement only. Richard's first answer permitted full capability including movement, and the second revision implemented that — honestly, which meant writing down what it costs. Reading that cost alongside decision 5, he reversed it. The reversal is the better decision, and the argument for it is below rather than in a changelog, because this is the kind of thing that gets reopened in a year by someone who was not in the conversation.

### The argument

Decisions 4 and 5 compounded. Separately each was manageable; together they produced this:

> If Wheelberry exposes movement into HA, and users and carers hold HA logins, then **an HA login becomes a route to commanding movement** — and HA cannot tell us which human is behind a session.

The second revision's answer was to split by deployment: HA logins fine in a single household, HA installer-facing in organisations. That answer was worse than it looked. It made a safety property conditional on a classification nobody reliably applies — a household with two agency carers and a changing rota is which one? — and it put the burden of getting it right on an installer at the point of sale.

Withdrawing movement removes the hazard at its source instead. One rule everywhere, and the rule is about **capability**, not about who is allowed to log in. Decision 5 then stands untouched, because there is no longer anything behind an HA login worth the argument.

### What the integration exposes

| Class | Into Home Assistant |
| --- | --- |
| **C1** Read — device state, seating status | **Yes**, read-only |
| **C2** Non-movement control — lights, plugs, heating, scenes of these | **Yes** |
| **C3** Movement of a person — in any mode, including unattended | **No** |
| **C4** Safety and system configuration | **No** |

Revised matrix row, replacing the second revision's:

| Channel | C1 | C2 | C3 M-HOLD | C3 M-PRESET | C3 M-UNATTENDED | C4 | Stop offered |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home Assistant automation, via the Wheelberry integration | Yes | Yes | No | No | **No** | No | n/a |

An HA automation can switch a lamp, read that the seat is reclined, and notify someone about it. It cannot tilt, recline, or trigger a Wheelberry preset that does. The scope table's promise that the integration is "two-way" still holds; what crosses the boundary is bounded.

### What stays, because C1 and C2 still need it

Three rules from the second revision survive the reversal and should not be dropped with it:

- **Attribution.** Commands arriving through the integration are attributed to the **integration's own Wheelberry actor**, with its own permissions — never to whichever human happens to be driving the HA session, because HA cannot tell us and we must not guess.
- **Enforcement is entirely Wheelberry-side.** The integration submits a request to the hub's own API and the policy engine evaluates it like any other actor's. There is no privileged path and no "trusted automation" flag. This is what makes a movement request from HA a *refusal* rather than an impossibility — the difference matters, because impossibility is a property of today's entity list and refusal is a property of the policy engine.
- **Refusals must be legible.** An automation author must be able to tell "it said no" from "it did not hear me", and repeat requests inside a cool-down are refused rather than queued. Silently dropped requests become retry loops.

### Reading seating state is still an exposure

C1 stays Yes, and that is right: knowing the chair is reclined is useful in an automation and harmless to the chair. But seating usage is health-adjacent data sitting in a system whose access control Wheelberry does not manage, so it is a DPIA question rather than an engineering one — N-D4 below. If the DPIA objects, the proportionate answer is a coarser status (occupied, reclined, moving) rather than withdrawing C1.

### If this is ever reopened

It may be, and the argument above is about a compounding risk rather than about movement-in-HA being wrong in principle. So the gate is kept rather than deleted, which is what P9 is now for:

- **P9** No actor outside Wheelberry may command movement of a person. Reopening this for a given platform requires: a clinician opt-in **distinct from** the one for Wheelberry's own routines and revocable by the user from any channel; movement exposed as press-like **preset requests** and read-only status, never as settable positions; and the platform's inability to identify the human behind a session recorded as an accepted hazard in the risk file.

The middle condition is the one that is easy to lose. If a movement axis were exposed to HA as an ordinary settable entity, automation authors would reasonably write `set position`, see nothing happen for ten seconds, and add a retry — and retry loops against a cancel window are precisely the behaviour A4 forbids for assistants, worse here because nobody is watching. There is also nothing to set: preset positions are nominal until M-TARGET. See F15.

Two existing preconditions would become load-bearing rather than belt-and-braces in that event, and the M2 hazard analysis should read them that way: **P4's daily budget** is the only real control against an automation retriggering on a flapping sensor, and **P5's cancel window** is the user's only defence against an automation they forgot they wrote.

## 5. Users and carers may hold HA logins

Decision 5 reverses the first revision's recommendation and survives the reversal of decision 4 unchanged. With movement withdrawn, what an HA login grants is bounded to C1 and C2 — but the requirements must still say what is true rather than what we would prefer.

Home Assistant's authentication model has no per-user, per-entity authorisation: an HA user who can see a dashboard can generally act on what is on it. Wheelberry's F7 permission model is therefore enforceable **only above HA**, over Wheelberry's own channels. With HA logins in users' and carers' hands, three things follow:

1. **F7 does not govern HA-backed devices for anyone holding an HA login.** A carer with an HA login can switch a lamp that Wheelberry would have refused them. After decision 4, this is the whole of the exposure: lamps, plugs, heating, scenes. Nothing that moves a person.
2. **F14's log is incomplete by design.** Anything done in HA's own UI, app or automations never passes through Wheelberry and cannot appear in its audit log.
3. **Seating state exposed into HA sits in a system whose access control we do not manage.** Usage patterns are health-adjacent, so this is a DPIA item rather than merely an engineering one, and it belongs with the DPIA proposed as an M0 deliverable.

Worth stating to installers in plain words, because it is the sentence that prevents a later surprise:

> Holding a Home Assistant login grants the integration actor's permissions over every non-movement device exposed into HA. HA access cannot be differentiated per person, and no Wheelberry seating can be commanded from it.

The organisational case no longer needs a rule of its own. Where F7's per-user model is doing real work, an installer may still choose to keep HA installer-facing — but that is now a configuration preference about lamps, not a safety control, and it is correctly left to them.

## Consequences

1. The hub is a standalone process owning its own lifecycle. No add-on is built; home-device platforms are reached as clients over their documented public interfaces.
2. The hub starts, runs and provides seating, chair-switch input, local stop and its own interface with any home-device platform absent, unreachable or restarting. Affected devices show unavailable; nothing else degrades.
3. A seating-only installation is a supported configuration, and with a direct lighting backend it is a seating-and-lighting installation.
4. Home Assistant is one backend among several, behind a backend adapter boundary. Radio protocol stacks stay out of scope; direct IP device APIs are a case-by-case judgement against the four-part test above.
5. Exactly one backend owns any given device. No automatic failover, no dual paths.
6. No safety-relevant path traverses any third-party home-automation platform.
7. The HA integration exposes read and non-movement control only. No movement of a person is commandable from any actor outside Wheelberry, in any mode. Integration requests are attributed to a single Wheelberry actor and evaluated by the policy engine with no privileged path.
8. F7 governs Wheelberry channels. Where users and carers hold HA logins, HA-backed non-movement devices are outside it.
9. F14's audit log is scoped to actions through Wheelberry channels, and says so.
10. Whether the preconfigured hub runs HA on the same box is an M1 packaging decision, whose criterion is N-S2 measured in that configuration.

## Requirement wording

Continuing from [movement-semantics.md](movement-semantics.md), which ended at F18, N-P3 and P8.

- **F7, revised** Enforce permissions per user, per device and per channel for every action taken through a Wheelberry channel. Where a device is reached through a third-party platform that cannot express these permissions, record that the platform's own access is outside Wheelberry's control, and state it in installer documentation and in the onboarding flow that enables the platform.
- **F14, revised** Keep an audit log of every action taken through a Wheelberry channel: who, which channel, which device, result. Where a device is reached through a third-party platform, record that the command was issued and its result, and state in the log that actions taken directly in that platform are outside Wheelberry's record.
- **F19, new** The hub owns its own lifecycle and runs as its own process. No home-device platform may host it, manage its updates, or be required for it to start.
- **F20, new** The hub must provide seating control, chair-switch input, local stop and its own user interface when any home-device platform is absent, unreachable or restarting, showing affected devices as unavailable without degrading anything else.
- **F21, new** Where Wheelberry exposes its devices into a third-party platform, expose read and non-movement control only. Commands arriving from that platform are attributed to a single Wheelberry actor and evaluated against the full policy engine with no privileged path. Movement of a person is refused, with a reason the platform can report.
- **F22, new** Reach every home device through a backend adapter into one capability model, with exactly one backend owning a device at a time and no automatic failover between backends for the same device.
- **N-R1, new** Hub availability is independent of any home-device platform: no planned or automatic update of that platform may interrupt seating control or local stop.
- **N-R2, new** The hub returns to full local function unaided after power loss, within a target to be set in M1, with no dependency on a third-party platform having started first.
- **P9, revised** (extending the unattended preconditions) No actor outside Wheelberry may command movement of a person. Reopening this for a given platform requires a clinician opt-in distinct from the one for Wheelberry's own routines and revocable by the user from any channel, movement exposed as preset requests and read-only status rather than settable positions, and the platform's inability to identify the human behind a session recorded as an accepted hazard.

N-P2's 800 ms home-device target was written for Zigbee round trips through HA. A direct IP backend should beat it comfortably, so when the first one ships, N-P2 is worth splitting per backend rather than held at the slowest path.

## Still open, not blocking

- **Which HA installation types are supported as a backend?** HA OS, Container, Core and Supervised differ in how they update and how reachable they are. An installer-documentation question that decides what "supported" means in a support call.
- **HA authentication lifecycle.** Long-lived access tokens do not rotate themselves. Token rotation and revocation belong with the pairing lifecycle gap recorded in [spec-review.md](spec-review.md).
- **Which lighting API first, and does it need a cloud account?** A direct backend that depends on a vendor cloud fails the "works with the internet down" principle and would need the same absent-backend treatment as F20.
