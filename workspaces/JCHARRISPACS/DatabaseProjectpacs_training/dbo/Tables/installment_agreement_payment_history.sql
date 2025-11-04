CREATE TABLE [dbo].[installment_agreement_payment_history] (
    [ia_id]          INT             NOT NULL,
    [ia_schedule_id] INT             NOT NULL,
    [payment_id]     INT             NOT NULL,
    [payment_amt]    NUMERIC (14, 2) NOT NULL,
    CONSTRAINT [CPK_installment_agreement_payment_history] PRIMARY KEY CLUSTERED ([ia_id] ASC, [ia_schedule_id] ASC, [payment_id] ASC) WITH (FILLFACTOR = 90)
);


GO

