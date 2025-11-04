









create view appr_notice_mobile_count
as
select notice_yr, notice_num, count(*)as mobile_count
from appr_notice_prop_list
where appr_notice_prop_list.prop_type_cd = 'MH'
group by notice_yr, notice_num

GO

