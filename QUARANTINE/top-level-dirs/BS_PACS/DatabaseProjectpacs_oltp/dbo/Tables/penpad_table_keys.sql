CREATE TABLE [dbo].[penpad_table_keys] (
    [szTableName]  [sysname] NOT NULL,
    [szColumnName] [sysname] NOT NULL,
    [iColumnSeq]   SMALLINT  NOT NULL,
    CONSTRAINT [CPK_penpad_table_keys] PRIMARY KEY CLUSTERED ([szTableName] ASC, [szColumnName] ASC) WITH (FILLFACTOR = 90)
);


GO

