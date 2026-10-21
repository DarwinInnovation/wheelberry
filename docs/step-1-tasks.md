# Step 1: the hub drives the chair

19 October 2026, amended 20 and 21 October. The task list for the first milestone of [`plan.md`](plan.md), as work rather than as a milestone.

**On numbering:** the four "steps" became six milestones on 20 October, in [`roadmap.md`](roadmap.md). This list is [milestone 1](roadmap.md#milestone-1--the-chair-moves-from-a-phone); where it says "step 2" it means milestone 2, and where it says "step 4" it means milestone 6, the month in the home. Task numbers 1–16 are unchanged and are referred to from elsewhere, so they stay as they are.

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

   **Done, 21 October — both halves.** Richard, end to end, chair empty:

   | Axis | Travel | Channels it drives |
   | --- | --- | --- |
   | Elevate | **10.3 s** | digital 5 / 6 (`seat_up`, `seat_down`) |
   | Tilt | **14.5 s** | digital 1 / 2 (`tilt_forward`, `tilt_backward`) |
   | Backrest | **17.6 s** | digital 3 / 4 (`backrest_forward`, `backrest_backward`) |
   | Footrest tilt | **17.2 s** | analogue `ring` (`footrest_tilt_up` / `_down`) |
   | Footrest length | **10.6 s** | analogue `ring` (`footrest_extend`, `footrest_retract`) |

   Five axes cover **every moving channel**: all six digital outputs and the `ring`
   enable. The other `ring` actions (`horn`, `rest_toggle`, `light_toggle`,
   `function_prev`, `function_next`) and `tip` (`power`) are momentary presses with
   no travel, so there is no travel time to take and the cap is nowhere near them.

   **The recollection was high, and wrong in the safe direction.** 20 to 40 s was
   written here so the measurement had something to disagree with; the slowest axis
   is **17.6 s**, below even the bottom of that range. This task named the two
   candidate explanations for a time well outside the range: a mis-mapped output, or
   a chair configured differently. **The mapping is now confirmed and the first is
   ruled out**, so what remains is a chair configured to a narrower LiNX range than
   remembered — which shortens every travel with nothing wrong. Task 5 is the check
   that that range is in force.

   **Axis mapping confirmed, 21 October.** Richard verified all six digital outputs
   and both footrest axes one at a time: each output moves the axis its name claims,
   in the direction its icon claims. Nothing in `config.yaml` needed relabelling.
   That closes the half of this task the timings could not settle on their own.

   **Two things this measurement is not:** it is one number per axis rather than per
   direction (down is gravity-assisted and should be the faster of the two), and it
   is the empty chair, which is the faster case. Both mattered less at the 90 s cap
   than they do now — see
   [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet), where
   the cap is 30 s and the **loaded** travel time is the open number.
2. **The failsafe, broken seven ways, each mid-move.** Release the button; switch browser tab; put the phone in flight mode; pull the USB cable; `kill -9` the server; pull power from the Pi; **press the chair's own LiNX power button.** *Done when:* every one of the seven stops the axis, and each result is written down — including any that stop slower than expected. The seventh is a confirmation rather than a question — Richard confirms it is instant — and it continues into the power-on test below, which is the part nobody has done.
3. **Measure the stop, once.** Video at 60 fps is enough: frames from release to axis stationary. *Done when:* there is a number on paper to compare against the 300 ms watchdog. One measurement, not a programme — but an assumed number is not evidence.
4. **The chair's own switch.** One chair button, through the input module, triggering one action. *Done when:* it fires reliably, and the 4 s default LOW hold is tuned to something a person can actually do on purpose but not by accident.
5. **The LiNX range is the real limit.** *Done when:* driving an axis to its end from Wheelberry stops exactly where the chair's own controls stop — confirming rule 4, that the chair's configured range is in force and Wheelberry cannot exceed it.

### The chair's own power button

Added 20 October. LiNX chairs have a power button that **carers and family already know about**, and pressing it stops any movement at once — **confirmed by Richard, 20 October: instant, mid-travel.** That makes it the best stop in the system by some distance: it is labelled, it is where everybody expects it, it is in the household's muscle memory already, it owes nothing to Wheelberry, the hub, the dongle, the network or the Pi, and it does not wait for the move to finish. It is now named in safety rule 5 in [`plan.md`](plan.md#the-safety-rules--all-of-them) in place of the vaguer "and power".

**The same answer settled the second question the awkward way: the dongle is powered independently of the chair, so it survives the press.** Two things follow, and the second one is new.

- **The untested condition is now the normal one.** With the dongle still live, it carries on asserting an output into a receiver that has just lost power — and the output module's own documentation lists exactly that as untested: "power removal with the receiver still powered" and "the receiver's interpretation of high impedance", with the analogue switch's signal-path protection specified only to ±5.5 V. It is very likely harmless. It is no longer an edge case, because we are about to start *telling* carers to use that button. *Done when:* the chair has been powered off mid-move at least ten times with the dongle still live, and nothing in the chair or the dongle has misbehaved afterwards.
- **The move resumes when the chair is switched back on.** Nothing tells the hub the chair has gone: it keeps asserting every 100 ms for as long as something is holding the control, and there is no sensing anywhere on the dongle that could tell it otherwise — the output module firmware makes no application use of the ADC, checked 20 October. So the sequence is: press power, the chair stops, press power again, **and the axis carries on from where it stopped.** That is a prediction from the design rather than an observation, and confirming it is part of the ten presses above: press power mid-move *with the control still held*, then power the chair back on, and write down what the chair does.

  Why it matters more than it sounds: **the power button is a stop, not a reset.** The fix is not in the hub — the hub cannot learn that the chair is off — so it is two lines on the carer card and task 14's cap as the backstop beyond 30 s. Worth knowing before the card is written rather than after. **The card is the remedy and the cap is only the backstop**, and the 21 October measurement makes that ordering firmer rather than looser: at a 17.6 s slowest travel, a move that resumes inside the cap window completes its remaining travel whatever the cap is set to. Tightening the cap from 90 s to 30 s shortens the window in which a resume can start; it does not stop one that starts inside it. **Note for the ten presses: switch the chair back on within 30 s**, or the cap will have latched the channel off and there is no resume to observe.
- **Who can actually reach it?** It is on the chair's own control module. Richard can reach his; Mike, who cannot reliably hold a control, may not be able to press his. So it is a **bystander's stop, not the user's stop.** Keeping that distinction is what stops safety rule 1 being quietly weakened into "well, someone could always hit the power button" — see the warning in `plan.md`.

One deliverable follows from it, and it is the sort of thing an engineering project skips: **a short card for family and carers that says how to stop the chair.** One side of one page, on the wall or in the drawer, naming the power button first — and, because of the point above, saying what to do next: *let go of the control, or press stop on the screen, before you switch the chair back on.* It costs an afternoon and it is worth more to the people in the room than any of the firmware work.

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

**The hold is lifted: 21 October, build it.** Richard's decision, after the firmware pass. It is in `wheelberry_dongle_http_test_site` and it is a precondition for phase 3 — before Richard sits in a chair Wheelberry moves — so it has time but not much. One thing to settle while in that file rather than after it: **what "explicit takeover" looks like to the person holding the control that is about to be taken.** A silent handover is a chair that stops responding to the hand that is on it, which is worse than the bug being fixed; so ownership changes on a deliberate action, the loser is told, and whoever is holding at the time gets a release rather than a stall.

Two things raise its priority since it was written. It is now a **precondition for timed runs** (task 13), because a run nobody is holding makes "a stop that cancels every resend task" the whole safety story rather than a second line of defence. And it is the same bug class as a timed run that over-runs: in both cases the hub is streaming commands that no human is asking for, which is precisely what the firmware watchdog cannot see. A maximum continuous energise time in the output module would close both at once, from outside the hub — [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet), which does not exist in the firmware yet and has to be built.

### 10. A passcode (now before milestone 4, not milestone 6)

Today: no authentication on the WebSocket, no TLS. Anyone who can reach the port can move the chair, and can also fire any configured input action — including the `command` type, which runs a shell command on the host. Fine on a bench. Not fine for a hub living in someone's home for a month, where the network also has guests' phones and a television on it.

**It moved earlier on 20 October**, because the voice decision moved. A cloud assistant means something outside the house can reach the hub, and an unauthenticated WebSocket with a shell-command action behind a route from the internet is a different class of thing from the same WebSocket on a bench. So this lands before [milestone 4](roadmap.md#milestone-4--ask-for-it-out-loud) rather than before the month in the home.

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

Added 19 October, on the answer to task 13's first item. **This is firmware work and it needs no chair and no clinician** — which makes it, with task 9, the only work in the project not waiting on a person.

**The hold is lifted: 20 October, build it now, ahead of phase 1**, in one pass with [task 15](#15-the-open-drain-change-what-on-means-on-v2-hardware). It needs an implementation task against `firmware_wheelberry_output_module`; a planning task cannot write it.

**And it is written.** Branch `energise-cap-and-open-drain`, commit `3514fef` on top of `ade948d`, open as **PR #2** in the firmware repository, host regression harness green across thirteen groups — and verified by mutation: seven deliberately broken variants each fail the harness, so the new tests bite rather than merely pass. **Not merged, and nothing flashed onto a chair.** The latch is reported on the serial link as `CAP:D:<n>` / `CAP:A:<ch>`; the hub half of that is [task 16](#16-the-hub-half-of-the-cap-report). The heading above is now historical — the bound exists. **Task 9's hold was lifted separately on 21 October** and it is being built in the hub repository.

Two consequences of building before the bench rather than after it:

- **The cap ships unmeasured.** 90 s stands as the shipped constant and task 1's measurement validates it rather than setting it. Re-sizing afterwards is one constant and a re-run of the host harness. The single outcome that needs action is a slowest axis above 45 s, which would put 90 s below the travel × 2 floor below — raise the constant before anyone relies on the cap.

  **Measured 21 October, and then tightened: the cap is 30 s.** Slowest axis
  **17.6 s** (backrest) — see [task 1](#phase-1--bench-chair-empty) for the per-axis
  table — so the 45 s threshold that would have forced a *raise* was nowhere near.
  Richard's decision on the same day went the other way and set the constant to
  **30 s**, tighter than both 90 s and the 60 s the floor rule implies. Reasoning
  under *Sizing it*. Two corrections to this bullet, found while applying it:
  re-sizing is **two** edits rather than one constant, because
  `test/output_control_test.c` asserts the tick count directly; and the floor rule
  below is superseded by the decision rather than satisfied by it, which is now
  stated there rather than left as a contradiction.
- **Phase 1 then tests changed firmware.** That is the better trade, and deliberately so: one bench visit instead of two, and the version Ben watches is the version that ships rather than the version it replaced. The cost is that a surprise on the bench has two candidate causes, so run the existing host regression harness to green first, and write the firmware commit into the bench notes — **`3514fef`**, unless PR #2 gains more commits before it is merged.

Grounded in `DarwinInnovation/firmware_wheelberry_output_module` at `ade948d`, `Src/output_control.c` and `docs/technical-overview.md`, read rather than remembered, because the whole mode rests on this being true.

**What is there.** A per-channel one-shot timeout, eight of them: six digital outputs and the two analogue enables. **What is not there** is a cap, and the difference is the entire task:

| | |
| --- | --- |
| The timeout is a *field of the command* | `D:<n>:<v>:<m>` — the host supplies `m`. `0` means permanent, the range runs to 2³²−1 ms, and there is no maximum |
| Every command re-arms it | `cmd_digital` deactivates the channel's timer, applies the state, then re-arms from `m` |
| So the resend loop feeds it | The hub sends `m=300` every 100 ms. That *is* the 300 ms watchdog — correct, and exactly why it cannot also be the cap |
| Nothing accumulates | No channel records how long it has been energised |

One thing found while reading: **the expiry callback toggles the channel rather than forcing it off** (`apply_digital(idx, !dig[idx].logical_val)`). A *deassert* carrying a non-zero timeout would therefore schedule an *assert*. The hub sends `D:n:0:0` on release, so this is not live — checked, not assumed — but the cap below must force off and never toggle.

**As of 20 October this has a cause and a proper fix.** It is the v1 push-pull hardware's symmetry surviving into v2's open-drain output stage, where the only two states are asserted and released. It is [task 15](#15-the-open-drain-change-what-on-means-on-v2-hardware), it should be done in the same pass as this task, and it matters more than "a sharp edge" suggested: the toggle is also why the 300 ms failsafe is implemented as something other than what the hub's documentation says it is.

**The design.** Per channel, a compile-time maximum continuous energise time:

- Timed from the OFF→ON transition, **not** re-armed by a repeat command for a state the channel is already in.
- On expiry, **force off and latch off.** While latched, asserts on that channel are ignored; the latch clears only on an explicit `v=0` (and with everything else on disconnect, which already releases and cancels).
- Applies to all eight channels, including the two analogue enables — the footrest axes move through `ring`, so a digital-only cap would miss them.
- **Not host-settable.** A cap the hub can raise is the same bug one layer along.

**The latch is the whole point.** Force off without it and the hub's next resend, 100 ms later, re-energises the output: a duty-cycle limiter, not a stop.

**Sizing it: 30 s per channel, measured and decided 21 October.** Shipped at 90 s,
now tightened. The history below is kept because the reasoning it records is what
the decision departed from.

The floor is the longest legitimate full-travel hold. Richard's recollection, 19 October, is **20 to 40 seconds** for the slowest axis; [task 1](#phase-1--bench-chair-empty) measures it properly. A cap below that cuts an ordinary hold-to-run move off mid-way, which is a fault the user feels every day, so the provisional constant carries real margin: the chair is slower loaded than empty, slower on a low battery, and a user who reaches the end of travel typically keeps holding for a second or two afterwards.

The ceiling is the part that is easy to get wrong in the cautious direction. **Energising past the end of travel does not move the person.** The dongle drives the chair's own inputs, and LiNX stops the axis at its configured range whatever we do — so the harm in the seconds after full travel is thermal and mechanical on the actuator, not further movement. Which means erring high is cheap and erring low breaks ordinary use, and the cap should sit comfortably above 40 s rather than snugly above it.

So the cap is not a pinch guard — there is no current or stall sensing to build one from, and that stays an open hardware question in `plan.md`. What it bounds is **indefinite** energising: a stuck output that today would stay live until someone noticed. The chain that makes 90 s defensible rather than merely generous is that a runaway reaches the end of travel and stalls there, and task 13 already requires a clinician to judge each axis's *whole* configured travel safe to be left in before any timed run is permitted on it. If that judgement comes back "no" for an axis, timed runs are off for that axis and the cap is not what was protecting the user anyway.

The rule this task wrote for itself, to be applied after task 1, was: **measured
full travel × 2, rounded up to the next 10 s, never below 60 s.** Per-axis timings
are in [task 1](#phase-1--bench-chair-empty); slowest is the backrest at 17.6 s.
Applied literally the rule gives this:

| Axis | Travel | × 2 | Next 10 s | After the 60 s floor |
| --- | --- | --- | --- | --- |
| Elevate | 10.3 s | 20.6 s | 30 s | **60 s** |
| Tilt | 14.5 s | 29.0 s | 30 s | **60 s** |
| Backrest | 17.6 s | 35.2 s | 40 s | **60 s** |
| Footrest tilt | 17.2 s | 34.4 s | 40 s | **60 s** |
| Footrest length | 10.6 s | 21.2 s | 30 s | **60 s** |

Every channel lands on the floor, so the rule does not discriminate between
channels here — it restates the floor, and per-channel constants would be eight
numbers for one value.

**Decided 21 October: 30 s, Richard's call, against a recommendation of 90 s.**
The options put to him were leave it at 90 s or tighten to 60 s; he chose tighter
than either. Recorded as a decision with its consequences rather than as an
application of the rule, because **it is not one**:

- 30 s is below the rule's **never below 60 s** floor outright, and below
  `travel × 2` for the two slowest axes (35.2 s and 34.4 s). **The rule is
  superseded by this decision, not satisfied by it.** It was a heuristic we wrote
  ourselves before any measurement existed; it is kept above as the reasoning the
  decision departed from, and it should not be re-applied to re-derive 60 s.
- What survives from the rule is its *purpose* — a cap must exceed the longest
  legitimate full-travel hold. 30 s is **1.7× the slowest measured travel**, so an
  ordinary hold-to-run move still completes, with about **12 s** of continued
  holding past the end of travel to spare.

**What 30 s buys.** It halves and then some the latent-assert window in the
power-button case: the chair is switched off mid-move, the hub goes on asserting,
and the move **resumes** when the chair comes back on. That window is measured from
the original press and is now 30 s rather than 90 s. Note what it does *not* buy:
30 s still exceeds a full travel at 17.6 s, so a resumed move can still run to the
end of its travel. **The remedy there remains the two lines on the carer card and
[task 9](#9-two-controllers-at-once-safety), not the constant** — the conclusion the
90 s analysis reached, unchanged by tightening. For an ordinary runaway all three
values are equivalent: the axis stalls at the end of travel long before any of them
fires, so they differ only in how long a *stalled* actuator stays energised, and
30 s is the best of the three on that.

**What 30 s exposes, and it is the one thing to watch.** Loaded travel has never
been measured. A loaded chair more than **1.7×** slower than empty would have a
legitimate full-travel move cut off and latched at 30 s — a fault the user feels
every day, and the failure mode this task's floor existed to prevent. At 90 s that
margin was 5.1×. So the loaded stopwatch run is no longer an optional tidy-up that
phase 3 happens to need: **it is what validates the shipped constant**, and it is
one more run with someone in the chair. If the loaded slowest axis comes back above
about 25 s, raise the cap rather than argue with it.

**And one consequence that did not exist at 90 s: the cap is now reachable by
ordinary bench behaviour.** At 90 s nothing in the bench script could reach it. At
30 s, holding the backrest to its end and then keeping hold for twelve seconds —
exactly what someone does while reading a stopwatch — latches the channel off.
Two things follow, both cheap:

- **A line in the bench notes.** If a channel stops responding mid-session, suspect
  the cap before the hardware: release the control fully, then press again. A
  capped channel needs an explicit release to clear its latch.
- **[Task 16](#16-the-hub-half-of-the-cap-report) is now worth doing before the
  bench, not after.** The hub does not read `CAP:D:<n>` / `CAP:A:<ch>`, so a capped
  channel is indistinguishable on screen from a broken actuator or a loose cable.
  That was tolerable while the cap was unreachable. It is now the cheapest way to
  avoid an expensive afternoon.

One interaction with the bench script worth knowing: the power-on resume test in
[the power button section](#the-chairs-own-power-button) now has a **30-second
observation window**. Press power mid-move with the control still held, and the
chair must be switched back on within 30 s or the cap will have latched the channel
off and there will be no resume to observe. Switching back on late and seeing
nothing is the cap working, not evidence that the resume does not happen.

**The `ring` accumulation worry is checked and does not apply** — verified in the hub at `73aed15`, having previously been flagged here as unverified. `SessionController._deassert` sends `A:<ch>:0:0:0` for an analogue action, which drops the enable, and `start()` awaits `stop()` before starting anything new. So two consecutive footrest moves on the shared `ring` channel are separated by a real enable-low, the cap sees a fresh OFF→ON for the second one, and it times one move rather than a session. The cap may be written against the OFF→ON transition as specified, with no special case for the analogue enables.

One requirement that falls out of reading the hub, and it is about feedback rather than safety: **when the cap fires, the hub has no idea.** The resend loop keeps sending `D:n:1:300` every 100 ms into a latched-off channel, and the user keeps holding a button against a chair that has silently stopped. The firmware should report the latch, and the hub should surface it as a distinct state — "this channel has cut out" rather than nothing at all. Without that, the cap's first real-world appearance is indistinguishable from a broken actuator or a loose cable, which is an expensive afternoon on a bench.

*Done when:* a channel held by a continuous 100 ms resend releases at the cap and stays released until an explicit off — proved first in the firmware repo's existing host regression harness, which runs the real output-control code against mocks and already covers tick wraparound, and then once on the bench.

**It does not replace [task 9](#9-two-controllers-at-once-safety).** The cap is seconds and comes from outside the hub; a stop someone in the room presses has to be milliseconds and comes from inside it. The cap is what makes task 9's failure survivable, not what makes it unnecessary.

**Do it in the same pass as [task 15](#15-the-open-drain-change-what-on-means-on-v2-hardware).** Both are in `Src/output_control.c`, both are about what "on" means, and the cap's "timed from the OFF→ON transition" only becomes exact once "on" means *asserted* rather than *`logical_val` happens to be 1*. One firmware change, one run of the host harness, one bench visit.

### 15. The open-drain change: what "on" means on v2 hardware

Added 20 October, from Richard: **v1 of the dongle was push-pull, so being able to drive an output either way made sense. v2 is open-drain, so the firmware can be clear about which state is active and which is not.** Grounded in `firmware_wheelberry_output_module` at `ade948d` — `Src/output_control.c` and `docs/technical-overview.md`, read rather than remembered.

**What the hardware actually does now.** Six low-side 2N7002E MOSFETs with external gate pull-downs. MCU `HIGH` turns the MOSFET on and pulls the connector signal `LOW` — that is *active*. MCU `LOW` releases the connector to high impedance and the chair provides its own inactive bias — that is *inactive*. The two analogue channels are the same shape: a TMUX2821 switch that connects or **isolates**, so a disabled analogue output is isolated rather than driven to zero.

One distinction to keep straight, because it is where the confusion comes from: **the MCU pin is still push-pull; it is the output stage at the connector that is open-drain.** The firmware's job is to stop describing the connector in terms of the pin.

**So the two states are no longer symmetric, and the firmware still assumes they are.** On v1 both states were driven, so a channel genuinely had "a value", and a timeout that reverted a channel to *the other value* was coherent. On v2 there is only **assert** and **release**, and the only correct thing to do when a timeout expires is release.

Today the firmware does not do that. It toggles:

```c
static void timer_cb_digital(ULONG idx) { ... apply_digital((uint8_t)idx, !dig[idx].logical_val); }
static void timer_cb_analog (ULONG idx) { ... apply_analog(idx, ana[idx].millivolts, !ana[idx].enable); }
```

**This is the sharpest thing in the task list, and it is worth being precise about why.** The hub's `config.yaml` and its tech overview both say the module "auto-deasserts the output if it does not hear from us" — and the whole 300 ms failsafe, safety rule 2, and every claim this project makes about hold-to-run rest on that sentence. The firmware does not implement it. It implements a toggle, which *coincides* with deassert in the one case the hub currently exercises: an assert carrying `m=300`. A deassert carrying a non-zero timeout would schedule an **assert** — the firmware would turn an output on because a release timed out.

So the documented failsafe is true by luck rather than by construction, and the luck is held in place by one line in the hub. That is the v1 symmetry surviving into v2 hardware, and it is exactly what Richard's point identifies.

**The change.**

1. **One vocabulary: assert and release.** `logical_val` becomes something like `asserted`; the protocol's `v=1` is documented as *assert (connector pulled low)* and `v=0` as *release (connector high-impedance; the chair biases it)*. Wire format unchanged.
2. **Timeout means release, not toggle.** Both callbacks call a release, never a negation. The documented behaviour and the implemented behaviour become the same sentence.
3. **One `release_channel()` and one `release_all()`, used by every path that ends in "stop".** There are three spellings of release in the firmware today and they do not agree: `output_control_fault_stop` writes GPIO `RESET` directly without touching RTOS state; `output_control_set_connected` calls `apply_digital(i, 0)` and drops the enables; the timer callback toggles. After this change, the fault stop, the disconnect path, the timeout expiry and **task 14's cap latch** are four callers of the same two functions. That is the real prize here — the project's safety story is four paths all ending in "release everything", and it should be one piece of code, not four.
4. **Say what inactive *is*, in the overview.** On v2, inactive is a *passive* state: it is what you get by doing nothing, and it is what the hardware gives you unpowered, via the gate pull-downs and the analogue switch's powered-off isolation. A firmware whose vocabulary is assert/release can express that. One whose vocabulary is "the other value" cannot.

**It is compatible with today's hub, so it can go in without touching the Python.** The hub sends `v=1, m=300` while a button is held and `v=0, m=0` on release — verified 19 October — so no live command's behaviour changes. What changes is that a future caller which sent a non-zero `m` with a release gets a safe outcome instead of a surprising one, and that `m` can finally be described as "release after this long" rather than "do something else after this long".

*Done when:* the host regression harness proves that a timeout on a **released** channel leaves it released (the case that is currently wrong), that a timeout on an asserted channel releases it (the case that currently works by accident), and that fault stop, disconnect and cap latch all land in the same release path. Then once on the bench, with the status query confirming the channel reads as inactive.

**Built in the same pass as task 14**, in PR #2 at `3514fef`: `logical_val` became `asserted`, `apply_digital`/`apply_analog` became `assert_digital`/`assert_analog`, both timeout callbacks release instead of negating, and `m` is now ignored on a release because there is nothing left to time. The prize landed — one `release_channel()` and one `release_all()` with five callers: failsafe timeout, cap latch, release command, disconnect, and `output_control_fault_stop`, which stays free of RTOS and DAC calls so that it still runs before RTOS init. Two judgement calls in it worth a reviewer's eye, both documented in the firmware's overview: a release ignores its `m` field rather than arming a no-op timer, and a release no longer writes the DAC, so an isolated analogue channel still reports its retained millivolts in the status line.

**The v1 question is closed: confirmed 20 October, no v1 dongles are in use anywhere.** So releasing instead of driving the inactive level breaks nothing in the field, and the change needs no compatibility flag, no build variant and no migration — there is no push-pull behaviour left to preserve. That was the only thing gating the merge.

### 16. The hub half of the cap report

Added 21 October, and it exists because the firmware half shipped. [Task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet) required that the latch be *reported* rather than silent, and `3514fef` does report it: `CAP:D:<n>` or `CAP:A:<ch>` on the serial link when a channel latches off. **Nothing in the hub reads it.** So today the cap firing still looks to the user exactly like a broken actuator — they hold the button, the resend loop carries on, and nothing on the screen changes.

*Fix:* the hub parses the line, stops resending into that channel, and shows that control as cut out with a plain-English reason — not an error code, and distinguishable from "can't reach the dongle". *Done when:* a capped channel says so on the screen, and the same screen says something different when the serial link is down.

Small, in the same file as [task 9](#9-two-controllers-at-once-safety), and worth doing in the same pass if that pass is open.

**Its priority went up on 21 October, when the cap was tightened to 30 s.** This said "not a gate on phase 1 or phase 2: the cap is 90 s and nothing in the bench script holds a channel that long." That is no longer true. At 30 s the cap is reachable by ordinary bench behaviour — the slowest axis is 17.6 s, so holding past the end of travel for twelve seconds latches the channel — and with nothing in the hub reading the report, a capped channel looks exactly like a broken actuator. **Do this before the bench if the hub pass is open**, and until it is done, carry the line in the bench notes: if a channel stops responding, release it fully and press again before suspecting hardware.

## Also in step 1, but not gating it

- **A fresh Pi to a working hub, written down**: dialout group, venv, config, systemd unit, and a name on the network the user can type instead of an IP address. *Done when:* done twice from scratch, the second time by someone else following only the document.
- **The screen on the device the user actually holds**, in the orientation they hold it. This is also where the "installable" question gets answered — a service worker needs a secure context, and a LAN address over plain HTTP is not one. *Done when:* the time from picking up a locked device to starting a move is measured, and it is short enough that a person at 2 a.m. would bother.
- **A README a non-programmer can act on**, with a parts list. The current one is good and is written for someone who already knows what a dongle is.

## Not in step 1

Home control (step 3). Mike's layout and input method (step 2). Any cloud, any remote access. Timed runs themselves, which are in the proof of concept but are step 2 work — though [task 14](#14-the-firmware-energise-cap-the-bound-that-does-not-exist-yet), the firmware cap they depend on, needs nothing from step 1 and can be written alongside it. Motor current and stall detection, which is an open hardware question in `plan.md` and not a blocker here.

**Position** presets stay out altogether, timed runs notwithstanding: there is no position sensing, so a named angle is a claim we cannot make. A timed run is a duration with an honest name, not a position with a dishonest one.
