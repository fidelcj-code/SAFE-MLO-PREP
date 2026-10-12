# SAFE MLO Master — Product Specification and Roadmap

**Release:** v0.1.0 personal MVP (GitHub Pages-compatible)  
**Product vision:** Independent, original alternative to classic mortgage licensing practice platforms, combining a cinematic interface with smart practice, honest readiness analytics, and an exact print notebook.

## Official outline

Use the [current official NMLS content outline](https://mortgage.nationwidelicensingsystem.org/knowledge/products/nmls/pubs/testingHbk/education/mlo_testing/mlo_test_faq/mlo_testing_hbk_testOutline.html) as the living reference. The published test format is 120 questions (115 scored plus 5 unscored), 190 minutes, and a passing standard of 75%. The official category weights are FED 24%, USC 11%, GMK 20%, ORIG 27%, ETH 18%. The platform must flag changing laws and avoid publishing obsolete thresholds.

## Design system

The original HBO Max launch of 2020 is visual inspiration: deep cinematic black/plum, saturated violet illumination, premium art-directed hero panels, and beautiful cards. Independent original branding with pink accents. Netflix Sans is the typography target only if properly licensed; Montserrat/Inter are the bundled fallbacks. Responsive keyboard and touch interfaces; exam mode reduces animation.

## Question engine

- Four plausible choices, one answer key, original question writing and original educational explanations.
- Categories, topics, mathematically significant question metadata, difficulty levels 1–3.
- Question styles: Test Day (1–2), Mixed (1–3), Impossible (3 only). These are product heuristics, not claims of exact official item difficulty.
- Math Normal and Fewer; math count not represented as an official NMLS allocation.
- Modes Fresh Only, Review Missed and Adaptive (default; adjustable 75%/25% fresh-review target).
- No exact question or equivalence-family repeats within a session. Fresh Only excludes every previously displayed family across all sessions. Adaptive deliberately reviews misses; review must remain separate in analytics.
- Source links and legal/editorial verification required before expanding to production.

## Notebook

- Two standard question notes per physical print page, one math problem per full page.
- Math entries show original question, answer, formula, handwritten-comprehensible steps, and writing lines.
- Editable notes, configurable width/height, rule gap and rule count; overflow warnings and print blocking for layouts that cannot fit.
- Browser print supports Save as PDF; page paper sizes must be selected to match the chosen dimensions.

## Analytics

- Unique answered = distinct answered question families.
- Fresh available = source-linked verified-status unseen families within the starter bank.
- First-attempt fresh accuracy = first correct attempts / first answered attempts; never overwritten by retakes.
- Subject-level first attempts, exam history and preliminary readiness labels (not validated pass prediction).

## Security and persistence

Current release intentionally has **local-only browser storage**. The included PostgreSQL schema is a future design artifact, not a running backend. Never claim user accounts or synchronized progress until a real authenticated service is implemented, migrations deployed, authorization enforced, and security reviewed.

## Implementation phases

1. **v0.1 — Delivered:** frontend SPA, seed questions, smart selections, adaptive mode, mini-exams, notes and print, analytics and export/import.
2. **v0.2 — Content quality:** expand to 500+ professionally reviewed original questions with fine-grained laws, citations, reviewer tracking and semantic duplicate audit. Incorporate new NMLS/CFPB updates.
3. **v0.3 — Backend:** secure authentication, PostgreSQL, migration tooling, row-level authorizations, atomic exposure reservation, synchronization and backups.
4. **v0.4 — Full exam:** verified large bank, 120-question blueprint-weighted timed simulator with 115 scored and five unscored hidden, robust no-repeat pool management.
5. **v0.5 — Learning science:** calibrated question difficulty, real spaced repetition, verified question-equivalence clustering, statistically justified readiness indicators, content review tooling and moderated AI item proposals.
6. **v1.0 — Production:** accessibility audit, regulatory content governance, rate limiting, continuous deployment, comprehensive integration/end-to-end tests, mobile and print quality assurance.

## Non-negotiable honesty

Do not call starter mini-exams official full-length simulations. Do not represent a proprietary font as licensed when it is not. Do not claim the app professionally certifies current laws or predicts passing without independent validation.
