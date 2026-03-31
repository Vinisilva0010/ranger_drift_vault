use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::RangerVault;

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // Cria o PDA principal do Cofre. A semente é "ranger_vault" + o endereço do USDC.
    #[account(
        init,
        payer = admin,
        space = 8 + RangerVault::INIT_SPACE,
        seeds = [b"ranger_vault", usdc_mint.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, RangerVault>,

    // Cria a conta "bancária" do Cofre que vai guardar o USDC fisicamente.
    // O dono dessa conta não é um humano, é o PDA do vault_state.
    #[account(
        init,
        payer = admin,
        token::mint = usdc_mint,
        token::authority = vault_state,
        seeds = [b"vault_token_account", vault_state.key().as_ref()],
        bump
    )]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_initialize(
    ctx: Context<InitializeVault>,
    max_drawdown_bps: u16,
    min_health_factor: u16,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault_state;
    
    // Injeção dos parâmetros institucionais de risco
    vault.admin = ctx.accounts.admin.key();
    vault.usdc_mint = ctx.accounts.usdc_mint.key();
    vault.total_shares = 0;
    vault.total_equity = 0;
    vault.max_drawdown_bps = max_drawdown_bps;
    vault.min_health_factor = min_health_factor;
    vault.bump = ctx.bumps.vault_state;
    
    // A conta de usuário da Drift será ativada em um segundo passo via CPI
    vault.drift_user_account = Pubkey::default(); 

    msg!("Ranger Vault On-Chain! USDC Mint: {}", vault.usdc_mint);
    msg!("Risco Travado - Max Drawdown: {} bps, Min Health Factor: {}", max_drawdown_bps, min_health_factor);
    
    Ok(())
}