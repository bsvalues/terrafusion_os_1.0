
create procedure PPRAMasterLease
	@dataset_id int,
	@property_list_dataset_id int,
	@year numeric(4,0),
	@sort_order int = 0,  -- 0 = name, 1 = geo ID, 2 = ZIP, 3 = prop ID
	@numberOfCopies int,
	@farm_dataset_id int,
	@asset_sort_order int

as

set nocount on

delete from ##ppra_masterlease_run
where dataset_id = @dataset_id

delete ##ppra_masterlease
where dataset_id = @dataset_id

delete from ##ppra_masterlease_assets
where dataset_id = @dataset_id

-- print run information

insert ##ppra_masterlease_run (dataset_id, appraisal_year)
select top 1 @dataset_id, appr_yr
from pacs_system

update ##ppra_masterlease_run
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
and dataset_id = @dataset_id

declare @instructions_year numeric(4,0)
set @instructions_year = 0

if exists (select 1 from pp_rendition_application_config where year = @year)
	set @instructions_year = @year

update ##ppra_masterlease_run
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
and dataset_id = @dataset_id

--Blank Copies---
if @numberOfCopies > 0
begin
	while @numberOfCopies > 0
	begin
		insert into ##ppra_masterlease (dataset_id, group_id, year, segment_id)
		values (@dataset_id, -@numberOfCopies, @year, 0)
		
		insert into ##ppra_masterlease_assets (dataset_id, group_id)
		values (@dataset_id, -@numberOfCopies)
		set @numberOfCopies = @numberOfCopies - 1
	end
end

