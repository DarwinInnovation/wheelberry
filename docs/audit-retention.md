# Audit retention and the erasure answer

18 October 2026. Fifth and last workstream out of [spec-review.md](spec-review.md), following [movement-semantics.md](movement-semantics.md), [home-assistant-decision.md](home-assistant-decision.md) and [requirements.md](requirements.md).

This closes contradiction 5: **F14 wants an audit log of every action; N-D3 promises the user can export and delete their data, treated as health data under UK GDPR.** Both cannot be unconditionally true. F26 created the slot for the answer; this document proposes what goes in it.

**This is not legal advice.** The reasoning below is about product design, and it reaches the point where a decision needs a data-protection specialist. Where that is the case it says so. The value of doing this now is that it tells you *which* questions to take to that specialist, and it stops M1 shipping an audit log whose shape makes the answer impossible.

## The contradiction is not the hard part

The apparent conflict dissolves quickly. Erasure under UK GDPR Article 17 was never absolute: Article 17(3) sets out exceptions, including compliance with a legal obligation and the establishment or defence of legal claims. "We keep the safety record" is a legitimate position.

What is hard is everything that follows from wanting to be able to say it:

1. **It only works if the lawful basis was chosen in advance.** You cannot refuse an erasure request on a basis you invent when the request arrives.
2. **It only works if the record can be separated.** An erasure request against one table containing both the seating safety record and the living-room light history is a request you can only answer all-or-nothing.
3. **It only works if you told the user.** A retained record the user was never warned about is a transparency failure even when the retention is lawful.

So the real deliverable is not a number of years. It is a set of record classes, a basis per class, a storage design that makes partial erasure possible, and a sentence the user is told at the start.

## Finding: who the controller is changes per deployment, and nobody has said so

This is the most consequential thing in this document, and it was not visible in the spec.

Wheelberry has three deployment shapes, and the data-protection relationship is different in each:

| Deployment | Where the data lives | Likely relationship | Who owes the erasure duty |
| --- | --- | --- | --- |
| **Local-only household install** — hub in the home, no cloud, no portal (the F20 install) | Entirely on the user's own hub, on their own hardware, in their own home | Darwin Innovation supplies software and **holds no personal data at all**. Closest analogy is a washing machine, not a service | Nobody owes a statutory duty to the user, because there is no controller processing their data. The user holds their own records |
| **Household install with cloud** — remote access, Alexa, phone app, portal | Hub plus Darwin-operated cloud | Darwin is a **controller** for what the cloud holds, and the user is the data subject | Darwin, for the cloud copy. The hub copy is still the user's |
| **Organisational deployment** — care provider, charity, housing association across many homes | Hub, cloud, and the organisation's own portal use | The organisation is most likely the **controller**, Darwin the **processor** acting on its instructions | The organisation, with Darwin obliged to assist. Darwin cannot unilaterally delete, nor unilaterally refuse |

Three consequences, each of which is a product decision rather than a legal one:

- **Local-first is a genuine privacy dividend and should be stated as one.** For the cloud-free install the honest answer to "how long do you keep my data?" is "we never have it." That is a real differentiator for this user group, and the spec currently buries it inside a reliability argument.
- **The erasure interface has to know which shape it is in.** In an organisational deployment, a user asking Wheelberry to delete their seating record is asking the wrong party, and the product must route rather than refuse — forwarding the request to the controller and telling the user it has done so. Silently refusing a vulnerable user's erasure request because of a contract they never saw is the worst available behaviour.
- **The processor case needs the retention classes anyway.** A care provider will ask "what do you keep and for how long" during procurement, and the answer has to be in writing before the first organisational sale, not after.

**Where this needs specialist input:** whether the local-only case is as clean as it looks. Remote support (F13), telemetry, and any crash reporting could each pull Darwin back into a controller relationship for data it believed stayed in the home.

## Record classes

F26 asks for classes, a retention period and a lawful basis for each. Six classes, which fall into three groups by how they behave under an erasure request.

### Group A: the safety record — survives erasure

| Class | What it holds | Why it is kept |
| --- | --- | --- |
| **C1 Movement record** | Every movement of a person: which axis, which actor, which channel, which mode, when it started, how it ended (released on stop, run-time cap, watchdog, cancel window unanswered), and the clinician configuration in force at the time | This is the record that answers "what happened" after an incident. It is the evidence base for the risk file (N-S6), for post-market surveillance if N-REG1 says the controller is a device or accessory, and for defending or conceding a claim |
| **C2 Clinical configuration history** | Clinician opt-ins and withdrawals, per-axis limits, per-axis acceptance of the entrapment residual risk (P7), service-mode sessions (F16), and who changed each and when | C1 is uninterpretable without it. "The seat tilted to the end of its travel" means one thing if the range was set correctly at installation and another if it was not. It is also as much a record about the *clinician* as about the user |

