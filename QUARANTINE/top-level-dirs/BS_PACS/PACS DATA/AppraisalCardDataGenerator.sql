
/****** Object:  StoredProcedure [dbo].[AppraisalCardDataGenerator]    Script Date: 04/16/2014 10:00:00 ******/

create procedure [dbo].[AppraisalCardDataGenerator]

	@dataset_id int,
	@appraisal_card_type varchar(20),
	@include_sketch_on_front bit,
	@include_sketch_on_back bit,
	@include_image_on_front bit,
	@include_sub_segments bit,
	@include_bp_report bit,
	@include_pcw_report bit,
	@include_ms_commercial_report bit,
	@include_ms_residential_report bit

as


/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
declare @curRows int -- to capture how many rows processed by cursor

DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @dataset_id =' +  convert(varchar(30),@dataset_id) + ','
 + ' @appraisal_card_type =' + @appraisal_card_type + ','
 + ' @include_sketch_on_front =' +  convert(varchar(30),@include_sketch_on_front) + ','
 + ' @include_sketch_on_back =' +  convert(varchar(30),@include_sketch_on_back) + ','
 + ' @include_image_on_front =' +  convert(varchar(30),@include_image_on_front) + ','
 + ' @include_sub_segments =' +  convert(varchar(30),@include_sub_segments) + ','
 + ' @include_bp_report =' +  convert(varchar(30),@include_bp_report) + ','
 + ' @include_pcw_report =' +  convert(varchar(30),@include_pcw_report) + ','
 + ' @include_ms_commercial_report =' +  convert(varchar(30),@include_ms_commercial_report) + ','
 + ' @include_ms_residential_report =' +  convert(varchar(30),@include_ms_residential_report) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

/*
 * Set the max # of lines for each item here
 */

declare @max_building_permits int
declare @max_sales int
declare @max_improvements int
declare @max_land int
declare @max_pers_prop_segs int
declare @max_commercial_lines int

set @max_building_permits = 3
set @max_sales = 3
set @max_improvements = 16
set @max_land = 7
set @max_pers_prop_segs = 44
set @max_commercial_lines = 36

declare @print_inactive_building_permits char(1)

select @print_inactive_building_permits = isnull(print_inactive_building_permits,'F') 
from pacs_system 
with (nolock)
where system_type in ('A','B')

 
set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_property_info
(dataset_id, [year], sup_num, prop_id, prop_type_cd, prop_type_desc, prop_sub_type_cd,
 dba_name, legal_desc, geo_id, map_id, ref_id1, ref_id2, mapsco, situs_display, tif_flag,
 eff_size_acres, legal_acreage, tax_area_number, prev_appr_method, curr_appr_method, prev_improvement, 
 curr_improvement, prev_land_market, curr_land_market, prev_market, curr_market, 
 prev_prod_loss, curr_prod_loss, prev_subtotal, curr_subtotal, prev_frozen, curr_frozen,
 prev_appraised, curr_appraised, utilities, topography, road_access,
 group_codes, next_reason, last_appraisal_yr, cap_basis_yr,
 last_appraisal_dt, next_appraisal_dt, last_appraiser_nm, nbhd_appraiser_nm,
 subdv_appraiser_nm, land_appraiser_nm, value_appraiser_nm, remarks, image_path,
 rgn_cd, rgn_imprv_pct, rgn_land_pct, abs_subdv_cd, abs_subdv_imprv_pct,
 abs_subdv_land_pct, hood_cd, hood_imprv_pct, hood_land_pct, subset_cd,
 subset_imprv_pct, subset_land_pct, lawsuit_count, recalc_flag,
 prop_sic_cd, sic_desc, rendition_date, signed_by, prop_create_dt, prop_inactive_dt,
 property_use_cd, num_building_permits)

select acpa.dataset_id, acpa.year, acpa.sup_num, acpa.prop_id, rtrim(p.prop_type_cd),
	pt.prop_type_desc, pv.sub_type, p.dba_name, pv.legal_desc, p.geo_id, pv.map_id,
	p.ref_id1, p.ref_id2, pv.mapsco, 
	isnull(ltrim(replace(s.situs_display, char(13) + char(10), ' ')), ''),
	pv.tif_flag, pv.eff_size_acres, pv.legal_acreage, ta.tax_area_number, prevpv.appr_method, pv.appr_method, 
	isnull(prevpv.imprv_hstd_val,0) + isnull(prevpv.imprv_non_hstd_val,0),
	isnull(pv.imprv_hstd_val,0) + isnull(pv.imprv_non_hstd_val,0),
	isnull(prevpv.land_hstd_val,0) + isnull(prevpv.land_non_hstd_val,0) +
	isnull(prevpv.ag_hs_mkt_val,0) + isnull(prevpv.timber_hs_mkt_val,0) +
	isnull(prevpv.ag_market,0) + isnull(prevpv.timber_market,0),
	isnull(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0) +
	isnull(pv.ag_hs_mkt_val,0) + isnull(pv.timber_hs_mkt_val,0) +
	isnull(pv.ag_market,0) + isnull(pv.timber_market,0),
	isnull(prevpv.market,0), isnull(pv.market,0),
	isnull(prevpv.ag_market,0) + isnull(prevpv.ag_hs_mkt_val,0) +
	isnull(prevpv.timber_market,0) + isnull(prevpv.timber_hs_mkt_val,0) -
	isnull(prevpv.ag_hs_use_val,0) - isnull(prevpv.timber_hs_use_val,0) -
	isnull(prevpv.ag_use_val,0) - isnull(prevpv.timber_use,0),
	isnull(pv.ag_market,0) + isnull(pv.ag_hs_mkt_val,0) +
	isnull(pv.timber_market,0) + isnull(pv.timber_hs_mkt_val,0) -
	isnull(pv.ag_hs_use_val,0) - isnull(pv.timber_hs_use_val,0) -
	isnull(pv.ag_use_val,0) - isnull(pv.timber_use,0),
	isnull(prevpv.appraised_val,0), isnull(pv.appraised_val,0),
	isnull(prevwpv.snr_frz_imprv_hs,0) + isnull(prevwpv.snr_frz_land_hs,0),
	isnull(wpv.snr_frz_imprv_hs,0) + isnull(wpv.snr_frz_land_hs,0),
	isnull(prevwpv.appraised_classified,0) + isnull(prevwpv.appraised_non_classified,0),
	isnull(wpov.taxable_classified,0) + isnull(wpov.taxable_non_classified,0),
	p.utilities, p.topography, p.road_access, 
	left(dbo.fn_GetGroupCodes(acpa.prop_id),50), pv.next_appraisal_rsn, pv.last_appraisal_yr,
	pv.hscap_base_yr, pv.last_appraisal_dt, pv.next_appraisal_dt,
	left(lastap.appraiser_nm,20), left(nbhdap.appraiser_nm,20), left(subdvap.appraiser_nm,20),
	left(landap.appraiser_nm,20), left(valueap.appraiser_nm,20), p.remarks,
	(
		select top 1 pi.location 
		from pacs_image pi with(nolock)
		where pi.ref_type in ('P','PI') 
		and pi.ref_id = p.prop_id
		and pi.main = 1
		order by case when pi.ref_type = 'P' then 1 else 2 end, pi.scan_dt desc
	) as image_path,
	pv.rgn_cd, r.rgn_imprv_pct, r.rgn_land_pct, pv.abs_subdv_cd,
	absdv.abs_imprv_pct, absdv.abs_land_pct, pv.hood_cd, n.hood_imprv_pct,
	n.hood_land_pct, pv.subset_cd, sub.subset_imprv_pct, sub.subset_land_pct,
	0,
	pv.recalc_flag, p.prop_sic_cd, sic.sic_desc, ppr.rendition_date, ppr.signed_by,
	p.prop_create_dt, pv.prop_inactive_dt, pv.property_use_cd, 0

	from ##appraisal_card_prop_assoc as acpa
	with (nolock)
	join property_val as pv
	with (nolock)
	on acpa.[year] = pv.prop_val_yr
	and acpa.sup_num = pv.sup_num
	and acpa.prop_id = pv.prop_id
	join property as p
	with (nolock)
	on pv.prop_id = p.prop_id
	join property_type as pt
	with (nolock)
	on p.prop_type_cd = pt.prop_type_cd
	join property_tax_area as pta
	with (nolock)
	on pv.prop_val_yr = pta.year
	and pv.sup_num = pta.sup_num
	and pv.prop_id = pta.prop_id
	join tax_area as ta
	with (nolock)
	on pta.tax_area_id = ta.tax_area_id
	join wash_property_val as wpv
	with (nolock)
	on pv.prop_val_yr = wpv.prop_val_yr
	and pv.sup_num = wpv.sup_num
	and pv.prop_id = wpv.prop_id
	left join wash_prop_owner_val as wpov
	with(nolock)
	on pv.prop_val_yr = wpov.[year]
	and pv.sup_num = wpov.sup_num
	and pv.prop_id = wpov.prop_id
	left outer join situs as s
	with (nolock)
	on p.prop_id = s.prop_id
	and s.primary_situs = 'Y'
	left outer join prop_supp_assoc as prevpsa
	with (nolock)
	on pv.prop_val_yr - 1 = prevpsa.owner_tax_yr
	and pv.prop_id = prevpsa.prop_id
	left outer join property_val as prevpv
	with (nolock)
	on prevpsa.owner_tax_yr = prevpv.prop_val_yr
	and prevpsa.sup_num = prevpv.sup_num
	and prevpsa.prop_id = prevpv.prop_id
	left outer join wash_property_val as prevwpv
	with (nolock)
	on prevpsa.owner_tax_yr = prevwpv.prop_val_yr
	and prevpsa.sup_num = prevwpv.sup_num
	and prevpsa.prop_id = prevwpv.prop_id
	left outer join appraiser as lastap
	with (nolock)
	on pv.last_appraiser_id = lastap.appraiser_id
	left outer join profile_type_desc as ptdn
	with (nolock)
	on pv.hood_cd = ptdn.code
	and ptdn.type = 'N'
	left outer join appraiser as nbhdap
	with (nolock)
	on ptdn.appraiser_id = nbhdap.appraiser_id
	left outer join profile_type_desc as ptda
	with (nolock)
	on ptda.code = pv.abs_subdv_cd
	and ptda.type = 'AS'
	left outer join appraiser as subdvap
	with (nolock)
	on ptda.appraiser_id = subdvap.appraiser_id
	left outer join appraiser as landap
	with (nolock)
	on pv.land_appraiser_id = landap.appraiser_id
	left outer join appraiser as valueap
	with (nolock)
	on pv.value_appraiser_id = valueap.appraiser_id
	left outer join region as r
	with (nolock)
	on pv.rgn_cd = r.rgn_cd
	left outer join abs_subdv as absdv
	with (nolock)
	on pv.prop_val_yr = absdv.abs_subdv_yr
	and pv.abs_subdv_cd = absdv.abs_subdv_cd
	left outer join neighborhood as n
	with (nolock)
	on pv.prop_val_yr = n.hood_yr
	and pv.hood_cd = n.hood_cd
	left outer join subset as sub
	with (nolock)
	on pv.subset_cd = sub.subset_code
	left outer join sic_code as sic
	with (nolock)
	on p.prop_sic_cd = sic.sic_cd
	left outer join pers_prop_rendition as ppr
	with (nolock)
	on pv.prop_val_yr = ppr.rendition_year
	and pv.prop_id = ppr.prop_id

	where acpa.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step


update ##appraisal_card_property_info
set linked_props = left(links.props, 200)
from ##appraisal_card_property_info as acpi
left outer join
(
	select pa.prop_val_yr, pa.sup_num, pa.parent_prop_id, 
			dbo.CommaListConcatenate(pa.child_prop_id) as props
	from property_assoc as pa
	with (nolock)
	join ##appraisal_card_prop_assoc as acpa
	with (nolock)
	on pa.prop_val_yr = acpa.year
	and pa.sup_num = acpa.sup_num
	and pa.parent_prop_id = acpa.prop_id
	group by pa.prop_val_yr, pa.sup_num, pa.parent_prop_id
) as links
on acpi.year = links.prop_val_yr
and acpi.prop_id = links.parent_prop_id
where acpi.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step


update ##appraisal_card_property_info
set lawsuit_count = isnull(lawsuits.lcount,0)
from ##appraisal_card_property_info as acpi
left outer join
(
	select lp.lawsuit_yr, lp.prop_id, count(lp.lawsuit_id) as lcount
	from lawsuit_property as lp
	with (nolock)
	join lawsuit as l
	with (nolock)
	on lp.lawsuit_id = l.lawsuit_id
	left outer join lawsuit_status as ls
	with (nolock)
	on l.status = ls.status_cd
	and isnull(ls.inactive_flag, 0) = 0
	group by lp.lawsuit_yr, lp.prop_id
) as lawsuits
on acpi.year = lawsuits.lawsuit_yr
and acpi.prop_id = lawsuits.prop_id
where acpi.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

update ##appraisal_card_property_info
set agent_count = agent.acount
from ##appraisal_card_property_info as acpi
left outer join
(
	select aa.prop_id, aa.owner_tax_yr, count(agent_id) as acount
					from agent_assoc as aa
					with (nolock)
					left outer join account as a
					with (nolock)
					on aa.agent_id = a.acct_id
					left outer join phone as ph
					with (nolock)
					on a.acct_id = ph.acct_id
					and ph.phone_type_cd = 'B'
					and ph.phone_num is not null
					group by aa.owner_tax_yr, aa.prop_id
) as agent
on acpi.year = agent.owner_tax_yr
and acpi.prop_id = agent.prop_id
where acpi.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

update ##appraisal_card_property_info
set primary_zoning = cvc.characteristic_cd
from ##appraisal_card_property_info as acpi
join ##appraisal_card_prop_assoc as acpa
with (nolock)
on acpi.dataset_id = acpa.dataset_id
and acpi.[year] = acpa.[year]
and acpi.sup_num = acpa.sup_num
and acpi.prop_id = acpa.prop_id
left outer join prop_characteristic_assoc as pca
with (nolock)
on acpa.[year] = pca.prop_val_yr
and acpa.sup_num = pca.sup_num
and acpa.sale_id = pca.sale_id
and acpa.prop_id = pca.prop_id
join characteristic_value_code as cvc
with (nolock)
on pca.characteristic_cd = cvc.characteristic_cd
and cvc.primary_zoning = 1
where acpi.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step


/*
 * Now if ##appraisal_card_property_info.image_path is not null
 * convert the image file into a blob and put into the image_blob
 * column of the table.
 *
 * There is no quick way to do this.  It will need to be done one
 * at a time for each property.
 */

declare @year numeric(4,0)
declare @sup_num int
declare @prop_id int
declare @image_path varchar(255)
declare @sql nvarchar(max)

if @include_image_on_front = 1
begin
	if object_id('tempdb.#prop_blob_data') is null
	begin
		create table #prop_blob_data
		(
			dataset_id int not null,
			image_data varbinary(max) null
		)
	end

    set @curRows = 0
    
	declare acPropertyImages cursor fast_forward
	for select [year], sup_num, prop_id, image_path
		from ##appraisal_card_property_info
		with (nolock)
		where dataset_id = @dataset_id
		and len(image_path) > 0

	open acPropertyImages

	fetch next from acPropertyImages into @year, @sup_num, @prop_id, @image_path

	while @@fetch_status = 0
	begin
		begin try

        set @curRows = @curRows + 1
         
		set @sql = 'insert #prop_blob_data
					(dataset_id, image_data)
					select ' + convert(varchar, @dataset_id) + ', image_data.*
					from openrowset
					(bulk ''' + @image_path + ''', SINGLE_BLOB) image_data'

		exec sp_executesql @sql

		update ##appraisal_card_property_info
		set image_blob = (select image_data 
							from #prop_blob_data 
							where dataset_id = @dataset_id
						)
		where dataset_id = @dataset_id
		and [year] = @year
		and sup_num = @sup_num
		and prop_id = @prop_id

		delete
		from #prop_blob_data
		where dataset_id = @dataset_id

		end try

		begin catch
		end catch;

		fetch next from acPropertyImages into @year, @sup_num, @prop_id, @image_path
	end

	close acPropertyImages
	deallocate acPropertyImages

	drop table #prop_blob_data
end

-- logging end of step 
SELECT @LogTotRows = @curRows, 
       @LogErrCode = 0 
   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_owner_info
(dataset_id, [year], sup_num, prop_id, owner_id, owner_name, owner_addr1,
 owner_addr2, owner_addr3, owner_addr_city, owner_addr_state, owner_addr_zip,
 owner_addr_country, owner_addr_is_international, pct_ownership)

select acpa.dataset_id, acpa.year, acpa.sup_num, acpa.prop_id, o.owner_id, a.file_as_name,
 ad.addr_line1, ad.addr_line2, ad.addr_line3, ad.addr_city, ad.addr_state,
 ad.addr_zip, ad.country_cd, isnull(ad.is_international,0), o.pct_ownership
from ##appraisal_card_prop_assoc as acpa
with (nolock)
join owner as o
with (nolock)
on acpa.year = o.owner_tax_yr
and acpa.sup_num = o.sup_num
and acpa.prop_id = o.prop_id
join account as a
with (nolock)
on o.owner_id = a.acct_id
left outer join address as ad
with (nolock)
on o.owner_id = ad.acct_id
and ad.primary_addr = 'Y'

where acpa.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_exemption_info
(dataset_id, [year], sup_num, prop_id, owner_id, exmpt_type_cd, exmpt_desc)

select acoi.dataset_id, acoi.year, acoi.sup_num, acoi.prop_id, acoi.owner_id, 
		pe.exmpt_type_cd, et.exmpt_desc
from ##appraisal_card_owner_info as acoi
with (nolock)
join property_exemption as pe
with (nolock)
on acoi.year = pe.exmpt_tax_yr
and acoi.sup_num = pe.sup_num
and acoi.prop_id = pe.prop_id
and acoi.owner_id = pe.owner_id
join exmpt_type as et
with (nolock)
on pe.exmpt_type_cd = et.exmpt_type_cd

where acoi.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

	
declare @prop_count int
declare @prev_prop_id int

declare @bldg_permit_id int
declare @bldg_permit_issue_dt datetime
declare @bldg_permit_num varchar(30)
declare @bldg_permit_type_cd varchar(10)
declare @bldg_permit_area numeric(18,0)
declare @bldg_permit_active char(1)
declare @bldg_permit_val numeric(18,0)
declare @appraiser_nm varchar(60)
declare @bldg_permit_builder varchar(30)
declare @bldg_permit_cmnt varchar(512)

set @prev_prop_id = 0

--print 'Begin Building Permit Info - ' + convert(varchar, getdate(), 109)

set @curRows = 0

declare acBuildingPermit cursor fast_forward
for select acpa.year, acpa.sup_num, acpa.prop_id, bp.bldg_permit_id, bp.bldg_permit_issue_dt, 
			bp.bldg_permit_num, bp.bldg_permit_type_cd, bp.bldg_permit_area, 
			bp.bldg_permit_active, bp.bldg_permit_val, ap.appraiser_nm, 
			bp.bldg_permit_builder, bp.bldg_permit_cmnt
	from ##appraisal_card_prop_assoc as acpa
	with (nolock)
	join prop_building_permit_assoc as pbpa
	with (nolock)
	on acpa.prop_id = pbpa.prop_id
	join building_permit as bp
	with (nolock)
	on pbpa.bldg_permit_id = bp.bldg_permit_id
	left outer join appraiser as ap
	with (nolock)
	on bp.bldg_permit_appraiser_id = ap.appraiser_id
	where acpa.dataset_id = @dataset_id
	and case when @print_inactive_building_permits <> 'T' and isnull(bp.bldg_permit_active, 'F')  = 'T' then 1
			when @print_inactive_building_permits = 'T' then 1 else 0 end = 1
	order by acpa.prop_id, bp.bldg_permit_issue_dt desc, bp.bldg_permit_active desc

open acBuildingPermit

fetch next from acBuildingPermit into @year, @sup_num, @prop_id, @bldg_permit_id, 
	@bldg_permit_issue_dt, @bldg_permit_num, @bldg_permit_type_cd, @bldg_permit_area, 
	@bldg_permit_active, @bldg_permit_val, @appraiser_nm, @bldg_permit_builder, 
	@bldg_permit_cmnt

while @@fetch_status = 0
begin
    set @curRows = @curRows + 1
	if @prev_prop_id <> @prop_id
	begin
		set @prop_count = 0
	end

	if @prop_count < @max_building_permits
	begin
		insert ##appraisal_card_building_permit_info
		(dataset_id, [year], sup_num, prop_id, bldg_permit_id, bldg_permit_issue_dt,
		 bldg_permit_num, bldg_permit_type_cd, bldg_permit_area, bldg_permit_active,
		 bldg_permit_val, appraiser_nm, bldg_permit_builder, bldg_permit_cmnt)
		values
		(@dataset_id, @year, @sup_num, @prop_id, @bldg_permit_id, @bldg_permit_issue_dt,
		 @bldg_permit_num, @bldg_permit_type_cd, @bldg_permit_area, @bldg_permit_active,
		 @bldg_permit_val, @appraiser_nm, @bldg_permit_builder, @bldg_permit_cmnt)

		set @prop_count = @prop_count + 1
	end

	set @prev_prop_id = @prop_id

	fetch next from acBuildingPermit into @year, @sup_num, @prop_id, @bldg_permit_id, 
		@bldg_permit_issue_dt, @bldg_permit_num, @bldg_permit_type_cd, @bldg_permit_area, 
		@bldg_permit_active, @bldg_permit_val, @appraiser_nm, @bldg_permit_builder, 
		@bldg_permit_cmnt
end

close acBuildingPermit
deallocate acBuildingPermit

-- logging end of step 
SELECT @LogTotRows = @curRows, 
       @LogErrCode = 0 
   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_income_info
(dataset_id, [year], sup_num, prop_id, income_id, gpi, vac, egr, other_inc,
 egi, expense, taxes, noi, value_method, income_value, egi_nnnsft, expense_nnnsft,
 noi_nnnsft, income_value_nnnsft, tax_agent, tax_agent_phone, gross_sqft,
 net_sqft, linked_accounts, reconciled_value)

select distinct acpi.dataset_id, acpi.year, acpi.sup_num, acpi.prop_id, ipa.income_id,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_gpi
		when 'SCH' then i.sch_gpi
		when 'PF' then i.pf_gpi
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_vr
		when 'SCH' then i.sch_vr
		when 'PF' then i.pf_vr
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_la
		when 'SCH' then i.sch_la
		when 'PF' then i.pf_la
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_gpisi
		when 'SCH' then i.sch_gpisi
		when 'PF' then i.pf_gpisi
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_egi
		when 'SCH' then i.sch_egi
		when 'PF' then i.pf_egi
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_exp
		when 'SCH' then i.sch_exp
		when 'PF' then i.pf_exp
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_tax
		when 'SCH' then i.sch_tax
		when 'PF' then i.pf_tax
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_noi
		when 'SCH' then i.sch_noi
		when 'PF' then i.pf_noi
		end,
	i.value_method, i.income_value,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_egirsf
		when 'SCH' then i.sch_egirsf
		when 'PF' then i.pf_egirsf
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_exprsf
		when 'SCH' then i.sch_exprsf
		when 'PF' then i.pf_exprsf
		end,
	case isnull(i.value_method,'')
		when 'DC' then i.dc_noirsf
		when 'SCH' then i.sch_noirsf
		when 'PF' then i.pf_noirsf
		end,
	case when isnull(i.nra, 0) > 0 then i.income_value / i.nra else 0 end,
	case when acpi.agent_count > 1 then '(Multiple)'
		else agent.file_as_name end,
	case when acpi.agent_count > 1 then null else agent.phone_num end,
	i.gba, i.nra, linked_income.accounts, i.flat_value
from ##appraisal_card_property_info as acpi
with (nolock)
join income_prop_assoc as ipa
with (nolock)
on acpi.year = ipa.prop_val_yr
and acpi.sup_num = ipa.sup_num
and acpi.prop_id = ipa.prop_id
join income as i
with (nolock)
on ipa.income_id = i.income_id
and ipa.sup_num = i.sup_num
and ipa.prop_val_yr = i.income_yr
left outer join
(
	select aa.owner_tax_yr, aa.prop_id, a.file_as_name, ph.phone_num
	from agent_assoc as aa
	with (nolock)
	left outer join account as a
	with (nolock)
	on aa.agent_id = a.acct_id
	left outer join phone as ph
	with (nolock)
	on a.acct_id = ph.acct_id
	and ph.phone_type_cd = 'B'
	and ph.phone_num is not null
) as agent
on acpi.year = agent.owner_tax_yr
and acpi.prop_id = agent.prop_id
left outer join
(
	select prop_val_yr, income_id, dbo.CommaListConcatenate(tipa.prop_id) as accounts
	from income_prop_assoc as tipa
	with (nolock)
	group by prop_val_yr, income_id
	having count(tipa.prop_id) > 1
) as linked_income
on acpi.year = linked_income.prop_val_yr
and i.income_id = linked_income.income_id

where acpi.dataset_id = @dataset_id
and ipa.active_valuation = 'T'

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step


declare @case_id int
declare @prot_create_dt datetime
declare @prot_status varchar(10)
declare @prot_taxpayer_comments varchar(1024)
declare @prot_district_comments varchar(1024)

set @prev_prop_id = 0

--print 'Begin ARB Info - ' + convert(varchar, getdate(), 109)
set @curRows = 0

