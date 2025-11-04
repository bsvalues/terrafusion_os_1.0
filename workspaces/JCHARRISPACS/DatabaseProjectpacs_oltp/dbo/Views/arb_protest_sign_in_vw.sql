
CREATE VIEW arb_protest_sign_in_vw

AS

select distinct ao.file_as_name as owner_name, 
	ISNULL(aa.file_as_name, '') as agent_name,
	arb_protest.prop_id,
	property_val.legal_desc,
	convert(varchar(4), arb_protest.appr_year) + '-' + convert(varchar(15), arb_protest.case_id) as cause_number,
	arb_protest.arb_hearing_date,
	left(convert(varchar, arb_protest.arb_hearing_date, 108), 5) as arb_hearing_time,
	arb_protest.close_by_id,
	arb_protest.arb_board,
	arb_protest.inquiry_type_cd
from arb_protest

inner join pacs_system
on pacs_system.system_type = 'A' or pacs_system.system_type = 'B'

inner join prop_supp_assoc
on arb_protest.prop_id = prop_supp_assoc.prop_id
and prop_supp_assoc.owner_tax_yr = pacs_system.appr_yr

inner join owner
on arb_protest.prop_id = owner.prop_id
and owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
and owner.sup_num = prop_supp_assoc.sup_num

inner join account as ao
on owner.owner_id = ao.acct_id

inner join property_val
on owner.prop_id = property_val.prop_id
and owner.owner_tax_yr = property_val.prop_val_yr
and owner.sup_num = property_val.sup_num

left outer join agent_assoc
on prop_supp_assoc.owner_tax_yr = agent_assoc.owner_tax_yr
and arb_protest.prop_id = agent_assoc.prop_id
and owner.owner_id = agent_assoc.owner_id
and isnull(agent_assoc.exp_dt, getdate() + 1) > getdate()

left outer join account as aa
on agent_assoc.agent_id = aa.acct_id

where protest_record = 'T'

GO

