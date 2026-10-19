# Wheelberry: the plan

Proposed 19 October 2026 after a restart, and **adopted the same day** with five decisions: the proof of concept moves a seat *and* controls home devices; the first two trial users are named; the licence is Apache-2.0; the earlier documents are parked in [`background/`](background/); and the hub grows from the existing Python test site rather than being rewritten.

**This is the plan.** It supersedes everything in `background/`, which describes a different and much larger project — see [What is parked](#what-is-parked) at the end.

Wheelberry is an open-source project with no users yet. The plan is therefore one thing: **get something a few disabled people actually use, into their homes, and find out whether it helps.** Everything here is in service of that and nothing else.

## The mission, unchanged

> Wheelberry gives disabled people simple, safe and secure control of the technology around them, from wheelchair seating and beds to lights, heating and Home Assistant, using whichever method suits them: touch, voice, phone or AI assistant. Users shape their own setup, with carers and support teams helping through a shared management portal. Wheelberry is open source and affordable, so it works with what people already own. Wheelberry does not drive wheelchairs; it controls seating and the environment around the user.

Agreed 11 October 2026 and still right. Two things in it are *destinations*, not part of this plan: the **shared management portal** and the voice and AI channels. They stay in the mission because they are where this goes. They are not built here.

## What we are proving

One claim, testable by one person in one home:

> **A disabled person can change their own seating position and their own environment, themselves, at the moment they want to — without asking anyone.**

That is the whole product. If a trial user can tilt their chair and turn the lights off at 2 a.m. without waking a carer, Wheelberry works. If they can't, no amount of architecture matters.

Everything else Wheelberry could be — multi-home management, clinician portals, voice assistants, organisational audit — is a consequence of being right about this. None of it is evidence for it.

## Who it is for, now

**Three people, in this order, and nobody else.**

| | Who | Chair | What they are for |
| --- | --- | --- | --- |
| 1 | **Richard Miller-Smith** — building it | LiNX | Getting the basic system working, on a chair that is available every day |
| 2 | **Mike Miller-Smith** — likely second user | LiNX | The first real test: someone who did not build it, whose input method and words are not ours |
| 3 | **Recruited testers** — not yet found | Unknown | Whether any of this generalises beyond one family |

That order is right — it gets a chair moving this week rather than after a recruitment round — but it has a cost worth naming now rather than discovering at the end: **user 1 cannot test usability.** Richard knows where every button is and why it is there. So step 1 is proved by Richard, and **step 2 is only evidence when it is Mike's screen, built with Mike.** Nothing user 1 does is evidence for the claim at the top of this document; it is evidence that the hardware path works, which is a different and smaller thing.

Two consequences:

- **Recruiting is real work with a long lead time, and it starts now**, in parallel — not after step 2. An OT, a wheelchair service, a user group: approaching them takes weeks of other people's time, and finding out that it is slow is much better in week one than in week eight.
- **The second pair of eyes for the bench check cannot be Richard.** The rule below is that someone other than the person who wrote the code watches the chair move. If Richard writes the hub and sits in the chair, that person has to be named.

Not "disabled people" as a category: two named people with their own chairs and their own 2 a.m. problem, with their OT or seating clinician aware of what is going on and agreeing the chair's configured range. Designing for six user types at once was the main way the previous plan grew.

## In and out

**In — the proof of concept**

| | What | Why it is in |
| --- | --- | --- |
| Seating control | Tilt, recline, leg rests on a LiNX chair via the Wheelberry Dongle | The differentiator. Nobody else does this accessibly, and the hardware already exists and works |
| Home control | Lights and heating, through Home Assistant where the user has it, or a device's own LAN API where they don't | Low risk, immediately useful, and the thing the user can demo to a friend |
| One accessible screen | A web page on the home network. Few, large targets. Touch and held switch drive everything; dwell and scanning drive the home devices but not seating — see [the collision](#where-the-rules-and-the-accessible-screen-collide) | Without this the rest is unreachable, which is the entire point of the project |
| The chair's own switches | The existing input module, so a chair button can trigger a Wheelberry action. **Already built** | Cheapest accessible input there is: it is already mounted where they can reach it |
| Works with no internet | The hub is in the home and needs nothing outside it | A light switch that depends on a cloud is not a light switch |
| A passcode on the hub | One shared secret per hub, no accounts, no roles | Today anyone who can reach the port can move the chair. Required before step 4, not before step 1 |

**Out — for now, deliberately**

Cloud and remote access. The management portal. Alexa, Siri, Google. The MCP server and AI control. Phone app. Beds and hoists. Multi-home and organisational management. Per-user permission matrices. Audit retention policy. Anything with the word "platform" in it.

Each of these is a good idea with a worked-out design already sitting in [`background/`](background/). None is needed to find out whether a disabled person can tilt their own chair.

## The safety rules — all of them

Seating moves a person's body. That cannot be cut down, so it is stated in five lines rather than forty requirements:

1. **Hold-to-run.** Movement happens only while a human is actively holding the control. Release stops it.
2. **The watchdog is in the firmware.** The output module releases every output if commands stop arriving — 300 ms, already built, already unit-tested. No timing-critical safety logic lives in the hub.
3. **Nothing moves unattended.** No schedules, no automations, no routines that move a person. Not in the proof of concept.
4. **The chair's own limits stay in force.** Range is set in LiNX at installation by the installer, with the user's clinician. Wheelberry cannot exceed it and never claims to enforce a position it cannot measure — there is no position sensing.
5. **The user can always stop it, and so can anyone in the room.** Releasing the control, the chair's own controls, and power.

Those five hold from the first time a chair moves. They are cheap because the firmware already does the hard part.

**Rule 5 is the one the code does not yet honour.** Two phones can hold the same output, and one releasing does not stop the other's command stream — so "anyone in the room can stop it" is currently true of the chair's own controls and of the power, but not of Wheelberry. It is task 9 in [`step-1-tasks.md`](step-1-tasks.md), and it is a small fix, but it is a safety rule stated as though already true.

Beyond them: before any trial user sits in a moving chair, someone other than the person who wrote the code watches it move through its whole range, repeatedly, with the power pulled at random points. Not an independent safety review with a report — one afternoon, a bench, and a second pair of eyes.

### Where the rules and the accessible screen collide

One thing the five rules do not survive contact with, and it is much better found now: **rule 1 and the promise of a screen driveable by eye gaze cannot both hold for seating.** A dwell-click is a click, not a hold. An eye-gaze user selects, and the selection is over — there is no held state left to release, so there is nothing for hold-to-run to be true of.

The honest split:

- **Movement needs an input that can be held** — a finger on a touch target, a switch the user keeps pressed, or the chair's own buttons through the input module, which is the cheapest held input available because it is already mounted where they can reach it.
- **Home devices need no such thing.** A light is one-shot. Any input method, dwell included, drives it.

So the screen is accessible for the whole product, and seating within it is reachable only by hold-capable inputs. For a trial user who can hold nothing at all, seating in the proof of concept runs from the chair's own switches or not at all — which is a fact about who the first users can be, not a backlog item. The alternative was worked out in full before the restart (timed presets, bounded by a run-time cap, a presence heartbeat and a clinician opt-in, in [`background/movement-semantics.md`](background/movement-semantics.md)). It is not cheap, and it is not in the proof of concept.

## Build order

Four steps. Each one ends with something that works in front of a person.

1. **The hub drives the chair — largely built already.** The Python test site does hold-to-run on six seating outputs over a WebSocket today, with the 300 ms firmware watchdog, a 100 ms resend, release on pointer-up, tab switch, network loss and power loss, a systemd unit, and a `--test` mode that runs with no hardware attached. The chair's own switches are in it too. So step 1 is to **verify that on a chair and close a short list of gaps**, not to build it — the list is in [`step-1-tasks.md`](step-1-tasks.md). Done when: Richard can tilt a chair from a phone, and pulling the USB cable mid-move stops it.
2. **The screen becomes usable by the second user.** Mike's input method, Mike's layout, Mike's words. Built with them, not for them. Done when: they do it unaided, twice, without being shown how.
3. **The home devices join.** Lights and heating alongside the seating, in one layout, same screen. Done when: one action list covers the chair and the room.
4. **It lives in their home for a month.** Installed, unsupervised, with a way to tell us when it breaks. Done when: we have a month of their experience and know what to build next. The hub needs a passcode before this step: a home network is not a trusted network, and today anyone who can reach the port can move the chair.

No dates. **Step 1 is days of verification rather than weeks of building** — the single biggest change the restart produced, and it came from reading the existing code rather than from planning. Steps 2 and 4 are gated by another person's diary, not by us.

## Open source, as a practice

Open source is in the mission, so it is how we work, not a licence file added later:

- **Public from the start**, including the parts that are embarrassing. The dongle PCB, the firmware and the hub.
- **A README a non-programmer can act on**: what this is, who it is for, what it cannot do, and what it costs to build one.
- **Buildable by someone who is not us** — a parts list and a flashing procedure. The first external build is a real milestone and the strongest signal the project is alive.
- **Developed in the open**: decisions in the repo, as short notes, where a contributor or a sceptical OT can read them.

### The licence

**Apache-2.0 for the software** — permissive, with an explicit patent grant, which matters for a project that touches hardware. It lets a wheelchair manufacturer ship Wheelberry inside a closed product without contributing anything back, and that was chosen knowingly: for this product, being adopted by the people who already sell chairs is worth more than copyleft leverage. `LICENSE` is in this repository.

The **hardware** designs need a different licence — Apache-2.0 is written for source code and does not fit a PCB. Still open, and it is cheapest to settle before the PCB repository goes public.

### What is public today is the parked work; what is private is the live work

That is backwards, and it is the practice above being a word rather than a habit:

| Public | Private |
| --- | --- |
| `wheelberry` — this monorepo: the TypeScript proxy, Alexa skill and portal. All of it parked | `wheelberry_dongle_http_test_site` — Python, the hub this plan is built on |
| `wheelberry.pretty`, `wheelberry_hat`, `node-wheelberry-i2c`, `bedberry` | `firmware_wheelberry_output_module` — C, where the 300 ms watchdog lives |
| `di-ha-addons` — Home Assistant add-ons, Python | `firmware_wheelberry_input_module`, `pcb_wheelberry_dongles` |

Publishing the three private repositories the proof of concept depends on is a task in [`step-1-tasks.md`](step-1-tasks.md), not a someday. One thing to clear first: the **personal email address** committed in this monorepo's `apps/proxy/cfg/wheelchair.json5`, `apps/proxy/cfg/blanket.json5` and `apps/proxy/README.md`, and in its git history. That is already public and live now. The firmware and PCB repositories need the same check before they are flipped, while it is still cheap.

## Regulatory and data protection — noted

Noted, not designed for. The position:

- **Seating control may be an accessory to a medical device.** The proof of concept is not placed on the market, not sold, and not distributed as a product. It is used by named individuals who know what it is, with their clinician aware, in their own homes.
- **Before anything is sold, or offered to care providers or housing associations, that question gets a real answer** — UK MDR and the EU MDR, plus ISO 14971 for the risk file and ISO 7176-14 for wheelchair electrical systems. That is a gate on *commercialisation*, not on the proof of concept.
- **Data protection is almost absent by construction.** The hub is in the home, there is no cloud, and Darwin Innovation holds no user data at all. That is a genuine strength and the honest answer to "what do you keep about me?" is "nothing — we never have it." It stops being true the moment remote access arrives, and that is when a DPIA is needed.
- **Open source adds one obligation now**: being clear in the README that this is a project, not a certified product, and that a chair's own configured limits are what make it safe.

The long-form analysis of all of this exists and is parked. It is good work and it will be needed. It is not needed to move a chair.

## How we know it worked

The trial user decides, not us:

- A short list of things they currently need help with, written down **with them before we build**, and whether they can now do each one alone.
- A month of living with it: what they used daily, what they stopped using, what broke.
- One question, asked plainly: **would you keep it?** And if we took it away, would you miss it?

If the answer is yes for two or three people, there is a project here and the parked material becomes the roadmap. If it's no, the reason will be specific, and worth more than everything in `background/` put together.

## What is parked

The work between 11 and 18 October produced roughly 1,300 lines across six documents, worked in real depth: the spec itself, its review, movement semantics, the Home Assistant decision, the requirements register and audit retention. The thinking is sound. The scale is wrong for a project with no users — it describes the regulated product Wheelberry becomes if the proof of concept succeeds.

So they are kept, not deleted, and not live. All six now sit in [`background/`](background/) with a banner at the top of each saying so:

| Document | What it is worth later |
| --- | --- |
| [`background/movement-semantics.md`](background/movement-semantics.md) | The source of the five safety rules above, plus the analysis for when timed presets, unattended movement and AI control return. Needed soonest of the six — it is where the accessible-input problem is worked through |
| [`background/home-assistant-decision.md`](background/home-assistant-decision.md) | Settles standalone-versus-add-on and the backend boundary: exactly one backend owns a device at a time. Still correct, and still the design this plan assumes |
| [`background/requirements.md`](background/requirements.md) | The requirement register for a funded product; the traceability matrix is reusable as-is |
| [`background/audit-retention.md`](background/audit-retention.md) | Becomes necessary the week remote access or an organisational customer appears, and three of its constraints cannot be retrofitted once records exist |
| [`background/spec.md`](background/spec.md) | The six-milestone plan this document replaces |
| [`background/spec-review.md`](background/spec-review.md) | How the five contradictions were found. Its item 5 — the existing-work truth pass — was never finished; the repository half of it is done above |

Nothing in them is contradicted by this plan. They are ahead of it.

## Settled on 19 October

Trial users (named above), the hub's language (**Python**, growing the existing test site — the earlier spec's TypeScript choice is withdrawn), the software licence (**Apache-2.0**), the scope of the proof of concept (**seating and home control**), and where the old documents live (**`background/`**).

## Open items

- [ ] **Who is the second pair of eyes for the bench check?** Blocks the first time anyone sits in a moving chair. Named person, not a role.
- [ ] **Who recruits testers, and through whom?** Starts now, in parallel with step 1, because it is the slowest thing on the list.
- [ ] **A hardware licence for the PCB designs.** Apache-2.0 does not fit; CERN-OHL-P is the permissive match for the software choice. Needed before `pcb_wheelberry_dongles` is published.
- [ ] **The legal entity name for the copyright line** in `LICENSE`, currently "Darwin Innovation".
- [ ] **The personal email in public git history** — rewrite history, or accept it. Three files at HEAD plus history.
- [ ] **Can the screen actually be *installed* on the trial users' own tablets over plain HTTP?** A service worker needs a secure context, which a LAN address over HTTP is not. iOS add-to-home-screen works without one; Android Chrome's install prompt does not appear. Verify on the real device before promising anything offline — or drop "installable" and use a bookmarked full-screen page.
- [ ] **Does the dongle or LiNX path expose motor current or stall detection?** With no position sensing, current is the only signal that something is trapped. Cheap to add while the board is still being revised.
- [ ] **Which chair control systems beyond LiNX matter?** Both named users are on LiNX, so this is a question about recruitment, not about step 1.
