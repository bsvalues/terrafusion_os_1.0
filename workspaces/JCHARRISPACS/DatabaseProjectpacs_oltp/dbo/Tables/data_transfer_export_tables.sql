CREATE TABLE [dbo].[data_transfer_export_tables] (
    [table_name]         VARCHAR (50) NOT NULL,
    [enabled]            BIT          CONSTRAINT [CDF_data_transfer_export_tables_enabled] DEFAULT (0) NOT NULL,
    [property_data]      BIT          CONSTRAINT [CDF_data_transfer_export_tables_property_data] DEFAULT (0) NOT NULL,
    [ownership_transfer] BIT          CONSTRAINT [CDF_data_transfer_export_tables_ownership_transfer] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_data_transfer_export_tables] PRIMARY KEY CLUSTERED ([table_name] ASC) WITH (FILLFACTOR = 100)
);


GO

