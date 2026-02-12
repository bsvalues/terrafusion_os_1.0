


/*
 * This is only run PopulateAppraisalTotals stored procedure
 */

CREATE PROCEDURE PopulateEtrTables

	@input_yr 			int,
	@input_pacs_user_id	int,
	@input_tnt_export_id int

WITH RECOMPILE
as


-- First delete entries for pacs_user_id from etr tables
DELETE FROM etr_new_ex
--WHERE pacs_user_id = @input_pacs_user_id

DELETE FROM etr_new_ag
--WHERE pacs_user_id = @input_pacs_user_id

DELETE FROM etr_annex_deannex
--WHERE pacs_user_id = @input_pacs_user_id

DELETE FROM etr_average_hs
--WHERE pacs_user_id = @input_pacs_user_id

DELETE FROM etr_deannex_rpt
--WHERE pacs_user_id = @input_pacs_user_id

DELETE FROM etr_protest_value
--WHERE pacs_user_id = @input_pacs_user_id

-- Find all new exemptions

INSERT INTO etr_new_ex
SELECT property_exemption.prop_id, 
		property_exemption.exmpt_tax_yr, 
		property_exemption.owner_id, 
		property_entity_exemption.entity_id, 
		@input_pacs_user_id AS pacs_user_id,
		property_entity_exemption.exmpt_type_cd,
		property.geo_id,
		property_exemption.applicant_nm,

		CASE WHEN property_exemption.exmpt_type_cd LIKE 'EX%'
			THEN 0 
			ELSE ISNULL(property_entity_exemption.state_amt, 0) + ISNULL(property_entity_exemption.local_amt, 0) 
		END AS [curr_yr_exemption_amt],
		0 AS prev_yr_market,
		getdate() AS run_date

FROM property_exemption

INNER JOIN property
WITH (NOLOCK)
ON property_exemption.prop_id = property.prop_id

INNER JOIN property_val 
WITH (NOLOCK)
ON 	property_exemption.prop_id = property_val.prop_id
AND	property_exemption.exmpt_tax_yr = property_val.prop_val_yr
AND property_exemption.sup_num = property_val.sup_num

INNER JOIN #appraisal_totals_supp_assoc AS atsa
with (nolock)
ON  property_exemption.prop_id = atsa.prop_id
AND property_exemption.exmpt_tax_yr = atsa.year
AND property_exemption.sup_num = atsa.sup_num

INNER JOIN appraisal_totals_criteria_entity as ce
WITH (NOLOCK)
ON ce.pacs_user_id = @input_pacs_user_id 
AND ce.tnt_export_id = @input_tnt_export_id

LEFT OUTER JOIN property_entity_exemption
WITH (NOLOCK)
ON  property_exemption.prop_id = property_entity_exemption.prop_id
AND property_exemption.owner_id = property_entity_exemption.owner_id
AND property_exemption.exmpt_tax_yr = property_entity_exemption.exmpt_tax_yr
AND property_exemption.sup_num = property_entity_exemption.sup_num
AND property_exemption.exmpt_type_cd = property_entity_exemption.exmpt_type_cd
AND ce.entity_id = property_entity_exemption.entity_id

WHERE property_exemption.exmpt_tax_yr = @input_yr
and property_exemption.effective_tax_yr = @input_yr
and property_exemption.exmpt_type_cd NOT IN ('FR', 'AB')
and property_val.prop_inactive_dt IS NULL
and property_entity_exemption.entity_id IS NOT NULL
ORDER BY property_entity_exemption.entity_id, applicant_nm

-- Now set the previous year market values on 
-- Totally Exempt accounts per the Truth-in-Taxation workbook

UPDATE etr_new_ex
SET prev_yr_market = ISNULL(poev.market_val, 0)

FROM etr_new_ex
WITH (NOLOCK)

INNER JOIN property_val
WITH (NOLOCK)
ON  etr_new_ex.prop_id = property_val.prop_id
AND etr_new_ex.exmpt_tax_yr - 1 = property_val.prop_val_yr

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON  property_val.prop_id = psa.prop_id
AND property_val.prop_val_yr = psa.owner_tax_yr
AND property_val.sup_num = psa.sup_num

INNER JOIN prop_owner_entity_val AS poev 
WITH (NOLOCK)
ON 	property_val.prop_id = poev.prop_id
AND	property_val.sup_num = poev.sup_num
AND	property_val.prop_val_yr = poev.sup_yr
AND	poev.entity_id = etr_new_ex.entity_id

