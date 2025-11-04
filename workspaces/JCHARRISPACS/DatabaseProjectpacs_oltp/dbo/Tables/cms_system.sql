CREATE TABLE [dbo].[cms_system] (
    [year]    NUMERIC (4)  NOT NULL,
    [section] VARCHAR (5)  NOT NULL,
    [code]    VARCHAR (5)  NOT NULL,
    [name]    VARCHAR (50) NULL,
    CONSTRAINT [CPK_cms_system] PRIMARY KEY CLUSTERED ([year] ASC, [section] ASC, [code] ASC)
);


GO

