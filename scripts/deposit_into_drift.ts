import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RangerDriftVault } from "../target/types/ranger_drift_vault";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("4Hvv6Fmjfwuh2B8E7CMw7bygnN6rcxBNvmbL2LV2wiFs");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const DRIFT_PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");

async function main() {
  console.log("🚀 Ativando o Motor de Rendimento (Yield Engine)...");
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RangerDriftVault as Program<RangerDriftVault>;
  const admin = provider.wallet;

  console.log("\n⏳ Mapeando o terreno tático...");

  // 1. O Nosso Lado (O Cofre Zanvexis)
  const [vaultStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ranger_vault"), USDC_MINT.toBuffer()],
    PROGRAM_ID
  );

  const [vaultUsdcPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_token_account"), vaultStatePda.toBuffer()],
    PROGRAM_ID
  );

  // 2. O Lado Deles (A Corretora Drift V2)
  const [driftState] = PublicKey.findProgramAddressSync(
    [Buffer.from("drift_state")],
    DRIFT_PROGRAM_ID
  );

  const [driftUserStats] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_stats"), vaultStatePda.toBuffer()],
    DRIFT_PROGRAM_ID
  );

  const subAccountIdBuffer = new anchor.BN(0).toArrayLike(Buffer, "le", 2);
  const [driftUser] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), vaultStatePda.toBuffer(), subAccountIdBuffer],
    DRIFT_PROGRAM_ID
  );

  // A Conta Corrente Central da Drift para USDC (Market Index = 0)
  const spotMarketIndexBuffer = new anchor.BN(0).toArrayLike(Buffer, "le", 2);
  const [driftSpotMarketVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("spot_market_vault"), spotMarketIndexBuffer],
    DRIFT_PROGRAM_ID
  );

  console.log(`🏦 Cofre Origem (Nosso): ${vaultUsdcPda.toBase58()}`);
  console.log(`🎯 Cofre Destino (Drift): ${driftSpotMarketVault.toBase58()}`);

  // Vamos injetar 500.000 USDC na Drift para começar a operar
  const amountToDeposit = 500_000;
  const rawAmount = new anchor.BN(amountToDeposit).mul(new anchor.BN(10 ** 6));

  console.log(`\n📡 Disparando CPI: Transferindo ${amountToDeposit} USDC para a Clearing House da Drift...`);

  const tx = await program.methods
    .depositIntoDrift(rawAmount)
    .accountsPartial({
      admin: admin.publicKey,
      vaultState: vaultStatePda,
      vaultUsdcAccount: vaultUsdcPda,
      driftState: driftState,
      driftUserAccount: driftUser,
      driftUserStats: driftUserStats,
      driftSpotMarketVault: driftSpotMarketVault,
      driftProgram: DRIFT_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log(`\n✅ COLATERAL INJETADO! A Zanvexis agora tem Poder de Compra institucional na Drift.`);
  console.log(`🔗 Audite a transferência on-chain: https://solscan.io/tx/${tx}?cluster=devnet`);
}

main().catch(err => {
  console.error("❌ Falha na injeção de margem na corretora:", err);
});