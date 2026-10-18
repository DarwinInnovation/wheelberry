# Home Assistant: backend, not platform

Second revision, 18 October 2026. The first revision proposed options; Richard decided all five questions, and this revision implements those decisions rather than re-arguing them. Second workstream out of [spec-review.md](spec-review.md), following [movement-semantics.md](movement-semantics.md).

The spec contradicted itself on Home Assistant: the architecture section states *"Key decision: build on Home Assistant, not beside it"*, while the open questions still ask *"Should Wheelberry sit on top of Home Assistant (recommended) or stand alone?"*. That contradiction is now closed.

## Decisions taken

| # | Question | Decision |
| --- | --- | --- |
| 1 | Does the hub run inside Home Assistant, or as its own thing? | **Standalone only.** No add-on is shipped |
| 2 | May a safety-relevant path ever traverse Home Assistant? | **Never.** HA is a home-device backend only |
| 3 | Must Wheelberry work with no Home Assistant present? | **Yes** — and Wheelberry may implement some home-control APIs directly, lighting first |
| 4 | What may HA automations do with Wheelberry devices? | **Full capability, including movement** |
| 5 | Is Home Assistant installer-facing only? | **No.** Users and carers may hold HA logins |

Decisions 4 and 5 reverse recommendations in the first revision, and decision 3 adds a direction the first revision did not consider. Decisions 1 and 2 go at least as far as it recommended. The rest of this document is written to the decisions as taken.

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

That raises the one open question decision 1 leaves behind: **may the preconfigured hub also run Home Assistant on the same machine, as a separate service?** It is compatible with everything here, because the process boundary is what matters and not the box count. But it reintroduces the resource contention of argument 2, so if it ships that way, N-S2 must be measured in that configuration specifically rather than inferred from the separate-machine case. This is a packaging decision for M1, not an architecture one.

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

## 4. HA automations may command movement

Decision 4 permits full capability through the Wheelberry integration inside HA, including movement. This is the decision that needs the most care, because an HA automation is written by a user or an installer in a tool entirely outside Wheelberry's safety review.

The way to implement it honestly is to stop treating the integration as a privileged peer and treat it as **an actor like any other**, specifically an unattended-class actor in the sense [movement-semantics.md](movement-semantics.md) defines — an HA automation is never present, perceives nothing, and has no reflexes.

### Enforcement is entirely Wheelberry-side

The integration submits a *request* to the hub's own API. P1 to P8 are evaluated by the policy engine exactly as they are for Wheelberry's internal routine engine: clinician opt-in, one axis at a time, run-time cap, daily budget, announcement with a cancel window, no movement during an attended lease, audit. HA never gets a path that skips this, and there is no "trusted automation" flag.

Revised matrix row, replacing the first revision's:

| Channel | C1 | C2 | C3 M-HOLD | C3 M-PRESET | C3 M-UNATTENDED | C4 | Stop offered |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home Assistant automation, via the Wheelberry integration | Yes | Yes | No | No | **Within envelope** | No | n/a |

M-HOLD and M-PRESET stay "No" because both require a present human, and an automation cannot be one — the same reason the routine engine row reads that way. Movement by automation is unattended movement, and gets the unattended envelope.

### Who reviews user-written HA automations?

Nobody can, and pretending otherwise would be the failure mode here. The honest answer is that the review burden moves to the Wheelberry side entirely, with one addition to the preconditions:

- **P9, new** Movement commanded by an actor outside Wheelberry — a third-party platform automation — requires a clinician opt-in **distinct from** the opt-in for Wheelberry's own routines, revocable by the user from any channel. Granting unattended movement to Wheelberry routines does not grant it to HA automations.

Two existing preconditions become load-bearing rather than belt-and-braces, and should be read that way in the M2 hazard analysis:

- **P4's daily budget per axis** is now the primary control against a looping or misconfigured automation. An automation that retriggers on a flapping sensor is a realistic failure, where a Wheelberry routine firing twice an hour is not.
- **P5's announcement and cancel window** is the user's only defence against an automation they forgot they wrote.

### The integration must not look like a position control

If a movement axis is exposed to HA as an ordinary settable entity, automation authors will reasonably write `set position`, see nothing happen for ten seconds, and add a retry. Retry loops against a cancel window are precisely the behaviour A4 forbids for assistants, and they are worse here because nobody is watching.

So the exposed entities should be:

- A **request** entity per permitted named preset — press-like, not settable — whose acceptance is not the same event as the movement happening.
- A **read-only status** entity reporting requested, announced, moving, completed, cancelled or refused.
- No settable position entity, for the same reason M-PRESET positions are nominal: there is nothing to measure. See F15.

Refusals and cancellations must be reported distinctly enough that an automation author can tell "it said no" from "it did not hear me", and repeat requests inside a cool-down are refused rather than queued.

### Residual risk, for the risk file

A user-written automation with C3 access is a route to moving a person without their intent at the time, which P1 to P9 reduce but do not eliminate. It belongs in the ISO 14971 analysis as an accepted hazard with these controls, in the same form as the prompt-injection entry — written down so the independent safety review sees it rather than discovers it.

## 5. Users and carers may hold HA logins

Decision 5 reverses the first revision's recommendation, so the requirements must now say what is true rather than what we would prefer.

Home Assistant's authentication model has no per-user, per-entity authorisation: an HA user who can see a dashboard can generally act on what is on it. Wheelberry's F7 permission model is therefore enforceable **only above HA**, over Wheelberry's own channels. With HA logins in users' and carers' hands, three things follow:

