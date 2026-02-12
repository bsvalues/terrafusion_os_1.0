CREATE TABLE [dbo].[meta_sub_type] (
    [sub_type_id]    INT            IDENTITY (1, 1) NOT NULL,
    [object_type_id] INT            NOT NULL,
    [sub_type]       NVARCHAR (10)  NOT NULL,
    [name]           NVARCHAR (100) NOT NULL,
    [description]    NVARCHAR (100) NULL,
    CONSTRAINT [CPK_meta_sub_type] PRIMARY KEY CLUSTERED ([sub_type_id] ASC)
);


GO

