CREATE TABLE [dbo].[exmpt_qualify_code] (
    [year]           NUMERIC (4)    NOT NULL,
    [exemption_code] VARCHAR (10)   NOT NULL,
    [exempt_type_cd] VARCHAR (10)   NOT NULL,
    [exemption_desc] VARCHAR (25)   NOT NULL,
    [income_min]     INT            NULL,
    [income_max]     INT            NULL,
    [percentage]     NUMERIC (5, 4) NULL,
    [exempt_min]     INT            NULL,
    [exempt_max]     INT            NULL,
    [excess_levy]    VARCHAR (5)    NULL,
    CONSTRAINT [CPK_exmpt_qualify_code] PRIMARY KEY CLUSTERED ([year] ASC, [exemption_code] ASC, [exempt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_exmpt_qualify_code_delete_insert_update_MemTable
on exmpt_qualify_code
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
where szTableName = 'exmpt_qualify_code'

GO