WHERE etr_new_ex.exmpt_type_cd LIKE 'EX%'
AND etr_new_ex.pacs_user_id = @input_pacs_user_id


--- Start of New Ag Section


--Insert current year ag value

INSERT INTO etr_new_ag
SELECT DISTINCT poev.prop_id, 
		poev.sup_yr, 
		0 AS owner_id,
		poev.entity_id, 
		@input_pacs_user_id AS pacs_user_id,
		property.geo_id, 
		legal_desc,
		SUM(ISNULL(poev.ag_use_val, 0) + ISNULL(poev.timber_use,0)) AS curr_yr_prod_use,
		0 AS prev_yr_land_market,
		getdate() AS run_date
		

FROM prop_owner_entity_val AS poev
WITH (NOLOCK)

INNER JOIN property_val
WITH (NOLOCK)
ON  poev.prop_id = property_val.prop_id
AND poev.sup_yr = property_val.prop_val_yr
AND poev.sup_num = property_val.sup_num

INNER JOIN #appraisal_totals_supp_assoc AS atsa
with (nolock)
ON  poev.prop_id = atsa.prop_id
AND poev.sup_yr = atsa.year
AND poev.sup_num = atsa.sup_num

INNER JOIN appraisal_totals_criteria_entity as ce
WITH (NOLOCK)
ON ce.pacs_user_id = @input_pacs_user_id 
AND ce.tnt_export_id = @input_tnt_export_id
AND poev.entity_id = ce.entity_id

INNER JOIN property
WITH (NOLOCK)
ON poev.prop_id = property.prop_id

INNER JOIN account
WITH (NOLOCK)
ON poev.owner_id = account.acct_id

WHERE poev.sup_yr = @input_yr
AND property_val.prop_inactive_dt IS NULL
AND poev.prop_id IN
(
	SELECT DISTINCT prop_id 
	FROM land_detail
	WITH (NOLOCK)

	WHERE new_ag = 'T' 
	AND prop_val_yr = poev.sup_yr
	AND sup_num = poev.sup_num
	AND sale_id = 0 
)

GROUP BY poev.sup_yr, poev.prop_id, poev.entity_id, property.geo_id, property_val.legal_desc

--Insert Previous Market Value on Ag into a temp table...

SELECT DISTINCT ld.prop_id, epa.entity_id,
				SUM(IsNull(ld.new_ag_prev_val,0) * (IsNull(lea.entity_pct, 100))/100) AS total_prev_mkt_value
INTO #tmp_etr_new_ag

FROM land_detail AS ld
WITH (NOLOCK)

INNER JOIN property_val AS pv
WITH (NOLOCK)
ON  ld.prop_id = pv.prop_id
AND ld.prop_val_yr = pv.prop_val_yr
AND ld.sup_num = pv.sup_num

inner join entity_prop_assoc as epa
on ld.prop_id = epa.prop_id
and ld.sup_num = epa.sup_num
and ld.prop_val_yr = epa.tax_yr

left outer join land_entity_assoc as lea
on ld.prop_id = lea.prop_id
and ld.sup_num = lea.sup_num
and ld.prop_val_yr = lea.prop_val_yr
and ld.land_seg_id = lea.land_seg_id
and ld.sale_id = lea.sale_id
and epa.entity_id = lea.entity_id

INNER JOIN #appraisal_totals_supp_assoc AS atsa
with (nolock)
ON  ld.prop_id = atsa.prop_id
AND ld.prop_val_yr = atsa.year
AND ld.sup_num = atsa.sup_num

WHERE pv.prop_inactive_dt IS NULL
AND ld.sale_id = 0
AND ld.new_ag = 'T'
AND ld.prop_val_yr = @input_yr
GROUP BY ld.prop_id, epa.entity_id

-- Now update the prev_yr_land_market

UPDATE etr_new_ag 
SET etr_new_ag.prev_yr_land_market = _tena.total_prev_mkt_value 

FROM etr_new_ag
WITH (NOLOCK)

INNER JOIN #appraisal_totals_supp_assoc AS atsa
with (nolock)
ON  etr_new_ag.prop_id = atsa.prop_id
AND etr_new_ag.sup_yr = atsa.year

INNER JOIN #tmp_etr_new_ag AS _tena
WITH (NOLOCK)
ON  etr_new_ag.prop_id = _tena.prop_id
and etr_new_ag.entity_id = _tena.entity_id

INNER JOIN appraisal_totals_criteria_entity as ce
WITH (NOLOCK)
ON ce.pacs_user_id = @input_pacs_user_id 
AND ce.tnt_export_id = @input_tnt_export_id

