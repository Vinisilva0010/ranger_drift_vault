use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::RangerVault;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    // Carrega o nosso estado do cofre, validando pelas sementes (PDA)
    #[account(
        mut,
        seeds = [b"ranger_vault", usdc_mint.key().as_ref()],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, RangerVault>,

    // A carteira de USDC do investidor. 
    // Segurança Absoluta: Garantimos que o token é USDC e que o dono é quem assinou a TX.
    #[account(
        mut,
        constraint = investor_usdc_account.mint == usdc_mint.key(),
        constraint = investor_usdc_account.owner == investor.key()
    )]
    pub investor_usdc_account: Account<'info, TokenAccount>,

    // O cofre físico de USDC que pertence ao nosso contrato
    #[account(
        mut,
        seeds = [b"vault_token_account", vault_state.key().as_ref()],
        bump
    )]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault_state;

    // Prepara a transferência chamando o Token Program da Solana
    let transfer_instruction = Transfer {
        from: ctx.accounts.investor_usdc_account.to_account_info(),
        to: ctx.accounts.vault_usdc_account.to_account_info(),
        authority: ctx.accounts.investor.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_instruction,
    );

    // Executa a sucção do capital
    token::transfer(cpi_ctx, amount)?;

    // Atualiza a contabilidade do nosso Cofre
    vault.total_equity = vault.total_equity.checked_add(amount).unwrap();
    
    // Como estamos na fase 1 de captação, a proporção de cotas (shares) é 1:1.
    // Numa auditoria real, isso usa a fórmula: shares = amount * total_shares / total_equity
    vault.total_shares = vault.total_shares.checked_add(amount).unwrap();

    msg!("Depositado com sucesso: {} USDC", amount);
    msg!("TVL Atual do Cofre: {}", vault.total_equity);

    Ok(())
}