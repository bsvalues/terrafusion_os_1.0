CREATE TABLE [dbo].[query_builder_list_detail] (
    [lListID]       INT NOT NULL,
    [lListRowValue] INT NOT NULL,
    CONSTRAINT [CPK_query_builder_list_detail] PRIMARY KEY CLUSTERED ([lListID] ASC, [lListRowValue] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_query_builder_list_detail_lListID] FOREIGN KEY ([lListID]) REFERENCES [dbo].[query_builder_list_summary] ([lListID]) ON DELETE CASCADE
);


GO

