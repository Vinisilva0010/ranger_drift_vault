// @ts-nocheck
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import { TokenFaucet, Wallet } from '@drift-labs/sdk';
import { BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as os from 'os';

async function main() {
    console.log("🔥 Ativando o Bypass Definitivo (Drift Faucet V2)...");
    
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const keyData = JSON.parse(fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keyData));
    const wallet = new Wallet(keypair);

    const FAUCET_PROGRAM_ID = new PublicKey("VWe21B1XzC1R42Vn91GsuC7tY9a3gZ1xS39Z9jGtz18");
    const USDC_MINT = new PublicKey("8zGuJQqwhZafTah7UcEN741d441jLydLBNR3sV1iG4rE"); // O Verdadeiro Drift USDC

    const ata = await getAssociatedTokenAddress(USDC_MINT, keypair.publicKey);
    console.log(`💳 Sua conta USDC (Drift Devnet): ${ata.toBase58()}`);
    
    try {
        await getAccount(connection, ata);
        console.log("✅ Conta USDC já existe na blockchain.");
    } catch (e) {
        console.log("⚙️ A conta não existe. Forçando a criação do ATA e aguardando a rede...");
        const tx = new Transaction().add(
            createAssociatedTokenAccountInstruction(keypair.publicKey, ata, keypair.publicKey, USDC_MINT)
        );
        await sendAndConfirmTransaction(connection, tx, [keypair]);
        console.log("✅ Conta USDC criada e confirmada!");
    }

    console.log("💸 Mungindo a torneira do Smart Contract da Drift...");
    const faucet = new TokenFaucet(connection, wallet, FAUCET_PROGRAM_ID, USDC_MINT);
    const mintTx = await faucet.mintToUser(ata, new BN(10000 * 10 ** 6));
    
    console.log(`\n✅ SUCESSO ABSOLUTO! 10.000 USDC (Oficial Drift) na sua carteira.`);
    console.log(`🔗 Audite aqui: https://solscan.io/tx/${mintTx}?cluster=devnet`);
}

main().catch(console.error);