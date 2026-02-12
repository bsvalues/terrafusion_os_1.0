CREATE TABLE [dbo].[field_validation] (
    [pacs_table_name]  VARCHAR (50)   NOT NULL,
    [pacs_column_name] VARCHAR (50)   NOT NULL,
    [validator]        NVARCHAR (MAX) NOT NULL,
    CONSTRAINT [CPK_field_validation] PRIMARY KEY CLUSTERED ([pacs_table_name] ASC, [pacs_column_name] ASC)
);


GO

