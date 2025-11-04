CREATE TABLE [dbo].[prop_supp_assoc] (
    [prop_id]      INT         NOT NULL,
    [owner_tax_yr] NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    CONSTRAINT [CPK_prop_supp_assoc] PRIMARY KEY CLUSTERED ([owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_prop_supp_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CUQ_prop_supp_assoc_owner_tax_yr_prop_id] UNIQUE NONCLUSTERED ([owner_tax_yr] ASC, [prop_id] ASC) WITH (FILLFACTOR = 95)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[prop_supp_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

