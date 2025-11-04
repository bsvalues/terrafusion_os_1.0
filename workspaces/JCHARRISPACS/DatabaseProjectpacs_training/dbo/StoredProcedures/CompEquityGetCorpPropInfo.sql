

create procedure CompEquityGetCorpPropInfo
	@prop_id int,
	@year numeric(4,0),
	@bOutputRS bit = 1,
	@geo_id varchar(50) = null output,
	@situs varchar(512) = null output,
	@neighborhood varchar(10) = null output,
	@eff_yr_blt numeric(4,0) = null output,
	@subset varchar(10) = null output,
	@property_use_cd varchar(10) = null output,
	@mapsco varchar(20) = null output,
	@dba_name varchar(50) = null output,
	@income_id int = null output,
	@IND numeric(14,0) = null output,
	@income_value numeric(14,0) = null output,
	@lu_cost numeric(14,0) = null output,
	@land numeric(14,0) = null output,
	@PERS numeric(14,0) = null output,
	@land_value numeric(14,0) = null output,
	@land_sqft numeric(18,2) = null output,
	@NRA numeric(14,0) = null output,
	@value_method varchar(5) = null output,
	@NOIRSF numeric(14,2) = null output,
	@CAPR numeric(5,2) = null output,
	@entities varchar(250) = null output,
	@imprv_value numeric(14,0) = null output,
	@image_path varchar(255) = null output
as

set nocount on

declare @sup_num int

select @sup_num = sup_num
from prop_supp_assoc with(nolock)
where
	prop_id = @prop_id and
	owner_tax_yr = @year


select
	@geo_id = rtrim(isnull(p.geo_id, '')),
	@situs = rtrim(isnull(s.situs_num, '')) + ' ' + rtrim(isnull(s.situs_street_prefx, '')) + ' ' + rtrim(isnull(s.situs_street, '')) + ' ' + rtrim(isnull(s.situs_street_sufix, '')),
	@neighborhood = rtrim(isnull(pp.neighborhood, '')),
	@eff_yr_blt = isnull(pp.eff_yr_blt, isnull(pp.yr_blt, 0)),
	@subset = isnull(pp.subset, ''),
	@property_use_cd = isnull(pp.property_use_cd, ''),
	@mapsco = isnull(pv.mapsco, ''),
	@dba_name = isnull(p.dba_name, ''),
	@income_id = isnull(ipv.income_id, -1),
	@value_method = isnull(ipv.value_method, ''),
	@IND = isnull(ipv.IND, 0),
	@income_value = isnull(ipv.income_value, 0),
	@lu_cost = isnull(ipv.lu_cost, 0),
	@land = isnull(ipv.land, 0),
	@PERS = isnull(ipv.PERS, 0),
	@NRA = isnull(ipv.NRA, 0),
	@land_sqft = isnull(pp.land_sqft, isnull(pp.land_acres, 0) * 43560),
	@land_value = isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) + isnull(pv.ag_market, 0) + isnull(pv.timber_market, 0),
	@NOIRSF = isnull(ipv.NOIRSF, 0),
	@CAPR = isnull(ipv.CAPR, 0),
	@imprv_value = isnull(pv.imprv_hstd_val, 0) + isnull(pv.imprv_non_hstd_val, 0),
	@image_path = isnull(pv.image_path,'')
from
	property_profile as pp with(nolock)
inner join
	prop_supp_assoc as psa with(nolock)
on
	pp.prop_id = psa.prop_id
and	pp.prop_val_yr = psa.owner_tax_yr
and	pp.sup_num = psa.sup_num

inner join
	property_val as pv with(nolock)
on
	psa.prop_id = pv.prop_id
and	psa.owner_tax_yr = pv.prop_val_yr
and	psa.sup_num = pv.sup_num
inner join
	property as p with(nolock)
on
	psa.prop_id = p.prop_id
left outer join
	situs as s with(nolock)
on
	pp.prop_id = s.prop_id
and	s.primary_situs = 'Y'
left outer join
	income_prop_vw as ipv with(nolock)
on
	pv.prop_id = ipv.prop_id
and	pv.prop_val_yr = ipv.prop_val_yr
and	psa.sup_num = ipv.sup_num
and	isnull(ipv.active_valuation, 'F') = 'T'
where
	pp.prop_id = @prop_id
and	pp.prop_val_yr = @year
and	pp.sup_num = @sup_num

set @entities = ''
exec GetEntities 'X', @prop_id, @sup_num, @year, @entities output


if @bOutputRS = 1
begin
	select
		geo_id = @geo_id,
		situs = @situs,
		neighborhood = @neighborhood,
		eff_yr_blt = @eff_yr_blt,
		subset = @subset,
		property_use_cd = @property_use_cd,
		mapsco = @mapsco,
		dba_name = @dba_name,
		income_id = @income_id,
		value_method = @value_method,
		IND = @IND,
		income_value = @income_value,
		lu_cost = @lu_cost,
		land = @land,
		PERS = @PERS,
		NRA = @NRA,
		land_sqft = @land_sqft,
		land_value = @land_value,
		NOIRSF = @NOIRSF,
		CAPR = @CAPR,
		imprv_value = @imprv_value,
		entities = @entities,
		image_path = @image_path
end


set nocount off

GO

