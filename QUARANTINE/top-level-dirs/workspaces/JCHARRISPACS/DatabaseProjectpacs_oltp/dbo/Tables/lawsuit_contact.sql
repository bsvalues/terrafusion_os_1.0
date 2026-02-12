CREATE TABLE [dbo].[lawsuit_contact] (
    [lawsuit_id]             INT           NOT NULL,
    [contact_id]             INT           IDENTITY (100000, 1) NOT NULL,
    [contact_type_cd]        VARCHAR (10)  NOT NULL,
    [acct_id]                INT           NULL,
    [contact_name]           VARCHAR (70)  NULL,
    [contact_email]          VARCHAR (64)  NULL,
    [contact_addr1]          VARCHAR (70)  NULL,
    [contact_addr2]          VARCHAR (70)  NULL,
    [contact_city]           VARCHAR (70)  NULL,
    [contact_state]          VARCHAR (2)   NULL,
    [contact_zip]            VARCHAR (10)  NULL,
    [contact_url]            VARCHAR (255) NULL,
    [contact_phone_business] VARCHAR (20)  NULL,
    [contact_phone_home]     VARCHAR (20)  NULL,
    [contact_phone_cell]     VARCHAR (20)  NULL,
    [contact_phone_pager]    VARCHAR (20)  NULL,
    [contact_phone_fax]      VARCHAR (20)  NULL,
    [contact_phone_other]    VARCHAR (20)  NULL,
    CONSTRAINT [CPK_lawsuit_contact] PRIMARY KEY CLUSTERED ([lawsuit_id] ASC, [contact_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_lawsuit_contact_contact_type_cd] FOREIGN KEY ([contact_type_cd]) REFERENCES [dbo].[lawsuit_contact_type] ([contact_cd])
);


GO


create trigger tr_lawsuit_contact_delete_insert_update_MemTable
on lawsuit_contact
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
where szTableName = 'lawsuit_contact'

GO

