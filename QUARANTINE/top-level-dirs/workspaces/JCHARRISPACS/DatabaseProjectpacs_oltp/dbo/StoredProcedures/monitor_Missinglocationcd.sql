




---here is how you set up the monitor call:  {Call monitor_Missinglocationcd}    

/*  

This monitor was created for Benton to mimic the excise detail report but to include all payments
related to REET in a given month including voids.

*/

CREATE procedure [dbo].[monitor_Missinglocationcd]          

     

as          

set nocount on          


--select r.reet_id, r.excise_number, r.export_date, r.tax_area_id, rip.prop_id, rip.location_cd	---0
--from reet r with(Nolock)
--left join reet_import_property rip with(nolock)
--	on rip.reet_id = r.reet_id
--where r.export_date = @export_date
--and location_cd is NULL

select r.reet_id, r.excise_number, r.export_date, r.tax_area_id, rip.prop_id, rip.location_cd	---0
from reet r with(Nolock)
left join reet_import_property rip with(nolock)
	on rip.reet_id = r.reet_id
where location_cd is NULL
and excise_number is not NULL


set nocount off

GO

