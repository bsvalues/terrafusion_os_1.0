
--monitor command to run this monitor -- {call OwnerTransferRemoveTotalEX('2009', '4/5/2008', '12/31/2009')}
--client needs to modify the dates and year

CREATE procedure [dbo].[OwnerTransferRemoveTotalEX]

@prop_val_yr numeric(4,0),
@begin_date	datetime,
@end_date	datetime 

as
---for testing remove uncomment the 6 lines below and comment out above 3 lines
--declare @prop_val_yr numeric(4,0)
--declare @begin_date	datetime
--declare @end_date	datetime 
--
--set @prop_val_yr = 2009
--set @begin_date = '04/05/2008'
--set @end_date = '12/31/2009'

SELECT DISTINCT pv.prop_id, pv.prop_val_yr, --e.event_date,
e.event_type as Date_Type, e.event_desc

FROM property_val pv WITH (nolock) 

INNER JOIN prop_event_assoc pea with (nolock) ON
	pv.prop_id = pea.prop_id

INNER JOIN event e WITH (nolock) ON
	pea.event_id = e.event_id

WHERE pv.prop_val_yr = @prop_val_yr 
AND e.event_date between @begin_date and @end_date
AND e.event_desc = 'Ownership Transfer'
and pv.prop_id in (select prop_id from property_exemption
				   where exmpt_type_cd = 'EX'
				   and owner_tax_yr = @prop_val_yr - 1)
and pv.prop_id not in (select prop_id from property_exemption
					   where exmpt_type_cd = 'EX'
					   and owner_tax_yr = @prop_val_yr)

GO

