CREATE TABLE [dbo].[permanent_crop_age_group] (
    [age_group_cd]   VARCHAR (15) NOT NULL,
    [age_group_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_permanent_crop_age_group] PRIMARY KEY CLUSTERED ([age_group_cd] ASC)
);


GO