WHERE etr_new_ag.sup_yr = @input_yr
AND etr_new_ag.pacs_user_id = @input_pacs_user_id


-- Since we are grouping by Property, we need to establish 
-- the 'primary' owner to display on the report

UPDATE etr_new_ag 
SET owner_id = (SELECT TOP 1 owner_id 
				FROM owner
				WITH (NOLOCK)
				WHERE owner.prop_id = etr_new_ag.prop_id
				AND owner.owner_tax_yr = etr_new_ag.sup_yr
				ORDER BY pct_ownership DESC)

WHERE pacs_user_id = @input_pacs_user_id


--- Start of Annexations / DeAnnexations

INSERT INTO etr_annex_deannex
SELECT 	DISTINCT poev.prop_id, 
		poev.sup_yr, 
		poev.owner_id, 
		poev.entity_id, 
		@input_pacs_user_id,
		property.geo_id, 
		pv.legal_desc, 
		poev.taxable_val AS cur_yr_annex, 
		0 AS prev_yr_deannex,
		pv.market, 
		getdate() AS run_date
		

FROM prop_owner_entity_val AS poev
WITH (NOLOCK)

INNER JOIN appraisal_totals_criteria_entity as ce
WITH (NOLOCK)
ON ce.pacs_user_id = @input_pacs_user_id 
AND ce.tnt_export_id = @input_tnt_export_id

INNER JOIN entity_prop_assoc AS epa
WITH (NOLOCK)
ON  poev.prop_id = epa.prop_id
AND poev.sup_yr = epa.tax_yr
AND poev.sup_num = epa.sup_num
AND poev.entity_id = epa.entity_id
AND ce.entity_id = poev.entity_id
AND epa.annex_yr = @input_yr

INNER JOIN property
WITH (NOLOCK)
ON poev.prop_id = property.prop_id

INNER JOIN property_val AS pv
WITH (NOLOCK)
ON  poev.prop_id = pv.prop_id
AND poev.sup_yr = pv.prop_val_yr
AND poev.sup_num = pv.sup_num

INNER JOIN #appraisal_totals_supp_assoc AS atsa
with (nolock)
ON  poev.prop_id = atsa.prop_id
AND poev.sup_yr = atsa.year
AND poev.sup_num = atsa.sup_num

WHERE poev.sup_yr = @input_yr
AND pv.prop_inactive_dt IS NULL
-- Start of Average HS Market Value and Taxable Value


INSERT INTO etr_average_hs
SELECT 	poev.entity_id, 
		poev.sup_yr, 
		@input_pacs_user_id AS pacs_user_id,
		COUNT(0) AS curr_yr_hs_count,
		CASE COUNT(0) WHEN 0 THEN 0 ELSE SUM( ISNULL(poev.land_hstd_val,0) + ISNULL(poev.imprv_hstd_val,0) ) / COUNT(0) END AS curr_yr_average_market,
		CASE COUNT(0) WHEN 0 THEN 0 ELSE SUM( ISNULL(pee.state_amt,0) + ISNULL(pee.local_amt,0) + ISNULL(poev.ten_percent_cap,0)) / COUNT(0) END AS curr_yr_average_hs_exemption,
		0 AS curr_yr_average_taxable,
		0 AS prev_yr_hs_count,
		0 AS prev_yr_average_market,
		0 AS prev_yr_average_hs_exemption,
		0 AS prev_yr_average_taxable,
		getdate() AS run_date

FROM prop_owner_entity_val AS poev
WITH (NOLOCK)

INNER JOIN property_exemption AS pe
WITH (NOLOCK)
ON  poev.prop_id = pe.prop_id
AND poev.sup_yr = pe.exmpt_tax_yr
AND poev.sup_num = pe.sup_num
AND poev.owner_id = pe.owner_id
AND pe.exmpt_type_cd = 'HS'

INNER JOIN property_val AS pv
WITH (NOLOCK)
ON  poev.prop_id = pv.prop_id
AND poev.sup_yr = pv.prop_val_yr
AND poev.sup_num = pv.sup_num

INNER JOIN #appraisal_totals_supp_assoc AS atsa
with (nolock)
ON  poev.prop_id = atsa.prop_id
AND poev.sup_yr = atsa.year
AND poev.sup_num = atsa.sup_num

