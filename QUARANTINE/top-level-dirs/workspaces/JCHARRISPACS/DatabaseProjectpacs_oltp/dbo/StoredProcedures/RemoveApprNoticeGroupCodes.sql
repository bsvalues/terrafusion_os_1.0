








CREATE PROCEDURE RemoveApprNoticeGroupCodes 

@input_notice_yr	numeric(4),
@input_notice_num	int

as


delete
	prop_group_assoc
from
	appr_notice_prop_list_group_code as anplgc with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anplgc.prop_id
and	pga.prop_group_cd = anplgc.prop_group_cd
inner join
	appr_notice_prop_list as anpl with (nolock)
on
	anpl.notice_yr = anplgc.notice_yr
and	anpl.notice_num = anplgc.notice_num
and	anpl.prop_id = anplgc.prop_id
where
	anplgc.notice_yr = @input_notice_yr
and	anplgc.notice_num = @input_notice_num	



/* pseudo - backward compatibility */
delete
	prop_group_assoc
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anpl.prop_id
and	pga.prop_group_cd = '25.19a'
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num	
and	anpl.code_x19a = 'T'



delete
	prop_group_assoc
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anpl.prop_id
and	pga.prop_group_cd = '25.19ac'
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num	
and	anpl.code_x19ac = 'T'





delete
	prop_group_assoc
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anpl.prop_id
and	pga.prop_group_cd = '25.19i'
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num	
and	anpl.code_x19i = 'T'





delete
	prop_group_assoc
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anpl.prop_id
and	pga.prop_group_cd = '25.19ic'
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num	
and	anpl.code_x19ic = 'T'






delete
	prop_group_assoc
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anpl.prop_id
and	pga.prop_group_cd = 'X25.19a'
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num




delete
	prop_group_assoc
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anpl.prop_id
and	pga.prop_group_cd = 'X25.19i'
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num	




delete
	prop_group_assoc
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	prop_group_assoc as pga with (nolock)
on
	pga.prop_id = anpl.prop_id
and	pga.prop_group_cd = 'FN'
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num
and	anpl.code_fn = 'T'

GO

