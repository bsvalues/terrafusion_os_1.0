CREATE TABLE [dbo].[condo_stories_code] (
    [stories_cd]   VARCHAR (10) NOT NULL,
    [stories_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_stories_code] PRIMARY KEY CLUSTERED ([stories_cd] ASC)
);


GO

