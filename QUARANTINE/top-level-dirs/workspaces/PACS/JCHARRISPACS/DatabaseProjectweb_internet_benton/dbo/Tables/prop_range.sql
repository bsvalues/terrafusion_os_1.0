CREATE TABLE [dbo].[prop_range] (
    [range_code]   VARCHAR (20) NOT NULL,
    [range_year]   NUMERIC (4)  NOT NULL,
    [range_desc]   VARCHAR (60) NOT NULL,
    [created_date] DATETIME     NULL,
    CONSTRAINT [CPK_prop_range] PRIMARY KEY CLUSTERED ([range_code] ASC, [range_year] ASC)
);


GO

