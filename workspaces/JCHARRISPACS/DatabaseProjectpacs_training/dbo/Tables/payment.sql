CREATE TABLE [dbo].[payment] (
    [payment_id]         INT             NOT NULL,
    [pacs_user_id]       INT             NULL,
    [payment_source_id]  INT             NULL,
    [batch_id]           INT             NULL,
    [cash_drawer_id]     INT             NULL,
    [payee_id]           INT             NULL,
    [payee_name]         VARCHAR (70)    NULL,
    [payment_code]       CHAR (5)        NULL,
    [amount_due]         NUMERIC (14, 2) NULL,
    [amount_paid]        NUMERIC (14, 2) NULL,
    [paid_under_protest] BIT             NULL,
    [bill_address1]      VARCHAR (60)    NULL,
    [bill_address2]      VARCHAR (60)    NULL,
    [bill_address3]      VARCHAR (60)    NULL,
    [bill_city]          VARCHAR (50)    NULL,
    [bill_state]         VARCHAR (50)    NULL,
    [bill_zip]           VARCHAR (20)    NULL,
    [post_date]          DATETIME        NULL,
    [date_paid]          DATETIME        NULL,
    [receipt_num]        INT             NULL,
    [receipt_secondary]  VARCHAR (20)    NULL,
    [apply_escrow_id]    INT             NULL,
    [apply_credit_id]    INT             NULL,
    [voided]             BIT             NULL,
    [void_date]          DATETIME        NULL,
    [void_by_id]         INT             NULL,
    [void_reason]        VARCHAR (255)   NULL,
    [void_batch_id]      INT             NULL,
    [orig_payment_id]    INT             NULL,
    CONSTRAINT [CPK_payment] PRIMARY KEY CLUSTERED ([payment_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_payment_cash_drawer_id] FOREIGN KEY ([cash_drawer_id]) REFERENCES [dbo].[cash_drawer] ([drawer_id]),
    CONSTRAINT [CFK_payment_payment_source_id] FOREIGN KEY ([payment_source_id]) REFERENCES [dbo].[payment_source] ([payment_source_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_payment_payee_id]
    ON [dbo].[payment]([payee_id] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_payment_delete_insert_update_MemTable
on payment
for delete, insert, update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

set nocount on

update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'payment'

GO

