CREATE TABLE [dbo].[penpad_table_ids] (
    [szTableName]  VARCHAR (255) NOT NULL,
    [szColumnName] VARCHAR (255) NOT NULL,
    [szTableRef]   VARCHAR (255) NULL,
    [szColumnRef]  VARCHAR (255) NULL,
    CONSTRAINT [CPK_penpad_table_ids] PRIMARY KEY CLUSTERED ([szTableName] ASC, [szColumnName] ASC) WITH (FILLFACTOR = 90)
);


GO

