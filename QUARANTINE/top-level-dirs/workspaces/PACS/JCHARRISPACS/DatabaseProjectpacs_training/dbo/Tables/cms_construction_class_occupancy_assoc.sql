CREATE TABLE [dbo].[cms_construction_class_occupancy_assoc] (
    [year]                    NUMERIC (4) NOT NULL,
    [occupancy_code]          VARCHAR (5) NOT NULL,
    [construction_class_code] VARCHAR (5) NOT NULL,
    CONSTRAINT [CPK_cms_construction_class_occupancy_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [occupancy_code] ASC, [construction_class_code] ASC)
);


GO

