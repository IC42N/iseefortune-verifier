use sha2::{Digest, Sha256};

#[derive(Debug, Clone)]
pub struct VerifyDebug {
    pub decoded_len: usize,
    pub digest_hex: String,
    pub digest_sum_u64: u64,
    pub modulus: u64,
}

#[derive(Debug, Clone)]
pub struct VerifyResult {
    pub winning_number: u64,
    pub debug: VerifyDebug,
}

/// Algorithm (matches your resolver):
/// - decode base58 blockhash -> bytes (expect 32)
/// - sha256(slot_le_bytes || blockhash_bytes)
/// - sum all 32 digest bytes -> u64
/// - winning = sum % range (default range=10)
pub fn verify_from_slot_and_blockhash(slot: u64, blockhash_base58: &str, range: u64) -> Result<VerifyResult, String> {
    if range == 0 {
        return Err("range must be > 0".to_string());
    }

    let blockhash_bytes = bs58::decode(blockhash_base58)
        .into_vec()
        .map_err(|e| format!("invalid base58 blockhash: {e}"))?;

    if blockhash_bytes.len() != 32 {
        return Err(format!(
            "decoded blockhash must be 32 bytes, got {}",
            blockhash_bytes.len()
        ));
    }

    let mut hasher = Sha256::new();
    hasher.update(&slot.to_le_bytes());
    hasher.update(&blockhash_bytes);
    let digest = hasher.finalize(); // 32 bytes

    let total: u64 = digest.iter().map(|b| *b as u64).sum();
    let winning_number = total % range;

    Ok(VerifyResult {
        winning_number,
        debug: VerifyDebug {
            decoded_len: blockhash_bytes.len(),
            digest_hex: hex::encode(digest),
            digest_sum_u64: total,
            modulus: range,
        },
    })
}