CREATE TABLE [dbo].[holiday_schedule] (
    [holiday_id]     INT          NOT NULL,
    [holiday_date]   DATETIME     NOT NULL,
    [holiday_desc]   VARCHAR (40) NOT NULL,
    [holiday_days]   INT          NOT NULL,
    [office_holiday] BIT          NOT NULL,
    [bank_holiday]   BIT          NOT NULL,
    CONSTRAINT [CPK_holiday_schedule] PRIMARY KEY CLUSTERED ([holiday_id] ASC, [holiday_date] ASC)
);


GO