else
	begin
		
		if object_id('tempdb..#PPRAMasterLease_ppra_masterlease') is not null
			drop table #PPRAMasterLease_ppra_masterlease

		create table #PPRAMasterLease_ppra_masterlease
		(
			dataset_id int not null,
			group_id int not null,
			year numeric(4,0) not null,
			owner_id int null,
			owner_name varchar(70) null,
			owner_phone	varchar(20) null,
			owner_fax varchar(20) null,
			owner_email varchar(50) null,
			owner_address varchar(500) null,
			dba_name varchar(50) null,
			zip varchar(10) null,
			legal_description varchar(600) null,

			primary key clustered (year, group_id)
			with (fillfactor = 90)
		)

		insert #PPRAMasterLease_ppra_masterlease
		(dataset_id, group_id, year, dba_name, legal_description, owner_id)
		select distinct @dataset_id, ml.group_id, @year, ml.dba, ml.legal_desc, ml.owner_id 
		from ##ppra_property_list pl
		join master_lease ml with(nolock)
		on ml.group_id = pl.prop_id
		and ml.year = @year
		where pl.dataset_id = @property_list_dataset_id


		update nf
		set owner_name = file_as_name,
		owner_phone = primary_phone_num,
		owner_fax = fax_phone_num,
		owner_email = oa.email_addr,
		owner_address = ma.owner_address,
		zip = ma.addr_zip

		from #PPRAMasterLease_ppra_masterlease nf

		cross apply
		(
			select top 1 file_as_name, email_addr
			from account with(nolock)
			where acct_id = nf.owner_id
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

		-- copy to global temporary table
		declare @sort_sql varchar(max)
		set @sort_sql = case @sort_order
		when 0 then 'owner_name, zip'
		when 1 then 'owner_name, zip'
		when 2 then 'zip, owner_name'
		else 'group_id, owner_name'
		end

		declare @copy_sql varchar(max)
		set @copy_sql = '
		insert ##ppra_masterlease
		(dataset_id, group_id, year, owner_id, file_as_name, phone_num, 
		 fax_num, email_addr, owner_address, dba,
		 legal_desc, sort_key)

		select dataset_id, group_id, year, owner_id, owner_name, owner_phone,
		owner_fax, owner_email, owner_address, dba_name, 
		legal_description, row_number() over(order by ' + @sort_sql + ')

		from #PPRAMasterLease_ppra_masterlease
		'

		exec (@copy_sql)
		drop table #PPRAMasterLease_ppra_masterlease

		-- assign segments
		declare @properties_per_segment int
		set @properties_per_segment = 1000

		select @properties_per_segment = szConfigValue
		from pacs_config with(nolock)
		where szGroup = 'SegmentedReports' 
		and szConfigName = 'RenditionApplicationMasterLease'

		update ##ppra_masterlease
		set segment_id = sort_key / @properties_per_segment
		where dataset_id = @dataset_id

		-- asset information

		if @asset_sort_order <> -1
		BEGIN
			if object_id('tempdb..#PPRAMasterLeaseAssets_ppra_masterlease_assets') is not null
				drop table #PPRAMasterLeaseAssets_ppra_masterlease_assets

			create table #PPRAMasterLeaseAssets_ppra_masterlease_assets
			(
				dataset_id int not null,
				group_id int not null,
				prop_id int null,
				pp_seg_id int null,
				pp_sub_seg_id int null,
				pp_mkt_val numeric(14,0) null,
				pp_type_cd char(10) null,
				description varchar(255) null,
				pp_yr_acquired numeric(4,0) null,
				pp_orig_cost numeric(14,0) null,
				has_subsegments bit null,
				tax_area_number varchar(23) null,
				asset_id varchar(50) null
			)

			-- segments with no subsegments
			insert #PPRAMasterLeaseAssets_ppra_masterlease_assets
			(dataset_id, group_id, prop_id, pp_seg_id, pp_sub_seg_id, pp_mkt_val, pp_type_cd, description, 
				pp_yr_acquired, pp_orig_cost, tax_area_number)
			select nf.dataset_id, nf.group_id, mlpa.prop_id, pps.pp_seg_id, null, pps.pp_mkt_val, pps.pp_type_cd, pps.pp_description, 
				pps.pp_yr_aquired, pps.pp_orig_cost, ta.tax_area_number
			from ##ppra_masterlease nf
			join master_lease_prop_assoc mlpa
			on mlpa.group_id = nf.group_id
			and mlpa.year = nf.year
			join pers_prop_seg pps
			on pps.prop_id = mlpa.prop_id
			and pps.prop_val_yr = nf.year
			and pps.pp_active_flag = 'T'
			join property_tax_area pta (nolock)
			on pps.prop_id = pta.prop_id
			and pps.prop_val_yr = pta.year
			and pps.sup_num = pta.sup_num
			join tax_area ta (nolock)
			on ta.tax_area_id = pta.tax_area_id
			left join pers_prop_sub_seg ppss
			on ppss.prop_id = pps.prop_id
			and ppss.prop_val_yr = pps.prop_val_yr
			and ppss.sup_num = pps.sup_num
			and ppss.pp_seg_id = pps.pp_seg_id
			where dataset_id = @dataset_id and ppss.prop_id is null

			-- subsegments
			insert #PPRAMasterLeaseAssets_ppra_masterlease_assets
			(dataset_id, group_id, prop_id, pp_seg_id, pp_sub_seg_id, pp_mkt_val, pp_type_cd, description, 
				pp_yr_acquired, pp_orig_cost, tax_area_number, asset_id)
			select nf.dataset_id, nf.group_id, mlpa.prop_id, ppss.pp_seg_id, ppss.pp_sub_seg_id, ppss.pp_mkt_val, ppss.pp_type_cd, ppss.descrip, 
				ppss.pp_yr_aquired, ppss.pp_orig_cost, ta.tax_area_number, ppss.asset_id
			from ##ppra_masterlease nf
			join master_lease_prop_assoc mlpa
			on mlpa.group_id = nf.group_id
			and mlpa.year = nf.year
			join pers_prop_seg pps
			on pps.prop_id = mlpa.prop_id
			and pps.prop_val_yr = nf.year
			and pp_active_flag = 'T'
			join pers_prop_sub_seg ppss
			on ppss.prop_id = pps.prop_id
			and ppss.prop_val_yr = pps.prop_val_yr
			and ppss.sup_num = pps.sup_num
			and ppss.pp_seg_id = pps.pp_seg_id
			join property_tax_area pta (nolock)
			on ppss.prop_id = pta.prop_id
			and ppss.prop_val_yr = pta.year
			and ppss.sup_num = pta.sup_num
			join tax_area ta (nolock)
			on ta.tax_area_id = pta.tax_area_id
			where dataset_id = @dataset_id

			-- set flags
			update nfa
			set has_subsegments = case when 
				nfa.pp_sub_seg_id is null
				and exists(
					select 1 from #PPRAMasterLeaseAssets_ppra_masterlease_assets nfa2
					where nfa2.pp_seg_id = nfa.pp_seg_id
					and nfa2.pp_sub_seg_id is not null
				)
				then 1 else 0 end
			from #PPRAMasterLeaseAssets_ppra_masterlease_assets nfa

			declare @asset_sort_sql varchar(max)
			set @asset_sort_sql = case @asset_sort_order
			when 1 then 'pp_type_cd, isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
			when 2 then 'isnull(pp_yr_acquired, -1) desc, isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
			when 3 then 'isnull(pp_orig_cost, 0) desc, isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
			else 'isnull(pp_seg_id, -1), isnull(pp_sub_seg_id, -1)'
			end

			declare @asset_copy_sql varchar(max)
			set @asset_copy_sql = '
			insert ##ppra_masterlease_assets
			(
			 dataset_id,
			 group_id, 
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
			 tax_area_number,
			 asset_id
			)

			select 
				dataset_id,
				group_id, 
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
				tax_area_number,
				asset_id

			from #PPRAMasterLeaseAssets_ppra_masterlease_assets
			'
			exec (@asset_copy_sql)
			drop table #PPRAMasterLeaseAssets_ppra_masterlease_assets

			-- set first in segment group flags
			update pma
			set is_first_in_segment_group =
			case when pma.pp_seg_id <> isnull(prev_pma.pp_seg_id, -1) then 1 else 0 end

			from ##ppra_masterlease_assets pma

			left join ##ppra_masterlease_assets prev_pma
			on prev_pma.sort_key = pma.sort_key - 1
			and prev_pma.dataset_id = pma.dataset_id

			where pma.dataset_id = @dataset_id

		END
	end

GO

