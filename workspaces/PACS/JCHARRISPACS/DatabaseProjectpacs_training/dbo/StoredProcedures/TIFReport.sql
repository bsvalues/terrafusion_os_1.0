
create procedure dbo.TIFReport
	@dataset_id int,
	@year numeric(4,0) = -1,
	@filter_tax_areas varchar(max) = null
as

-- prepare
set nocount on

delete ##tif_report
where dataset_id = @dataset_id

if object_id('tempdb..#tif_areas') is not null
drop table #tif_areas


-- select LTIF Areas
select distinct tal.tif_area_id, tal.year
into #tif_areas
from tif_area_levy tal

join tif_area_tax_area_assoc tataa
on tataa.tif_area_id = tal.tif_area_id

where ((@year <= 0) or (tal.year = @year))
and (@filter_tax_areas is null or tataa.tax_area_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_tax_areas)))

create index tdprop_index on #tif_areas (tif_area_id, year)


-- sum property values for each LTIF Area
insert ##tif_report
(dataset_id, year, tif_area_id, tif_area_name, 
	base_value, taxable_value, market, nc, state_increase, increment,
	tax_area_numbers, tax_districts)


select @dataset_id dataset_id,
	tas.year, tas.tif_area_id, 
	ta.name tif_area_name, 
	props.base_value, props.taxable_value,
	props.market, props.nc, props.state_increase, props.increment,
	y.tax_area_numbers, z.tax_districts

from #tif_areas tas

join tif_area ta with(nolock)
	on ta.tif_area_id = tas.tif_area_id

outer apply (
	select sum(x.taxable_value) taxable_value, sum(x.base_value) base_value,
		sum(x.market) market, sum(x.nc) nc, sum(x.state_increase) state_increase, 
		case when sum(x.taxable_value - x.base_value - x.nc - x.state_increase) > 0
			then sum(x.taxable_value - x.base_value - x.nc - x.state_increase)
			else 0 end as increment
	from tif_area_prop_assoc tapa

	left join owner o with(nolock)
		on o.prop_id = tapa.prop_id
		and o.owner_tax_yr = tapa.year
		and o.sup_num = tapa.sup_num

	left join tif_area_prop_values tapv with(nolock)
	on tapv.tif_area_id = tapa.tif_area_id
	and tapv.prop_id = tapa.prop_id

	left join wash_prop_owner_val wpov with(nolock)
		on wpov.prop_id = tapa.prop_id
		and wpov.year = tapa.year
		and wpov.sup_num = tapa.sup_num
		and wpov.owner_id = o.owner_id

	left join prop_supp_assoc psa_prev with(nolock)
		on psa_prev.prop_id = tapa.prop_id
		and psa_prev.owner_tax_yr = tapa.year - 1

	left join wash_prop_owner_val wpov_prev with(nolock)
		on wpov_prev.prop_id = psa_prev.prop_id
		and wpov_prev.year = psa_prev.owner_tax_yr
		and wpov_prev.sup_num = psa_prev.sup_num
		and wpov_prev.owner_id = o.owner_id

	outer apply (
		select 
			isnull(wpov.taxable_classified + wpov.taxable_non_classified, 0) taxable_value,
			isnull(tapv.base_value, 0) as base_value,
			isnull(wpov.market, 0) as market,
			isnull(wpov.new_val_hs + wpov.new_val_nhs + wpov.new_val_p, 0) nc,
			case when isnull(wpov.state_assessed,0) > isnull(wpov_prev.state_assessed,0)
				then isnull(wpov.state_assessed,0) - isnull(wpov_prev.state_assessed,0) else 0 end as state_increase
	) x

	where tapa.tif_area_id = tas.tif_area_id
	and tapa.year = tas.year

) props

outer apply (
	select dbo.CommaListConcatenate(ta.tax_area_number) tax_area_numbers
	from tif_area_tax_area_assoc tataa with(nolock)
	join tax_area ta with(nolock)
		on ta.tax_area_id = tataa.tax_area_id
	where tataa.tif_area_id = tas.tif_area_id
) y

outer apply (
	select dbo.CommaListConcatenate(distinct td.tax_district_desc) tax_districts
	from tif_area_levy tal with(nolock)
	join tax_district td
		on td.tax_district_id = tal.tax_district_id
	where tal.tif_area_id = tas.tif_area_id
	and tal.year = tas.year
) z


-- cleanup
drop table #tif_areas

GO

