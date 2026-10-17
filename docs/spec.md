# Wheelberry: Spec, Architecture and Milestones

Draft for discussion, last updated 11 October 2026. This file is a snapshot of the working [Claude Doc](https://claude.ai/code/artifact/7fb1cfd2-8184-444a-9efe-f79792d1fc75), where comments and edits happen.

## Mission and principles

> Wheelberry gives disabled people simple, safe and secure control of the technology around them, from wheelchair seating and beds to lights, heating and Home Assistant, using whichever method suits them: touch, voice, phone or AI assistant. Users shape their own setup, with carers and support teams helping through a shared management portal. Wheelberry is open source and affordable, so it works with what people already own. Wheelberry does not drive wheelchairs; it controls seating and the environment around the user.

Richard agreed this mission on 11 October 2026. The principles below turn it into design rules.

1. **Safety is the headline promise.** Anything that moves a person (seat tilt, recline, leg rests, beds, hoists) has limits a clinician sets and fail-safes that release movement if control is lost, and stop always wins. Wheelberry never drives a wheelchair.
2. **The user is in charge of their setup.** Users decide what is controlled, how, and who else can help. Carers and support teams work through the same shared portal, with the access the user gives them.
3. **One device model, many front-ends.** Every device is described once, as capabilities (on/off, level, position, temperature). Touch, voice, phone and AI channels are thin adapters over that model, so a new device works everywhere at once.
4. **Accessibility first.** The user interface meets WCAG 2.2 AA as a floor and supports switch access, scanning, large targets, eye gaze and screen readers. Every action is reachable by more than one input method.
5. **Local first.** Core control works inside the home with no internet. The cloud adds remote access, voice assistants and the portal, never a dependency for switching on a light.
6. **Secure and private by default.** Least-privilege access per user and device, encrypted everywhere, minimal data leaving the home.
7. **Open source and affordable.** Works with equipment people already own (their chair's control system, their bed, Home Assistant, Matter devices) on low-cost hardware. New device types arrive as plugins.

## Users

Six kinds of people touch Wheelberry; the disabled end user is the one every decision is tested against.

| User | Who they are | What they need from Wheelberry |
| --- | --- | --- |
| End user | A disabled person with any mix of motor, speech, vision or cognitive impairment | Reliable, fast control through the input method that works for them, clear feedback that an action happened, and ownership of their own setup |
| Carer or family member | Helps day to day, at home or remotely | Shared control where the user allows it, alerts when something needs attention |
| Clinician (OT, seating specialist) | Prescribes and reviews seating and positioning | Set safe ranges and presets for powered seating; review usage |
| Installer or integrator | Fits hardware and configures the home | Device discovery, layout building, diagnostics, firmware updates |
| Organisation admin | Runs a care provider, charity or housing association with many homes | Manage many sites and staff, audit who did what |
| Developer | Contributes integrations or hardware designs | Documented APIs, a plugin model, a simulator to test against |

## Scope

Wheelberry controls wheelchair seating, beds and common home devices; it never drives a wheelchair, which is safety-critical in a different class.

### What Wheelberry controls

| Device class | Examples | How Wheelberry reaches it | Proposed release |
| --- | --- | --- | --- |
| Home control | Lights, heating, blinds, plugs, door openers, TV | Through Home Assistant, which already speaks Zigbee, Z-Wave, Matter, Wi-Fi and hundreds of vendor APIs | MVP |
| Open source platforms | Home Assistant, plus Node-RED and openHAB later | Two-way: Wheelberry uses Home Assistant as a backend and also shows up inside it as an integration | MVP (Home Assistant only) |
| Bespoke hardware | Wheelchair seat tilt, recline, leg rests, bed or hoist controls | The Wheelberry Dongle, which drives and reads the chair's own LiNX auxiliary modules; Bedberry for electric beds | Second release |

### How people control it

| Channel | Approach | Proposed release |
| --- | --- | --- |
| User web page | Installable progressive web app, built for switch, scanning, eye gaze and touch | MVP |
| Voice: Alexa | Alexa Smart Home skill via the Wheelberry cloud | Release 3 |
| Voice: Siri | Hub exposes devices to Apple Home (HomeKit bridge), plus Siri Shortcuts from the phone app | Release 3 |
| Phone app | Native shell around the web app, adding widgets, notifications and Shortcuts | Release 4 |
| AI assistants | A Model Context Protocol (MCP) server so Claude and similar assistants can see and control devices within the same permissions | Release 3 |
| Management portal | Web portal for carers, clinicians, installers and organisations | Release 4 |

### Out of scope for now

- Wheelchair driving and propulsion.
- Medical monitoring or clinical alerts (falls, vital signs).
- Building our own home-automation protocols or radios.

## Existing work

The restart keeps the Wheelberry Dongle (hardware, firmware and test site) and Bedberry's bed control ideas. The wheelberry monorepo is old work in progress, so the plan is to reuse parts of it rather than build on it. Richard named the first four repositories below as the ones that matter.

| Repository | What it is | State | Plan |
| --- | --- | --- | --- |
| [pcb\_wheelberry\_dongles](https://github.com/DarwinInnovation/pcb_wheelberry_dongles) | KiCad design for the dongle boards (DSUB-9, 3.5 mm jack) that connect to LiNX auxiliary modules | Initial commit, March 2026 | Keep |
| [wheelberry\_dongle\_http\_test\_site](https://github.com/DarwinInnovation/wheelberry_dongle_http_test_site) | Local Python web server that works with the dongles. Hold-to-run seat buttons, plus actions triggered from chair inputs | Most recent (8 Oct 2026); 300 ms watchdog with 100 ms resend | Keep its fail-safe model as the reference; port it into the hub |
| [wheelberry](https://github.com/DarwinInnovation/wheelberry) | Old work in progress: TypeScript monorepo with cloud proxy (Express, Socket.IO, MongoDB), Alexa skill with Amazon login, React portal, blanket and stub wheelchair clients | Consolidated April 2026; wheelchair transport is a stub | Reuse parts (Alexa account linking, portal shell); start the hub fresh |
| [bedberry](https://github.com/DarwinInnovation/bedberry) | Raspberry Pi Zero 2W board for Okin electric beds: buttons and pressure pads, Alexa, and a tilt sensor for angle presets ("sit up" goes to 60 degrees) | 2022; PCB with manufacturing files, TypeScript software | Bring beds in as a device class; reuse the sensor-based presets for seating too |
| [firmware\_wheelberry\_output\_module](https://github.com/DarwinInnovation/firmware_wheelberry_output_module) | STM32H523 USB module driving a LiNX DLX-OUT500 (6 digital outputs, 2 analogue) | v2 fail-safe merged 8 Oct 2026; unit tests | Keep |
| [firmware\_wheelberry\_input\_module](https://github.com/DarwinInnovation/firmware_wheelberry_input_module) | STM32H523 USB module reading a LiNX DLX-IN200 (8 inputs) | Version 1, April 2026 | Keep; adds a new channel, the chair's own switches |
| node-wheelberry-proxy, -proxy-client, -wheelchair, -blanket | Earlier copies of the monorepo apps | Each says it moved to the monorepo | Archive |
| [node-wheelberry-i2c](https://github.com/DarwinInnovation/node-wheelberry-i2c) | MCP23017 I2C library for the 2022 boards | Dependency updates only | Archive unless the Pi boards return |

Two things in the existing code need changing:

- The Alexa wheelchair skill moves the seat for a spoken number of seconds ("tilt up 5 seconds"), with no hold-to-run. That conflicts with requirement F9, so voice should only call preset positions, and only once limits exist. Bedberry's angle sensing shows how to make presets that stop at a measured position.
- `apps/proxy/cfg/wheelchair.json5` in the public monorepo contains a personal email address. It should move to an untracked config file.

## Functional requirements

Requirements are numbered so later work, tests and issues can trace back to them.

**Devices and control**

- **F1** Represent every device as a set of typed capabilities (switch, level, position, temperature, scene) grouped by room.
- **F2** Let a user run any permitted action from any enabled channel, with the same result and the same safety checks.
- **F3** Report device state back to every channel within the same interaction (visible, spoken, or both), including when an action failed.
- **F4** Support scenes and routines ("Bedtime": recline seat, dim lights, set heating), runnable by one action and on a schedule.

**Personalisation and access**

- **F5** Hold a profile per user: input method, scanning speed, layout, text size, contrast, voice phrases.
- **F6** Let installers and users build simple control layouts per person, with few large targets as the default.
- **F7** Grant permissions per user, per device and per channel (for example, a carer may control lights remotely but not seating).

**Safety for moving equipment**

- **F8** Enforce clinician-set limits on every moving capability: range, speed, and allowed positions.
- **F9** Require hold-to-run or explicit confirmation for movement, configurable per user, and stop on release, timeout or loss of connection.
- **F10** Make stop available on every channel and never blocked by permissions, queues or the cloud.

**Management portal**

- **F11** Onboard a home: discover devices, connect Home Assistant, pair Wheelberry controllers.
- **F12** Manage users, roles and organisations across many homes.
- **F13** Monitor hub and controller health, push firmware updates, and offer remote support only with the end user's consent.
- **F14** Keep an audit log of every action: who, which channel, which device, result.

## Non-functional requirements

Safety and accessibility are pass/fail gates for every release; the targets below are proposals to confirm with users.

| Area | Requirement (proposed target) |
| --- | --- |
| Safety | Moving equipment follows a documented risk-management process (ISO 14971 style). Hardware end-stops and an independent stop circuit do not depend on software. Movement stops if the controller loses contact with the hub. |
| Security | Every user, device and channel authenticates; per-device pairing keys; TLS on every link, including inside the home. No default passwords. Signed firmware and signed hub updates. Independent penetration test before any pilot outside the team. |
| Accessibility | WCAG 2.2 AA minimum, tested with real users of switch, eye-gaze and screen-reader setups each release. |
| Responsiveness | Local actions feel instant: under 300 ms from input to device command on the home network. |
| Reliability | Local control keeps working with the internet down; the hub recovers on its own after a power cut. |
| Privacy | Usage and seating data are treated as health data under UK GDPR: data minimisation, stored in the UK or EU, user can export and delete it. |
| Regulatory | Assess early whether the seating controller is a medical device or accessory under UK MDR and EU MDR, and plan for it if so. |
| Openness | Open source code and hardware designs (licence to decide); documented public APIs. |

## Proposed architecture

A small hub in each home owns the device model and the safety rules; every channel, local or cloud, goes through it, so a rule written once applies everywhere.

![Wheelberry architecture: hub, cloud and devices](images/architecture.png)

The web app, phone app and AI assistants talk to the hub directly on the home network, or through the cloud tunnel when away. Alexa and the portal always go through the cloud. The hub opens the tunnel outbound, so no ports are opened on the home router.

**Key decision: build on Home Assistant, not beside it.** Home Assistant already integrates thousands of home devices. Wheelberry adds what it lacks: accessible interfaces, per-user permissions, safety for moving equipment, multi-channel control and multi-home management. The hub can run as a Home Assistant add-on or on its own small computer.

**Bespoke hardware** is the existing Wheelberry Dongle: STM32 input and output modules on USB, driven by a small Linux host on the chair. The output module drives the chair's LiNX DLX-OUT500 seating module and releases every output if commands stop arriving. The input module reads the LiNX DLX-IN200, so the chair's own switches can trigger Wheelberry actions. The chair's own end-stops and limits stay in force.

| Part | Proposed technology | Reason |
| --- | --- | --- |
| Hub | TypeScript on Node.js, SQLite; Raspberry Pi 5 or Home Assistant add-on | Decided by Richard, 11 October 2026. Other tools and services may be Python, as much existing Darwin Innovation software is |
| Web app and portal | React progressive web app | One codebase for desktop, tablet and phone |
| Phone app | Native shell (Capacitor or React Native) around the web app | Adds widgets, notifications and Siri Shortcuts cheaply |
| Controller firmware | Existing STM32H523 dongle firmware over USB serial; the link from dongle host to hub is still to decide | Already built, with a tested fail-safe |
| Cloud | Containerised services with Postgres, UK or EU region | Standard, portable, meets data residency |
| Voice | Alexa Smart Home Skill API; HomeKit bridge on the hub for Siri | Official routes with device-style control |
| AI assistants | MCP server over the hub's local API | Works with Claude and other MCP clients under the user's permissions |

## Milestones

Six milestones take Wheelberry from research to a multi-home pilot; the local MVP comes first because it proves the core with no safety risk, and seating waits for its own safety gate.

![Roadmap: 6 milestones, 4 gates](images/roadmap.png)

Seating (M2) and voice and AI (M3) can run side by side once the MVP passes its gate. No dates are set yet; they depend on team size and budget, which are open questions below.

## Risks and open questions

The biggest risk is the wheelchair seating work: it is the most valuable feature and the only one that can hurt someone.

| Risk | Mitigation |
| --- | --- |
| A software or network fault moves a seat unexpectedly | Hardware interlocks and stop circuit, hold-to-run, clinician limits, bench and user testing before any pilot |
| The dongle only fits LiNX chairs | Keep seating behind the capability model, so other makers' auxiliary interfaces can be added later |
| Seating controller counts as a medical device | Regulatory assessment in Milestone 0, before hardware design is fixed |
| Voice platforms change rules or APIs | Keep voice adapters thin; core control never depends on them |
| Building for many disabilities at once dilutes the product | Pick one or two pilot users and design with them first |
| Home Assistant is hard for non-technical installers | Hide it behind Wheelberry's onboarding; offer a preconfigured hub |

### Open questions for Richard

- [ ] Who are the first pilot users, and which input methods do they rely on?
- [ ] Beyond LiNX, which wheelchair control systems matter?
- [x] Do you agree wheelchair driving is out of scope? Yes, decided 11 October 2026.
- [ ] Should Wheelberry sit on top of Home Assistant (recommended) or stand alone?
- [ ] Is this an open source project, a product, or both? Which licence?
- [ ] Who is the team, and is there a budget or deadline that milestones should fit?
- [ ] Who runs the cloud side, and is UK or EU hosting a requirement?
- [ ] Are care organisations managing many homes an early customer, or later?
