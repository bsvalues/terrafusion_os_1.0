CREATE TABLE [dbo].[data_transfer_entity_map_type] (
    [type]        VARCHAR (3)  NOT NULL,
    [description] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_data_transfer_entity_map_type] PRIMARY KEY CLUSTERED ([type] ASC) WITH (FILLFACTOR = 100)
);


GO

