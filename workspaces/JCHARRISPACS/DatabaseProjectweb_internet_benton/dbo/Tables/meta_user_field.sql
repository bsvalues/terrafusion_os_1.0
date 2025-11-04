CREATE TABLE [dbo].[meta_user_field] (
    [table_name]   VARCHAR (128) NOT NULL,
    [field_name]   VARCHAR (128) NOT NULL,
    [display_name] VARCHAR (128) NULL,
    [field_type]   VARCHAR (128) NULL,
    CONSTRAINT [CPK_meta_user_field] PRIMARY KEY CLUSTERED ([table_name] ASC, [field_name] ASC) WITH (FILLFACTOR = 90)
);


GO

