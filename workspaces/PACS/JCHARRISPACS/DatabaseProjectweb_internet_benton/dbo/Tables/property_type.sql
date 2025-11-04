CREATE TABLE [dbo].[property_type] (
    [prop_type_cd]   CHAR (5)     NOT NULL,
    [prop_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_property_type] PRIMARY KEY CLUSTERED ([prop_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

