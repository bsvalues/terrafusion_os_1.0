CREATE TABLE [dbo].[comp_sales_display_grid_fields] (
    [lFieldID]          INT          IDENTITY (0, 1) NOT NULL,
    [szFieldName]       VARCHAR (64) NOT NULL,
    [cAdjustment]       CHAR (1)     CONSTRAINT [CDF_comp_sales_display_grid_fields_cAdjustment] DEFAULT ('F') NOT NULL,
    [cResidentialField] CHAR (1)     NOT NULL,
    [cCorpField]        CHAR (1)     NOT NULL,
    [cLandField]        CHAR (1)     NOT NULL,
    [cCIField]          CHAR (1)     NOT NULL,
    CONSTRAINT [CPK_comp_sales_display_grid_fields] PRIMARY KEY CLUSTERED ([lFieldID] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_cAdjustment]
    ON [dbo].[comp_sales_display_grid_fields]([cAdjustment] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_comp_sales_display_grid_fields_delete_insert_update_MemTable
on comp_sales_display_grid_fields
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
where szTableName = 'comp_sales_display_grid_fields'

GO

