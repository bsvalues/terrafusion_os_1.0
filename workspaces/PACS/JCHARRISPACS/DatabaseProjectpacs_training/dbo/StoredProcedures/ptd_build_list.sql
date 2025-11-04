




CREATE PROCEDURE ptd_build_list
@input_yr		numeric(4,0),
@input_sup_num		int

AS


set nocount on

delete from ptd_supp_assoc

insert into ptd_supp_assoc
(prop_id, sup_num, sup_yr)
select distinct prop_id, max(sup_num), sup_yr
from prop_owner_entity_val
where sup_num <= @input_sup_num
and   sup_yr = @input_yr
group by prop_id, sup_yr
order by prop_id


dbcc dbreindex (prop_owner_entity_val, '', 70)
dbcc dbreindex (property_entity_exemption, '', 70)
dbcc dbreindex (property_val, '', 70)
dbcc dbreindex (property, '', 70)
dbcc dbreindex (property_exemption, '', 70)
dbcc dbreindex (ptd_supp_assoc, '', 70)
dbcc dbreindex (property_owner_entity_state_cd, '', 70)
dbcc dbreindex (ptd_ajr, '', 70)

GO

