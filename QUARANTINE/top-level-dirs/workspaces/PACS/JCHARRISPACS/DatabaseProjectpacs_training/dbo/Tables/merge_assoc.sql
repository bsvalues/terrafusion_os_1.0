CREATE TABLE [dbo].[merge_assoc] (
    [merge_id]    INT             NOT NULL,
    [prop_id]     INT             NOT NULL,
    [merge_dt]    DATETIME        NULL,
    [legal_acres] NUMERIC (14, 4) NULL,
    [legal_desc]  VARCHAR (255)   NULL,
    [owner]       VARCHAR (2048)  NULL,
    [year]        NUMERIC (4)     NULL,
    [sup_num]     INT             NULL,
    CONSTRAINT [CPK_merge_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [merge_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_merge_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

