CREATE TABLE [dbo].[cycle] (
    [cycle_id] INT NOT NULL,
    CONSTRAINT [CPK_cycle] PRIMARY KEY CLUSTERED ([cycle_id] ASC) WITH (FILLFACTOR = 100)
);


GO

