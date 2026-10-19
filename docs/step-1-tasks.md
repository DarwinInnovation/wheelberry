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

So step 1 is **verify it on a chair, then close four gaps**. Not weeks of building. The three safety rules that depend on code — hold-to-run, the firmware watchdog, release on failure — are implemented and documented; what has not happened is anyone watching them hold on a real chair with a stopwatch.

## Phase 1 — bench, chair empty

Nobody in the chair. Wheels off the ground or the chair on blocks.

1. **Axis mapping.** Drive all six outputs; check each one moves the axis its name claims, in the direction its icon claims. *Done when:* `config.yaml`'s action names match the physical axes, verified one at a time, and anything mislabelled is fixed in config rather than remembered.
2. **The failsafe, broken six ways, each mid-move.** Release the button; switch browser tab; put the phone in flight mode; pull the USB cable; `kill -9` the server; pull power from the Pi. *Done when:* every one of the six stops the axis, and each result is written down — including any that stop slower than expected.
3. **Measure the stop, once.** Video at 60 fps is enough: frames from release to axis stationary. *Done when:* there is a number on paper to compare against the 300 ms watchdog. One measurement, not a programme — but an assumed number is not evidence.
4. **The chair's own switch.** One chair button, through the input module, triggering one action. *Done when:* it fires reliably, and the 4 s default LOW hold is tuned to something a person can actually do on purpose but not by accident.
5. **The LiNX range is the real limit.** *Done when:* driving an axis to its end from Wheelberry stops exactly where the chair's own controls stop — confirming rule 4, that the chair's configured range is in force and Wheelberry cannot exceed it.

## Phase 2 — the observed check

6. **Name the second pair of eyes.** Not Richard, because Richard is writing the code. *Done when:* a person has agreed to an afternoon.
7. **The afternoon.** Every axis through full travel, repeatedly, with power pulled at random points in the travel — not just at the ends, because with no position sensing every point in the travel is a resting place. *Done when:* the observer has watched it and says so, with notes of anything that surprised them.

This is the gate. It happens before anyone sits in a chair that Wheelberry moves.

## Phase 3 — in the chair

8. **Richard tilts the chair from a phone**, and pulling the USB cable mid-move stops it.

That is step 1's done-when, and at that point the claim at the top of `plan.md` has been tested on exactly one person who is the worst possible test of it. Step 2 is where it starts to mean something.

## Phase 4 — the four gaps

These are what make it a hub rather than a test rig. None is large; the first is a safety gap and should be done before phase 3.

### 9. Two controllers at once (safety)

Documented behaviour today: each WebSocket session gets its own `SessionController`, and two browsers holding buttons "interleave on the serial port — last write wins, fine for digital outputs". That is true of the *output*, but it breaks safety rule 5 as written. If a carer's phone is holding `tilt_forward` and the user releases their own button, the user's deassert is overwritten by the other session's next resend 100 ms later. The chair keeps moving.

What still holds: the firmware watchdog, the chair's own controls, and pulling the power. So the chair is never *unstoppable* — but "anyone in the room can stop it" is not true of the software, and that is the rule a user would rely on.

*Fix:* one active controller at a time with explicit takeover, and a stop that cancels every session's resend task, not just the caller's. A single owner variable in the server. *Done when:* two phones, one holding, the other pressing stop — and the chair stops.

### 10. A passcode (before step 4, not before step 1)

Today: no authentication on the WebSocket, no TLS. Anyone who can reach the port can move the chair, and can also fire any configured input action — including the `command` type, which runs a shell command on the host. Fine on a bench. Not fine for a hub living in someone's home for a month, where the network also has guests' phones and a television on it.

*Fix:* one shared passcode per hub, entered once per device, checked on the WebSocket upgrade. Explicitly **not** accounts, roles, or the per-user permission matrix in [`background/requirements.md`](background/requirements.md) — that is the funded product, and it is out. *Done when:* a second device on the network cannot move the chair without the passcode, and the people who should be able to are not locked out of their own chair when they forget it.

### 11. It stops being called a test site

*Recommendation: rename the repository to `wheelberry-hub`; do not start a new one.* Its git history is where the failsafe model was developed, and that history is the closest thing this project has to safety evidence. A fresh repo throws it away. GitHub redirects the old name. *Done when:* renamed, and its README says what it now is rather than what it was.

### 12. Published, with a licence

The three repositories the proof of concept depends on — the hub, and both firmwares — are private, while the parked TypeScript generation is public. *Done when:* each is public, each has the Apache-2.0 `LICENSE`, each has been checked for anything personal first (the monorepo's committed email address is the known case), and `__pycache__/`, currently committed in the hub repo, is removed and ignored.

## Also in step 1, but not gating it

- **A fresh Pi to a working hub, written down**: dialout group, venv, config, systemd unit, and a name on the network the user can type instead of an IP address. *Done when:* done twice from scratch, the second time by someone else following only the document.
- **The screen on the device the user actually holds**, in the orientation they hold it. This is also where the "installable" question gets answered — a service worker needs a secure context, and a LAN address over plain HTTP is not one. *Done when:* the time from picking up a locked device to starting a move is measured, and it is short enough that a person at 2 a.m. would bother.
- **A README a non-programmer can act on**, with a parts list. The current one is good and is written for someone who already knows what a dongle is.

## Not in step 1

Home control (step 3). Mike's layout and input method (step 2). Any cloud, any remote access. Position presets of any kind — there is no position sensing. Motor current and stall detection, which is an open hardware question in `plan.md` and not a blocker here.
