CREATE TABLE [dbo].[meta_category] (
    [category_id] INT            IDENTITY (1, 1) NOT NULL,
    [name]        NVARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_meta_category] PRIMARY KEY CLUSTERED ([category_id] ASC)
);


GO

