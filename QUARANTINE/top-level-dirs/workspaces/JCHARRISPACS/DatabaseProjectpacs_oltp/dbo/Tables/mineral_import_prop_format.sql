CREATE TABLE [dbo].[mineral_import_prop_format] (
    [prop_type_cd]   CHAR (5)     NOT NULL,
    [format_type_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_mineral_import_prop_format] PRIMARY KEY CLUSTERED ([prop_type_cd] ASC, [format_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mineral_import_prop_format_format_type_cd] FOREIGN KEY ([format_type_cd]) REFERENCES [dbo].[mineral_import_format_type] ([format_type_cd]),
    CONSTRAINT [CFK_mineral_import_prop_format_prop_type_cd] FOREIGN KEY ([prop_type_cd]) REFERENCES [dbo].[property_type] ([prop_type_cd])
);


GO

