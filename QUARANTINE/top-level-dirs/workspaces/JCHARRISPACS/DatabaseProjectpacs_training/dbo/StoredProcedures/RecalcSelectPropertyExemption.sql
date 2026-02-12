
create procedure RecalcSelectPropertyExemption
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				pe.prop_id,
				convert(smallint, pe.exmpt_tax_yr),
				convert(smallint, pe.sup_num),
				convert(smallint, isnull(pe.qualify_yr, 0)),
				upper(rtrim(pe.exmpt_type_cd)),
				pe.effective_dt,
				pe.termination_dt
			from #recalc_prop_list as rpl with(nolock)
			join property_exemption as pe with(nolock) on
				rpl.prop_id = pe.prop_id and
				rpl.sup_yr = pe.exmpt_tax_yr and
				rpl.sup_num = pe.sup_num
			join owner as o with(nolock) on
				o.owner_tax_yr = pe.exmpt_tax_yr and
				o.owner_tax_yr = pe.owner_tax_yr and
				o.sup_num = pe.sup_num and
				o.prop_id = pe.prop_id and
				o.owner_id = pe.owner_id
			order by
				pe.prop_id asc,
				pe.exmpt_tax_yr asc,
				pe.sup_num asc,
				pe.qualify_yr desc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				pe.prop_id,
				convert(smallint, pe.exmpt_tax_yr),
				convert(smallint, pe.sup_num),
				convert(smallint, isnull(pe.qualify_yr, 0)),
				upper(rtrim(pe.exmpt_type_cd)),
				pe.effective_dt,
				pe.termination_dt
			from property_exemption as pe with(nolock)
			join owner as o with(nolock) on
				o.owner_tax_yr = pe.exmpt_tax_yr and
				o.owner_tax_yr = pe.owner_tax_yr and
				o.sup_num = pe.sup_num and
				o.prop_id = pe.prop_id and
				o.owner_id = pe.owner_id
			where
				pe.exmpt_tax_yr = @lYear and
				pe.sup_num = @lSupNum
			order by
				pe.prop_id asc,
				pe.exmpt_tax_yr asc,
				pe.sup_num asc,
				pe.qualify_yr desc
		end
		else
		begin
			select
				pe.prop_id,
				convert(smallint, pe.exmpt_tax_yr),
				convert(smallint, pe.sup_num),
				convert(smallint, isnull(pe.qualify_yr, 0)),
				upper(rtrim(pe.exmpt_type_cd)),
				pe.effective_dt,
				pe.termination_dt
			from property_exemption as pe with(nolock)
			join owner as o with(nolock) on
				o.owner_tax_yr = pe.exmpt_tax_yr and
				o.owner_tax_yr = pe.owner_tax_yr and
				o.sup_num = pe.sup_num and
				o.prop_id = pe.prop_id and
				o.owner_id = pe.owner_id
			where
				pe.prop_id = @lPropID and
				pe.exmpt_tax_yr = @lYear and
				pe.sup_num = @lSupNum
			order by
				pe.prop_id asc,
				pe.exmpt_tax_yr asc,
				pe.sup_num asc,
				pe.qualify_yr desc
		end
	end

	return( @@rowcount )

GO

