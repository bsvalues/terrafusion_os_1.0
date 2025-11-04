
CREATE PROCEDURE APCS

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

declare @sup_num		int
declare @prop_id 		int
declare @entities 		varchar(200)
declare @exemptions		varchar(200)
declare @last_yr_land_val	varchar(20)
declare @last_yr_imprv_val	varchar(20)
declare @last_yr_market		varchar(20)

SELECT @prop_id = prop_id
FROM _arb_protest as ap
WITH (NOLOCK)
WHERE ap.case_id = @case_id
AND ap.prop_val_yr = @prop_val_yr

SELECT @sup_num = sup_num
FROM prop_supp_assoc WITH (NOLOCK)
WHERE prop_id = @prop_id
	AND owner_tax_yr = @prop_val_yr

SET @entities = ''
SET @exemptions = ''

SELECT @entities 	= dbo.fn_GetEntities(@prop_id, @prop_val_yr, @sup_num)
SELECT @exemptions 	= dbo.fn_GetExemptions(@prop_id, @prop_val_yr, @sup_num)

SELECT
	@last_yr_market 	= LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), 1) - 1) ,
	@last_yr_imprv_val 	= LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), 1) - 1) ,
	@last_yr_land_val 	= LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), 1) - 1)

FROM _arb_protest as ap
WITH (NOLOCK)

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON ap.prop_id = psa.prop_id
	AND (ap.prop_val_yr - 1) = psa.owner_tax_yr

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

SELECT DISTINCT
	pv.prop_id,
	pv.prop_val_yr,
	@entities as entities,
	@exemptions as exemptions,
	pv.legal_desc,
	s.situs_display as situs,
	aaa.acct_id as agent_id,
	p.geo_id,
	ao.file_as_name as owner_name,
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
	end as land_size,
	appba.prot_by_id,
	appbapp.prot_by_id as primary_prot_by_id,
	ap.prot_taxpayer_comments,
	LEFT(CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), 1) - 1) as living_area,
	CONVERT(CHAR(11),ap.appraiser_meeting_date_time,101)   as appraiser_meeting_date,
	SUBSTRING(CONVERT(CHAR(19),ap.appraiser_meeting_date_time,100),13,19) as appraiser_meeting_time,
	convert(varchar(10),docket.docket_start_date_time, 101)  as docket_date,
	ltrim(right(convert(varchar(20), docket_start_date_time, 100),7)) as docket_begin,
	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.market, 0)), 1), 1) - 1) as curr_market,
	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.imprv_hstd_Val, 0) + IsNull(pv.imprv_non_hstd_Val, 0)), 1), 1) - 1) as curr_imprv,
	LEFT(CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, IsNull(pv.land_hstd_Val, 0) + IsNull(pv.land_non_hstd_Val, 0) + IsNull(pv.ag_market, 0) + IsNull(pv.timber_market, 0)), 1), 1) - 1) as curr_land,
	@last_yr_market as last_yr_market,
	@last_yr_imprv_val as last_yr_imprv_val,
	@last_yr_land_val as last_yr_land_val

FROM _arb_protest as ap
WITH (NOLOCK)

INNER JOIN property as p
WITH (NOLOCK)
ON ap.prop_id = p.prop_id

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON ap.prop_id = psa.prop_id
AND ap.prop_val_yr = psa.owner_tax_yr

INNER JOIN owner as o
WITH (NOLOCK)
ON psa.prop_id = o.prop_id
AND psa.owner_tax_yr = o.owner_tax_yr
AND psa.sup_num = o.sup_num

INNER JOIN property_val as pv
WITH (NOLOCK)
ON psa.prop_id = pv.prop_id
AND psa.sup_num = pv.sup_num
AND psa.owner_tax_yr = pv.prop_val_yr

INNER JOIN property_profile as pp
WITH (NOLOCK)
ON pv.prop_id = pp.prop_id
AND pv.prop_val_yr = pp.prop_val_yr

INNER JOIN _arb_protest_protest_by_assoc as appba 
WITH (NOLOCK) 
ON appba.case_id = ap.case_id
AND appba.prop_val_yr = ap.prop_val_yr
AND appba.prot_by_id = @prot_by_id

INNER JOIN _arb_protest_protest_by_assoc as appbapp
WITH (NOLOCK) 
ON appbapp.case_id = ap.case_id
AND appbapp.prop_val_yr = ap.prop_val_yr
AND appbapp.primary_protester = 1

INNER JOIN account as ao
WITH (NOLOCK)
ON o.owner_id = ao.acct_id

LEFT OUTER JOIN situs as s
WITH (NOLOCK)
ON ap.prop_id = s.prop_id
AND s.primary_situs = 'Y'

LEFT OUTER JOIN _arb_protest_hearing_docket as docket
WITH (NOLOCK)
ON ap.docket_id = docket.docket_id

LEFT OUTER JOIN agent_assoc as aa
WITH (NOLOCK)
ON o.owner_tax_yr = aa.owner_tax_yr
AND o.prop_id = aa.prop_id
AND o.owner_id = aa.owner_id
AND aa.arb_mailings = 'T'

LEFT OUTER JOIN account as aaa
WITH (NOLOCK)
ON aa.agent_id = aaa.acct_id

WHERE ap.case_id = @case_id
AND ap.prop_val_yr = @prop_val_yr

GO

