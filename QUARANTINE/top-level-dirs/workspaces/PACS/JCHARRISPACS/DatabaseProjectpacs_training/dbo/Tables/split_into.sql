CREATE TABLE [dbo].[split_into] (
    [split_id]    INT             NOT NULL,
    [parent_id]   INT             NOT NULL,
    [child_id]    INT             NOT NULL,
    [legal_acres] NUMERIC (14, 4) NULL,
    [legal_desc]  VARCHAR (255)   NULL,
    [owner]       VARCHAR (2048)  NULL,
    CONSTRAINT [CPK_split_into] PRIMARY KEY CLUSTERED ([split_id] ASC, [parent_id] ASC, [child_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_split_into_child_id] FOREIGN KEY ([child_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_split_into_parent_id] FOREIGN KEY ([parent_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_split_into_parent_id_split_id] FOREIGN KEY ([parent_id], [split_id]) REFERENCES [dbo].[split_assoc] ([prop_id], [split_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_child_id]
    ON [dbo].[split_into]([child_id] ASC) WITH (FILLFACTOR = 90);


GO

