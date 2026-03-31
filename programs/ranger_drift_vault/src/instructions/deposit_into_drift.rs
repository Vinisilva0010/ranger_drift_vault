use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::RangerVault;

// Importamos a estrutura do nosso módulo interno gerado pela IDL
use crate::drift::cpi::accounts::Deposit as DriftDeposit;
use crate::drift::program::Drift;
use crate::drift::cpi::deposit;

#[derive(Accounts)]
pub struct DepositIntoDrift<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // Carrega o nosso Cofre. Apenas o admin pode mandar o Cofre depositar na corretora.
    #[account(
        seeds = [b"ranger_vault", vault_usdc_account.mint.as_ref()],
        bump = vault_state.bump,
        has_one = admin,
        has_one = drift_user_account // Trava de segurança: garante que o destino é a NOSSA conta
    )]
    pub vault_state: Account<'info, RangerVault>,

    // A nossa conta bancária física de USDC
    #[account(mut)]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    // --- CONTAS DA DRIFT V2 ---
    
    /// CHECK: Drift State
    #[account(mut)]
    pub drift_state: AccountInfo<'info>,

    /// CHECK: A nossa conta institucional na Drift
    #[account(
        mut,
        address = vault_state.drift_user_account
    )]
    pub drift_user_account: AccountInfo<'info>,

    /// CHECK: Status e métricas da nossa conta
    #[account(mut)]
    pub drift_user_stats: AccountInfo<'info>,

    /// CHECK: O cofre global de USDC da Drift (Destino do dinheiro)
    #[account(mut)]
    pub drift_spot_market_vault: AccountInfo<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_deposit_into_drift(ctx: Context<DepositIntoDrift>, amount: u64) -> Result<()> {
    let vault_state = &ctx.accounts.vault_state;
    let usdc_mint = ctx.accounts.vault_usdc_account.mint;
    let bump = vault_state.bump;

    // O nosso Cofre precisa "assinar" a transferência do Token
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"ranger_vault",
        usdc_mint.as_ref(),
        &[bump],
    ]];

    let cpi_accounts = DriftDeposit {
        state: ctx.accounts.drift_state.to_account_info(),
        user: ctx.accounts.drift_user_account.to_account_info(),
        user_stats: ctx.accounts.drift_user_stats.to_account_info(),
        authority: vault_state.to_account_info(), // Nós somos a autoridade do cofre
        spot_market_vault: ctx.accounts.drift_spot_market_vault.to_account_info(),
        user_token_account: ctx.accounts.vault_usdc_account.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    // Parâmetros da Drift:
    // market_index: 0 (Na Drift, 0 é sempre USDC)
    // amount: a quantidade de tokens
    // reduce_only: false (estamos adicionando margem, não pagando dívida)
    let market_index = 0;
    let reduce_only = false;

    // O Kill-Shot: Dispara a ordem para a Drift processar o depósito
    deposit(cpi_ctx, market_index, amount, reduce_only)?;

    msg!("Colateral Injetado na Drift com Sucesso!");
    msg!("USDC Transferido: {}", amount);

    Ok(())
}