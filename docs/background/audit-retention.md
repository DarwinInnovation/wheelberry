# Audit retention and the erasure answer

> **Parked — background, not the plan.**
>
> Written between 11 and 18 October 2026 for a larger, funded version of Wheelberry, and moved here on 19 October 2026. The live plan is [`../plan.md`](../plan.md) and it supersedes this document. Nothing here is known to be wrong; it is ahead of where the project is.
>
> **What it is worth later:** becomes necessary the week remote access or an organisational customer appears, and three of its design constraints cannot be retrofitted cheaply once the first record is written.

18 October 2026. Fifth and last workstream out of [spec-review.md](spec-review.md), following [movement-semantics.md](movement-semantics.md), [home-assistant-decision.md](home-assistant-decision.md) and [requirements.md](requirements.md).

This closes contradiction 5: **F14 wants an audit log of every action; N-D3 promises the user can export and delete their data, treated as health data under UK GDPR.** Both cannot be unconditionally true. F26 created the slot for the answer; this document proposes what goes in it.

**This is not legal advice.** The reasoning below is about product design, and it reaches the point where a decision needs a data-protection specialist. Where that is the case it says so. The value of doing this now is that it tells you *which* questions to take to that specialist, and it stops M1 shipping an audit log whose shape makes the answer impossible.

## Decisions taken, 18 October 2026

| # | Question | Decision |
| --- | --- | --- |
| 1 | The record classes and the C3/C5 cut | **The cut is rejected. F14 stands as written: every action is logged alike**, including a user's own actions on their own non-movement devices |
| 2 | The Article 9 route for the safety record | **Article 9(2)(i)** public health for C1 and C2, with **9(2)(f)** legal claims for the post-use tail. Explicitly not consent |
| 3 | The retention tails | **Capacity-differentiated retention is the direction to pursue**, with a specialist, and with the reservations recorded |
| 4 | When a data-protection specialist is engaged | **Later — before the first organisational sale**, rather than now |

Decisions 2 and 3 are as proposed and are written in below as settled. Decision 1 goes the other way, and the rest of this document follows it rather than arguing with it — but the protection the cut was providing has to come from somewhere, and working out where is most of what changed in this pass. The sections below are rewritten accordingly; the proposals they replace are not kept, because a document that records both its rejected and its adopted position is a document nobody can act on.

The requirement wording at the end **has been applied** to [requirements.md](requirements.md).

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
| **C5 Own-action usage record** | A user's own actions on their own non-movement devices through their own channels: lights, heating, blinds, plugs, scenes. Recorded with the same completeness as C3 (decision 1) | Accountability as a single uniform rule, plus the user's own insight and troubleshooting. The justification for the *content* is thin; the justification for logging it *alike* is that one rule has no seams for an edge case to fall through |
| **C6 Diagnostics** | Hub and controller health, firmware versions, crash and error reports, backend connection state | Keeping the product working. Should hold no user identifier and no device-level activity |

### Decision 1: every action is logged alike

The proposal here was to cut the log by purpose — accountability for what is done **to** a person, not a diary of their own life — and to make a user's own non-movement activity minimal and short-lived. That is rejected. F14 stands: every action through a Wheelberry channel is recorded with the same fields and the same completeness, whoever took it.

What that means in practice:

- **C3 and C5 record the same thing to the same depth.** There is no "minimal by default" for a user's own actions, and no separate short default.
- **C5's default retention rises to C3's**, 24 months rolling, rather than seven days.
- **The classes survive, and still do their job** — which is to carry the lawful basis and to be the unit of erasure. They are no longer a statement about how completely something is logged.
- A user acting on *another* user's device is still C3, because the record is about the second person.

**The one place the decision cannot reach is the safety tail.** C5 is logged alike to C3; it cannot be retained alike to C1. C1's three-to-ten-year tail exists because a movement of a person may be the subject of a claim or a vigilance report, and a retention period borrows its lawfulness from the purpose it serves. A ten-year record of someone's light switching has no such purpose, and asserting one would weaken the C1 argument that does. So "alike" means alike to the accountability record, not to the safety record — and that is a constraint from purpose limitation rather than a preference.

### What logging everything alike then requires

The cut was doing protective work. Three things have to take its place, and the first is new.

