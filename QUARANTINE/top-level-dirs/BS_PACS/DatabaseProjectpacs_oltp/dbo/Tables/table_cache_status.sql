CREATE TABLE [dbo].[table_cache_status] (
    [szTableName] VARCHAR (128) NOT NULL,
    [lDummy]      INT           NOT NULL,
    [ts]          ROWVERSION    NOT NULL,
    CONSTRAINT [CPK_table_cache_status] PRIMARY KEY CLUSTERED ([szTableName] ASC)
);


GO

