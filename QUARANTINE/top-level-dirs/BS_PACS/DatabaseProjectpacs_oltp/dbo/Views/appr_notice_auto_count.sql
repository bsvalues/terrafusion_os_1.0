






create view appr_notice_auto_count
as
select notice_yr, notice_num, count(*)as auto_count
from appr_notice_prop_list
where appr_notice_prop_list.prop_type_cd = 'A'
group by notice_yr, notice_num

GO

