CREATE TABLE [dbo].[condo_style_code] (
    [style_cd]   VARCHAR (10) NOT NULL,
    [style_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_style_code] PRIMARY KEY CLUSTERED ([style_cd] ASC)
);


GO

