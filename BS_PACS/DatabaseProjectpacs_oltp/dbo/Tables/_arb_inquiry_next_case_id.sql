CREATE TABLE [dbo].[_arb_inquiry_next_case_id] (
    [arb_inquiry_year]         NUMERIC (4) NOT NULL,
    [arb_inquiry_next_case_id] INT         NOT NULL,
    CONSTRAINT [CPK__arb_inquiry_next_case_id] PRIMARY KEY CLUSTERED ([arb_inquiry_year] ASC) WITH (FILLFACTOR = 100)
);


GO

