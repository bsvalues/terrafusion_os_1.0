

create view dbo.lease_header_vw
as
select
	l.lease_id,
	l.lease_yr,
	l.rev_num,
	l.lease_name,
	l.operator,
	l.rrc_number,
	l.field_id,
	l.abstract,
	l.geo_info,
	l.well_type,
	l.state_cd,
	l.gatherer_cd,
	l.appraiser_id,
	l.prior_yr_ri,
	l.prior_yr_wi,
	l.prior_yr_1_8,
	l.prior_yr_7_8,
	l.curr_yr_values_are_1_8_7_8,
	l.curr_yr_value_ri_1_8,
	l.curr_yr_value_wi_7_8,
	isnull(dbo.fn_LeaseGetRIValue(l.lease_id, l.lease_yr, l.rev_num), 0) as curr_yr_ri,
	isnull(dbo.fn_LeaseGetORValue(l.lease_id, l.lease_yr, l.rev_num), 0) as curr_yr_or,
	isnull(dbo.fn_LeaseGetWIValue(l.lease_id, l.lease_yr, l.rev_num), 0) as curr_yr_wi,
	isnull(dbo.fn_LeaseGet_1_8_Value(l.lease_id, l.lease_yr, l.rev_num), 0) as curr_yr_1_8,
	isnull(dbo.fn_LeaseGet_7_8_Value(l.lease_id, l.lease_yr, l.rev_num), 0) as curr_yr_7_8,
	l.lease_dt,
	isnull(l.participation_pct, 0.0) as participation_pct,
	isnull(l.zero_value, 0) as zero_value,
	l.comment,
	l.last_change_dt,
	l.value_distrib_dt,
	l.legal_rebuild_dt,
	l.lease_inactive_dt,
	isnull(dbo.fn_LeaseGetEntities(l.lease_id, l.lease_yr, l.rev_num), '') as entities,
	l.rev_comment,
	l.create_dt,
	l.sup_cd,
	l.sup_desc,
	l.sup_group_id,
	l.sup_num,
	rtrim(isnull(sg.status_cd, '')) as status_cd,
	isnull(dbo.fn_LeaseGetPropertyCount(l.lease_id, l.lease_yr, l.rev_num), 0) as property_count,
	isnull(dbo.fn_LeaseGetTotalWIInterest(l.lease_id, l.lease_yr, l.rev_num), 0.0) as total_wi_interest,
	isnull(dbo.fn_LeaseGetTotalORInterest(l.lease_id, l.lease_yr, l.rev_num), 0.0) as total_or_interest,
	isnull(dbo.fn_LeaseGetTotalRIInterest(l.lease_id, l.lease_yr, l.rev_num), 0.0) as total_ri_interest,
	isnull(dbo.fn_LeaseGetTotalInterest(l.lease_id, l.lease_yr, l.rev_num), 0.0) as total_interest,
	isnull(dbo.fn_LeaseGetTotalWIAssessed(l.lease_id, l.lease_yr, l.rev_num), 0) as total_wi_assessed,
	isnull(dbo.fn_LeaseGetTotalORAssessed(l.lease_id, l.lease_yr, l.rev_num), 0) as total_or_assessed,
	isnull(dbo.fn_LeaseGetTotalRIAssessed(l.lease_id, l.lease_yr, l.rev_num), 0) as total_ri_assessed,
	isnull(dbo.fn_LeaseGetTotalAssessed(l.lease_id, l.lease_yr, l.rev_num), 0) as total_assessed
from
	lease as l with (nolock)
left outer join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = l.sup_group_id

GO

