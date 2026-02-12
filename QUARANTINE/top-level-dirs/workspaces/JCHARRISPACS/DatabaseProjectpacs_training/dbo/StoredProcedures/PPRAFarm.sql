
create procedure PPRAFarm
	@dataset_id int,
	@property_list_dataset_id int,
	@year numeric(4,0),
	@sort_order int = 0,  -- 0 = name, 1 = geo ID, 2 = ZIP, 3 = prop ID
	@numberOfCopies int

as

set nocount on

delete ##ppra_farm_run
where dataset_id = @dataset_id

delete ##ppra_farm
where dataset_id = @dataset_id


-- print run information

insert ##ppra_farm_run (dataset_id, appraisal_year)
select top 1 @dataset_id, appr_yr
from pacs_system

update ##ppra_farm_run
set county_name = sa.county_name,
county_logo_blob = sa.county_logo_blob,
county_address = (
	case when isnull(addr_line1, '') <> '' then addr_line1 + char(13) else '' end +
	case when isnull(addr_line2, '') <> '' then addr_line2 + char(13) else '' end +
	case when isnull(addr_line3, '') <> '' then addr_line3 + char(13) else '' end +
	isnull(city,'') + ', ' + isnull(state,'') + ' ' + isnull(zip,'')
)
from system_address sa
where system_type = 'A'
and dataset_id = @dataset_id

declare @instructions_year numeric(4,0)
set @instructions_year = 0

if exists (select 1 from pp_rendition_application_config where year = @year)
	set @instructions_year = @year

update ##ppra_farm_run
set farm_contact_info = c.farm_contact_info
from pp_rendition_application_config c
where c.year = @instructions_year
and dataset_id = @dataset_id

-- blank copies wanted --
if @numberOfCopies > 0 --AND @numberOfCopies is not null
begin
	while @numberOfCopies > 0
	begin
		insert into ##ppra_farm (dataset_id, prop_id, year, segment_id)
		values (@dataset_id, -@numberOfCopies, @year, 0)

		set @numberOfCopies = @numberOfCopies - 1
	end
end

else
	begin
-- property information

	if object_id('#PPRAFarm_ppra_farm') is not null
		drop table #PPRAFarm_ppra_farm

	create table #PPRAFarm_ppra_farm
	(
		dataset_id int not null,
		prop_id int not null,
		year numeric(4,0) not null,
		sup_num int not null,
		ownerID int null,
		owner_name varchar(70) null,
		owner_address varchar(500) null,
		situs varchar(200) null,
		zip varchar(10) null,
		geo_id varchar(50) null,
		legal_description varchar(600) null,
		tax_area_number varchar(23)
	)

	insert #PPRAFarm_ppra_farm
	(dataset_id, prop_id, year, sup_num)
	select @dataset_id, p.prop_id, @year, psa.sup_num
	from ##ppra_property_list pl
	join property p with(nolock)
	on p.prop_id = pl.prop_id
	join prop_supp_assoc psa with(nolock)
	on p.prop_id = psa.prop_id
	and psa.owner_tax_yr = @year
	where pl.dataset_id = @property_list_dataset_id


	update f
	set ownerID = owner_id,
	owner_name = file_as_name,
	owner_address = ma.owner_address,
	zip = ma.addr_zip,
	geo_id = p.geo_id,
	legal_description = ld.legal_desc

	from #PPRAFarm_ppra_farm f

	cross apply
	(
		select top 1 geo_id
		from property with(nolock)
		where prop_id = f.prop_id
	) p

	cross apply
	(
		select top 1 owner_id
		from owner with(nolock)
		where prop_id = f.prop_id
		and owner_tax_yr = f.year
		and sup_num = f.sup_num
	) o

	cross apply
	(
		select top 1 file_as_name
		from account with(nolock)
		where acct_id = o.owner_id
	) oa

	outer apply
	(
		select top 1 (
			case when isnull(addr_line1, '') <> '' then addr_line1 + char(13) else '' end +
			case when isnull(addr_line2, '') <> '' then addr_line2 + char(13) else '' end +
			case when isnull(addr_line3, '') <> '' then addr_line3 + char(13) else '' end +
			isnull(addr_city,'') + ', ' + isnull(addr_state,'') + ' ' + isnull(addr_zip,'')+
			' ' + isnull(country_cd,'')
		) owner_address,
		addr_zip

		from address
		where acct_id = owner_id
		and primary_addr = 'Y'
	) ma

	--!!!LEGAL DESCRIPTION!!!--
	outer apply
	(
		select top 1 (
			case when isnull(legal_desc, '') <> '' then legal_desc + char(13) else '' end +
			case when isnull(legal_desc_2, '') <> '' then legal_desc_2 + char(13) else '' end
		)legal_desc

		from property_val pv
		where pv.prop_id = f.prop_id
		and pv.prop_val_yr = @year
	) ld

	where f.dataset_id = @dataset_id

	-- situs
	update f
	set situs = s.situs_display
	from #PPRAFarm_ppra_farm f
	join situs s with(nolock)
	on s.prop_id = f.prop_id
	and s.primary_situs = 'Y'

	--!!! TAX AREA NUMBER !!!---
	update f
	set tax_area_number = ta.tax_area_number
	from #PPRAFarm_ppra_farm f
	join property_tax_area pta
	on pta.year = f.year
	and pta.sup_num = f.sup_num
	and pta.prop_id = f.prop_id
	join tax_area ta
	on ta.tax_area_id = pta.tax_area_id

	-- copy to global temporary table
	declare @sort_sql varchar(max)
	set @sort_sql = case @sort_order
	when 0 then 'owner_name, geo_id, zip'
	when 1 then 'geo_id, owner_name, zip'
	when 2 then 'zip, owner_name, geo_id'
	else 'prop_id, owner_name'
	end

	declare @copy_sql varchar(max)
	set @copy_sql = '
	insert ##ppra_farm
	(dataset_id, prop_id, year, sup_num, owner_id, owner_name,  
	 owner_address, situs, legal_description, tax_area_number, sort_key)

	select dataset_id, prop_id, year, sup_num, ownerID, owner_name,
	owner_address, situs, legal_description, tax_area_number, 
	row_number() over(order by ' + @sort_sql + ')

	from #PPRAFarm_ppra_farm
	'

	exec (@copy_sql)
	drop table #PPRAFarm_ppra_farm

	-- assign segments
	declare @properties_per_segment int
	set @properties_per_segment = 1000

	select @properties_per_segment = szConfigValue
	from pacs_config with(nolock)
	where szGroup = 'SegmentedReports' 
	and szConfigName = 'RenditionApplicationFarm'

	update ##ppra_farm
	set segment_id = sort_key / @properties_per_segment
	where dataset_id = @dataset_id
end

GO

