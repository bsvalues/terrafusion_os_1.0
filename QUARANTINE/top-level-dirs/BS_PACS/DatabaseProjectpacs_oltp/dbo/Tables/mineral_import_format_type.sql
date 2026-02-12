CREATE TABLE [dbo].[mineral_import_format_type] (
    [format_type_cd]          VARCHAR (10)  NOT NULL,
    [format_type_description] VARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_mineral_import_format_type] PRIMARY KEY CLUSTERED ([format_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

