CREATE TABLE [dbo].[mhm_transporter_code] (
    [transporter_cd]   VARCHAR (10) NOT NULL,
    [transporter_desc] VARCHAR (50) NOT NULL,
    [wutc_permit_num]  VARCHAR (20) NULL,
    [dot_permit_num]   VARCHAR (20) NULL,
    CONSTRAINT [CPK_mhm_transporter_code] PRIMARY KEY CLUSTERED ([transporter_cd] ASC)
);


GO


create trigger tr_mhm_transporter_code_delete_insert_update_MemTable
on mhm_transporter_code
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
where szTableName = 'mhm_transporter_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mobile Home Movement Transporter Codefile', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mhm_transporter_code';


GO

