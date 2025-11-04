CREATE TABLE [dbo].[object_type] (
    [object_type_cd]   VARCHAR (10) NOT NULL,
    [object_type_desc] VARCHAR (40) NOT NULL,
    CONSTRAINT [CPK_object_type] PRIMARY KEY CLUSTERED ([object_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

