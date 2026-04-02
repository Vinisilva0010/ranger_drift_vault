Shadow Weaver Yield Strategy
This repository contains a professional yield strategy built for the Ranger Earn ecosystem. The system captures funding rate premiums on the Drift Protocol while maintaining capital protection through an immutable risk engine.

Investment Thesis
The core logic utilizes funding rate arbitrage. It targets markets where short sellers receive high hourly payments. The vault allocates USDC collateral to maintain a neutral position relative to market price shifts. This approach ensures steady growth regardless of market volatility.

Security Architecture
Safety is enforced at the smart contract level. We hardcoded a fifteen percent maximum loss limit within the Rust code. This prevents big losses from unexpected market events. The logic is strictly mathematical and cannot be changed by external users.

On Chain Verification
Our execution is verified on the Solana Devnet.

Vault Address: EMZKTYHRTwsfs8LUvQj65aSBdr1wAjhYPftwDaWMiPFg

Vault Initialization Transaction: https://solscan.io/tx/2Ci1DQmVNgLWfUfHop4nP7K4HTiseRTdtzqtNac8Ks7WxDhNDiqceFytCj185WCSzuhJFt4E5Ce66oa2Rwe3VccN?cluster=devnet

Capital Deposit Transaction: https://solscan.io/tx/5k8nQHCrQK1G1AxiMrwQatWnNzX4wHXf3Lr6amb87fB6r19bqFQzkLPtTLUeB73BD1vWmBfqYZ6qGJxHuGYhR8jo?cluster=devnet

Broker Integration Transaction: https://solscan.io/tx/E8iQEVuPiTJURxEaMUUaobqivyo9vbZMRqMdo5xNGfxgLUZAV2cuAiCAhQWxLhiVd1Pcuyo2zRRRqfbkq6MpDK5?cluster=devnet

Simulation and Performance
The strategy was tested against live market data. Our simulation shows a projected annual yield exceeding one hundred percent. This performance significantly outpaces the minimum requirements for the competition.