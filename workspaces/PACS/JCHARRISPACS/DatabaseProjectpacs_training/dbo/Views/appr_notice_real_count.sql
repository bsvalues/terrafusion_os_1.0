









create view appr_notice_real_count
as
select notice_yr, notice_num, count(*)as real_count
from appr_notice_prop_list
where appr_notice_prop_list.prop_type_cd = 'R'
group by notice_yr, notice_num

GO

