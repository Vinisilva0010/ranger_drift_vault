// @ts-nocheck
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { Wallet, TokenFaucet } from '@drift-labs/sdk';
import { BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as os from 'os';

async function main() {
    console.log("🔥 Ativando o Protocolo Fantasma (Bypass de Tipagem & Faucet Direto)...");
    
    // Conectando no RPC Oficial (sem o lag da interface deles)
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const keyData = JSON.parse(fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keyData));
    const wallet = new Wallet(keypair);

    // As coordenadas oficias do Faucet da Drift V2 na Devnet
    const FAUCET_PROGRAM_ID = new PublicKey("VWe21B1XzC1R42Vn91GsuC7tY9a3gZ1xS39Z9jGtz18");
    const USDC_MINT = new PublicKey("8zGuJQqwhZafTah7UcEN741d441jLydLBNR3sV1iG4rE");

    console.log(`🔑 Invasor: ${keypair.publicKey.toBase58()}`);
    console.log("⏳ Calculando e acessando a sua conta USDC oficial...");

    // Garante que a sua conta de USDC (da moeda deles) existe
    const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        USDC_MINT,
        keypair.publicKey
    );

    console.log(`💳 Conta Destino USDC: ${ata.address.toBase58()}`);
    console.log("💸 Injetando a instrução de Mint direto no Smart Contract da Drift...");

    // Instancia o contrato de Faucet ignorando a burocracia do Client inteiro
    const faucet = new TokenFaucet(connection, wallet, FAUCET_PROGRAM_ID, USDC_MINT);
    
    // Pede 10.000 dólares (6 casas decimais)
    const tx = await faucet.mintToUser(ata.address, new BN(10000 * 10 ** 6));

    console.log(`\n✅ SUCESSO ABSOLUTO! O sistema deles foi forçado a transferir o capital.`);
    console.log(`🔗 Link do Solscan: https://solscan.io/tx/${tx}?cluster=devnet`);
}

main().catch(err => {
    console.error("\n❌ Erro crítico. Se o log abaixo disser 'Transaction simulation failed', o Faucet da Devnet deles está OFF-LINE globalmente.", err);
});