use anchor_lang::prelude::*;
use crate::state::RangerVault;

// Importamos a infraestrutura nativa
use crate::drift::cpi::accounts::InitializeUser;
use crate::drift::cpi::accounts::InitializeUserStats; // <-- NOVO: O pacote que faltava
use crate::drift::program::Drift;
use crate::drift::cpi::initialize_user;
use crate::drift::cpi::initialize_user_stats; // <-- NOVO: A instrução de inicialização

#[derive(Accounts)]
pub struct OpenDriftAccount<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"ranger_vault", usdc_mint.key().as_ref()],
        bump = vault_state.bump,
        has_one = admin
    )]
    pub vault_state: Account<'info, RangerVault>,

    /// CHECK: Drift State
    #[account(mut)]
    pub drift_state: AccountInfo<'info>,

    /// CHECK: A conta de usuário da Drift que será criada para o nosso Cofre
    #[account(mut)]
    pub drift_user: AccountInfo<'info>,

    /// CHECK: Status e métricas do usuário na Drift
    #[account(mut)]
    pub drift_user_stats: AccountInfo<'info>,

    /// CHECK: Apenas para derivar o PDA do Cofre
    pub usdc_mint: AccountInfo<'info>,

    pub drift_program: Program<'info, Drift>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub fn handle_open_drift_account(ctx: Context<OpenDriftAccount>) -> Result<()> {
    let vault_state = &mut ctx.accounts.vault_state;
    let usdc_key = vault_state.usdc_mint.key();
    let bump = vault_state.bump;

    let signer_seeds: &[&[&[u8]]] = &[&[
        b"ranger_vault",
        usdc_key.as_ref(),
        &[bump],
    ]];

    // --- PASSO 1: CRIAR O USER STATS (Resolvendo o Erro 3007) ---
    let cpi_stats_accounts = InitializeUserStats {
        user_stats: ctx.accounts.drift_user_stats.to_account_info(),
        state: ctx.accounts.drift_state.to_account_info(),
        authority: vault_state.to_account_info(),
        payer: ctx.accounts.admin.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    let cpi_stats_ctx = CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        cpi_stats_accounts,
        signer_seeds,
    );

    // O Cofre assina e cria a conta de métricas na Drift
    initialize_user_stats(cpi_stats_ctx)?;

    // --- PASSO 2: CRIAR O USER (Sub-Account) ---
    let cpi_accounts = InitializeUser {
        user: ctx.accounts.drift_user.to_account_info(),
        user_stats: ctx.accounts.drift_user_stats.to_account_info(),
        state: ctx.accounts.drift_state.to_account_info(),
        authority: vault_state.to_account_info(), 
        payer: ctx.accounts.admin.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    let sub_account_id = 0;
    let mut name = [0u8; 32];
    let name_str = b"Ranger Drift Vault";
    name[..name_str.len()].copy_from_slice(name_str);

    initialize_user(cpi_ctx, sub_account_id, name)?;

    vault_state.drift_user_account = ctx.accounts.drift_user.key();

    msg!("Conta Institucional na Drift aberta com sucesso!");
    msg!("Drift User Address: {}", vault_state.drift_user_account);

    Ok(())
}