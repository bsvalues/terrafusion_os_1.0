CREATE TABLE [dbo].[fin_import_account_config] (
    [view_name]                 VARCHAR (255) NOT NULL,
    [account_type_field]        VARCHAR (50)  NULL,
    [account_description_field] VARCHAR (50)  NULL,
    CONSTRAINT [CPK_fin_import_account_config] PRIMARY KEY CLUSTERED ([view_name] ASC)
);


GO