### Group B: the accountability record — partially survives

| Class | What it holds | Why it is kept |
| --- | --- | --- |
| **C3 Delegated-action record** | Actions taken on a user's devices by someone or something *other than that user*: a carer, organisational staff, an AI assistant (with the originating utterance, A5), a Home Assistant automation attributed to the integration actor (F21), or a routine | This is what F14's audit is actually *for*, and what F12 promises the organisation admin. Accountability for action taken on a person's behalf |
| **C4 Access and security record** | Authentication, pairing, key rotation and revocation (F25), permission grants and withdrawals, failed authentication, remote-support sessions and the consent for them | Security purpose. Needed to answer "who had access, when" after a compromise, and the only record that can show a permission was withdrawn before an action rather than after |

### Group C: the usage record — deleted on request, no argument

| Class | What it holds | Why it is kept |
| --- | --- | --- |
| **C5 Own-action usage record** | A user's own actions on their own non-movement devices through their own channels: lights, heating, blinds, plugs, scenes | Thin justification. It supports the user's own insight, troubleshooting, and "why did the heating come on" — and that is all |
| **C6 Diagnostics** | Hub and controller health, firmware versions, crash and error reports, backend connection state | Keeping the product working. Should hold no user identifier and no device-level activity |

### The cut that reduces the data held

The split between **C3** and **C5** is the useful idea in this document, and it is worth stating as a principle:

> The audit log's purpose is accountability for action taken **on** a person, by someone other than that person. It is not a diary of the person's own life.

F14 as written ("every action: who, which channel, which device, result") does not make that distinction, and the result is that a disabled user's own light switching is logged as permanently and as completely as a carer moving their seat. For a user whose every interaction with their home passes through Wheelberry — which is the entire point of the product — that log is a minute-by-minute record of when they wake, sleep, eat and are alone in a way an able-bodied person's home simply does not produce.

That asymmetry is not acceptable as a design default, and it is what N-D1's "minimisation applied at collection, not at export" is for. So:

- **C5 is minimal by default and short by default.** Log that a device changed state and by which channel; do not build behavioural history the user did not ask for. The user can turn on longer history for their own benefit, and turn it off again.
- **C3 is full and longer**, because someone else acted.
- A user acting on *another* user's device is C3, not C5, even in a household.

## Retention periods

Proposals. The reasoning matters more than the numbers, because the reasoning is what a specialist will check.

| Class | Proposed retention | Reasoning |
| --- | --- | --- |
| **C1 Movement** | Duration of use, plus a tail that depends on the user — see below | Claim limitation, post-market surveillance, incident investigation |
| **C2 Clinical configuration** | Same as C1, and never shorter | Useless if it expires before the record it explains |
| **C3 Delegated action** | 24 months rolling, by default. Extended to C1's period for any record relating to movement, and for any record under active complaint or investigation | Long enough for a pattern of concern to be visible and raised; short enough not to be a career record of a carer |
| **C4 Access and security** | 12 months rolling. Longer for any account or device subject to a live security investigation | Conventional, and proportionate to the purpose |
| **C5 Own-action usage** | 7 days detailed by default, user-extendable to 13 months. Deleted immediately on request | Minimisation. Seven days answers "what happened yesterday", which is the real use |
| **C6 Diagnostics** | 90 days, with no user identifier | Enough for a fault to be reproduced |

### The three-year answer is wrong for this user group

The obvious tail for C1 is the personal-injury limitation period: three years in England and Wales from the date of knowledge. For most products that would be the end of it.

It does not work here, because of exactly who Wheelberry is for:

- **For a child**, the clock does not start until their 18th birthday — so a record of a movement at age 9 may be needed until they are 21.
- **For a person who lacks capacity**, the limitation clock may not run at all. A three-year retention period against a claim with no deadline is a policy that reliably destroys the evidence before it is asked for.
- Wheelberry's user population contains both, by design. Principle 2 and the clinician persona assume it.

So a single number cannot be right. Proposed instead:

| User | C1 and C2 tail after last use |
| --- | --- |
| Adult with capacity | 3 years |
| Child at the time of the record | Until their 21st birthday, or 3 years after last use, whichever is later |
| Adult assessed as lacking capacity to litigate | 10 years, reviewed, on the basis that the limitation clock may not run |

