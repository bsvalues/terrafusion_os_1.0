



create procedure SupplementalRollSummaryEntityInfo
	@input_sup_group_id int,
	@input_user_id int

as

	select 	supp_roll_entity_list.entity_id,
		entity.entity_cd,
		account.file_as_name
	from	supp_roll_entity_list
	inner join entity
	on	supp_roll_entity_list.entity_id = entity.entity_id
	inner join account
	on	supp_roll_entity_list.entity_id = account.acct_id
	where	supp_roll_entity_list.sup_group_id = @input_sup_group_id
	and	supp_roll_entity_list.pacs_user_id = @input_user_id
	order by entity.entity_cd

GO

