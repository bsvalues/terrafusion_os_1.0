CREATE TABLE [dbo].[levy_exemption] (
    [year]            NUMERIC (4)  NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [exmpt_type_cd]   VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_levy_exemption] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_levy_exemption_exmpt_type_cd] FOREIGN KEY ([exmpt_type_cd]) REFERENCES [dbo].[levy_exemption_type] ([levy_exemption_type_cd]),
    CONSTRAINT [CFK_levy_exemption_year_tax_district_id_levy_cd] FOREIGN KEY ([year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd]) ON DELETE CASCADE
);


GO


create trigger tr_levy_exemption_delete_insert_update_MemTable
on levy_exemption
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
where szTableName = 'levy_exemption'

GO

