CREATE TABLE [dbo].[income_prop_assoc] (
    [income_id]        INT            NOT NULL,
    [prop_id]          INT            NOT NULL,
    [sup_num]          INT            NOT NULL,
    [prop_val_yr]      NUMERIC (4)    NOT NULL,
    [income_pct]       NUMERIC (5, 2) NULL,
    [income_value]     NUMERIC (14)   NULL,
    [active_valuation] CHAR (1)       NULL,
    [tsRowVersion]     ROWVERSION     NOT NULL,
    CONSTRAINT [CPK_income_prop_assoc] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [income_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CCK_income_prop_assoc_prop_id] CHECK ([prop_id] <> 0),
    CONSTRAINT [CFK_income_prop_assoc_prop_val_yr_sup_num_income_id] FOREIGN KEY ([prop_val_yr], [sup_num], [income_id]) REFERENCES [dbo].[income] ([income_yr], [sup_num], [income_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[income_prop_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_val_yr_sup_num_prop_id]
    ON [dbo].[income_prop_assoc]([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO

