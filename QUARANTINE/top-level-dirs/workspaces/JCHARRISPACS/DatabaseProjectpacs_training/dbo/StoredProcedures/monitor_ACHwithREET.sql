

CREATE procedure [dbo].[monitor_ACHwithREET]  

/*****
This monitor was written for Benton Treasurer to provide a list of properties in Monthy (ACH-MO) or Semi-Annual (ACH-SA) ACH 
and had a REET completed on it.

{Call monitor_ACHwithREET ('5/1/2017', '5/31/2017')}
****/

  
@begin_date datetime,  
@end_date datetime  
  
as  
  
SET NOCOUNT ON   
  

select r.reet_id, r.excise_number, r.completion_date, r.export_date, rip.prop_id, p.geo_id, pga.prop_group_cd,
	s.name as seller_name, b.name as buyer_name
from reet r with(nolock)
join reet_import_property rip with(nolock)
	on rip.reet_id = r.reet_id
join property p with(Nolock)
	on p.prop_id = rip.prop_id
join reet_import_account b with(nolock)
	on b.reet_id = r.reet_id
	and b.account_type_cd = 'B'
join reet_import_account s with(nolock)
	on s.reet_id = r.reet_id
	and s.account_type_cd = 'S'
join prop_group_assoc pga with(nolock)
	on pga.prop_id = rip.prop_id
	and pga.prop_group_cd in ('ACH-MO', 'ACH-SA')
where r.completion_date >=  @begin_date
and r.completion_date <= @end_date

GO

