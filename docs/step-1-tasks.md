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

1. **Axis mapping.** Drive all six outputs; check each one moves the axis its name claims, in the direction its icon claims. *Done when:* `config.yaml`'s action names match the physical axes, verified one at a time, and anything mislabelled is fixed in config rather than remembered.
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

Two things raise its priority since it was written. It is now a **precondition for timed runs** (task 13), because a run nobody is holding makes "a stop that cancels every resend task" the whole safety story rather than a second line of defence. And it is the same bug class as a timed run that over-runs: in both cases the hub is streaming commands that no human is asking for, which is precisely what the firmware watchdog cannot see. A maximum continuous energise time in the output module would close both at once, from outside the hub.

### 10. A passcode (before step 4, not before step 1)

Today: no authentication on the WebSocket, no TLS. Anyone who can reach the port can move the chair, and can also fire any configured input action — including the `command` type, which runs a shell command on the host. Fine on a bench. Not fine for a hub living in someone's home for a month, where the network also has guests' phones and a television on it.

*Fix:* one shared passcode per hub, entered once per device, checked on the WebSocket upgrade. Explicitly **not** accounts, roles, or the per-user permission matrix in [`background/requirements.md`](background/requirements.md) — that is the funded product, and it is out. *Done when:* a second device on the network cannot move the chair without the passcode, and the people who should be able to are not locked out of their own chair when they forget it.

### 11. It stops being called a test site

*Recommendation: rename the repository to `wheelberry-hub`; do not start a new one.* Its git history is where the failsafe model was developed, and that history is the closest thing this project has to safety evidence. A fresh repo throws it away. GitHub redirects the old name. *Done when:* renamed, and its README says what it now is rather than what it was. Do this **before** task 12, while it is still private — then the public name is right from the first day anyone sees it and no redirect is needed.

### 12. Published, with a licence — gated on task 7

The three repositories the proof of concept depends on — the hub, and both firmwares — are private, while the parked TypeScript generation is public. **Decided 19 October: they go public once Ben's observed bench check has passed**, not before. What is being published is code that moves a person's body; publishing it before anyone other than its author has watched it do so invites a stranger to run it on a chair on our say-so.

`pcb_wheelberry_dongles` is **not** in this task — it stays private until the hardware licence is settled, which was deferred the same day.

*Done when:* each of the three is public, each has the Apache-2.0 `LICENSE`, `__pycache__/` is removed from the hub repo and ignored, and each has been **searched** for personal data rather than assumed clean. That check is not a formality: one code search for the personal address across the organisation finds it in five files in three repositories, one of which — `bedberry` — is public today and has a star. The private `node-wheelberry-proxy` carries it too.

### 13. Timed runs: the mode that needs new safety work, not less

Added 19 October, when timed runs came back into scope so that seating is reachable by eye gaze, scanning and anything else that cannot hold. **This is step 2 work, not step 1** — Richard can hold a control, so nothing in phases 1 to 3 needs it. It is listed here because its first item is free while the bench is already set up, and because getting it wrong is the most expensive mistake available in this project.

The conditions are in [`plan.md`](plan.md#timed-runs-and-what-they-cost). The work, in order:

- **Ask the firmware: is there a maximum continuous energise time per output?** Do this during phase 1, with the bench already wired. In hold-to-run every hub failure stops the resend and the watchdog releases within 300 ms. A timed run has the hub resending with nobody holding anything, so a timer that never fires is indistinguishable from working correctly — the watchdog is fed by the bug it would otherwise catch. A firmware energise cap puts the bound outside the hub, where it belongs, and closes task 9's hole as a side effect. If it does not exist, the fallback is a separately scheduled hard stop in the hub owned by neither the session nor the resend task, and that is strictly worse because it is in the same process as the fault.
- **The whole-travel judgement, per axis, with Richard's seating clinician.** A timed run ends where the clock says, not where the user says, so the question per axis is whether its *entire* configured travel is safe to be left in. Where it is not: narrow the LiNX range at install, or no timed run on that axis.
- **Run-time caps per user and input method.** A finger releases in milliseconds, a dwell stop costs a fixation, a scanning stop costs a scan step — so measure the stop with the user's own input before setting the cap that depends on it.
- **The run screen is only a stop.** During a run, nothing else is on it, so any input lands on stop and there is nothing to navigate. *Done when:* a dwell user and a scanning user can each stop a run on their first attempt, measured.
- **A second observed session with Ben**, covering timed runs specifically, before anyone sits in a chair under one.

## Also in step 1, but not gating it

- **A fresh Pi to a working hub, written down**: dialout group, venv, config, systemd unit, and a name on the network the user can type instead of an IP address. *Done when:* done twice from scratch, the second time by someone else following only the document.
- **The screen on the device the user actually holds**, in the orientation they hold it. This is also where the "installable" question gets answered — a service worker needs a secure context, and a LAN address over plain HTTP is not one. *Done when:* the time from picking up a locked device to starting a move is measured, and it is short enough that a person at 2 a.m. would bother.
- **A README a non-programmer can act on**, with a parts list. The current one is good and is written for someone who already knows what a dongle is.

## Not in step 1

Home control (step 3). Mike's layout and input method (step 2). Any cloud, any remote access. Timed runs themselves, which are in the proof of concept but are step 2 work — only the firmware question in task 13 belongs here. Motor current and stall detection, which is an open hardware question in `plan.md` and not a blocker here.

**Position** presets stay out altogether, timed runs notwithstanding: there is no position sensing, so a named angle is a claim we cannot make. A timed run is a duration with an honest name, not a position with a dishonest one.
