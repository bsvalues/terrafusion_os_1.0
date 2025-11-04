

create procedure CompSalesGetLandPropInfo
	@lPropID int,
	@lSaleID int,
	@lYear numeric(4,0),
	@bOutputRS bit = 1
as

set nocount on

declare	@lSupNum int

select	@lSupNum = sup_num
from	prop_supp_assoc with(nolock)
where	prop_id = @lPropID
and	owner_tax_yr = @lYear

if @lSaleID is null
begin
	select	@lSaleID = max(co.chg_of_owner_id)
	from	chg_of_owner_prop_assoc as co with(nolock)
	join	sale as s with(nolock)
	on	co.chg_of_owner_id = s.chg_of_owner_id
	where	co.prop_id = @lPropID
	and	isnull(s.sl_price, 0) > 0
end

declare	@szSaleRatioTypeCode varchar(5)
declare	@szSaleType varchar(5)
declare @szGeoID varchar(50)
declare	@szSitus varchar(512)
declare	@szNeighborhood varchar(10)
declare	@szSchool varchar(5)
declare	@szCity varchar(5)
declare	@szMapsco varchar(20)
declare	@szZoning varchar(50)
declare	@szTopography varchar(50)
declare	@szUtilities varchar(50)
declare @fLandAcres numeric(18,4)
declare @fLandSqFt numeric(18,2)
declare @fUseableAcres numeric(18,4)
declare @fUseableSqFt numeric(18,2)
declare @dtSaleDate datetime
declare @lSalePrice numeric(14, 0)
declare @lSaleAdjustmentAmount numeric(14,0)
declare @fSaleAdjustmentPct numeric(8,4)
declare @szSaleAdjustmentReason varchar(50)
declare @lAdjustedSalePrice numeric(14,0)
declare @lMarket numeric(14,0)
declare @lLandMarketValue numeric(14,0)

select	@szSaleRatioTypeCode = rtrim(isnull(sale.sl_ratio_type_cd, '')),
	@szSaleType = rtrim(isnull(sale.sl_type_cd, '')),
	@szGeoID = rtrim(isnull(p.geo_id, '')),
	@szSitus = rtrim(isnull(s.situs_num, '')) + ' ' + rtrim(isnull(s.situs_street_prefx, '')) + ' ' + rtrim(isnull(s.situs_street, '')) + ' ' + rtrim(isnull(s.situs_street_sufix, '')),
	@szNeighborhood = rtrim(isnull(pp.neighborhood, '')),
	@szSchool = rtrim(isnull(school.entity_cd, '')),
	@szCity = rtrim(isnull(city.entity_cd, '')),
	@szMapsco = rtrim(isnull(pv.mapsco, '')),
	@szZoning = rtrim(isnull(pp.zoning, '')),
	@szTopography = rtrim(isnull(pp.topography, '')),
	@szUtilities = rtrim(isnull(pp.utilities, '')),
	@fLandAcres = isnull(pp.land_acres, 0),
	@fLandSqFt = isnull(pp.land_sqft, 0),
	@fUseableAcres = isnull(pp.land_useable_acres, isnull(pp.land_acres, 0)),
	@fUseableSqFt = isnull(pp.land_useable_sqft, isnull(pp.land_sqft, 0)),
	@dtSaleDate = sale.sl_dt,
	@lSalePrice = isnull(sale.sl_price, 0),
	@lSaleAdjustmentAmount = isnull(sale.sl_adj_sl_amt, 0),
	@fSaleAdjustmentPct = isnull(sale.sl_adj_sl_pct, 0.00),
	@szSaleAdjustmentReason = rtrim(isnull(sale.sl_adj_rsn, '')),
	@lAdjustedSalePrice = isnull(sale.adjusted_sl_price, isnull(sale.sl_price, 0)),
	@lMarket = isnull(pv.market, 0),
	@lLandMarketValue = (isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) + isnull(pv.ag_market, 0) + isnull(timber_market, 0))
from	property_profile as pp with(nolock)
join	property_val as pv with(nolock)
on	pp.prop_id = pv.prop_id
and	pp.prop_val_yr = pv.prop_val_yr
and	pp.sup_num = pv.sup_num
join	property as p with(nolock)
on	pv.prop_id = p.prop_id
left outer join	sale with(nolock)
on	sale.chg_of_owner_id = @lSaleID
left outer join	situs as s with(nolock)
on	pp.prop_id = s.prop_id
and	s.primary_situs = 'Y'
left outer join	entity as school with (nolock)
on	pp.school_id = school.entity_id
left outer join	entity as city with (nolock)
on	pp.city_id = city.entity_id
where	pp.prop_id = @lPropID
and	pp.prop_val_yr = @lYear
and	pp.sup_num = @lSupNum

if ((@fLandAcres = 0) and (@fLandSqFt <> 0))
begin
	set @fLandAcres = (@fLandSqFt / 43560)
end
else if ((@fLandAcres <> 0) and (@fLandSqFt = 0))
begin
	set @fLandSqFt = @fLandAcres * 43560
end

if ((@fUseableAcres = 0) and (@fUseableSqFt <> 0))
begin
	set @fUseableAcres = @fUseableSqFt / 43560
end
else if ((@fUseableAcres <> 0) and (@fUseableSqFt = 0))
begin
	set @fUseableSqFt = @fUseableAcres * 43560
end

if (@bOutputRS = 1)
begin
	select	sale_ratio_code = @szSaleRatioTypeCode,
		sale_type = @szSaleType,
		geo_id = @szGeoID,
		situs = @szSitus,
		neighborhood = @szNeighborhood,
		school = @szSchool,
		city = @szCity,
		mapsco = @szMapsco,
		zoning = @szZoning,
		topography = @szTopography,
		utilities = @szUtilities,
		land_acres = @fLandAcres,
		land_sqft = @fLandSqFt,
		useable_acres = @fUseableAcres,
		useable_sqft = @fUseableSqFt,
		sale_date = @dtSaleDate,
		sale_price = @lSalePrice,
		sale_adjustment_amount = @lSaleAdjustmentAmount,
		sale_adjustment_pct = @fSaleAdjustmentPct,
		sale_adjustment_reason = @szSaleAdjustmentReason,
		adjusted_sale_price = @lAdjustedSalePrice,
		market = @lMarket,
		land_market_value = @lLandMarketValue
end

set nocount off

GO

