CREATE TABLE [dbo].[penpad_config_update_fields] (
    [table_name] VARCHAR (255) NOT NULL,
    [field_name] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_penpad_config_update_fields] PRIMARY KEY CLUSTERED ([table_name] ASC, [field_name] ASC) WITH (FILLFACTOR = 90)
);


GO

