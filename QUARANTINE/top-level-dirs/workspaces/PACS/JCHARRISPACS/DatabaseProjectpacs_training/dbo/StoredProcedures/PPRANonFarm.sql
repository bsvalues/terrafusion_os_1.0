
create procedure PPRANonFarm
	@dataset_id int,
	@property_list_dataset_id int,
	@year numeric(4,0),
	@sort_order int = 0,  -- 0 = name, 1 = geo ID, 2 = ZIP, 3 = prop ID
	@numberOfCopies int,
	@farm_dataset_id int,
	@asset_sort_order int

as

set nocount on

delete from ##ppra_nonfarm_run
where dataset_id = @dataset_id

delete ##ppra_nonfarm
where dataset_id = @dataset_id

delete from ##ppra_nonfarm_assets
where dataset_id = @dataset_id

-- print run information

insert ##ppra_nonfarm_run (dataset_id, appraisal_year)
select top 1 @dataset_id, appr_yr
from pacs_system

update ##ppra_nonfarm_run
set county_appraiser = sa.chief_appraiser,
county_name = sa.county_name,
county_phone = sa.phone_num + 
	case when isnull(sa.fax_num, '') <> '' then '  FAX: ' + sa.fax_num else '' end,
county_address = (
	case when isnull(addr_line1, '') <> '' then addr_line1 + char(13) else '' end +
	case when isnull(addr_line2, '') <> '' then addr_line2 + char(13) else '' end +
	case when isnull(addr_line3, '') <> '' then addr_line3 + char(13) else '' end +
	isnull(city,'') + ', ' + isnull(state,'') + ' ' + isnull(zip,'')
),
county_logo_blob = sa.county_logo_blob
from system_address sa
where system_type = 'A'

declare @instructions_year numeric(4,0)
set @instructions_year = 0

if exists (select 1 from pp_rendition_application_config where year = @year)
	set @instructions_year = @year

update ##ppra_nonfarm_run
set instructions_main = c.instructions_main,
instructions_supplies = c.instructions_supplies,
instructions_commercial = c.instructions_commercial,
instructions_farm = c.instructions_farm,
instructions_leased = c.instructions_leased,
instructions_penalty = c.instructions_penalty,
instructions_improvements = c.instructions_improvements,
instructions_cost = c.instructions_cost
from pp_rendition_application_config c
where c.year = @instructions_year

--Blank Copies---
if @numberOfCopies > 0
begin
	while @numberOfCopies > 0
	begin
		insert into ##ppra_nonfarm (dataset_id, prop_id, year, segment_id)
		values (@dataset_id, -@numberOfCopies, @year, 0)
		
		insert into ##ppra_nonfarm_assets (dataset_id, prop_id)
		values (@dataset_id, -@numberOfCopies)
		set @numberOfCopies = @numberOfCopies - 1
	end
end

