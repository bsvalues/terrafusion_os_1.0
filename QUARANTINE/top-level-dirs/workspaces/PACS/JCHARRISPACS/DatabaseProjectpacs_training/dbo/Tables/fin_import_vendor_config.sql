CREATE TABLE [dbo].[fin_import_vendor_config] (
    [view_name]                     VARCHAR (255) NOT NULL,
    [vendor_id_field]               VARCHAR (50)  NOT NULL,
    [vendor_name_field]             VARCHAR (50)  NOT NULL,
    [vendor_number_field]           VARCHAR (50)  NOT NULL,
    [vendor_create_date_field]      VARCHAR (50)  NOT NULL,
    [vendor_last_update_date_field] VARCHAR (50)  NOT NULL,
    [vendor_site_id_field]          VARCHAR (50)  NOT NULL,
    [vendor_site_code_field]        VARCHAR (50)  NOT NULL,
    CONSTRAINT [CPK_fin_import_vendor_config] PRIMARY KEY CLUSTERED ([view_name] ASC)
);


GO