INNER JOIN appraisal_totals_criteria_entity as ce
WITH (NOLOCK)
ON ce.pacs_user_id = @input_pacs_user_id 
AND ce.tnt_export_id = @input_tnt_export_id
AND poev.entity_id = ce.entity_id

LEFT OUTER JOIN property_entity_exemption AS pee
WITH (NOLOCK)
ON  poev.prop_id = pee.prop_id
AND poev.sup_yr = pee.exmpt_tax_yr
AND poev.sup_num = pee.sup_num
AND poev.owner_id = pee.owner_id
AND poev.entity_id = pee.entity_id
AND pee.exmpt_type_cd = 'HS'
--AND ce.entity_id = pee.entity_id

WHERE poev.sup_yr = @input_yr
AND poev.entity_id = ce.entity_id
AND pv.prop_inactive_dt IS NULL
AND pv.prop_id IN (SELECT DISTINCT prop_id
					FROM property_val_state_cd
					WITH (NOLOCK)
					WHERE property_val_state_cd.prop_val_yr = @input_yr
					AND property_val_state_cd.state_cd LIKE 'A%')
GROUP BY poev.sup_yr, poev.entity_id


-- Now do the prior year
UPDATE etr_average_hs
SET prev_yr_hs_count = subq.prev_yr_hs_count,
	prev_yr_average_market = subq.prev_yr_average_market,
	prev_yr_average_hs_exemption = subq.prev_yr_average_hs_exemption

FROM
	(SELECT poev.sup_yr, 
			poev.entity_id, 
			COUNT(0) AS prev_yr_hs_count,
			CASE COUNT(0) WHEN 0 THEN 0 ELSE SUM( ISNULL(poev.land_hstd_val,0) + ISNULL(poev.imprv_hstd_val,0)) / COUNT(0) END AS prev_yr_average_market,
			CASE COUNT(0) WHEN 0 THEN 0 ELSE SUM( ISNULL(pee.state_amt,0) + ISNULL(pee.local_amt,0) + ISNULL(poev.ten_percent_cap,0)) / COUNT(0) END AS prev_yr_average_hs_exemption,
			getdate() AS run_date

	FROM prop_owner_entity_val AS poev
	WITH (NOLOCK)
	
	INNER JOIN property_exemption AS pe
	WITH (NOLOCK)
	ON  poev.prop_id = pe.prop_id
	AND poev.sup_yr = pe.exmpt_tax_yr
	AND poev.sup_num = pe.sup_num
	AND poev.owner_id = pe.owner_id
	AND pe.exmpt_type_cd = 'HS'
	
	INNER JOIN property_val AS pv
	WITH (NOLOCK)
	ON  poev.prop_id = pv.prop_id
	AND poev.sup_yr = pv.prop_val_yr
	AND poev.sup_num = pv.sup_num
	
	INNER JOIN prop_supp_assoc as psa
	WITH (NOLOCK)
	ON  poev.prop_id = psa.prop_id
	AND poev.sup_yr = psa.owner_tax_yr
	AND poev.sup_num = psa.sup_num

	INNER JOIN appraisal_totals_criteria_entity as ce
	WITH (NOLOCK)
	ON ce.pacs_user_id = @input_pacs_user_id 
	AND ce.tnt_export_id = @input_tnt_export_id
	AND poev.entity_id = ce.entity_id
	
	LEFT OUTER JOIN property_entity_exemption AS pee
	WITH (NOLOCK)
	ON  poev.prop_id = pee.prop_id
	AND poev.sup_yr = pee.exmpt_tax_yr
	AND poev.sup_num = pee.sup_num
	AND poev.owner_id = pee.owner_id

	AND poev.entity_id = pee.entity_id
	AND pee.exmpt_type_cd = 'HS'
--	AND ce.entity_id = pee.entity_id

	WHERE poev.sup_yr = @input_yr - 1
	AND pv.prop_inactive_dt IS NULL
	AND pv.prop_id IN (SELECT DISTINCT prop_id
						FROM property_val_state_cd
						WITH (NOLOCK)
						WHERE property_val_state_cd.prop_val_yr = @input_yr
						AND property_val_state_cd.state_cd LIKE 'A%')

	GROUP BY poev.sup_yr, poev.entity_id) AS subq

WHERE etr_average_hs.sup_yr = @input_yr
AND etr_average_hs.entity_id = subq.entity_id
AND etr_average_hs.pacs_user_id = @input_pacs_user_id

-- Update average_taxables
UPDATE etr_average_hs 
SET curr_yr_average_taxable = curr_yr_average_market - curr_yr_average_hs_exemption,
	prev_yr_average_taxable = prev_yr_average_market - prev_yr_average_hs_exemption
