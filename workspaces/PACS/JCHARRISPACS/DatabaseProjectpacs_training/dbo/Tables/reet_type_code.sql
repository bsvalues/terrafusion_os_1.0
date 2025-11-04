CREATE TABLE [dbo].[reet_type_code] (
    [reet_type_cd]   VARCHAR (12) NOT NULL,
    [reet_type_desc] VARCHAR (50) NOT NULL,
    [taxable]        BIT          NOT NULL,
    [mobile_home]    BIT          CONSTRAINT [CDF_reet_type_code_mobile_home] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_reet_type_code] PRIMARY KEY CLUSTERED ([reet_type_cd] ASC)
);


GO


create trigger tr_reet_type_code_delete_insert_update_MemTable
on reet_type_code
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
where szTableName = 'reet_type_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mobile Home Affidavits', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_type_code', @level2type = N'COLUMN', @level2name = N'mobile_home';


GO

