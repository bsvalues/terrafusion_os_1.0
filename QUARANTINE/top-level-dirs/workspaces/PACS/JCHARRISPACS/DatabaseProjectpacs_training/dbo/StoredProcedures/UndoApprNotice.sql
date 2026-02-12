








CREATE procedure UndoApprNotice

@input_notice_yr	numeric(4),
@input_notice_num	int

as

/* put group codes back on property */
insert into
	prop_group_assoc
(
	prop_id,
	prop_group_cd
)
select
	anplgc.prop_id,
	anplgc.prop_group_cd
from
	appr_notice_prop_list_group_code as anplgc with (nolock)
inner join
	appr_notice_prop_list as anpl with (nolock)
on
	anpl.notice_yr = anplgc.notice_yr
and	anpl.notice_num = anplgc.notice_num
and	anpl.prop_id = anplgc.prop_id
where
	anplgc.notice_yr = @input_notice_yr
and	anplgc.notice_num = @input_notice_num
and	not exists
(
	select
		*
	from
		prop_group_assoc as pga with (nolock)
	where
		pga.prop_id = anplgc.prop_id
	and	pga.prop_group_cd = anplgc.prop_group_cd
)
group by
	anplgc.prop_id,
	anplgc.prop_group_cd


/* backward compatibility */
insert into
	prop_group_assoc
(
	prop_id,     
	prop_group_cd
)
select distinct
	prop_id,
	'25.19A'
from
	appr_notice_prop_list as anpl with (nolock)
where
	anpl.notice_yr = @input_notice_yr
and     anpl.notice_num = @input_notice_num
and     anpl.code_x19a = 'T' 
and     not exists
(
	select
		*
	from
		prop_group_assoc as pga with (nolock)
	where
		pga.prop_id = anpl.prop_id
	and	pga.prop_group_cd = '25.19A'
)


insert into
	prop_group_assoc
(
	prop_id,     
	prop_group_cd
)
select distinct
	prop_id,
	'25.19I'
from
	appr_notice_prop_list as anpl with (nolock)
where
	anpl.notice_yr = @input_notice_yr
and     anpl.notice_num = @input_notice_num
and     anpl.code_x19i = 'T' 
and     not exists
(
	select
		*
	from
		prop_group_assoc as pga with (nolock)
	where
		prop_id = anpl.prop_id
	and	prop_group_cd = '25.19I'
)




select event.event_id
into #tmp
from event
where ref_evt_type = 'AN'
	and ref_year = @input_notice_yr
	and ref_num = @input_notice_num

delete from prop_event_assoc
where event_id in (select event_id from #tmp)

--delete from event
--where event_id in (select event_id from #tmp)

delete from appr_notice_prop_list_entity_exemption 
where notice_num = @input_notice_num
and   notice_yr  = @input_notice_yr

delete from appr_notice_prop_list_exemption 
where notice_num = @input_notice_num
and   notice_yr  = @input_notice_yr

delete from appr_notice_prop_list_bill
where notice_num = @input_notice_num
and   notice_yr  = @input_notice_yr

delete from appr_notice_prop_list_group_code 
where notice_num = @input_notice_num
and   notice_yr  = @input_notice_yr

delete from appr_notice_prop_list 
where notice_num = @input_notice_num
and   notice_yr  = @input_notice_yr

delete from appr_notice_selection_criteria_group_codes
where notice_num = @input_notice_num
and   notice_yr  = @input_notice_yr

delete from appr_notice_selection_criteria 
where notice_num = @input_notice_num
and   notice_yr  = @input_notice_yr

drop table #tmp

GO