**1. Reading becomes the control surface, because writing is no longer.** Nobody has yet said who may *read* each class. That was tolerable while a user's own activity was thin and short; it is not now. F12 promises an organisation admin they can "audit who did what" — and with C5 complete, that view is a near-continuous record of when a disabled user wakes, sleeps, eats, goes out and is alone in their home, available to the staff of a care provider for an ordinary management purpose. No able-bodied tenant's life is legible to their landlord that way. Permission to act on a device is not permission to read the history of a person's home, and the two have been the same permission until now. F32 closes it, with these defaults:

| Who | May read |
| --- | --- |
| The user | Everything held about them, by class, including who else has read it |
| A carer or family member | C1 for sessions they themselves conducted, and C3 for their own actions. Not the user's own-action history, unless the user grants it |
| A clinician | C1 and C2 for the user in their care, for the clinical purpose |
| An organisation admin | C3 and C4 for actions taken by their staff, and C1 where a named incident is under investigation. **Not C5** |
| Darwin Innovation support | Only under F13's consented, time-limited remote-support session, and only the classes that session needs |

And **a read of someone's record is itself an action taken on them**: access to C1, C2, C3 and C5 is recorded as a C4 event, visible to the user. An audit log that does not audit its own readers is not an accountability tool, it is a surveillance tool with good intentions.

**2. C5 is purpose-limited instead of volume-limited.** If we are keeping it all, the protection is what it may be used for. C5 exists to be shown to the user and to diagnose faults. It is not used for product analytics, not used for research, not aggregated into anything sold, and not disclosed to an organisation. Those are the uses that would turn a complete activity record into a different product, and they are prohibited rather than left to judgement.

**3. The disclosure stops being a footnote.** F31's in-product view is now load-bearing. The only defensible position for holding a complete record of someone's day is that they can see all of it, see who else has seen it, and delete the part that is theirs to delete — and that they were told at onboarding, in the flow, not in a policy.

**One judgement call, which is mine rather than yours.** The decision settles the *default*; I have not read it as obliging a user to be recorded. C5 and C6 remain deleted in full and immediately on request, and a user may set a shorter retention for their own-action record if they ask for one. The erasure right exists in law either way — there is no Article 17(3) exception that covers C5 — so a product that logged everything and gave the user no way to clear it would be promising something it cannot deliver. If you intended the stronger reading, that a complete own-action record is kept for the full 24 months regardless of the user's wishes, say so and I will take the user control back out.

### The consequence for N-D1, which now says something untrue

N-D1 reads "data minimisation applied at collection, not at export". For C5 we have now deliberately chosen not to minimise at collection. Leaving those words in place would carry a claim the design contradicts — precisely the kind of thing a DPIA reviewer finds and then distrusts the rest of the document for. Reworded below: minimisation now applies to the *fields* in each record and to who may read it, rather than to which actions are recorded at all, and the completeness of the own-action record is recorded as a deliberate decision with a date against it.

### The consequence for Article 9, which is less comfortable

The proposal argued C5 and C6 need no Article 9 condition because they hold no health data. That argument was resting on C5 being thin, and it no longer is.

A complete record of every interaction a disabled user has with their home supports inferences about sleep, night waking, continence, mobility and how many hours a day they spend alone. Those are health inferences, drawn from data we chose to keep rather than data we had to keep. The cautious position, and the one to take to the specialist:

- Treat **C5 as capable of revealing health data by inference**, not as ordinary usage data.
- Article 6 basis: legitimate interests — the user's own insight, fault diagnosis, and a uniform accountability rule — with the balancing test written down and the purpose limits above as the safeguard that makes it balance.
- Honour erasure **in full and immediately**, which is what keeps this defensible: we hold a lot, and the user can end it.
- Treat the completeness of C5 as an **accepted privacy risk**, recorded in `spec.md` alongside the two accepted safety hazards, so the DPIA reviewer sees it declared rather than discovers it in a schema.

## Retention periods

The numbers are still proposals in the sense that a specialist has not checked them, but they are now the working policy. The reasoning matters more than the numbers, because the reasoning is what that specialist will check.

