CREATE TABLE [dbo].[arb_holiday] (
    [arb_date_cd]   CHAR (1)     NOT NULL,
    [arb_date]      DATETIME     NOT NULL,
    [arb_date_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_arb_holiday] PRIMARY KEY NONCLUSTERED ([arb_date_cd] ASC, [arb_date] ASC) WITH (FILLFACTOR = 90)
);


GO

