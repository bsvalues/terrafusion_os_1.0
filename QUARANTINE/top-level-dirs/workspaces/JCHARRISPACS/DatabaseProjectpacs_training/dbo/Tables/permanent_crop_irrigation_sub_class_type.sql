CREATE TABLE [dbo].[permanent_crop_irrigation_sub_class_type] (
    [sub_class_type_cd]   VARCHAR (15) NOT NULL,
    [sub_class_type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_permanent_crop_irrigation_sub_class_type] PRIMARY KEY CLUSTERED ([sub_class_type_cd] ASC)
);


GO

