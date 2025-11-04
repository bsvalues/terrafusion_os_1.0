
create procedure WAUndoApprNotice  
 
@input_notice_yr numeric(4),  
@input_notice_num int  
  
as  

/* put group codes back on property */  
insert into  
 prop_group_assoc  
(  
 prop_id,  
 prop_group_cd  
)  
select  
 wanpgc.prop_id,  
 wanpgc.code  
from  
 wash_appraisal_notice_prop_group_code as wanpgc with (nolock)  
inner join  
 wash_appraisal_notice_prop_info as wanpi with (nolock)  
on  
 wanpi.notice_year = wanpgc.notice_year  
and wanpi.notice_run_id = wanpgc.notice_run_id
and wanpi.prop_id = wanpgc.prop_id  
where  
 wanpgc.notice_year = @input_notice_yr  
and wanpgc.notice_run_id = @input_notice_num  
and not exists  
(  
 select  
  *  
 from  
  prop_group_assoc as pga with (nolock)  
 where  
  pga.prop_id = wanpgc.prop_id  
 and pga.prop_group_cd = wanpgc.code  
)  
group by  
 wanpgc.prop_id,  
 wanpgc.code  
  
  
/* backward compatibility */  
 
  
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
  

  
delete from wash_appraisal_notice_prop_group_code
where notice_run_id = @input_notice_num  
and   notice_year  = @input_notice_yr  

delete from wash_appraisal_notice_personal_segment_info
where notice_run_id = @input_notice_num
and notice_year = @input_notice_yr
  
delete from wash_appraisal_notice_prop_info   
where notice_run_id = @input_notice_num  
and   notice_year  = @input_notice_yr  

delete from wash_appraisal_notice_master_lease_info
where notice_run_id = @input_notice_num  
and notice_year = @input_notice_yr  
  
delete from wash_appraisal_notice_selection_criteria_code  
where notice_run_id = @input_notice_num  
and   notice_year  = @input_notice_yr  
  
delete from wash_appraisal_notice_selection_criteria   
where notice_run_id = @input_notice_num  
and   notice_year  = @input_notice_yr  
  
drop table #tmp

GO

