
CREATE view arb_panel_decision_vw

as

select distinct ao.file_as_name as owner_name, 
	ISNULL(aa.file_as_name, '') as agent_name,
	arb_protest.inquiry_type_cd,
	arb_protest.prop_id,
	property.geo_id,
	property_val.legal_desc,
	convert(varchar(4), arb_protest.appr_year) + '-' + convert(varchar(15), arb_protest.case_id) as cause_number,
	appraiser.appraiser_nm,
        s.primary_situs, s.situs_num,
        s.situs_street_prefx, s.situs_street,
        s.situs_street_sufix, s.situs_unit,
        s.situs_city, s.situs_state,
        s.situs_zip, s.situs_display,
	convert(varchar(150), REPLACE(isnull(s.situs_display, ''), CHAR(13) + CHAR(10), ' ')) as situs,
	arb_protest.arb_hearing_date,
	left(convert(varchar, arb_protest.arb_hearing_date, 108), 5) as arb_hearing_time,
	arb_protest.close_by_id,
	arb_protest.arb_board,
	arb_protest.resolution_cd,
	arb_protest.resolution_comment
from arb_protest

inner join prop_supp_assoc
on arb_protest.prop_id = prop_supp_assoc.prop_id
and arb_protest.appr_year = prop_supp_assoc.owner_tax_yr
and arb_protest.sup_num = prop_supp_assoc.sup_num
--and prop_supp_assoc.owner_tax_yr = 2003

inner join owner
on arb_protest.prop_id = owner.prop_id
and owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
and owner.sup_num = prop_supp_assoc.sup_num

inner join account as ao
on owner.owner_id = ao.acct_id

inner join property
on arb_protest.prop_id = property.prop_id

inner join property_val
on owner.prop_id = property_val.prop_id
and owner.owner_tax_yr = property_val.prop_val_yr
and owner.sup_num = property_val.sup_num

inner join appraiser
on arb_protest.protest_appraiser_id = appraiser.appraiser_id

inner join situs as s
on arb_protest.prop_id = s.prop_id
and s.primary_situs = 'Y'

left outer join  
( 
	select prop_id,owner_id,owner_tax_yr,max(agent_id) as agent_id 
	from agent_assoc 
	where IsNull(auth_to_resolve,'F') = 'T' and isnull(agent_assoc.exp_dt, getdate() + 1) > getdate()
	group by prop_id,owner_id,owner_tax_yr 
) as agi on 
owner.prop_id = agi.prop_id and 
owner.owner_id=agi.owner_id and 
owner.owner_tax_yr=agi.owner_tax_yr 

left outer join agent_assoc on 
agi.prop_id = agent_assoc.prop_id and 
agi.owner_id = agent_assoc.owner_id and 
agi.owner_tax_yr = agent_assoc.owner_tax_yr and 
agi.agent_id = agent_assoc.agent_id 

--left outer join agent_assoc
--on prop_supp_assoc.owner_tax_yr = agent_assoc.owner_tax_yr
--and arb_protest.prop_id = agent_assoc.prop_id
--and owner.owner_id = agent_assoc.owner_id
--and isnull(agent_assoc.exp_dt, getdate() + 1) > getdate()

left outer join account as aa
on agent_assoc.agent_id = aa.acct_id

where arb_protest.resolution_cd <> ''
and arb_protest.resolution_comment <> ''

GO

