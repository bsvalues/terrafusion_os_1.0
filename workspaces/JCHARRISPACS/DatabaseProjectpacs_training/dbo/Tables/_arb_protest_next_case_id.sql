CREATE TABLE [dbo].[_arb_protest_next_case_id] (
    [arb_protest_year]         NUMERIC (4) NOT NULL,
    [arb_protest_next_case_id] INT         NOT NULL,
    CONSTRAINT [CPK__arb_protest_next_case_id] PRIMARY KEY CLUSTERED ([arb_protest_year] ASC) WITH (FILLFACTOR = 100)
);


GO

