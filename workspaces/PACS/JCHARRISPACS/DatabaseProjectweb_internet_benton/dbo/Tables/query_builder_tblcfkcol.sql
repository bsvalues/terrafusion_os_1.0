CREATE TABLE [dbo].[query_builder_tblcfkcol] (
    [lForeignKeyID] INT           NOT NULL,
    [szFColumn]     VARCHAR (127) NOT NULL,
    [szRColumn]     VARCHAR (127) NOT NULL,
    CONSTRAINT [CPK_query_builder_tblcfkcol] PRIMARY KEY CLUSTERED ([lForeignKeyID] ASC, [szFColumn] ASC, [szRColumn] ASC) WITH (FILLFACTOR = 100)
);


GO

