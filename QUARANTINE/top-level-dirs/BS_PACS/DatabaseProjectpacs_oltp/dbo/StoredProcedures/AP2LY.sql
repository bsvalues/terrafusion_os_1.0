
CREATE PROCEDURE AP2LY

	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end



SELECT 	
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.market), 1), 1) - 1) as year_before_last_market,
		convert(varchar(20), convert(money, case
							when
								cast(isnull(pp.living_area, 0) as numeric(14,2)) > 0
							then (
								cast(isnull(pv.market, 0) as numeric(14,2)) /
								cast(pp.living_area as numeric(14,2))
							)
							else
								cast(0 as numeric(14,2))
							end, 1)) as year_before_last_market_val_per_sqft,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.assessed_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.assessed_val), 1), 1) - 1) as year_before_last_assessed,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.rendered_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.rendered_val), 1), 1) - 1) as year_before_last_rendered,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_use_val,0) + ISNULL(pv.timber_use,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_use_val,0) + ISNULL(pv.timber_use,0)), 1), 1) - 1) as year_before_last_ag_timber_use,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), 1) - 1) as year_before_last_imprv_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), 1) - 1) as year_before_last_imprv_non_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) as year_before_last_imprv_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), 1) - 1) as year_before_last_living_area,
		convert(varchar(20), convert(money, case
							when
								cast(isnull(pp.living_area, 0) as numeric(14,2)) > 0
							then (
								cast(isnull(pv.imprv_hstd_val, 0) + isnull(pv.imprv_non_hstd_val, 0) as numeric(14,2)) /
								cast(pp.living_area as numeric(14,2))
							)
							else
								cast(isnull(pv.imprv_hstd_val, 0) + isnull(pv.imprv_non_hstd_val, 0) as numeric(14,2))
							end, 1)) as year_before_last_imprv_val_per_sqft,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), 1) - 1) as year_before_last_land_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), 1) - 1) as year_before_last_land_non_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 1) - 1) as year_before_last_land_val,
		case
			when
				isnull(pp.land_sqft, 0) > 0
			then
				cast(pp.land_sqft as varchar(50)) + ' Sq. Ft.'
			when
				isnull(pp.land_acres, 0) > 0
			then
				cast(pp.land_acres as varchar(50)) + ' Acres'
			when
				isnull(pp.land_front_feet, 0) > 0
			then
				cast(pp.land_front_feet as varchar(50)) + ' Front Feet'
			when
				isnull(pp.land_lot, 'F') = 'T'
			then
				'LOT'
			else
				cast(0 as varchar(50))
		end as year_before_last_land_size,
		convert(varchar(20), convert(money, case
							when
								cast(isnull(pp.land_sqft, 0) as numeric(18,2)) > 0
							then (
								cast(isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) as numeric(18,2)) /
								cast(pp.land_sqft as numeric(18,2))
							)
							else
								cast(isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) as numeric(18,2))
							end, 1)) as year_before_last_land_val_per_sqft,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0) + ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0) + ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 1) - 1) as year_before_last_imprv_land_val
        
FROM _arb_protest as ap
WITH (NOLOCK)

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON ap.prop_id = psa.prop_id
AND (ap.prop_val_yr - 2) = psa.owner_tax_yr

INNER JOIN property_val as pv 
WITH (NOLOCK)
ON psa.prop_id = pv.prop_id
AND psa.sup_num = pv.sup_num
AND psa.owner_tax_yr = pv.prop_val_yr

INNER JOIN property_profile as pp
WITH (NOLOCK)
ON pv.prop_id = pp.prop_id
AND pv.prop_val_yr = pp.prop_val_yr

WHERE ap.case_id = @case_id
AND   ap.prop_val_yr = @prop_val_yr

GO

