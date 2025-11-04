

create view arb_notice_values_vw
as

select
	anpl.notice_yr,
	anpl.notice_num,
	anpl.prop_id,
	anpl.owner_id,
	anpl.sup_num,
	anpl.sup_yr,
	anpl.notice_owner_id,
	anpl.an_land_hstd_val,
	anpl.an_land_non_hstd_val,
	anpl.an_imprv_hstd_val,
	anpl.an_imprv_non_hstd_val,
	anpl.an_ag_land_use_val,
	anpl.an_ag_land_mkt_val,
	anpl.an_timber_use,
	anpl.an_timber_market,
	anpl.an_market_val,
	anpl.an_appraised_val,
	anpl.an_ten_percent_cap,
	anpl.an_assessed_val,
	cast(0 as numeric(14,0)) as an_rendered_val,
	anpl.exemption as exemptions,
	dbo.fn_GetApprNoticeEntities(anpl.notice_yr, anpl.notice_num, anpl.prop_id, anpl.sup_num, anpl.sup_yr, anpl.owner_id)  as entities,
	ansc.arb_protest_due_dt
from
	appr_notice_prop_list as anpl with (nolock)
inner join
(
	select
		notice_yr,
		max(notice_num) as notice_num,
		prop_id
	from
		appr_notice_prop_list with (nolock)
	group by
		notice_yr,
		prop_id
) current_notice
on
	current_notice.notice_yr = anpl.notice_yr
and	current_notice.notice_num = anpl.notice_num
and	current_notice.prop_id = anpl.prop_id
inner join
	appr_notice_selection_criteria as ansc with (nolock)
on
	ansc.notice_yr = anpl.notice_yr
and	ansc.notice_num = anpl.notice_num

GO

