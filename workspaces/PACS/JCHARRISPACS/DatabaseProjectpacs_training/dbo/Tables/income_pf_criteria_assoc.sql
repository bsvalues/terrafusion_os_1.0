CREATE TABLE [dbo].[income_pf_criteria_assoc] (
    [income_id]              INT         NOT NULL,
    [sup_num]                INT         NOT NULL,
    [income_yr]              NUMERIC (4) NOT NULL,
    [criteria_id]            INT         NOT NULL,
    [active_valuations_only] BIT         CONSTRAINT [CDF_income_pf_criteria_assoc_active_valuations_only] DEFAULT ((1)) NOT NULL,
    [grm_gim_flag]           BIT         CONSTRAINT [CDF_income_pf_criteria_assoc_grm_gim_flag] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_pf_criteria_assoc] PRIMARY KEY CLUSTERED ([income_yr] ASC, [sup_num] ASC, [income_id] ASC, [criteria_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_income_pf_criteria] FOREIGN KEY ([criteria_id]) REFERENCES [dbo].[income_pf_criteria] ([criteria_id]),
    CONSTRAINT [CFK_income_pf_criteria_assoc_income] FOREIGN KEY ([income_yr], [sup_num], [income_id]) REFERENCES [dbo].[income] ([income_yr], [sup_num], [income_id]) ON DELETE CASCADE
);


GO

