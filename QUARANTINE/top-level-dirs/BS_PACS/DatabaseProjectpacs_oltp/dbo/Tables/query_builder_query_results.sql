CREATE TABLE [dbo].[query_builder_query_results] (
    [lQueryID]         INT            NOT NULL,
    [szTableSuffix]    VARCHAR (6)    NOT NULL,
    [lResultsRowCount] INT            NULL,
    [szSQL]            VARCHAR (8000) NULL,
    CONSTRAINT [CPK_query_builder_query_results] PRIMARY KEY CLUSTERED ([lQueryID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_query_builder_query_results_lQueryID] FOREIGN KEY ([lQueryID]) REFERENCES [dbo].[query_builder_query] ([lQueryID]) ON DELETE CASCADE
);


GO

