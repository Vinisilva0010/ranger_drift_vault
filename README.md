# Shadow Weaver Yield Strategy

Shadow Weaver is a professional yield strategy built for the Ranger Earn ecosystem. It harvests funding rate premiums on Drift Protocol while enforcing bank-grade capital protection via an immutable on-chain risk engine.
docs: https://vinisilva0010.github.io/shadow-weaver-docs/
video: https://youtu.be/sGLtnZFak50
>  Shadow Weaver is the safest vault in this hackathon, combining hard-coded loss protection at the smart-contract level with market-neutral funding arbitrage on Solana.

---

## Overview

This repository contains an institutional-style yield vault designed for the **Ranger Build-a-Bear Hackathon**. The vault accepts USDC deposits, routes capital into a market-neutral strategy on Drift, and returns yield generated from perpetual funding payments.

The core idea is simple: let traders fight over direction while the strategy quietly collects funding, with strict risk limits baked directly into the Rust program.

---

## How It Works

When a user deposits USDC into the vault, the Solana program locks this capital on-chain. The program then performs a CPI call to Drift to automatically open and manage an institutional account on behalf of the vault.

An external executor bot, **Shadow Weaver**, continuously scans live market data for attractive funding opportunities, with a primary focus on the SOL perpetual market. When conditions are favorable, the system allocates collateral into a market-neutral position: it earns from funding payments while minimizing exposure to price direction of the underlying asset.

The vault’s profit engine is the funding rate differential paid by other market participants. As long as the strategy maintains neutral exposure and the market continues to pay positive funding to the chosen side, the vault compounds yield independently of whether price moves up or down.

To exit, the user requests a withdrawal. The strategy unwinds the open positions on Drift, settles profit and loss, and returns the resulting USDC back to the depositor.

---

## Architecture

The architecture is intentionally minimal and production-oriented:

- **Blockchain:** Solana (Devnet for current deployment).
- **Smart Contract Layer:**  
  - Written in **Rust** using **Anchor**.  
  - Manages deposits, redemptions, and risk limits.  
  - Executes CPI calls into **Drift Protocol** to open and manage the vault’s trading account.

- **Off-Chain Execution Layer (Shadow Weaver Bot):**  
  - Implemented in **TypeScript** using **Node.js**.  
  - Uses the **Drift SDK** plus lightweight, direct network calls to pull funding rates and order book state.  
  - Decides when to allocate, rebalance, or unwind positions based on live market data and configured risk constraints.

- **Interface:**  
  - There is no graphical user interface at the moment.  
  - All operations (deploy, configuration, and bot execution) are performed from the command line, which keeps the system transparent and easy for other developers and judges to audit.

This separation between an immutable on-chain risk core and a flexible off-chain executor gives the strategy high safety guarantees while preserving the ability to iterate on execution logic.

---

## Risk & Parameters

Risk management is enforced primarily at the smart contract level:

- **Maximum Loss Limit:**  
  A hard-coded maximum loss of **15%** is embedded directly in the Rust program.  
  If the aggregate position drawdown reaches this threshold, the program stops further risk-taking and effectively freezes operations to protect remaining capital.

- **Market Focus:**  
  The current strategy targets the **SOL perpetual market** on Drift, where funding dynamics are particularly attractive for short-biased funding capture.

- **Simulation Baseline:**  
  Internal simulations use a notional capital base of **100,000 USDC** with the 15% safety limit active to illustrate how the vault behaves under institutional scale.

- **Infrastructure Safety:**  
  The Shadow Weaver bot uses a direct, lightweight connectivity path to Drift’s infrastructure rather than relying solely on public RPC endpoints. This reduces the chance of getting throttled by rate limits, ensuring that risk checks and funding calculations continue to run even during network stress.

The philosophy is: **never trust an off-chain stop-loss alone**. The loss cap is enforced by deterministic math on-chain, and the bot must operate within that framework.

