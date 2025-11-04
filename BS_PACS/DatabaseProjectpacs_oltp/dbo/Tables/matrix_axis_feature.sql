CREATE TABLE [dbo].[matrix_axis_feature] (
    [lYear]        NUMERIC (4)  NOT NULL,
    [szAxisCd]     VARCHAR (20) NOT NULL,
    [lAttributeID] INT          NOT NULL,
    CONSTRAINT [CPK_matrix_axis_feature] PRIMARY KEY CLUSTERED ([lYear] ASC, [szAxisCd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_matrix_axis_feature_lAttributeID] FOREIGN KEY ([lAttributeID]) REFERENCES [dbo].[attribute] ([imprv_attr_id]) ON DELETE CASCADE,
    CONSTRAINT [CUQ_matrix_axis_feature_lYear_lAttributeID] UNIQUE NONCLUSTERED ([lYear] ASC, [lAttributeID] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_matrix_axis_feature_delete_insert_update_MemTable
on matrix_axis_feature
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
where szTableName = 'matrix_axis_feature'

GO

