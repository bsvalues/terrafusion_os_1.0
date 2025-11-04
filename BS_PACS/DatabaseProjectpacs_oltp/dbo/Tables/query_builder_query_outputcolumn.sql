CREATE TABLE [dbo].[query_builder_query_outputcolumn] (
    [lQueryID]           INT NOT NULL,
    [lOrder]             INT NOT NULL,
    [lUniqueColumnID]    INT NOT NULL,
    [lAggregateFunction] INT NOT NULL,
    [lTable]             INT NOT NULL,
    CONSTRAINT [CPK_query_builder_query_outputcolumn] PRIMARY KEY CLUSTERED ([lQueryID] ASC, [lOrder] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_query_builder_query_outputcolumn_lQueryID] FOREIGN KEY ([lQueryID]) REFERENCES [dbo].[query_builder_query] ([lQueryID]) ON DELETE CASCADE
);


GO

