
create procedure CalculateTaxableSelectSpecialExemption
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select
			case 
				when o.udi_child_prop_id is null then sp.prop_id
				else o.udi_child_prop_id
			end
			,
			sp.owner_id,
			sp.entity_id,
			upper(rtrim(sp.exmpt_type_cd)),
			isnull(sp.sp_amt, 0.0),
			isnull(sp.sp_pct, 0.0),
			isnull(sp.sp_segment_amt, 0.0),
			upper(rtrim(sp.sp_value_type)),
			upper(rtrim(sp.sp_value_option))
		from property_special_entity_exemption as sp with(nolock)
		left outer join owner as o with(nolock) on
			sp.prop_id = o.prop_id and
			sp.exmpt_tax_yr = o.owner_tax_yr and
			sp.sup_num = o.sup_num and
			sp.owner_id = o.owner_id
		where
			sp.prop_id in (
				select prop_id from #totals_prop_list
			) and
			sp.exmpt_tax_yr = @lYear and
			sp.owner_tax_yr = @lYear and
			sp.sup_num = @lSupNum and
			sp.entity_id in (
				select entity_id from #totals_entity_list
			)
		order by 1 asc, sp.owner_id asc, sp.entity_id asc, sp.exmpt_type_cd asc
	end
	else
	begin
		select
			case 
				when o.udi_child_prop_id is null then sp.prop_id
				else o.udi_child_prop_id
			end
			,
			sp.owner_id,
			sp.entity_id,
			upper(rtrim(sp.exmpt_type_cd)),
			isnull(sp.sp_amt, 0.0),
			isnull(sp.sp_pct, 0.0),
			isnull(sp.sp_segment_amt, 0.0),
			upper(rtrim(sp.sp_value_type)),
			upper(rtrim(sp.sp_value_option))
		from property_special_entity_exemption as sp with(nolock)
		left outer join owner as o with(nolock) on
			sp.prop_id = o.prop_id and
			sp.exmpt_tax_yr = o.owner_tax_yr and
			sp.sup_num = o.sup_num and
			sp.owner_id = o.owner_id
		where
			sp.exmpt_tax_yr = @lYear and
			sp.owner_tax_yr = @lYear and
			sp.sup_num = @lSupNum
		order by 1 asc, sp.owner_id asc, sp.entity_id asc, sp.exmpt_type_cd asc
	end

	return(@@rowcount)

GO

