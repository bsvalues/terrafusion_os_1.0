CREATE TABLE [dbo].[query_builder_query_fromjointbl] (
    [lQueryID]       INT           NOT NULL,
    [lOrder]         INT           NOT NULL,
    [szTable]        VARCHAR (127) NOT NULL,
    [bLeftOuterJoin] BIT           NOT NULL,
    CONSTRAINT [CPK_query_builder_query_fromjointbl] PRIMARY KEY CLUSTERED ([lQueryID] ASC, [lOrder] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_query_builder_query_fromjointbl_lQueryID] FOREIGN KEY ([lQueryID]) REFERENCES [dbo].[query_builder_query] ([lQueryID]) ON DELETE CASCADE
);


GO