| Class | Retention | Reasoning |
| --- | --- | --- |
| **C1 Movement** | Duration of use, plus a tail set by the retention tier — see below | Claim limitation, post-market surveillance, incident investigation |
| **C2 Clinical configuration** | Same as C1, and never shorter | Useless if it expires before the record it explains |
| **C3 Delegated action** | 24 months rolling. Extended to C1's period for any record relating to movement, and for any record under active complaint or investigation | Long enough for a pattern of concern to be visible and raised; short enough not to be a career record of a carer |
| **C4 Access and security** | 12 months rolling. Longer for any account or device subject to a live security investigation | Conventional, and proportionate to the purpose |
| **C5 Own-action usage** | 24 months rolling, the same as C3 (decision 1). Deleted in full and immediately on request, and shortenable by the user | Logged alike to C3; cannot inherit C1's tail, which has a purpose C5 does not share |
| **C6 Diagnostics** | 90 days, with no user identifier | Enough for a fault to be reproduced |

### The three-year answer is wrong for this user group

The obvious tail for C1 is the personal-injury limitation period: three years in England and Wales from the date of knowledge. For most products that would be the end of it.

It does not work here, because of exactly who Wheelberry is for:

- **For a child**, the clock does not start until their 18th birthday — so a record of a movement at age 9 may be needed until they are 21.
- **For a person who lacks capacity**, the limitation clock may not run at all. A three-year retention period against a claim with no deadline is a policy that reliably destroys the evidence before it is asked for.
- Wheelberry's user population contains both, by design. Principle 2 and the clinician persona assume it.

So a single number cannot be right. **Decision 3 adopts differentiated retention as the direction**, to be confirmed with the specialist:

| Tier | C1 and C2 tail after last use | When it applies |
| --- | --- | --- |
| **Standard** | 3 years | Adult with capacity to litigate |
| **Minor** | Until the user's 21st birthday, or 3 years after last use, whichever is later | The user was under 18 at the time of the record |
| **Extended** | 10 years, reviewed at 5 | The limitation clock may not run |

This is uncomfortable — the longest retention applies to the people least able to consent to it — and that discomfort is the correct signal to take it to a specialist rather than settle it here. It is also an argument for making C1 as thin as it can be while still answering the safety question: **the way to hold health-grade data for 10 years responsibly is to hold very little of it.**

#### Store a retention tier, not a capacity assessment

The obvious implementation is to record whether the user has capacity and compute the period from it. That would create a new piece of special-category data — a capacity judgement, held in an audit store, by a company with no clinical relationship to the person — purely to decide how long to keep a log. It would be a worse privacy outcome than the one it serves.

So the design stores the **tier** and nothing more:

- Each record carries its tier, stamped at write time alongside its class and expiry (F26).
- The tier is set with the clinical configuration (C2), and the store holds who set it, when, and which of the three tiers — **never a capacity assessment, never a diagnosis, and never a date of birth**. The minor tier is resolved to an under-18-at-write-time flag by whatever already knows the user's age, and the audit store never learns the birthday.
- The tier is reviewed when the clinical configuration is reviewed, because capacity is not static. **It can be lengthened by the person who sets it and shortened only by a recorded decision with a reason**, so a tier cannot quietly drift down to the cheapest option.
- **If no tier is set, no expiry is applied.** The deletion job skips untiered records and reports them as an exception rather than defaulting. Defaulting to standard would destroy evidence that may be needed; defaulting to extended would hold a decade of health data on an unexamined guess. Neither is a decision a cron job should be making, so it makes neither.
- A tier is a required field before powered seating is enabled for a user, so the exception list is a configuration bug rather than a normal state.

**Reservations, recorded because decision 3 was taken with them:** whether differentiating by the data subject's circumstances is workable at all is the first question for the specialist; capacity changes, and a record written under one tier is not rewritten under another; and the tier is an inference about a person held by us, which is mild compared to a capacity assessment but is not nothing.

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

**Position, as decided (decision 2):**

- **C1 and C2:** Article 9(2)(i), with 9(2)(f) for the post-use tail, and a legal-obligation Article 6 basis if N-REG1 brings one. Erasure refusable under Article 17(3), with the refusal explained in plain language, naming the condition and the period.
- **C3 and C4:** legitimate interests under Article 6, with the Article 9 question arising where a record reveals health data by implication. Erasure considered case by case, which is the honest answer rather than a comfortable one.
- **C5:** legitimate interests, treated as capable of revealing health data by inference now that it is complete (decision 1), with the purpose limits above as the safeguard. Erasure honoured in full, immediately.
- **C6:** no Article 9 condition, holding no user identifier. Erasure honoured in full.
- **Never rely on consent for anything that must survive its withdrawal.** This is the rule to write down, because consent is the basis a well-meaning team reaches for by default.