This is uncomfortable — the longest retention applies to the people least able to consent to it — and that discomfort is the correct signal to take it to a specialist rather than settle it here. It is also an argument for making C1 as thin as it can be while still answering the safety question: **the way to hold health-grade data for 10 years responsibly is to hold very little of it.**

**Where this needs specialist input:** all of it, and specifically whether capacity-based differential retention is workable at all, given that capacity is not static and recording an assessment of it is itself sensitive.

### If the controller is a medical device, the period may not be ours to choose

N-REG1 is still open, and the answer feeds straight into this. If the seating controller is a medical device or accessory under UK or EU MDR, then post-market surveillance and vigilance obligations attach, with their own record-keeping durations — generally measured in years after the last unit is placed on the market, which is a *product* clock rather than a per-user one and can run far longer than any of the above.

That cuts both ways, and the second half is the useful part:

- It lengthens what must be kept, at product level.
- It also **supplies the lawful basis**, which is the harder problem. See below.

**This makes retention dependent on N-REG1, which is an M0 deliverable.** The dependency should be recorded, because the natural instinct is to treat the regulatory assessment and the privacy work as separate workstreams, and they are not.

## Lawful basis: the part that actually decides whether erasure can be refused

Health data is special category data. Processing it needs both an Article 6 lawful basis and an Article 9 condition. The choice of Article 9 condition is what determines whether the safety record survives an erasure request, and it is the single most important decision in this document.

| Candidate | Fit | Verdict |
| --- | --- | --- |
| **Art 9(2)(a) explicit consent** | Superficially the most respectful, and the instinct for a product built on user autonomy | **Do not use it for C1 or C2.** Consent must be freely given and withdrawable, and withdrawal would oblige deletion of the safety record. It also sits badly with users who may lack capacity to give it, and with a product where refusing consent means the chair does not work — which makes the consent not freely given anyway |
| **Art 9(2)(h) health or social care** | Processing necessary for the provision of health or social care, subject to professional-secrecy conditions | **Plausible, especially in organisational deployments**, where a care provider is the controller and clinicians are in the loop. Weaker for a household install with no care provider involved |
| **Art 9(2)(i) public interest in public health** | Expressly includes "ensuring high standards of quality and safety of health care and of medicinal products or medical devices" | **The best fit for C1 and C2**, and conspicuously so — it is written for exactly this situation. Strongest if N-REG1 concludes the controller is a device or accessory, because the obligation then exists in black and white |
| **Art 9(2)(f) legal claims** | Necessary for the establishment, exercise or defence of legal claims | **Useful as a secondary basis** for the tail period, and the natural pair to the limitation reasoning above |

Proposed position:

- **C1 and C2:** Article 9(2)(i), with 9(2)(f) for the post-use tail, and a legal-obligation Article 6 basis if N-REG1 brings one. Erasure refusable under Article 17(3), with the refusal explained in plain language.
- **C3 and C4:** legitimate interests under Article 6, with the Article 9 question arising only where a record reveals health data by implication. Erasure considered case by case, which is the honest answer rather than a comfortable one.
- **C5 and C6:** no Article 9 condition needed if they genuinely hold no health data, which is itself an argument for the C3/C5 cut. Erasure honoured in full, immediately.
- **Never rely on consent for anything that must survive its withdrawal.** This is the rule to write down, because consent is the basis a well-meaning team reaches for by default.

## Finding: anonymisation is mostly a fiction here, and should not be the plan

F26 offers a choice: answer an erasure request "by anonymisation or by a stated lawful basis for retention". The anonymisation route sounds kinder and is largely unavailable, which is worth stating before someone builds it.

Anonymisation has to be irreversible, and re-identification judged in context. Consider the C1 record with the user identifier stripped: seat tilt events, timestamped to the second, on one chair, in one home, with one occupant, alongside a clinical configuration history naming the clinician who set it. Anyone with any knowledge of that household can re-identify it immediately. That is **pseudonymised** data, which remains personal data, not anonymous data.

Genuine anonymisation would require aggregation severe enough to destroy the forensic value — which is the whole purpose of C1.

So:

- **Do not present pseudonymisation as erasure.** If the user identifier is removed but the record is still attributable, say that, and rely on the lawful basis instead.
- **Aggregate statistics are a separate, legitimate product**: counts and distributions across installs, derived from C1 and genuinely anonymous because they are many-to-one. Useful for the risk file and for safety evidence. Keep them, and keep them clearly distinct from the per-user record.
- Honest pseudonymisation does still reduce risk and is worth doing at the point where a record passes out of the safety window into a statistical one.

## What this means for the audit log's design, before M1

F26 says the answer must be written down before M1 ships an audit log. It also has to be *built* a particular way, and these are the constraints that are expensive to add later.

