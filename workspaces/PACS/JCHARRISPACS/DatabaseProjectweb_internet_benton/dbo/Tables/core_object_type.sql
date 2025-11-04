CREATE TABLE [dbo].[core_object_type] (
    [core_object_type_cd]   VARCHAR (20)  NOT NULL,
    [core_object_type_desc] VARCHAR (100) NULL,
    CONSTRAINT [CPK_core_object_type] PRIMARY KEY CLUSTERED ([core_object_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

