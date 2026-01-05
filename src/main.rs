use clap::Parser;
use serde::Serialize;

#[derive(Parser, Debug)]
#[command(name = "iseefortune-verifier")]
#[command(about = "Verify ISeeFortune winning number from slot + Solana blockhash")]
struct Args {
    /// Slot used in RNG
    #[arg(long)]
    slot: u64,

    /// Solana blockhash (base58)
    #[arg(long)]
    blockhash: String,

    /// Show full debug output
    #[arg(long)]
    debug: bool,
}

#[derive(Serialize)]
struct Output<'a> {
    rng_version: &'static str,
    slot: u64,
    blockhash: &'a str,
    winning_number: u64,

    #[serde(skip_serializing_if = "Option::is_none")]
    debug: Option<DebugOutput<'a>>,
}

#[derive(Serialize)]
struct DebugOutput<'a> {
    digest_sha256: &'a str,
    digest_sum_u64: u64,
}

fn main() {
    let args = Args::parse();

    let res = match iseefortune_verifier::core::verify_from_slot_and_blockhash(
        args.slot,
        &args.blockhash,
        10, // hard-coded by design
    ) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("error: {e}");
            std::process::exit(1);
        }
    };

    let out = Output {
        rng_version: "v1",
        slot: args.slot,
        blockhash: &args.blockhash,
        winning_number: res.winning_number,
        debug: if args.debug {
            Some(DebugOutput {
                digest_sha256: &res.debug.digest_hex,
                digest_sum_u64: res.debug.digest_sum_u64,
            })
        } else {
            None
        },
    };

    println!("{}", serde_json::to_string_pretty(&out).unwrap());
}