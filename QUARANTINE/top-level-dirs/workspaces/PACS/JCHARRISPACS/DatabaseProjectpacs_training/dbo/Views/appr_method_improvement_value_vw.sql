
create view appr_method_improvement_value_vw
as

	select
		v.*,
		value_hs = convert(
			numeric(14,0),
			case
				when v.hs_flag = 0
				then 0
				else
					case
						when v.hs_pct_override = 0
						then v.value
						else round(v.hs_pct * v.value, 0)
					end
			end
		),
		value_nhs = convert(
			numeric(14,0),
			v.value -
			case
				when v.hs_flag = 0
				then 0
				else
					case
						when v.hs_pct_override = 0
						then v.value
						else round(v.hs_pct * v.value, 0)
					end
			end
		)
	from appr_method_improvement_vw as v with(nolock)

GO

