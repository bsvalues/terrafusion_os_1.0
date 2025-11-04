CREATE TABLE [dbo].[merge_from] (
    [merge_id]    INT             NOT NULL,
    [child_id]    INT             NOT NULL,
    [parent_id]   INT             NOT NULL,
    [legal_acres] NUMERIC (14, 4) NULL,
    [legal_desc]  VARCHAR (255)   NULL,
    [owner]       VARCHAR (2048)  NULL,
    CONSTRAINT [CPK_merge_from] PRIMARY KEY CLUSTERED ([merge_id] ASC, [child_id] ASC, [parent_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_merge_from_child_id] FOREIGN KEY ([child_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_merge_from_parent_id] FOREIGN KEY ([parent_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

