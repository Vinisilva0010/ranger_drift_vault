import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RangerDriftVault } from "../target/types/ranger_drift_vault";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("4Hvv6Fmjfwuh2B8E7CMw7bygnN6rcxBNvmbL2LV2wiFs");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // USDC Oficial
const DRIFT_PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");

async function main() {
  console.log("🚀 Iniciando Protocolo de Integração (Cofre Oficial -> Drift V2)...");
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RangerDriftVault as Program<RangerDriftVault>;
  const admin = provider.wallet;

  // 1. Pega o endereço do nosso Cofre Definitivo
  const [vaultStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ranger_vault"), USDC_MINT.toBuffer()],
    PROGRAM_ID
  );

  console.log(`🏦 Fundo Solicitante: ${vaultStatePda.toBase58()}`);

  console.log("\n⏳ Calculando os PDAs internos da Drift V2...");
  
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

  console.log("\n📡 Assinando o contrato com a corretora (CPI)...");

  const tx = await program.methods
    .openDriftAccount()
    .accountsPartial({
      admin: admin.publicKey,
      vaultState: vaultStatePda,
      driftState: driftState,
      driftUser: driftUser,
      driftUserStats: driftUserStats,
      usdcMint: USDC_MINT,
      driftProgram: DRIFT_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log(`\n✅ APERTO DE MÃO CONCLUÍDO! O Cofre Oficial tem conta na Drift.`);
  console.log(`🔗 Audite a criação: https://solscan.io/tx/${tx}?cluster=devnet`);
}

main().catch(err => {
  console.error("❌ Falha na integração com a Drift:", err);
});