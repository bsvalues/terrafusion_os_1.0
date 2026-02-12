CREATE TABLE [dbo].[special_group_owner_assoc] (
    [special_group_id] INT         NOT NULL,
    [owner_id]         INT         NOT NULL,
    [owner_tax_yr]     NUMERIC (4) NOT NULL,
    [assoc_dt]         DATETIME    NULL,
    CONSTRAINT [CPK_special_group_owner_assoc] PRIMARY KEY CLUSTERED ([special_group_id] ASC, [owner_id] ASC, [owner_tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

