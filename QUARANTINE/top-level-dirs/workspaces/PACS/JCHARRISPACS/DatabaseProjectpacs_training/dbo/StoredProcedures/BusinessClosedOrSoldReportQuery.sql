
CREATE  PROCEDURE BusinessClosedOrSoldReportQuery

	@datasetID int,
	@searchYear int,
	@inclDeleted bit,
	@closeFrom datetime = null,
	@closeTo datetime = null,
	@soldFrom datetime = null,
	@soldTo datetime = null

AS

insert into ##business_closed_or_sold
(
	[dataset_id],
	[prop_id],
	[geo_id],
	[file_as_name],
	[dba_name],
	[situs_display],
	[prop_sic_cd],
	[ubi_number],
	[market],
	[business_close_dt],
	[business_sold_dt]
)
select 
	@datasetID,
	pv.prop_id,
	p.geo_id,
	ac.file_as_name,
	p.dba_name,
	s.situs_display,
	p.prop_sic_cd,
	pv.ubi_number,
	pv.market,
	pv.business_close_dt,
	pv.business_sold_dt
from
	property_val pv with(nolock)
	join property p with(nolock)
		on p.prop_id = pv.prop_id
	join owner as o with(nolock) 
		on o.owner_tax_yr = pv.prop_val_yr and
		o.sup_num = pv.sup_num and
		o.prop_id = pv.prop_id
	join account as ac with(nolock) 
		on ac.acct_id = o.owner_id
	join situs s with(nolock)
		on pv.prop_id = s.prop_id
where
	(@searchYear = -1 or pv.prop_val_yr = @searchYear)
	and (@closeFrom is null or pv.business_close_dt > @closeFrom)
	and (@closeTo is null or pv.business_close_dt < @closeTo)
	and (@soldFrom is null or pv.business_sold_dt > @soldFrom)
	and (@soldTo is null or pv.business_sold_dt < @soldTo)
	and (@inclDeleted = 1 or (isnull(pv.prop_inactive_dt,'') = '' or isnull(pv.udi_parent,'') = 'T' or 
		isnull(pv.prop_state, '') = 'P'))

GO