1. **F7 does not govern HA-backed devices for anyone holding an HA login.** A carer with an HA login can switch a lamp that Wheelberry would have refused them.
2. **F14's log is incomplete by design.** Anything done in HA's own UI, app or automations never passes through Wheelberry and cannot appear in its audit log.
3. **Seating state exposed into HA sits in a system whose access control we do not manage.** Usage patterns are health-adjacent, so this is a DPIA item, not merely an engineering one — it belongs with the DPIA already proposed as an M0 deliverable.

### The one place decisions 4 and 5 compound

Separately, each is manageable. Together they are the sharp edge in this document: **if Wheelberry exposes movement into HA, and users and carers hold HA logins, then an HA login becomes a route to commanding movement.**

The guard is attribution. Commands arriving through the integration are attributed to the **integration's own Wheelberry actor**, with its own permissions and its own P9 opt-in — never to whichever human happens to be driving the HA session, because HA cannot tell us and we must not guess. The consequence is unavoidable and should be stated to installers in plain words:

> Within a household, holding an HA login grants the integration actor's permissions over every device exposed into HA, including any movement presets enabled there. HA access cannot be differentiated per person.

That is acceptable in a single-household deployment, where the carer who has the HA login is the carer who is in the room anyway. It is not acceptable where users and carers are many and the pairings vary. So:

- **Single-household deployments.** HA logins for users and carers are fine, under the statement above.
- **Organisational deployments** (F7's per-user, per-carer model doing real work): Home Assistant stays installer-facing, because the permission model is the product there and HA cannot express it.

That split honours decision 5 where it was aimed without quietly breaking F7 where it matters most.

## Consequences

1. The hub is a standalone process owning its own lifecycle. No add-on is built; home-device platforms are reached as clients over their documented public interfaces.
2. The hub starts, runs and provides seating, chair-switch input, local stop and its own interface with any home-device platform absent, unreachable or restarting. Affected devices show unavailable; nothing else degrades.
3. A seating-only installation is a supported configuration, and with a direct lighting backend it is a seating-and-lighting installation.
4. Home Assistant is one backend among several, behind a backend adapter boundary. Radio protocol stacks stay out of scope; direct IP device APIs are a case-by-case judgement against the four-part test above.
5. Exactly one backend owns any given device. No automatic failover, no dual paths.
6. No safety-relevant path traverses any third-party home-automation platform.
7. The HA integration is a full-capability actor including movement, enforced entirely Wheelberry-side, unattended-class, under its own clinician opt-in (P9), exposing request and status entities rather than settable positions.
8. F7 governs Wheelberry channels. Where users and carers hold HA logins, HA-backed devices are outside it, and organisational deployments keep HA installer-facing.
9. F14's audit log is scoped to actions through Wheelberry channels, and says so.

## Requirement wording

Continuing from [movement-semantics.md](movement-semantics.md), which ended at F18, N-P3 and P8.

- **F7, revised** Enforce permissions per user, per device and per channel for every action taken through a Wheelberry channel. Where a device is reached through a third-party platform that cannot express these permissions, record that the platform's own access is outside Wheelberry's control, and require the platform to be installer-facing in deployments where per-user permissions are relied upon.
- **F14, revised** Keep an audit log of every action taken through a Wheelberry channel: who, which channel, which device, result. Where a device is reached through a third-party platform, record that the command was issued and its result, and state in the log that actions taken directly in that platform are outside Wheelberry's record.
- **F19, new** The hub owns its own lifecycle and runs as its own process. No home-device platform may host it, manage its updates, or be required for it to start.
- **F20, new** The hub must provide seating control, chair-switch input, local stop and its own user interface when any home-device platform is absent, unreachable or restarting, showing affected devices as unavailable without degrading anything else.
- **F21, new** Where Wheelberry exposes its devices into a third-party platform, commands arriving from that platform are attributed to a single Wheelberry actor, evaluated against the full policy engine with no privileged path, and treated as unattended whenever they command movement.
- **F22, new** Reach every home device through a backend adapter into one capability model, with exactly one backend owning a device at a time and no automatic failover between backends for the same device.
- **N-R1, new** Hub availability is independent of any home-device platform: no planned or automatic update of that platform may interrupt seating control or local stop.
- **N-R2, new** The hub returns to full local function unaided after power loss, within a target to be set in M1, with no dependency on a third-party platform having started first.
- **P9, new** (extending the unattended preconditions) Movement commanded by an actor outside Wheelberry requires a clinician opt-in distinct from the opt-in for Wheelberry's own routines, revocable by the user from any channel.

N-P2's 800 ms home-device target was written for Zigbee round trips through HA. A direct IP backend should beat it comfortably, so when the first one ships, N-P2 is worth splitting per backend rather than held at the slowest path.

## Still open, not blocking

- **Does the preconfigured hub ship with Home Assistant on the same box?** The one question decision 1 leaves. A packaging choice for M1; if yes, N-S2 must be measured in that configuration.
- **Which HA installation types are supported as a backend?** HA OS, Container, Core and Supervised differ in how they update and how reachable they are. An installer-documentation question that decides what "supported" means in a support call.
- **HA authentication lifecycle.** Long-lived access tokens do not rotate themselves. Token rotation and revocation belong with the pairing lifecycle gap recorded in [spec-review.md](spec-review.md).
- **Which lighting API first, and does it need a cloud account?** A direct backend that depends on a vendor cloud fails the "works with the internet down" principle and would need the same absent-backend treatment as F20.
