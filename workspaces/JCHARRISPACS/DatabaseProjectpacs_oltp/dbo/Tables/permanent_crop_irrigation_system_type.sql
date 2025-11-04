CREATE TABLE [dbo].[permanent_crop_irrigation_system_type] (
    [irrigation_type_cd]   VARCHAR (15) NOT NULL,
    [irrigation_type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_permanent_crop_irrigation_system_type] PRIMARY KEY CLUSTERED ([irrigation_type_cd] ASC)
);


GO

