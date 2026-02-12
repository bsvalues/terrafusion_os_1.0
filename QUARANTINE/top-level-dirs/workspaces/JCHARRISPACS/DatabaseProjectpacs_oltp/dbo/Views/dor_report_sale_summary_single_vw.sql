
create view dor_report_sale_summary_single_vw

as

	select
		drr.dataset_id,
		drcs.[year],
		drcs.stratum_id,
		drcs.begin_value,
		drcs.end_value,
		num_sales = isnull(count(drs.chg_of_owner_id), 0),
		sum_assessed_value = isnull(sum(drs.assessed_value), 0),
		avg_assessed_value = convert(numeric(14,0), isnull(avg(drs.assessed_value), 0)),
		avg_adjusted_sale_price = convert(numeric(14,0), isnull(avg(drs.adjusted_sale_price), 0)),
		stratum_ratio = convert(
			numeric(14,6),
			case
				when isnull(avg(drs.adjusted_sale_price), 0) > 0
				then isnull(sum(drs.assessed_value), 0) / isnull(sum(drs.adjusted_sale_price), 0)
				else 0
			end
			* 100
		),
		market_to_actual_assessed = convert(
			numeric(14,0),
			case
				when
					case -- stratum_ratio
						when isnull(avg(drs.adjusted_sale_price), 0) > 0
						then isnull(sum(drs.assessed_value), 0) / isnull(sum(drs.adjusted_sale_price), 0)
						else 0
					end  -- stratum_ratio
					> 0
				then
					convert(numeric(18,6), isnull(sum(drs.assessed_value), 0))
					/
					convert(
						numeric(14,6),
						case -- stratum_ratio
							when isnull(avg(drs.adjusted_sale_price), 0) > 0
							then isnull(sum(drs.assessed_value), 0) / isnull(sum(drs.adjusted_sale_price), 0)
							else 0
						end  -- stratum_ratio
					)
				else 0
			end
		)
	from dor_report_config_stratum as drcs with(nolock)
	join dor_report_run as drr with(nolock) on
		0 = 0
	left outer join dor_report_sale as drs with(nolock) on
		drs.dataset_id = drr.dataset_id and
		drs.stratum_id = drcs.stratum_id and
		drs.senior_flag = 0 and
		drs.forestland_flag = 0 and
		drs.timberland_flag = 0
	where
		drcs.[type] = 'R'
		and drcs.group_type = 'R'
		and drcs.year = drs.year
		and drs.prop_type_cd = 'R'  -- real properties only
	group by
		drr.dataset_id,
		drcs.[year],
		drcs.stratum_id,
		drcs.begin_value,
		drcs.end_value

GO

