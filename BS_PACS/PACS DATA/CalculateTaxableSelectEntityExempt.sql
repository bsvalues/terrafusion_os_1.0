
create procedure CalculateTaxableSelectEntityExempt
	@lYear numeric(4,0),
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select
			entity_id,
			upper(rtrim(exmpt_type_cd)),
			isnull(local_option_pct, 0.0),
			isnull(state_mandate_amt, 0),
			isnull(local_option_min_amt, 0),
			isnull(local_option_amt, 0)
		from entity_exmpt with(nolock)
		where
			entity_id in (
				select entity_id from #totals_entity_list
			) and
			exmpt_tax_yr = @lYear
		order by entity_id asc, exmpt_type_cd asc
	end
	else
	begin
		select
			entity_id,
			upper(rtrim(exmpt_type_cd)),
			isnull(local_option_pct, 0.0),
			isnull(state_mandate_amt, 0),
			isnull(local_option_min_amt, 0),
			isnull(local_option_amt, 0)
		from entity_exmpt with(nolock)
		where
			exmpt_tax_yr = @lYear
		order by entity_id asc, exmpt_type_cd asc
	end

	return(@@rowcount)

GO

