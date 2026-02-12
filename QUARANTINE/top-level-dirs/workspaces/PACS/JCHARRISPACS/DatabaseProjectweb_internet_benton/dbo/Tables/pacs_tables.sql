CREATE TABLE [dbo].[pacs_tables] (
    [iTableID]            SMALLINT      IDENTITY (1, 1) NOT NULL,
    [szTableName]         VARCHAR (128) NOT NULL,
    [lDSSReplicationFlag] INT           NOT NULL,
    [lWebReplicationFlag] INT           NOT NULL,
    CONSTRAINT [CPK_pacs_tables] PRIMARY KEY CLUSTERED ([iTableID] ASC) WITH (FILLFACTOR = 90)
);


GO

