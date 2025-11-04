CREATE TABLE [dbo].[query_builder_tblcfk] (
    [lForeignKeyID] INT           NOT NULL,
    [szFTable]      VARCHAR (127) NOT NULL,
    [szRTable]      VARCHAR (127) NOT NULL,
    CONSTRAINT [CPK_query_builder_tblcfk] PRIMARY KEY CLUSTERED ([lForeignKeyID] ASC) WITH (FILLFACTOR = 100)
);


GO

