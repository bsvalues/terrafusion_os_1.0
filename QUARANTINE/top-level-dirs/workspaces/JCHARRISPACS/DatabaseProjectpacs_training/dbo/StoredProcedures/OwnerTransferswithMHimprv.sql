
--monitor command to run this monitor -- {call OwnerTransferswithMHimprv('2009', '4/5/2008', '12/31/2009')}
--client needs to modify the dates and year

CREATE procedure [dbo].[OwnerTransferswithMHimprv]

@prop_val_yr numeric(4,0),
@begin_date	datetime,
@end_date	datetime 

as
--for testing uncomment the 6 lines below and comment out above 3 lines
--declare @prop_val_yr numeric(4,0)
--declare @begin_date	datetime
--declare @end_date	datetime 
--
--set @prop_val_yr = 2009
--set @begin_date = '04/05/2008'
--set @end_date = '12/31/2009'

SELECT pv.prop_id, pv.prop_val_yr, e.event_date, e.event_type, e.event_desc,
e.pacs_user
FROM property_val pv WITH (nolock) 

INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id

INNER JOIN prop_event_assoc pea with (nolock) ON
	pv.prop_id = pea.prop_id

INNER JOIN event e WITH (nolock) ON
	pea.event_id = e.event_id

WHERE pv.prop_val_yr = @prop_val_yr 
AND e.event_date between @begin_date and @end_date
AND e.event_desc = 'Ownership Transfer'
AND p.prop_type_cd <> 'MH'
AND pv.prop_id in (select prop_id from imprv_detail with (nolock)
				   where imprv_det_type_cd like 'MH%'
				   and prop_val_yr = @prop_val_yr)
ORDER BY e.event_date

GO

