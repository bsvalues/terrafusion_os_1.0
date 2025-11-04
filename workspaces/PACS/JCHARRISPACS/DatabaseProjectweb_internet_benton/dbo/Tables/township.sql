CREATE TABLE [dbo].[township] (
    [township_code] VARCHAR (20) NOT NULL,
    [township_year] NUMERIC (4)  NOT NULL,
    [township_desc] VARCHAR (60) NOT NULL,
    [created_date]  DATETIME     NULL,
    CONSTRAINT [CPK_township] PRIMARY KEY CLUSTERED ([township_code] ASC, [township_year] ASC)
);


GO