declare apARB cursor fast_forward
for select acpa.year, acpa.sup_num, acpa.prop_id, ap.case_id, ap.prot_create_dt,
			app.appraiser_nm, ap.prot_status, ap.prot_taxpayer_comments, ap.prot_district_comments
	from ##appraisal_card_prop_assoc as acpa
	with (nolock)
	join _arb_protest as ap
	with (nolock)
	on acpa.year = ap.prop_val_yr
	and acpa.prop_id = ap.prop_id
	left outer join appraiser as app
	with (nolock)
	on ap.prot_appraisal_staff = app.appraiser_id

	where acpa.dataset_id = @dataset_id
	order by ap.prop_id, ap.prot_create_dt desc

open apARB

fetch next from apARB into @year, @sup_num, @prop_id, @case_id, @prot_create_dt,
		@appraiser_nm, @prot_status, @prot_taxpayer_comments, @prot_district_comments

while @@fetch_status = 0
begin
    set @curRows = @curRows + 1
	if @prev_prop_id <> @prop_id
	begin
		insert ##appraisal_card_arb_info
		(dataset_id, [year], sup_num, prop_id, case_id, prot_create_dt, appraiser_nm,
		 prot_status, prot_taxpayer_comments, prot_district_comments)
		values
		(@dataset_id, @year, @sup_num, @prop_id, @case_id, @prot_create_dt, @appraiser_nm,
		 @prot_status, @prot_taxpayer_comments, @prot_district_comments)
	end

	set @prev_prop_id = @prop_id
	fetch next from apARB into @year, @sup_num, @prop_id, @case_id, @prot_create_dt,
		@appraiser_nm, @prot_status, @prot_taxpayer_comments, @prot_district_comments
end

close apARB
deallocate apARB

-- logging end of step 
SELECT @LogTotRows = @curRows, 
       @LogErrCode = 0 
   SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step



declare @chg_of_owner_id int
declare @sale_date datetime
declare @sl_price numeric(14,0)
declare @sl_type_cd varchar(5)
declare @sl_ratio_type_cd varchar(5)
declare @sl_financing_cd varchar(5)
declare @finance_yrs numeric(4,1)
declare @sl_living_area numeric(14,0)
declare @min_imprv_id int
declare @first_imprv_type_desc varchar(50)
declare @max_imprv_id int
declare @second_imprv_type_desc varchar(50)
declare @grantor varchar(70)
declare @consideration varchar(20)
declare @deed_type_cd varchar(10)
declare @deed_book_id varchar(20)
declare @deed_book_page varchar(20)
declare @price_per_sqft numeric(14,2)
declare @coopa_year numeric(4,0)
declare @coopa_sup_num int
declare @prev_chg_of_owner_id int

set @prev_prop_id = 0
set @prev_chg_of_owner_id = 0

set @curRows = 0
--print 'Begin Sales Info - ' + convert(varchar, getdate(), 109)

declare apSales cursor fast_forward
for select distinct acpa.year, acpa.sup_num, acpa.prop_id, coo.chg_of_owner_id,
		coopa.sup_tax_yr, psa.sup_num,
		isnull(s.sl_dt, coo.deed_dt), isnull(s.sl_price,0), s.sl_type_cd, s.sl_ratio_type_cd,
		s.sl_financing_cd, s.finance_yrs, isnull(s.sl_living_area,0), 
		a.file_as_name, coo.consideration,
		coo.deed_type_cd, coo.deed_book_id, coo.deed_book_page
	from ##appraisal_card_prop_assoc as acpa
	with (nolock)
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on acpa.prop_id = coopa.prop_id
	join prop_supp_assoc as psa
	with (nolock)
	on coopa.sup_tax_yr = psa.owner_tax_yr
	and coopa.prop_id = psa.prop_id
	join chg_of_owner as coo
	with (nolock)
	on coopa.chg_of_owner_id = coo.chg_of_owner_id
	left outer join seller_assoc as sa
	with (nolock)
	on coopa.chg_of_owner_id = sa.chg_of_owner_id
	left outer join account as a
	with (nolock)
	on sa.seller_id = a.acct_id
	left outer join sale as s
	with (nolock)
	on coopa.chg_of_owner_id = s.chg_of_owner_id

	where acpa.dataset_id = @dataset_id
	order by acpa.prop_id, isnull(s.sl_dt, coo.deed_dt) desc

open apSales

fetch next from apSales into @year, @sup_num, @prop_id, @chg_of_owner_id, 
		@coopa_year, @coopa_sup_num, @sale_date,
		@sl_price, @sl_type_cd, @sl_ratio_type_cd, @sl_financing_cd, @finance_yrs,
		@sl_living_area, @grantor, @consideration, @deed_type_cd,
		@deed_book_id, @deed_book_page

while @@fetch_status = 0
begin
    set @curRows = @curRows + 1
    
	if @prev_prop_id <> @prop_id
	begin
		set @prop_count = 0
	end

	if @prop_count < @max_sales and @prev_chg_of_owner_id <> @chg_of_owner_id
	begin
		select @min_imprv_id = impids.min_imprv_id, 
				@max_imprv_id = impids.max_imprv_id,
				@first_imprv_type_desc = itmin.imprv_type_desc, 
				@second_imprv_type_desc = itmax.imprv_type_desc
		from
		(
			select i.prop_val_yr as year, i.sup_num, i.prop_id,
				min(i.imprv_id) as min_imprv_id, max(i.imprv_id) as max_imprv_id
			from imprv as i
			with (nolock)
			where prop_val_yr = @coopa_year
			and sup_num = @coopa_sup_num
			and prop_id = @prop_id
			group by i.prop_val_yr, i.sup_num, i.prop_id
		) as impids
		left outer join imprv as imin
		with (nolock)
		on impids.year = imin.prop_val_yr
		and impids.sup_num = imin.sup_num
		and impids.prop_id = imin.prop_id
		and impids.min_imprv_id = imin.imprv_id
		and imin.sale_id = 0
		left outer join imprv_type as itmin
		with (nolock)
		on imin.imprv_type_cd = itmin.imprv_type_cd
		left outer join imprv as imax
		with (nolock)
		on impids.year = imax.prop_val_yr
		and impids.sup_num = imax.sup_num
		and impids.prop_id = imax.prop_id
		and impids.max_imprv_id = imax.imprv_id
		and imax.sale_id = 0
		left outer join imprv_type as itmax
		with (nolock)
		on imax.imprv_type_cd = itmax.imprv_type_cd

		if @min_imprv_id = @max_imprv_id
		begin
			set @second_imprv_type_desc = ''
		end

		if @sl_price = 0 or @sl_living_area = 0
		begin
			set @price_per_sqft = 0
		end
		else
		begin
			set @price_per_sqft = @sl_price / @sl_living_area
		end

		insert ##appraisal_card_sales_info
		(dataset_id, [year], sup_num, prop_id, chg_of_owner_id, sale_date, sale_price,
		 sale_type, sale_ratio_type, sale_financing, sale_financing_term, sale_living_area_sqft,
		 sale_price_sqft, first_imprv_type_desc, second_imprv_type_desc, grantor, consideration,
		 deed_type_cd, deed_book_id, deed_book_page)
		values
		(@dataset_id, @year, @sup_num, @prop_id, @chg_of_owner_id, @sale_date, @sl_price,
		 @sl_type_cd, @sl_ratio_type_cd, @sl_financing_cd, @finance_yrs, @sl_living_area,
		 @price_per_sqft, @first_imprv_type_desc, @second_imprv_type_desc, @grantor,
		 @consideration, @deed_type_cd, @deed_book_id, @deed_book_page)

		set @prop_count = @prop_count + 1
	end

	set @prev_prop_id = @prop_id
	set @prev_chg_of_owner_id = @chg_of_owner_id

	fetch next from apSales into @year, @sup_num, @prop_id, @chg_of_owner_id, 
		@coopa_year, @coopa_sup_num, @sale_date,
		@sl_price, @sl_type_cd, @sl_ratio_type_cd, @sl_financing_cd, @finance_yrs,
		@sl_living_area, @grantor, @consideration, @deed_type_cd,
		@deed_book_id, @deed_book_page
end

close apSales
deallocate apSales

-- logging end of step 
SELECT @LogTotRows = @curRows, 
       @LogErrCode = 0 
   SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step


insert ##appraisal_card_improvement_summary
(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, detail_count, detail_area,
 living_area, detail_value, detail_adj_value)

select acpa.dataset_id, acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id, i.imprv_id,
		sum(case when id.imprv_det_id > 0 then 1 else 0 end),
		sum(isnull(id.imprv_det_area,0)),
		sum(case when isnull(idt.main_area,'F') = 'T' then isnull(id.imprv_det_area,0) else 0 end),
		sum(isnull(case isnull(id.imprv_det_val_source, '')  
				when '' then
					case isnull(id.imprv_det_calc_val, -1)  
					when -1 then
						case when isnull(i.imprv_val_source, '') = '' then i.calc_val else i.imprv_val
					end
					else id.imprv_det_calc_val end
				when 'F' then id.imprv_det_flat_val
				when 'M' then id.imprv_det_ms_val
				else id.imprv_det_calc_val
			end, 0)),
		sum(isnull(id.imprv_det_val, 0))
from ##appraisal_card_prop_assoc as acpa
with (nolock)
join imprv as i
with (nolock)
on acpa.year = i.prop_val_yr
and acpa.sup_num = i.sup_num
and acpa.sale_id = i.sale_id
and acpa.prop_id = i.prop_id
left outer join imprv_detail as id
with (nolock)
on i.prop_val_yr = id.prop_val_yr
and i.sup_num = id.sup_num
and i.sale_id = id.sale_id
and i.prop_id = id.prop_id
and i.imprv_id = id.imprv_id
left outer join imprv_det_type as idt
with (nolock)
on id.imprv_det_type_cd = idt.imprv_det_type_cd
where acpa.dataset_id = @dataset_id

group by acpa.dataset_id, acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id, i.imprv_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

declare @imprv_id int
declare @imprv_det_id int
declare @sale_id int
declare @seq_num int

declare @imprv_det_type_cd varchar(10)
declare @imprv_det_type_desc varchar(50)
declare @imprv_det_meth_cd varchar(5)
declare @imprv_det_class_cd varchar(10)
declare @imprv_det_sub_class_cd varchar(10)
declare @imprv_det_main_area char(1)
declare @imprv_det_area numeric(18,1)
declare @imprv_det_load_factor numeric(3,0)
declare @imprv_det_unit_price numeric(14,2)
declare @imprv_det_num_units int
declare @imprv_det_year_built numeric(4,0)
declare @effective_year numeric(4,0)
declare @imprv_det_condition varchar(5)
declare @use_flat_values bit
declare @imprv_det_value numeric(14,0)
declare @imprv_det_dep_pct numeric(5,2)
declare @imprv_det_phys_pct numeric(5,2)
declare @imprv_det_econ_pct numeric(5,2)
declare @imprv_det_func_pct numeric(5,2)
declare @imprv_det_pct_complete numeric(5,2)
declare @adj_factor numeric(5,2)
declare @adj_value numeric(14,0)
declare @imprv_adj_factor numeric(8,6)
declare @imprv_adj_value numeric(14,0)
declare @imprv_type_desc varchar(50)
declare @imprv_state_cd varchar(5)
declare @imprv_effective_year numeric(4,0)
declare @imprv_homesite char(1)
declare @imprv_homesite_pct numeric(13,10)
declare @imprv_comment varchar(1000)
declare @imprv_large_sketch_path varchar(255)
declare @imprv_small_sketch_path varchar(255)
declare @imprv_det_sketch_cmds varchar(1800)
declare @detail_area numeric(18,1)
declare @living_area numeric(18,1)
declare @detail_value numeric(14,0)
declare @detail_adj_value numeric(14,0)

declare @prev_year numeric(4,0)
declare @prev_sup_num int
declare @prev_imprv_id int
declare @prev_imprv_det_id int
declare @prev_sale_id int
declare @prev_effective_year numeric(4,0)
declare @prev_imprv_effective_year numeric(4,0)
declare @prev_imprv_homesite char(1)
declare @prev_imprv_homesite_pct numeric(13,10)
declare @prev_use_flat_values bit
declare @prev_detail_area numeric(18,1)
declare @prev_detail_value numeric(14,0)
declare @prev_imprv_state_cd varchar(5)
declare @prev_living_area numeric(18,1)
declare @prev_detail_adj_value numeric(14,0)
declare @prev_imprv_large_sketch_path varchar(255)
declare @prev_imprv_small_sketch_path varchar(255)
declare @prev_imprv_adj_factor numeric(5,2)
declare @prev_imprv_adj_value numeric(14,0)
declare @prev_imprv_comment varchar(1000)
declare @prev_imprv_type_desc varchar(50)

set @prev_prop_id = -1

/*
 * PAGING
 */

declare @line_count int
declare @page_number int
declare @report_detail_type varchar(10)
declare @imprv_sequence int
declare @imprv_det_sequence int
declare @detail_count int
declare @comment_lines int
declare @adj_lines int
declare @detail_sequence char(2)
declare @had_sketches bit

set @line_count = 0
set @page_number = 1
set @prev_imprv_id = -1
set @had_sketches = 0
set @curRows = 0

declare curImprovementInfo cursor fast_forward
for select acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id, i.imprv_id, 
	isnull(id.imprv_det_id,0), isnull(id.imprv_det_type_cd,''), idt.imprv_det_typ_desc, 
	isnull(id.imprv_det_meth_cd,''), isnull(id.imprv_det_class_cd,''), 
	isnull(id.imprv_det_sub_class_cd,''), isnull(idt.main_area,'F'), isnull(id.imprv_det_area,0),

	id.load_factor, id.unit_price, isnull(id.num_units,0), id.yr_built, 
	case isnull(id.depreciation_yr_override, 'F') 
		when 'T' then id.depreciation_yr
		else i.effective_yr_blt
	end, 
	id.condition_cd, 

	case when isnull(i.imprv_val_source, '') = 'F' and isnull(i.flat_val, -1) > 0 then 1 else 0 end,
	isnull(case isnull(id.imprv_det_val_source, '')  
		when '' then
			case isnull(id.imprv_det_calc_val, -1)  
			when -1 then
				case when isnull(i.imprv_val_source, '') = '' then i.calc_val else null 
			end
			else id.imprv_det_calc_val end
		when 'M' then id.imprv_det_ms_val
		when 'F' then id.imprv_det_flat_val
		else id.imprv_det_calc_val
	end, 0),
	id.dep_pct,
	case isnull(id.physical_pct_override,'')
		when 'F' then
			case isnull(id.physical_pct_source,'')  
				when 'I' then isnull(i.physical_pct, 0)  
				when '' then isnull(i.physical_pct, 0)  
				else isnull(id.physical_pct, isnull(i.physical_pct, 0))  
			end
		else isnull(id.physical_pct, isnull(i.physical_pct, 0))  
	end,
	case isnull(id.economic_pct_override,'')  
		when 'F' then isnull(i.economic_pct, 0)  
		else isnull(id.economic_pct, isnull(i.economic_pct, 0))  
	end,
	case isnull(id.functional_pct_override,'')  
		when 'F' then isnull(i.functional_pct, 0)  
		else isnull(id.functional_pct, isnull(i.functional_pct, 0))
	end,

	case isnull(id.percent_complete_override,'')  
		when 'F' then isnull(i.percent_complete, 0)  
		else isnull(id.percent_complete, isnull(i.percent_complete, 0))  
	end,
	isnull(id.imprv_det_adj_factor, isnull(i.imprv_adj_factor, -1)),
	isnull(id.imprv_det_val, isnull(i.imprv_val, -1)),
	isnull(i.imprv_adj_factor, -1),
	isnull(i.imprv_val, -1),
	isnull(i.imprv_desc, isnull(it.imprv_type_desc, '')),
	
	isnull(i.imprv_state_cd, ''),
	i.effective_yr_blt,
	isnull(i.imprv_homesite, 'N'),
	isnull(i.hs_pct, 100),
	ltrim(rtrim(replace(isnull(i.imprv_cmnt, ''), char(13) + char(10), '  '))),
	pilarge.location,
	pismall.location,
	isnull(id.sketch_cmds, ''),
	acis.detail_count, acis.detail_area, acis.living_area, acis.detail_value, acis.detail_adj_value

from ##appraisal_card_prop_assoc as acpa
with (nolock)
join ##appraisal_card_improvement_summary as acis
with (nolock)
on acpa.dataset_id = acis.dataset_id
and acpa.year = acis.year
and acpa.sup_num = acis.sup_num
and acpa.sale_id = acis.sale_id
and acpa.prop_id = acis.prop_id
join imprv as i
with (nolock)
on acis.year = i.prop_val_yr
and acis.sup_num = i.sup_num
and acis.sale_id = i.sale_id
and acis.prop_id = i.prop_id
and acis.imprv_id = i.imprv_id
join imprv_type as it
with (nolock)
on i.imprv_type_cd = it.imprv_type_cd
left outer join imprv_detail as id
with (nolock)
on i.prop_val_yr = id.prop_val_yr
and i.sup_num = id.sup_num
and i.sale_id = id.sale_id
and i.prop_id = id.prop_id
and i.imprv_id = id.imprv_id
left outer join imprv_det_type as idt
with (nolock)
on id.imprv_det_type_cd = idt.imprv_det_type_cd
left outer join pacs_image as pilarge
with (nolock)
on i.prop_val_yr = pilarge.ref_year
and i.sup_num = pilarge.ref_id2
and i.sale_id = pilarge.ref_id3
and i.prop_id = pilarge.ref_id
and i.imprv_id = pilarge.ref_id1
and pilarge.ref_type = 'SKTCH'
and pilarge.image_type = 'SKETCH_LG'
left outer join pacs_image as pismall
with (nolock)
on i.prop_val_yr = pismall.ref_year
and i.sup_num = pismall.ref_id2
and i.sale_id = pismall.ref_id3
and i.prop_id = pismall.ref_id
and i.imprv_id = pismall.ref_id1
and pismall.ref_type = 'SKTCH'
and pismall.image_type = 'SKETCH_SM'

where acpa.dataset_id = @dataset_id
order by acpa.prop_id, i.imprv_id, id.seq_num

open curImprovementInfo

fetch next from curImprovementInfo into @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id,
	@imprv_det_type_cd, @imprv_det_type_desc, @imprv_det_meth_cd, @imprv_det_class_cd, @imprv_det_sub_class_cd,
	@imprv_det_main_area, @imprv_det_area, @imprv_det_load_factor, @imprv_det_unit_price, @imprv_det_num_units, @imprv_det_year_built,
	@effective_year, @imprv_det_condition, @use_flat_values, @imprv_det_value, @imprv_det_dep_pct,
	@imprv_det_phys_pct, @imprv_det_econ_pct, @imprv_det_func_pct, @imprv_det_pct_complete, @adj_factor,
	@adj_value, @imprv_adj_factor, @imprv_adj_value, @imprv_type_desc, @imprv_state_cd, @imprv_effective_year,
	@imprv_homesite, @imprv_homesite_pct, @imprv_comment, @imprv_large_sketch_path, @imprv_small_sketch_path,
	@imprv_det_sketch_cmds,
	@detail_count, @detail_area, @living_area, @detail_value, @detail_adj_value


while @@fetch_status = 0
begin
    set @curRows = @curRows + 1

	-- the following could happen if multiple improvements on a property
	-- OR property change
	if @prev_imprv_id <> @imprv_id
	begin
		if @prev_imprv_id > 0
		begin
			-- do improvement summary line
			insert ##appraisal_card_improvement_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, imprv_det_id,
			 imprv_type_desc, effective_year, imprv_effective_year, imprv_homesite, imprv_homesite_pct, use_flat_values,
			 imprv_det_area, imprv_state_cd, imprv_det_value, imprv_living_area, detail_adj_value, 
			 imprv_large_sketch_path, imprv_small_sketch_path)
			values
			(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'IMPRV', @prev_imprv_id, -1,
			 @prev_imprv_type_desc, @prev_effective_year, @prev_imprv_effective_year, @prev_imprv_homesite, @prev_imprv_homesite_pct, 
			 @prev_use_flat_values, @prev_detail_area, @prev_imprv_state_cd, @prev_detail_value,
			 @prev_living_area, @prev_detail_adj_value, @prev_imprv_large_sketch_path, 
			 @prev_imprv_small_sketch_path)

			insert ##appraisal_card_improvement_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
			 page_number, imprv_sequence, imprv_det_sequence)
			values
			(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
			 @page_number, @imprv_sequence, '')

			set @seq_num = @seq_num + 1

			-- do improvement adjustment line (if necessary)
			if @prev_imprv_adj_factor <> 0 and @prev_imprv_adj_factor <> 1
			begin
				insert ##appraisal_card_improvement_info
				(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, 
				 imprv_det_id, imprv_adj_factor, imprv_adj_value)
				values
				(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'IMPADJ', 
				 @prev_imprv_id, -1, @prev_imprv_adj_factor, @prev_imprv_adj_value)

				insert ##appraisal_card_improvement_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
				 page_number, imprv_sequence, imprv_det_sequence)
				values
				(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
				 @page_number, @imprv_sequence, '')

				set @seq_num = @seq_num + 1
			end

			-- do improvement comment line(s) (if necessary)
			if len(ltrim(rtrim(@prev_imprv_comment))) > 0
			begin
				insert ##appraisal_card_improvement_info
				(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, 
				 imprv_det_id, imprv_comment)
				values
				(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'COMNT', @prev_imprv_id, 
				 -1, @prev_imprv_comment)

				insert ##appraisal_card_improvement_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
				 page_number, imprv_sequence, imprv_det_sequence)
				values
				(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
				 @page_number, @imprv_sequence, '')

				set @seq_num = @seq_num + 1
			end
	
			-- do dotted line separator
			insert ##appraisal_card_improvement_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, imprv_det_id)
			values
			(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'LINE', @prev_imprv_id, -1)

			insert ##appraisal_card_improvement_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
			 page_number, imprv_sequence, imprv_det_sequence)
			values
			(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
			 @page_number, @imprv_sequence, '')

			set @seq_num = @seq_num + 1
		end

		-- if property id's change, reset everything
		if @prev_prop_id <> @prop_id
		begin
			set @imprv_sequence = 0
			set @page_number = 1
			set @line_count = 1
			set @had_sketches = 0
		end

		-- if improvement id's change, reset the detail sequence (A,B,C, etc)
		set @imprv_sequence = @imprv_sequence + 1
		set @imprv_det_sequence = 0

		-- determine when to switch pages.  Here are the scenarios:
		--
		-- 1. No sketches, line count exceeds 16, to be continued
		-- 2. Sketches (user specified include on front or back and the improvement has a sketch)
		--		There may be improvements without sketches and it's ok if there are ones without
		--      before ones with.  However, only 1 improvement with a sketch per page.
		--
		-- In all cases, try to put the improvement and all its details on one page.  So if
		-- there was already an improvement on a page, and the number of details and so forth
		-- are too many, then push it to the next page.

		set @comment_lines = 0
		if len(@imprv_comment) > 0
		begin
			set @comment_lines = (len(@imprv_comment) / 120) + 1
		end

		set @adj_lines = 0
		if @imprv_adj_factor <> -1 and @imprv_adj_factor <> 0 and @imprv_adj_factor <> 1
		begin
			set @adj_lines = 1
		end

		if (@line_count > @max_improvements) or
			(@line_count > 1 and @line_count + @detail_count + 1 + @comment_lines + @adj_lines > @max_improvements) or
			(@had_sketches = 1 and (@include_sketch_on_front = 1 or @include_sketch_on_back = 1))
		begin
			set @page_number = @page_number + 1
			set @line_count = 1
		end
        set @line_count = @line_count + @detail_count + 1 + @comment_lines + @adj_lines
	end

	-- prop_id changes, reset seq_num
	if @prev_prop_id <> @prop_id
	begin
		set @seq_num = 0
	end

	-- do improvement detail line
	insert ##appraisal_card_improvement_info
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, imprv_det_id, 
	 imprv_det_type_cd, imprv_det_type_desc, imprv_det_meth_cd, imprv_det_class_cd, imprv_det_sub_class_cd, 
	 imprv_det_main_area, imprv_det_area, imprv_det_load_factor, imprv_det_unit_price, imprv_det_num_units, imprv_det_year_built, effective_year, 
	 imprv_det_condition, use_flat_values, imprv_det_value, imprv_det_dep_pct, imprv_det_phys_pct, imprv_det_econ_pct, 
	 imprv_det_func_pct, imprv_det_pct_complete, adj_factor, adj_value, imprv_det_sketch_cmds)
	values
	(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @seq_num, 'DETAIL', @imprv_id, @imprv_det_id,
	 @imprv_det_type_cd, @imprv_det_type_desc, @imprv_det_meth_cd, @imprv_det_class_cd, @imprv_det_sub_class_cd,
	 @imprv_det_main_area, @imprv_det_area, @imprv_det_load_factor, @imprv_det_unit_price, @imprv_det_num_units, @imprv_det_year_built, @effective_year,
	 @imprv_det_condition, @use_flat_values, @imprv_det_value, @imprv_det_dep_pct, @imprv_det_phys_pct, @imprv_det_econ_pct,
	 @imprv_det_func_pct, @imprv_det_pct_complete, @adj_factor, @adj_value, @imprv_det_sketch_cmds)

	if (@line_count > @max_improvements)
	begin
		set @page_number = @page_number + 1
		set @line_count = 1
		set @imprv_det_sequence = 0
	end

	if @imprv_det_sequence > 216 set @imprv_det_sequence = 216

	-- We have to support the condition where there 
	-- are more than 26 improvement details. The 
	-- sequence  will go from Z to AA...
	if @imprv_det_sequence < 26
	set @detail_sequence = char(@imprv_det_sequence + 65)
	else
	set @detail_sequence = (char(@imprv_det_sequence + 39) + CHAR(@imprv_det_sequence + 39))

	insert ##appraisal_card_improvement_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
	 page_number, imprv_sequence, imprv_det_sequence)
	values
	(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @seq_num, @imprv_id, @imprv_det_id,
	 @page_number, @imprv_sequence, @detail_sequence)

	if len(@imprv_large_sketch_path) > 0 or len(@imprv_small_sketch_path) > 0
	begin
		set @had_sketches = 1
	end
	else
	begin
		set @had_sketches = 0
	end


	set @imprv_det_sequence = @imprv_det_sequence + 1

	set @seq_num = @seq_num + 1

	-- save values for improvement later

	set @prev_year = @year
	set @prev_sup_num = @sup_num
	set @prev_sale_id = @sale_id
	set @prev_prop_id = @prop_id
	set @prev_imprv_id = @imprv_id
	set @prev_imprv_det_id = @imprv_det_id
	set @prev_imprv_type_desc = @imprv_type_desc
	
	set @prev_imprv_state_cd = @imprv_state_cd
	set @prev_effective_year = @effective_year
	set @prev_imprv_effective_year = @imprv_effective_year
	set @prev_imprv_homesite = @imprv_homesite
	set @prev_imprv_homesite_pct = @imprv_homesite_pct
	set @prev_use_flat_values = @use_flat_values
	set @prev_imprv_large_sketch_path = @imprv_large_sketch_path
	set @prev_imprv_small_sketch_path = @imprv_small_sketch_path

	set @prev_imprv_adj_factor = @imprv_adj_factor
	set @prev_imprv_adj_value = @imprv_adj_value

	set @prev_imprv_comment = @imprv_comment

	set @prev_detail_area = @detail_area
	set @prev_living_area = @living_area
	set @prev_detail_value = @detail_value
	set @prev_detail_adj_value = @detail_adj_value

	fetch next from curImprovementInfo into @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id,
		@imprv_det_type_cd, @imprv_det_type_desc, @imprv_det_meth_cd, @imprv_det_class_cd, @imprv_det_sub_class_cd,
		@imprv_det_main_area, @imprv_det_area, @imprv_det_load_factor, @imprv_det_unit_price, @imprv_det_num_units, @imprv_det_year_built,
		@effective_year, @imprv_det_condition, @use_flat_values, @imprv_det_value, @imprv_det_dep_pct,
		@imprv_det_phys_pct, @imprv_det_econ_pct, @imprv_det_func_pct, @imprv_det_pct_complete, @adj_factor,
		@adj_value, @imprv_adj_factor, @imprv_adj_value, @imprv_type_desc, @imprv_state_cd, @imprv_effective_year,
		@imprv_homesite, @imprv_homesite_pct, @imprv_comment, @imprv_large_sketch_path, @imprv_small_sketch_path,
		@imprv_det_sketch_cmds,
		@detail_count, @detail_area, @living_area, @detail_value, @detail_adj_value
