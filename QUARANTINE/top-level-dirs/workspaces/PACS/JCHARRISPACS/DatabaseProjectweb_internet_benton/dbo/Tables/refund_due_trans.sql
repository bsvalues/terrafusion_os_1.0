CREATE TABLE [dbo].[refund_due_trans] (
    [transaction_id]   INT             NOT NULL,
    [batch_id]         INT             NOT NULL,
    [bill_id]          INT             NOT NULL,
    [mno_amt]          NUMERIC (14, 2) NULL,
    [ins_amt]          NUMERIC (14, 2) NULL,
    [penalty_mno_amt]  NUMERIC (14, 2) NULL,
    [penalty_ins_amt]  NUMERIC (14, 2) NULL,
    [interest_mno_amt] NUMERIC (14, 2) NULL,
    [interest_ins_amt] NUMERIC (14, 2) NULL,
    [atty_fee_amt]     NUMERIC (14, 2) NULL,
    [payment_trans_id] INT             NULL,
    [adjust_id]        INT             NULL,
    [discount_mno_amt] NUMERIC (14, 2) NULL,
    [discount_ins_amt] NUMERIC (14, 2) NULL,
    [underage_mno_amt] NUMERIC (14, 2) NULL,
    [underage_ins_amt] NUMERIC (14, 2) NULL,
    [overage_mno_amt]  NUMERIC (14, 2) NULL,
    [overage_ins_amt]  NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_refund_due_trans] PRIMARY KEY CLUSTERED ([transaction_id] ASC, [batch_id] ASC, [bill_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [IX_refund_due_trans]
    ON [dbo].[refund_due_trans]([bill_id] ASC);


GO

