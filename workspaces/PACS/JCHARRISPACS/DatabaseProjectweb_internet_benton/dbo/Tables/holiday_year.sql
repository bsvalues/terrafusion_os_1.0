CREATE TABLE [dbo].[holiday_year] (
    [holiday_id] INT         IDENTITY (1, 1) NOT NULL,
    [holiday_yr] NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_holiday_year] PRIMARY KEY CLUSTERED ([holiday_id] ASC)
);


GO

