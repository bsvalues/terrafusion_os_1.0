CREATE TABLE [dbo].[supplement] (
    [sup_tax_yr]       NUMERIC (4) NOT NULL,
    [sup_num]          INT         NOT NULL,
    [sup_group_id]     INT         NOT NULL,
    [levy_cert_run_id] INT         NULL,
    CONSTRAINT [CPK_supplement] PRIMARY KEY CLUSTERED ([sup_tax_yr] ASC, [sup_num] ASC, [sup_group_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_sup_group_id]
    ON [dbo].[supplement]([sup_group_id] ASC) WITH (FILLFACTOR = 90);


GO

