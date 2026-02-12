

CREATE PROCEDURE CertifiedRollReportPropertyInfo
	@input_prop_id int,
	@input_owner_id int,
	@input_year int,
	@input_sup_num int,
	@input_entity_id	  int = 0
as

SET NOCOUNT ON


declare @sup_num int
declare @lease_flag bit

SELECT @lease_flag = ISNULL(lease_flag, 0)
FROM pacs_system
with (nolock)
WHERE system_type IN ('A', 'B')

SELECT @sup_num = max(sup_num)
FROM property_val
with (nolock)
WHERE prop_id = @input_prop_id
AND prop_val_yr = @input_year
AND sup_num <= @input_sup_num
 
-- Now get the property information

if (@input_entity_id = 0)
begin


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
	situs_display,
	p.dba_name,
	p.ref_id2

FROM	property_val as pv
with (nolock)

INNER JOIN property as p
with (nolock)
ON    pv.prop_id = p.prop_id

LEFT OUTER JOIN abs_subdv
with (nolock)
ON    pv.abs_subdv_cd = abs_subdv.abs_subdv_cd
AND   pv.prop_val_yr = abs_subdv.abs_subdv_yr

LEFT OUTER JOIN situs
with (nolock)
ON    pv.prop_id = situs.prop_id
AND   situs.primary_situs = 'Y'

INNER JOIN owner
with (nolock)
ON    pv.prop_id = owner.prop_id
AND   pv.prop_val_yr = owner.owner_tax_yr
AND   pv.sup_num = owner.sup_num

INNER JOIN account
with (nolock)
ON    account.acct_id = owner.owner_id

LEFT OUTER JOIN agent_assoc
with (nolock)
ON    pv.prop_id = agent_assoc.prop_id
AND   owner.owner_id = agent_assoc.owner_id
AND   pv.prop_val_yr = agent_assoc.owner_tax_yr
AND   agent_assoc.ca_mailings = 'T'

LEFT OUTER JOIN account as agent_account
with (nolock)
ON    agent_assoc.agent_id = agent_account.acct_id

LEFT OUTER JOIN address
with (nolock)
ON    owner.owner_id = address.acct_id
AND   address.primary_addr = 'Y'

LEFT OUTER JOIN country
with (nolock)
ON    country.country_cd = address.country_cd

LEFT OUTER JOIN mineral_acct
with (nolock)
ON    pv.prop_id = mineral_acct.prop_id

LEFT OUTER JOIN lease_prop_assoc as lpa
with (nolock)
ON    pv.prop_id = lpa.prop_id
AND   pv.prop_val_yr = lpa.lease_yr
AND   pv.sup_num = lpa.sup_num
AND   lpa.rev_num = (SELECT MAX(rev_num)
					FROM lease_prop_assoc
					with (nolock)
					WHERE lpa.lease_id = lease_id
					AND lpa.lease_yr = lease_yr
					AND lpa.prop_id = prop_id
					AND lpa.sup_num = sup_num)

LEFT OUTER JOIN mortgage_assoc
ON    pv.prop_id = mortgage_assoc.prop_id

WHERE	pv.prop_val_yr = @input_year
AND	pv.prop_id = @input_prop_id
AND	owner.owner_id = @input_owner_id
AND	pv.sup_num = @input_sup_num
AND	pv.prop_inactive_dt is null

end
else
begin
	
SELECT	1 as DumbID,
	pv.prop_id,
	pv.sup_num,
	pv.abs_subdv_cd,
	abs_subdv.abs_subdv_desc,
	owner.owner_id, 
	owner.pct_ownership,
	p.prop_type_cd,
	poev.imprv_hstd_val,
	poev.land_hstd_val,

	case when p.prop_type_cd <> 'R' and p.prop_type_cd <> 'MH' then IsNull(poev.assessed_val, 0) 
	        else IsNull(poev.imprv_hstd_val, 0) + IsNull(poev.imprv_non_hstd_val, 0) + 
		  IsNull(poev.land_hstd_val, 0) + IsNull(poev.land_non_hstd_val, 0) + 
		  IsNull(poev.ag_market, 0) + IsNull(poev.timber_market, 0) end as market,
		
	    
	pv.legal_desc,
	poev.imprv_non_hstd_val,
	poev.land_non_hstd_val,
	poev.ag_use_val + poev.timber_use - poev.ag_market - poev.timber_market as prod_loss,
	poev.assessed_val + poev.ten_percent_cap as appraised_val,
	pv.prop_inactive_dt,
	poev.ag_use_val + poev.timber_use as prod_use,
	poev.ten_percent_cap,
	poev.ag_market + poev.timber_market as prod_market,
	poev.assessed_val,
	p.geo_id,
	pv.legal_acreage,
	CASE WHEN @lease_flag = 0 THEN pv.mineral_int_pct ELSE lpa.interest_pct END as mineral_int_pct,
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
	REPLACE(isnull(situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs_display,
	p.dba_name,
	p.ref_id2

FROM	property_val as pv


INNER JOIN prop_owner_entity_val  as poev
ON    pv.prop_id = poev.prop_id
AND   pv.prop_val_yr = poev.sup_yr
AND   pv.sup_num = poev.sup_num
and    poev.entity_id = @input_entity_id
and    poev.owner_id = @input_owner_id

INNER JOIN property as p
ON    pv.prop_id = p.prop_id

LEFT OUTER JOIN abs_subdv
ON    pv.abs_subdv_cd = abs_subdv.abs_subdv_cd
AND   pv.prop_val_yr = abs_subdv.abs_subdv_yr

LEFT OUTER JOIN situs
ON    pv.prop_id = situs.prop_id
AND   situs.primary_situs = 'Y'

INNER JOIN owner
ON    pv.prop_id = owner.prop_id
AND   pv.prop_val_yr = owner.owner_tax_yr
AND   pv.sup_num = owner.sup_num

INNER JOIN account
ON    account.acct_id = owner.owner_id

LEFT OUTER JOIN agent_assoc
ON    pv.prop_id = agent_assoc.prop_id
AND   owner.owner_id = agent_assoc.owner_id
AND   pv.prop_val_yr = agent_assoc.owner_tax_yr
AND   agent_assoc.ca_mailings = 'T'

LEFT OUTER JOIN account as agent_account
ON    agent_assoc.agent_id = agent_account.acct_id

LEFT OUTER JOIN address
ON    owner.owner_id = address.acct_id
AND   address.primary_addr = 'Y'

LEFT OUTER JOIN country
with (nolock)
ON    country.country_cd = address.country_cd

LEFT OUTER JOIN mineral_acct
ON    pv.prop_id = mineral_acct.prop_id

LEFT OUTER JOIN lease_prop_assoc as lpa
ON    pv.prop_id = lpa.prop_id
AND   pv.prop_val_yr = lpa.lease_yr
AND   pv.sup_num = lpa.sup_num
AND   lpa.rev_num = (SELECT MAX(rev_num)
					FROM lease_prop_assoc
					WHERE lpa.lease_id = lease_id
					AND lpa.lease_yr = lease_yr
					AND lpa.prop_id = prop_id
					AND lpa.sup_num = sup_num)

LEFT OUTER JOIN mortgage_assoc
ON    pv.prop_id = mortgage_assoc.prop_id

WHERE	pv.prop_val_yr = @input_year
AND	pv.prop_id = @input_prop_id
AND	owner.owner_id = @input_owner_id
AND	pv.sup_num = @input_sup_num
AND	pv.prop_inactive_dt is null

end

GO