end

if @prev_imprv_id > 0
begin
	-- do improvement summary line
	insert ##appraisal_card_improvement_info
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, imprv_det_id,
	 imprv_type_desc, effective_year, imprv_effective_year, imprv_homesite, imprv_homesite_pct, use_flat_values,
	 imprv_det_area, imprv_state_cd, imprv_det_value, imprv_living_area, detail_adj_value, 
	 imprv_large_sketch_path, imprv_small_sketch_path)
	values
	(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'IMPRV', @prev_imprv_id, -1,
	 @prev_imprv_type_desc, @prev_effective_year, @prev_imprv_effective_year, @prev_imprv_homesite, @prev_imprv_homesite_pct, 
	 @prev_use_flat_values, @prev_detail_area, @prev_imprv_state_cd, @prev_detail_value,
	 @prev_living_area, @prev_detail_adj_value, @prev_imprv_large_sketch_path, 
	 @prev_imprv_small_sketch_path)

	insert ##appraisal_card_improvement_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
	 page_number, imprv_sequence, imprv_det_sequence)
	values
	(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
	 @page_number, @imprv_sequence, '')

	set @seq_num = @seq_num + 1

	-- do improvement adjustment line (if necessary)
	if @prev_imprv_adj_factor <> 0 and @prev_imprv_adj_factor <> 1
	begin
		insert ##appraisal_card_improvement_info
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, 
		 imprv_det_id, imprv_adj_factor, imprv_adj_value)
		values
		(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'IMPADJ', 
		 @prev_imprv_id, -1, @prev_imprv_adj_factor, @prev_imprv_adj_value)

		insert ##appraisal_card_improvement_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
		 page_number, imprv_sequence, imprv_det_sequence)
		values
		(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
		 @page_number, @imprv_sequence, '')

		set @seq_num = @seq_num + 1
	end

	-- do improvement comment line(s) (if necessary)
	if len(ltrim(rtrim(@prev_imprv_comment))) > 0
	begin
		insert ##appraisal_card_improvement_info
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, 
		 imprv_det_id, imprv_comment)
		values
		(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'COMNT', @prev_imprv_id, 
		 -1, @prev_imprv_comment)

		insert ##appraisal_card_improvement_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
		 page_number, imprv_sequence, imprv_det_sequence)
		values
		(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
		 @page_number, @imprv_sequence, '')

		set @seq_num = @seq_num + 1
	end

	-- do dotted line separator
	insert ##appraisal_card_improvement_info
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, imprv_id, imprv_det_id)
	values
	(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'LINE', @prev_imprv_id, -1)

	insert ##appraisal_card_improvement_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id,
	 page_number, imprv_sequence, imprv_det_sequence)
	values
	(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, @prev_imprv_id, -1,
	 @page_number, @imprv_sequence, '')
end

close curImprovementInfo
deallocate curImprovementInfo

-- logging end of step 
SELECT @LogTotRows = @curRows, 
       @LogErrCode = 0 
   SET @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step



if @include_sketch_on_front = 1 or @include_sketch_on_back = 1
begin
--	print ''
--	print 'Begin Sketch Paging - ' + convert(varchar, getdate(), 109)

	insert ##appraisal_card_sketch_paging
	(dataset_id, [year], sup_num, prop_id, page_number, imprv_sequence, small_sketch_path,
	 large_sketch_path)

	select distinct acip.dataset_id, acip.[year], acip.sup_num, acip.prop_id,
		acip.page_number, acip.imprv_sequence, acii.imprv_small_sketch_path,
		acii.imprv_large_sketch_path
	from ##appraisal_card_improvement_paging as acip
	with (nolock)
	join ##appraisal_card_improvement_info as acii
	with (nolock)
	on acip.dataset_id = acii.dataset_id
	and acip.[year] = acii.[year]
	and acip.sup_num = acii.sup_num
	and acip.prop_id = acii.prop_id
	and acip.imprv_id = acii.imprv_id
	and acip.imprv_det_id = acii.imprv_det_id
	and acii.report_detail_type = 'IMPRV'
	where acip.dataset_id = @dataset_id
	and (len(isnull(acii.imprv_small_sketch_path,'')) > 0 or len(isnull(acii.imprv_large_sketch_path,'')) > 0)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	if object_id('tempdb.#sketch_blob_data') is null
	begin
		create table #sketch_blob_data
		(
			dataset_id int not null,
			image_data varbinary(max) null
		)
	end

--print '  Sketch Blobbing - ' + convert(varchar, getdate(), 109)
    set @curRows = 0
	declare @small_sketch_path varchar(255)
	declare @large_sketch_path varchar(255)

	declare acSketchImages cursor fast_forward
	for select [year], sup_num, prop_id, page_number, small_sketch_path, large_sketch_path
		from ##appraisal_card_sketch_paging
		with (nolock)
		where dataset_id = @dataset_id

	open acSketchImages

	fetch next from acSketchImages into @year, @sup_num, @prop_id, @page_number,
				@small_sketch_path, @large_sketch_path

	while @@fetch_status = 0
	begin
		if len(@small_sketch_path) > 0
		begin
			begin try
            set @curRows = @curRows + 1
			set @sql = 'insert #sketch_blob_data
						(dataset_id, image_data)
						select ' + convert(varchar, @dataset_id) + ', image_data.*
						from openrowset
						(bulk ''' + @small_sketch_path + ''', SINGLE_BLOB) image_data'

			exec sp_executesql @sql

			update ##appraisal_card_sketch_paging
			set small_sketch_blob = (select image_data 
								from #sketch_blob_data 
								where dataset_id = @dataset_id
							)
			where dataset_id = @dataset_id
			and [year] = @year
			and sup_num = @sup_num
			and prop_id = @prop_id
			and page_number = @page_number

			delete
			from #sketch_blob_data
			where dataset_id = @dataset_id

			end try
			begin catch
			end catch;
		end

		if len(@large_sketch_path) > 0
		begin
			begin try

			set @sql = 'insert #sketch_blob_data
						(dataset_id, image_data)
						select ' + convert(varchar, @dataset_id) + ', image_data.*
						from openrowset
						(bulk ''' + @large_sketch_path + ''', SINGLE_BLOB) image_data'

			exec sp_executesql @sql

			update ##appraisal_card_sketch_paging
			set large_sketch_blob = (select image_data 
								from #sketch_blob_data 
								where dataset_id = @dataset_id
							)
			where dataset_id = @dataset_id
			and [year] = @year
			and sup_num = @sup_num
			and prop_id = @prop_id
			and page_number = @page_number

			delete
			from #sketch_blob_data
			where dataset_id = @dataset_id

			end try
			begin catch
			end catch;
		end

		fetch next from acSketchImages into @year, @sup_num, @prop_id, @page_number,
				@small_sketch_path, @large_sketch_path
	end

	close acSketchImages
	deallocate acSketchImages

	drop table #sketch_blob_data
	-- logging end of step 
	SELECT @LogTotRows = @curRows, 
		   @LogErrCode = 0 
	   SET @LogStatus =  'Step 16 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

end

--print ''
--print 'Begin Improvement Detail Adj Info - ' + convert(varchar, getdate(), 109)

insert ##appraisal_card_improvement_detail_adj_info
(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, imprv_det_adj_seq,
 imprv_adj_type_cd, imprv_det_adj_amt, imprv_det_adj_pct)

select acpa.dataset_id, acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id, ida.imprv_id,
	ida.imprv_det_id, ida.imprv_det_adj_seq, ida.imprv_adj_type_cd, ida.imprv_det_adj_amt, ida.imprv_det_adj_pc
from ##appraisal_card_prop_assoc as acpa
with (nolock)
join imprv_det_adj as ida
with (nolock)
on acpa.year = ida.prop_val_yr
and acpa.sup_num = ida.sup_num
and acpa.sale_id = ida.sale_id
and acpa.prop_id = ida.prop_id

where acpa.dataset_id = @dataset_id

-- 'Begin Improvement Adj Info - ' + convert(varchar, getdate(), 109)

insert ##appraisal_card_improvement_adj_info
(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_adj_seq,
 imprv_adj_type_cd, imprv_adj_amt, imprv_adj_pct)

select acpa.dataset_id, acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id, ia.imprv_id,
 ia.imprv_adj_seq, ia.imprv_adj_type_cd, ia.imprv_adj_amt, ia.imprv_adj_pc
from ##appraisal_card_prop_assoc as acpa
with (nolock)
join imprv_adj as ia
with (nolock)
on acpa.year = ia.prop_val_yr
and acpa.sup_num = ia.sup_num
and acpa.sale_id = ia.sale_id
and acpa.prop_id = ia.prop_id

where acpa.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 17 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_improvement_feature_info
(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id,
 imprv_attr_id, imprv_attr_code, imprv_attr_desc, imprv_attr_unit, imprv_attr_val)

select acpa.dataset_id, acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id, ia.imprv_id,
	ia.imprv_det_id, ia.imprv_attr_id, ia.i_attr_val_cd, attr.imprv_attr_desc, 
	isnull(ia.i_attr_unit,0), isnull(ia.imprv_attr_val,0)

from ##appraisal_card_prop_assoc as acpa
with (nolock)
join imprv_attr as ia
with (nolock)
on acpa.year = ia.prop_val_yr
and acpa.sup_num = ia.sup_num
and acpa.sale_id = ia.sale_id
and acpa.prop_id = ia.prop_id
join attribute as attr
with (nolock)
on ia.i_attr_val_id = attr.imprv_attr_id

where acpa.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 18 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

declare @land_seg_id int
declare @land_type_desc varchar(50)
declare @land_type_cd varchar(10)
declare @land_soil_code varchar(10)
declare @land_class_code varchar(3)
declare @land_market_code varchar(25)
declare @land_state_code varchar(5)
declare @land_seg_homesite char(1)
declare @land_hs_pct numeric(13,10)
declare @land_market_method varchar(5)
declare @dimensions varchar(50)
declare @mkt_unit_price numeric(14,2)
declare @mkt_calc_val numeric(14,0)
declare @land_adj_factor numeric(8,6)
declare @land_mass_adj_factor numeric(8,6)
declare @mkt_val_source char(1)
declare @land_seg_mkt_val numeric(14,0)
declare @ag_apply char(1)
declare @ag_use_cd varchar(5)
declare @land_ag_code varchar(25)
declare @ag_unit_price numeric(14,2)
declare @ag_val numeric(14,0)
declare @irr_wells numeric(14,0)
declare @irr_capacity numeric(14,0)
declare @irr_acres numeric(14,4)
declare @oil_wells numeric(14,0)
declare @land_seg_comment varchar(500)
declare @total_market_value numeric(14,0)
declare @total_ag_value numeric(14,0)
declare @land_sequence int

set @seq_num = 0
set @prev_prop_id = -1
set @total_market_value = 0
set @total_ag_value = 0
set @land_sequence = 1
set @curRows = 0

declare curLandInfo cursor fast_forward
for select acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id,
	ld.land_seg_id, lt.land_type_desc, ld.land_type_cd, ld.land_soil_code,
	ld.land_class_code, lsl.ls_code, ld.state_cd, ld.land_seg_homesite, ld.hs_pct,
	lsl.ls_method, 
	case isnull(lsl.ls_method, '')  
		when 'SQ' then
			case when isnull(ld.size_square_feet, -1) <> -1
				then convert(varchar(20), ld.size_square_feet) + ' SQ'  
				else ''
			end
		when 'FF' then
			case when isnull(ld.effective_front, -1) <> -1 and isnull(ld.effective_depth, -1) <> -1  
				then convert(varchar(20), ld.effective_front) + 'X' + convert(varchar(20), ld.effective_depth)  
				else ''
			end
		when 'L' then
			case when isnull(ld.effective_front, -1) <> -1 and isnull(ld.effective_depth, -1) <> -1  
				then convert(varchar(20), ld.effective_front) + 'X' + convert(varchar(20), ld.effective_depth)  
				else ''
			end
		else
			case when isnull(ld.size_acres, -1) <> -1  
				then convert(varchar(20), ld.size_acres) + ' AC'  
				else ''
			end
	end as dimensions,
	ld.mkt_unit_price, ld.mkt_calc_val, ld.land_adj_factor, ld.land_mass_adj_factor, ld.mkt_val_source,
	isnull(ld.land_seg_mkt_val,0), ld.ag_apply, ld.ag_use_cd, lsa.ls_code, ld.ag_unit_price,
	isnull(ld.ag_val,0), pv.irr_wells, pv.irr_capacity, pv.irr_acres, pv.oil_wells, ld.land_seg_comment

from ##appraisal_card_prop_assoc as acpa
with (nolock)
join land_detail as ld
with (nolock)
on acpa.year = ld.prop_val_yr
and acpa.sup_num = ld.sup_num
and acpa.sale_id = ld.sale_id
and acpa.prop_id = ld.prop_id
join property_val as pv
with (nolock)
on acpa.year = pv.prop_val_yr
and acpa.sup_num = pv.sup_num
and acpa.prop_id = pv.prop_id
join land_type as lt
with (nolock)
on ld.land_type_cd = lt.land_type_cd
left outer join land_sched as lsl
with (nolock)
on ld.prop_val_yr = lsl.ls_year
and ld.ls_mkt_id = lsl.ls_id
left outer join land_sched as lsa
with (nolock)
on ld.prop_val_yr = lsa.ls_year
and ld.ls_ag_id = lsa.ls_id

where acpa.dataset_id = @dataset_id

order by acpa.prop_id, ld.land_seg_id

open curLandInfo

fetch next from curLandInfo into @year, @sup_num, @sale_id, @prop_id, @land_seg_id, @land_type_desc,
	@land_type_cd, @land_soil_code, @land_class_code, @land_market_code, @land_state_code,
	@land_seg_homesite, @land_hs_pct, @land_market_method, @dimensions, @mkt_unit_price, @mkt_calc_val, 
	@land_adj_factor, @land_mass_adj_factor, @mkt_val_source, @land_seg_mkt_val, @ag_apply,
	@ag_use_cd, @land_ag_code, @ag_unit_price, @ag_val, @irr_wells, @irr_capacity,
	@irr_acres, @oil_wells, @land_seg_comment

while @@fetch_status = 0
begin
	if @prop_id <> @prev_prop_id
	begin
	    set @curRows = @curRows + 1
		if @prev_prop_id > 0
		begin
			insert ##appraisal_card_land_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, land_seg_id,
			 land_seg_mkt_val, ag_val)
			values
			(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'TOTAL', -1,
			 @total_market_value, @total_ag_value)

			insert ##appraisal_card_land_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, land_seg_id, page_number,
			 land_sequence)
			values
			(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, -1, 
			 @page_number, -1)
		end

		set @total_market_value = 0
		set @total_ag_value = 0
		set @seq_num = 0

		set @land_sequence = 1
		set @page_number = 1
		set @line_count = 1
	end

	/*
	 * Paging is a lot easier for land.  Just try to keep the detail and the comment on the same
	 * page. If the line count goes beyond 7, move it to the next page (increase the page number).
	 */

	if (@line_count + 1 + ((len(@land_seg_comment) / 100) + 1) > @max_land) or
	   (@line_count > @max_land)
	begin
		set @page_number = @page_number + 1
		set @line_count = 1
	end

	insert ##appraisal_card_land_info
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, land_seg_id, 
	 land_type_description, land_type_cd, land_soil_cd, land_class_cd, land_table, land_state_cd, 
	 land_homesite, land_homesite_pct, land_method, land_dimensions, land_unit_price, land_gross_value,
	 land_adj_factor, land_mass_adj_factor, land_mkt_val_source, land_seg_mkt_val, ag_apply, 
	 ag_use_cd, ag_table, ag_unit_price, ag_val, irr_wells, irr_capacity, irr_acres, oil_wells)
	values
	(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @seq_num, 'DETAIL', @land_seg_id,
	 @land_type_desc, @land_type_cd, @land_soil_code, @land_class_code, @land_market_code, @land_state_code,
	 @land_seg_homesite, @land_hs_pct, @land_market_method, @dimensions, @mkt_unit_price, @mkt_calc_val,
	 @land_adj_factor, @land_mass_adj_factor, @mkt_val_source, @land_seg_mkt_val, @ag_apply,
	 @ag_use_cd, @land_ag_code, @ag_unit_price, @ag_val, @irr_wells, @irr_capacity, @irr_acres,
	 @oil_wells)

	insert ##appraisal_card_land_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, land_seg_id, page_number,
	 land_sequence)
	values
	(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @seq_num, @land_seg_id, @page_number,
	 @land_sequence)

	set @line_count = @line_count + 1
	set @land_sequence = @land_sequence + 1

	set @total_market_value = @total_market_value + @land_seg_mkt_val
	set @total_ag_value = @total_ag_value + @ag_val
	set @seq_num = @seq_num + 1

	if len(@land_seg_comment) > 0
	begin
		insert ##appraisal_card_land_info
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, land_seg_id,
		 land_comment)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @seq_num, 'COMNT', @land_seg_id,
		 @land_seg_comment)

		insert ##appraisal_card_land_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, land_seg_id, page_number,
		 land_sequence)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @seq_num, @land_seg_id, @page_number,
		 @land_sequence)

		set @line_count = @line_count + (len(@land_seg_comment) / 100) + 1
		set @seq_num = @seq_num + 1
	end

	set @prev_year = @year
	set @prev_sup_num = @sup_num
	set @prev_sale_id = @sale_id
	set @prev_prop_id = @prop_id

	fetch next from curLandInfo into @year, @sup_num, @sale_id, @prop_id, @land_seg_id, @land_type_desc,
		@land_type_cd, @land_soil_code, @land_class_code, @land_market_code, @land_state_code,
		@land_seg_homesite, @land_hs_pct, @land_market_method, @dimensions, @mkt_unit_price, @mkt_calc_val,
		@land_adj_factor, @land_mass_adj_factor, @mkt_val_source, @land_seg_mkt_val, @ag_apply,
		@ag_use_cd, @land_ag_code, @ag_unit_price, @ag_val, @irr_wells, @irr_capacity,
		@irr_acres, @oil_wells, @land_seg_comment
end

if @prev_prop_id > 0
begin
	insert ##appraisal_card_land_info
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, land_seg_id,
	 land_seg_mkt_val, ag_val)
	values
	(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, 'TOTAL', -1,
	 @total_market_value, @total_ag_value)

	insert ##appraisal_card_land_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, land_seg_id, page_number,
	 land_sequence)
	values
	(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @seq_num, -1, 
	 @page_number, -1)
end

close curLandInfo
deallocate curLandInfo

-- logging end of step 
SELECT @LogTotRows = @curRows, 
       @LogErrCode = 0 
   SET @LogStatus =  'Step 19 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_land_adjustment_info
(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, land_seg_id,
 land_seg_adj_seq, land_seg_adj_type, land_seg_adj_amt, land_seg_adj_pct)

select acpa.dataset_id, acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id,
	acli.seq_num, la.land_seg_id, la.land_seg_adj_seq, la.land_seg_adj_type, 
	case when rtrim(isnull(lat.land_adj_type_usage,'')) = 'U' 
		then la.land_value
		else lat.land_adj_type_amt
	end,
	case when rtrim(isnull(lat.land_adj_type_usage,'')) = 'U'
		then la.land_seg_adj_pc
		else lat.land_adj_type_pct
	END

from ##appraisal_card_prop_assoc as acpa
with (nolock)
join ##appraisal_card_land_info as acli
with (nolock)
on acpa.dataset_id = acli.dataset_id
and acpa.year = acli.year
and acpa.sup_num = acli.sup_num
and acpa.sale_id = acli.sale_id
and acpa.prop_id = acli.prop_id
and acli.report_detail_type = 'DETAIL'
join land_adj as la
with (nolock)
on acli.year = la.prop_val_yr
and acli.sup_num = la.sup_num
and acli.sale_id = la.sale_id
and acli.prop_id = la.prop_id
and acli.land_seg_id = la.land_seg_id
join land_adj_type as lat
with (nolock)
on la.prop_val_yr = lat.land_adj_type_year
and la.land_seg_adj_type = lat.land_adj_type_cd

where acpa.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 20 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_pers_prop_seg_summary
(dataset_id, [year], sup_num, sale_id, prop_id, pp_type_cd, detail_count)

select acpa.dataset_id, acpa.[year], acpa.sup_num, acpa.sale_id, acpa.prop_id,
	isnull(pps.pp_type_cd,''), count(distinct pps.pp_seg_id) as type_count
from ##appraisal_card_prop_assoc as acpa
with (nolock)
join pers_prop_seg as pps
with (nolock)
on acpa.[year] = pps.prop_val_yr
and acpa.sup_num = pps.sup_num
and acpa.prop_id = pps.prop_id
left outer join pers_prop_sub_seg as ppss
with (nolock)
on pps.prop_val_yr = ppss.prop_val_yr
and pps.sup_num = ppss.sup_num
and pps.prop_id = ppss.prop_id
and pps.pp_seg_id = ppss.pp_seg_id
where acpa.dataset_id = @dataset_id
and pps.pp_active_flag = 'T'
group by acpa.dataset_id, acpa.[year], acpa.sup_num, acpa.sale_id, acpa.prop_id,
	isnull(pps.pp_type_cd, '')

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 21 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

declare @pp_seg_id int
declare @pp_sub_seg_id int
declare @pp_type_cd varchar(10)
declare @pp_type_desc varchar(50)
declare @pp_description varchar(255)
declare @pp_qual_cd varchar(5)
declare @pp_density_cd varchar(5)
declare @pp_class_cd varchar(5)
declare @pp_area numeric(12,0)
declare @pp_unit_count numeric(16,4)
declare @pp_yr_acquired numeric(4,0)
declare @pp_orig_cost numeric(14,0)
declare @pp_farm_asset bit
declare @pp_unit_price numeric(14,2)
declare @pp_pct_good numeric(5,2)
declare @pp_deprec_deprec_cd varchar(10)
declare @pp_deprec_pct numeric(5,2)
declare @pp_prior_yr_val numeric(14,0)
declare @pp_appraised_val numeric(14,0)
declare @pp_rendered_val numeric(14,0)
declare @pp_appraise_meth varchar(5)
declare @pp_mkt_val numeric(14,0)
declare @sub_descrip varchar(255)
declare @sub_veh_vin varchar(30)
declare @sub_yr_acquired numeric(4,0)
declare @sub_orig_cost numeric(14,0)
declare @sub_veh_year numeric(4,0)
declare @sub_veh_make varchar(10)
declare @sub_veh_model varchar(10)
declare @sub_dep_type_cd varchar(5)
declare @sub_deprec_cd varchar(10)
declare @sub_dep_pct numeric(5,2)
declare @sub_flat_val numeric(14,0)
declare @sub_mkt_val numeric(14,0)
declare @asset_id varchar(50)


