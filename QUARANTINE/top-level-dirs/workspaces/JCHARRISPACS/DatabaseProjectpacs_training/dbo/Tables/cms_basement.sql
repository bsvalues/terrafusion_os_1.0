CREATE TABLE [dbo].[cms_basement] (
    [year] NUMERIC (4)  NOT NULL,
    [code] VARCHAR (5)  NOT NULL,
    [name] VARCHAR (50) NULL,
    CONSTRAINT [CPK_cms_basement] PRIMARY KEY CLUSTERED ([year] ASC, [code] ASC)
);


GO

