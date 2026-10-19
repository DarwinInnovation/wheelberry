# Wheelberry: the plan

Proposed 19 October 2026 after a restart, and **adopted the same day** with five decisions: the proof of concept moves a seat *and* controls home devices; the first two trial users are named; the licence is Apache-2.0; the earlier documents are parked in [`background/`](background/); and the hub grows from the existing Python test site rather than being rewritten.

Five more the same afternoon: the bench observer is named; **timed runs are back in**, so seating is not limited to people who can hold a control; the hardware licence is deferred and the PCB repository stays private; the hub and firmware publish once the observed bench check has passed; and the personal email address has been rewritten out of this repository's history.

Four more that evening, and one of them moves real work: **Mike cannot reliably hold a control**, so timed runs are on step 2's critical path rather than waiting for a recruited tester; the firmware's per-channel timeout turns out to be the watchdog rather than the energise cap timed runs need; the entity is **Darwin Innovation Ltd**; and the email address stays in `bedberry`. See [Settled on 19 October](#settled-on-19-october).

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
- **The second pair of eyes for the bench check is Ben Miller-Smith**, Richard's father. The rule below is that someone other than the person who wrote the code watches the chair move, and with Richard both writing the hub and sitting in the chair, that person had to be named. He is not a trial user and does not need to be: what the role requires is that he has not read the code and will say what he actually saw.

Not "disabled people" as a category: two named people with their own chairs and their own 2 a.m. problem, with their OT or seating clinician aware of what is going on and agreeing the chair's configured range. Designing for six user types at once was the main way the previous plan grew.

## In and out

**In — the proof of concept**

| | What | Why it is in |
| --- | --- | --- |
| Seating control | Tilt, recline, leg rests on a LiNX chair via the Wheelberry Dongle | The differentiator. Nobody else does this accessibly, and the hardware already exists and works |
| Home control | Lights and heating, through Home Assistant where the user has it, or a device's own LAN API where they don't | Low risk, immediately useful, and the thing the user can demo to a friend |
| One accessible screen | A web page on the home network. Few, large targets. Any input method reaches everything, including seating: held inputs by hold-to-run, dwell and scanning by [timed runs](#timed-runs-and-what-they-cost) | Without this the rest is unreachable, which is the entire point of the project |
| The chair's own switches | The existing input module, so a chair button can trigger a Wheelberry action. **Already built** | Cheapest accessible input there is: it is already mounted where they can reach it |
| Works with no internet | The hub is in the home and needs nothing outside it | A light switch that depends on a cloud is not a light switch |
| A passcode on the hub | One shared secret per hub, no accounts, no roles | Today anyone who can reach the port can move the chair. Required before step 4, not before step 1 |

**Out — for now, deliberately**

Cloud and remote access. The management portal. Alexa, Siri, Google. The MCP server and AI control. Phone app. Beds and hoists. Multi-home and organisational management. Per-user permission matrices. Audit retention policy. Anything with the word "platform" in it.

Each of these is a good idea with a worked-out design already sitting in [`background/`](background/). None is needed to find out whether a disabled person can tilt their own chair.

## The safety rules — all of them

Seating moves a person's body. That cannot be cut down, so it is stated in five lines rather than forty requirements:

1. **A stop the user can reach, for the whole of every move.** Two modes and no others: **hold-to-run**, where release stops it, and a **timed run**, where one action starts a bounded move and the user stops it — under the conditions in [Timed runs](#timed-runs-and-what-they-cost). Hold-to-run is preferred by anyone who can use it.
2. **The watchdog is in the firmware.** The output module releases every output if commands stop arriving — 300 ms, already built, already unit-tested. No timing-critical safety logic lives in the hub, though the 300 ms itself is a number the hub sends rather than one the firmware keeps. It is a complete backstop for hold-to-run and **not** for a timed run; see below, because that is the one place the restart's safety story needed new work rather than less.
3. **Nothing moves unattended.** No schedules, no automations, no routines that move a person. A timed run is *attended* — the user is there with their finger, eye or switch on the stop — and reopening it does not reopen schedules.
4. **The chair's own limits stay in force.** Range is set in LiNX at installation by the installer, with the user's clinician. Wheelberry cannot exceed it and never claims to enforce a position it cannot measure — there is no position sensing.
5. **The user can always stop it, and so can anyone in the room.** The stop control, the chair's own controls, and power.

Those five hold from the first time a chair moves. Four of them are cheap because the firmware already does the hard part. Rule 1's second mode is the one that costs something, and the next section is why.

**Rule 5 is the one the code does not yet honour.** Two phones can hold the same output, and one releasing does not stop the other's command stream — so "anyone in the room can stop it" is currently true of the chair's own controls and of the power, but not of Wheelberry. It is task 9 in [`step-1-tasks.md`](step-1-tasks.md): a small fix, stated in the rules as though already true, and now also a precondition for timed runs rather than only a tidy-up.

Beyond them: before any trial user sits in a moving chair, **Ben Miller-Smith** watches it move through its whole range, repeatedly, with the power pulled at random points. Not an independent safety review with a report — one afternoon, a bench, and a second pair of eyes.

### Timed runs, and what they cost

Hold-to-run and a screen driveable by eye gaze cannot both be true for seating. A dwell-click is a click, not a hold: the user selects, the selection is over, and there is no held state left to release. Faced with that, the first draft of this plan restricted seating to hold-capable inputs and accepted that a user who can hold nothing would drive their seat from the chair's own switches or not at all.

**That was rejected on 19 October, and rightly.** It excluded exactly the people the project exists for, on the grounds that including them was expensive. So **timed runs are in the proof of concept**: one action starts a move, the move runs for a bounded time, and the user stops it. Home devices continue to need none of this — a light is one-shot and any input drives it.

What makes a timed run acceptable, carried over from [`background/movement-semantics.md`](background/movement-semantics.md) where it was worked out in full:

1. **A run-time cap per axis**, agreed with the user's clinician, short enough that the whole run is a mistake you can live with.
2. **A stop reachable by the user's own input method, with no confirmation step** — and so, during a run, **the whole screen is the stop**. Nothing else is on it. For a dwell user the stop is wherever they are already looking; for a scanning user there is one item to land on. A stop you have to navigate to is not a stop.
3. **Nominal names only.** "Tilt back", never "tilt to 20°". There is no position sensing, so the second one is a claim we cannot make.
4. **Off by default, enabled per user and per axis**, with hold-to-run preferred for anyone who can use it.
5. **One axis at a time.** No composite moves.

**The hard part is that the firmware watchdog stops being the backstop.** In hold-to-run, every hub failure converges on safe: the hub stops resending, and the output module releases everything within 300 ms. A timed run inverts that — the hub is *deliberately* resending with nobody holding anything, so a timer that never fires looks exactly like normal operation, and the watchdog is being fed by the very bug it would otherwise catch. A timed run therefore needs a bound that does not live in the same code path as the resend loop. That bound belongs in the output module firmware, outside the hub entirely, and it closes the two-controller hole in rule 5 as a side effect.

**Asked and answered on 19 October — and the answer needs one correction, made by reading the firmware rather than taking the memory.** There *is* a per-channel timeout in the output module, and it is what makes the 300 ms watchdog work. But it is **not a cap**, and a timed run needs a cap:

- The timeout is a field of each command — `D:<n>:<v>:<m>`, where the *host* supplies `m` — and every command for a channel cancels and re-arms that channel's timer. The hub sends `m=300` and resends every 100 ms, which is precisely the 300 ms watchdog. There is no second, independent limit underneath it: `m=0` means permanent, there is no maximum, and nothing tracks how long a channel has been energised.
- So the resend loop re-arms the very timer that would catch it. **The firmware timeout is a bound on hub silence, not on movement** — exactly the distinction a timed run turns into a safety property.

The bound therefore has to be built, and it is small, because the parts are there: the module already keeps one one-shot timer per channel (six digital, two analogue enables), with its own critical sections and a fault stop that releases everything. The shape of it is written up as [task 14](step-1-tasks.md#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet): a maximum continuous energise time per channel, timed from the OFF→ON transition, **not** re-armed by repeat commands, forcing the channel off at the cap and **latching it off until an explicit off arrives.** The latch is the whole of it: without one the hub's next resend 100 ms later re-energises the output, and the cap is a duty-cycle limiter rather than a stop.

Two notes alongside it, both of which improve the system as it stands rather than only enabling timed runs:

- **The 300 ms watchdog is a number the hub supplies, not a constant the firmware keeps.** A hub that sent `m=0` on an assert would switch it off for that channel and nothing downstream would notice. Today's hub does not — it sends `m=0` only on deassert, which was checked rather than assumed — but a firmware cap is what makes that class of bug survivable instead of silent.
- **The fallback is worse and is not being taken.** A separately scheduled hard stop inside the hub shares a process with the fault it exists to catch.

Two further consequences, both cheap to state now and expensive to discover later:

- **A timed run ends where the clock says, not where the user says.** Combined with the fact that power loss or a mid-run stop leaves an axis anywhere in its travel, the clinical question per axis is not "is the target safe" but **"is this axis's whole configured travel safe to be left in?"** Where the answer is no, the remedy is narrowing the chair's range at install, or no timed run on that axis. That is a conversation with Richard's seating clinician, not a setting.
- **Stop latency depends on the input method.** A finger releases in milliseconds; a dwell stop costs a fixation, a scanning stop costs a scan step. So the run-time cap is set per user *and* input method, not per axis alone, and the measured stop time for that user's actual input is what justifies the cap.

**When it gets built: step 2, and it is now on the critical path rather than a contingency.** The trigger was "the first trial user who cannot comfortably hold a control", and on 19 October that fired: **Mike cannot hold one reliably.** Richard can, so step 1 still needs none of this and nothing above changes. But step 2 does, in two ways worth saying plainly:

- **Step 2 is no longer "a screen".** It is a screen, plus a new movement mode, plus the firmware cap that mode depends on, plus a second observed session with Ben, plus the whole-travel judgement with a clinician. Each is small; together they are most of step 2, and the done-when — Mike moves his own seat unaided, twice — is not reachable without all of them.
- **The cheap fallback is closed too.** The chair's own switches were the answer for someone who cannot use a touchscreen, but the input module fires on a *held* LOW (4 s by default), so it is another hold. For Mike it is not a way round timed runs.

What is still unknown is what Mike *can* do — dwell, scanning, a switch tap, something else. That is the next thing to find out, because the measured stop time for his actual input is what sets the run-time cap, and nothing is sized until it is known. Timed runs get their own observed bench check with Ben before anyone sits in a chair under one: the afternoon described above covers hold-to-run, and a new mode needs new watching.

## Build order

Four steps. Each one ends with something that works in front of a person.

1. **The hub drives the chair — largely built already.** The Python test site does hold-to-run on six seating outputs over a WebSocket today, with the 300 ms firmware watchdog, a 100 ms resend, release on pointer-up, tab switch, network loss and power loss, a systemd unit, and a `--test` mode that runs with no hardware attached. The chair's own switches are in it too. So step 1 is to **verify that on a chair and close a short list of gaps**, not to build it — the list is in [`step-1-tasks.md`](step-1-tasks.md). Done when: Richard can tilt a chair from a phone, and pulling the USB cable mid-move stops it.
2. **The screen becomes usable by the second user.** Mike's input method, Mike's layout, Mike's words. Built with them, not for them. **Mike cannot reliably hold a control, so this is also where [timed runs](#timed-runs-and-what-they-cost) are built, observed and enabled** — the firmware cap first, then the mode, then a second session with Ben. That makes step 2 the longest of the four, and the one where the safety work actually is. Done when: they do it unaided, twice, without being shown how.
3. **The home devices join.** Lights and heating alongside the seating, in one layout, same screen. Done when: one action list covers the chair and the room.
4. **It lives in their home for a month.** Installed, unsupervised, with a way to tell us when it breaks. Done when: we have a month of their experience and know what to build next. The hub needs a passcode before this step: a home network is not a trusted network, and today anyone who can reach the port can move the chair.

No dates. **Step 1 is days of verification rather than weeks of building** — the single biggest change the restart produced, and it came from reading the existing code rather than from planning. Steps 2 and 4 are gated by another person's diary, not by us.

## Open source, as a practice

Open source is in the mission, so it is how we work, not a licence file added later:

- **Public, including the parts that are embarrassing** — the hub and both firmwares, **once the observed bench check has passed.** Decided 19 October: "from the start" lost to the fact that what we are publishing is code that moves a person's body, and publishing it before anyone other than its author has watched it do so invites someone to run it on a chair on the strength of our say-so. The gate is one afternoon away, not one milestone away.
- **A README a non-programmer can act on**: what this is, who it is for, what it cannot do, and what it costs to build one.
- **Buildable by someone who is not us** — a parts list and a flashing procedure. With the board files staying private (below), an external build needs a dongle from us, so the honest form of this is: everything needed to build one *except the board*, and we send the board. The first external build is still the strongest signal the project is alive; it is now a build we have to help with.
- **Developed in the open**: decisions in the repo, as short notes, where a contributor or a sceptical OT can read them.

### The licence

**Apache-2.0 for the software** — permissive, with an explicit patent grant, which matters for a project that touches hardware. It lets a wheelchair manufacturer ship Wheelberry inside a closed product without contributing anything back, and that was chosen knowingly: for this product, being adopted by the people who already sell chairs is worth more than copyleft leverage. `LICENSE` is in this repository, and as of 19 October its copyright line reads **Darwin Innovation Ltd** — the registered company, which is the name every repository published from here should carry.

The **hardware** designs need a different licence — Apache-2.0 is written for source code and does not fit a PCB. **Deferred on 19 October, with `pcb_wheelberry_dongles` staying private** until it is settled, which is the one combination that carries no risk: an unlicensed public board file is all-rights-reserved whatever the README says. CERN-OHL-P remains the permissive match when the question is taken up. Worth knowing when it is: the organisation already publishes hardware — `bedberry` ("Open source PCB for bed/chair control") and the `wheelberry.pretty` KiCad library are both public under **MIT**, so the precedent exists and the choice is really whether to keep using it. `bedberry`'s 2022 copyright line says "DarwinInnovation" rather than Darwin Innovation Ltd; it is wrong and it is being left alone with the rest of that repository, but the new licence is the one to copy, not that one. MIT and Apache-2.0 sit together fine; Apache-2.0's patent grant is the reason to prefer it for new code.

### What is public today is the parked work; what is private is the live work

That is backwards, and it is the practice above being a word rather than a habit:

| Public | Private |
| --- | --- |
| `wheelberry` — this monorepo: the TypeScript proxy, Alexa skill and portal. All of it parked | `wheelberry_dongle_http_test_site` — Python, the hub this plan is built on |
| `bedberry`, `bedberry_splitter`, `wheelberry.pretty`, `wheelberry_hat`, `wheelberry-travelling`, `node-wheelberry-i2c`, `di-ha-addons` | `firmware_wheelberry_output_module` — C, where the 300 ms watchdog lives |
| | `firmware_wheelberry_input_module`, `pcb_wheelberry_dongles`, and seven parked `node-wheelberry-*` and travelling-app repositories |

Of sixteen Wheelberry-named repositories, five are public and none of the five is live work. The three the proof of concept depends on — the hub and both firmwares — publish **once the observed bench check has passed**; that is task 12 in [`step-1-tasks.md`](step-1-tasks.md), with a date attached to a gate rather than to a someday. `pcb_wheelberry_dongles` stays private pending its licence.

**Richard's personal email address is out of this repository, as of 19 October**, and is not quoted anywhere in these documents, because quoting it was part of the problem. It was committed in `apps/proxy/cfg/wheelchair.json5` and `apps/proxy/cfg/blanket.json5` on `main` — two files, not the three an earlier draft claimed; `apps/proxy/README.md` never contained it — and written out in full in two of the parked documents in `background/`, which is this review having republished the thing it was reporting. History has been rewritten across all three branches (`main`, `rework`, `docs/spec`) and force-pushed, so it is gone from every branch, from anyone's future clone, and from GitHub's code search. Three things that are not finished:

- **The old commits are still fetchable from GitHub by their SHA**, which was verified rather than assumed: GitHub keeps unreachable objects until it garbage-collects, and a rewrite does not trigger that. Closing it properly means asking GitHub Support to purge them. The practical exposure is small — the address was never in a pull request diff, so a reader would have to know an old SHA — but "rewritten" is not the same as "unavailable" and the difference is worth stating.

- **`bedberry` is public and still carries it**, in `software/cfg/okinRemote.json5` — and **it is deliberately being left there, decided 19 October.** The honest consequence, since the point of the rewrite was to get the address out of code search: it is still in code search. One query across the organisation still returns it. What the rewrite bought is that the address no longer arrives with a clone of *this* repository, which is the one about to be read by strangers; it did not make the address private. Worth revisiting the next time `bedberry` is touched for any other reason, and before anything that draws attention to the organisation.
- `node-wheelberry-proxy` carries it too, in `cfg/wheelchair.json5` and `cfg/blanket.json5`. It is private, so there is no exposure today — but it is a reason to check rather than assume before anything else is flipped public.

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
| [`background/movement-semantics.md`](background/movement-semantics.md) | Already drawn on: the five safety rules and the timed-run conditions both come from here. Still holds the analysis for when unattended movement and AI control return. The most useful of the six by a distance |
| [`background/home-assistant-decision.md`](background/home-assistant-decision.md) | Settles standalone-versus-add-on and the backend boundary: exactly one backend owns a device at a time. Still correct, and still the design this plan assumes |
| [`background/requirements.md`](background/requirements.md) | The requirement register for a funded product; the traceability matrix is reusable as-is |
| [`background/audit-retention.md`](background/audit-retention.md) | Becomes necessary the week remote access or an organisational customer appears, and three of its constraints cannot be retrofitted once records exist |
| [`background/spec.md`](background/spec.md) | The six-milestone plan this document replaces |
| [`background/spec-review.md`](background/spec-review.md) | How the five contradictions were found. Its item 5 — the existing-work truth pass — was never finished; the repository half of it is done above |

Nothing in them is contradicted by this plan. They are ahead of it.

## Settled on 19 October

Trial users (named above), the hub's language (**Python**, growing the existing test site — the earlier spec's TypeScript choice is withdrawn), the software licence (**Apache-2.0**), the scope of the proof of concept (**seating and home control**), and where the old documents live (**`background/`**).

Then, the same afternoon: the **bench observer** (Ben Miller-Smith), **timed runs in scope** so that seating is reachable by any input method, the **hardware licence deferred** with the PCB repository staying private, **publication gated on the observed bench check**, and the **email history rewritten**.

And four that evening, of which the third moves the most work:

| | Settled |
| --- | --- |
| The legal entity | **Darwin Innovation Ltd**, now the copyright line in `LICENSE` |
| `bedberry`'s copy of the email address | **Left in place**, with the residual exposure stated above rather than quietly dropped |
| **Mike cannot reliably hold a control** | Timed runs move onto step 2's critical path, and the chair's own switches do not substitute |
| The firmware energise cap | A per-channel timeout **exists but is not a cap** — the bound a timed run needs is new firmware work, scoped as task 14 |
| Full travel, slowest axis | **20 to 40 s** from recollection, which sizes task 14's cap at a provisional 90 s per channel. Phase 1 measures it |
| Task 14 and task 9 | **Specified and held.** Planning only until phase 1 has been done on a chair |

## Open items

- [ ] **Build the firmware energise cap** — [task 14](step-1-tasks.md#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet). Answered on 19 October and the answer changed the job: the per-channel timeout exists, but it is the watchdog, re-armed by every resend, so the cap a timed run needs is new firmware work. Small, testable in the existing host harness, and the first thing in the timed-run chain. **Specified and held, not started** — along with task 9, the two-controller stop. Both are the only work here that waits on nobody, and both are held by choice until phase 1 has been done on a real chair, which is the right order: phase 1 produces the measured travel time the cap is sized from, and the bench check is what task 9 is a precondition for.
- [ ] **What input method does Mike actually use?** He cannot reliably hold, which is settled. What he *can* do is not, and it sets the measured stop time, which sets the run-time cap, which sizes everything else. One conversation, and the slowest thing it unblocks.
- [ ] **Run-time caps, and the whole-travel judgement per axis**, with Richard's seating clinician. Needed before timed runs are enabled, not before they are written.
- [ ] **Who recruits testers, and through whom?** Starts now, in parallel with step 1, because it is the slowest thing on the list.
- [ ] **Ask GitHub Support to purge the unreachable objects** in this repository, which is the only way to make the rewritten commits actually unfetchable. Lower value than it was, now that the same address stays readable in `bedberry` by choice.
- [ ] **Can the screen actually be *installed* on the trial users' own tablets over plain HTTP?** A service worker needs a secure context, which a LAN address over HTTP is not. iOS add-to-home-screen works without one; Android Chrome's install prompt does not appear. Verify on the real device before promising anything offline — or drop "installable" and use a bookmarked full-screen page.
- [ ] **Does the dongle or LiNX path expose motor current or stall detection?** With no position sensing, current is the only signal that something is trapped. Cheap to add while the board is still being revised.
- [ ] **Which chair control systems beyond LiNX matter?** Both named users are on LiNX, so this is a question about recruitment, not about step 1.
