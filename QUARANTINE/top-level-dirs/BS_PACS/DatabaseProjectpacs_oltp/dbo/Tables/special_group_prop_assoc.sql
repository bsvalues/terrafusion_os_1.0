CREATE TABLE [dbo].[special_group_prop_assoc] (
    [special_group_id] INT         NOT NULL,
    [prop_id]          INT         NOT NULL,
    [prop_val_yr]      NUMERIC (4) NOT NULL,
    [assoc_dt]         DATETIME    NULL,
    CONSTRAINT [CPK_special_group_prop_assoc] PRIMARY KEY CLUSTERED ([special_group_id] ASC, [prop_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

