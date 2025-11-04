CREATE TABLE [dbo].[penpad_property_status] (
    [prop_id]      INT NOT NULL,
    [bProcessed]   BIT NOT NULL,
    [bInShapeFile] BIT CONSTRAINT [CDF_penpad_property_status_bInShapeFile] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_penpad_property_status] PRIMARY KEY CLUSTERED ([prop_id] ASC)
);


GO

