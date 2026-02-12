

/*
	This monitor returns all the props with the a REET
	event that do not have a corresponding 
	Ownership Transfer.
	
	Name: Reets events that do not have a corresponding Ownership Transfer event
	
	5 Variables:   @appryr is the year
				   @begin_date is the beginning REET date 
				   @end_date is the ending REET date 
				   @begin_date2 is the beginning Ownership Transfer date 
				   @end_date2 is the ending Ownership Transfer date
					
	command: {call ReetsNOOwnership (2015,'01/01/2015', '01/31/2015', '01/01/2015', '02/28/2015')}
*/

CREATE  procedure [dbo].[ReetsNOOwnership]

@appryr         int,
@begin_date		datetime,
@end_date		datetime,
@begin_date2	datetime,
@end_date2		datetime

AS


SELECT pv.prop_id, p.geo_id, e.event_date, e.event_type, ac.file_as_name, pv.legal_desc, 
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions,
pv.prop_val_yr
FROM property_val pv WITH (nolock)	
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id 
	AND pv.prop_val_yr = psa.owner_tax_yr 
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id
	AND p.prop_type_cd = 'R'
INNER JOIN owner o WITH (nolock) ON
	pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN account ac WITH (nolock) ON
	o.owner_id = ac.acct_id
INNER JOIN prop_event_assoc pea WITH (nolock) ON
	pv.prop_id = pea.prop_id
INNER JOIN event e WITH (nolock) ON
	pea.event_id = e.event_id
WHERE pv.prop_val_yr = @appryr
AND pv.prop_inactive_dt is null
AND e.event_type = 'REET'	
AND e.event_date between @begin_date and @end_date
AND pv.prop_id not in (select pea1.prop_id from prop_event_assoc pea1 with (nolock)
					   inner join event e1 with (nolock) on 
							pea1.event_id = e1.event_id
					   where e1.event_desc = 'Ownership Transfer'
					   and e1.event_date between @begin_date2 and @end_date2)
ORDER BY p.geo_id

GO

