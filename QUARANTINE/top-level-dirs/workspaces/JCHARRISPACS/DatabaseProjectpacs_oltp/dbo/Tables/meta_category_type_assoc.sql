CREATE TABLE [dbo].[meta_category_type_assoc] (
    [category_id]    INT NOT NULL,
    [object_type_id] INT NOT NULL,
    CONSTRAINT [CFK_meta_category_type_assoc_category_id] FOREIGN KEY ([category_id]) REFERENCES [dbo].[meta_category] ([category_id]),
    CONSTRAINT [CFK_meta_category_type_assoc_object_type_id] FOREIGN KEY ([object_type_id]) REFERENCES [dbo].[meta_object_type] ([object_type_id])
);


GO

