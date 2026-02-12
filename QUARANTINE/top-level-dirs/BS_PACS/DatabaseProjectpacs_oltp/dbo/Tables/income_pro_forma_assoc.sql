CREATE TABLE [dbo].[income_pro_forma_assoc] (
    [income_yr]       NUMERIC (4) NOT NULL,
    [sup_num]         INT         NOT NULL,
    [income_id]       INT         NOT NULL,
    [pf_income_id]    INT         NOT NULL,
    [pf_grm_gim_flag] BIT         CONSTRAINT [CDF_income_pro_forma_assoc_pf_grm_gim_flag] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_pro_forma_assoc] PRIMARY KEY CLUSTERED ([income_yr] ASC, [sup_num] ASC, [income_id] ASC, [pf_income_id] ASC, [pf_grm_gim_flag] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_income_pro_forma_assoc_income] FOREIGN KEY ([income_yr], [sup_num], [income_id]) REFERENCES [dbo].[income] ([income_yr], [sup_num], [income_id]) ON DELETE CASCADE
);


GO