---

## On-Chain Verification

All execution for this hackathon runs on **Solana Devnet**, and can be independently verified by the judges.

- **Vault Address:**  
  `EMZKTYHRTwsfs8LUvQj65aSBdr1wAjhYPftwDaWMiPFg`

- **Vault Initialization Transaction:**  
  https://solscan.io/tx/2Ci1DQmVNgLWfUfHop4nP7K4HTiseRTdtzqtNac8Ks7WxDhNDiqceFytCj185WCSzuhJFt4E5Ce66oa2Rwe3VccN?cluster=devnet

- **Capital Deposit Transaction:**  
  https://solscan.io/tx/5k8nQHCrQK1G1AxiMrwQatWnNzX4wHXf3Lr6amb87fB6r19bqFQzkLPtTLUeB73BD1vWmBfqYZ6qGJxHuGYhR8jo?cluster=devnet

- **Broker Integration Transaction (Drift account wiring):**  
  https://solscan.io/tx/E8iQEVuPiTJURxEaMUUaobqivyo9vbZMRqMdo5xNGfxgLUZAV2cuAiCAhQWxLhiVd1Pcuyo2zRRRqfbkq6MpDK5?cluster=devnet

Judges can use these links to confirm the vault’s deployment, initial capital injection, and integration flow.

---

## Setup & Running Locally

This section documents the **exact commands** used to set up the environment, deploy the program, initialize the vault on Devnet, and run the Shadow Weaver bot.

### Prerequisites

- **Solana CLI** configured for Devnet.  
- **Rust** (stable toolchain).  
- **Anchor CLI** installed and configured.  
- **Node.js** and **TypeScript** installed.  
- A funded Solana Devnet keypair at `~/.config/solana/id.json`.

### 1. Install Node Dependencies

From the project root, install the required Node/TypeScript dependencies:

```bash
npm install @solana/web3.js @drift-labs/sdk @coral-xyz/anchor ts-node typescript
2. Build and Deploy the Vault Program
Use Anchor to compile and deploy the on-chain smart contract to Solana Devnet:

bash
anchor build
anchor deploy
Ensure your Anchor and Solana configuration are pointing to Devnet and using the correct wallet.

3. Initialize Devnet Vault Infrastructure
With the program deployed, initialize the vault and connect it to Drift using the provided TypeScript scripts.
Run the scripts in the following order, setting the provider URL and wallet inline:

bash
ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/initialize_devnet.ts

ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/open_drift_account.ts

ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-node scripts/deposit_into_drift.ts
These scripts:

Initialize the vault state on Devnet.

Open and wire the institutional Drift account for the vault.

Deposit capital from the vault into Drift to fund the strategy.

4. Run the Shadow Weaver Bot (Delta-Neutral Arbitrage Simulator)
Finally, start the Shadow Weaver executor, which runs the delta-neutral funding arbitrage logic:

bash
npx ts-node bot/shadow_weaver.ts
This launches the TypeScript bot, connects to Drift, streams market and funding data, and executes the strategy while printing logs and profit calculations directly to the terminal.

Simulation & Performance
The strategy has been tested against live market data using historical funding rates and price feeds from the SOL perpetual market on Drift. Under recent market conditions, simulations project an annualized yield above 100%, significantly outperforming the minimum performance bar required for this hackathon.

These numbers are indicative only and depend on future funding regimes, liquidity, and volatility, but they highlight the core thesis: funding harvesting with strict drawdown caps can deliver strong asymmetric returns.

Roadmap
Short-term roadmap items beyond the hackathon scope:

Add a minimal web dashboard to visualize vault TVL, realized yield, and risk metrics.

Expand support from SOL-PERP to a diversified basket of perp markets on Drift.

Integrate more advanced execution logic in Shadow Weaver (multi-venue, multi-asset funding optimization).

Add formal audits and monitoring to harden the strategy for mainnet deployment.
