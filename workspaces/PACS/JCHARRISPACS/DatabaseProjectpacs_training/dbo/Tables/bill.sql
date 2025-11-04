CREATE TABLE [dbo].[bill] (
    [bill_id]                  INT             NOT NULL,
    [prop_id]                  INT             NULL,
    [year]                     NUMERIC (4)     NULL,
    [sup_num]                  INT             NULL,
    [owner_id]                 INT             NULL,
    [initial_amount_due]       NUMERIC (14, 2) NULL,
    [current_amount_due]       NUMERIC (14, 2) NULL,
    [amount_paid]              NUMERIC (14, 2) NULL,
    [bill_type]                VARCHAR (5)     NULL,
    [effective_due_date]       DATETIME        NULL,
    [earliest_collection_date] DATETIME        NULL,
    [statement_id]             INT             NULL,
    [code]                     VARCHAR (10)    NULL,
    [is_active]                BIT             CONSTRAINT [CDF_bill_is_active] DEFAULT ((0)) NOT NULL,
    [last_modified]            DATETIME        NULL,
    [adj_effective_dt]         DATETIME        NULL,
    [adj_expiration_dt]        DATETIME        NULL,
    [comment]                  VARCHAR (500)   NULL,
    [payment_status_type_cd]   VARCHAR (10)    NULL,
    [created_by_type_cd]       VARCHAR (10)    NULL,
    [rollback_id]              INT             NULL,
    [payment_group_id]         INT             NULL,
    [display_year]             AS              ([year]+(1)),
    [cnv_xref]                 VARCHAR (50)    NULL,
    [is_overpaid]              AS              (case when isnull([current_amount_due],(0))<isnull([amount_paid],(0)) then CONVERT([bit],(1),0) else CONVERT([bit],(0),0) end) PERSISTED NOT NULL,
    CONSTRAINT [CPK_bill] PRIMARY KEY CLUSTERED ([bill_id] ASC),
    CONSTRAINT [CFK_bill_bill_id] FOREIGN KEY ([bill_id]) REFERENCES [dbo].[trans_group] ([trans_group_id]),
    CONSTRAINT [CFK_bill_code] FOREIGN KEY ([code]) REFERENCES [dbo].[bill_fee_code] ([bill_fee_cd]),
    CONSTRAINT [CFK_bill_payment_status_type_cd] FOREIGN KEY ([payment_status_type_cd]) REFERENCES [dbo].[payment_status_type] ([payment_status_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_bill_owner_id]
    ON [dbo].[bill]([owner_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id_year_effective_due_date_current_amount_due_amount_paid]
    ON [dbo].[bill]([prop_id] ASC, [year] ASC, [effective_due_date] ASC, [current_amount_due] ASC, [amount_paid] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_year_statement_id]
    ON [dbo].[bill]([year] ASC, [statement_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_is_overpaid_prop_id]
    ON [dbo].[bill]([is_overpaid] ASC, [prop_id] ASC)
    INCLUDE([bill_id], [year], [owner_id]);


GO

CREATE NONCLUSTERED INDEX [idx_rollback_id]
    ON [dbo].[bill]([rollback_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_payment_group_id]
    ON [dbo].[bill]([payment_group_id] ASC) WITH (FILLFACTOR = 90);


GO

