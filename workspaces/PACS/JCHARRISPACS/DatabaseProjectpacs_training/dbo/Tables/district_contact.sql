CREATE TABLE [dbo].[district_contact] (
    [district_contact_id]          INT          NOT NULL,
    [district_contact_description] VARCHAR (50) NULL,
    CONSTRAINT [CPK_district_contact] PRIMARY KEY CLUSTERED ([district_contact_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_district_contact_district_contact_id] FOREIGN KEY ([district_contact_id]) REFERENCES [dbo].[account] ([acct_id]) ON DELETE CASCADE
);


GO


create trigger tr_district_contact_delete_insert_update_MemTable
on district_contact
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
where szTableName = 'district_contact'

GO

