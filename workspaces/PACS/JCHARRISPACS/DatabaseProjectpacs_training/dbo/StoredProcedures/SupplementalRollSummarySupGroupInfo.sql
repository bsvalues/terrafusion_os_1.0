



create procedure SupplementalRollSummarySupGroupInfo
	@input_sup_group_id int

as

	select 	sup_group.sup_create_dt,
		sup_group.sup_accept_dt,
		sup_group.sup_arb_ready_dt,
		sup_group.sup_bill_create_dt
	from	sup_group
	where	sup_group.sup_group_id = @input_sup_group_id

GO

