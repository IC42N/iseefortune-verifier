use anyhow::{Context, Result};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Vector {
    name: String,
    rng_version: String,
    slot: u64,
    blockhash: String,
    expected_winning_number: u64,
}

#[test]
fn vectors_match_expected() -> Result<()> {
    let raw = std::fs::read_to_string("vectors/vectors.json")
        .context("failed to read vectors/vectors.json")?;

    let vectors: Vec<Vector> =
        serde_json::from_str(&raw).context("failed to parse vectors/vectors.json")?;

    if vectors.is_empty() {
        anyhow::bail!("vectors.json is empty; add at least one test vector");
    }

    for v in vectors {
        // 🔒 Enforce RNG version explicitly
        assert_eq!(
            v.rng_version, "v1",
            "vector '{}' uses unsupported rng_version",
            v.name
        );

        let res = iseefortune_verifier::core::verify_from_slot_and_blockhash(
            v.slot,
            &v.blockhash,
            10, // hard-coded by design
        )
            .map_err(|e| anyhow::anyhow!(e))
            .with_context(|| format!("vector '{}' failed", v.name))?;

        assert_eq!(
            res.winning_number, v.expected_winning_number,
            "vector '{}' mismatch",
            v.name
        );
    }

    Ok(())
}