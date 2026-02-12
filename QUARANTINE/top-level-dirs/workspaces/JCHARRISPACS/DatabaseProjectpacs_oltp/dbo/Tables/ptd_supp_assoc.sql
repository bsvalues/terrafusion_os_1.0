CREATE TABLE [dbo].[ptd_supp_assoc] (
    [prop_id] INT         NULL,
    [sup_num] INT         NULL,
    [sup_yr]  NUMERIC (4) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_sup_yr]
    ON [dbo].[ptd_supp_assoc]([sup_yr] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id_sup_num_sup_yr]
    ON [dbo].[ptd_supp_assoc]([prop_id] ASC, [sup_num] ASC, [sup_yr] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sup_num]
    ON [dbo].[ptd_supp_assoc]([sup_num] ASC) WITH (FILLFACTOR = 90);


GO

