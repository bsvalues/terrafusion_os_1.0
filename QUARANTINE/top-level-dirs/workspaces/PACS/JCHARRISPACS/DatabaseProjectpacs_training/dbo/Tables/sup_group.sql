CREATE TABLE [dbo].[sup_group] (
    [sup_group_id]            INT           NOT NULL,
    [sup_group_desc]          VARCHAR (50)  NULL,
    [sup_create_dt]           DATETIME      NULL,
    [sup_arb_ready_dt]        DATETIME      NULL,
    [sup_accept_dt]           DATETIME      NULL,
    [sup_bill_create_dt]      DATETIME      NULL,
    [status_cd]               CHAR (5)      NULL,
    [sup_accept_by_id]        INT           NULL,
    [sup_bills_created_by_id] INT           NULL,
    [sup_group_comment]       VARCHAR (255) NULL,
    [sup_bill_status]         VARCHAR (5)   NULL,
    [sup_bills_batch_id]      INT           NULL,
    CONSTRAINT [CPK_sup_group] PRIMARY KEY CLUSTERED ([sup_group_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sup_group_status_cd] FOREIGN KEY ([status_cd]) REFERENCES [dbo].[supp_status] ([status_cd])
);


GO



create trigger tr_sup_group_delete_insert_update_MemTable
on sup_group
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
where szTableName = 'sup_group'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The batch id used to create and activate the bills', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sup_group', @level2type = N'COLUMN', @level2name = N'sup_bills_batch_id';


GO

