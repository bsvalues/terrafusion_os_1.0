

create procedure SalesCompSetLandLoadDefaults
as

declare	@dtNow datetime
set @dtNow = getdate()

declare	@szSaleDateFrom varchar(16)
set @szSaleDateFrom = convert(varchar(16), dateadd(dd, -90, @dtNow), 101)

declare	@szSaleDateTo varchar(16)
set @szSaleDateTo = convert(varchar(16), @dtNow, 101)

if not exists
(
select	*
from	sales_comp_land_load
where	lPacsUserID = 0
)
begin
	insert sales_comp_land_load with(rowlock)
	(
	[lPacsUserID],
	[bAbstractSubdivision],
	[bStateCode],
	[bNeighborhood],
	[bRegion],
	[bSubset],
	[bMapID],
	[bRoadAccess],
	[bZoning],
	[bSubMarket],
	[bPropertyUse],
	[bUtilities],
	[bTopography],
	[bVisibilityAccess],
	[bSchool],
	[bCity],
	[bLandType],
	[bSquareFeet],
	[lSquareFeet],
	[bAcres],
	[lAcres],
	[bUseableSquareFeet],
	[lUseableSquareFeet],
	[bUseableAcres],
	[lUseableAcres],
	[bLandUnitPrice],
	[lLandUnitPrice],
	[szSaleType],
	[szSaleRatioCode],
	[dtSaleDateFrom],
	[dtSaleDateTo]
	)
	values
	(
	0,	-- System default UserID
	0,	-- Abstract / Subdivision
	0,	-- State Code
	0,	-- Neighborhood
	0,	-- Region
	0,	-- Subset
	0,	-- Map ID
	0,	-- Road Access
	0,	-- Zoning
	1,	-- SubMarket
	0,	-- Property Use
	0,	-- Utilities
	0,	-- Topography
	0,	-- Visibility Access
	1,	-- School
	1,	-- City
	0,	-- Land Type
	0,	-- Land Square Feet
	80,	-- Land Square Feet deviation
	0,	-- Land Acres
	80,	-- Land Acres deviation
	0,	-- Land UseableSquare Feet
	80,	-- Land Useable Square Feet deviation
	0,	-- Land Useable Acres
	80,	-- Land Useable Square Feet deviation
	0,	-- Land Unit Price
	25,	-- Land Unit Price deviation
	'Q, QM',-- Sale Type
	null,	-- Sale Ratio Code,
	@szSaleDateFrom,
	@szSaleDateTo
	)
end

GO