WHERE pacs_user_id = @input_pacs_user_id

insert into etr_deannex_rpt
SELECT 	
	poev.prop_id, 
--	poev.sup_yr,
	@input_yr,
	poev.owner_id,
	poev.entity_id, 
	@input_pacs_user_id,
	property.geo_id, 
	pv.legal_desc, 
	poev.taxable_val AS prev_yr_deannex, 
	poev.market_val AS market, 
	getdate() AS run_date
FROM	prop_owner_entity_val as poev WITH (NOLOCK)
	JOIN property WITH (NOLOCK) on
		property.prop_id = poev.prop_id
	JOIN prop_supp_assoc AS psa WITH (NOLOCK) ON
		psa.prop_id = poev.prop_id AND
		psa.owner_tax_yr = poev.sup_yr AND
		psa.sup_num = poev.sup_num
	JOIN property_val AS pv WITH (NOLOCK) ON
		pv.prop_id = psa.prop_id AND
		pv.prop_val_yr = psa.owner_tax_yr AND
		pv.sup_num = psa.sup_num AND
		pv.prop_inactive_dt IS NULL
	JOIN prop_supp_assoc AS psa2 WITH (NOLOCK) ON
		psa2.prop_id = poev.prop_id AND
		psa2.owner_tax_yr = @input_yr 
	JOIN property_val AS pv2 WITH (NOLOCK) ON
		pv2.prop_id = psa2.prop_id AND
		pv2.prop_val_yr = psa2.owner_tax_yr AND
		pv2.sup_num = psa2.sup_num AND
		pv2.prop_inactive_dt IS NULL
WHERE  	poev.sup_yr = @input_yr - 1 AND
	pv2.prop_val_yr=@input_yr AND
	poev.entity_id NOT IN (	SELECT 	DISTINCT prop_owner_entity_val.entity_id 
					FROM 	prop_owner_entity_val WITH (NOLOCK)
						INNER JOIN prop_owner_entity_val AS prop_owner_entity_val_prev  WITH (NOLOCK) ON
							prop_owner_entity_val.prop_id = prop_owner_entity_val_prev.prop_id AND
							prop_owner_entity_val.entity_id = prop_owner_entity_val_prev.entity_id
					WHERE	prop_owner_entity_val.prop_id = poev.prop_id AND
						prop_owner_entity_val.sup_yr = poev.sup_yr + 1 AND
						prop_owner_entity_val_prev.sup_yr = poev.sup_yr)
ORDER BY  poev.entity_id,poev.prop_id


-- Start of ARB Under Protest values --

insert into etr_protest_value
(
prop_id, 
prop_sup,
prop_yr,
owner_id,
entity_id,
pacs_user_id,
geo_id,
legal_desc,

curr_yr_market,
curr_yr_taxable,
curr_yr_ag,
curr_yr_exempt,

run_date
)

select
poev.prop_id,
poev.sup_num,
poev.sup_yr,
poev.owner_id,
poev.entity_id,
@input_pacs_user_id,
property.geo_id, 
pv.legal_desc,

pv.market,
poev.taxable_val,
poev.ag_market,
poev.exempt_val,

getdate() as run_time

from prop_owner_entity_val AS poev with (nolock)

inner join property_val pv with (nolock)
on poev.prop_id = pv.prop_id
and poev.sup_yr = pv.prop_val_yr
and poev.sup_num = pv.sup_num

inner join #appraisal_totals_supp_assoc AS atsa with (nolock)
on poev.prop_id = atsa.prop_id
and poev.sup_yr = atsa.year
and poev.sup_num = atsa.sup_num

inner join appraisal_totals_criteria_entity as ce with (nolock)
on ce.pacs_user_id = @input_pacs_user_id 
and ce.tnt_export_id = @input_tnt_export_id
and poev.entity_id = ce.entity_id

inner join property with (nolock)
ON poev.prop_id = property.prop_id

inner join account with (nolock)
on poev.owner_id = account.acct_id

where poev.sup_yr = @input_yr
and pv.prop_inactive_dt is null
and poev.arb_status = 'A'

--and exists (
--select * from _arb_protest with (nolock)
--where (prop_id = pv.prop_id or prop_id = pv.udi_parent_prop_id)
--and prop_val_yr = pv.prop_val_yr
--and prot_complete_dt is null
--)

-- previous year

update etr_protest_value

