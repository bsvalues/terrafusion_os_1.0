CREATE TABLE [dbo].[cms_section] (
    [year] NUMERIC (4)  NOT NULL,
    [code] VARCHAR (5)  NOT NULL,
    [name] VARCHAR (50) NULL,
    CONSTRAINT [CPK_cms_section] PRIMARY KEY CLUSTERED ([year] ASC, [code] ASC)
);


GO

