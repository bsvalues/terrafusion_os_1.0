CREATE TABLE [dbo].[fin_import_account_config_type] (
    [view_name]     VARCHAR (255) NOT NULL,
    [type_name]     VARCHAR (50)  NOT NULL,
    [fms_type_name] VARCHAR (50)  NULL,
    CONSTRAINT [CPK_fin_import_account_config_type] PRIMARY KEY CLUSTERED ([view_name] ASC, [type_name] ASC)
);


GO

