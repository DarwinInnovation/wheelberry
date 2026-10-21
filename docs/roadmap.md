# Wheelberry: the development path

20 October 2026, amended 21 October. The milestones, in order, in plain English.

This is the companion to [`plan.md`](plan.md). The plan says *what we are proving and why*; this says *what gets built, in what order, and how you will know each one is finished*. If the two ever disagree, the plan wins on intent and this wins on sequence.

No dates. Several milestones are gated by another person's diary — a clinician, a bench afternoon, a trial user's week — and a date on those would be a guess dressed up as a commitment. What each one is gated by is written down instead.

## How to read a milestone

Each one answers the same five questions:

| | |
| --- | --- |
| **What it is** | One or two sentences, no jargon |
| **Why it matters** | What it buys, for whom |
| **For example** | A real scene. If a milestone cannot be described as something a person does on a particular evening, it is not a milestone |
| **Done when** | A test somebody else could apply, that can come back "no" |
| **Needs first** | What has to exist, and who we are waiting on |

Milestones 1 to 6 are the proof of concept. Everything after milestone 6 depends on the proof of concept having worked, so those are sketched rather than specified.

---

## Milestone 1 — The chair moves from a phone

**What it is.** A small computer in the home, plugged into the wheelchair through the Wheelberry Dongle, with a web page on the home network that tilts and reclines the chair. Hold a button, the chair moves. Let go, it stops.

**Why it matters.** It is the whole hardware path, end to end, proved on a real chair. Nothing else can be trusted until this is.

**For example.** Richard opens a page on his phone, presses and holds "tilt back", and the chair tilts. He lifts his finger and it stops. He pulls the USB cable out while it is moving, and it stops.

**Done when.** Richard can tilt the chair from a phone, and pulling the USB cable mid-move stops it.

**Needs first.** Nothing from us. **This is mostly already built** — the existing Python hub does all of the above today, so milestone 1 is verification on a real chair plus a short list of gaps. The work is listed as phases 1 to 3 of [`step-1-tasks.md`](step-1-tasks.md). It is gated by one afternoon with Ben Miller-Smith watching, which is the gate on anyone sitting in a chair that Wheelberry moves.

