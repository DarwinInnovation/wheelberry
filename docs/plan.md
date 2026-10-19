# Wheelberry: the plan

Proposed 19 October 2026, after a restart. **This is the plan.** It supersedes `spec.md` and `requirements.md`, which describe a different and much larger project — see [What is parked](#what-is-parked) at the end.

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

**The trial users, and nobody else.** Two or three people, named, who each have: a powered-seating wheelchair on a LiNX control system, a home with some controllable devices in it, and a reason to want this that they can say out loud.

Not "disabled people" as a category. Named people, with their own chairs and their own 2 a.m. problem. Their OT or seating clinician knows what we are doing and has agreed the chair's configured range. Their carer or family knows it is there.

Designing for six user types at once was the main way the previous plan grew. One user type for now: the person in the chair.

## In and out

**In — the proof of concept**

| | What | Why it is in |
| --- | --- | --- |
| Seating control | Tilt, recline, leg rests on a LiNX chair via the Wheelberry Dongle | The differentiator. Nobody else does this accessibly, and the hardware already exists and works |
| Home control | Lights and heating, through Home Assistant where the user has it, or a device's own LAN API where they don't | Low risk, immediately useful, and the thing the user can demo to a friend |
| One accessible screen | An installable web page, driveable by touch, switch, scanning or eye gaze. Few, large targets | Without this the rest is unreachable, which is the entire point of the project |
| The chair's own switches | The existing input module, so a chair button can trigger a Wheelberry action | Cheapest accessible input there is: it is already mounted where they can reach it |
| Works with no internet | The hub is in the home and needs nothing outside it | A light switch that depends on a cloud is not a light switch |

**Out — for now, deliberately**

Cloud and remote access. The management portal. Alexa, Siri, Google. The MCP server and AI control. Phone app. Beds and hoists. Multi-home and organisational management. Per-user permission matrices. Audit retention policy. Anything with the word "platform" in it.

Each of these is a good idea with a worked-out design already sitting in `docs/`. None is needed to find out whether a disabled person can tilt their own chair.

## The safety rules — all of them

Seating moves a person's body. That cannot be cut down, so it is stated in five lines rather than forty requirements:

1. **Hold-to-run.** Movement happens only while a human is actively holding the control. Release stops it.
2. **The watchdog is in the firmware.** The output module releases every output if commands stop arriving — 300 ms, already built, already unit-tested. No timing-critical safety logic lives in the hub.
3. **Nothing moves unattended.** No schedules, no automations, no routines that move a person. Not in the proof of concept.
4. **The chair's own limits stay in force.** Range is set in LiNX at installation by the installer, with the user's clinician. Wheelberry cannot exceed it and never claims to enforce a position it cannot measure — there is no position sensing.
5. **The user can always stop it, and so can anyone in the room.** Releasing the control, the chair's own controls, and power.

Those five hold from the first time a chair moves. They are cheap because the firmware already does the hard part.

Beyond them: before any trial user sits in a moving chair, someone other than the person who wrote the code watches it move through its whole range, repeatedly, with the power pulled at random points. Not an independent safety review with a report — one afternoon, a bench, and a second pair of eyes.

## Build order

Four steps. Each one ends with something that works in front of a person.

1. **The hub drives the chair.** The existing dongle and firmware, a small computer on the chair, hold-to-run from a web page on the home network. This is the test site grown into something installable. Done when: Richard can tilt a chair from a phone, and pulling the USB cable mid-move stops it.
2. **The screen becomes usable by the trial user.** Their input method, their layout, their words. Built with them, not for them. Done when: they do it unaided, twice, without being shown how.
3. **The home devices join.** Lights and heating alongside the seating, in one layout, same screen. Done when: one action list covers the chair and the room.
4. **It lives in their home for a month.** Installed, unsupervised, with a way to tell us when it breaks. Done when: we have a month of their experience and know what to build next.

No dates. Step 1 is weeks of work on hardware that already exists; steps 2 and 4 are gated by a real person's availability, not by us.

## Open source, as a practice

Open source is in the mission, so it is how we work, not a licence file added later:

- **Public from the start**, including the parts that are embarrassing. The dongle PCB, the firmware and the hub.
- **A README a non-programmer can act on**: what this is, who it is for, what it cannot do, and what it costs to build one.
- **Buildable by someone who is not us** — a parts list and a flashing procedure. The first external build is a real milestone and the strongest signal the project is alive.
- **Developed in the open**: decisions in the repo, as short notes, where a contributor or a sceptical OT can read them.

Two things to settle before going wide: the **licence**, and the **personal email address** already committed in the public monorepo's `apps/proxy/cfg/wheelchair.json5` and `apps/proxy/cfg/blanket.json5` and in its git history. The second is live now, not later, because those repositories are already public.

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

If the answer is yes for two or three people, there is a project here and the parked material becomes the roadmap. If it's no, the reason will be specific, and worth more than everything in `docs/` put together.

## What is parked

The work between 11 and 18 October produced five documents, roughly 1,300 lines, worked in real depth: movement semantics, the Home Assistant decision, requirements, audit retention, and the spec review. The thinking is sound. The scale is wrong for a project with no users — it describes the regulated product Wheelberry becomes if the proof of concept succeeds.

So it is kept, not deleted, and not live:

| Document | What it is worth later |
| --- | --- |
| `movement-semantics.md` | The source of the five safety rules above, plus the full analysis for when unattended movement and AI control return |
| `home-assistant-decision.md` | Settles standalone-versus-add-on and the backend-adapter boundary. Still correct, still needed |
| `requirements.md` | The requirement register for a funded product; the traceability matrix is reusable as-is |
| `audit-retention.md` | Becomes necessary the week remote access or an organisational customer appears |
| `spec.md` | The six-milestone plan this document replaces |

Nothing in them is contradicted by this plan. They are ahead of it.

## Open items

- [ ] **Who are the trial users?** Open since 11 October and now the only thing that actually blocks step 2.
- [ ] **The hub's language.** The existing test site is Python and already drives the dongle with the watchdog model we are keeping. The earlier spec chose TypeScript on Node with SQLite. Growing the Python is faster to a working chair; TypeScript is where the web and later channels live. One or the other, not both.
- [ ] **Licence**, for software and for hardware designs.
- [ ] **The personal email in public git history** — remove from history, or accept it.
- [ ] **Does the dongle or LiNX path expose motor current or stall detection?** With no position sensing, current is the only signal that something is trapped. Cheap to add while the board is still being revised.
- [ ] **Which chair control systems beyond LiNX matter**, if the trial users aren't all on LiNX.
