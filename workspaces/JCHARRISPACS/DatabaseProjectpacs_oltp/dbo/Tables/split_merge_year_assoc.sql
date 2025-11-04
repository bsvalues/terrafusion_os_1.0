CREATE TABLE [dbo].[split_merge_year_assoc] (
    [split_merge_id] INT         NOT NULL,
    [year]           NUMERIC (4) NOT NULL,
    [processed]      BIT         NULL,
    CONSTRAINT [CPK_split_merge_year_assoc] PRIMARY KEY CLUSTERED ([split_merge_id] ASC, [year] ASC),
    CONSTRAINT [CFK_split_merge_year_assoc_split_merge_id] FOREIGN KEY ([split_merge_id]) REFERENCES [dbo].[split_merge] ([split_merge_id])
);


GO

