import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RangerDriftVault } from "../target/types/ranger_drift_vault";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// A sua fábrica e a moeda oficial
const PROGRAM_ID = new PublicKey("4Hvv6Fmjfwuh2B8E7CMw7bygnN6rcxBNvmbL2LV2wiFs");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

async function main() {
  console.log("🚀 Iniciando a Transferência de Capital Institucional (USDC Canônico)...");
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RangerDriftVault as Program<RangerDriftVault>;
  const admin = provider.wallet;

  // 1. O motor matemático recalcula o endereço do NOVO cofre
  const [vaultStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ranger_vault"), USDC_MINT.toBuffer()],
    PROGRAM_ID
  );

  const [vaultUsdcPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_token_account"), vaultStatePda.toBuffer()],
    PROGRAM_ID
  );

  console.log(`🏦 Cofre Alvo (PDA): ${vaultStatePda.toBase58()}`);

  // 2. Acessar a sua conta de USDC da Circle
  console.log("\n⏳ Lendo a sua conta corrente da Circle na blockchain...");
  const investorUsdcAccount = await getAssociatedTokenAddress(
    USDC_MINT,
    admin.publicKey
  );

  // 3. Vamos depositar 10 USDC (Deixando 10 de margem na carteira)
  const depositAmount = 10;
  const rawAmount = depositAmount * (10 ** 6); // 6 casas decimais
  
  // 4. Executar o Depósito via Smart Contract
  console.log(`\n📡 Assinando a transferência de ${depositAmount} USDC para o Cofre...`);
  
  const tx = await program.methods
    .deposit(new anchor.BN(rawAmount))
    .accountsPartial({
      investor: admin.publicKey,
      vaultState: vaultStatePda,
      investorUsdcAccount: investorUsdcAccount,
      vaultUsdcAccount: vaultUsdcPda,
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log(`\n✅ SUCESSO! Capital trancado no Smart Contract.`);
  console.log(`💰 Novo TVL do Fundo: ${depositAmount} USDC`);
  console.log(`🔗 Audite o depósito no Solscan: https://solscan.io/tx/${tx}?cluster=devnet`);
}

main().catch(err => {
  console.error("❌ Falha na injeção de liquidez:", err);
});