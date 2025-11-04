CREATE TABLE [dbo].[fee] (
    [fee_id]                 INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [fee_type_cd]            VARCHAR (10)    NULL,
    [owner_id]               INT             NULL,
    [statement_id]           INT             NULL,
    [initial_amount_due]     NUMERIC (14, 2) NULL,
    [current_amount_due]     NUMERIC (14, 2) NULL,
    [amount_paid]            NUMERIC (14, 2) CONSTRAINT [CDF_fee_amount_paid] DEFAULT ((0)) NOT NULL,
    [amount_due_override]    BIT             NULL,
    [effective_due_date]     DATETIME        NULL,
    [comment]                VARCHAR (255)   NULL,
    [fee_create_date]        DATETIME        NULL,
    [last_modified]          DATETIME        NULL,
    [code]                   VARCHAR (10)    NULL,
    [payment_status_type_cd] VARCHAR (10)    NULL,
    [payout_agreement_id]    INT             NULL,
    [sup_num]                INT             NULL,
    [rollback_id]            INT             NULL,
    [is_active]              BIT             CONSTRAINT [CDF_fee_is_active] DEFAULT ((0)) NOT NULL,
    [payment_group_id]       INT             NULL,
    [display_year]           AS              ([year]+(1)),
    [cnv_xref]               VARCHAR (50)    NULL,
    [is_overpaid]            AS              (case when isnull([current_amount_due],(0))<isnull([amount_paid],(0)) then CONVERT([bit],(1),(0)) else CONVERT([bit],(0),(0)) end) PERSISTED NOT NULL,
    [misc_rcpt_cd]           VARCHAR (10)    NULL,
    CONSTRAINT [CPK_fee] PRIMARY KEY CLUSTERED ([fee_id] ASC),
    CONSTRAINT [CFK_fee_code] FOREIGN KEY ([code]) REFERENCES [dbo].[bill_fee_code] ([bill_fee_cd]),
    CONSTRAINT [CFK_fee_fee_id] FOREIGN KEY ([fee_id]) REFERENCES [dbo].[trans_group] ([trans_group_id]),
    CONSTRAINT [CFK_fee_fee_type_cd] FOREIGN KEY ([fee_type_cd]) REFERENCES [dbo].[fee_type] ([fee_type_cd]),
    CONSTRAINT [CFK_fee_payment_status_type_cd] FOREIGN KEY ([payment_status_type_cd]) REFERENCES [dbo].[payment_status_type] ([payment_status_type_cd]),
    CONSTRAINT [CFK_fee_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_payout_agreement_id]
    ON [dbo].[fee]([payout_agreement_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_year_statement_id]
    ON [dbo].[fee]([year] ASC, [statement_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_payment_group_id]
    ON [dbo].[fee]([payment_group_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_fee_owner_id]
    ON [dbo].[fee]([owner_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_rollback_id]
    ON [dbo].[fee]([rollback_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The MR Template code of the template used to create line items for a miscellaneous receipt fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee', @level2type = N'COLUMN', @level2name = N'misc_rcpt_cd';


GO

