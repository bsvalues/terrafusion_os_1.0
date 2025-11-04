
create view wa_tax_statement_assessment_fee_vw
as
	select 
		wtsaf.year,
		wtsaf.group_id,
		wtsaf.run_id,
		wtsaf.statement_id,
		min(wtsaf.assessment_fee_id) as assessment_fee_id,
		sum(wtsaf.assessment_fee_amount) as assessment_fee_amount,
		min(wtsaf.order_num) as order_num,
		wtsaf.fee_cd,
		wtsaf.agency_id,
		item_desc = left(isnull(ft.fee_type_desc, saa.assessment_description), 33)
	from wa_tax_statement_assessment_fee as wtsaf with(nolock)
	left outer join special_assessment_agency as saa with(nolock) on
		saa.agency_id = wtsaf.agency_id
	left outer join fee_type as ft with(nolock) on
		ft.fee_type_cd = wtsaf.fee_cd
	where (ft.fee_type_cd is null) or (ft.fee_type_cd is not null and ft.fee_type_amt is not null)	
	group by
		wtsaf.year, wtsaf.group_id, wtsaf.run_id, wtsaf.statement_id, wtsaf.fee_cd, ft.fee_type_desc,
		wtsaf.agency_id, saa.assessment_description
union
	select
		wtsaf.year,
		wtsaf.group_id,
		wtsaf.run_id,
		wtsaf.statement_id,
		min(wtsaf.assessment_fee_id) as assessment_fee_id,
		sum(wtsaf.assessment_fee_amount) as assessment_fee_amount,
		min(wtsaf.order_num) as order_num,
		wtsaf.fee_cd,
		0 as agency_id,
		item_desc = left(ft.fee_type_desc, 33)
	from wa_tax_statement_assessment_fee as wtsaf with(nolock)
	join fee_type as ft with(nolock) on
		ft.fee_type_cd = wtsaf.fee_cd
	where ft.fee_type_amt is null
	group by
		wtsaf.year, wtsaf.group_id, wtsaf.run_id, wtsaf.statement_id, wtsaf.fee_cd, ft.fee_type_desc

GO

