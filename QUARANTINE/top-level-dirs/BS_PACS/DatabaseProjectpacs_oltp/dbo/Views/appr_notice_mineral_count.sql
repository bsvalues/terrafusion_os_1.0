









create view appr_notice_mineral_count
as
select notice_yr, notice_num, count(*)as mineral_count
from appr_notice_prop_list
where appr_notice_prop_list.prop_type_cd = 'MN'
group by notice_yr, notice_num

GO