declare @pp_sequence int
declare @subtotal_type_count int
declare @subtotal_area numeric(12,0)
declare @subtotal_unit_count numeric(16,4)
declare @subtotal_orig_cost numeric(14,0)
declare @subtotal_prior_yr_value numeric(14,0)
declare @subtotal_appraised_value numeric(14,0)
declare @subtotal_rendered_value numeric(14,0)
declare @subtotal_market_value numeric(14,0)
declare @total_area numeric(12,0)
declare @total_unit_count numeric(16,4)
declare @total_orig_cost numeric(14,0)
declare @total_prior_yr_value numeric(14,0)
declare @total_appraised_value numeric(14,0)
declare @total_rendered_value numeric(14,0)


declare @prev_pp_seg_id int
declare @prev_pp_sub_seg_id int
declare @prev_pp_type_cd varchar(10)
declare @prev_pp_type_desc varchar(50)
declare @prev_pp_farm_asset bit
declare @prev_detail_count int
declare @subsegment_count int

set @seq_num = 0
set @prev_prop_id = -1
set @prev_pp_type_cd = '~'
set @pp_sequence = 1
set @page_number = 1

set @subtotal_type_count = 0
set @subtotal_area = 0
set @subtotal_unit_count = 0
set @subtotal_orig_cost = 0
set @subtotal_prior_yr_value = 0
set @subtotal_appraised_value = 0
set @subtotal_rendered_value = 0
set @subtotal_market_value = 0

set @total_area = 0
set @total_unit_count = 0
set @total_orig_cost = 0
set @total_prior_yr_value = 0
set @total_appraised_value = 0
set @total_rendered_value = 0
set @total_market_value = 0
set @curRows = 0

declare curPPInfo cursor fast_forward
for select acpa.year, acpa.sup_num, acpa.sale_id, acpa.prop_id, pps.pp_seg_id, ppss.pp_sub_seg_id,
		pps.pp_type_cd, ppt.pp_type_desc, pps.pp_description, pps.pp_qual_cd,
		pps.pp_density_cd, pps.pp_class_cd, pps.pp_area, pps.pp_unit_count, pps.pp_yr_aquired,
		pps.pp_orig_cost, pps.farm_asset, pps.pp_unit_price, pps.pp_pct_good, pps.pp_deprec_deprec_cd,
		pps.pp_deprec_pct, prev_pps.pp_appraised_val as pp_prior_yr_val, pps.pp_appraised_val, 
		pps.pp_rendered_val, pps.pp_appraise_meth, pps.pp_mkt_val,
		ppss.descrip as sub_descrip, ppss.pp_veh_vin as sub_veh_vin, 
		ppss.pp_yr_aquired as sub_yr_acquired, ppss.pp_orig_cost as sub_orig_cost,
		ppss.pp_veh_year as sub_veh_year, ppss.pp_veh_make as sub_veh_make,
		ppss.pp_veh_model as sub_veh_model, ppss.pp_dep_type_cd as sub_dep_type_cd,
		ppss.pp_dep_deprec_cd as sub_deprec_cd, ppss.pp_dep_pct as sub_dep_pct,
		ppss.pp_flat_val as sub_flat_val, ppss.pp_mkt_val as sub_mkt_val, ppss.asset_id as asset_id,
		acppss.detail_count, 
		(select count(pp_sub_seg_id)
			from pers_prop_sub_seg as ppss
			with (nolock)
			where ppss.prop_val_yr = pps.prop_val_yr
			and ppss.sup_num = pps.sup_num
			and ppss.prop_id = pps.prop_id
			and ppss.pp_seg_id = pps.pp_seg_id) as subsegment_count
from ##appraisal_card_prop_assoc as acpa
with (nolock)
join pers_prop_seg as pps
with (nolock)
on acpa.[year] = pps.prop_val_yr
and acpa.sup_num = pps.sup_num
and acpa.prop_id = pps.prop_id
join ##appraisal_card_pers_prop_seg_summary as acppss
with (nolock)
on acpa.dataset_id = acppss.dataset_id
and acpa.[year] = acppss.[year]
and acpa.sup_num = acppss.sup_num
and acpa.sale_id = acppss.sale_id
and acpa.prop_id = acppss.prop_id
and pps.pp_type_cd = acppss.pp_type_cd
join pp_type as ppt
with (nolock)
on pps.pp_type_cd = ppt.pp_type_cd
left outer join prop_supp_assoc as prev_psa
with (nolock)
on pps.prop_val_yr - 1 = prev_psa.owner_tax_yr
and pps.prop_id = prev_psa.prop_id
left outer join pers_prop_seg as prev_pps
with (nolock)
on prev_psa.owner_tax_yr = prev_pps.prop_val_yr
and prev_psa.sup_num = prev_pps.sup_num
and prev_psa.prop_id = prev_pps.prop_id
and pps.pp_seg_id = prev_pps.pp_seg_id
left outer join pers_prop_sub_seg as ppss
with (nolock)
on pps.prop_val_yr = ppss.prop_val_yr
and pps.sup_num = ppss.sup_num
and pps.prop_id = ppss.prop_id
and pps.pp_seg_id = ppss.pp_seg_id
where acpa.dataset_id = @dataset_id
and pps.pp_active_flag = 'T'
order by acpa.[year], acpa.sup_num, acpa.prop_id, pps.pp_type_cd, pps.pp_seg_id, ppss.pp_sub_seg_id

open curPPInfo

fetch next from curPPInfo into @year, @sup_num, @sale_id, @prop_id, @pp_seg_id, @pp_sub_seg_id, 
		@pp_type_cd, @pp_type_desc, @pp_description, @pp_qual_cd,
		@pp_density_cd, @pp_class_cd, @pp_area, @pp_unit_count, @pp_yr_acquired, @pp_orig_cost,
		@pp_farm_asset, @pp_unit_price, @pp_pct_good, @pp_deprec_deprec_cd, @pp_deprec_pct, 
		@pp_prior_yr_val, @pp_appraised_val, @pp_rendered_val, @pp_appraise_meth, @pp_mkt_val, 
		@sub_descrip, @sub_veh_vin, @sub_yr_acquired, @sub_orig_cost, @sub_veh_year, @sub_veh_make,
		@sub_veh_model, @sub_dep_type_cd, @sub_deprec_cd, @sub_dep_pct, @sub_flat_val,
		@sub_mkt_val, @asset_id, @detail_count, @subsegment_count

while @@fetch_status = 0
begin
    set @curRows = @curRows + 1
	if @prev_prop_id <> @prop_id
	begin
		if @prev_prop_id > 0
		begin
			insert ##appraisal_card_pers_prop_seg_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
			 pp_sub_seg_id, pp_type_cd, pp_type_desc, pp_area, pp_unit_count, pp_orig_cost, 
			 pp_prior_yr_val, pp_appraised_val, pp_rendered_val, pp_mkt_val, segment_count)
			values
			(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, 'SUBTOTAL', -1,
			 -1, @prev_pp_type_cd, @prev_pp_type_desc, @subtotal_area, @subtotal_unit_count, 
			 @subtotal_orig_cost, @subtotal_prior_yr_value, @subtotal_appraised_value, 
			 @subtotal_rendered_value, @subtotal_market_value, @prev_detail_count)

			insert ##appraisal_card_pers_prop_seg_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
			 page_number, pp_sequence)
			values
			(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, -1, -1,
			 @page_number, -1)

			set @seq_num = @seq_num + 1

			set @total_area = @total_area + @subtotal_area
			set @total_unit_count = @total_unit_count + @subtotal_unit_count
			set @total_orig_cost = @total_orig_cost + @subtotal_orig_cost
			set @total_prior_yr_value = @total_prior_yr_value + @subtotal_prior_yr_value
			set @total_appraised_value = @total_appraised_value + @subtotal_appraised_value
			set @total_rendered_value = @total_rendered_value + @subtotal_rendered_value
			set @total_market_value = @total_market_value + @subtotal_market_value

			insert ##appraisal_card_pers_prop_seg_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
			 pp_sub_seg_id, pp_area, pp_unit_count, pp_orig_cost, 
			 pp_prior_yr_val, pp_appraised_val, pp_rendered_val, pp_mkt_val)
			values
			(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, 'TOTAL', -1,
			 -1, @total_area, @total_unit_count, 
			 @total_orig_cost, @total_prior_yr_value, @total_appraised_value, 
			 @total_rendered_value, @total_market_value)

			insert ##appraisal_card_pers_prop_seg_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
			 page_number, pp_sequence)
			values
			(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, -1, -1,
			 @page_number, -1)
		end

		set @subtotal_area = 0
		set @subtotal_unit_count = 0
		set @subtotal_orig_cost = 0
		set @subtotal_prior_yr_value = 0
		set @subtotal_appraised_value = 0
		set @subtotal_rendered_value = 0
		set @subtotal_market_value = 0

		set @total_area = 0
		set @total_unit_count = 0
		set @total_orig_cost = 0
		set @total_prior_yr_value = 0
		set @total_appraised_value = 0
		set @total_rendered_value = 0
		set @total_market_value = 0

		set @seq_num = 0

		set @pp_sequence = 1
		set @page_number = 1
		set @line_count = 1
		set @prev_pp_type_cd = '~'
		set @prev_pp_seg_id = -1
		
		insert ##appraisal_card_pers_prop_seg_info
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
		 pp_sub_seg_id, pp_type_cd)
		values
		(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, 'HEADER', @pp_seg_id,
		 -1, @pp_type_cd)
		 
		insert ##appraisal_card_pers_prop_seg_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
		 page_number, pp_sequence)
		values
		(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, @pp_seg_id, -1,
		 @page_number, @pp_sequence)
			 
		set @seq_num = @seq_num + 1
	end

	if @prev_pp_type_cd <> @pp_type_cd
	begin
		if @prev_pp_type_cd <> '~'
		begin
			insert ##appraisal_card_pers_prop_seg_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
			 pp_sub_seg_id, pp_type_cd, pp_type_desc, pp_area, pp_unit_count, pp_orig_cost, 
			 pp_prior_yr_val, pp_appraised_val, pp_rendered_val, pp_mkt_val, segment_count)
			values
			(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, 'SUBTOTAL',
			 -1, -1, @prev_pp_type_cd, @prev_pp_type_desc, @subtotal_area, 
			 @subtotal_unit_count,  @subtotal_orig_cost, @subtotal_prior_yr_value, 
			 @subtotal_appraised_value,  @subtotal_rendered_value, @subtotal_market_value,
			 @prev_detail_count)

			insert ##appraisal_card_pers_prop_seg_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
			 page_number, pp_sequence)
			values
			(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, -1, -1,
			 @page_number, -1)

			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 2

			set @total_area = @total_area + @subtotal_area
			set @total_unit_count = @total_unit_count + @subtotal_unit_count
			set @total_orig_cost = @total_orig_cost + @subtotal_orig_cost
			set @total_prior_yr_value = @total_prior_yr_value + @subtotal_prior_yr_value
			set @total_appraised_value = @total_appraised_value + @subtotal_appraised_value
			set @total_rendered_value = @total_rendered_value + @subtotal_rendered_value
			set @total_market_value = @total_market_value + @subtotal_market_value

			set @subtotal_area = 0
			set @subtotal_unit_count = 0
			set @subtotal_orig_cost = 0
			set @subtotal_prior_yr_value = 0
			set @subtotal_appraised_value = 0
			set @subtotal_rendered_value = 0
			set @subtotal_market_value = 0
		end
	end
	
	if @pp_seg_id <> @prev_pp_seg_id
	begin
		if (@include_sub_segments = 1 and @line_count + 1 + @subsegment_count + 4 > @max_pers_prop_segs) or
				(@include_sub_segments = 0 and @line_count + 1 > @max_pers_prop_segs)
		begin
			set @page_number = @page_number + 1
			set @line_count = 1
			
			insert ##appraisal_card_pers_prop_seg_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
			 pp_sub_seg_id, pp_type_cd)
			values
			(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, 'HEADER', @pp_seg_id,
			 -1, @pp_type_cd)
			 
			insert ##appraisal_card_pers_prop_seg_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
			 page_number, pp_sequence)
			values
			(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, @pp_seg_id, -1,
			 @page_number, @pp_sequence)
				 
			set @seq_num = @seq_num + 1
		end
		
		insert ##appraisal_card_pers_prop_seg_info
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
		 pp_sub_seg_id, pp_type_cd, pp_type_desc, pp_description, pp_qual_cd, pp_density_cd,
		 pp_class_cd, pp_area, pp_unit_count, pp_yr_acquired, pp_orig_cost, pp_farm_asset,
		 pp_unit_price, pp_pct_good, pp_deprec_deprec_cd, pp_deprec_pct, pp_prior_yr_val,
		 pp_appraised_val, pp_rendered_val, pp_appraise_meth, pp_mkt_val)
		values
		(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, 'SEGMENT', @pp_seg_id,
		 -1, @pp_type_cd, @pp_type_desc, @pp_description, @pp_qual_cd, @pp_density_cd,
		 @pp_class_cd, @pp_area, @pp_unit_count, @pp_yr_acquired, @pp_orig_cost, @pp_farm_asset,
		 @pp_unit_price, @pp_pct_good, @pp_deprec_deprec_cd, @pp_deprec_pct, @pp_prior_yr_val,
		 @pp_appraised_val, @pp_rendered_val, @pp_appraise_meth, @pp_mkt_val)

		insert ##appraisal_card_pers_prop_seg_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
		 page_number, pp_sequence)
		values
		(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, @pp_seg_id, -1,
		 @page_number, @pp_sequence)

		set @seq_num = @seq_num + 1
		set @pp_sequence = @pp_sequence + 1
		set @line_count = @line_count + 1
		
		if @subsegment_count > 0
		begin
			insert ##appraisal_card_pers_prop_seg_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
			 pp_sub_seg_id, pp_type_cd)
			values
			(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, 'SUBSEG', @pp_seg_id,
			 -1, @pp_type_cd)
			 
			insert ##appraisal_card_pers_prop_seg_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
			 page_number, pp_sequence)
			values
			(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, @pp_seg_id, -1,
			 @page_number, @pp_sequence)
			 
			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 4
		end
		
		set @subtotal_area = @subtotal_area + @pp_area
		set @subtotal_unit_count = @subtotal_unit_count + @pp_unit_count
		set @subtotal_orig_cost = @subtotal_orig_cost + @pp_orig_cost
		set @subtotal_prior_yr_value = @subtotal_prior_yr_value + @pp_prior_yr_val
		set @subtotal_appraised_value = @subtotal_appraised_value + @pp_appraised_val
		set @subtotal_rendered_value = @subtotal_rendered_value + @pp_rendered_val
		set @subtotal_market_value = @subtotal_market_value + @pp_mkt_val
	end

	if @include_sub_segments = 1 and isnull(@pp_sub_seg_id,0) > 0
	begin
		if @line_count + 1 > @max_pers_prop_segs
		begin
			set @page_number = @page_number + 1
			set @line_count = 1
			
			insert ##appraisal_card_pers_prop_seg_info
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
			 pp_sub_seg_id, pp_type_cd)
			values
			(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, 'HEADER', @pp_seg_id,
			 -1, @pp_type_cd)
			 
			insert ##appraisal_card_pers_prop_seg_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
			 page_number, pp_sequence)
			values
			(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, @pp_seg_id, -1,
			 @page_number, @pp_sequence)
				 
			set @seq_num = @seq_num + 1
		end

		insert ##appraisal_card_pers_prop_seg_info
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
		 pp_sub_seg_id, pp_type_cd, pp_type_desc, pp_description, pp_qual_cd, pp_density_cd,
		 pp_class_cd, pp_area, pp_unit_count, pp_yr_acquired, pp_orig_cost, 
		 pp_unit_price, pp_pct_good, pp_deprec_deprec_cd, pp_deprec_pct, pp_prior_yr_val,
		 pp_appraised_val, pp_rendered_val, pp_appraise_meth, pp_mkt_val, sub_descrip,
		 sub_veh_vin, sub_yr_acquired, sub_orig_cost, sub_veh_yr, sub_veh_make, sub_veh_model,
		 sub_dep_type_cd, sub_deprec_cd, sub_dep_pct, sub_flat_val, sub_mkt_val, asset_id)
		values
		(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, 'DETAIL', @pp_seg_id,
		 @pp_sub_seg_id, @pp_type_cd, @pp_type_desc, @pp_description, @pp_qual_cd, @pp_density_cd,
		 @pp_class_cd, @pp_area, @pp_unit_count, @pp_yr_acquired, @pp_orig_cost, 
		 @pp_unit_price, @pp_pct_good, @pp_deprec_deprec_cd, @pp_deprec_pct, @pp_prior_yr_val,
		 @pp_appraised_val, @pp_rendered_val, @pp_appraise_meth, @pp_mkt_val, @sub_descrip,
		 @sub_veh_vin, @sub_yr_acquired, @sub_orig_cost, @sub_veh_year, @sub_veh_make, @sub_veh_model,
		 @sub_dep_type_cd, @sub_deprec_cd, @sub_dep_pct, @sub_flat_val, @sub_mkt_val, @asset_id)

		insert ##appraisal_card_pers_prop_seg_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
		 page_number, pp_sequence)
		values
		(@dataset_id, @year, @sup_num, 0, @prop_id, @seq_num, @pp_seg_id, @pp_sub_seg_id,
		 @page_number, @pp_sequence)

		set @seq_num = @seq_num + 1
		set @line_count = @line_count + 1
	end

	set @prev_year = @year
	set @prev_sup_num = @sup_num
	set @prev_prop_id = @prop_id
	set @prev_pp_seg_id = @pp_seg_id
	set @prev_pp_sub_seg_id = @pp_sub_seg_id
	set @prev_pp_type_cd = @pp_type_cd
	set @prev_pp_type_desc = @pp_type_desc
	set @prev_pp_farm_asset = @pp_farm_asset
	set @prev_detail_count = @detail_count

	fetch next from curPPInfo into @year, @sup_num, @sale_id, @prop_id, @pp_seg_id, @pp_sub_seg_id, 
		@pp_type_cd, @pp_type_desc, @pp_description, @pp_qual_cd,
		@pp_density_cd, @pp_class_cd, @pp_area, @pp_unit_count, @pp_yr_acquired, @pp_orig_cost,
		@pp_farm_asset, @pp_unit_price, @pp_pct_good, @pp_deprec_deprec_cd, @pp_deprec_pct, 
		@pp_prior_yr_val, @pp_appraised_val, @pp_rendered_val, @pp_appraise_meth, @pp_mkt_val, 
		@sub_descrip, @sub_veh_vin, @sub_yr_acquired, @sub_orig_cost, @sub_veh_year, @sub_veh_make,
		@sub_veh_model, @sub_dep_type_cd, @sub_deprec_cd, @sub_dep_pct, @sub_flat_val,
		@sub_mkt_val, @asset_id, @detail_count, @subsegment_count
end

close curPPInfo
deallocate curPPInfo

-- logging end of step 
SELECT @LogTotRows = @curRows, 
       @LogErrCode = 0 
   SET @LogStatus =  'Step 22 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

if @prev_prop_id > 0
begin
	insert ##appraisal_card_pers_prop_seg_info
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
	 pp_sub_seg_id, pp_type_desc, pp_area, pp_unit_count, pp_orig_cost, pp_prior_yr_val,
	 pp_appraised_val, pp_rendered_val, pp_mkt_val, segment_count)
	values
	(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, 'SUBTOTAL', -1,
	 -1, @prev_pp_type_desc, @subtotal_area, @subtotal_unit_count, @subtotal_orig_cost,
	 @subtotal_prior_yr_value, @subtotal_appraised_value, @subtotal_rendered_value,
	 @subtotal_market_value, @prev_detail_count)

	insert ##appraisal_card_pers_prop_seg_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
	 page_number, pp_sequence)
	values
	(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, -1, -1,
	 @page_number, -1)

	set @seq_num = @seq_num + 1

	set @total_area = @total_area + @subtotal_area
	set @total_unit_count = @total_unit_count + @subtotal_unit_count
	set @total_orig_cost = @total_orig_cost + @subtotal_orig_cost
	set @total_prior_yr_value = @total_prior_yr_value + @subtotal_prior_yr_value
	set @total_appraised_value = @total_appraised_value + @subtotal_appraised_value
	set @total_rendered_value = @total_rendered_value + @subtotal_rendered_value
	set @total_market_value = @total_market_value + @subtotal_market_value

	insert ##appraisal_card_pers_prop_seg_info
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, report_detail_type, pp_seg_id,
	 pp_sub_seg_id, pp_area, pp_unit_count, pp_orig_cost, pp_prior_yr_val,
	 pp_appraised_val, pp_rendered_val, pp_mkt_val)
	values
	(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, 'TOTAL', -1,
	 -1, @total_area, @total_unit_count, @total_orig_cost,
	 @total_prior_yr_value, @total_appraised_value, @total_rendered_value,
	 @total_market_value)

	insert ##appraisal_card_pers_prop_seg_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, 
	 page_number, pp_sequence)
	values
	(@dataset_id, @prev_year, @prev_sup_num, 0, @prev_prop_id, @seq_num, -1, -1,
	 @page_number, -1)
	 
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 23 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step
	 
	 
end

/*
 * Some personal properties do not have segments.  An appraisal card still needs
 * to be printed for them.  So create a paging record for them.
 */

insert ##appraisal_card_pers_prop_seg_paging
(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id,
 page_number, pp_sequence)

select acpi.dataset_id, acpi.[year], acpi.sup_num, 0, acpi.prop_id, 0, -1, -1, 1, -1
from ##appraisal_card_property_info as acpi
with (nolock)
left outer join ##appraisal_card_pers_prop_seg_paging as acppsp
with (nolock)
on acpi.dataset_id = acppsp.dataset_id
and acpi.[year] = acppsp.[year]
and acpi.sup_num = acppsp.sup_num
and acpi.prop_id = acppsp.prop_id
where acpi.dataset_id = @dataset_id
and acpi.prop_type_cd in ('P','A')
and acppsp.prop_id is null

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 24 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_property_paging
(dataset_id, [year], sup_num, prop_id, page_number, end_page_number)

select distinct dataset_id, [year], sup_num, prop_id, page_number, 0
from
(
	select distinct dataset_id, [year], sup_num, prop_id, page_number
	from ##appraisal_card_improvement_paging as acip
	with (nolock)
	where acip.dataset_id = @dataset_id

	union

	select distinct dataset_id, [year], sup_num, prop_id, page_number
	from ##appraisal_card_land_paging as aclp
	with (nolock)
	where aclp.dataset_id = @dataset_id
) as t

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 25 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

insert ##appraisal_card_property_paging
(dataset_id, [year], sup_num, prop_id, page_number, end_page_number)

