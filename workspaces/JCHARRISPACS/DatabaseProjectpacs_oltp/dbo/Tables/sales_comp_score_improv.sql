CREATE TABLE [dbo].[sales_comp_score_improv] (
    [lPacsUserID]    INT NOT NULL,
    [lSchool]        INT NOT NULL,
    [lCity]          INT NOT NULL,
    [lSitus]         INT NOT NULL,
    [lNeighborhood]  INT NOT NULL,
    [lAbsSubdv]      INT NOT NULL,
    [lState]         INT NOT NULL,
    [lClassCode]     INT NOT NULL,
    [lLivingAreaMax] INT NOT NULL,
    [lLivingAreaDec] INT NOT NULL,
    [lLivingAreaPer] INT NOT NULL,
    [lYearBuiltMax]  INT NOT NULL,
    [lYearBuiltDec]  INT NOT NULL,
    [lYearBuiltPer]  INT NOT NULL,
    [lConditionCode] INT CONSTRAINT [CDF_sales_comp_score_improv_lConditionCode] DEFAULT (0) NOT NULL,
    [lSubClassMax]   INT NULL,
    [lSubClassDec]   INT NULL,
    [lSubClassPer]   INT NULL,
    [lTaxArea]       INT NULL,
    [lDistanceMax]   INT NULL,
    [lDistanceDec]   INT NULL,
    [lDistancePer]   INT NULL,
    [lActualYearMax] INT NULL,
    [lActualYearDec] INT NULL,
    [lActualYearPer] INT NULL,
    [lSaleMonthsMax] INT NULL,
    [lSaleMonthsDec] INT NULL,
    [lSaleMonthsPer] INT NULL,
    CONSTRAINT [CPK_sales_comp_score_improv] PRIMARY KEY CLUSTERED ([lPacsUserID] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_sales_comp_score_improv_delete_insert_update_MemTable
on sales_comp_score_improv
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
where szTableName = 'sales_comp_score_improv'

GO

