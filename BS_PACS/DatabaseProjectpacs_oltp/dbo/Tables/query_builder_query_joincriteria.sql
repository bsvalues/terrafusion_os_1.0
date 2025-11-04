CREATE TABLE [dbo].[query_builder_query_joincriteria] (
    [lQueryID]                    INT           NOT NULL,
    [lOrder]                      INT           NOT NULL,
    [lJoinCriteriaOrder]          INT           NOT NULL,
    [bCriteriaPresent]            BIT           NOT NULL,
    [lUniqueColumnID_JoinedTable] INT           NOT NULL,
    [lBaseTable]                  INT           NOT NULL,
    [lUniqueColumnID_BaseTable]   INT           NOT NULL,
    [szConstant]                  VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_query_builder_query_joincriteria] PRIMARY KEY CLUSTERED ([lQueryID] ASC, [lOrder] ASC, [lJoinCriteriaOrder] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_query_builder_query_joincriteria_lQueryID_lOrder] FOREIGN KEY ([lQueryID], [lOrder]) REFERENCES [dbo].[query_builder_query_fromjointbl] ([lQueryID], [lOrder]) ON DELETE CASCADE
);


GO