select distinct dataset_id, [year], sup_num, prop_id, page_number, 0
from ##appraisal_card_pers_prop_seg_paging as acppsp
with (nolock)
where acppsp.dataset_id = @dataset_id
and prop_id not in
(
	select distinct prop_id
	from ##appraisal_card_property_paging
	with (nolock)
	where dataset_id = @dataset_id
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 26 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

-- Now get all the rest.  Might be properties without land or improvements

insert ##appraisal_card_property_paging
(dataset_id, [year], sup_num, prop_id, page_number, end_page_number)

select distinct dataset_id, [year], sup_num, prop_id, 1, 1
from ##appraisal_card_prop_assoc
with (nolock)
where dataset_id = @dataset_id
and prop_id not in
(
	select distinct prop_id
	from ##appraisal_card_property_paging
	with (nolock)
	where dataset_id = @dataset_id
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 27 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

update ##appraisal_card_property_paging
set end_page_number = t.page_number
from ##appraisal_card_property_paging as acpp
join
(
	select a.dataset_id, a.[year], a.sup_num, a.prop_id, 
		case when @include_sketch_on_back = 1 and @appraisal_card_type = 'FIELD_REVIEW' 
			then max(a.page_number) + 
				(select count(dataset_id)
				from ##appraisal_card_sketch_paging
				with (nolock)
				where dataset_id = a.dataset_id
				and [year] = a.[year]
				and sup_num = a.sup_num
				and prop_id = a.prop_id
				)
			else max(a.page_number) end as page_number 
	from ##appraisal_card_property_paging as a
	where a.dataset_id = @dataset_id
	group by a.dataset_id, a.[year], a.sup_num, a.prop_id 
) as t
on acpp.dataset_id = t.dataset_id
and acpp.[year] = t.[year]
and acpp.sup_num = t.sup_num
and acpp.prop_id = t.prop_id
where acpp.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 28 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

update ##appraisal_card_property_info
set sale_price = isnull(acsi.sale_price,0),
	living_area = isnull(imp_info.living_area,0)
from ##appraisal_card_property_info as acpi
with (Nolock)
left outer join 
(
	select t.dataset_id, t.year, t.sup_num, t.prop_id, max(sale_date) as sale_date
	from ##appraisal_card_sales_info as t
	with (nolock)
	where dataset_id = @dataset_id
	and sale_price > 0
	group by t.dataset_id, t.year, t.sup_num, t.prop_id
) as sale_info
on acpi.dataset_id = sale_info.dataset_id
and acpi.year = sale_info.year
and acpi.sup_num = sale_info.sup_num
and acpi.prop_id = sale_info.prop_id
left outer join ##appraisal_card_sales_info as acsi
with (nolock)
on sale_info.dataset_id = acsi.dataset_id
and sale_info.year = acsi.year
and sale_info.sup_num = acsi.sup_num
and sale_info.prop_id = acsi.prop_id
and sale_info.sale_date = acsi.sale_date
left outer join
(
	select i.dataset_id, i.year, i.sup_num, i.prop_id, sum(living_area) as living_area
	from ##appraisal_card_improvement_summary as i
	with (nolock)
	where dataset_id = @dataset_id
	group by i.dataset_id, i.year, i.sup_num, i.prop_id
) as imp_info
on acpi.dataset_id = imp_info.dataset_id
and acpi.year = imp_info.year
and acpi.sup_num = imp_info.sup_num
and acpi.prop_id = imp_info.prop_id
where acpi.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 29 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

-- update the number of building permits so the appraisal card will know when to
-- print the building permit report.  Only prints when >= 3 permits and the user
-- requests it.

update ##appraisal_card_property_info
set num_building_permits = t.bp_count
from ##appraisal_card_property_info as acpi
join
(
	select acbpi.[year], acbpi.sup_num, acbpi.prop_id, count(acbpi.bldg_permit_id) as bp_count
	from ##appraisal_card_building_permit_info as acbpi
	with (nolock)
	where acbpi.dataset_id = @dataset_id
	group by acbpi.[year], acbpi.sup_num, acbpi.prop_id
) as t
on acpi.[year] = t.[year]
and acpi.sup_num = t.sup_num
and acpi.prop_id = t.prop_id
where acpi.dataset_id = @dataset_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
	   @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 30 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

if @include_bp_report = 1
begin
--	print ''
--	print 'Begin Building Permit Report Data - ' + convert(varchar, getdate(), 109)


	declare @permit_id int 
	declare @permit_num varchar(30) 
	declare @issued_to varchar(255) 
	declare @issue_date datetime 
	declare @limit_date datetime 
	declare @street_num varchar(10) 
	declare @street_prefix varchar(10)
	declare @street_name varchar(50) 
	declare @street_suffix varchar(10) 
	declare @city varchar(30) 
	declare @source varchar(50) 
	declare @active bit 
	declare @type_cd varchar(10) 
	declare @type_desc varchar(50) 
	declare @issuer varchar(5) 
	declare @permit_status varchar(5)
	declare @issuer_desc varchar(50) 
	declare @permit_val numeric(18,0) 
	declare @sub_type_cd varchar(5) 
	declare @sub_type_desc varchar(50)
	declare @res_com char(1) 
	declare @cad_status varchar(5) 
	declare @cad_status_desc varchar(50) 
	declare @unit_type varchar(5) 
	declare @unit_number varchar(15) 
	declare @sub_division varchar(50) 
	declare @plat varchar(4) 
	declare @block varchar(4) 
	declare @lot varchar(30) 
	declare @area numeric(18,0) 
	declare @dim1 varchar(10) 
	declare @dim2 varchar(10) 
	declare @dim3 varchar(10) 
	declare @building_inspection_required bit 
	declare @electrical_inspection_required bit 
	declare @mechanical_inspection_required bit 
	declare @plumbing_inspection_required bit 
	declare @builder varchar(30) 
	declare @date_worked datetime 
	declare @builder_phone varchar(16) 
	declare @date_complete datetime 
	declare @land_use varchar(30) 
	declare @owner_phone varchar(16) 
	declare @last_changed_date datetime 
	declare @percent_complete numeric(5,2) 
	declare @case_name varchar(30) 
	declare @imported_prop_id varchar(15) 
	declare @project_num varchar(15) 
	declare @project_name varchar(30) 
	declare @description varchar(255) 
	declare @other_id varchar(15) 
	declare @comment varchar(512) 
	declare @prop_type_cd varchar(5) 
	declare @prop_owner_name varchar(70) 
	declare @prop_legal_desc varchar(255) 
	declare @prop_map_id varchar(20) 
	declare @prop_abs_subdv_cd varchar(10) 
	declare @prop_other varchar(50) 
	declare @prop_appraised_val numeric(14,0) 
	declare @prop_prop_id int
	declare @prev_permit_id int


	set @prev_prop_id = -1
	set @prev_permit_id = -1
	set @seq_num = 0
    set @curRows = 0
    
	declare curBPData cursor fast_forward
	for select pbpa.prop_id, bp.bldg_permit_id, bp.bldg_permit_num, bp.bldg_permit_issued_to, bp.bldg_permit_status,
				bp.bldg_permit_issuer, bp.bldg_permit_issue_dt, bp.bldg_permit_limit_dt, bp.bldg_permit_street_num,
				bp.bldg_permit_street_prefix, bp.bldg_permit_street_name, bp.bldg_permit_street_suffix,
				bp.bldg_permit_city, bp.bldg_permit_source, 
				case when isnull(bp.bldg_permit_active,'F') = 'T' then 1 else 0 end, 
				bp.bldg_permit_type_cd, bpt.bld_permit_desc, bpi.Description, bp.bldg_permit_val,
				bp.bldg_permit_sub_type_cd, bpst.Description, bp.bldg_permit_res_com,
				bp.bldg_permit_cad_status, bcs.Description,
				bp.bldg_permit_unit_type, bp.bldg_permit_unit_number, bp.bldg_permit_sub_division, 
				bp.bldg_permit_plat, bp.bldg_permit_block, bp.bldg_permit_lot, bp.bldg_permit_area,
				bp.bldg_permit_dim_1, bp.bldg_permit_dim_2, bp.bldg_permit_dim_3, 
				case when isnull(bp.bldg_permit_bldg_inspect_req,'F') = 'T' then 1 else 0 end,
				case when isnull(bp.bldg_permit_elec_inspect_req,'F') = 'T' then 1 else 0 end,
				case when isnull(bp.bldg_permit_mech_inspect_req,'F') = 'T' then 1 else 0 end,
				case when isnull(bp.bldg_permit_plumb_inspect_req,'F') = 'T' then 1 else 0 end,
				bp.bldg_permit_builder, bp.bldg_permit_dt_worked, ap.appraiser_nm,
				bp.bldg_permit_builder_phone, bp.bldg_permit_dt_complete, bp.bldg_permit_land_use,
				bp.bldg_permit_owner_phone, bp.bldg_permit_last_chg, bp.bldg_permit_pct_complete,
				bp.bldg_permit_case_name, bp.bldg_permit_import_prop_id, bp.bldg_permit_cmnt,
				bp.bldg_permit_project_num, bp.bldg_permit_project_name, bp.bldg_permit_desc,
				bp.bldg_permit_other_id, pbpa2.prop_id, p.prop_type_cd, a.file_as_name, pv.legal_desc,
				pv.map_id, pv.abs_subdv_cd, p.other, pv.appraised_val
		from ##appraisal_card_property_info as acpi
		with (nolock)
		join prop_building_permit_assoc as pbpa
		with (nolock)
		on acpi.prop_id = pbpa.prop_id
		join building_permit as bp
		with (nolock)
		on pbpa.bldg_permit_id = bp.bldg_permit_id
		join pacs_system as ps
		with (nolock)
		on ps.system_type in ('A','B')
		left outer join prop_building_permit_assoc as pbpa2
		with (nolock)
		on bp.bldg_permit_id = pbpa2.bldg_permit_id
		join property_val as pv
		with (nolock)
		on ps.appr_yr = pv.prop_val_yr
		and pv.sup_num = 0
		and pv.prop_id = pbpa2.prop_id
		join property as p
		with (nolock)
		on pv.prop_id = p.prop_id
		join owner as o
		with (nolock)
		on pv.prop_val_yr = o.owner_tax_yr
		and pv.sup_num = o.sup_num
		and pv.prop_id = o.prop_id
		join account as a
		with (nolock)
		on o.owner_id = a.acct_id
		left outer join appraiser as ap
		with (nolock)
		on bp.bldg_permit_appraiser_id = ap.appraiser_id
		left outer join bld_permit_type as bpt
		with (nolock)
		on bp.bldg_permit_type_cd = bpt.bld_permit_type_cd
		left outer join bld_permit_sub_type as bpst
		with (nolock)
		on bp.bldg_permit_sub_type_cd = bpst.PermitSubtypeCode
		left outer join bp_cad_status_cd as bcs
		with (nolock)
		on bp.bldg_permit_cad_status = bcs.CadStatus
		left outer join bp_issuer_status_cd as bpi
		with (nolock)
		on bp.bldg_permit_issuer = bpi.IssuerStatus
		where acpi.dataset_id = @dataset_id
		and acpi.num_building_permits = @max_building_permits
		and case when @print_inactive_building_permits <> 'T' and isnull(bp.bldg_permit_active, 'F') = 'T' then 1
				when @print_inactive_building_permits = 'T' then 1 else 0 end = 1
		order by pbpa.prop_id, bp.bldg_permit_id

	open curBPData

	fetch next from curBPData into @prop_id, @permit_id, @permit_num, @issued_to, @permit_status, @issuer, 
			@issue_date, @limit_date, @street_num, @street_prefix, @street_name, @street_suffix,
			@city, @source, @active, @type_cd, @type_desc, @issuer_desc, @permit_val,
			@sub_type_cd, @sub_type_desc, @res_com, @cad_status, @cad_status_desc,
			@unit_type, @unit_number, @sub_division, @plat, @block, @lot, @area,
			@dim1, @dim2, @dim3, @building_inspection_required, @electrical_inspection_required,
			@mechanical_inspection_required, @plumbing_inspection_required, @builder,
			@date_worked, @appraiser_nm, @builder_phone, @date_complete, @land_use,
			@owner_phone, @last_changed_date, @percent_complete, @case_name, @imported_prop_id,
			@comment, @project_num, @project_name, @description, @other_id, @prop_prop_id, @prop_type_cd,
			@prop_owner_name, @prop_legal_desc, @prop_map_id, @prop_abs_subdv_cd,
			@prop_other, @prop_appraised_val

	while @@fetch_status = 0
	begin
	    set @curRows = @curRows + 1
		if @prop_id <> @prev_prop_id
		begin
			if @prev_prop_id > -1
			begin
				insert ##appraisal_card_bp_report_data
				(dataset_id, prop_id, seq_num, report_detail_type)
				values
				(@dataset_id, @prev_prop_id, @seq_num, 'RPTFOOTER')
			end

			set @seq_num = 0
			set @prev_permit_id = -1
		end

		if @permit_id <> @prev_permit_id
		begin
			if @prev_permit_id > -1
			begin
				insert ##appraisal_card_bp_report_data
				(dataset_id, prop_id, seq_num, report_detail_type)
				values
				(@dataset_id, @prev_prop_id, @seq_num, 'RPTFOOTER')

				set @seq_num = @seq_num + 1
			end

			insert ##appraisal_card_bp_report_data
			(dataset_id, prop_id, seq_num, report_detail_type)
			values
			(@dataset_id, @prop_id, @seq_num, 'RPTHEADING')

			set @seq_num = @seq_num + 1

			insert ##appraisal_card_bp_report_data
			(dataset_id, prop_id, seq_num, report_detail_type)
			values
			(@dataset_id, @prop_id, @seq_num, 'PMTHEADING')

			set @seq_num = @seq_num + 1

			insert ##appraisal_card_bp_report_data
			(dataset_id, prop_id, seq_num, report_detail_type, permit_id, permit_num, issued_to,
			 issuer, issue_date, limit_date, street_num, street_prefix, street_name, street_suffix,
			 city, source, active, type_cd, type_desc, issuer_desc, permit_val, sub_type_cd,
			 sub_type_desc, res_com, cad_status, cad_status_desc, unit_type, unit_number,
			 sub_division, plat, block, lot, area, dim1, dim2, dim3, building_inspection_required,
			 electrical_inspection_required, mechanical_inspection_required, plumbing_inspection_required,
			 builder, date_worked, appraiser_nm, builder_phone, date_complete, land_use,
			 owner_phone, last_changed_date, percent_complete, case_name, imported_prop_id,
			 comment, project_num, project_name, description, other_id)
			values
			(@dataset_id, @prop_id, @seq_num, 'PMTDETAIL', @permit_id, @permit_num, @issued_to, @issuer, 
			@issue_date, @limit_date, @street_num, @street_prefix, @street_name, @street_suffix,
			@city, @source, @active, @type_cd, @type_desc, @issuer_desc, @permit_val,
			@sub_type_cd, @sub_type_desc, @res_com, @cad_status, @cad_status_desc,
			@unit_type, @unit_number, @sub_division, @plat, @block, @lot, @area,
			@dim1, @dim2, @dim3, @building_inspection_required, @electrical_inspection_required,
			@mechanical_inspection_required, @plumbing_inspection_required, @builder,
			@date_worked, @appraiser_nm, @builder_phone, @date_complete, @land_use,
			@owner_phone, @last_changed_date, @percent_complete, @case_name, @imported_prop_id,
			@comment, @project_num, @project_name, @description, @other_id)

			set @seq_num = @seq_num + 1

			insert ##appraisal_card_bp_report_data
			(dataset_id, prop_id, seq_num, report_detail_type)
			values
			(@dataset_id, @prop_id, @seq_num, 'PROPHEADING')

			set @seq_num = @seq_num + 1

			set @prev_permit_id = @permit_id
		end

		if @prev_permit_id = @permit_id
		begin
			insert ##appraisal_card_bp_report_data
			(dataset_id, prop_id, seq_num, report_detail_type, prop_type_cd, prop_prop_id, 
			 prop_owner_name, prop_legal_desc, prop_map_id, prop_abs_subdv_cd, prop_other,
			 prop_appraised_val)
			values
			(@dataset_id, @prop_id, @seq_num, 'PROPDETAIL', @prop_type_cd, @prop_prop_id,
			 @prop_owner_name, @prop_legal_desc, @prop_map_id, @prop_abs_subdv_cd, @prop_other,
			 @prop_appraised_val)

			set @seq_num = @seq_num + 1
		end

		set @prev_prop_id = @prop_id
		set @prev_permit_id = @permit_id

		fetch next from curBPData into @prop_id, @permit_id, @permit_num, @issued_to, @permit_status, @issuer, 
			@issue_date, @limit_date, @street_num, @street_prefix, @street_name, @street_suffix,
			@city, @source, @active, @type_cd, @type_desc, @issuer_desc, @permit_val,
			@sub_type_cd, @sub_type_desc, @res_com, @cad_status, @cad_status_desc,
			@unit_type, @unit_number, @sub_division, @plat, @block, @lot, @area,
			@dim1, @dim2, @dim3, @building_inspection_required, @electrical_inspection_required,
			@mechanical_inspection_required, @plumbing_inspection_required, @builder,
			@date_worked, @appraiser_nm, @builder_phone, @date_complete, @land_use,
			@owner_phone, @last_changed_date, @percent_complete, @case_name, @imported_prop_id,
			@comment, @project_num, @project_name, @description, @other_id, @prop_prop_id, @prop_type_cd,
			@prop_owner_name, @prop_legal_desc, @prop_map_id, @prop_abs_subdv_cd,
			@prop_other, @prop_appraised_val
	end

	if @prev_prop_id > -1
	begin
		insert ##appraisal_card_bp_report_data
		(dataset_id, prop_id, seq_num, report_detail_type)
		values
		(@dataset_id, @prev_prop_id, @seq_num, 'RPTFOOTER')
	end

	close curBPData
	deallocate curBPData

	-- logging end of step 
	SELECT @LogTotRows = @curRows, 
		   @LogErrCode = 0 
	   SET @LogStatus =  'Step 31 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step


	update ##appraisal_card_bp_report_data
	set end_page_number = t.counter
	from ##appraisal_card_bp_report_data as acbrd
	join
	(
		select prop_id, count(dataset_id) as counter
		from ##appraisal_card_bp_report_data as a
		with (nolock)
		where dataset_id = @dataset_id
		and report_detail_type = 'PMTDETAIL'
		group by prop_id
	) as t
	on acbrd.prop_id = t.prop_id
	
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 32 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

--	print 'End  Building Permit Report Data - ' + convert(varchar, getdate(), 109)
end

if @include_pcw_report = 1
begin
	-- Insert Header Data Row
	insert into ##appraisal_card_permanent_crop_report (
		dataset_id, 
		prop_id, 
		[year], 
		sup_num, 
		report_detail_type,
		seq_num,
		owner_name, imprv_id, geo_id, legal_acreage, 
		situs, land_acres, planted_acres, 
		non_planted_acres, indicated_total_value
	)
	select top 1
		acpa.dataset_id, 
		acpa.prop_id, 
		acpa.[year], 
		acpa.sup_num, 
		'HEADER',
		1,
		a.file_as_name, i.imprv_id, p.geo_id, pv.legal_acreage, 
		situs.situs_display, i.permanent_crop_land_acres, i.permanent_crop_planted_acres, 
		i.permanent_crop_land_acres - i.permanent_crop_planted_acres, i.imprv_val
	from ##appraisal_card_prop_assoc as acpa with (nolock)
	join [property] as p with (nolock) on p.prop_id = acpa.prop_id
	left join situs with (nolock) on situs.prop_id = acpa.prop_id and situs.primary_situs = 'Y'
	join property_val as pv with (nolock) on
			pv.prop_id = acpa.prop_id
		and pv.prop_val_yr = acpa.[year]
		and pv.sup_num = acpa.sup_num
	join [owner] as o with (nolock) on
			o.prop_id = acpa.prop_id
		and o.owner_tax_yr = acpa.[year]
		and o.sup_num = acpa.sup_num
	join account as a with (nolock) on
			a.acct_id = o.owner_id
	join imprv as i with (nolock) on
			i.prop_id = acpa.prop_id
		and i.prop_val_yr = acpa.[year]
		and i.sup_num = acpa.sup_num
	join imprv_type as itype with (nolock) on
			itype.imprv_type_cd = i.imprv_type_cd
		and itype.is_permanent_crop = 1
	where acpa.dataset_id = @dataset_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 33 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	-- Insert Crop Improvement Details Rows
	insert into ##appraisal_card_permanent_crop_report (
		dataset_id, 
		prop_id, 
		[year], 
		sup_num, 
		report_detail_type,
		seq_num,
		imprv_id, imprv_det_id, imprv_det_type_cd, imprv_det_meth_cd, 
		imprv_det_class_cd, yr_built, imprv_det_val_source, imprv_det_val
	)
	select
		@dataset_id, 
		i.prop_id, 
		i.[year], 
		i.sup_num, 
		'CROP_DETAIL',
		2,
		i.imprv_id, 
		det.imprv_det_id, det.imprv_det_type_cd, det.imprv_det_meth_cd, det.imprv_det_class_cd, 
		det.yr_built, det.imprv_det_val_source, det.imprv_det_val
	from ##appraisal_card_permanent_crop_report as i
	join imprv_detail as det with (nolock) on
			det.prop_id = i.prop_id
		and det.prop_val_yr = i.[year]
		and det.sup_num = i.sup_num
		and det.imprv_id = i.imprv_id
	join imprv_det_type as idt with (nolock) on
			idt.imprv_det_type_cd = det.imprv_det_type_cd
		and idt.is_permanent_crop_detail = 1
	where i.report_detail_type = 'HEADER' and i.dataset_id = @dataset_id
	
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 34 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	-- Create a totals row to put totals in
	insert into ##appraisal_card_permanent_crop_report (
		dataset_id, 
		prop_id, 
		[year], 
		sup_num, 
		report_detail_type,
		seq_num,
		imprv_id,
		imprv_det_val
	)
	select
		i.dataset_id, 
		i.prop_id, 
		i.[year], 
		i.sup_num, 
		'CROP_TOTAL',
		3,
		i.imprv_id, 
		sum(isnull(det.imprv_det_val, 0))
	from ##appraisal_card_permanent_crop_report as i
	join imprv_detail as det with (nolock) on
			det.prop_id = i.prop_id
		and det.prop_val_yr = i.[year]
		and det.sup_num = i.sup_num
		and det.imprv_id = i.imprv_id
	join imprv_det_type as idt with (nolock) on
			idt.imprv_det_type_cd = det.imprv_det_type_cd
		and idt.is_permanent_crop_detail = 1
	where i.report_detail_type = 'HEADER' and i.dataset_id = @dataset_id
	group by i.dataset_id, i.prop_id, i.[year], i.sup_num, i.imprv_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 35 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	-- set the column names to display based on meta settings and configuration for the data header row
	declare @positioning_index int
	declare @field_count int
	declare @field_name varchar(50)
	declare @exec_stmt varchar(4000)

	set @positioning_index = 0
	set @field_count = 1

	while @positioning_index < 7
	begin
		set @field_name = null
		select @field_name = mpc.field_name  
		from permanent_crop_configuration as pcc with (nolock)
		join meta_permanent_crop as mpc with (nolock) on 
				pcc.field_id = mpc.field_id
		where pcc.visible = 1 and [year] = @year and mpc.positioning_index = @positioning_index

		if @field_name is not null
		begin
			set @exec_stmt = 'update ##appraisal_card_permanent_crop_report set column_' + cast(@field_count as varchar) + '_name = ''' + @field_name + ''' where dataset_id = ' + cast(@dataset_id as varchar)
			execute(@exec_stmt)

			set @field_count = @field_count + 1
		end

		set @positioning_index = @positioning_index + 1
	end

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 36 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	-- Update Detail values to display based on meta settings and configuration
	set @positioning_index = 0
	set @field_count = 1

	while @positioning_index < 7
	begin
		set @field_name = null
		select @field_name = mpc.binding_column_name  
		from permanent_crop_configuration as pcc with (nolock)
		join meta_permanent_crop as mpc with (nolock) on 
				pcc.field_id = mpc.field_id
		where pcc.visible = 1 and [year] = @year and mpc.positioning_index = @positioning_index

		if @field_name is not null
		begin
			set @exec_stmt = '
				update ##appraisal_card_permanent_crop_report 
				set column_' + cast(@field_count as varchar) + '_value = det.[' + @field_name + ']
				from ##appraisal_card_permanent_crop_report as i
				join imprv_detail as det with (nolock) on
						det.prop_id = i.prop_id
					and det.prop_val_yr = i.[year]
					and det.sup_num = i.sup_num
					and det.imprv_id = i.imprv_id
					and det.imprv_det_id = i.imprv_det_id
					and det.prop_val_yr = ' + cast(@year as varchar) + '
				where report_detail_type=''CROP_DETAIL'' and dataset_id = ' + cast(@dataset_id as varchar)

			execute(@exec_stmt)

			if @field_name = 'permanent_crop_acres' or @field_name = 'permanent_crop_irrigation_acres'
			begin
				set @exec_stmt = '
				update ##appraisal_card_permanent_crop_report
				set 
					column_' + cast(@field_count as varchar) + '_value = child.summed_value
				from ##appraisal_card_permanent_crop_report as parent
				join (
					select 
						i.dataset_id, i.prop_id, i.[year], i.sup_num, i.report_detail_type, i.seq_num, i.imprv_id,
						sum(det.[' + @field_name + ']) as summed_value
					from  ##appraisal_card_permanent_crop_report as i
					join imprv_detail as det with (nolock) on
							det.prop_id = i.prop_id
						and det.prop_val_yr = i.[year]
						and det.sup_num = i.sup_num
						and det.imprv_id = i.imprv_id
					join imprv_det_type as idt with (nolock) on
							idt.imprv_det_type_cd = det.imprv_det_type_cd
						and idt.is_permanent_crop_detail = 1
					where i.report_detail_type = ''CROP_TOTAL'' and i.dataset_id = ' + cast(@dataset_id as varchar) + '
					group by 
						i.dataset_id, i.prop_id, i.[year], i.sup_num, i.report_detail_type, i.seq_num, i.imprv_id
				) as child on
						child.dataset_id = parent.dataset_id
					and child.prop_id = parent.prop_id
					and child.[year] = parent.[year]
					and child.sup_num = parent.sup_num
					and child.report_detail_type = parent.report_detail_type
					and child.seq_num = parent.seq_num
					and child.imprv_id = parent.imprv_id
				where	parent.report_detail_type = ''CROP_TOTAL'' 
					and parent.dataset_id = ' + cast(@dataset_id as varchar)

				execute(@exec_stmt)
			end

			set @field_count = @field_count + 1
		end

		set @positioning_index = @positioning_index + 1
	end

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 37 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step
	
	-- Insert Land Detail Columns Row
	insert into ##appraisal_card_permanent_crop_report (
		dataset_id, 
		prop_id, 
		[year], 
		sup_num, 
		report_detail_type,
		seq_num
	)
	select 
		acpa.dataset_id, 
		acpa.prop_id, 
		acpa.[year], 
		acpa.sup_num, 
		'LAND_DETAIL_COLUMNS',
		4
	from ##appraisal_card_prop_assoc as acpa with (nolock)
	where dataset_id = @dataset_id


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 38 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step
		
	-- Insert Land Detail Data Rows
	insert into ##appraisal_card_permanent_crop_report (
		dataset_id, 
		[year], 
		prop_id, 
		sup_num, 
		report_detail_type,
		seq_num,
		land_seg_id, land_type_cd, land_class_code, 
		primary_use_cd, size_acres, land_soil_code, cu_table, cu_value)
	select
		@dataset_id, 
		i.[year], 
		i.prop_id, 
		i.sup_num,
		'LAND_DETAIL',
		5,
		ld.land_seg_id, ld.land_type_cd, ld.land_class_code,
		ld.primary_use_cd, ld.size_acres, ld.land_soil_code, ls.ls_code, ld.ag_val
	from ##appraisal_card_prop_assoc as i
	join land_detail as ld with (nolock) on
			ld.prop_id = i.prop_id
		and ld.prop_val_yr = i.[year]
		and ld.sup_num = i.sup_num
	join land_type as lt with (nolock) on
			lt.land_type_cd = ld.land_type_cd
		and lt.is_permanent_crop = 1
	left join land_sched as ls with (nolock) on
			ls.ls_id = ld.ls_ag_id 
		and ls.ls_year = ld.prop_val_yr
	where i.dataset_id = @dataset_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 39 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step
	
	-- Insert Land Total Data Rows
	insert into ##appraisal_card_permanent_crop_report (
		dataset_id, 
		[year], 
		prop_id, 
		sup_num, 
		report_detail_type,
		seq_num,
		size_acres, 
		cu_value
	)
	select
		i.dataset_id, 
		i.[year], 
		i.prop_id, 
		i.sup_num,
		'LAND_TOTAL',
		6,
		sum(ld.size_acres),
		sum(ld.ag_val)
	from ##appraisal_card_prop_assoc as i
	join land_detail as ld with (nolock) on
			ld.prop_id = i.prop_id
		and ld.prop_val_yr = i.[year]
		and ld.sup_num = i.sup_num
	join land_type as lt with (nolock) on
			lt.land_type_cd = ld.land_type_cd
		and lt.is_permanent_crop = 1
	left join land_sched as ls with (nolock) on
			ls.ls_id = ld.ls_ag_id 
		and ls.ls_year = ld.prop_val_yr
	where i.dataset_id = @dataset_id
	group by i.dataset_id, i.[year], i.prop_id, i.sup_num
	
	
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 40 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step
	
end




if @include_ms_commercial_report = 1
begin
--	print ''
--	print 'Begin MS Commercial Report Data - ' + convert(varchar, getdate(), 109)

	declare @initial_page_number int
/**********************************/

	declare @section_counter int
	declare @section_id int
	declare @occupancy_id int
	declare @component_id int
	declare @prev_section_id int
	declare @prev_occupancy_id int
	declare @prev_component_id int

	declare @calculated_date datetime
	declare @report_date datetime
	declare @estimate_total_area numeric(14,1)
	declare @estimate_total_cost_new numeric(14,0)
	declare @estimate_total_depreciation_amount numeric(14,0)
	declare @estimate_total_depreciated_cost numeric(14,0)
	declare @section_description varchar(50)
	declare @section_area numeric(14,1)
	declare @stories numeric(5,2)
	declare @section_perimeter_shape_flag char(1)
	declare @section_perimeter numeric(14,1)
	declare @section_shape int
	declare @effective_age int
	declare @remarks varchar(1000)
	declare @section_total_cost_new numeric(14,0)
	declare @section_depreciation_amount numeric(14,0)
	declare @section_depreciated_cost numeric(14,0)
	declare @section_base_cost_total_cost_new numeric(14,0)
	declare @section_base_cost_calc_unit_cost numeric(14,2)
	declare @section_base_cost_depreciation_amount numeric(14,0)
	declare @section_base_cost_depreciated_cost numeric(14,0)
	declare @occupancy_code varchar(5)
	declare @occupancy_description varchar(50)
	declare @occupancy_name varchar(50)
	declare @occupancy_pct numeric(5,2)
	declare @occupancy_class char(1)
	declare @occupancy_height numeric(5,2)
	declare @occupancy_rank numeric(2,1)
	declare @component_code varchar(5)
	declare @component_description varchar(50)
	declare @component_system_description varchar(50)
	declare @component_pct numeric(5,2)
	declare @component_units numeric(8,2)
	declare @component_total_cost_new numeric(14,0)
	declare @component_calc_unit_cost numeric(14,2)
	declare @component_depreciation_amount numeric(14,0)
	declare @component_depreciated_cost numeric(14,0)
	declare @basement_section_id int
	declare @basement_section_description varchar(50)
	declare @basement_levels numeric(5,2)
	declare @basement_perimeter_shape_flag char(1)
	declare @basement_perimeter numeric(14,1)
	declare @basement_shape int
	declare @basement_area numeric(14,1)
	declare @basement_base_cost_total_cost_new numeric(14,0)
	declare @basement_base_cost_calc_unit_cost numeric(14,2)
	declare @basement_base_cost_depreciation_amount numeric(14,0)
	declare @basement_base_cost_depreciated_cost numeric(14,0)
	declare @basement_fireproof_flag bit
	declare @basement_fireproof_total_cost_new numeric(14,0)
	declare @basement_fireproof_calc_unit_cost numeric(14,2)
	declare @basement_fireproof_depreciation_amount numeric(14,0)
	declare @basement_fireproof_depreciated_cost numeric(14,0)
	declare @basement_total_cost_new numeric(14,0)
	declare @basement_depreciation_amount numeric(14,0)
	declare @basement_depreciated_cost numeric(14,0)
	declare @addition_description varchar(50)
	declare @addition_units numeric(8,2)
	declare @addition_calc_unit_cost numeric(14,2)
	declare @addition_total_cost_new numeric(14,0)
	declare @addition_depreciation_amount numeric(14,0)
	declare @addition_depreciated_cost numeric(14,0)
	
	declare @dep_physical numeric(5,2)
	declare @dep_physical_amount numeric(14,0)
	declare @dep_functional numeric(5,2)
	declare @dep_functional_amount numeric(14,0)
	declare @dep_physical_functional numeric(5,2)
	declare @dep_physical_functional_amount numeric(14,0)
	declare @dep_external numeric(5,2)
	declare @dep_external_amount numeric(14,0)
	declare @dep_additional_functional numeric(5,2)
	declare @dep_additional_functional_amount numeric(14,0)
	
	declare @basement_dep_physical_amount numeric(14,0)
	declare @basement_dep_functional_amount numeric(14,0)
	declare @basement_dep_physical_functional_amount numeric(14,0)
	declare @basement_dep_external_amount numeric(14,0)
	declare @basement_dep_additional_functional_amount numeric(14,0)

	declare @total_component_total_cost_new numeric(14,0)
	declare @total_component_unit_cost numeric(14,2)
	declare @total_component_depreciation_amount numeric(14,0)
	declare @total_component_depreciated_cost numeric(14,0)

	declare @total_addition_total_cost_new numeric(14,0)
	declare @total_addition_unit_cost numeric(14,2)
	declare @total_addition_depreciation_amount numeric(14,0)
	declare @total_addition_depreciated_cost numeric(14,0)

	declare @prev_component_system varchar(50)
	declare @prev_estimate_total_area numeric(14,1)
	declare @prev_estimate_total_cost_new numeric(14,0)
	declare @prev_estimate_total_depreciation_amount numeric(14,0)
	declare @prev_estimate_total_depreciated_cost numeric(14,0)

	declare @perimeter_shape_label varchar(10)
	declare @perimeter_shape_value numeric(14,1)

	set @seq_num = 0
	set @prev_prop_id = 0
	set @prev_imprv_id = 0
	set @prev_imprv_det_id = 0
	set @prev_section_id = 0
	set @prev_occupancy_id = 0
	set @prev_component_id = 0
	set @prev_component_system = ''
    set @curRows = 0
    
	declare @tblSectionOccupancies table
	(
		basement_flag bit not null default(0),
		occupancy_id int not null,
		occupancy_code varchar(5) not null,
		occupancy_description varchar(50) not null,
		occupancy_name varchar(50) null,
		occupancy_pct numeric(5,2) null,
		class char(1) null,
		height numeric(5,2) null,
		quality_rank numeric(2,1) null,
		basement_type_description varchar(50) null,
		basement_area numeric(14,1) null
	)

	declare @tblSectionComponents table
	(
		basement_flag bit not null default(0),
		component_id int not null,
		component_code varchar(5) not null,
		component_description varchar(50) not null,
		component_system_description varchar(50) not null,
		component_pct numeric(5,2) null,
		units numeric(8,2) null,
		unit_cost numeric(14,2) null,
		total_cost_new numeric(14,0) null,
		depreciation_amount numeric(14,0) null,
		depreciated_cost numeric(14,0) null
	)

	declare curEstimate cursor fast_forward
	for select acip.[year], acip.sup_num, acip.sale_id, acip.prop_id,
		acip.imprv_id, acip.imprv_det_id, idce.calculated_date, idce.report_date,
		idce.total_area, idce.total_cost_new as estimate_total_cost_new,
		idce.total_depreciation_amount as estimate_total_depreciation_amount, 
		idce.total_depreciated_cost as estimate_total_depreciated_cost, idcs.section_id,
		idcs.section_description, idcs.area as section_area, idcs.stories,
		idcs.perimeter_shape_flag, idcs.perimeter, idcs.shape,
		idcs.prop_val_yr - idcs.effective_year_built as effective_age,
		idcs.remarks, idcs.total_cost_new as section_total_cost_new,
		idcs.depreciation_amount as section_depreciation_amount,
		idcs.depreciated_cost as section_depreciated_cost,
		idcs.calc_dep_physical_pct, idcs.calc_dep_physical_amount,
		idcs.calc_dep_functional_pct, idcs.calc_dep_functional_amount,
		idcs.calc_dep_combined_pct, idcs.calc_dep_combined_amount,
		idcs.calc_dep_external_pct, idcs.calc_dep_external_amount,
		idcs.calc_dep_additional_functional_pct, idcs.calc_dep_additional_functional_amount,
		idcs.base_cost_total_cost_new as section_base_cost_total_cost_new,
		idcs.base_cost_calc_unit_cost as section_base_cost_calc_unit_cost,
		idcs.base_cost_depreciation_amount as section_base_cost_depreciation_amount,
		idcs.base_cost_depreciated_cost as section_base_cost_depreciated_cost,

		isnull(idcsb.section_id,0) as basement_section_id, idcsb.section_description as basement_section_description,
		idcsb.stories as basement_levels, idcsb.perimeter_shape_flag as basement_perimeter_shape_flag,
		idcsb.perimeter as basement_perimeter, idcsb.shape as basement_shape, isnull(idcsb.area,0) as basement_area,
		isnull(idcsb.base_cost_total_cost_new,0) as basement_base_cost_total_cost_new,
		isnull(idcsb.base_cost_calc_unit_cost,0) as basement_base_cost_calc_unit_cost,
		isnull(idcsb.base_cost_depreciation_amount,0) as basement_base_cost_depreciation_amount,
		isnull(idcsb.base_cost_depreciated_cost,0) as basement_base_cost_depreciated_cost,
		idcsb.basement_fireproof_flag, isnull(idcsb.basement_fireproof_total_cost_new,0),
		isnull(idcsb.basement_fireproof_calc_unit_cost,0), isnull(idcsb.basement_fireproof_depreciation_amount,0),
		isnull(idcsb.basement_fireproof_depreciated_cost,0),
		isnull(idcsb.total_cost_new,0) as basement_total_cost_new,
		isnull(idcsb.depreciation_amount,0) as basement_depreciation_amount,
		isnull(idcsb.depreciated_cost,0) as basement_depreciated_cost,
		isnull(idcsb.calc_dep_physical_amount,0) as basement_dep_physical_amount,
		isnull(idcsb.calc_dep_functional_amount,0) as basement_dep_functional_amount,
		isnull(idcsb.calc_dep_combined_amount,0) as basement_dep_physical_functional_amount,
		isnull(idcsb.calc_dep_external_amount,0) as basement_dep_external_amount,
		isnull(idcsb.calc_dep_additional_functional_amount,0) as basement_dep_additional_functional_amount,
	
		acip.page_number

		from ##appraisal_card_improvement_paging as acip
		with (nolock)
		join imprv_detail_cms_estimate as idce
		with (nolock)
		on acip.[year] = idce.prop_val_yr
		and acip.sup_num = idce.sup_num
		and acip.sale_id = idce.sale_id
		and acip.prop_id = idce.prop_id
		and acip.imprv_id = idce.imprv_id
		and acip.imprv_det_id = idce.imprv_det_id
		join imprv_detail_cms_section as idcs
		with (nolock)
		on idce.prop_val_yr = idcs.prop_val_yr
		and idce.sup_num = idcs.sup_num
		and idce.sale_id = idcs.sale_id
		and idce.prop_id = idcs.prop_id
		and idce.imprv_id = idcs.imprv_id
		and idce.imprv_det_id = idcs.imprv_det_id

		left outer join imprv_detail_cms_section as idcsb
		with (nolock)
		on idcs.prop_val_yr = idcsb.prop_val_yr
		and idcs.sup_num = idcsb.sup_num
		and idcs.sale_id = idcsb.sale_id
		and idcs.prop_id = idcsb.prop_id
		and idcs.imprv_id = idcsb.imprv_id
		and idcs.imprv_det_id = idcsb.imprv_det_id
		and idcs.section_id = idcsb.basement_building_section_id

		where acip.dataset_id = @dataset_id
		and isnull(idcs.basement_building_section_id,0) = 0
		order by idce.prop_id, idce.imprv_id, idce.imprv_det_id, idcs.section_id

	open curEstimate

	fetch next from curEstimate into @year, @sup_num, @sale_id, @prop_id,
		@imprv_id, @imprv_det_id, @calculated_date, @report_date,
		@estimate_total_area, @estimate_total_cost_new, @estimate_total_depreciation_amount,
		@estimate_total_depreciated_cost, @section_id, @section_description, @section_area,
		@stories, @section_perimeter_shape_flag, @section_perimeter, @section_shape,
		@effective_age, @remarks, @section_total_cost_new, @section_depreciation_amount,
		@section_depreciated_cost, 
		
		@dep_physical, @dep_physical_amount,
		@dep_functional, @dep_functional_amount,
		@dep_physical_functional, @dep_physical_functional_amount,
		@dep_external, @dep_external_amount,
		@dep_additional_functional, @dep_additional_functional_amount,
		
		@section_base_cost_total_cost_new, 
		@section_base_cost_calc_unit_cost, @section_base_cost_depreciation_amount,
		@section_base_cost_depreciated_cost, 

		@basement_section_id, @basement_section_description,
		@basement_levels, @basement_perimeter_shape_flag,
		@basement_perimeter, @basement_shape, @basement_area,
		@basement_base_cost_total_cost_new, 
		@basement_base_cost_calc_unit_cost, @basement_base_cost_depreciation_amount,
		@basement_base_cost_depreciated_cost, @basement_fireproof_flag,
		@basement_fireproof_total_cost_new, @basement_fireproof_calc_unit_cost, 
		@basement_fireproof_depreciation_amount, @basement_fireproof_depreciated_cost,
		@basement_total_cost_new, @basement_depreciation_amount,
		@basement_depreciated_cost,
		
		@basement_dep_physical_amount, @basement_dep_functional_amount,
		@basement_dep_physical_functional_amount, @basement_dep_external_amount,
		@basement_dep_additional_functional_amount,
		
		@initial_page_number

	while @@fetch_status = 0
	begin
	    set @curRows = @curRows + 1
		if @prev_prop_id <> @prop_id or
			@prev_imprv_id <> @imprv_id or
			@prev_imprv_det_id <> @imprv_det_id
		begin
			if @prev_prop_id > 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, heading, units, unit_cost,
				 total_cost_new, depreciation_amount, depreciated_cost)
				values
				(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @prev_imprv_id, @prev_imprv_det_id, @seq_num,
				 'ESTIMATE_FOOTER', 'ESTIMATE TOTALS: ', 
				 @prev_estimate_total_area, 
				 case when isnull(@prev_estimate_total_area, 0) > 0 
				 then @prev_estimate_total_depreciated_cost / @prev_estimate_total_area
				 else 0 end,				 
				 @prev_estimate_total_cost_new, @prev_estimate_total_depreciation_amount, 
				 @prev_estimate_total_depreciated_cost)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @prev_year, @prev_sup_num, @prev_sale_id, @prev_prop_id, @prev_imprv_id, @prev_imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
			end

			set @prev_section_id = 0
			set @prev_occupancy_id = 0
			set @section_counter = 1
		end

		if @prev_section_id <> @section_id
		begin
			if @prev_section_id = 0
			begin
				set @page_number = @initial_page_number + 1
			end
			else
			begin
				set @page_number = @page_number + 1
			end

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, calculated_date, report_date)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'ESTIMATE_HEADER', @calculated_date, @report_date)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			
			if @section_perimeter_shape_flag = 'S'
			begin
				set @perimeter_shape_label = 'Shape:'
				set @perimeter_shape_value = @section_shape
			end
			else
			begin
				set @perimeter_shape_label = 'Perimeter:'
				set @perimeter_shape_value = @section_perimeter
			end

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, heading, effective_age, stories, perimeter_shape_label,
			 perimeter_shape_value, area)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'SECTION_HEADER', 'Section ' + convert(varchar, @section_counter) + ': ' +
			 @section_description, @effective_age, @stories, @perimeter_shape_label,
			 @perimeter_shape_value, @section_area)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			delete from @tblSectionOccupancies

			insert @tblSectionOccupancies
			(basement_flag, occupancy_id, occupancy_code, occupancy_description, occupancy_name,
			 occupancy_pct, class, height, quality_rank, basement_type_description,
			 basement_area)

			select 0,
				idco.occupancy_id, idco.occupancy_code, idco.occupancy_description, idco.occupancy_name,
				idco.occupancy_pct, idco.class, idco.height, idco.quality_rank,
				idco.basement_type_description, idco.basement_area

			from imprv_detail_cms_occupancy as idco
			with (nolock)
			where idco.prop_val_yr = @year
			and idco.sup_num = @sup_num
			and idco.sale_id = @sale_id
			and idco.prop_id = @prop_id
			and idco.imprv_id = @imprv_id
			and idco.imprv_det_id = @imprv_det_id
			and idco.section_id = @section_id

			insert @tblSectionOccupancies
			(basement_flag, occupancy_id, occupancy_code, occupancy_description, occupancy_name,
			 occupancy_pct, class, height, quality_rank, basement_type_description,
			 basement_area)

			select 1,
				idco.occupancy_id, idco.occupancy_code, idco.occupancy_description, idco.occupancy_name,
				idco.occupancy_pct, idco.class, idco.height, idco.quality_rank,
				idco.basement_type_description, idco.basement_area

			from imprv_detail_cms_occupancy as idco
			with (nolock)
			where idco.prop_val_yr = @year
			and idco.sup_num = @sup_num
			and idco.sale_id = @sale_id
			and idco.prop_id = @prop_id
			and idco.imprv_id = @imprv_id
			and idco.imprv_det_id = @imprv_det_id
			and idco.section_id = @basement_section_id

			delete from @tblSectionComponents

			insert @tblSectionComponents
			(basement_flag, component_id, component_code, component_description,
			 component_system_description, component_pct, units, unit_cost,
			 total_cost_new, depreciation_amount, depreciated_cost)
			
			select 0,
				idcc.component_id, idcc.component_code, idcc.component_description,
				idcc.component_system_description, idcc.component_pct, idcc.units,
				idcc.calc_unit_cost, idcc.total_cost_new, idcc.depreciation_amount,
				idcc.depreciated_cost
			from imprv_detail_cms_component as idcc
			with (nolock)
			where idcc.prop_val_yr = @year
			and idcc.sup_num = @sup_num
			and idcc.sale_id = @sale_id
			and idcc.prop_id = @prop_id
			and idcc.imprv_id = @imprv_id
			and idcc.imprv_det_id = @imprv_det_id
			and idcc.section_id = @section_id

			insert @tblSectionComponents
			(basement_flag, component_id, component_code, component_description,
			 component_system_description, component_pct, units, unit_cost,
			 total_cost_new, depreciation_amount, depreciated_cost)
			
			select 1,
				idcc.component_id, idcc.component_code, idcc.component_description,
				idcc.component_system_description, idcc.component_pct, idcc.units,
				idcc.calc_unit_cost, idcc.total_cost_new, idcc.depreciation_amount,
				idcc.depreciated_cost
			from imprv_detail_cms_component as idcc
			with (nolock)
			where idcc.prop_val_yr = @year
			and idcc.sup_num = @sup_num
			and idcc.sale_id = @sale_id
			and idcc.prop_id = @prop_id
			and idcc.imprv_id = @imprv_id
			and idcc.imprv_det_id = @imprv_det_id
			and idcc.section_id = @basement_section_id

			set @seq_num = @seq_num + 1
			set @prev_section_id = @section_id
			set @line_count = 0
		end

		insert ##appraisal_card_ms_commercial_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 'SECTION_OCC_HEADER')

		insert ##appraisal_card_ms_commercial_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 page_number)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 @page_number)

		set @seq_num = @seq_num + 1

		declare curSectionOccupancies cursor fast_forward
		for select occupancy_code, occupancy_description, occupancy_name, occupancy_pct,
				class, height, quality_rank
			from @tblSectionOccupancies
			where basement_flag = 0
			order by occupancy_id

		open curSectionOccupancies

		fetch next from curSectionOccupancies into @occupancy_code, @occupancy_description, @occupancy_name,
			@occupancy_pct, @occupancy_class, @occupancy_height, @occupancy_rank

		while @@fetch_status = 0
		begin
			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, code, description, type_description, percentage, 
			 class, height, quality_rank)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'SECTION_OCC_DETAILS', @occupancy_code, @occupancy_description, @occupancy_name, @occupancy_pct,
			 @occupancy_class, @occupancy_height, @occupancy_rank)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			
			set @line_count = @line_count + 1
			
			fetch next from curSectionOccupancies into @occupancy_code, @occupancy_description, @occupancy_name,
				@occupancy_pct, @occupancy_class, @occupancy_height, @occupancy_rank
		end

		close curSectionOccupancies
		deallocate curSectionOccupancies

		set @prev_component_system = ''

		insert ##appraisal_card_ms_commercial_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 'SECTION_COMP_HEADER')

		insert ##appraisal_card_ms_commercial_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 page_number)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 @page_number)

		set @line_count = @line_count + 1
		set @seq_num = @seq_num + 1

		declare curSectionComponents cursor fast_forward
		for select component_system_description, component_description, 
					units, component_pct
			from @tblSectionComponents
			where basement_flag = 0
			order by component_system_description

		open curSectionComponents

		fetch next from curSectionComponents into @component_system_description,
			@component_description, @component_units, @component_pct

		while @@fetch_status = 0
		begin
			if @prev_component_system <> @component_system_description
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, heading)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'SECTION_COMP_GROUP_HEADER', @component_system_description)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @line_count = @line_count + 1
				set @seq_num = @seq_num + 1
			end

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, description, units, percentage)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'SECTION_COMP_DETAILS', @component_description, @component_units, @component_pct)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 1

			set @prev_component_system = @component_system_description

			fetch next from curSectionComponents into @component_system_description,
				@component_description, @component_units, @component_pct
		end

		close curSectionComponents
		deallocate curSectionComponents

		if @basement_section_id > 0
		begin
			if @basement_perimeter_shape_flag = 'S'
			begin
				set @perimeter_shape_label = 'Shape:'
				set @perimeter_shape_value = @basement_shape
			end
			else
			begin
				set @perimeter_shape_label = 'Perimeter:'
				set @perimeter_shape_value = @basement_perimeter
			end

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, heading, stories, perimeter_shape_label, perimeter_shape_value)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'BASEMENT_SECTION_HEADER', 'Basement: ' + @basement_section_description, @basement_levels,
			 @perimeter_shape_label, @perimeter_shape_value)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 2

			declare curBasementOccupancies cursor fast_forward
			for select occupancy_code, occupancy_description, occupancy_name, occupancy_pct,
					class, height, quality_rank
				from @tblSectionOccupancies
				where basement_flag = 1
				order by occupancy_id

			open curBasementOccupancies

			fetch next from curBasementOccupancies into @occupancy_code, @occupancy_description, @occupancy_name, 
				@occupancy_pct, @occupancy_class, @occupancy_height, @occupancy_rank

			while @@fetch_status = 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, code, description, type_description, percentage, 
				 class, height, quality_rank)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'BASEMENT_OCC_DETAILS', @occupancy_code, @occupancy_description, @occupancy_name, @occupancy_pct,
				 @occupancy_class, @occupancy_height, @occupancy_rank)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = @line_count + 1
				
				fetch next from curBasementOccupancies into @occupancy_code, @occupancy_description, @occupancy_name, 
					@occupancy_pct, @occupancy_class, @occupancy_height, @occupancy_rank
			end

			close curBasementOccupancies
			deallocate curBasementOccupancies

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'BASEMENT_COMP_HEADER')

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 1

			set @prev_component_system = ''

			declare curBasementComponents cursor fast_forward
			for select component_system_description, component_description, 
						units, component_pct
				from @tblSectionComponents
				where basement_flag = 1
				order by component_system_description

			open curBasementComponents

			fetch next from curBasementComponents into @component_system_description,
				@component_description, @component_units, @component_pct

			while @@fetch_status = 0
			begin
				if @prev_component_system <> @component_system_description
				begin
					insert ##appraisal_card_ms_commercial_report
					(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
					 report_detail_type, heading)
					values
					(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
					 'BASEMENT_COMP_GROUP_HEADER', @component_system_description)

					insert ##appraisal_card_ms_commercial_paging
					(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
					 page_number)
					values
					(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
					 @page_number)

					set @seq_num = @seq_num + 1
					set @line_count = @line_count + 1
					set @prev_component_system = @component_system_description
				end

				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, units, percentage)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'BASEMENT_COMP_DETAILS', @component_description, @component_units, @component_pct)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = @line_count + 1

				fetch next from curBasementComponents into @component_system_description,
					@component_description, @component_units, @component_pct
			end

			close curBasementComponents
			deallocate curBasementComponents
		end

		insert ##appraisal_card_ms_commercial_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type, heading, units, unit_cost, total_cost_new,
		 depreciation_amount, depreciated_cost)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 'BASIC_STRUCTURE_HEADER', 'Base Cost', @section_area, @section_base_cost_calc_unit_cost,
		 @section_base_cost_total_cost_new, @section_base_cost_depreciation_amount,
		 @section_base_cost_depreciated_cost)

		insert ##appraisal_card_ms_commercial_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 page_number)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 @page_number)

		set @seq_num = @seq_num + 1
		set @line_count = @line_count + 3
		
		set @prev_component_system = ''
		set @total_component_total_cost_new = @section_base_cost_total_cost_new
		set @total_component_unit_cost = 0
		set @total_component_depreciation_amount = @section_base_cost_depreciation_amount
		set @total_component_depreciated_cost = @section_base_cost_depreciated_cost

		declare curBasicStructureComponents cursor fast_forward
		for select component_system_description, component_description, 
					case when component_pct > 0 then
						@section_area * (component_pct / 100)
					else units end as units,
					unit_cost, total_cost_new,
					depreciation_amount, depreciated_cost
			from @tblSectionComponents
			where basement_flag = 0
			order by component_system_description

		open curBasicStructureComponents

		fetch next from curBasicStructureComponents into @component_system_description,
			@component_description, @component_units, @component_calc_unit_cost,
			@component_total_cost_new, @component_depreciation_amount, 
			@component_depreciated_cost

		while @@fetch_status = 0
		begin
			if @prev_component_system <> @component_system_description
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, heading)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'BASIC_STRUCTURE_GROUP_HEADER', @component_system_description)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = @line_count + 1
			end

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, description, units, unit_cost,
			 total_cost_new, depreciation_amount, depreciated_cost)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'BASIC_STRUCTURE_DETAILS', @component_description, @component_units, @component_calc_unit_cost,
			 @component_total_cost_new, @component_depreciation_amount, @component_depreciated_cost)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 1

			set @total_component_total_cost_new = @total_component_total_cost_new + @component_total_cost_new
			set @total_component_depreciation_amount = @total_component_depreciation_amount + @component_depreciation_amount
			set @total_component_depreciated_cost = @total_component_depreciated_cost + @component_depreciated_cost

			set @prev_component_system = @component_system_description

			fetch next from curBasicStructureComponents into @component_system_description,
				@component_description, @component_units, @component_calc_unit_cost,
				@component_total_cost_new, @component_depreciation_amount, 
				@component_depreciated_cost
		end

		close curBasicStructureComponents
		deallocate curBasicStructureComponents

		
		if @section_area > 0
			set @total_component_unit_cost = @total_component_total_cost_new / @section_area
		else
			set @total_component_unit_cost = 0
			
		if @line_count > @max_commercial_lines
		begin
			set @page_number = @page_number + 1

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, calculated_date, report_date)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'ESTIMATE_HEADER', @calculated_date, @report_date)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = 0
		end
		
		insert ##appraisal_card_ms_commercial_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type, heading, units, unit_cost,
		 total_cost_new, depreciation_amount, depreciated_cost)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 'BASIC_STRUCTURE_FOOTER', 'Basic Structure Cost', @section_area, @total_component_unit_cost,
		 @total_component_total_cost_new, @total_component_depreciation_amount, @total_component_depreciated_cost)

		insert ##appraisal_card_ms_commercial_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 page_number)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 @page_number)

		set @seq_num = @seq_num + 1
		set @line_count = @line_count + 1
		
		if @basement_section_id > 0
		begin
			if @line_count + 3 > @max_commercial_lines
			begin
				set @page_number = @page_number + 1

				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, calculated_date, report_date)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'ESTIMATE_HEADER', @calculated_date, @report_date)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = 0
			end
			
			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, heading, units, unit_cost, total_cost_new,
			 depreciation_amount, depreciated_cost)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'BASEMENT_COST_HEADER', 'Base Cost', @basement_area, @basement_base_cost_calc_unit_cost,
			 @basement_base_cost_total_cost_new, @basement_base_cost_depreciation_amount,
			 @basement_base_cost_depreciated_cost)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 3
			
			if @basement_fireproof_flag = 1
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, heading, units, unit_cost, total_cost_new,
				 depreciation_amount, depreciated_cost)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'BASEMENT_FIREPROOFING', 'Basement Fireproofing', @basement_area, @basement_fireproof_calc_unit_cost,
				 @basement_fireproof_total_cost_new, @basement_fireproof_depreciation_amount,
				 @basement_fireproof_depreciated_cost)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = @line_count + 3
			end
			
			set @prev_component_system = ''
			set @total_component_total_cost_new = @basement_base_cost_total_cost_new
			set @total_component_unit_cost = 0
			set @total_component_depreciation_amount = @basement_base_cost_depreciation_amount
			set @total_component_depreciated_cost = @basement_base_cost_depreciated_cost

			declare curBasementCostComponents cursor fast_forward
			for select component_system_description, component_description, 
						case when component_pct > 0 then
							@basement_area * (component_pct / 100)
						else units end as units,
						unit_cost, total_cost_new,
						depreciation_amount, depreciated_cost
				from @tblSectionComponents
				where basement_flag = 1
				order by component_system_description

			open curBasementCostComponents 

			fetch next from curBasementCostComponents into @component_system_description,
				@component_description, @component_units, @component_calc_unit_cost,
				@component_total_cost_new, @component_depreciation_amount, 
				@component_depreciated_cost

			while @@fetch_status = 0
			begin
				if @prev_component_system <> @component_system_description
				begin
					insert ##appraisal_card_ms_commercial_report
					(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
					 report_detail_type, heading)
					values
					(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
					 'BASEMENT_COST_GROUP_HEADER', @component_system_description)

					insert ##appraisal_card_ms_commercial_paging
					(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
					 page_number)
					values
					(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
					 @page_number)

					set @seq_num = @seq_num + 1
					set @line_count = @line_count + 1
				end

				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, units, unit_cost,
				 total_cost_new, depreciation_amount, depreciated_cost)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'BASEMENT_COST_DETAILS', @component_description, @component_units, @component_calc_unit_cost,
				 @component_total_cost_new, @component_depreciation_amount, @component_depreciated_cost)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = @line_count + 1

				set @total_component_total_cost_new = @total_component_total_cost_new + @component_total_cost_new
				set @total_component_depreciation_amount = @total_component_depreciation_amount + @component_depreciation_amount
				set @total_component_depreciated_cost = @total_component_depreciated_cost + @component_depreciated_cost

				set @prev_component_system = @component_system_description

				fetch next from curBasementCostComponents  into @component_system_description,
					@component_description, @component_units, @component_calc_unit_cost,
					@component_total_cost_new, @component_depreciation_amount, 
					@component_depreciated_cost
			end

			close curBasementCostComponents 
			deallocate curBasementCostComponents 

			if (@basement_area > 0)
				set @total_component_unit_cost = @total_component_total_cost_new / @basement_area
			else
				set @total_component_unit_cost  = 0
			
			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, heading, units, unit_cost,
			 total_cost_new, depreciation_amount, depreciated_cost)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'BASEMENT_COST_FOOTER', 'Basement Cost', @basement_area, @total_component_unit_cost,
			 @total_component_total_cost_new, @total_component_depreciation_amount, @total_component_depreciated_cost)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = @line_count + 1
		end
		
		if @line_count > @max_commercial_lines
		begin
			set @page_number = @page_number + 1

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, calculated_date, report_date)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'ESTIMATE_HEADER', @calculated_date, @report_date)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = 0
		end

		declare curAdditions cursor fast_forward
		for select addition_description, units,
					calc_unit_cost, total_cost_new,
					depreciation_amount, depreciated_cost
			from imprv_detail_cms_addition as idca
			with (nolock)
			where idca.prop_val_yr = @year
			and idca.sup_num = @sup_num
			and idca.sale_id = @sale_id
			and idca.prop_id = @prop_id
			and idca.imprv_id = @imprv_id
			and idca.imprv_det_id = @imprv_det_id
			and idca.section_id = @section_id
			order by addition_description

		open curAdditions

		fetch next from curAdditions into @addition_description,
			@addition_units, @addition_calc_unit_cost,
			@addition_total_cost_new, @addition_depreciation_amount, 
			@addition_depreciated_cost

		if @@fetch_status = 0
		begin
			if @line_count + 3 > @max_commercial_lines
			begin
				set @page_number = @page_number + 1

				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, calculated_date, report_date)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'ESTIMATE_HEADER', @calculated_date, @report_date)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = 0
			end
		
			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'ADDITION_HEADER')

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1

			set @total_addition_total_cost_new = 0
			set @total_addition_depreciation_amount = 0
			set @total_addition_depreciated_cost = 0

			while @@fetch_status = 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, units, unit_cost,
				 total_cost_new, depreciation_amount, depreciated_cost)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'ADDITION_DETAILS', @addition_description, @addition_units, @addition_calc_unit_cost,
				 @addition_total_cost_new, @addition_depreciation_amount, @addition_depreciated_cost)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1

				set @total_addition_total_cost_new = @total_addition_total_cost_new + @addition_total_cost_new
				set @total_addition_depreciation_amount = @total_addition_depreciation_amount + @addition_depreciation_amount
				set @total_addition_depreciated_cost = @total_addition_depreciated_cost + @addition_depreciated_cost

				fetch next from curAdditions into @addition_description,
					@addition_units, @addition_calc_unit_cost,
					@addition_total_cost_new, @addition_depreciation_amount, 
					@addition_depreciated_cost
			end

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, heading,
			 total_cost_new, depreciation_amount, depreciated_cost)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'ADDITION_FOOTER', 'Additions Cost', @total_addition_total_cost_new, 
			 @total_addition_depreciation_amount, @total_addition_depreciated_cost)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
		end
		
		close curAdditions
		deallocate curAdditions
	
		if @line_count > @max_commercial_lines
		begin
			set @page_number = @page_number + 1

			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, calculated_date, report_date)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'ESTIMATE_HEADER', @calculated_date, @report_date)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			set @line_count = 0
		end
		
		if @section_depreciation_amount + @basement_depreciation_amount > 0
		begin
			if @line_count + 4 > @max_commercial_lines
			begin
				set @page_number = @page_number + 1

				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, calculated_date, report_date)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'ESTIMATE_HEADER', @calculated_date, @report_date)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
				set @line_count = 0
			end
		
			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, heading)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'DEPRECIATION_HEADER', 'Depreciation Information')

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
			
			if @dep_physical_amount + @basement_dep_physical_amount > 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, unit_cost, depreciation_amount)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'DEPRECIATION_DETAIL', 'Physical', @dep_physical, @dep_physical_amount + @basement_dep_physical_amount)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
			end
			
			if @dep_functional_amount + @basement_dep_functional_amount > 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, unit_cost, depreciation_amount)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'DEPRECIATION_DETAIL', 'Functional', @dep_functional, @dep_functional_amount + @basement_dep_functional_amount)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
			end
			
			if @dep_physical_functional_amount + @basement_dep_physical_functional_amount > 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, unit_cost, depreciation_amount)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'DEPRECIATION_DETAIL', 'Physical & Functional', @dep_physical_functional, @dep_physical_functional_amount + @basement_dep_physical_functional_amount)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
			end
			
			if @dep_external_amount + @basement_dep_external_amount > 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, unit_cost, depreciation_amount)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'DEPRECIATION_DETAIL', 'External', @dep_external, @dep_external_amount + @basement_dep_external_amount)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
			end
			
			if @dep_additional_functional_amount + @basement_dep_additional_functional_amount > 0
			begin
				insert ##appraisal_card_ms_commercial_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, description, unit_cost, depreciation_amount)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'DEPRECIATION_DETAIL', 'Additional Functional', @dep_additional_functional, @dep_additional_functional_amount + @basement_dep_additional_functional_amount)

				insert ##appraisal_card_ms_commercial_paging
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 page_number)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @page_number)

				set @seq_num = @seq_num + 1
			end
			
			insert ##appraisal_card_ms_commercial_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, heading, depreciation_amount)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 'DEPRECIATION_FOOTER', 'Depreciation Total', @section_depreciation_amount + @basement_depreciation_amount)

			insert ##appraisal_card_ms_commercial_paging
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 page_number)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @page_number)

			set @seq_num = @seq_num + 1
		end

		insert ##appraisal_card_ms_commercial_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type, heading, units, unit_cost,
		 total_cost_new, depreciation_amount, depreciated_cost,
		 remarks)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 'SECTION_FOOTER', 'SECTION ' + convert(varchar, @section_counter) + ' TOTAL COST: ', 
		 @section_area + @basement_area, 
		 case when (@section_area + @basement_area) > 0
		 then
			(@section_total_cost_new + @basement_total_cost_new) / (@section_area + @basement_area)
		 else 0 end,		
		 @section_total_cost_new + @basement_total_cost_new, 
		 @section_depreciation_amount + @basement_depreciation_amount, 
		 @section_depreciated_cost + @basement_depreciated_cost, @remarks)

		insert ##appraisal_card_ms_commercial_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 page_number)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 @page_number)

		set @seq_num = @seq_num + 1

		set @section_counter = @section_counter + 1

		set @prev_prop_id = @prop_id
		set @prev_imprv_id = @imprv_id
		set @prev_imprv_det_id = @imprv_det_id

		set @prev_estimate_total_area = @estimate_total_area
		set @prev_estimate_total_cost_new = @estimate_total_cost_new
		set @prev_estimate_total_depreciation_amount = @estimate_total_depreciation_amount
		set @prev_estimate_total_depreciated_cost = @estimate_total_depreciated_cost

		fetch next from curEstimate into @year, @sup_num, @sale_id, @prop_id,
			@imprv_id, @imprv_det_id, @calculated_date, @report_date,
			@estimate_total_area, @estimate_total_cost_new, @estimate_total_depreciation_amount,
			@estimate_total_depreciated_cost, @section_id, @section_description, @section_area,
			@stories, @section_perimeter_shape_flag, @section_perimeter, @section_shape,
			@effective_age, @remarks, @section_total_cost_new, @section_depreciation_amount,
			@section_depreciated_cost, 
			
			@dep_physical, @dep_physical_amount,
			@dep_functional, @dep_functional_amount,
			@dep_physical_functional, @dep_physical_functional_amount,
			@dep_external, @dep_external_amount,
			@dep_additional_functional, @dep_additional_functional_amount,
		
			@section_base_cost_total_cost_new, 
			@section_base_cost_calc_unit_cost, @section_base_cost_depreciation_amount,
			@section_base_cost_depreciated_cost, 

			@basement_section_id, @basement_section_description,
			@basement_levels, @basement_perimeter_shape_flag,
			@basement_perimeter, @basement_shape, @basement_area,
			@basement_base_cost_total_cost_new, 
			@basement_base_cost_calc_unit_cost, @basement_base_cost_depreciation_amount,
			@basement_base_cost_depreciated_cost, @basement_fireproof_flag,
			@basement_fireproof_total_cost_new, @basement_fireproof_calc_unit_cost, 
			@basement_fireproof_depreciation_amount, @basement_fireproof_depreciated_cost,
			@basement_total_cost_new, @basement_depreciation_amount,
			@basement_depreciated_cost,
			
			@basement_dep_physical_amount, @basement_dep_functional_amount,
			@basement_dep_physical_functional_amount, @basement_dep_external_amount,
			@basement_dep_additional_functional_amount,
		
			@initial_page_number
	end

	close curEstimate
	deallocate curEstimate

	-- logging end of step 
	SELECT @LogTotRows = @curRows, 
		   @LogErrCode = 0 
	   SET @LogStatus =  'Step 41 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	if @prev_prop_id > 0
	begin
		insert ##appraisal_card_ms_commercial_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type, heading, units, unit_cost,
		 total_cost_new, depreciation_amount, depreciated_cost)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 'ESTIMATE_FOOTER', 'ESTIMATE TOTALS: ', 
		 @prev_estimate_total_area, 
		 case when @prev_estimate_total_area > 0
		 then
			@prev_estimate_total_depreciated_cost / @prev_estimate_total_area
		 else 0 end,	
		 @prev_estimate_total_cost_new, @prev_estimate_total_depreciation_amount, 
		 @prev_estimate_total_depreciated_cost)

		insert ##appraisal_card_ms_commercial_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 page_number)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 @page_number)

		set @seq_num = @seq_num + 1
		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 42 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time of step
				
	end


	/*
	 * Must now update the end page number so the header/footer are displayed
	 */
	 
	update ##appraisal_card_property_paging
	set end_page_number = t.page_number
	from ##appraisal_card_property_paging as acpp
	join
	(
		select acmcp.dataset_id, acmcp.[year], acmcp.sup_num, acmcp.prop_id, 
			max(acmcp.page_number) as page_number
		from ##appraisal_card_ms_commercial_paging as acmcp
		where acmcp.dataset_id = @dataset_id
		group by acmcp.dataset_id, acmcp.[year], acmcp.sup_num, acmcp.prop_id 
	) as t
	on acpp.dataset_id = t.dataset_id
	and acpp.[year] = t.[year]
	and acpp.sup_num = t.sup_num
	and acpp.prop_id = t.prop_id
	where acpp.dataset_id = @dataset_id


	update ##appraisal_card_property_info
	set has_marshall_swift_commercial = 
		case when t.ms_count > 0 then 1
		else 0 end
	from ##appraisal_card_property_info as acpi
	join
	(
		select 
			count(acmcp.prop_id) as ms_count,
			acmcp.dataset_id, acmcp.[year], acmcp.sup_num, acmcp.prop_id 
		from ##appraisal_card_ms_commercial_paging as acmcp
		with(nolock)
		where 
			acmcp.dataset_id = @dataset_id 
		group by acmcp.dataset_id, acmcp.[year], acmcp.sup_num, acmcp.prop_id 
	) as t
	on acpi.dataset_id = t.dataset_id
	and acpi.[year] = t.[year]
	and acpi.sup_num = t.sup_num
	and acpi.prop_id = t.prop_id
	where acpi.dataset_id = @dataset_id	


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 43 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

end



if @include_ms_residential_report = 1
begin
	declare @situs_display varchar(173)
	declare @zip_code varchar(5)
	declare @cost_data_as_of datetime
	declare @residential_type varchar(50)
	declare @style varchar(50)
	declare @style_pct numeric(5,2)
	declare @secondary_style varchar(50)
	declare @secondary_style_pct numeric(5,2)
	declare @floor_area int
	declare @num_units int
	declare @wall_height int
	declare @exterior_walls varchar(50)
	declare @quality smallint
	declare @quality_desc varchar(50)
	declare @res_effective_age int
	declare @condition smallint
	declare @condition_desc varchar(50)
	declare @num_fixtures int
	declare @num_rough_ins int
	declare @res_report_detail_type varchar(20)
	declare @factor numeric(5,4)
	declare @cost_multiplier numeric(3,2)
	declare @local_multiplier numeric(3,2)
	declare @region_multiplier numeric(5,2)
	declare @total_multiplier numeric(3,2)

	set @prev_prop_id = -1
	set @prev_imprv_id = -1
	set @prev_imprv_det_id = -1
	set @seq_num = 0
	set @page_number = 1
	set @curRows = 0

	declare curHeader cursor fast_forward
	for select acip.[year], acip.sup_num, acip.sale_id, acip.prop_id, 
	acip.imprv_id, acip.imprv_det_id,
	a.file_as_name, replace(s.situs_display, char(13) + char(10), '  '), idre.ZipCode,
	idre.BaseDate, idre.ReportDate, rrtv.TypeName, rsv.StyleName, idre.StylePctPrimary, 
	rsvs.StyleName, 100.00 - idre.StylePctPrimary, idre.TotalArea, idre.Units, 
	idre.StoryWallHeight, 

	(select dbo.CommaListConcatenate(rtrim(rcv.ComponentName))
	from imprv_detail_rms_component as idrc
	with (nolock)
	join rms_component_vw as rcv
	with (nolock)
	on idrc.prop_val_yr = rcv.[Year]
	and idrc.ComponentID = rcv.ComponentID
	and rcv.SystemID = 1
	where idrc.prop_val_yr = idre.prop_val_yr
	and idrc.sup_num = idre.sup_num
	and idrc.sale_id = idre.sale_id
	and idrc.prop_id = idre.prop_id
	and idrc.imprv_id = idre.imprv_id
	and idrc.imprv_det_id = idre.imprv_det_id
	and idrc.sale_id = 0
	group by idrc.imprv_det_id
	) as exterior_walls,

		idre.QualityID, case when idre.QualityIDLower = idre.QualityIDUpper 
											then rqvl.QualityName
											else rqvl.QualityName + '/' + rqvu.QualityName end, 
		idre.prop_val_yr - idre.EffectiveYearBuilt, idre.ConditionID,
		case when idre.ConditionIDLower = idre.ConditionIDUpper
			then rcvl.Description
			else rcvl.Description + '/' + rcvu.Description end,

	(
	select isnull(sum(isnull(idrc.Units,0)),0)
	from imprv_detail_rms_component as idrc
	with (nolock)
	join rms_component_vw as rcv
	with (nolock)
	on idrc.prop_val_yr = rcv.[Year]
	and idrc.ComponentID = rcv.ComponentID
	where idrc.ComponentID = 601
	and idrc.prop_val_yr = idre.prop_val_yr
	and idrc.sup_num = idre.sup_num
	and idrc.sale_id = idre.sale_id
	and idrc.prop_id = idre.prop_id
	and idrc.imprv_id = idre.imprv_id
	and idrc.imprv_det_id = idre.imprv_det_id
	and idrc.sale_id = 0
	) as num_fixtures,

	(
	select isnull(sum(isnull(idrc.Units,0)),0)
	from imprv_detail_rms_component as idrc
	with (nolock)
	join rms_component_vw as rcv
	with (nolock)
	on idrc.prop_val_yr = rcv.[Year]
	and idrc.ComponentID = rcv.ComponentID
	where idrc.ComponentID = 602
	and idrc.prop_val_yr = idre.prop_val_yr
	and idrc.sup_num = idre.sup_num
	and idrc.sale_id = idre.sale_id
	and idrc.prop_id = idre.prop_id
	and idrc.imprv_id = idre.imprv_id
	and idrc.imprv_det_id = idre.imprv_det_id
	and idrc.sale_id = 0
	) as num_rough_ins,

	idre.CostMultiplier, idre.LocalMultiplier, idre.LocalMultiplierAdj, idre.TotalMultiplier, 
	acip.page_number

	from ##appraisal_card_improvement_paging as acip
	with (nolock)
	join imprv_detail_rms_estimate as idre
	with (nolock)
	on acip.[year] = idre.prop_val_yr
	and acip.sup_num = idre.sup_num
	and acip.sale_id = idre.sale_id
	and acip.prop_id = idre.prop_id
	and acip.imprv_id = idre.imprv_id
	and acip.imprv_det_id = idre.imprv_det_id
	join owner as o
	with (nolock)
	on idre.prop_val_yr = o.owner_tax_yr
	and idre.sup_num = o.sup_num
	and idre.prop_id = o.prop_id
	join account as a
	with (nolock)
	on o.owner_id = a.acct_id
	join rms_residence_type_vw as rrtv
	with (nolock)
	on idre.prop_val_yr = rrtv.[Year]
	and idre.TypeID = rrtv.TypeID
	join rms_style_vw as rsv
	with (nolock)
	on idre.prop_val_yr = rsv.[Year]
	and idre.StyleIDPrimary = rsv.StyleID
	left outer join rms_style_vw as rsvs
	with (nolock)
	on idre.prop_val_yr = rsvs.[Year]
	and idre.StyleIDSecondary = rsvs.StyleID
	join rms_quality_vw as rqvl
	with (nolock)
	on idre.prop_val_yr = rqvl.[Year]
	and idre.QualityIDLower = rqvl.QualityID
	join rms_quality_vw as rqvu
	with (nolock)
	on idre.prop_val_yr = rqvu.[Year]
	and idre.QualityIDUpper = rqvu.QualityID
	join rms_condition_vw as rcvl
	with (nolock)
	on idre.prop_val_yr = rcvl.[Year]
	and idre.ConditionIDLower = rcvl.ConditionID
	join rms_condition_vw as rcvu
	with (nolock)
	on idre.prop_val_yr = rcvu.[Year]
	and idre.ConditionIDUpper = rcvu.ConditionID
	left outer join situs as s
	with (nolock)
	on idre.prop_id = s.prop_id
	and s.primary_situs = 'Y'
	where acip.dataset_id = @dataset_id
	order by idre.prop_id, idre.imprv_id, idre.imprv_det_id

	open curHeader

	fetch next from curHeader into @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id,
		@prop_owner_name, @situs_display, @zip_code, @cost_data_as_of, @report_date,
		@residential_type, @style, @style_pct, @secondary_style, @secondary_style_pct,
		@floor_area, @num_units, @wall_height, @exterior_walls, @quality, @quality_desc,
		@res_effective_age, @condition, @condition_desc, @num_fixtures, @num_rough_ins,
		@cost_multiplier, @local_multiplier, @region_multiplier, @total_multiplier,
		@initial_page_number

	while @@fetch_status = 0
	begin
	    set @curRows = @curRows + 1
	    
		if @prev_prop_id <> @prop_id or 
			@prev_imprv_id <> @imprv_id or 
			@prev_imprv_det_id <> @imprv_det_id
		begin
			set @page_number = @initial_page_number + 1
		end
		else
		begin
			set @page_number = @page_number + 1
		end

		insert ##appraisal_card_ms_residential_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type, owner_name, situs_address, zip_code, cost_data_as_of,
		 report_date, residential_type, style, style_pct, secondary_style, secondary_style_pct,
		 floor_area, num_units, wall_height, exterior_walls, quality, quality_desc,
		 effective_age, condition, condition_desc, num_fixtures, num_rough_ins,
		 cost_multiplier, local_multiplier, other_multiplier, total_multiplier)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
		 'HEADER', @prop_owner_name, @situs_display, @zip_code, @cost_data_as_of,
		 @report_date, @residential_type, @style, @style_pct, @secondary_style, @secondary_style_pct,
		 @floor_area, @num_units, @wall_height, @exterior_walls, @quality, @quality_desc,
		 @res_effective_age, @condition, @condition_desc, @num_fixtures, @num_rough_ins,
		 @cost_multiplier, @local_multiplier, @region_multiplier, @total_multiplier)

		insert ##appraisal_card_ms_residential_paging
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 page_number)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, 0,
		 @page_number)

		set @prev_prop_id = @prop_id
		set @prev_imprv_id = @imprv_id
		set @prev_imprv_det_id = @imprv_det_id

		fetch next from curHeader into @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id,
			@prop_owner_name, @situs_display, @zip_code, @cost_data_as_of, @report_date,
			@residential_type, @style, @style_pct, @secondary_style, @secondary_style_pct,
			@floor_area, @num_units, @wall_height, @exterior_walls, @quality, @quality_desc,
			@res_effective_age, @condition, @condition_desc, @num_fixtures, @num_rough_ins,
			@cost_multiplier, @local_multiplier, @region_multiplier, @total_multiplier,
			@initial_page_number
	end
		
	close curHeader
	deallocate curHeader

	-- logging end of step 
	SELECT @LogTotRows = @curRows, 
		   @LogErrCode = 0 
	   SET @LogStatus =  'Step 44 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	/*
	 * Insert Residence box top and base cost rows
	 */

	declare @cost numeric(14,2)
	declare @rcn_value numeric(14,0)
	declare @less_depreciation_amount numeric(14,0)
	declare @rcnld_value numeric(14,0)
    set @curRows = 0

	declare curMainBox cursor fast_forward
	for select idre.prop_val_yr, idre.sup_num, idre.sale_id, idre.prop_id, idre.imprv_id, 
		idre.imprv_det_id, max(idre.ExtWallFactor), max(idrs.SectionSize), sum(idrc.AdjUnitPrice), 
		sum(idrc.ComponentValueRCN), sum(idrc.ComponentValueRCN - idrc.ComponentValueRCNLD),
		sum(idrc.ComponentValueRCNLD)

	from ##appraisal_card_ms_residential_paging as acmrp
	with (nolock)
	join imprv_detail_rms_estimate as idre
	with (nolock)
	on acmrp.[year] = idre.prop_val_yr
	and acmrp.sup_num = idre.sup_num
	and acmrp.sale_id = idre.sale_id
	and acmrp.prop_id = idre.prop_id
	and acmrp.imprv_id = idre.imprv_id
	and acmrp.imprv_det_id = idre.imprv_det_id
	join imprv_detail_rms_section as idrs
	with (nolock)
	on idre.prop_val_yr = idrs.prop_val_yr
	and idre.sup_num = idrs.sup_num
	and idre.sale_id = idrs.sale_id
	and idre.prop_id = idrs.prop_id
	and idre.imprv_id = idrs.imprv_id
	and idre.imprv_det_id = idrs.imprv_det_id
	join imprv_detail_rms_component as idrc
	with (nolock)
	on idrs.prop_val_yr = idrc.prop_val_yr
	and idrs.sup_num = idrc.sup_num
	and idrs.sale_id = idrc.sale_id
	and idrs.prop_id = idrc.prop_id
	and idrs.imprv_id = idrc.imprv_id
	and idrs.imprv_det_id = idrc.imprv_det_id
	and idrs.section_id = idrc.section_id
	and idrs.GroupTypeID = 1  -- Main only
	join rms_component_vw as rcv
	with (nolock)
	on idrc.prop_val_yr = rcv.[Year]
	and idrc.ComponentID = rcv.ComponentID
	join rms_system_vw as rsv
	with (nolock)
	on rcv.[Year] = rsv.[Year]
	and rcv.SystemID = rsv.SystemID
	and rcv.SystemID = 1
	where acmrp.dataset_id = @dataset_id
	group by idre.prop_val_yr, idre.sup_num, idre.sale_id, idre.prop_id, 
					idre.imprv_id, idre.imprv_det_id

	open curMainBox

	fetch next from curMainBox into @year, @sup_num, @sale_id, @prop_id, @imprv_id,
		@imprv_det_id, @factor, @floor_area, @cost, @rcn_value, @less_depreciation_amount,
		@rcnld_value

	while @@fetch_status = 0
	begin
	    set @curRows = @curRows + 1
	    
		insert ##appraisal_card_ms_residential_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type, factor)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, 1,
		 'MAIN_BOX_TOP', @factor)

		insert ##appraisal_card_ms_residential_report
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
		 report_detail_type, factor, component_type, quantity, cost, rcn_value, less_depreciation_value,
		 rcnld_value)
		values
		(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, 2,
		 'MAIN_SECTION', @factor, 'Base Cost', @floor_area, @cost, @rcn_value, @less_depreciation_amount,
		 @rcnld_value)

		fetch next from curMainBox into @year, @sup_num, @sale_id, @prop_id, @imprv_id,
			@imprv_det_id, @factor, @floor_area, @cost, @rcn_value, @less_depreciation_amount,
			@rcnld_value
	end

	close curMainbox
	deallocate curMainBox

	-- logging end of step 
	SELECT @LogTotRows = @curRows, 
		   @LogErrCode = 0 
	   SET @LogStatus =  'Step 45 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	/*
	 * Now do everything else
	 */

	declare @component_type varchar(50)
	declare @component_desc varchar(50)
	declare @adjustment_flag bit
	declare @quantity int
	declare @groupTypeID int
	declare @systemID int
	declare @total_depreciation_pct numeric(5,2)
	declare @sort1 int
	declare @sort2 int
	declare @sort3 varchar(50)
	declare @sort4 int
	declare @prev_res_report_detail_type varchar(20)
	declare @section_cost numeric(14,2)
	declare @section_rcn_value numeric(14,0)
	declare @section_less_depreciation_amount numeric(14,0)
	declare @section_rcnld_value numeric(14,0)
	declare @section_size int
	declare @prev_section_size int
	declare @base_cost_rcn_value numeric(14,0)
	declare @base_cost_less_depreciation_amount numeric(14,0)
	declare @base_cost_rcnld_value numeric(14,0)

	set @prev_prop_id = -1
	set @prev_imprv_id = -1
	set @prev_imprv_det_id = -1
	set @seq_num = 3
	set @section_cost = 0
	set @section_rcn_value = 0
	set @section_less_depreciation_amount = 0
	set @section_rcnld_value = 0
	set @section_size = 0
	set @prev_section_size = 0
	set @base_cost_rcn_value = 0
	set @base_cost_less_depreciation_amount = 0
	set @base_cost_rcnld_value = 0
	set @curRows = 0
	
	declare curEverythingElse cursor fast_forward
	for select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, rsv.SystemName,
			'(' + convert(varchar, rcv.ComponentID) + ') ' + replace(rcv.ComponentName, '(#)', '(' + convert(varchar, idrc.Units) + ')'),
			0,  -- adjustment_flag
			convert(int, case when idrc.Units = 0 then
				case when idrc.ComponentPct > 0 then idrs.SectionSize * (idrc.ComponentPct / 100) else idrs.SectionSize end
				else idrc.Units end),
			idrc.AdjUnitPrice, idrc.ComponentValueRCN, idrc.ComponentValueRCN - idrc.ComponentValueRCNLD,
			idrc.ComponentValueRCNLD, idrs.GroupTypeID, rsv.SystemID, idrs.SectionSize, 
			acmrr.rcn_value, acmrr.less_depreciation_value, acmrr.rcnld_value,
			-1,
			0 as sort1, idrs.GroupTypeID as sort2, rsv.SystemName as sort3, 0 as sort4
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_section as idrs
		with (nolock)
		on acmrp.[year] = idrs.prop_val_yr
		and acmrp.sup_num = idrs.sup_num
		and acmrp.sale_id = idrs.sale_id
		and acmrp.prop_id = idrs.prop_id
		and acmrp.imprv_id = idrs.imprv_id
		and acmrp.imprv_det_id = idrs.imprv_det_id
		join imprv_detail_rms_component as idrc
		with (nolock)
		on idrs.prop_val_yr = idrc.prop_val_yr
		and idrs.sup_num = idrc.sup_num
		and idrs.sale_id = idrc.sale_id
		and idrs.prop_id = idrc.prop_id
		and idrs.imprv_id = idrc.imprv_id
		and idrs.imprv_det_id = idrc.imprv_det_id
		and idrs.section_id = idrc.section_id
		join rms_component_vw as rcv
		with (nolock)
		on idrc.prop_val_yr = rcv.[Year]
		and idrc.ComponentID = rcv.ComponentID
		join rms_system_vw as rsv
		with (nolock)
		on rcv.[Year] = rsv.[Year]
		and rcv.SystemID = rsv.SystemID
		join ##appraisal_card_ms_residential_report as acmrr
		with (nolock)
		on acmrp.dataset_id = acmrr.dataset_id
		and acmrp.[year] = acmrr.[year]
		and acmrp.sup_num = acmrr.sup_num
		and acmrp.sale_id = acmrr.sale_id
		and acmrp.prop_id = acmrr.prop_id
		and acmrp.imprv_id = acmrr.imprv_id
		and acmrp.imprv_det_id = acmrr.imprv_det_id
		and acmrr.seq_num = 2
		where acmrp.dataset_id = @dataset_id

		union		-- Energy Adjustments

		select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, rzcv.ZoneCategoryName, rziv.ZoneItemName,
			1, idre.TotalArea, idre.ZoneAdj_Energy, 0, 0, 0, 1, -1, idre.TotalArea,
			-1, -1, -1,
			-1,
			0, 1, 'ZZZZ', 1
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_estimate as idre
		with (nolock)
		on acmrp.[year] = idre.prop_val_yr
		and acmrp.sup_num = idre.sup_num
		and acmrp.sale_id = idre.sale_id
		and acmrp.prop_id = idre.prop_id
		and acmrp.imprv_id = idre.imprv_id
		and acmrp.imprv_det_id = idre.imprv_det_id
		join rms_zone_items_vw as rziv
		with (nolock)
		on idre.EnergyAdj_ZoneItemID = rziv.ZoneItemID
		join rms_zone_categories_vw as rzcv
		with (nolock)
		on rziv.ZoneCategoryCode = rzcv.ZoneCategoryCode
		and rzcv.ZoneCategoryCode = 'Ener'
		where acmrp.dataset_id = @dataset_id

		union		-- Foundation Adjustments

		select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, rzcv.ZoneCategoryName, rziv.ZoneItemName,
			1, idre.TotalArea, idre.ZoneAdj_Foundation, 0, 0, 0, 1, -1, idre.TotalArea,
			-1, -1, -1,
			-1,
			0, 1, 'ZZZZ', 2
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_estimate as idre
		with (nolock)
		on acmrp.[year] = idre.prop_val_yr
		and acmrp.sup_num = idre.sup_num
		and acmrp.sale_id = idre.sale_id
		and acmrp.prop_id = idre.prop_id
		and acmrp.imprv_id = idre.imprv_id
		and acmrp.imprv_det_id = idre.imprv_det_id
		join rms_zone_items_vw as rziv
		with (nolock)
		on idre.FoundationAdj_ZoneItemID = rziv.ZoneItemID
		join rms_zone_categories_vw as rzcv
		with (nolock)
		on rziv.ZoneCategoryCode = rzcv.ZoneCategoryCode
		and rzcv.ZoneCategoryCode = 'Foun'
		where acmrp.dataset_id = @dataset_id

		union		-- Hillside Construction Adjustments

		select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, rzcv.ZoneCategoryName, rziv.ZoneItemName,
			1, idre.TotalArea, idre.ZoneAdj_Hillside, 0, 0, 0, 1, -1, idre.TotalArea,
			-1, -1, -1,
			-1,
			0, 1, 'ZZZZ', 3
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_estimate as idre
		with (nolock)
		on acmrp.[year] = idre.prop_val_yr
		and acmrp.sup_num = idre.sup_num
		and acmrp.sale_id = idre.sale_id
		and acmrp.prop_id = idre.prop_id
		and acmrp.imprv_id = idre.imprv_id
		and acmrp.imprv_det_id = idre.imprv_det_id
		join rms_zone_items_vw as rziv
		with (nolock)
		on idre.HillsideAdj_ZoneItemID = rziv.ZoneItemID
		join rms_zone_categories_vw as rzcv
		with (nolock)
		on rziv.ZoneCategoryCode = rzcv.ZoneCategoryCode
		and rzcv.ZoneCategoryCode = 'Hill'
		where acmrp.dataset_id = @dataset_id

		union		-- Seismic Zone Adjustments

		select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, rzcv.ZoneCategoryName, rziv.ZoneItemName,
			1, idre.TotalArea, idre.ZoneAdj_Seismic, 0, 0, 0, 1, -1, idre.TotalArea,
			-1, -1, -1,
			-1,
			0, 1, 'ZZZZ', 4
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_estimate as idre
		with (nolock)
		on acmrp.[year] = idre.prop_val_yr
		and acmrp.sup_num = idre.sup_num
		and acmrp.sale_id = idre.sale_id
		and acmrp.prop_id = idre.prop_id
		and acmrp.imprv_id = idre.imprv_id
		and acmrp.imprv_det_id = idre.imprv_det_id
		join rms_zone_items_vw as rziv
		with (nolock)
		on idre.SeismicAdj_ZoneItemID = rziv.ZoneItemID
		join rms_zone_categories_vw as rzcv
		with (nolock)
		on rziv.ZoneCategoryCode = rzcv.ZoneCategoryCode
		and rzcv.ZoneCategoryCode = 'Seis'
		where acmrp.dataset_id = @dataset_id

		union		-- Wind Adjustments

		select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, rzcv.ZoneCategoryName, rziv.ZoneItemName,
			1, idre.TotalArea, idre.ZoneAdj_Wind, 0, 0, 0, 1, -1, idre.TotalArea,
			-1, -1, -1,
			-1,
			0, 1, 'ZZZZ', 5
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_estimate as idre
		with (nolock)
		on acmrp.[year] = idre.prop_val_yr
		and acmrp.sup_num = idre.sup_num
		and acmrp.sale_id = idre.sale_id
		and acmrp.prop_id = idre.prop_id
		and acmrp.imprv_id = idre.imprv_id
		and acmrp.imprv_det_id = idre.imprv_det_id
		join rms_zone_items_vw as rziv
		with (nolock)
		on idre.WindAdj_ZoneItemID = rziv.ZoneItemID
		join rms_zone_categories_vw as rzcv
		with (nolock)
		on rziv.ZoneCategoryCode = rzcv.ZoneCategoryCode
		and rzcv.ZoneCategoryCode = 'Wind'
		where acmrp.dataset_id = @dataset_id

		union		-- Additions

		select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, '(' + convert(varchar, rav.AdditionTypeID) + ') ' + rav.Description,
			idra.AdditionDesc, 0, idra.Units, idra.CostValue, idra.AdditionValueRCN,
			idra.AdditionValueRCN - idra.AdditionValueRCNLD, idra.AdditionValueRCNLD,
			-1, -1, -1,
			-1, -1, -1,
			-1,
			9998, 9999, 'ZZZZ', idra.pacs_addition_id
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_addition as idra
		with (nolock)
		on acmrp.[year] = idra.prop_val_yr
		and acmrp.sup_num = idra.sup_num
		and acmrp.sale_id = idra.sale_id
		and acmrp.prop_id = idra.prop_id
		and acmrp.imprv_id = idra.imprv_id
		and acmrp.imprv_det_id = idra.imprv_det_id
		join rms_addition_vw as rav
		with (nolock)
		on idra.prop_val_yr = rav.[Year]
		and idra.AdditionTypeID = rav.AdditionTypeID
		where acmrp.dataset_id = @dataset_id

		union		-- Totals

		select acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id, acmrp.imprv_id,
			acmrp.imprv_det_id, '', '', 0, idre.TotalArea, -1, idre.EstimateValueRCN,
			idre.EstimateValueRCN - idre.EstimateValueRCNLD, idre.EstimateValueRCNLD,
			-1, -1, -1,
			-1, -1, -1,
			idre.DeprPct,
			9999, 9999, 'ZZZZ', 9999
		from ##appraisal_card_ms_residential_paging as acmrp
		with (nolock)
		join imprv_detail_rms_estimate as idre
		with (nolock)
		on acmrp.[year] = idre.prop_val_yr
		and acmrp.sup_num = idre.sup_num
		and acmrp.sale_id = idre.sale_id
		and acmrp.prop_id = idre.prop_id
		and acmrp.imprv_id = idre.imprv_id
		and acmrp.imprv_det_id = idre.imprv_det_id
		where acmrp.dataset_id = @dataset_id

		order by acmrp.prop_id, acmrp.imprv_id, acmrp.imprv_det_id, 
				sort1 asc, sort2 asc, sort3 asc, sort4 asc

	open curEverythingElse

	fetch next from curEverythingElse into @year, @sup_num, @sale_id, @prop_id, @imprv_id,
		@imprv_det_id, @component_type, @component_desc, @adjustment_flag, @quantity, @cost, @rcn_value,
		@less_depreciation_amount, @rcnld_value, @groupTypeID, @systemID, @section_size,
		@base_cost_rcn_value, @base_cost_less_depreciation_amount, @base_cost_rcnld_value,
		@total_depreciation_pct, @sort1, @sort2, @sort3, @sort4

	while @@fetch_status = 0
	begin
	    set @curRows = @curRows + 1
	    
		if @sort1 = 9999
		begin
			set @res_report_detail_type = 'TOTALS'
		end
		else if @sort1 = 9998
		begin
			set @res_report_detail_type = 'ADDITIONS'
		end
		else if @sort1 = 0 and @groupTypeID = 1
		begin
			set @res_report_detail_type = 'MAIN_SECTION'
		end
		else
		begin
			set @res_report_detail_type = 'OTHER_SECTION'
		end

		if @prev_res_report_detail_type <> @res_report_detail_type
		begin
			if @prev_res_report_detail_type = 'MAIN_SECTION' and
				@res_report_detail_type <> 'MAIN_SECTION'
			begin

				if @prev_section_size > 0
					set @section_cost = @section_rcn_value / @prev_section_size
				else
					set @section_cost = 0		

				insert ##appraisal_card_ms_residential_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, component_type, adjustment_flag, quantity, cost, rcn_value, less_depreciation_value,
				 rcnld_value)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'MAIN_BOX_BOTTOM', 'Adjusted Residence Cost', 0, @prev_section_size, @section_cost, 
				 @section_rcn_value, @section_less_depreciation_amount, @section_rcnld_value)

				set @seq_num = @seq_num + 1

				set @section_rcn_value = 0
				set @section_less_depreciation_amount = 0
				set @section_rcnld_value = 0
			end
			if @res_report_detail_type = 'OTHER_SECTION' and
					@res_report_detail_type <> @prev_res_report_detail_type
			begin
				insert ##appraisal_card_ms_residential_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'OTHER_BOX_TOP')

				set @seq_num = @seq_num + 1
			end
			if @prev_res_report_detail_type = 'OTHER_SECTION' and
					@res_report_detail_type <> 'OTHER_SECTION'
			begin
				insert ##appraisal_card_ms_residential_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, component_type, rcn_value, less_depreciation_value, rcnld_value)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'OTHER_BOX_BOTTOM', 'Subtotal of All Building Improvements', @section_rcn_value,
				 @section_less_depreciation_amount, @section_rcnld_value)

				set @seq_num = @seq_num + 1

				set @section_rcn_value = 0
				set @section_less_depreciation_amount = 0
				set @section_rcnld_value = 0
			end
			if @res_report_detail_type = 'ADDITIONS' and
					@res_report_detail_type <> @prev_res_report_detail_type
			begin
				insert ##appraisal_card_ms_residential_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'ADDITIONS_BOX_TOP')

				set @seq_num = @seq_num + 1
			end
			if @prev_res_report_detail_type = 'ADDITIONS' and
					@res_report_detail_type <> 'ADDITIONS'
			begin
				insert ##appraisal_card_ms_residential_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, component_type, rcn_value, less_depreciation_value, rcnld_value)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 'ADDITIONS_BOX_BOTTOM', 'Subtotal of All Additions', @section_rcn_value,
				 @section_less_depreciation_amount, @section_rcnld_value)

				set @seq_num = @seq_num + 1
			end
		end

		if @prev_prop_id <> @prop_id or
			@prev_imprv_id <> @imprv_id or
			@prev_imprv_det_id <> @imprv_det_id
		begin
			set @seq_num = 3
			set @section_rcn_value = 0
			set @section_less_depreciation_amount = 0
			set @section_rcnld_value = 0
		end

		-- skip groupTypeID = 1 and systemID = 1, was done above.
		if @res_report_detail_type = 'TOTALS'
		begin
			insert ##appraisal_card_ms_residential_report
			(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
			 report_detail_type, total_depreciation_pct, quantity, cost, rcn_value, less_depreciation_value,
			 rcnld_value)
			values
			(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
			 @res_report_detail_type, @total_depreciation_pct, @quantity, @cost, @rcn_value,
			 @less_depreciation_amount, @rcnld_value)

			set @seq_num = @seq_num + 1
		end
		else
		begin
			if @groupTypeID <> 1 or @systemID <> 1
			begin
				insert ##appraisal_card_ms_residential_report
				(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
				 report_detail_type, component_type, component_desc, adjustment_flag, quantity, cost, rcn_value,
				 less_depreciation_value, rcnld_value)
				values
				(@dataset_id, @year, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @seq_num,
				 @res_report_detail_type, @component_type, @component_desc, @adjustment_flag, @quantity, @cost, @rcn_value,
				 @less_depreciation_amount, @rcnld_value)

				set @seq_num = @seq_num + 1

				if @section_rcn_value = 0 and @res_report_detail_type = 'MAIN_SECTION'
				begin
					set @section_rcn_value = @base_cost_rcn_value
					set @section_less_depreciation_amount = @base_cost_less_depreciation_amount
					set @section_rcnld_value = @base_cost_rcnld_value
				end
				set @section_rcn_value = @section_rcn_value + @rcn_value
				set @section_less_depreciation_amount = @section_less_depreciation_amount + @less_depreciation_amount
				set @section_rcnld_value = @section_rcnld_value + @rcnld_value
			end
		end

		set @prev_prop_id = @prop_id
		set @prev_imprv_id = @imprv_id
		set @prev_imprv_det_id = @imprv_det_id
		set @prev_res_report_detail_type = @res_report_detail_type
		set @prev_section_size = @section_size

		fetch next from curEverythingElse into @year, @sup_num, @sale_id, @prop_id, @imprv_id,
			@imprv_det_id, @component_type, @component_desc, @adjustment_flag, @quantity, @cost, @rcn_value,
			@less_depreciation_amount, @rcnld_value, @groupTypeID, @systemID, @section_size,
			@base_cost_rcn_value, @base_cost_less_depreciation_amount, @base_cost_rcnld_value,
			@total_depreciation_pct, @sort1, @sort2, @sort3, @sort4
	end

	close curEverythingElse
	deallocate curEverythingElse
	
	-- logging end of step 
	SELECT @LogTotRows = @curRows, 
		   @LogErrCode = 0 
	   SET @LogStatus =  'Step 46 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	/*
	 * update the residential paging table
	 */

	insert ##appraisal_card_ms_residential_paging
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num,
	 page_number)
	
	select @dataset_id, acmrp.[year], acmrp.sup_num, acmrp.sale_id, acmrp.prop_id,
			acmrp.imprv_id, acmrp.imprv_det_id, acmrr.seq_num, acmrp.page_number
	from ##appraisal_card_ms_residential_paging as acmrp
	with (nolock)
	join ##appraisal_card_ms_residential_report as acmrr
	with (nolock)
	on acmrp.dataset_id = acmrr.dataset_id
	and acmrp.[year] = acmrr.[year]
	and acmrp.sup_num = acmrr.sup_num
	and acmrp.sale_id = acmrr.sale_id
	and acmrp.prop_id = acmrr.prop_id
	and acmrp.imprv_id = acmrr.imprv_id
	and acmrp.imprv_det_id = acmrr.imprv_det_id
	where acmrp.dataset_id = @dataset_id
	and acmrr.seq_num > 0

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 47 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step


	/*
	 * now update the property paging table
	 */

	update ##appraisal_card_property_paging
	set end_page_number = end_page_number + t.page_number
	from ##appraisal_card_property_paging as acpp
	join
	(
		select acmrp.dataset_id, acmrp.[year], acmrp.sup_num, acmrp.prop_id, 
			count(distinct acmrp.imprv_det_id) as page_number
		from ##appraisal_card_ms_residential_paging as acmrp
		where acmrp.dataset_id = @dataset_id
		group by acmrp.dataset_id, acmrp.[year], acmrp.sup_num, acmrp.prop_id 
	) as t
	on acpp.dataset_id = t.dataset_id
	and acpp.[year] = t.[year]
	and acpp.sup_num = t.sup_num
	and acpp.prop_id = t.prop_id
	where acpp.dataset_id = @dataset_id


	update ##appraisal_card_property_info
	set has_marshall_swift_residential = 
		case when t.ms_count > 0 then 1
		else 0 end
	from ##appraisal_card_property_info as acpi
	join
	(
		select 
			count(acmrp.prop_id)as ms_count,
			acmrp.dataset_id, acmrp.[year], acmrp.sup_num, acmrp.prop_id 
		from ##appraisal_card_ms_residential_paging as acmrp
		with(nolock)
		where 
			acmrp.dataset_id = @dataset_id 
		group by acmrp.dataset_id, acmrp.[year], acmrp.sup_num, acmrp.prop_id 
	) as t
	on acpi.dataset_id = t.dataset_id
	and acpi.[year] = t.[year]
	and acpi.sup_num = t.sup_num
	and acpi.prop_id = t.prop_id
	where acpi.dataset_id = @dataset_id	
	

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 48 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

end

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

