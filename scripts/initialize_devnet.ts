import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RangerDriftVault } from "../target/types/ranger_drift_vault";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// O seu CNPJ na Solana
const PROGRAM_ID = new PublicKey("4Hvv6Fmjfwuh2B8E7CMw7bygnN6rcxBNvmbL2LV2wiFs");
// A Jóia da Coroa: O verdadeiro USDC da Devnet (Circle)
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

async function main() {
  console.log("🚀 Iniciando o Fundo Oficial da Zanvexis com USDC Canônico...");
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RangerDriftVault as Program<RangerDriftVault>;
  const admin = provider.wallet;

  console.log(`Admin (Zanvexis): ${admin.publicKey.toBase58()}`);

  // Derivando o PDA (Esta é a chave FINAL que vai para os juízes)
  const [vaultStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ranger_vault"), USDC_MINT.toBuffer()],
    PROGRAM_ID
  );

  const [vaultUsdcPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_token_account"), vaultStatePda.toBuffer()],
    PROGRAM_ID
  );

  console.log(`\n🏦 Calculando a arquitetura Definitiva do Cofre...`);
  console.log(`=======================================================`);
  console.log(`🔥 NOVO ENDEREÇO DO COFRE (VAULT PDA): ${vaultStatePda.toBase58()}`);
  console.log(`⚠️ (COPIE ESSE ENDEREÇO PARA O FORMULÁRIO DO HACKATHON)`);
  console.log(`=======================================================`);

  const maxDrawdown = 1500; // 15%
  const minHealth = 1200; // 1.2x

  console.log("\n📡 Assinando a transação de Inicialização...");
  
  const tx = await program.methods
    .initialize(maxDrawdown, minHealth)
    .accountsPartial({
      admin: admin.publicKey,
      vaultState: vaultStatePda,
      vaultUsdcAccount: vaultUsdcPda,
      usdcMint: USDC_MINT,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log(`\n✅ FUNDO CRIADO COM SUCESSO! O Cofre agora reconhece o USDC oficial.`);
  console.log(`🔗 Audite a transação no Solscan: https://solscan.io/tx/${tx}?cluster=devnet`);
}

main().catch(err => {
  console.error("❌ Falha na inicialização do Fundo Real:", err);
});