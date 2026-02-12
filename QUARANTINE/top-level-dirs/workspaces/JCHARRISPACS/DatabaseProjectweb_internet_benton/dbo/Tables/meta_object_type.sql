CREATE TABLE [dbo].[meta_object_type] (
    [object_type_id] INT            IDENTITY (1, 1) NOT NULL,
    [type]           NVARCHAR (10)  NOT NULL,
    [name]           NVARCHAR (100) NOT NULL,
    [description]    NVARCHAR (100) NULL,
    CONSTRAINT [CPK_meta_object_type] PRIMARY KEY CLUSTERED ([object_type_id] ASC)
);


GO

