# Step 1: the hub drives the chair

19 October 2026. The task list for step 1 of [`plan.md`](plan.md), as work rather than as a milestone.

Grounded in the actual code: `DarwinInnovation/wheelberry_dongle_http_test_site` at `73aed15` (8 October 2026), its `README.md` and `docs/test_server_tech_overview.md`. Read before this list was written, which is why the list is shorter than expected.

## The finding that shapes this

**Step 1 is mostly already built.** The test site is not a sketch — it is the hub, under a name that undersells it:

| Already there | Where |
| --- | --- |
| Hold-to-run on six seating outputs, over a WebSocket | `server.py`, `static/app.js` |
| The 300 ms firmware watchdog used as the failsafe, with a 100 ms resend while held | `config.yaml` → `failsafe:` |
| A startup check that refuses to run if `resend_interval_ms >= command_timeout_ms` | `server.py` |
| Release on pointer-up, pointer-leave, tab switch, window blur, page hide, socket close | `static/app.js` |
| Serial link that reopens by itself across cable removal and module reset, with live status in the UI | `module_poller` |
| The chair's own switches: input-module bits, LOW-hold triggers, configurable actions | `input_module.py` |
| A compact phone layout at ≤ 600 px, 64 px minimum targets | `static/style.css` |
| `--test` mode that runs the whole stack with no hardware attached | `server.py --test` |
| A systemd unit | `systemd/wheelberry-test-server.service` |

So step 1 is **verify it on a chair, then close the gaps**. Not weeks of building. The three safety rules that depend on code — hold-to-run, the firmware watchdog, release on failure — are implemented and documented; what has not happened is anyone watching them hold on a real chair with a stopwatch.

## Phase 1 — bench, chair empty

Nobody in the chair. Wheels off the ground or the chair on blocks.

1. **Axis mapping, and how long a full travel takes.** Drive all six outputs; check each one moves the axis its name claims, in the direction its icon claims. **Time each axis end to end while you are there** — it is free now and it is the number [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet) has to be set above, because a cap shorter than a legitimate full-travel hold would cut ordinary hold-to-run off mid-move. **Expect 20 to 40 seconds for the slowest axis** — that is recollection, not measurement, and it is written here so the measurement has something to disagree with: a time well outside that range is more likely a mis-mapped output or a chair configured differently than a surprising actuator. *Done when:* `config.yaml`'s action names match the physical axes, verified one at a time, anything mislabelled is fixed in config rather than remembered, and there is a travel time written down per axis. Note that the footrest and the toggles are **analogue** actions on the shared `ring` channel, not digital outputs — the cap has to cover those two enables as well as the six digital channels.
2. **The failsafe, broken six ways, each mid-move.** Release the button; switch browser tab; put the phone in flight mode; pull the USB cable; `kill -9` the server; pull power from the Pi. *Done when:* every one of the six stops the axis, and each result is written down — including any that stop slower than expected.
3. **Measure the stop, once.** Video at 60 fps is enough: frames from release to axis stationary. *Done when:* there is a number on paper to compare against the 300 ms watchdog. One measurement, not a programme — but an assumed number is not evidence.
4. **The chair's own switch.** One chair button, through the input module, triggering one action. *Done when:* it fires reliably, and the 4 s default LOW hold is tuned to something a person can actually do on purpose but not by accident.
5. **The LiNX range is the real limit.** *Done when:* driving an axis to its end from Wheelberry stops exactly where the chair's own controls stop — confirming rule 4, that the chair's configured range is in force and Wheelberry cannot exceed it.

## Phase 2 — the observed check

6. ~~**Name the second pair of eyes.**~~ **Done, 19 October: Ben Miller-Smith.** Not Richard, because Richard is writing the code and sitting in the chair. *Still to do:* agree which afternoon.
7. **The afternoon.** Every axis through full travel, repeatedly, with power pulled at random points in the travel — not just at the ends, because with no position sensing every point in the travel is a resting place. *Done when:* Ben has watched it and says so, with notes of anything that surprised him.

