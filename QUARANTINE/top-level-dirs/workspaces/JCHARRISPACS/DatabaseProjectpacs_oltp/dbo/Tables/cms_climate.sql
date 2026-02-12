CREATE TABLE [dbo].[cms_climate] (
    [year] NUMERIC (4)  NOT NULL,
    [code] CHAR (1)     NOT NULL,
    [name] VARCHAR (50) NULL,
    CONSTRAINT [CPK_cms_climate] PRIMARY KEY CLUSTERED ([year] ASC, [code] ASC)
);


GO