else
	begin
		-- property information

		if object_id('tempdb..#PPRANonFarm_ppra_nonfarm') is not null
			drop table #PPRANonFarm_ppra_nonfarm

		create table #PPRANonFarm_ppra_nonfarm
		(
			dataset_id int not null,
			prop_id int not null,
			year numeric(4,0) not null,
			sup_num int not null,
			ubi varchar(50) null,
			subtype varchar(5) null,
			sic_code char(10) null,
			ownerID int null,
			owner_name varchar(70) null,
			owner_phone	varchar(20) null,
			owner_fax varchar(20) null,
			owner_email varchar(50) null,
			owner_address varchar(500) null,
			dba_name varchar(50) null,
			situs varchar(200) null,
			linked_real_prop_id int null,
			zip varchar(10) null,
			geo_id varchar(50) null,
			legal_description varchar(600) null,
			tax_area_number varchar(23),
			linked_real_prop_list varchar(max) null,

			primary key clustered (year, sup_num, prop_id)
			with (fillfactor = 90)
		)

		insert #PPRANonFarm_ppra_nonfarm
		(dataset_id, prop_id, year, sup_num, sic_code)
		select distinct @dataset_id, p.prop_id, @year, psa.sup_num, p.prop_sic_cd
		from ##ppra_property_list pl
		join property p with(nolock)
		on p.prop_id = pl.prop_id
		join prop_supp_assoc psa with(nolock)
		on p.prop_id = psa.prop_id
		and psa.owner_tax_yr = @year
		where pl.dataset_id = @property_list_dataset_id


		update nf
		set ownerID = owner_id,
		owner_name = file_as_name,
		owner_phone = primary_phone_num,
		owner_fax = fax_phone_num,
		owner_email = oa.email_addr,
		owner_address = ma.owner_address,
		dba_name = p.dba_name,
		zip = ma.addr_zip,
		geo_id = p.geo_id

		from #PPRANonFarm_ppra_nonfarm nf

		cross apply
		(
			select top 1 dba_name, geo_id
			from property with(nolock)
			where prop_id = nf.prop_id
		) p

		cross apply
		(
			select top 1 owner_id
			from owner with(nolock)
			where prop_id = nf.prop_id
			and owner_tax_yr = nf.year
			and sup_num = nf.sup_num
		) o

		cross apply
		(
			select top 1 file_as_name, email_addr
			from account with(nolock)
			where acct_id = o.owner_id
		) oa

		outer apply
		(
			select top 1 phone_num primary_phone_num
			from phone with(nolock)
			where phone.acct_id = owner_id
			and is_primary = 1
		) pp

		outer apply
		(
			select top 1 phone_num fax_phone_num
			from phone with(nolock)
			where phone.acct_id = owner_id
			and phone_type_cd = 'F'
		) fp

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

		-- legal description
		update nf
		set legal_description = legal_desc
		from #PPRANonFarm_ppra_nonfarm nf
		join property_val pv with(nolock)
		on pv.prop_id = nf.prop_id
		and pv.prop_val_yr = nf.year
		and pv.sup_num = nf.sup_num
		
		-- ubi
		update nf
		set ubi = ubi_number
		from #PPRANonFarm_ppra_nonfarm nf
		join property_val pv with(nolock)
		on pv.prop_id = nf.prop_id
		and pv.prop_val_yr = nf.year
		and pv.sup_num = nf.sup_num
		
		-- sub_type
		update nf
		set subtype = sub_type
		from #PPRANonFarm_ppra_nonfarm nf
		join property_val pv with(nolock)
		on pv.prop_id = nf.prop_id
		and pv.prop_val_yr = nf.year
		and pv.sup_num = nf.sup_num

		-- situs
		update nf
		set situs = s.situs_display
		from #PPRANonFarm_ppra_nonfarm nf
		join situs s with(nolock)
		on s.prop_id = nf.prop_id
		and s.primary_situs = 'Y'

		--!!! TAX AREA NUMBER !!!---
		update nf
		set tax_area_number = ta.tax_area_number
		from #PPRANonFarm_ppra_nonfarm nf
		join property_tax_area pta
		on pta.year = nf.year
		and pta.sup_num = nf.sup_num
		and pta.prop_id = nf.prop_id
		join tax_area ta
		on ta.tax_area_id = pta.tax_area_id

		-- linked real properties
		if object_id('tempdb..#links') is not null
			drop table #links
		create table #links (prop_id int, linked_prop_id int)

		insert #links
		select nf.prop_id, parent_prop_id
		from #PPRANonFarm_ppra_nonfarm nf
		join property_assoc pa
		on pa.child_prop_id = nf.prop_id
		and pa.prop_val_yr = nf.year
		and pa.sup_num = nf.sup_num
		join link_sub_type lst
		on lst.link_sub_type_cd = pa.link_sub_type_cd
		and lst.personal_property = 1
		join property p
		on p.prop_id = pa.parent_prop_id
		and p.prop_type_cd = 'R'

		insert #links
		select nf.prop_id, child_prop_id
		from #PPRANonFarm_ppra_nonfarm nf
		join property_assoc pa
		on pa.parent_prop_id = nf.prop_id
		and pa.prop_val_yr = nf.year
		and pa.sup_num = nf.sup_num
		join link_sub_type lst
		on lst.link_sub_type_cd = pa.link_sub_type_cd
		and lst.personal_property = 1
		join property p
		on p.prop_id = pa.child_prop_id
		and p.prop_type_cd = 'R'
		where not exists
		(
			select 1 from #links l
			where nf.prop_id = l.prop_id
			and child_prop_id = l.linked_prop_id
		)

		update nf
		set linked_real_prop_list = (
			select dbo.CommaListConcatenate(linked_prop_id)
			from #links l
			where l.prop_id = nf.prop_id)
		from #PPRANonFarm_ppra_nonfarm nf

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
		insert ##ppra_nonfarm
		(dataset_id, prop_id, year, sup_num, ubi, sub_type, sic_code, owner_id, owner_name, owner_phone, 
		 owner_fax, owner_email, owner_address, dba_name, situs, linked_real_prop_id, 
		 legal_description, tax_area_number, sort_key, linked_real_prop_list)

		select dataset_id, prop_id, year, sup_num, ubi, subtype, sic_code, ownerID, owner_name, owner_phone,
		owner_fax, owner_email, owner_address, dba_name, situs, linked_real_prop_id, 
		legal_description, tax_area_number, row_number() over(order by ' + @sort_sql + '),
		linked_real_prop_list

		from #PPRANonFarm_ppra_nonfarm
		'

		exec (@copy_sql)
		drop table #PPRANonFarm_ppra_nonfarm

		-- assign segments
		declare @properties_per_segment int
		set @properties_per_segment = 1000

		select @properties_per_segment = szConfigValue
		from pacs_config with(nolock)
		where szGroup = 'SegmentedReports' 
		and szConfigName = 'RenditionApplicationNonFarm'

		update ##ppra_nonfarm
		set segment_id = sort_key / @properties_per_segment
		where dataset_id = @dataset_id

		-- asset information

		if object_id('tempdb..#PPRANonFarmAssets_ppra_nonfarm_assets') is not null
			drop table #PPRANonFarmAssets_ppra_nonfarm_assets

		create table #PPRANonFarmAssets_ppra_nonfarm_assets
		(
			dataset_id int not null,
			prop_id int null,
			pp_seg_id int null,
			pp_sub_seg_id int null,
			pp_mkt_val numeric(14,0) null,
			pp_type_cd char(10) null,
			description varchar(255) null,
			pp_yr_acquired numeric(4,0) null,
			pp_orig_cost numeric(14,0) null,
			has_subsegments bit null,
			asset_id varchar(50) null
		)

		-- segments with no subsegments
		insert #PPRANonFarmAssets_ppra_nonfarm_assets
		(dataset_id, prop_id, pp_seg_id, pp_sub_seg_id, pp_mkt_val, pp_type_cd, description, 
			pp_yr_acquired, pp_orig_cost)
		select nf.dataset_id, nf.prop_id, pps.pp_seg_id, null, pps.pp_mkt_val, pps.pp_type_cd, pps.pp_description, 
			pps.pp_yr_aquired, pps.pp_orig_cost
		from ##ppra_nonfarm nf
		join pers_prop_seg pps
		on pps.prop_id = nf.prop_id
		and pps.prop_val_yr = nf.year
		and pps.sup_num = nf.sup_num
		and pps.pp_active_flag = 'T'
		where nf.dataset_id = @dataset_id

		-- subsegments
		insert #PPRANonFarmAssets_ppra_nonfarm_assets
		(dataset_id, prop_id, pp_seg_id, pp_sub_seg_id, pp_mkt_val, pp_type_cd, description, 
			pp_yr_acquired, pp_orig_cost, asset_id)
		select nf.dataset_id, nf.prop_id, ppss.pp_seg_id, ppss.pp_sub_seg_id, ppss.pp_mkt_val, ppss.pp_type_cd, ppss.descrip, 
			ppss.pp_yr_aquired, ppss.pp_orig_cost, ppss.asset_id
		from ##ppra_nonfarm nf
		join pers_prop_seg pps
		on pps.prop_id = nf.prop_id
		and pps.prop_val_yr = nf.year
		and pps.sup_num = nf.sup_num
		and pp_active_flag = 'T'
		join pers_prop_sub_seg ppss
		on ppss.prop_id = pps.prop_id
		and ppss.prop_val_yr = pps.prop_val_yr
		and ppss.sup_num = pps.sup_num
		and ppss.pp_seg_id = pps.pp_seg_id
		where nf.dataset_id = @dataset_id

		-- set flags
		update nfa
		set has_subsegments = case when 
			nfa.pp_sub_seg_id is null
			and exists(
				select 1 from #PPRANonFarmAssets_ppra_nonfarm_assets nfa2
				where nfa2.pp_seg_id = nfa.pp_seg_id
				and nfa2.pp_sub_seg_id is not null
			)
			then 1 else 0 end
		from #PPRANonFarmAssets_ppra_nonfarm_assets nfa

		declare @asset_sort_sql varchar(max)
		set @asset_sort_sql = case @asset_sort_order
		when 1 then 'pp_type_cd, isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
		when 2 then 'isnull(pp_yr_acquired, -1) desc, isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
		when 3 then 'isnull(pp_orig_cost, 0) desc, isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
		else 'isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
		end

		declare @asset_copy_sql varchar(max)
		set @asset_copy_sql = '
		insert ##ppra_nonfarm_assets
		(
		 dataset_id, 
		 prop_id,
		 pp_seg_id, 
		 pp_sub_seg_id, 
		 pp_mkt_val,
		 pp_type_cd, 
		 description,		
		 pp_yr_acquired, 
		 pp_orig_cost,
		 sort_key,
		 has_subsegments,
		 asset_id
		)

		select 
			dataset_id, 
			prop_id, 
			pp_seg_id, 
			pp_sub_seg_id, 
			pp_mkt_val,
			pp_type_cd, 
			description, 
			pp_yr_acquired, 
			pp_orig_cost,
			row_number() over(order by ' + @asset_sort_sql + '),
			has_subsegments,
			asset_id

		from #PPRANonFarmAssets_ppra_nonfarm_assets
		'
		exec (@asset_copy_sql)
		drop table #PPRANonFarmAssets_ppra_nonfarm_assets

		-- set first in segment group flags
		update pna
		set is_first_in_segment_group =
			case when pna.pp_seg_id <> isnull(prev_pna.pp_seg_id, -1) then 1 else 0 end

		from ##ppra_nonfarm_assets pna

		left join ##ppra_nonfarm_assets prev_pna
		on prev_pna.sort_key = pna.sort_key - 1
		and prev_pna.dataset_id = pna.dataset_id

		where pna.dataset_id = @dataset_id

		-- if a farm dataset ID was given, synchronize segment IDs
		if (exists(select top 1 prop_id from ##ppra_farm
				where dataset_id = @farm_dataset_id))
		begin
			update f
			set segment_id = nf.segment_id
			from ##ppra_farm f
			join ##ppra_nonfarm nf 
			on f.dataset_id = @farm_dataset_id
			and nf.dataset_id = @dataset_id
			and f.prop_id = nf.prop_id
		end
	end

GO

