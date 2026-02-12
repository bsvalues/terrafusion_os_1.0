CREATE TABLE [dbo].[coll_transaction] (
    [transaction_id]     INT             NOT NULL,
    [trans_group_id]     INT             NOT NULL,
    [base_amount]        NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_base_amount] DEFAULT ((0)) NOT NULL,
    [base_amount_pd]     NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_base_amount_pd] DEFAULT ((0)) NOT NULL,
    [penalty_amount_pd]  NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_penalty_amount_pd] DEFAULT ((0)) NOT NULL,
    [interest_amount_pd] NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_interest_amount_pd] DEFAULT ((0)) NOT NULL,
    [bond_interest_pd]   NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_bond_interest_pd] DEFAULT ((0)) NOT NULL,
    [transaction_type]   VARCHAR (25)    NULL,
    [underage_amount_pd] NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_underage_amount_pd] DEFAULT ((0)) NOT NULL,
    [overage_amount_pd]  NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_overage_amount_pd] DEFAULT ((0)) NOT NULL,
    [other_amount_pd]    NUMERIC (14, 2) CONSTRAINT [CDF_coll_transaction_other_amount_pd] DEFAULT ((0)) NOT NULL,
    [pacs_user_id]       INT             NULL,
    [transaction_date]   DATETIME        NULL,
    [batch_id]           INT             NOT NULL,
    [create_date]        DATETIME        CONSTRAINT [CDF_coll_transaction_create_date] DEFAULT (getdate()) NOT NULL,
    CONSTRAINT [CPK_coll_transaction] PRIMARY KEY CLUSTERED ([transaction_id] ASC),
    CONSTRAINT [CFK_coll_transaction_batch_id] FOREIGN KEY ([batch_id]) REFERENCES [dbo].[batch] ([batch_id]),
    CONSTRAINT [CFK_coll_transaction_trans_group_id] FOREIGN KEY ([trans_group_id]) REFERENCES [dbo].[trans_group] ([trans_group_id]),
    CONSTRAINT [CFK_coll_transaction_transaction_type] FOREIGN KEY ([transaction_type]) REFERENCES [dbo].[transaction_type] ([transaction_type])
);


GO

CREATE NONCLUSTERED INDEX [idx_batch_id_transaction_id_trans_group_id]
    ON [dbo].[coll_transaction]([batch_id] ASC, [transaction_id] ASC, [trans_group_id] ASC) WITH (FILLFACTOR = 80);


GO

CREATE NONCLUSTERED INDEX [idx_transaction_create_date]
    ON [dbo].[coll_transaction]([create_date] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_trans_group_id_transaction_date]
    ON [dbo].[coll_transaction]([trans_group_id] ASC, [transaction_date] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_trans_group_id_create_date_transaction_type]
    ON [dbo].[coll_transaction]([trans_group_id] ASC, [create_date] ASC, [transaction_type] ASC)
    INCLUDE([transaction_id]);


GO


create trigger tr_coll_transaction_insert_MostRecentActivity
on coll_transaction
for insert
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

set nocount on

	declare
		@trans_group_id int,
		@transaction_id int,
		@transaction_type varchar(25)
		
	declare curCTRows cursor
	for
		select trans_group_id, transaction_id, transaction_type
		from inserted
	for read only

	open curCTRows
	fetch next from curCTRows into @trans_group_id, @transaction_id, @transaction_type
	
	while ( @@fetch_status = 0 )
	begin
		if ( @transaction_type like 'ADJ%' )
		begin
			update dbo.trans_group
			set mrtransid_adj = @transaction_id
			where trans_group_id = @trans_group_id
		end
		else if ( @transaction_type like 'P%' )
		begin
			update dbo.trans_group
			set mrtransid_pay = @transaction_id
			where trans_group_id = @trans_group_id
		end
		else if ( @transaction_type = 'OC' )
		begin
			update dbo.trans_group
			set mrtransid_opc = @transaction_id
			where trans_group_id = @trans_group_id
		end
		
		fetch next from curCTRows into @trans_group_id, @transaction_id, @transaction_type
	end
	
	close curCTRows
	deallocate curCTRows

GO