**One thing goes in ahead of it**, decided 20 October: the firmware pass, [tasks 14 and 15](step-1-tasks.md#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet). So phase 1 and Ben's afternoon exercise the firmware that will actually ship, rather than the version it replaces — one bench visit instead of two. **It is written**: branch `energise-cap-and-open-drain`, commit `3514fef`, host harness green, open as PR #2 and not merged, not flashed.

---

## Milestone 2 — The screen works for someone who did not build it

**What it is.** The same chair control, but driven by Mike — whose input method is not a finger on a touchscreen, and whose words for the controls are not ours. Because Mike cannot reliably hold a control, this is also where **timed runs** are built: one action starts a short move, and the user stops it.

**Why it matters.** This is the first real evidence. Richard knowing where every button is proves the hardware works; it proves nothing about whether the thing is usable. Milestone 2 is where the claim in the plan gets tested for the first time.

**For example.** Mike looks at "tilt back" on a tablet and dwells on it. The chair starts to tilt and the whole screen becomes one large STOP. He looks away from it to where he wants, then back at the screen, and the chair stops. Nobody else is in the room.

**Done when.** Mike moves his own seat the way he wants it, unaided, twice, without being shown how.

**Needs first.** Milestone 1, and four things that are not a screen:

- The **firmware energise cap** — a hard limit on how long any one output can stay live, built into the dongle rather than the hub ([task 14](step-1-tasks.md#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet)). **Written 20 October and sized at 30 s on 21 October** from the measured travel times, awaiting review, merge and the bench.
- The **open-drain firmware change** ([task 15](step-1-tasks.md#15-the-open-drain-change-what-on-means-on-v2-hardware)), done in the same pass.
- The **two-controller stop** in the hub ([task 9](step-1-tasks.md#9-two-controllers-at-once-safety)), so that a stop stops everyone's commands and not just your own. **Hold lifted 21 October, now being built**, and it belongs before phase 3 rather than before milestone 2.
- **Which axes may run on a timer**, judged by Richard's seating clinician, plus a second observed session with Ben.

**This is the longest of the six**, and the one where the safety work actually is. The single thing still unknown is what Mike *can* use — dwell, scanning, a switch tap — because the measured time it takes him to stop a run is what sets how long a run is allowed to be.

---

## Milestone 3 — The lights and the heating join in

**What it is.** Wheelberry learns to switch lights and adjust heating as well as move the chair, so one screen covers both. Through Home Assistant where the user already has it, or straight to a device on the home network where they do not.

**Why it matters.** It is the first thing the user can show a friend, it carries no safety risk at all, and it is where most of the daily usefulness lives. Moving your own chair matters once a night; turning your own light off matters every night.

**For example.** It is 2 a.m. Richard wakes up uncomfortable. On one screen he tilts the chair back a little and turns the bedside lamp on, sorts himself out, and turns the lamp off again. He does not wake anybody.

**Done when.** One list of actions covers the chair and the room, and adding a second lamp needs a line of configuration rather than a code change.

**Needs first.** Milestone 1. Independent of milestone 2 — these can be built in either order, or at the same time.

---

## Milestone 4 — Ask for it out loud

**What it is.** Voice control of the lights, heating and anything else in the room. **Not the chair** — see [Why voice and AI stop at the door of the chair](#why-voice-and-ai-stop-at-the-door-of-the-chair).

**Why it matters.** For some users speech is the most reliable thing they have, and for nearly everyone it is the quickest. It is also, bluntly, the feature that makes people want this: "turn the light off" is a sentence everybody already knows how to say, and it needs no screen, no aiming and no reaching.

**For example.** Mike says "turn the bedroom light off." It goes off. He did not have to find a tablet, wake it, unlock it or aim at anything.

**Done when.** A trial user turns at least two devices on and off by voice on their first attempt, using their own words — and a request to move the chair **fails loudly rather than silently**, with the user left in no doubt that Wheelberry will not do it.

**Needs first.** Milestone 3, **the hub passcode** ([task 10](step-1-tasks.md#10-a-passcode-now-before-milestone-4-not-milestone-6)), and — settled 21 October — **a cloud service of our own**: an endpoint outside the house, an account link, and a skill through somebody else's certification queue.

**The path is decided: a cloud assistant first — Alexa or Google — not an on-hub recogniser.** Richard's decision, 20 October: least work, it reaches hardware people already own, and there is existing Alexa work to draw on. It also means voice-driven seating stays at milestone 7, because only a recogniser inside the house could ever carry a stop.

**And it is our own skill and endpoint, not Home Assistant's cloud.** Richard's decision, 21 October. Nabu Casa would have needed no endpoint, no account linking and no data of ours — but it only reaches users who already run Home Assistant, which is precisely the install milestone 3 goes out of its way to support, and it would leave the existing Alexa work unused. So the "we hold nothing" answer ends at milestone 4, deliberately and with the price known.

Three consequences:

- **Darwin Innovation becomes a data controller, inside the proof of concept.** No longer a maybe. The data is small and nameable: the email address and display name the assistant account gives us, its provider ID, and **the mapping from that account to one hub** — which *is* the account link, the thing that makes "turn the light off" reach this house and not another one. A DPIA scoped to that is an open item, and the controller analysis in [`background/audit-retention.md`](background/audit-retention.md) is the part of the parked work that comes back. Nothing else in it does.

  **And it can be smaller than what the assistant offers us.** An account link only needs an opaque user identifier and a hub identifier; the email address and the name are what Amazon hands over, not what the link requires. The parked proxy keyed on email because its user-to-hub map was a file somebody had to edit by hand. Starting from an opaque ID means the DPIA covers "which hub does this account open" and nothing else — the cheapest version of this to hold, and only cheap if it is chosen before the schema is written.
- **The refusal is only half ours, and which half depends on the skill type** — the one piece of the voice decision still open, below. The chair is not exposed to the assistant at all, so under a smart-home skill "tilt me back" comes back as Amazon's "I can't find a device called chair", which is indistinguishable from a broken setup and invites the user to try harder. A custom skill keeps every word ours and costs an invocation name in every sentence. Until that is settled the done-when asks for *no silent failure* rather than naming who speaks.
- **Voice is the one part of Wheelberry a stranger cannot self-host by cloning it.** A cloud skill needs a developer account, a published skill and a reachable endpoint; a smart-home skill also needs an AWS Lambda, which is how Home Assistant's own cloud-free Alexa setup works. So an external builder either uses our service or stands up their own. Everything else in this project is "here is the parts list"; this part is not, and the README should say so rather than let somebody find out.

**Most of the plumbing already exists, in the parked monorepo.** `apps/proxy` in the public `wheelberry` repository is a cloud Alexa proxy: devices in the home connect **outbound** over Socket.IO, so nothing has to be opened into the house; Login with Amazon and Google identify the user against a whitelist; device tokens are stored hashed. That is milestone 4's architecture, already written — the one piece of parked *code* this decision brings back. What is not reusable is its skill model, for the reason in [milestone 7](#beyond-the-proof-of-concept).

**The one thing still open is the skill type:** a smart-home skill, where the user says "Alexa, turn the bedroom light off" and the phrasing is Amazon's, or a custom skill, where they say "Alexa, tell Wheelberry to turn the bedroom light off" and every word including the refusal is ours. It is in [Open questions](#open-questions). Milestone 4's done-when — two devices, first attempt, their own words — leans towards smart-home; the loud refusal leans towards custom; shipping both is possible and is two submissions.

---

## Milestone 5 — An AI assistant can use it

**What it is.** An MCP server in front of the hub, so an AI assistant can see what devices exist, read their state, and switch the non-movement ones. **Not the chair**, for the same reason as milestone 4.

**Why it matters.** Two reasons, and the second is the bigger one. For the user, an assistant handles the requests a button cannot: "it's cold in here", "I'm going to bed", "did I leave the hall light on?" For the project, this is how a technically-minded stranger gets interested — an open hub with an MCP server is something people want to plug things into, and that is how an open-source project acquires contributors it did not recruit.

**For example.** Richard says to an assistant "I'm going to bed" and it turns off the downstairs lights, drops the heating and tells him the back door sensor is still open. It does not touch the chair, and it says so if asked to.

**Done when.** An assistant completes a plain-English household request end to end, every action it took is listed where the user can see it afterwards, and a movement request comes back as an explicit refusal.

**Needs first.** Milestone 3. Small — the hub already has the API this wraps.

---

## Milestone 6 — It lives in their home for a month

**What it is.** Installed properly, left alone, used daily by someone who is not us, with a way to tell us when it breaks. A passcode on the hub before this one: a home network has guests' phones and a television on it, and today anyone who can reach the port can move the chair.

**Why it matters.** It is the only milestone that produces an answer rather than a feature. Everything before it shows the thing can work; this shows whether it gets used.

**For example.** Four weeks later Mike says which three things he now does by himself that he used to ask for, which two things he tried once and never again, and whether he would mind if we took it away.

**Done when.** A month of somebody's actual life has gone past, and we can say what they used daily, what they abandoned, and what broke — and they have answered one question plainly: **would you keep it?**

**Needs first.** Milestones 2, 3, **4 and 5**, the hub passcode ([task 10](step-1-tasks.md#10-a-passcode-now-before-milestone-4-not-milestone-6)), and a repeatable install.

**Voice and AI go in before the month, not during it** — Richard's decision, 20 October: if voice is what attracts users, the month should be testing it. That is the right call for the evidence and it has one cost worth stating plainly, because it is the cost of every "before": **this is the only milestone that produces an answer rather than a feature, and two more milestones now stand in front of it.** One of them, milestone 4, has an external dependency we do not control — a developer account and a skill submission sit in somebody else's queue. If that queue is what is holding up the month, that is the moment to ask whether the month should start anyway.

---

## Beyond the proof of concept

Everything below is a destination, conditional on milestone 6 coming back "yes". Listed so the direction is visible, not scheduled.

| | What | The hard part |
| --- | --- | --- |
| 7 | **Voice and AI reach the chair** | A stop that works when your input is speech and the assistant is in the cloud. Worked out in full in [`background/movement-semantics.md`](background/movement-semantics.md), which treats an assistant as nobody being present |
| 8 | **A second chair control system** | Both current users are on LiNX. Another system means another dongle mapping, and possibly another safety story |
| 9 | **Beds, and the rest of the room** | `bedberry` already exists for this and is where angle sensing lives |
| 10 | **The carer and clinician portal** | In the mission from the start. Needs accounts, roles and remote access — and the moment remote access exists, the data-protection work parked in [`background/audit-retention.md`](background/audit-retention.md) becomes live |
| 11 | **Sold, or offered to care providers** | The regulatory gate. See the regulatory section of [`plan.md`](plan.md#regulatory-and-data-protection--noted) |

**Milestone 7 has already been built once, and that is the clearest argument for why it is milestone 7.** The parked Alexa skill in `apps/proxy/cfg/skills/wheelchair.json` is a custom skill called "wheel berry" whose intents are `tilt {direction} for {seconds} seconds`, `recline …`, `lift …`, `leg tilt …`, `leg length …` and "switch chair off". That is voice-commanded **timed seating movement**, spoken to Amazon, routed through a cloud proxy, executed on a chair — and it has no stop intent, no presence check and no cap, because the firmware cap only exists as of 20 October. As one person's own tool on their own chair that was a choice they were entitled to make. It is not what gets offered to somebody else, and milestone 7 is therefore not "point the old skill at the new hub".

---

## Adding a new system: the shape every integration takes

Milestones 3, 4, 5 and 8 are all the same shape — *teach Wheelberry about something it did not know about before*. Writing the shape down once means a new one is a known quantity rather than a fresh argument, and it is what a contributor needs in order to add their own.

Every integration answers these, in this order:

1. **What can it do, in the user's words?** Not the manufacturer's API. "Turn the lamp on", not "set `light.bedroom_1` brightness to 0". If it cannot be said in the words the user already uses, it is not finished.
2. **Can it move a person?** This is the only question that changes the rules. If no, it is an ordinary device and any input method reaches it. If yes, it inherits the whole of the safety rules in [`plan.md`](plan.md#the-safety-rules--all-of-them), including a stop the user can reach for the whole of the move.
3. **Who owns the device?** Exactly one backend talks to any given device — Home Assistant *or* the device's own network API, never both with a failover. Decided in [`background/home-assistant-decision.md`](background/home-assistant-decision.md) and still the rule.
4. **What happens when it is not there?** Unplugged, offline, batteries flat. The answer is never "the screen hangs"; it is a greyed-out control that says why.
5. **How does a refusal look?** A thing Wheelberry will not do must come back as an explicit refusal, distinguishable from not having heard. This matters most for voice and AI, where silence is indistinguishable from failure and the natural response to silence is to try again harder.

**A worked example — a smart plug on the home network.** (1) The user calls it "the fan". (2) It cannot move a person, so any input reaches it: touch, voice, assistant. (3) The user has no Home Assistant, so the hub talks to the plug directly over the LAN and is its only owner. (4) If the plug stops answering, the fan button greys out and says "can't reach the fan". (5) There is nothing to refuse — every capability it has is permitted. Total work: a config entry and a small driver.

**The same example, if it were a seat actuator.** (2) becomes yes, and that single answer pulls in hold-to-run, the firmware energise cap, the clinician's judgement on the axis, an observed bench session, and a stop that is reachable by that user's own input method. This is why the plan keeps saying that seating is the expensive half of a cheap product.

---

## Why voice and AI stop at the door of the chair

Voice and AI are on the path from milestone 4 because they are how this reaches people. They stop short of moving the chair in the proof of concept, and the reason is one line:

> Every movement of a person needs something able to stop it for the whole of the move. A cloud assistant cannot be that thing — the round trip is seconds, and seconds is not a stop.

That is not a prohibition on voice-driven movement forever; it is milestone 7, and the analysis for it already exists. What it rules out is the version that would be easy: exposing the seating controls to Alexa alongside the lights and calling it done.

Two consequences worth knowing now:

- **The split is by transport, not by whether it is "voice".** An on-hub recogniser answers in milliseconds and could carry a stop; Amazon's round trip cannot. So "can voice move the chair?" is really "is the recogniser in the house?" — and the cloud-first decision of 20 October answers it: **milestone 7 is as far away as a local recogniser is.** Nothing built at milestone 4 brings voice-driven seating closer, which is a fair price for reaching people on hardware they already own, but it should be a known price rather than a surprise later.
- **Refusals have to be loud.** A user who says "tilt me back" and gets silence will say it again, louder, and then assume the system is broken. The refusal is a feature, and it is in milestone 4's done-when for that reason.

---

## Open questions

These change the order above, so they are worth answering before milestone 3 finishes rather than during milestone 4.

- [x] ~~Our own skill, or Home Assistant's cloud?~~ **Ours, decided 21 October.** See [milestone 4](#milestone-4--ask-for-it-out-loud).
- [ ] **A smart-home skill, a custom skill, or both?** What is left of the voice decision. It sets the words a user has to say and who writes the refusal, and a smart-home skill adds a Lambda. See [milestone 4](#milestone-4--ask-for-it-out-loud).
- [ ] **Is the old Alexa route still live on Richard's chair?** If it is, there is a cloud path that can move that chair today, which is not what "no cloud before milestone 4" describes. It needs an answer and, if yes, a decommissioning before the new hub goes in next to it.
- [ ] **What input method does Mike actually use?** The slowest unknown in the project. It sets the stop time, which sets the run-time cap, which sizes milestone 2.
- [ ] **Who recruits trial users, and through whom?** Starts now, in parallel, because other people's time is the long lead item.
