CREATE TABLE [dbo].[split_merge_prop_assoc] (
    [split_merge_id] INT NOT NULL,
    [prop_id]        INT NOT NULL,
    [merge_to]       BIT NULL,
    CONSTRAINT [CPK_split_merge_prop_assoc] PRIMARY KEY CLUSTERED ([split_merge_id] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_split_merge_prop_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_split_merge_prop_assoc_split_merge_id] FOREIGN KEY ([split_merge_id]) REFERENCES [dbo].[split_merge] ([split_merge_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[split_merge_prop_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