This is the gate, and it now gates two things: **nobody sits in a chair that Wheelberry moves before it, and nothing is published before it** (task 12). It covers hold-to-run only. Timed runs are a new mode and get their own session with Ben, under [task 13](#13-timed-runs-the-mode-that-needs-new-safety-work-not-less).

## Phase 3 — in the chair

8. **Richard tilts the chair from a phone**, and pulling the USB cable mid-move stops it.

That is step 1's done-when, and at that point the claim at the top of `plan.md` has been tested on exactly one person who is the worst possible test of it. Step 2 is where it starts to mean something.

## Phase 4 — the gaps

These are what make it a hub rather than a test rig. None is large; the first is a safety gap and should be done before phase 3.

### 9. Two controllers at once (safety)

Documented behaviour today: each WebSocket session gets its own `SessionController`, and two browsers holding buttons "interleave on the serial port — last write wins, fine for digital outputs". That is true of the *output*, but it breaks safety rule 5 as written. If a carer's phone is holding `tilt_forward` and the user releases their own button, the user's deassert is overwritten by the other session's next resend 100 ms later. The chair keeps moving.

What still holds: the firmware watchdog, the chair's own controls, and pulling the power. So the chair is never *unstoppable* — but "anyone in the room can stop it" is not true of the software, and that is the rule a user would rely on.

*Fix:* one active controller at a time with explicit takeover, and a stop that cancels every session's resend task, not just the caller's. A single owner variable in the server. *Done when:* two phones, one holding, the other pressing stop — and the chair stops.

Two things raise its priority since it was written. It is now a **precondition for timed runs** (task 13), because a run nobody is holding makes "a stop that cancels every resend task" the whole safety story rather than a second line of defence. And it is the same bug class as a timed run that over-runs: in both cases the hub is streaming commands that no human is asking for, which is precisely what the firmware watchdog cannot see. A maximum continuous energise time in the output module would close both at once, from outside the hub — [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet), which does not exist in the firmware yet and has to be built.

### 10. A passcode (before step 4, not before step 1)

Today: no authentication on the WebSocket, no TLS. Anyone who can reach the port can move the chair, and can also fire any configured input action — including the `command` type, which runs a shell command on the host. Fine on a bench. Not fine for a hub living in someone's home for a month, where the network also has guests' phones and a television on it.

*Fix:* one shared passcode per hub, entered once per device, checked on the WebSocket upgrade. Explicitly **not** accounts, roles, or the per-user permission matrix in [`background/requirements.md`](background/requirements.md) — that is the funded product, and it is out. *Done when:* a second device on the network cannot move the chair without the passcode, and the people who should be able to are not locked out of their own chair when they forget it.

### 11. It stops being called a test site

*Recommendation: rename the repository to `wheelberry-hub`; do not start a new one.* Its git history is where the failsafe model was developed, and that history is the closest thing this project has to safety evidence. A fresh repo throws it away. GitHub redirects the old name. *Done when:* renamed, and its README says what it now is rather than what it was. Do this **before** task 12, while it is still private — then the public name is right from the first day anyone sees it and no redirect is needed.

### 12. Published, with a licence — gated on task 7

The three repositories the proof of concept depends on — the hub, and both firmwares — are private, while the parked TypeScript generation is public. **Decided 19 October: they go public once Ben's observed bench check has passed**, not before. What is being published is code that moves a person's body; publishing it before anyone other than its author has watched it do so invites a stranger to run it on a chair on our say-so.

`pcb_wheelberry_dongles` is **not** in this task — it stays private until the hardware licence is settled, which was deferred the same day.

*Done when:* each of the three is public, each has the Apache-2.0 `LICENSE`, `__pycache__/` is removed from the hub repo and ignored, and each has been **searched** for personal data rather than assumed clean. That check is not a formality: one code search for the personal address across the organisation finds it in five files in three repositories, one of which — `bedberry` — is public today and has a star. The private `node-wheelberry-proxy` carries it too. `bedberry` is being left as it is, decided 19 October; the point of the check here is the three repositories about to become public, where the same assumption would be new exposure rather than existing exposure.

### 13. Timed runs: the mode that needs new safety work, not less

Added 19 October, when timed runs came back into scope so that seating is reachable by eye gaze, scanning and anything else that cannot hold. **This is step 2 work, not step 1** — Richard can hold a control, so nothing in phases 1 to 3 needs it. It is listed here because getting it wrong is the most expensive mistake available in this project, and because [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet) ahead of it is work that can start now.

**It is also no longer optional.** Settled the same evening: Mike cannot reliably hold a control, and the input module's trigger is a 4 s *held* LOW, so the chair's own switches are not a way round it either. Step 2 does not reach its done-when without this section.

The conditions are in [`plan.md`](plan.md#timed-runs-and-what-they-cost). The work, in order:

- ~~**Ask the firmware: is there a maximum continuous energise time per output?**~~ **Asked and answered, 19 October — see [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet).** There is a per-channel timeout; it is the 300 ms watchdog, not a cap, and the cap has to be built.
- **The whole-travel judgement, per axis, with Richard's seating clinician.** A timed run ends where the clock says, not where the user says, so the question per axis is whether its *entire* configured travel is safe to be left in. Where it is not: narrow the LiNX range at install, or no timed run on that axis.
- **Run-time caps per user and input method.** A finger releases in milliseconds, a dwell stop costs a fixation, a scanning stop costs a scan step — so measure the stop with the user's own input before setting the cap that depends on it.
- **The run screen is only a stop.** During a run, nothing else is on it, so any input lands on stop and there is nothing to navigate. *Done when:* a dwell user and a scanning user can each stop a run on their first attempt, measured.
- **A second observed session with Ben**, covering timed runs specifically, before anyone sits in a chair under one.

### 14. The firmware energise cap: the bound that does not exist yet

Added 19 October, on the answer to task 13's first item. **This is firmware work and it needs no chair and no clinician** — which makes it, with task 9, the only work in the project not waiting on a person. **Both are deliberately held as of 19 October:** Richard's decision is to stay in planning until phase 1 has been done, so neither is started, and the two are specified here rather than half-built. They resume by switching this task to an implementation mode or opening a task against the firmware and hub repositories.

Grounded in `DarwinInnovation/firmware_wheelberry_output_module` at `ade948d`, `Src/output_control.c` and `docs/technical-overview.md`, read rather than remembered, because the whole mode rests on this being true.

**What is there.** A per-channel one-shot timeout, eight of them: six digital outputs and the two analogue enables. **What is not there** is a cap, and the difference is the entire task:

| | |
| --- | --- |
| The timeout is a *field of the command* | `D:<n>:<v>:<m>` — the host supplies `m`. `0` means permanent, the range runs to 2³²−1 ms, and there is no maximum |
| Every command re-arms it | `cmd_digital` deactivates the channel's timer, applies the state, then re-arms from `m` |
| So the resend loop feeds it | The hub sends `m=300` every 100 ms. That *is* the 300 ms watchdog — correct, and exactly why it cannot also be the cap |
| Nothing accumulates | No channel records how long it has been energised |

One thing found while reading, worth recording because it is a sharp edge rather than a bug today: **the expiry callback toggles the channel rather than forcing it off** (`apply_digital(idx, !dig[idx].logical_val)`). A *deassert* carrying a non-zero timeout would therefore schedule an *assert*. The hub sends `D:n:0:0` on release, so this is not live — checked, not assumed — but the cap below must force off and never toggle.

**The design.** Per channel, a compile-time maximum continuous energise time:

- Timed from the OFF→ON transition, **not** re-armed by a repeat command for a state the channel is already in.
- On expiry, **force off and latch off.** While latched, asserts on that channel are ignored; the latch clears only on an explicit `v=0` (and with everything else on disconnect, which already releases and cancels).
- Applies to all eight channels, including the two analogue enables — the footrest axes move through `ring`, so a digital-only cap would miss them.
- **Not host-settable.** A cap the hub can raise is the same bug one layer along.

**The latch is the whole point.** Force off without it and the hub's next resend, 100 ms later, re-energises the output: a duty-cycle limiter, not a stop.

**Sizing it: 90 s provisionally, per channel, refined by measurement.**

The floor is the longest legitimate full-travel hold. Richard's recollection, 19 October, is **20 to 40 seconds** for the slowest axis; [task 1](#phase-1--bench-chair-empty) measures it properly. A cap below that cuts an ordinary hold-to-run move off mid-way, which is a fault the user feels every day, so the provisional constant carries real margin: the chair is slower loaded than empty, slower on a low battery, and a user who reaches the end of travel typically keeps holding for a second or two afterwards.

The ceiling is the part that is easy to get wrong in the cautious direction. **Energising past the end of travel does not move the person.** The dongle drives the chair's own inputs, and LiNX stops the axis at its configured range whatever we do — so the harm in the seconds after full travel is thermal and mechanical on the actuator, not further movement. Which means erring high is cheap and erring low breaks ordinary use, and the cap should sit comfortably above 40 s rather than snugly above it.

So the cap is not a pinch guard — there is no current or stall sensing to build one from, and that stays an open hardware question in `plan.md`. What it bounds is **indefinite** energising: a stuck output that today would stay live until someone noticed. The chain that makes 90 s defensible rather than merely generous is that a runaway reaches the end of travel and stalls there, and task 13 already requires a clinician to judge each axis's *whole* configured travel safe to be left in before any timed run is permitted on it. If that judgement comes back "no" for an axis, timed runs are off for that axis and the cap is not what was protecting the user anyway.

After task 1, per channel: **measured full travel × 2, rounded up to the next 10 s, never below 60 s.** One check for whoever implements it, flagged because it is unverified rather than known: the cap times from OFF→ON, so if the hub leaves the shared `ring` channel asserted across two consecutive footrest moves, the cap accumulates across both and fires mid-move. Confirm `ring` deasserts on release so the cap times one move and not a session.

*Done when:* a channel held by a continuous 100 ms resend releases at the cap and stays released until an explicit off — proved first in the firmware repo's existing host regression harness, which runs the real output-control code against mocks and already covers tick wraparound, and then once on the bench.

**It does not replace [task 9](#9-two-controllers-at-once-safety).** The cap is seconds and comes from outside the hub; a stop someone in the room presses has to be milliseconds and comes from inside it. The cap is what makes task 9's failure survivable, not what makes it unnecessary.

## Also in step 1, but not gating it

- **A fresh Pi to a working hub, written down**: dialout group, venv, config, systemd unit, and a name on the network the user can type instead of an IP address. *Done when:* done twice from scratch, the second time by someone else following only the document.
- **The screen on the device the user actually holds**, in the orientation they hold it. This is also where the "installable" question gets answered — a service worker needs a secure context, and a LAN address over plain HTTP is not one. *Done when:* the time from picking up a locked device to starting a move is measured, and it is short enough that a person at 2 a.m. would bother.
- **A README a non-programmer can act on**, with a parts list. The current one is good and is written for someone who already knows what a dongle is.

## Not in step 1

Home control (step 3). Mike's layout and input method (step 2). Any cloud, any remote access. Timed runs themselves, which are in the proof of concept but are step 2 work — though [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet), the firmware cap they depend on, needs nothing from step 1 and can be written alongside it. Motor current and stall detection, which is an open hardware question in `plan.md` and not a blocker here.

**Position** presets stay out altogether, timed runs notwithstanding: there is no position sensing, so a named angle is a claim we cannot make. A timed run is a duration with an honest name, not a position with a dishonest one.
