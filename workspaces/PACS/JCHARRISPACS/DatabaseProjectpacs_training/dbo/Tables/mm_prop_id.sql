CREATE TABLE [dbo].[mm_prop_id] (
    [mm_id]   INT NOT NULL,
    [prop_id] INT NOT NULL,
    CONSTRAINT [CPK_mm_prop_id] PRIMARY KEY CLUSTERED ([mm_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

