CREATE TABLE [dbo].[income_improvement_level_detail] (
    [income_yr]                    NUMERIC (4)     NOT NULL,
    [sup_num]                      INT             NOT NULL,
    [sale_id]                      AS              ((0)) PERSISTED NOT NULL,
    [income_id]                    INT             NOT NULL,
    [seq_num]                      INT             IDENTITY (1, 1) NOT NULL,
    [prop_id]                      INT             NOT NULL,
    [imprv_id]                     INT             NOT NULL,
    [imprv_det_id]                 INT             NOT NULL,
    [included]                     BIT             CONSTRAINT [CDF_income_improvement_level_detail_included] DEFAULT ((0)) NOT NULL,
    [override]                     BIT             CONSTRAINT [CDF_income_improvement_level_detail_override] DEFAULT ((0)) NOT NULL,
    [copied]                       BIT             CONSTRAINT [CDF_income_improvement_level_detail_copied] DEFAULT ((0)) NOT NULL,
    [hood_cd]                      VARCHAR (10)    NULL,
    [imprv_det_type_cd]            VARCHAR (10)    NULL,
    [imprv_det_meth_cd]            VARCHAR (5)     NULL,
    [floor_number]                 NUMERIC (4)     NULL,
    [floor_number_override]        BIT             CONSTRAINT [CDF_income_improvement_level_detail_floor_number_override] DEFAULT ((0)) NOT NULL,
    [primary_use_cd]               VARCHAR (10)    NULL,
    [lease_class]                  VARCHAR (10)    NULL,
    [effective_year_built]         NUMERIC (4)     NULL,
    [gross_building_area]          NUMERIC (18, 1) NULL,
    [gross_building_area_override] BIT             CONSTRAINT [CDF_income_improvement_level_detail_gross_building_area_override] DEFAULT ((0)) NOT NULL,
    [load_factor]                  NUMERIC (3)     NULL,
    [load_factor_override]         BIT             CONSTRAINT [CDF_income_improvement_level_detail_load_factor_override] DEFAULT ((0)) NOT NULL,
    [net_rentable_area]            NUMERIC (18, 1) NULL,
    [net_rentable_area_override]   BIT             CONSTRAINT [CDF_income_improvement_level_detail_net_rentable_area_override] DEFAULT ((0)) NOT NULL,
    [rent_rate_override]           BIT             CONSTRAINT [CDF_income_improvement_level_detail_rent_rate_override] DEFAULT ((0)) NOT NULL,
    [occupancy_pct]                NUMERIC (3)     NULL,
    [occupancy_pct_override]       BIT             CONSTRAINT [CDF_income_improvement_level_detail_occupancy_pct_override] DEFAULT ((0)) NOT NULL,
    [collection_loss]              NUMERIC (5, 2)  NULL,
    [collection_loss_override]     BIT             CONSTRAINT [CDF_income_improvement_level_detail_collection_loss_override] DEFAULT ((0)) NOT NULL,
    [reimbursed_expenses]          NUMERIC (14)    NULL,
    [reimbursed_expenses_override] BIT             CONSTRAINT [CDF_income_improvement_level_detail_reimbursed_expenses_override] DEFAULT ((0)) NOT NULL,
    [secondary_income]             NUMERIC (14)    NULL,
    [secondary_income_override]    BIT             CONSTRAINT [CDF_income_improvement_level_detail_secondary_income_override] DEFAULT ((0)) NOT NULL,
    [gross_potential_income]       NUMERIC (14)    NULL,
    [effective_gross_income]       NUMERIC (14)    NULL,
    [expense_ratio]                NUMERIC (5, 2)  NULL,
    [expense_ratio_override]       BIT             CONSTRAINT [CDF_income_improvement_level_detail_expense_ratio_override] DEFAULT ((0)) NOT NULL,
    [expense_per_sqft]             NUMERIC (14, 2) NULL,
    [expense_per_sqft_override]    BIT             CONSTRAINT [CDF_income_improvement_level_detail_expense_per_sqft_override] DEFAULT ((0)) NOT NULL,
    [expense_overall]              NUMERIC (14)    NULL,
    [expense_overall_override]     BIT             CONSTRAINT [CDF_income_improvement_level_detail_expense_overall_override] DEFAULT ((0)) NOT NULL,
    [cap_rate]                     NUMERIC (7, 4)  NULL,
    [cap_rate_override]            BIT             CONSTRAINT [CDF_income_improvement_level_detail_cap_rate_override] DEFAULT ((0)) NOT NULL,
    [tax_rate]                     NUMERIC (7, 4)  NULL,
    [tax_rate_override]            BIT             CONSTRAINT [CDF_income_improvement_level_detail_tax_rate_override] DEFAULT ((0)) NOT NULL,
    [overall_rate]                 NUMERIC (7, 4)  NULL,
    [overall_rate_override]        BIT             CONSTRAINT [CDF_income_improvement_level_detail_overall_rate_override] DEFAULT ((0)) NOT NULL,
    [net_operating_income]         NUMERIC (14)    NULL,
    [value]                        NUMERIC (14)    NULL,
    [imprv_desc]                   VARCHAR (255)   NULL,
    [tsRowVersion]                 ROWVERSION      NOT NULL,
    [economic_area]                VARCHAR (10)    NULL,
    [economic_area_override]       BIT             CONSTRAINT [CDF_income_improvement_level_detail_economic_area_override] DEFAULT ((0)) NOT NULL,
    [unit_count]                   INT             NULL,
    [unit_mix_code]                VARCHAR (12)    NULL,
    [unit_size]                    INT             NULL,
    [daily_rent_rate]              NUMERIC (14, 2) NULL,
    [monthly_rent_rate]            NUMERIC (14, 2) NULL,
    [yearly_rent_rate]             NUMERIC (14, 2) NULL,
    [use_unit_count]               BIT             CONSTRAINT [CDF_income_improvement_level_detail_use_unit_count] DEFAULT ((0)) NOT NULL,
    [comments]                     VARCHAR (30)    NULL,
    CONSTRAINT [CPK_income_improvement_level_detail] PRIMARY KEY CLUSTERED ([income_yr] ASC, [sup_num] ASC, [income_id] ASC, [seq_num] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_income_improvement_level_detail_imprv_detail] FOREIGN KEY ([income_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id]) REFERENCES [dbo].[imprv_detail] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_income_improvement_level_detail_income_imprv_assoc] FOREIGN KEY ([income_yr], [sup_num], [sale_id], [income_id], [prop_id], [imprv_id]) REFERENCES [dbo].[income_imprv_assoc] ([income_yr], [sup_num], [sale_id], [income_id], [prop_id], [imprv_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_income_improvement_level_detail_unit_mix] FOREIGN KEY ([unit_mix_code]) REFERENCES [dbo].[imprv_sched_unit_mix] ([code])
);


GO

CREATE NONCLUSTERED INDEX [idx_income_yr_sup_num_prop_id]
    ON [dbo].[income_improvement_level_detail]([income_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag - use the unit count in place of NRA in calculations', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'use_unit_count';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True if the user changed the economic area from the income valuation''s economic area.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'economic_area_override';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Daily rent rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'daily_rent_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unit count', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'unit_count';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'comments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'comments';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unit mix code, from codefile', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'unit_mix_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Monthly rent rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'monthly_rent_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'If the user overrides the economic area for an improvement detail in an income valuation, it''s stored here.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'economic_area';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Yearly rent rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'yearly_rent_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unit size', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_improvement_level_detail', @level2type = N'COLUMN', @level2name = N'unit_size';


GO

