
CREATE PROCEDURE [dbo].[monitor_SAListingByYearByAgency]



/***************

This monitor was providing a listing for Special Asessment Agency properties for a specified year.
It includes deleted properties.  If prop_inactive_dt has a date it means the property is deleted in the year layer specified.

{Call monitor_SAListingByYearByAgency (540, 2021)}
***************/


@agency_id int,
@year		int



as





select pspa.prop_id, p.geo_id, pspa.agency_id, saa.assessment_description, pv.sup_num, pv.prop_inactive_dt
from property_special_assessment pspa
join property_val pv with(nolock)
	on pv.prop_id = pspa.prop_id
	and pv.prop_val_yr = pspa.year
	and pv.sup_num = pspa.sup_num
join prop_supp_assoc psa with(nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
join property p with (nolock)
	on pv.prop_id = p.prop_id
join special_assessment_agency saa with (nolock)
	on pspa.agency_id = saa.agency_id
where pspa.agency_id = @agency_id
and pv.prop_val_yr = @year

GO

