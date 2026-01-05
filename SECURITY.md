# Security Policy

This repository contains verifier tooling (Rust + TypeScript) used to reproduce and validate the ISeeFortune RNG output from public inputs (slot + blockhash) and shared test vectors.

## Supported versions

Security fixes are applied to the default branch (`main`). Releases are tagged; the most recent release is considered the recommended baseline.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Use one of the following:

1. **GitHub Security Advisories (preferred)**
    - Go to the repo’s **Security** tab → **Report a vulnerability** (private disclosure).

2. **Private contact**
    - If you cannot use GitHub Security Advisories, contact the maintainers privately through the channel listed in the repository profile/organization contact (if available).

When reporting, include:
- A clear description of the issue and impact
- Steps to reproduce (proof-of-concept if possible)
- Affected commit/tag (if known)
- Any suggested fix or mitigation

## Scope

In scope:
- Deterministic correctness of the verifier algorithm per `SPEC.md`
- Integrity of test vectors (`vectors/vectors.json`) and how they’re used in tests
- CLI input handling (panic/crash conditions, untrusted input)
- Dependency vulnerabilities that could affect execution or outputs
- CI workflow behavior that could undermine verification guarantees

Out of scope:
- Vulnerabilities in third-party services not controlled by this repo (e.g., GitHub, npm, crates.io)
- Issues requiring physical access to a machine running the verifier
- Social engineering and phishing attempts

## Security goals

This project prioritizes:
- **Reproducibility:** independent implementations must agree on outputs
- **Transparency:** algorithm and vectors are auditable
- **Tamper resistance:** CI enforces that changes don’t silently alter results

Any change that affects RNG semantics must:
- Update `SPEC.md` with a new `rng_version`
- Add/adjust vectors in `vectors/vectors.json`
- Keep prior versions reproducible (do not retroactively change historical vectors)

## Handling reports

After a report is received:
- We will confirm receipt and attempt to reproduce the issue.
- If confirmed, we will prepare a fix and publish it on `main`, then tag a release.
- If the issue affects published outputs, we will document the impact in the release notes.

## Dependency hygiene

This repo uses lockfiles:
- `Cargo.lock`
- `ts/package-lock.json`

CI runs:
- Rust tests (`cargo test --all --locked`)
- TypeScript typecheck and vector tests (`npm run typecheck`, `npm run test:vectors`)

## Disclaimer

This software is provided “as is” without warranty. See `LICENSE` for details.
