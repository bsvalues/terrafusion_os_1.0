CREATE TABLE [dbo].[cms_occupancy_section_assoc] (
    [year]           NUMERIC (4) NOT NULL,
    [section_code]   VARCHAR (5) NOT NULL,
    [occupancy_code] VARCHAR (5) NOT NULL,
    CONSTRAINT [CPK_cms_occupancy_section_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [section_code] ASC, [occupancy_code] ASC)
);


GO

