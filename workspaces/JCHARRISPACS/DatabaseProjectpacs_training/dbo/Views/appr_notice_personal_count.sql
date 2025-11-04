









create view appr_notice_personal_count
as
select notice_yr, notice_num, count(*)as personal_count
from appr_notice_prop_list
where appr_notice_prop_list.prop_type_cd = 'P'
group by notice_yr, notice_num

GO

