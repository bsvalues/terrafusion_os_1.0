CREATE TABLE [dbo].[levy_roll_log] (
    [entity_id] INT         NOT NULL,
    [tax_yr]    NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_levy_roll_log] PRIMARY KEY CLUSTERED ([entity_id] ASC, [tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

