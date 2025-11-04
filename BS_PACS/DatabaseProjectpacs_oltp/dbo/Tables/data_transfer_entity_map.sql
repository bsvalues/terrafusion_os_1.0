CREATE TABLE [dbo].[data_transfer_entity_map] (
    [id]               INT         IDENTITY (1, 1) NOT NULL,
    [appr_code]        CHAR (10)   NULL,
    [coll_code]        CHAR (10)   NULL,
    [ignore]           BIT         CONSTRAINT [CDF_data_transfer_entity_map_ignore] DEFAULT (0) NOT NULL,
    [type]             VARCHAR (3) CONSTRAINT [CDF_data_transfer_entity_map_type] DEFAULT ('0') NOT NULL,
    [flag]             INT         CONSTRAINT [CDF_data_transfer_entity_map_flag] DEFAULT (0) NOT NULL,
    [property_data]    BIT         CONSTRAINT [CDF_data_transfer_entity_map_property_data] DEFAULT (0) NOT NULL,
    [ownership_update] BIT         CONSTRAINT [CDF_data_transfer_entity_map_ownership_update] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_data_transfer_entity_map] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

