CREATE TABLE [dbo].[income_unit_type_code] (
    [unit_type_cd]          VARCHAR (10) NOT NULL,
    [unit_type_desc]        VARCHAR (30) NOT NULL,
    [include_in_total_unit] BIT          CONSTRAINT [CDF_income_unit_type_code_include_in_total_unit] DEFAULT ((0)) NULL,
    [multifamily]           BIT          CONSTRAINT [CDF_income_unit_type_code_multifamily] DEFAULT ((0)) NULL,
    [inactive]              BIT          CONSTRAINT [CDF_income_unit_type_code_inactive] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_unit_type_code] PRIMARY KEY CLUSTERED ([unit_type_cd] ASC)
);


GO


create trigger tr_income_unit_type_code_delete_insert_update_MemTable
on income_unit_type_code
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
where szTableName = 'income_unit_type_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether the income unit type code is inactive', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_unit_type_code', @level2type = N'COLUMN', @level2name = N'inactive';


GO

