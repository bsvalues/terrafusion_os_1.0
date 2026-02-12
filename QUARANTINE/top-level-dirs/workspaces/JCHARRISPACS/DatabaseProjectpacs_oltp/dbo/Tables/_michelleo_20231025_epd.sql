CREATE TABLE [dbo].[_michelleo_20231025_epd] (
    [escrow_id]         INT             NOT NULL,
    [escrow_payment_id] INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [amount_due]        NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    [due_date]          DATETIME        NULL
);


GO

