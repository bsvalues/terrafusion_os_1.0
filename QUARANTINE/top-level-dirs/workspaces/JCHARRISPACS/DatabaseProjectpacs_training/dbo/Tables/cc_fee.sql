CREATE TABLE [dbo].[cc_fee] (
    [cc_type]           VARCHAR (5)     NOT NULL,
    [cc_fee_max]        NUMERIC (14, 2) NOT NULL,
    [cc_fee_percentage] NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_cc_fee] PRIMARY KEY CLUSTERED ([cc_type] ASC, [cc_fee_max] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_cc_fee_cc_type] FOREIGN KEY ([cc_type]) REFERENCES [dbo].[cc_type] ([cc_type])
);


GO


Create trigger [dbo].[tr_cc_fee_delete_insert_update_MemTable]
on [dbo].[cc_fee]
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
where szTableName = 'cc_fee';

GO

