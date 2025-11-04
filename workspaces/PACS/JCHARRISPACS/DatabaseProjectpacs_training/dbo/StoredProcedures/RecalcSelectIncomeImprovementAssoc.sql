
create procedure RecalcSelectIncomeImprovementAssoc
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
		select
			i.prop_id,
			convert(smallint, i.income_yr),
			convert(smallint, i.sup_num),
			i.imprv_id,
			i.income_id,
			i.included,
			i.value
		from #recalc_prop_list as rpl with(nolock)
		join income_imprv_assoc as i with(nolock) on
			rpl.prop_id = i.prop_id and
			rpl.sup_yr = i.income_yr and
			rpl.sup_num = i.sup_num and
			i.sale_id = 0
		order by 1, 2, 3, 4, 5
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				i.prop_id,
				convert(smallint, i.income_yr),
				convert(smallint, i.sup_num),
				i.imprv_id,
				i.income_id,
				i.included,
				i.value
			from income_imprv_assoc as i with(nolock)
			where
				i.income_yr = @lYear and
				i.sup_num = @lSupNum and
				i.sale_id = 0
			order by 1, 2, 3, 4, 5
		end
		else
		begin
			select
				i.prop_id,
				convert(smallint, i.income_yr),
				convert(smallint, i.sup_num),
				i.imprv_id,
				i.income_id,
				i.included,
				i.value
			from income_imprv_assoc as i with(nolock)
			where
				i.prop_id = @lPropID and
				i.income_yr = @lYear and
				i.sup_num = @lSupNum and
				i.sale_id = 0
			order by 1, 2, 3, 4, 5
		end
	end

	return( @@rowcount )

GO

