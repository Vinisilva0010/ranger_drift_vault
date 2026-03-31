import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RangerDriftVault } from "../target/types/ranger_drift_vault";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { createMint, createAccount, mintTo, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("ranger_drift_vault", () => {
  // Configura o cliente para usar a rede local (Localnet)
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RangerDriftVault as Program<RangerDriftVault>;

  // Nossos atores no teste
  const admin = provider.wallet as anchor.Wallet;
  let usdcMint: PublicKey;
  let investorUsdcAccount: PublicKey;
  
  // PDAs que o contrato vai derivar
  let vaultStatePda: PublicKey;
  let vaultUsdcPda: PublicKey;

  // Parâmetros do Cofre
  const maxDrawdown = 1500; // 15%
  const minHealth = 1200; // 1.2x

  it("Prepara o Sandbox (Cria o USDC Falso e a Conta do Investidor)", async () => {
    // 1. Criamos a "Casa da Moeda" do nosso USDC de mentira
    const mintKeypair = Keypair.generate();
    usdcMint = await createMint(
      provider.connection,
      admin.payer,
      admin.publicKey,
      null,
      6, // USDC tem 6 casas decimais
      mintKeypair
    );

    // 2. Criamos a carteira do investidor (nós mesmos no teste)
    investorUsdcAccount = await createAccount(
      provider.connection,
      admin.payer,
      usdcMint,
      admin.publicKey
    );

    // 3. Imprimimos 10.000 USDC e colocamos no nosso bolso
    await mintTo(
      provider.connection,
      admin.payer,
      usdcMint,
      investorUsdcAccount,
      admin.publicKey,
      10000 * 10 ** 6 // 10k USDC
    );

    const balance = await provider.connection.getTokenAccountBalance(investorUsdcAccount);
    console.log(`\n    💰 Bolso do Investidor: ${balance.value.uiAmount} USDC`);
  });

  it("Inicia o Cofre Institucional", async () => {
    // Calcula os PDAs antes de enviar a transação (igual o front-end fará)
    [vaultStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("ranger_vault"), usdcMint.toBuffer()],
      program.programId
    );

    [vaultUsdcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_token_account"), vaultStatePda.toBuffer()],
      program.programId
    );

    // Chama a nossa instrução Initialize
   await program.methods
      .initialize(maxDrawdown, minHealth)
      .accountsPartial({ // <--- MÁGICA AQUI
        admin: admin.publicKey,
        vaultState: vaultStatePda,
        vaultUsdcAccount: vaultUsdcPda,
        usdcMint: usdcMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Valida se o estado foi salvo na blockchain local
    const state = await program.account.rangerVault.fetch(vaultStatePda);
    assert.ok(state.admin.equals(admin.publicKey));
    assert.equal(state.maxDrawdownBps, maxDrawdown);
    console.log(`    🏦 Cofre Criado! Max Drawdown Travado em: ${state.maxDrawdownBps} bps`);
  });

  it("Deposita Capital no Cofre", async () => {
    const depositAmount = new anchor.BN(5000 * 10 ** 6); // Depositando 5.000 USDC

   await program.methods
      .deposit(depositAmount)
      .accountsPartial({ // <--- MÁGICA AQUI TAMBÉM
        investor: admin.publicKey,
        vaultState: vaultStatePda,
        investorUsdcAccount: investorUsdcAccount,
        vaultUsdcAccount: vaultUsdcPda,
        usdcMint: usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    // Valida se o dinheiro saiu do bolso e foi pro Cofre
    const vaultUsdcData = await getAccount(provider.connection, vaultUsdcPda);
    const state = await program.account.rangerVault.fetch(vaultStatePda);

    assert.equal(Number(vaultUsdcData.amount), depositAmount.toNumber());
    assert.equal(state.totalEquity.toNumber(), depositAmount.toNumber());

    console.log(`    ✅ Depósito Concluído! TVL do Cofre: ${state.totalEquity.toNumber() / 10**6} USDC`);
  });
});