1. **Classes are separate stores, or at minimum separately and verifiably deletable.** One table with a `type` column is acceptable only if deletion by class and by user is a tested operation. The failure mode is an erasure request that can only be answered all-or-nothing.
2. **Every record carries its class and its retention expiry at write time**, not computed later from rules that will have changed.
3. **Expiry is enforced by something that runs.** A retention policy nothing deletes is a retention policy of "forever", and that is the default outcome of writing this document and building nothing.
4. **Tamper-evidence and erasure fight each other, and the resolution is crypto-erasure.** A safety record should be append-only and tamper-evident — a hash chain — but deleting a record from a hash chain breaks it. Store the payload encrypted under a per-user or per-record key, keep the chain over hashes, and erase by destroying the key. The chain stays verifiable, the content becomes unrecoverable, and the log can still prove no record was removed. Deciding this after the log is built means rebuilding it.
5. **The buffered-audit path must preserve class.** N-R4 buffers records through an outage; records must not arrive in the cloud stripped of the class that governs their retention.
6. **The log must state its own incompleteness.** Already required by F14 for actions taken in Home Assistant's own UI. An admin reading the log during an incident needs to see the boundary rather than infer completeness.

## What the user is told, and when

The transparency obligation is not satisfied by a privacy policy nobody reads, and for this user group that is not a cynical observation but an accessibility requirement (N-A1, N-A3). Proposed:

- At onboarding, in the flow and not only in a document: **what is kept, for how long, and what will not be deleted on request** — in plain language, at the point the seating feature is enabled rather than buried at account creation.
- The safety record's non-deletability is disclosed **before** the user commits to using powered seating through Wheelberry, because it is a condition of the feature.
- An in-product view of what is held about them, which is also how N-D3's export is best delivered.
- Where Wheelberry is a processor for an organisation, the user is told who the controller is and how to reach them.

## Proposed requirement changes

Wording for [requirements.md](requirements.md), to be applied once the decisions below are taken. Nothing is applied yet.

**F26, revised** — Classify every audit and usage record into one of the six classes C1–C6, and record for each class a retention period, an Article 6 lawful basis and, where applicable, an Article 9 condition. Store classes so that deletion by class and by data subject is a tested operation. Stamp each record with its class and retention expiry at write time, and enforce expiry automatically. Never rely on consent as the basis for any record that must survive the withdrawal of that consent.

**F29, new** — Determine the controller and processor relationship per deployment shape, and implement erasure and subject-access handling accordingly: answer directly where Wheelberry is the controller, and route the request to the controller and inform the requester where it is not. A request must never be silently refused.

**F30, new** — Make the audit log append-only and tamper-evident, with per-record or per-subject encryption so that erasure can be performed by key destruction without breaking verifiability.

**F31, new** — Provide the user with an in-product view of every record held about them, by class, with its retention period and whether it can be deleted on request; and disclose the non-deletable safety record before powered seating is enabled.

**N-D3, revised** — The user can export and delete their data, subject to the retention classes of F26. Classes C5 and C6 are deleted in full on request. C1 and C2 are retained under their stated lawful basis, and the refusal is explained in plain language, in an accessible form, naming the basis and the retention period. Pseudonymisation is never described to a user as erasure.

**N-D5, new** — Retention of C1 and C2 differentiates by the data subject's circumstances where limitation periods differ, and the policy is reviewed whenever N-REG1's conclusion changes.

**N-REG2, extended** — The DPIA covers the six record classes, the per-deployment controller analysis, the capacity-differentiated retention of C1 and C2, and the conclusion that pseudonymisation of the movement record does not constitute anonymisation.

## Decisions needed

1. **The record classes and the C3/C5 cut.** Is accountability-for-delegated-action the right purpose for the audit log, with the user's own activity minimised and short-lived? This is the decision that most reduces how much health-grade data Wheelberry holds.
2. **The Article 9 route for the safety record.** Proposed 9(2)(i) with 9(2)(f) for the tail, and explicitly not consent.
3. **The retention tails**, including whether capacity-differentiated retention is a direction to pursue with a specialist or to reject as unworkable.
4. **Whether to take this to a data-protection specialist now or at the DPIA.** My recommendation is now, because three of the design constraints above are expensive to retrofit, and the DPIA is an M0 deliverable that this document is upstream of rather than part of.

## Still open after this

- **N-REG1's conclusion**, which this document depends on in two places.
- **The exact local buffer capacity** for N-R4.
- **Whether remote support and diagnostics pull Darwin into a controller relationship** in the otherwise clean local-only install.
