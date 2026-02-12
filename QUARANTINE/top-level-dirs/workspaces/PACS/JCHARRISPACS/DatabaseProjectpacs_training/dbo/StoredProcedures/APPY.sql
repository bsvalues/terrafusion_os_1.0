
CREATE PROCEDURE APPY

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


declare @curr_market	varchar(20)
declare @curr_land	varchar(20)
declare @curr_imprv	varchar(20)

declare @prev1_market	varchar(20)
declare @prev1_land	varchar(20)
declare @prev1_imprv	varchar(20)

declare @prev2_market	varchar(20)
declare @prev2_land	varchar(20)
declare @prev2_imprv	varchar(20)

declare @price_per_sqft		numeric(14,2)
declare @curr_price_per_sqft	varchar(20)

SELECT 	
	@curr_market =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), 1) - 1) ,
	@curr_imprv   =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), 1) - 1) ,
	@curr_land  =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), 1) - 1) ,
        @price_per_sqft = convert(numeric(14,2), case when pp.living_area > 0 then pv.market/pp.living_area else 0 end)
FROM _arb_protest as ap
WITH (NOLOCK)

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON ap.prop_id = psa.prop_id
AND ap.prop_val_yr = psa.owner_tax_yr

INNER JOIN property_val as pv 
WITH (NOLOCK)
ON psa.prop_id = pv.prop_id
AND psa.sup_num = pv.sup_num
AND psa.owner_tax_yr  = pv.prop_val_yr

inner join property_profile as pp
on pv.prop_id = pp.prop_id
and   pv.prop_val_yr = pp.prop_val_yr

WHERE ap.case_id = @case_id
AND   ap.prop_val_yr = @prop_val_yr



SELECT 	
	@prev1_market =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), 1) - 1) ,
	@prev1_imprv  =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), 1) - 1) ,
	@prev1_land   =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), 1) - 1)
        
FROM _arb_protest as ap
WITH (NOLOCK)

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON ap.prop_id = psa.prop_id
AND ap.prop_val_yr = psa.owner_tax_yr

INNER JOIN property_val as pv 
WITH (NOLOCK)
ON psa.prop_id = pv.prop_id
AND psa.sup_num = pv.sup_num
AND psa.owner_tax_yr  = pv.prop_val_yr

WHERE ap.case_id = @case_id
AND   ap.prop_val_yr = @prop_val_yr-1


SELECT 	
	@prev2_market =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), 1) - 1) ,
	@prev2_imprv  =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), 1) - 1) ,
	@prev2_land   =	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), 1) - 1) 
        
FROM _arb_protest as ap
WITH (NOLOCK)

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON ap.prop_id = psa.prop_id
AND ap.prop_val_yr = psa.owner_tax_yr

INNER JOIN property_val as pv 
WITH (NOLOCK)
ON psa.prop_id = pv.prop_id
AND psa.sup_num = pv.sup_num
AND psa.owner_tax_yr  = pv.prop_val_yr

WHERE ap.case_id = @case_id
AND   ap.prop_val_yr = @prop_val_yr-2


set @curr_price_per_sqft = convert(varchar(20), @price_per_sqft) 
	

if (@case_id = 0 or @prop_val_yr = 0)
begin
	select top 0 @curr_market as curr_market,
       @curr_imprv  as curr_imprv,
       @curr_land   as curr_land,
       @curr_price_per_sqft as curr_sqft,
       @prev1_market as prev1_market,
       @prev1_imprv  as prev1_imprv,
       @prev1_land   as prev1_land,
       @prev2_market as prev2_market,
       @prev2_imprv  as prev2_imprv,
       @prev2_land   as prev2_land

end
else
begin
	select @curr_market as curr_market,
       @curr_imprv  as curr_imprv,
       @curr_land   as curr_land,
       @curr_price_per_sqft as curr_sqft,
       @prev1_market as prev1_market,
       @prev1_imprv  as prev1_imprv,
       @prev1_land   as prev1_land,
       @prev2_market as prev2_market,
       @prev2_imprv  as prev2_imprv,
       @prev2_land   as prev2_land
end

GO

