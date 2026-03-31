use anchor_lang::prelude::*;
use crate::state::RangerVault;

// Importamos a infraestrutura tática gerada pela nossa IDL
use crate::drift::cpi::accounts::PlacePerpOrder as DriftPlaceOrder;
use crate::drift::program::Drift;
use crate::drift::cpi::place_perp_order;
use crate::drift::types::OrderParams;

#[derive(Accounts)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // A trava mestra. Só o Admin registrado no Cofre pode enviar o sinal de Trade.
    #[account(
        seeds = [b"ranger_vault", vault_state.usdc_mint.as_ref()],
        bump = vault_state.bump,
        has_one = admin,
        has_one = drift_user_account // Garante que a ordem vai pra conta certa
    )]
    pub vault_state: Account<'info, RangerVault>,

    // --- CONTAS DA DRIFT V2 ---
    
    /// CHECK: Estado global da Drift
    #[account(mut)]
    pub drift_state: AccountInfo<'info>,

    /// CHECK: A conta de margem do nosso Fundo (onde está o dinheiro)
    #[account(mut)]
    pub drift_user_account: AccountInfo<'info>,

    pub drift_program: Program<'info, Drift>,
}

pub fn handle_place_perp_order(
    ctx: Context<PlaceOrder>,
    params: OrderParams, // Recebemos os dados do trade (Preço, Quantidade, Long/Short) do nosso script/bot
) -> Result<()> {
    let vault_state = &ctx.accounts.vault_state;
    let usdc_key = vault_state.usdc_mint.key();
    let bump = vault_state.bump;

    // A caneta criptográfica do Cofre
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"ranger_vault",
        usdc_key.as_ref(),
        &[bump],
    ]];

    // Conectamos as tomadas da Drift
    let cpi_accounts = DriftPlaceOrder {
        state: ctx.accounts.drift_state.to_account_info(),
        user: ctx.accounts.drift_user_account.to_account_info(),
        authority: vault_state.to_account_info(), // O PDA do Fundo autoriza o trade
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    // Fogo Livre: Envia a ordem para o Livro da Drift
    place_perp_order(cpi_ctx, params)?;

    msg!("Sinal de Trade Executado!");
    msg!("O Ranger Vault enviou a ordem para a Drift V2.");

    Ok(())
}