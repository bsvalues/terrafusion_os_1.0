CREATE TABLE [dbo].[sales_comp_land_load] (
    [lPacsUserID]           INT           NOT NULL,
    [bAbstractSubdivision]  BIT           NOT NULL,
    [bStateCode]            BIT           NOT NULL,
    [bNeighborhood]         BIT           NOT NULL,
    [bRegion]               BIT           NOT NULL,
    [bSubset]               BIT           NOT NULL,
    [bMapID]                BIT           NOT NULL,
    [bRoadAccess]           BIT           NOT NULL,
    [bZoning]               BIT           NOT NULL,
    [bSubMarket]            BIT           NOT NULL,
    [bPropertyUse]          BIT           NOT NULL,
    [bVisibilityAccess]     BIT           NOT NULL,
    [bSchool]               BIT           NOT NULL,
    [bCity]                 BIT           NOT NULL,
    [bUtilities]            BIT           NOT NULL,
    [bTopography]           BIT           NOT NULL,
    [bLandType]             BIT           NOT NULL,
    [bSquareFeet]           BIT           NOT NULL,
    [lSquareFeet]           INT           NULL,
    [bAcres]                BIT           NOT NULL,
    [lAcres]                INT           NULL,
    [bUseableSquareFeet]    BIT           NOT NULL,
    [lUseableSquareFeet]    INT           NULL,
    [bUseableAcres]         BIT           NOT NULL,
    [lUseableAcres]         INT           NULL,
    [bLandUnitPrice]        BIT           NOT NULL,
    [lLandUnitPrice]        INT           NULL,
    [szSaleType]            VARCHAR (255) NULL,
    [szSaleRatioCode]       VARCHAR (255) NULL,
    [dtSaleDateFrom]        DATETIME      NULL,
    [dtSaleDateTo]          DATETIME      NULL,
    [secondary_use]         BIT           NULL,
    [primary_zoning]        BIT           NULL,
    [secondary_zoning]      BIT           NULL,
    [import_view]           BIT           NULL,
    [tax_area_code]         BIT           NULL,
    [cycle]                 BIT           NULL,
    [land_size_ff]          BIT           NULL,
    [land_size_ff_dev]      INT           NULL,
    [county_ratio_codes]    VARCHAR (255) NULL,
    [additional_sale_codes] VARCHAR (255) NULL,
    [bMultiSaleExclude]     BIT           NULL,
    [bMultiSaleInclude]     BIT           NULL,
    [bSaleDateRange]        BIT           NULL,
    CONSTRAINT [CPK_sales_comp_land_load] PRIMARY KEY CLUSTERED ([lPacsUserID] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_sales_comp_land_load_delete_insert_update_MemTable
on sales_comp_land_load
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
where szTableName = 'sales_comp_land_load'

GO

