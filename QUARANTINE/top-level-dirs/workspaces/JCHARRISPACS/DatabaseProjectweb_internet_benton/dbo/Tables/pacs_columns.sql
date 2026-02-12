CREATE TABLE [dbo].[pacs_columns] (
    [iColumnID]    SMALLINT      IDENTITY (1, 1) NOT NULL,
    [szColumnName] VARCHAR (128) NOT NULL,
    CONSTRAINT [CPK_pacs_columns] PRIMARY KEY CLUSTERED ([iColumnID] ASC) WITH (FILLFACTOR = 90)
);


GO

