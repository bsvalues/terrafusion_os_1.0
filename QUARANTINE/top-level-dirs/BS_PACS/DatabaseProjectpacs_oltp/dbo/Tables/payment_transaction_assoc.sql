CREATE TABLE [dbo].[payment_transaction_assoc] (
    [payment_id]            INT             NOT NULL,
    [transaction_id]        INT             NOT NULL,
    [voided]                BIT             NULL,
    [void_transaction_id]   INT             NULL,
    [year]                  NUMERIC (4)     NULL,
    [sup_num]               INT             NULL,
    [prop_id]               INT             NULL,
    [receipt_owner_id]      INT             NULL,
    [receipt_legal_acreage] NUMERIC (14, 4) NULL,
    [receipt_legal_desc]    VARCHAR (255)   NULL,
    [payment_due_id]        INT             NULL,
    [payment_due_date]      DATETIME        NULL,
    [treasurer_rcpt_number] INT             NULL,
    [item_paid_owner_id]    INT             NULL,
    CONSTRAINT [CPK_payment_transaction_assoc] PRIMARY KEY CLUSTERED ([payment_id] ASC, [transaction_id] ASC),
    CONSTRAINT [CFK_payment_transaction_assoc_payment_id] FOREIGN KEY ([payment_id]) REFERENCES [dbo].[payment] ([payment_id]),
    CONSTRAINT [CFK_payment_transaction_assoc_transaction_id] FOREIGN KEY ([transaction_id]) REFERENCES [dbo].[coll_transaction] ([transaction_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[payment_transaction_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_transaction_id]
    ON [dbo].[payment_transaction_assoc]([transaction_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_void_transaction_id]
    ON [dbo].[payment_transaction_assoc]([void_transaction_id] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_payment_transaction_assoc_update_MostRecentActivity
on payment_transaction_assoc
for update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

if ( not update(voided) )
begin
	return
end

set nocount on

	declare
		@trans_group_id int,
		@transaction_id int

	declare @mrtransid int
	
	declare curPTARows cursor
	for
		select i.transaction_id
		from inserted as i
		join deleted as d on
			i.payment_id = d.payment_id and
			i.transaction_id = d.transaction_id
		where
			isnull(d.voided, 0) = 0 and
			isnull(i.voided, 0) = 1
	for read only

	open curPTARows
	fetch next from curPTARows into @transaction_id
	
	while ( @@fetch_status = 0 )
	begin
		set @trans_group_id = null
		select @trans_group_id = trans_group_id
		from coll_transaction
		where transaction_id = @transaction_id

		set @mrtransid = null
		select @mrtransid = max(ct.transaction_id)
		from coll_transaction as ct
		join payment_transaction_assoc as pta on
			pta.transaction_id = ct.transaction_id and
			isnull(pta.voided, 0) = 0
		where
			ct.trans_group_id = @trans_group_id and
			ct.transaction_id <> @transaction_id
		
		update trans_group
		set mrtransid_pay = @mrtransid
		where trans_group_id = @trans_group_id
		
		fetch next from curPTARows into @transaction_id
	end
	
	close curPTARows
	deallocate curPTARows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Set to a unique identifier when a MISC RCPT type fee has been paid', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payment_transaction_assoc', @level2type = N'COLUMN', @level2name = N'treasurer_rcpt_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The owner of the item that was paid at the time of payment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payment_transaction_assoc', @level2type = N'COLUMN', @level2name = N'item_paid_owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The payment_due payment_id associated with the payment transaction', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payment_transaction_assoc', @level2type = N'COLUMN', @level2name = N'payment_due_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The payment_due due_date associated with the payment transaction', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payment_transaction_assoc', @level2type = N'COLUMN', @level2name = N'payment_due_date';


GO

