CREATE TABLE [dbo].[matrix_axis_land_characteristic] (
    [matrix_yr]         NUMERIC (4)  NOT NULL,
    [axis_cd]           VARCHAR (20) NOT NULL,
    [matrix_type]       VARCHAR (20) NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_matrix_axis_land_characteristic] PRIMARY KEY CLUSTERED ([matrix_yr] ASC, [axis_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_matrix_axis_land_characteristic] CHECK ([matrix_type]='L'),
    CONSTRAINT [CFK_matrix_axis_land_characteristic_characteristic_cd] FOREIGN KEY ([characteristic_cd]) REFERENCES [dbo].[characteristic_value_code] ([characteristic_cd]) ON DELETE CASCADE,
    CONSTRAINT [CFK_matrix_axis_land_characteristic_matrix_yr_axis_cd_matrix_type] FOREIGN KEY ([matrix_yr], [axis_cd], [matrix_type]) REFERENCES [dbo].[matrix_axis] ([matrix_yr], [axis_cd], [matrix_type]) ON DELETE CASCADE
);


GO


create trigger tr_matrix_axis_land_characteristic_delete_insert_update_MemTable
on matrix_axis_land_characteristic
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
where szTableName = 'matrix_axis_land_characteristic'

GO

