use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RangerVault {
    pub admin: Pubkey,                 // Quem controla o cofre (nossa chave)
    pub drift_user_account: Pubkey,    // A conta que o cofre vai abrir dentro da Drift V2
    pub usdc_mint: Pubkey,             // O token base exigido pelo Hackathon
    pub total_shares: u64,             // Controle de cotas dos investidores (Shares)
    pub total_equity: u64,             // Valor total travado (TVL)
    pub max_drawdown_bps: u16,         // Limite de perda em basis points (ex: 1000 = 10%)
    pub min_health_factor: u16,        // Trava de segurança da Drift (ex: 1150 = 1.15 HF)
    pub bump: u8,                      // Bump seed do PDA
}