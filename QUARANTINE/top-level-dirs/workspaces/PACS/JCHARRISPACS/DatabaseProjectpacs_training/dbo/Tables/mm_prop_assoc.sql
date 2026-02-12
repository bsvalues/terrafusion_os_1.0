CREATE TABLE [dbo].[mm_prop_assoc] (
    [mm_id]   INT NOT NULL,
    [prop_id] INT NOT NULL,
    CONSTRAINT [CPK_mm_prop_assoc] PRIMARY KEY CLUSTERED ([mm_id] ASC, [prop_id] ASC)
);


GO

