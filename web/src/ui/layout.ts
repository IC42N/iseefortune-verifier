import { DEFAULT_RANGE } from "../config";

export function renderLayout() {
    return `
      <main class="shell">
        <section class="hero">
            <div class="brandRow">
                <img src="./assets/logo.png" alt="I See Fortune" />
                <div>
                    <div class="brand">I See Fortune</div>
                    <div class="brandSub">Winning Number Verifier</div>
                </div>
            </div>

          <div class="heroGrid">
            <div class="heroCopy">
              <div class="trustBadge">Verified locally • Public Solana data • Offline reproducible</div>
              <h1>Verify any winning number yourself.</h1>
              <p>
                Enter an epoch, fetch the finalized Solana blockhash, and your browser recomputes the winning number step by step.
                No private server result. No hidden randomness. Same inputs, same result forever.
              </p>
              <div class="heroActions">
                <a class="ghostButton" href="https://github.com/IC42N/iseefortune-verifier" target="_blank" rel="noreferrer">View source</a>
                <button class="ghostButton" id="jumpHow" type="button">How it works</button>
              </div>
            </div>

            <aside class="trustPanel" aria-label="Trust summary">
              <div class="trustItem"><span>1</span><div><b>Public input</b><small>Epoch + finalized Solana blockhash</small></div></div>
              <div class="trustItem"><span>2</span><div><b>Local calculation</b><small>Runs inside your browser</small></div></div>
              <div class="trustItem"><span>3</span><div><b>Reproducible output</b><small>Can be checked offline with the repo</small></div></div>
            </aside>
          </div>
        </section>

        <nav class="tabs" aria-label="Verifier sections">
          <button class="tab isActive" data-tab="verify" type="button">Verify</button>
          <button class="tab" data-tab="docs" type="button">Overview & Docs</button>
        </nav>

        <section class="panel isActive" data-panel="verify">
          <div class="mainGrid">
            <section class="card verifierCard">
              <div class="sectionTitle">
                <div>
                  <span class="stepPill">Step 1</span>
                  <h2>Input any epoch</h2>
                </div>
                <p>Most visitors should use epoch mode. The app finds the finalized slot and blockhash for you.</p>
              </div>

              <div class="modeSwitch" role="tablist" aria-label="Verification mode">
                <button class="modeButton isActive" data-mode="epoch" type="button">By epoch</button>
                <button class="modeButton" data-mode="manual" type="button">By slot + blockhash</button>
              </div>

              <div class="modePanel isActive" data-mode-panel="epoch">
                <div class="formGrid">
                  <div class="field compactField">
                    <label for="epoch">Epoch</label>
                    <input id="epoch" placeholder="e.g. 981" inputmode="numeric" pattern="\\d*" autocomplete="off" />
                  </div>

                  <div class="field">
                    <label for="rpc">RPC endpoint <span>(optional)</span></label>
                    <input id="rpc" placeholder="Default RPC" autocomplete="off" />
                  </div>
                </div>

                <div class="statusBox" id="epochStatus">Ready. Enter a completed epoch to fetch public Solana data.</div>

                <div class="actionRow">
                  <button id="goEpoch" type="button">Fetch epoch data & verify</button>
                </div>

                <div class="explorer" id="explorerLinks"></div>
              </div>

              <div class="modePanel" data-mode-panel="manual">
                <div class="formGrid">
                  <div class="field compactField">
                    <label for="slot">Slot</label>
                    <input id="slot" placeholder="e.g. 424223999" inputmode="numeric" autocomplete="off" />
                  </div>

                  <div class="field">
                    <label for="blockhash">Blockhash <span>(base58)</span></label>
                    <input id="blockhash" placeholder="Paste finalized blockhash" autocomplete="off" />
                  </div>
                </div>

                <div class="actionRow">
                  <button id="go" type="button">Verify slot + blockhash</button>
                </div>
              </div>
            </section>

            <aside class="card networkCard">
              <div class="networkTop">
                <div class="solanaOrb"></div>
                <div>
                  <h3>Solana Mainnet</h3>
                  <p>Finalized blockchain data</p>
                </div>
              </div>

              <div class="networkStat"><span>Status</span><b id="networkStatus">Ready</b></div>
              <div class="networkStat"><span>Range</span><b>1 – ${DEFAULT_RANGE}</b></div>
              <div class="networkStat"><span>Calculation</span><b>SHA-256</b></div>
            </aside>
          </div>

          <section id="resultCard" class="card resultCard isEmpty">
            <div class="emptyState">
              <div class="emptyIcon">✓</div>
              <h2>Result will appear here</h2>
              <p>After verification, this section shows the winning number, the exact inputs, and the full calculation trail.</p>
            </div>
          </section>

          <section class="card breakdownCard" id="breakdownCard">
            <div class="sectionTitle rowTitle">
              <div>
                <span class="stepPill">Step 2</span>
                <h2>How the winning number is generated</h2>
                <p>Step-by-step breakdown of how the winning number is calculated.</p>
              </div>

              <p>These are the same steps your browser runs. They are shown in plain English first, with technical values available after verification.</p>
            </div>

            <div class="timeline" id="calculationTimeline">
              <div class="timelineStep"><span>1</span><div><b>Find the epoch slot</b><small>Get the final available finalized slot for the selected epoch.</small></div></div>
              <div class="timelineStep"><span>2</span><div><b>Fetch the blockhash</b><small>Read the blockhash directly from Solana for that slot.</small></div></div>
              <div class="timelineStep"><span>3</span><div><b>Hash the inputs</b><small>Combine slot bytes + blockhash bytes, then SHA-256 the message.</small></div></div>
              <div class="timelineStep"><span>4</span><div><b>Reduce to a number</b><small>Add the digest bytes and apply modulus ${DEFAULT_RANGE}.</small></div></div>
              <div class="timelineStep"><span>5</span><div><b>Final winning number</b><small>The final value is converted to the game range.</small></div></div>
            </div>
          </section>

          <section class="card technicalCard" id="technicalCard" hidden>
            <button class="accordionButton" id="toggleTechnical" type="button">
              Show technical proof values
            </button>

            <div class="technicalBody" id="technicalBody" hidden>
              <div class="optionRow">
                <label>
                  <input id="raw" type="checkbox" />
                  Show raw JSON
                </label>

                <label>
                  <input id="debug" type="checkbox" />
                  Include debug payload
                </label>
              </div>

              <pre id="out" class="out"></pre>
            </div>
          </section>
        </section>

        <section class="panel" data-panel="docs">
          <div class="docsGrid">
            <section class="card explainer">
              <div class="eyebrow">What this tool proves</div>
              <h2>Anyone can recompute the same winning number.</h2>
              <p>
                This verifier uses public Solana data and deterministic math. The website is only a convenience layer.
                The result does not depend on a private backend, database, admin panel, or secret value.
              </p>

              <div class="proofTiles">
                <div><b>100% public</b><span>Inputs come from Solana.</span></div>
                <div><b>Local only</b><span>Calculation happens in-browser.</span></div>
                <div><b>Open source</b><span>Code can be inspected and copied.</span></div>
              </div>
            </section>

            <section class="card explainer" id="howItWorks">
              <div class="eyebrow">Algorithm</div>
              <h2>The complete calculation</h2>

              <ol class="steps">
                <li>Convert <b>slot</b> into 8 bytes: <code>u64 little-endian</code></li>
                <li>Decode <b>blockhash</b> from base58 into 32 bytes</li>
                <li>Build message: <code>slot_le_bytes || blockhash_bytes</code></li>
                <li>Compute <code>SHA-256(message)</code></li>
                <li>Add all 32 digest bytes together</li>
                <li>Apply <code>sum % ${DEFAULT_RANGE}</code>, then display the winning number in the game range</li>
              </ol>

              <p class="hint">Same epoch + same blockhash = same winning number forever.</p>
            </section>
          </div>
        </section>

        <footer class="footer">
          <section class="trustFooter">
            <div class="trustFooterIcon">
              <i data-lucide="shield-check"></i>
            </div>

            <div>
              <strong>This is a tool, not a black box.</strong>
              <p>Verify everything. No blind trust required.</p>
            </div>
          </section>
        </footer>
      </main>
    `;
}