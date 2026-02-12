CREATE TABLE [dbo].[payment_trans] (
    [transaction_id]      INT             NOT NULL,
    [payment_id]          INT             NOT NULL,
    [prop_id]             INT             NULL,
    [bill_id]             INT             NULL,
    [fee_id]              INT             NULL,
    [trans_type]          VARCHAR (5)     NULL,
    [fee_amt]             NUMERIC (14, 2) NULL,
    [mno_amt]             NUMERIC (14, 2) NULL,
    [ins_amt]             NUMERIC (14, 2) NULL,
    [penalty_mno_amt]     NUMERIC (14, 2) NULL,
    [penalty_ins_amt]     NUMERIC (14, 2) NULL,
    [interest_mno_amt]    NUMERIC (14, 2) NULL,
    [interest_ins_amt]    NUMERIC (14, 2) NULL,
    [attorney_fee_amt]    NUMERIC (14, 2) NULL,
    [q1_amt]              NUMERIC (14, 2) NULL,
    [q2_amt]              NUMERIC (14, 2) NULL,
    [q3_amt]              NUMERIC (14, 2) NULL,
    [q4_amt]              NUMERIC (14, 2) NULL,
    [mno_due]             NUMERIC (14, 2) NULL,
    [ins_due]             NUMERIC (14, 2) NULL,
    [penalty]             NUMERIC (14, 2) NULL,
    [interest]            NUMERIC (14, 2) NULL,
    [attorney_fee]        NUMERIC (14, 2) NULL,
    [fee_due]             NUMERIC (14, 2) NULL,
    [fiscal_year]         VARCHAR (10)    NULL,
    [fiscal_month]        INT             NULL,
    [fiscal_entity_id]    INT             NULL,
    [discount_mno_amt]    NUMERIC (14, 2) NULL,
    [discount_ins_amt]    NUMERIC (14, 2) NULL,
    [underage_mno_amt]    NUMERIC (14, 2) NULL,
    [underage_ins_amt]    NUMERIC (14, 2) NULL,
    [overage_mno_amt]     NUMERIC (14, 2) NULL,
    [overage_ins_amt]     NUMERIC (14, 2) NULL,
    [refund_mno_amt]      NUMERIC (14, 2) NULL,
    [refund_ins_amt]      NUMERIC (14, 2) NULL,
    [void_trans]          CHAR (1)        NULL,
    [void_date]           DATETIME        NULL,
    [void_by_id]          INT             NULL,
    [void_reason]         VARCHAR (255)   NULL,
    [void_batch_id]       INT             NULL,
    [prev_transaction_id] INT             NULL,
    [prev_payment_id]     INT             NULL,
    CONSTRAINT [CPK_payment_trans] PRIMARY KEY CLUSTERED ([transaction_id] ASC, [payment_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [IX_payment_trans_prop_id]
    ON [dbo].[payment_trans]([prop_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_payment_trans_payment_id]
    ON [dbo].[payment_trans]([payment_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_payment_trans_bill_id]
    ON [dbo].[payment_trans]([bill_id] ASC);


GO

