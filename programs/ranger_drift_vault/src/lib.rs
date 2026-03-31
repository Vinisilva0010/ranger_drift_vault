use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

declare_program!(drift);

#[program]
pub mod ranger_drift_vault {
    use super::*;

    pub fn initialize(
        ctx: Context<InitializeVault>,
        max_drawdown_bps: u16,
        min_health_factor: u16,
    ) -> Result<()> {
        handle_initialize(ctx, max_drawdown_bps, min_health_factor)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        handle_deposit(ctx, amount)
    }

    pub fn open_drift_account(ctx: Context<OpenDriftAccount>) -> Result<()> {
        handle_open_drift_account(ctx)
    }

    pub fn deposit_into_drift(ctx: Context<DepositIntoDrift>, amount: u64) -> Result<()> {
        handle_deposit_into_drift(ctx, amount)
    }

    // A Nova Rota: O Gatilho do Trade
    pub fn place_perp_order(ctx: Context<PlaceOrder>, params: drift::types::OrderParams) -> Result<()> {
        handle_place_perp_order(ctx, params)
    }
}