Two things decision 2 obliges, which are easy to leave undone:

- **The condition is named where the user can see it** — in the onboarding disclosure and in the text of any refusal, not only in the DPIA. A basis the user is not told about is not a basis they can challenge.
- **N-REG1 is a review trigger, not just a dependency.** 9(2)(i) is written for "ensuring high standards of quality and safety of … medical devices", so it is at its strongest if N-REG1 concludes the seating controller is a device or accessory. If it concludes otherwise, the fit weakens — most of all for a household install with no care provider, where 9(2)(h) is unavailable too and 9(2)(f) supports the claims tail but not the routine keeping of the record during use. That is the one scenario where the basis could fail, and it should be re-examined the day N-REG1 reports rather than at the next DPIA review.

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
7. **Read access is enforced per class, and reads are logged.** Added by decision 1. Retrofitting this means retrofitting every query path and every portal view that already reads the audit store, and the portal is M4 work that will be written against whatever the log looks like at M1.
8. **Every C1 and C2 record carries its retention tier at write time**, from the same mechanism that stamps its class and expiry. A tier applied retrospectively is a tier applied from today's configuration to a record written under a different one.

These eight are what "decide it later" costs. Decision 4 defers the specialist, not the build, so the log that ships at M1 has to satisfy the strictest reading of all eight — because the cheap moment to satisfy them is before the first record is written.

## What the user is told, and when

The transparency obligation is not satisfied by a privacy policy nobody reads, and for this user group that is not a cynical observation but an accessibility requirement (N-A1, N-A3). Proposed:

- At onboarding, in the flow and not only in a document: **what is kept, for how long, and what will not be deleted on request** — in plain language, at the point the seating feature is enabled rather than buried at account creation.
- The safety record's non-deletability is disclosed **before** the user commits to using powered seating through Wheelberry, because it is a condition of the feature.
- An in-product view of what is held about them, which is also how N-D3's export is best delivered.
- **That their own activity is recorded in full, and who else can read it.** This follows from decision 1 and is the disclosure most likely to surprise a user, so it belongs in the onboarding flow rather than inferred from a log view they may never open. The same view shows the access history: who has read their records, and when.
- Where Wheelberry is a processor for an organisation, the user is told who the controller is and how to reach them.

## Decision 4: the specialist comes later, so "later" needs a date

Decision 4 defers the data-protection specialist to **before the first organisational sale** rather than engaging one now. That is a reasonable call — there is no cloud, no users and no revenue yet, and a specialist reviewing a document is less useful than one reviewing a system that exists. But "later" is the answer that most reliably becomes "never", so three things are written down to stop that.

**It is a gate, not an intention.** N-REG3, new: the specialist review is completed and its conclusions recorded before any organisational deployment or sale. Organisational use is M4 scope (F12), so no organisational pilot, procurement response or contract proceeds without it. A care provider will ask "what do you keep, for how long, and on what basis" during procurement in any case; being asked is not the moment to find out whether the answer holds.

**The DPIA goes ahead without that input, and must say which of its conclusions are provisional.** N-REG2 is an M0 deliverable and this document sits upstream of it, so the DPIA will be written on the positions above. It should name the three it cannot settle alone: the per-deployment controller analysis, the capacity-differentiated tiers, and 9(2)(i)'s dependence on N-REG1. A DPIA that presents a provisional position as a settled one is worse than one that marks its own edges.

**The accepted cost.** Between M1 and the first organisational sale, Wheelberry will hold real users' health-grade data in household and cloud deployments on a position no specialist has checked. That is the price of decision 4 and it should be recorded rather than discovered. What makes it bearable: the eight design constraints are built to the strict reading now, the cloud copy stays as small as it can be until the review, and the review's conclusions must be implementable without rebuilding the log — which is the whole reason for constraints 1, 4, 7 and 8.

### The brief for the specialist

The questions, so that the handover is already written whenever it happens:

1. Is the local-only install genuinely free of a controller relationship, given remote support (F13), diagnostics (C6) and crash reporting?
2. In an organisational deployment, is the care provider the controller and Darwin the processor — and does that hold where Darwin sets the retention periods in the product rather than taking instruction on them?
3. Is Article 9(2)(i) available to a company that is not a health or care provider, and does it survive N-REG1 concluding the controller is not a device or accessory?
4. Is capacity-differentiated retention workable, and is the retention-tier design above the least intrusive way to implement it?
5. Does treating the complete own-action record (C5) as inference-capable health data under legitimate interests balance, given the purpose limits and the read-access rules?
6. Is crypto-erasure by key destruction accepted as erasure for a tamper-evident log?
7. What must the onboarding disclosure say, in accessible language, for the non-deletable safety record to be lawfully retained?
8. Does the read-access model meet the organisation's own obligations to its staff, whose actions appear in C3?

## Requirement changes, applied

Applied to [requirements.md](requirements.md) on 18 October 2026. Reproduced here as the record of what this document put there and why.

**F14, revised** — Keeps its existing text, with decision 1 made explicit so the cut is not quietly reintroduced by a later reader: every action is logged alike, including a user's own actions on their own devices.

**F26, revised** — Classify every audit and usage record into one of the six classes C1–C6, and record for each class a retention period, an Article 6 lawful basis and, where applicable, an Article 9 condition. Store classes so that deletion by class and by data subject is a tested operation. Stamp each record with its class, its retention expiry and, for C1 and C2, its retention tier at write time, and enforce expiry automatically; records with no tier are reported as an exception rather than given a default. Never rely on consent as the basis for any record that must survive the withdrawal of that consent.

**F29, new** — Determine the controller and processor relationship per deployment shape, and implement erasure and subject-access handling accordingly: answer directly where Wheelberry is the controller, and route the request to the controller and inform the requester where it is not. A request must never be silently refused.

**F30, new** — Make the audit log append-only and tamper-evident, with per-record or per-subject encryption so that erasure can be performed by key destruction without breaking verifiability.

**F31, new** — Provide the user with an in-product view of every record held about them, by class, with its retention period, who else has read it, and whether it can be deleted on request; and disclose both the non-deletable safety record and the completeness of their own-action record before powered seating is enabled.

**F32, new** — Enforce read access to audit records per class and per role, separately from permission to act on a device, with the default grants stated in the retention document. Record every read of a C1, C2, C3 or C5 record as a C4 event visible to the data subject. C5 is used only to show the user their own history and to diagnose faults: never for analytics, research or disclosure to an organisation.

**N-D1, revised** — Usage and seating data are treated as health data under UK GDPR. Minimisation applies to the fields held in each record and to who may read them, rather than to which actions are recorded: every action is recorded alike by decision, 18 October 2026.

**N-D3, revised** — The user can export and delete their data, subject to the retention classes of F26. Classes C5 and C6 are deleted in full and immediately on request, and the user may set a shorter retention for C5. C1 and C2 are retained under their stated lawful basis, and the refusal is explained in plain language, in an accessible form, naming the basis and the retention period. Pseudonymisation is never described to a user as erasure.

**N-D5, new** — Retention of C1 and C2 differentiates by retention tier (standard, minor, extended) where limitation periods differ. The store holds the tier and who set it, never a capacity assessment or a date of birth. Tiers are reviewed with the clinical configuration, shortened only by a recorded decision, and the policy is reviewed whenever N-REG1's conclusion changes.

**N-REG2, extended** — The DPIA covers the six record classes, the per-deployment controller analysis, the capacity-differentiated retention of C1 and C2, the completeness of C5 as an accepted privacy risk, and the conclusion that pseudonymisation of the movement record does not constitute anonymisation. It names which of its conclusions are provisional pending N-REG3.

**N-REG3, new** — A data-protection specialist reviews the record classes, lawful bases and retention policy, and their conclusions are recorded, before any organisational deployment or sale. The brief is the eight questions in the retention document.

## Still open after this

- **N-REG1's conclusion**, which this document depends on in two places, and which is now a review trigger for the Article 9 basis rather than only an input to it.
- **The eight specialist questions above**, deferred by decision 4 to before the first organisational sale.
- **Whether the user may shorten their own C5 retention**, which is my reading of decision 1 rather than your instruction.
- **The exact local buffer capacity** for N-R4.
