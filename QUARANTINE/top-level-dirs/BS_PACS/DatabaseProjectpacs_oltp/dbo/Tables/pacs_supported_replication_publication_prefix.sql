CREATE TABLE [dbo].[pacs_supported_replication_publication_prefix] (
    [publication_type]   VARCHAR (20) NOT NULL,
    [publication_prefix] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_pacs_supported_replication_publication_prefix] PRIMARY KEY CLUSTERED ([publication_type] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains valid prefix values for PACS supported table replication. Used by upgrade process when distributing changes that require replication to be dropped and added back and the end of the upgrade', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_supported_replication_publication_prefix';


GO

