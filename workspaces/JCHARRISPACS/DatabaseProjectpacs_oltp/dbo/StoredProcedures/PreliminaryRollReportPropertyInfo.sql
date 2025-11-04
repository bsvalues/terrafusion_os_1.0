


CREATE PROCEDURE PreliminaryRollReportPropertyInfo
	@input_prop_id int,
	@input_owner_id int,
	@input_year int
as

SET NOCOUNT ON

declare @lease_flag bit

SELECT @lease_flag = ISNULL(lease_flag, 0)
FROM pacs_system
WHERE system_type IN ('A', 'B')
 
-- Now get the property information


SELECT	1 as DumbID,
	pv.prop_id,
	pv.sup_num,
	pv.abs_subdv_cd,
	abs_subdv.abs_subdv_desc,
	owner.owner_id, 
	owner.pct_ownership,
	p.prop_type_cd,
	pv.imprv_hstd_val,
	pv.land_hstd_val,
	pv.market,
	pv.legal_desc,
	pv.imprv_non_hstd_val,
	pv.land_non_hstd_val,
	pv.ag_use_val + pv.timber_use - pv.ag_market - pv.timber_market as prod_loss,
	pv.appraised_val,
	pv.prop_inactive_dt,
	pv.ag_use_val + pv.timber_use as prod_use,
	pv.ten_percent_cap,
	pv.ag_market + pv.timber_market as prod_market,
	pv.assessed_val,
	p.geo_id,
	pv.legal_acreage,
	CASE WHEN @lease_flag = 0 THEN pv.mineral_int_pct ELSE lpa.interest_pct END as mineral_int_pct,
	pv.eff_size_acres,
	CASE WHEN @lease_flag = 0 THEN mineral_acct.type_of_int ELSE lpa.interest_type_cd END as type_of_int,
	pv.map_id,
	owner.roll_state_code,
	mortgage_assoc.mortgage_co_id as mortgage_cd,
	owner.roll_exemption,
	account.file_as_name,
	address.addr_line1,
	address.addr_line2,
	address.addr_line3,
	address.addr_city,
	address.addr_state,	
	address.country_cd,
	address.is_international,
	country.country_name,
	address.addr_zip,
	agent_account.file_as_name as agent_name,
	situs.situs_display,
	p.dba_name,
    p.ref_id2

FROM	property_val as pv with (nolock)

INNER JOIN prop_supp_assoc as psa with (nolock)
ON    pv.prop_id = psa.prop_id
AND   pv.prop_val_yr = psa.owner_tax_yr
AND   pv.sup_num = psa.sup_num

INNER JOIN property as p with (nolock)
ON    pv.prop_id = p.prop_id

LEFT OUTER JOIN abs_subdv with (nolock)
ON    pv.abs_subdv_cd = abs_subdv.abs_subdv_cd
AND   pv.prop_val_yr = abs_subdv.abs_subdv_yr

LEFT OUTER JOIN situs with (nolock)
ON    pv.prop_id = situs.prop_id
AND   situs.primary_situs = 'Y'

INNER JOIN owner with (nolock)
ON    pv.prop_id = owner.prop_id
AND   pv.prop_val_yr = owner.owner_tax_yr
AND   pv.sup_num = owner.sup_num

INNER JOIN account with (nolock)
ON    account.acct_id = owner.owner_id

LEFT OUTER JOIN agent_assoc with (nolock)
ON    pv.prop_id = agent_assoc.prop_id
AND   owner.owner_id = agent_assoc.owner_id
AND   pv.prop_val_yr = agent_assoc.owner_tax_yr
AND   agent_assoc.arb_mailings = 'T'

LEFT OUTER JOIN account as agent_account with (nolock)
ON    agent_assoc.agent_id = agent_account.acct_id

LEFT OUTER JOIN address with (nolock)
ON    owner.owner_id = address.acct_id
AND   address.primary_addr = 'Y'

LEFT OUTER JOIN country with (nolock)
ON    country.country_cd = address.country_cd

LEFT OUTER JOIN mineral_acct with (nolock)
ON    pv.prop_id = mineral_acct.prop_id

LEFT OUTER JOIN lease_prop_assoc as lpa with (nolock)
ON    pv.prop_id = lpa.prop_id
AND   pv.prop_val_yr = lpa.lease_yr
AND   pv.sup_num = lpa.sup_num
AND   lpa.rev_num = (SELECT MAX(rev_num)
					FROM lease_prop_assoc with (nolock)
					WHERE lpa.prop_id = prop_id
					AND lpa.lease_id = lease_id
					AND lpa.lease_yr = lease_yr
					AND lpa.sup_num = sup_num)

LEFT OUTER JOIN mortgage_assoc with (nolock)
ON    pv.prop_id = mortgage_assoc.prop_id

WHERE	pv.prop_val_yr = @input_year
AND	pv.prop_id = @input_prop_id
AND	owner.owner_id = @input_owner_id
AND	pv.sup_num = 0
AND	pv.prop_inactive_dt is null

GO

