



CREATE procedure [dbo].[monitor_MHDistraint]



/****

This monitor was written for Benton Treasurer.  It returns a list of all mobile home information 

on properties associated with a specified litigation record for the purposes of distraint.



{Call monitor_MHDistraint(1)}

****/



@litigation_id datetime



as



set nocount on



select distinct l.litigation_id, l.cause_num, lpa.prop_id, p.geo_id, a.file_as_name, b.display_year, b.statement_id, b.code,

	pv.hood_cd, n.hood_name, s.situs_display, i.mbl_hm_sn, pv.legal_desc

from litigation l with(nolock)

join litigation_prop_assoc lpa with(nolock)

	on lpa.litigation_id = l.litigation_id

join property p with(nolock)

	on p.prop_id = lpa.prop_id

join account a with(nolock)

	on a.acct_id = p.col_owner_id

join litigation_statement_assoc lsa with(nolock)

	on lsa.litigation_id = l.litigation_id

join bill b with(nolock)

	on b.prop_id = lpa.prop_id

	and b.year = lsa.year

	and b.statement_id = lsa.statement_id

left join prop_supp_assoc psa with(nolock)

	on psa.prop_id = b.prop_id

	and psa.owner_tax_yr = b.year

join property_val pv with(nolock)

	on pv.prop_id = psa.prop_id

	and pv.prop_val_yr = b.year

	and pv.sup_num = psa.sup_num

join imprv i with(nolock)
	on i.prop_id = pv.prop_id
	and i.prop_val_yr = pv.prop_val_yr
	and i.sup_num = pv.sup_num
	and i.sale_id = 0

left join neighborhood n with(nolock)

	on n.hood_cd = pv.hood_cd

	and n.hood_yr = pv.prop_val_yr

left join situs s with(nolock)

	on s.prop_id = b.prop_id

	and s.primary_situs = 'Y'

where l.litigation_id = @litigation_id

order by lpa.prop_id, b.display_year

GO

