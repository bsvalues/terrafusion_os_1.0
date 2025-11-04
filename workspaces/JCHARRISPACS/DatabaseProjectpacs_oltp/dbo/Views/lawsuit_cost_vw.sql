



CREATE view lawsuit_cost_vw

as

	select 
		lc.lawsuit_id, lc.cost_id, lc.cost_cd, lc.cost_amt, lc.cost_date, lc.cost_payee_contact_id,
		case
			when lcv.lawsuit_id is not null then lcv.contact_name
			else lc.cost_payee
		end as cost_payee
	from lawsuit_cost as lc
	left outer join lawsuit_contact_vw as lcv on
		lc.lawsuit_id = lcv.lawsuit_id and
		lc.cost_payee_contact_id = lcv.contact_id

GO