set prev_yr_market = prev_pv.market,
prev_yr_taxable = prev_poev.taxable_val,
prev_yr_ag = prev_poev.ag_market,
prev_yr_exempt = prev_poev.exempt_val

from etr_protest_value epv with (nolock)

left outer join prop_supp_assoc AS prev_psa with (nolock)
on epv.prop_id = prev_psa.prop_id
and (epv.prop_yr - 1) = prev_psa.owner_tax_yr

left outer join prop_owner_entity_val AS prev_poev with (nolock)
on prev_poev.prop_id = prev_psa.prop_id
and prev_poev.sup_yr = prev_psa.owner_tax_yr
and prev_poev.sup_num = prev_psa.sup_num
and prev_poev.entity_id = epv.entity_id

left outer join property_val prev_pv with (nolock)
on prev_pv.prop_id = prev_psa.prop_id
and prev_pv.prop_val_yr = prev_psa.owner_tax_yr
and prev_pv.sup_num = prev_psa.sup_num


-- opinion of value

declare @prop_id int
declare @prop_yr int
declare @prop_sup int
declare @entity_id int

declare @parent_prop_id int
declare @parent_prop_sup int
declare @child_prop_id int
declare @child_prop_sup int

declare @parent_market numeric(14,0)
declare @child_market numeric(14,0)
declare @opinion_of_value numeric(14,0)
declare @adj_opinion_of_value numeric(14,0)

-- do this for each record in etr_protest_value
declare etr_protest_cursor cursor for
select prop_id, prop_yr, prop_sup, entity_id
from etr_protest_value

open etr_protest_cursor
fetch next from etr_protest_cursor into @prop_id, @prop_yr, @prop_sup, @entity_id
while (@@FETCH_STATUS = 0)
begin
	set @child_prop_id = @prop_id
	set @child_prop_sup = @prop_sup

	-- check the UDI status
 	select @parent_prop_id = pv.udi_parent_prop_id
	from property_val pv with (nolock)
	where pv.prop_id = @prop_id
	and pv.prop_val_yr = @prop_yr
	and pv.sup_num = @prop_sup

	if @parent_prop_id is null
	begin
		-- normal property: 'parent' is the same as the 'child'
		set @parent_prop_id = @prop_id
		set @parent_prop_sup = @prop_sup
	end
	else begin
		-- UDI child: find its parent
		select @parent_prop_sup = psa.sup_num
		from prop_supp_assoc psa with (nolock)
		where @parent_prop_id = psa.prop_id
		and @prop_yr = psa.owner_tax_yr
	end

	-- get values
	select @opinion_of_value = min(pro.opinion_of_value)
	from _arb_protest pro with (nolock)
	where pro.prop_id = @parent_prop_id
	and pro.prop_val_yr = @prop_yr
	and pro.prot_complete_dt is null
	and not pro.opinion_of_value is null
	and pro.opinion_of_value > 0

	select @parent_market = pv.market
	from property_val pv with (nolock)
	where pv.prop_id = @parent_prop_id
	and pv.prop_val_yr = @prop_yr
	and pv.sup_num = @parent_prop_sup

	select @child_market = poev.market_val
	from prop_owner_entity_val poev with (nolock)
	where poev.prop_id = @child_prop_id
	and poev.sup_yr = @prop_yr
	and poev.sup_num = @child_prop_sup
	and poev.entity_id = @entity_id

	set @adj_opinion_of_value = 
	case when @child_market > 0 and @parent_market > 0
	then (@child_market / @parent_market) * @opinion_of_value
	else 0
	end

	-- write the final value into the table
	update etr_protest_value
	set opinion_of_value = @adj_opinion_of_value
	where current of etr_protest_cursor

fetch next from etr_protest_cursor into @prop_id, @prop_yr, @prop_sup, @entity_id
end

-- end of loop, clean up
close etr_protest_cursor
deallocate etr_protest_cursor


-- final protest value

update etr_protest_value
set protest_value = case
when isnull(opinion_of_value, 0) > 0
then
	-- opinion of value provided: use lesser of opinion and current
	case when curr_yr_taxable is null
		then opinion_of_value
	when curr_yr_taxable < opinion_of_value
		then curr_yr_taxable
	else
		opinion_of_value
	end
else
	-- opinion of value not provided: use lesser of current and previous
	case when curr_yr_taxable is null
		then prev_yr_taxable
    	when prev_yr_taxable is null
		then curr_yr_taxable
	when curr_yr_taxable < prev_yr_taxable
		then curr_yr_taxable
	else
		prev_yr_taxable
	end 
end

GO

