
create procedure CalculateTaxableSelectEntity
	@lYear numeric(4,0),
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select
			e.entity_id,
			upper(rtrim(e.entity_type_cd)),
			upper(rtrim(e.weed_control)),
			isnull(t.m_n_o_tax_pct, 0.0),
			isnull(t.i_n_s_tax_pct, 0.0),
			isnull(t.prot_i_n_s_tax_pct, 0.0),
			isnull(t.weed_control_pct, 0.0),
			isnull(e.enable_timber_78, 0)
			from entity as e with(nolock)
			left outer join tax_rate as t with(nolock) on
				e.entity_id = t.entity_id and
				t.tax_rate_yr = @lYear
		where
			e.entity_id in (
				select entity_id from #totals_entity_list
			)
		order by e.entity_id asc
	end
	else
	begin
		select
			e.entity_id,
			upper(rtrim(e.entity_type_cd)),
			upper(rtrim(e.weed_control)),
			isnull(t.m_n_o_tax_pct, 0.0),
			isnull(t.i_n_s_tax_pct, 0.0),
			isnull(t.prot_i_n_s_tax_pct, 0.0),
			isnull(t.weed_control_pct, 0.0),
			isnull(e.enable_timber_78, 0)
			from entity as e with(nolock)
			left outer join tax_rate as t with(nolock) on
				e.entity_id = t.entity_id and
				t.tax_rate_yr = @lYear
		order by e.entity_id asc
	end

	return(@@rowcount)

GO

