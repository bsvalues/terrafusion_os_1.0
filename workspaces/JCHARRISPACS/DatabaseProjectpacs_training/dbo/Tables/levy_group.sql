CREATE TABLE [dbo].[levy_group] (
    [levy_group_id] INT         NOT NULL,
    [levy_year]     NUMERIC (4) NOT NULL,
    [levy_sup_num]  INT         NOT NULL,
    CONSTRAINT [CPK_levy_group] PRIMARY KEY CLUSTERED ([levy_group_id] ASC, [levy_year] ASC, [levy_sup_num] ASC) WITH (FILLFACTOR = 100)
);


GO

