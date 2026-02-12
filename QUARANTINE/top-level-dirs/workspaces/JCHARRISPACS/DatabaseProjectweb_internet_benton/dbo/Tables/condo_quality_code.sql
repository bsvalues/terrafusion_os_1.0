CREATE TABLE [dbo].[condo_quality_code] (
    [quality_cd]   VARCHAR (10) NOT NULL,
    [quality_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_quality_code] PRIMARY KEY CLUSTERED ([quality_cd] ASC)
);


GO

