
create view appr_method_land_value_vw
as

	select
		v.*,
		mkt_value_hs = convert(
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
		mkt_value_nhs = convert(
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
		),
		ag_value_hs = convert(
			numeric(14,0),
			case
				when v.hs_flag = 0
				then 0
				else
					case
						when v.hs_pct_override = 0
						then v.ag_value
						else round(v.hs_pct * v.ag_value, 0)
					end
			end
		),
		ag_value_nhs = convert(
			numeric(14,0),
			v.ag_value -
			case
				when v.hs_flag = 0
				then 0
				else
					case
						when v.hs_pct_override = 0
						then v.ag_value
						else round(v.hs_pct * v.ag_value, 0)
					end
			end
		)
	from appr_method_land_vw as v with(nolock)

GO

