CREATE TABLE [dbo].[buyerseller_letter] (
    [bs_letter_desc] VARCHAR (50) NOT NULL,
    [bs_letter_url]  VARCHAR (50) NULL,
    CONSTRAINT [CPK_buyerseller_letter] PRIMARY KEY CLUSTERED ([bs_letter_desc] ASC) WITH (FILLFACTOR = 90)
);


GO

