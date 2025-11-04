CREATE TABLE [dbo].[query_builder_query_whereincriteria] (
    [lQueryID]    INT           NOT NULL,
    [lOrder]      INT           NOT NULL,
    [lINOrder]    INT           NOT NULL,
    [szINOperand] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_query_builder_query_whereincriteria] PRIMARY KEY CLUSTERED ([lQueryID] ASC, [lOrder] ASC, [lINOrder] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_query_builder_query_whereincriteria_lQueryID_lOrder] FOREIGN KEY ([lQueryID], [lOrder]) REFERENCES [dbo].[query_builder_query_wherecriteria] ([lQueryID], [lOrder]) ON DELETE CASCADE
);


GO

