CREATE TABLE [dbo].[cms_quality] (
    [year]  NUMERIC (4)    NOT NULL,
    [value] NUMERIC (2, 1) NOT NULL,
    [name]  VARCHAR (50)   NULL,
    CONSTRAINT [CPK_cms_quality] PRIMARY KEY CLUSTERED ([year] ASC, [value] ASC)
);


GO

