CREATE TABLE [dbo].[installment_agreement_bill_assoc] (
    [ia_id]   INT NOT NULL,
    [bill_id] INT NOT NULL,
    CONSTRAINT [CPK_installment_agreement_bill_assoc] PRIMARY KEY CLUSTERED ([ia_id] ASC, [bill_id] ASC) WITH (FILLFACTOR = 100)
);


GO

