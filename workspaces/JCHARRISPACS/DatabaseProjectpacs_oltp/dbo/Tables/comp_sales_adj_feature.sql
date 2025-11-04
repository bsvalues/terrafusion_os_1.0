CREATE TABLE [dbo].[comp_sales_adj_feature] (
    [lYear]          NUMERIC (4)  NOT NULL,
    [szQualityCode]  VARCHAR (10) NOT NULL,
    [lAttributeCode] INT          NOT NULL,
    [lRangeAmount]   INT          NOT NULL,
    [lAdjAmount]     INT          NOT NULL,
    CONSTRAINT [CPK_comp_sales_adj_feature] PRIMARY KEY CLUSTERED ([lYear] ASC, [szQualityCode] ASC, [lAttributeCode] ASC, [lRangeAmount] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_comp_sales_adj_feature_delete_insert_update_MemTable
on comp_sales_adj_feature
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
where szTableName = 'comp_sales_adj_feature'

GO

