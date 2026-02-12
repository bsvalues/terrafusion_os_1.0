
create procedure RecalcSelectSpecialEntityExemption
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				see.prop_id,
				convert(smallint, see.exmpt_tax_yr),
				convert(smallint, see.sup_num),
				upper(rtrim(see.exmpt_type_cd)),
				see.owner_id,
				see.entity_id,
				upper(rtrim(see.sp_value_type)),
				upper(rtrim(see.sp_value_option)),
				see.sp_pct
			from #recalc_prop_list as rpl with(nolock)
			join property_special_entity_exemption as see with(nolock) on
				rpl.prop_id = see.prop_id and
				rpl.sup_yr = see.exmpt_tax_yr and
				rpl.sup_num = see.sup_num and
				see.sp_value_type in ('P','S')
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				see.prop_id,
				convert(smallint, see.exmpt_tax_yr),
				convert(smallint, see.sup_num),
				upper(rtrim(see.exmpt_type_cd)),
				see.owner_id,
				see.entity_id,
				upper(rtrim(see.sp_value_type)),
				upper(rtrim(see.sp_value_option)),
				see.sp_pct
			from property_special_entity_exemption as see with(nolock)
			where
				see.exmpt_tax_yr = @lYear and
				see.sup_num = @lSupNum and
				see.sp_value_type in ('P','S')
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc
		end
		else
		begin
			select
				see.prop_id,
				convert(smallint, see.exmpt_tax_yr),
				convert(smallint, see.sup_num),
				upper(rtrim(see.exmpt_type_cd)),
				see.owner_id,
				see.entity_id,
				upper(rtrim(see.sp_value_type)),
				upper(rtrim(see.sp_value_option)),
				see.sp_pct
			from property_special_entity_exemption as see with(nolock)
			where
				see.prop_id = @lPropID and
				see.exmpt_tax_yr = @lYear and
				see.sup_num = @lSupNum and
				see.sp_value_type in ('P','S')
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc
		end
	end

	return( @@rowcount )

GO

