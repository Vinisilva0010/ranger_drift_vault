import bs58 from "bs58";
import fs from "fs";
import os from "os";

const secretKeyString = fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf8');
const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

console.log("\n=======================================================");
console.log("🔑 SUA CHAVE PRIVADA (COPIE E COLE NA PHANTOM WALLET):");
console.log(bs58.encode(secretKey));
console.log("=======================================================\n");