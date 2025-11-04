


--Revision History
--1.0 Created
--1.1 RossK  02/24/2004 added SB340 pp_rendition_tracking records.
--1.2 TrentN 03/03/2004 added imprv_exemption_assoc, land_exemption_assoc, pers_prop_exemption_assoc
--                      added for changes to property_exemption and property_special_entity_exemption
--1.3 AndrewL 03/10/2004 changes to property_val to add reviewed_dt and reviewed_appraiser
--1.4 RossK 02/06/2004  added SB340 pp_rendition_tracking records.
--1.5 RossK 02/12/2004  updated pp_rendition where clause from Chris's e-mail
--1.6 RossK 02/17/2004  updated pp_rendition where clause changed @input_to_year to @input_from_year
--1.7 RossK 03/03/2004  Added Personal Property Sub Segments
--1.8 RossK 03/03/2004  Moved not exist clause on pp_rendition_tracking to where clause
--1.9 RonaldC 03/24/2004 Adding ARV Value Distribution new fields support from tables: 'property_val', 'imprv', land_detail', 'pers_prop_seg'
--2.0 TrentN  04/05/2004 Updated for new fields in imprv_attr, imprv_detail
--2.1 TrentN  05/24/2004 Updated for new fields in owner & property_val as well as new owner_assoc tables
--2.2 Chistophern 9/10/2004 Update for new table imprv_sketch_notes
 
CREATE procedure [dbo].[CreatePropertyLayer]

	@input_include_future_year_layer varchar(1),

	@input_from_yr 		numeric(4,0),
	@input_to_yr   		numeric(4,0),

	@input_delprop_real bit,
	@input_delprop_mh bit,
	@input_delprop_mn bit,
	@input_delprop_personal bit,
	@input_delprop_auto bit,

	@input_noncadappr_mark_inactive_real bit,
	@input_noncadappr_mark_inactive_mh bit,
	@input_noncadappr_mark_inactive_mn bit,
	@input_noncadappr_mark_inactive_personal bit,
	@input_noncadappr_mark_inactive_auto bit,

	@input_bpp_rendered_to_flat bit,
	@input_HOF numeric(14,0),
	@copy_preliminary bit

with recompile

as
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(400)
DECLARE @LogErrCode int
DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @input_include_future_year_layer =' + @input_include_future_year_layer + ','
 + ' @input_from_yr =' +  convert(varchar(30),@input_from_yr) + ','
 + ' @input_to_yr =' +  convert(varchar(30),@input_to_yr) + ','
 + ' @input_delprop_real =' +  convert(varchar(30),@input_delprop_real) + ','
 + ' @input_delprop_mh =' +  convert(varchar(30),@input_delprop_mh) + ','
 + ' @input_delprop_mn =' +  convert(varchar(30),@input_delprop_mn) + ','
 + ' @input_delprop_personal =' +  convert(varchar(30),@input_delprop_personal) + ','
 + ' @input_delprop_auto =' +  convert(varchar(30),@input_delprop_auto) + ','
 + ' @input_noncadappr_mark_inactive_real =' +  convert(varchar(30),@input_noncadappr_mark_inactive_real) + ','
 + ' @input_noncadappr_mark_inactive_mh =' +  convert(varchar(30),@input_noncadappr_mark_inactive_mh) + ','
 + ' @input_noncadappr_mark_inactive_mn =' +  convert(varchar(30),@input_noncadappr_mark_inactive_mn) + ','
 + ' @input_noncadappr_mark_inactive_personal =' +  convert(varchar(30),@input_noncadappr_mark_inactive_personal) + ','
 + ' @input_noncadappr_mark_inactive_auto =' +  convert(varchar(30),@input_noncadappr_mark_inactive_auto) + ','
 + ' @input_bpp_rendered_to_flat =' +  convert(varchar(30),@input_bpp_rendered_to_flat) + ','
 + ' @input_HOF =' +  convert(varchar(30),@input_HOF)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

/* turn off logging */
exec SetMachineLogChanges 0


-- Build the layer source, ex:
-- PID	Year	SupNum
--   1	2005	0
--   2	2005	2
--   3     0    0

set @StartStep = getdate()  --logging capture start time
truncate table create_property_layer_prop_list

SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'truncate table create_property_layer_prop_list 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


-- Props from the FYL
if ( @input_include_future_year_layer = 'Y' )
begin
   --jon said do not check CopyPreliminary flag for this as of now
    set @StartStep = getdate()  --logging capture start time

	insert create_property_layer_prop_list with(tablockx) (
		prop_val_yr, sup_num, prop_id
	)
	select 0, 0, psa.prop_id
	from prop_supp_assoc as psa with(tablockx)
	where
		psa.owner_tax_yr = 0
--	order by psa.prop_id asc
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'FY=Y insert create_property_layer_prop_list End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

 end

set @StartStep = getdate()  --logging capture start time

-- Props from the source year, not in FYL
insert create_property_layer_prop_list with(tablockx) (
	prop_val_yr, sup_num, prop_id
)
select
	psa.owner_tax_yr, psa.sup_num, psa.prop_id
from prop_supp_assoc as psa with(tablockx)
join property_val as pv with(tablockx) on
	psa.owner_tax_yr = pv.prop_val_yr and
	psa.sup_num = pv.sup_num and
	psa.prop_id = pv.prop_id
join property as p with(tablockx) on
	psa.prop_id = p.prop_id
where
	psa.owner_tax_yr = @input_from_yr
    and (@copy_preliminary = 1 or isnull(pv.prop_state,'') <> 'P')
	and (
		pv.prop_inactive_dt is null or
		pv.udi_parent = 'T' or
--		p.reference_flag = 'T' or -- This was uncommented when run at Bexar.pacs_oltp 2005 Sep 04
		-- Else deleted, so check prop type and corresponding flag
		( @input_delprop_real = 1 and p.prop_type_cd = 'R' ) or
		( @input_delprop_mh = 1 and p.prop_type_cd = 'MH' ) or
		( @input_delprop_mn = 1 and p.prop_type_cd = 'MN' ) or
		( @input_delprop_personal = 1 and p.prop_type_cd = 'P' ) or
		( @input_delprop_auto = 1 and p.prop_type_cd = 'A' )
	)
	and not exists (
		select cplpl.prop_id
		from create_property_layer_prop_list as cplpl with(tablockx)
		where
			cplpl.prop_id = psa.prop_id
	)
--order by psa.sup_num asc, psa.prop_id asc

SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Props from the source year, not in FYL End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


-- Build the layer source for income
set @StartStep = getdate()  --logging capture start time

truncate table create_property_layer_income_list

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'truncate table create_property_layer_income_list End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


if ( @input_include_future_year_layer = 'Y' )
begin
    set @StartStep = getdate()  --logging capture start time

	insert create_property_layer_income_list with(tablockx) (
		prop_val_yr, sup_num, income_id
	)
	select distinct
		0, 0, ipa.income_id
	from create_property_layer_prop_list as cplpl with(tablockx)
	join income_prop_assoc as ipa with(tablockx) on
		ipa.prop_val_yr = cplpl.prop_val_yr and
		ipa.sup_num = cplpl.sup_num and
		ipa.prop_id = cplpl.prop_id
	where
		cplpl.prop_val_yr = 0
--	order by ipa.income_id asc
-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'FY=Y  create_property_layer_income_list End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
    
end

set @StartStep = getdate()  --logging capture start time

insert create_property_layer_income_list with(tablockx) (
	prop_val_yr, sup_num, income_id
)
select distinct
	@input_from_yr, max(ipa.sup_num), ipa.income_id

from create_property_layer_prop_list as cplpl with(tablockx)
join income_prop_assoc as ipa with(tablockx) on
	ipa.prop_val_yr = cplpl.prop_val_yr and
	ipa.sup_num = cplpl.sup_num and
	ipa.prop_id = cplpl.prop_id
where
	cplpl.prop_val_yr = @input_from_yr and
	not exists (
		select cplil.prop_val_yr
		from create_property_layer_income_list as cplil with(tablockx)
		where cplil.income_id = ipa.income_id
	)
group by ipa.income_id
--order by ipa.income_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'create_property_layer_income_list End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

-- Begin copying data

set @StartStep = getdate()  --logging capture start time

-- prop_supp_assoc
insert into prop_supp_assoc with(tablockx)
(
	prop_id,
	sup_num,
	owner_tax_yr
)
select
	prop_id,
	0, -- sup_num
	@input_to_yr
from create_property_layer_prop_list with(tablockx)
--order by prop_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into prop_supp_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--property_val
insert into property_val with(tablockx)
( 
	prop_id,
	prop_val_yr,
	prop_val,
	chg_dt,
	notice_mail_dt,
	land_hstd_val,
	land_non_hstd_val,
	imprv_hstd_val,
	imprv_non_hstd_val,
	appraised_val,
	assessed_val,
	market,
	ag_use_val,
	ag_market,
	freeze_ceiling,
	freeze_yr,
	ag_loss,
	ag_late_loss,
	timber_78,
	timber_market,
	timber_use,
	timber_loss,
	timber_late_loss,
	rendered_val,
	rendered_yr,
	new_val,
	new_yr,
	mineral_int_pct,
	orig_appraised_val,
	ten_percent_cap,
	sup_num,
	legal_desc,
	legal_desc_2,
	abated_pct,
	abated_amt,
	abated_yr,
	eff_size_acres,
	shared_prop_val,
	shared_prop_cad_code,
	legal_acreage,
	vit_flag,
	recalc_flag,
	vit_declaration_filed_dt,
	prev_sup_num,
	appr_company_id,
	prop_inactive_dt,
	hscap_qualify_yr,
	hscap_override_prevhsval_flag,
	hscap_prevhsval,
	hscap_prevhsval_pacsuser,
	hscap_prevhsval_comment,
	hscap_prevhsval_date,
	hscap_override_newhsval_flag,
	hscap_newhsval,
	hscap_newhsval_pacsuser,
	hscap_newhsval_comment,
	hscap_newhsval_date,
	last_appraisal_yr,
	oil_wells,
	irr_wells,
	irr_acres,
	irr_capacity,
	oil_wells_apply_adjust,
	tif_land_val,
	tif_imprv_val,
	tif_flag,
	accept_create_id,
	accept_create_dt,
	abs_subdv_cd,
	hood_cd,
	block,
	tract_or_lot,
	mbl_hm_park,
	mbl_hm_space,
	rgn_cd,
	subset_cd,
	map_id,
	auto_build_legal,
	image_path,
	hscap_prev_reappr_yr,
	hscap_base_yr,
	hscap_base_yr_override,
	hscap_base_yr_pacsuser,
	hscap_base_yr_comment,
	hscap_base_yr_date,
	mapsco,
	last_appraiser_id,
	next_appraiser_id,
	last_appraisal_dt,
	next_appraisal_dt,
	next_appraisal_rsn,
	value_appraiser_id,
	land_appraiser_id,
	cost_value,
	income_value,
	shared_value,
	appr_method,
	cost_land_hstd_val,
	cost_land_non_hstd_val,
	cost_imprv_hstd_val,
	cost_imprv_non_hstd_val,
	cost_market,
	cost_ag_use_val,
	cost_ag_market,
	cost_ag_loss,
	cost_timber_market,
	cost_timber_use,
	cost_timber_loss,
	income_land_hstd_val,
	income_land_non_hstd_val,
	income_imprv_hstd_val,
	income_imprv_non_hstd_val,
	income_market,
	income_ag_use_val,
	income_ag_market,
	income_ag_loss,
	income_timber_market,
	income_timber_use,
	income_timber_loss,
	shared_land_hstd_val,
	shared_land_non_hstd_val,
	shared_imprv_hstd_val,
	shared_imprv_non_hstd_val,
	shared_market,
	shared_ag_use_val,
	shared_ag_market,
	shared_ag_loss,
	shared_timber_market,
	shared_timber_use,
	shared_timber_loss,
	sub_market_cd, 
	property_use_cd, 
	visibility_access_cd,
	shared_other_val,
	reviewed_dt,
	reviewed_appraiser, 
	arb_land_hstd_val,
	arb_land_non_hstd_val,
	arb_imprv_hstd_val,
	arb_imprv_non_hstd_val,
	arb_market,
	arb_ag_use_val,
	arb_ag_market,
	arb_timber_market,
	arb_timber_use,
	arb_timber_loss,
	udi_parent,
	udi_parent_prop_id,
	udi_status, 
	dist_land_hstd_val,
	dist_land_non_hstd_val,
	dist_imprv_hstd_val,
	dist_imprv_non_hstd_val,
	dist_market,
	dist_ag_use_val,
	dist_ag_market,
	dist_timber_market,
	dist_timber_use,
	dist_timber_loss,
	owner_update_dt,
	agent_update_dt,
	penpad_comments,
	last_actual_appraisal_dt,
	last_owner_id,
	cad_value_option,
	condo_pct,
	udi_child_legal_desc,
	image_id,
	last_arb_appr_method,
	pp_sq_ft,
	pp_rentable_sq_ft_rate,
	dist_vit_val,
	-- below new for 9.0
	secondary_use_cd,
	assessment_use_cd,
	state_district_cd,
	tax_area_mileage,
	total_mileage,
	dor_value,
	apply_miscellaneous_codes,
	book_page,
	sup_comment,
	change_of_value_form,
	sub_type,
	urban_growth_cd,
	cycle,
	cycle_override,
	pp_farm,
	pp_non_farm,
	ag_hs_use_val,
	ag_hs_mkt_val,
	ag_hs_loss,
	timber_hs_use_val,
	timber_hs_mkt_val,
	timber_hs_loss,
	cost_ag_hs_use_val,
	cost_ag_hs_mkt_val,
	cost_ag_hs_loss,
	cost_timber_hs_use_val,
	cost_timber_hs_mkt_val,
	cost_timber_hs_loss,
	shared_ag_hs_use_val,
	shared_ag_hs_mkt_val,
	shared_ag_hs_loss,
	shared_timber_hs_use_val,
	shared_timber_hs_mkt_val,
	shared_timber_hs_loss,
	arb_ag_hs_use_val,
	arb_ag_hs_mkt_val,
	arb_ag_hs_loss,
	arb_timber_hs_use_val,
	arb_timber_hs_mkt_val,
	arb_timber_hs_loss,
	dist_ag_hs_use_val,
	dist_ag_hs_mkt_val,
	dist_ag_hs_loss,
	dist_timber_hs_use_val,
	dist_timber_hs_mkt_val,
	dist_timber_hs_loss,
	sup_verified_user,
	new_val_imprv_hs,
	new_val_imprv_nhs,
	new_val_land_hs,
	new_val_land_nhs,
	sup_verified_date,
	change_form_printed,
	exclude_change_of_value_form,
	gis_real_coord_x,
	gis_real_coord_y,
	late_filing_penalty_pct,
	fraud_penalty_pct,
	prop_state,
	suppress_notice_prior_year_values,
	retain_notice_prior_year_value_setting,
	township_code,
	range_code,
	township_section,
	township_q_section,
	--imprv_val -- computed column
	mktappr_market,
	mktappr_land_hstd_val,
	mktappr_land_non_hstd_val,
	mktappr_imprv_hstd_val,
	mktappr_imprv_non_hstd_val,
	mktappr_ag_use_val,
	mktappr_ag_market,
	mktappr_ag_loss,
	mktappr_timber_market,
	mktappr_timber_use,
	mktappr_timber_loss,
	mktappr_ag_hs_use_val,
	mktappr_ag_hs_mkt_val,
	mktappr_ag_hs_loss,
	mktappr_timber_hs_use_val,
	mktappr_timber_hs_mkt_val,
	mktappr_timber_hs_loss,
	ubi_number,
	tax_registration,
	business_start_dt,
	business_close_dt,
	business_sold_dt
)
select
	property_val.prop_id,
	@input_to_yr, --prop_val_yr
	prop_val,
	chg_dt,
	notice_mail_dt,
	land_hstd_val,
	land_non_hstd_val,
	imprv_hstd_val,
	imprv_non_hstd_val,
	appraised_val,
	assessed_val,
	market,
	ag_use_val,
	ag_market,
	freeze_ceiling,
	freeze_yr,
	ag_loss,
	0, --ag_late_loss
	timber_78,
	timber_market,
	timber_use,
	timber_loss,
	0, --timber_late_loss
	null, --rendered_val
	null, --rendered_yr
	new_val,
	new_yr,
	mineral_int_pct,
	orig_appraised_val,
	ten_percent_cap,
	0, --sup_num
	legal_desc,
	legal_desc_2,
	abated_pct,
	abated_amt,
	abated_yr,
	eff_size_acres,
	shared_prop_val,
	shared_prop_cad_code,
	legal_acreage,
	vit_flag,
	'M', --recalc_flag,
	vit_declaration_filed_dt,
	0, --prev_sup_num
	appr_company_id,
	
	case
		when appr_company_id > 0
		then
			case
				when (@input_noncadappr_mark_inactive_real = 1 and property.prop_type_cd = 'R')
					then getdate()
				when (@input_noncadappr_mark_inactive_mh = 1 and property.prop_type_cd = 'MH')
					then getdate()
				when (@input_noncadappr_mark_inactive_mn = 1 and property.prop_type_cd = 'MN')
					then getdate()
				when (@input_noncadappr_mark_inactive_personal = 1 and property.prop_type_cd = 'P')
					then getdate()
				when (@input_noncadappr_mark_inactive_auto = 1 and property.prop_type_cd = 'A')
					then getdate()
				else prop_inactive_dt
			end
		else prop_inactive_dt
	end,
	
	hscap_qualify_yr,
	case when hscap_override_prevhsval_flag = 'T' then 'F' else hscap_override_prevhsval_flag end, --hscap_override_prevhsval_flag
	case when hscap_override_prevhsval_flag = 'T' then 0 else hscap_prevhsval end, --hscap_prevhsval
	case when hscap_override_prevhsval_flag = 'T' then null else hscap_prevhsval_pacsuser end, --hscap_prevhsval_pacsuser
	case when hscap_override_prevhsval_flag = 'T' then null else hscap_prevhsval_comment end, --hscap_prevhsval_comment
	case when hscap_override_prevhsval_flag = 'T' then null else hscap_prevhsval_date end, --hscap_prevhsval_date
	case when hscap_override_newhsval_flag = 'T' then 'F' else hscap_override_newhsval_flag end, --hscap_override_newhsval_flag
	case when hscap_override_newhsval_flag = 'T' then 0 else hscap_newhsval end, --hscap_newhsval
	case when hscap_override_newhsval_flag = 'T' then null else hscap_newhsval_pacsuser end, --hscap_newhsval_pacsuser
	case when hscap_override_newhsval_flag = 'T' then null else hscap_newhsval_comment end, --hscap_newhsval_comment
	case when hscap_override_newhsval_flag = 'T' then null else hscap_newhsval_date end, --hscap_newhsval_date
	last_appraisal_yr,
	oil_wells,
	irr_wells,
	irr_acres,
	irr_capacity,
	oil_wells_apply_adjust,
	tif_land_val,
	tif_imprv_val,
	tif_flag,
	accept_create_id,
	accept_create_dt,
	abs_subdv_cd,
	hood_cd,
	block,
	tract_or_lot,
	mbl_hm_park,
	mbl_hm_space,
	rgn_cd,
	subset_cd,
	map_id,
	auto_build_legal,
	image_path,
	case when hscap_prev_reappr_yr is not null and last_appraisal_yr is null then hscap_prev_reappr_yr else last_appraisal_yr end, --hscap_prev_reappr_yr
	case when hscap_base_yr_override = 'T' then null else hscap_base_yr end, --hscap_base_yr
	case when hscap_base_yr_override = 'T' then 'F' else hscap_base_yr_override end, --hscap_base_yr_override
	case when hscap_base_yr_override = 'T' then null else hscap_base_yr_pacsuser end, --hscap_base_yr_pacsuser
	case when hscap_base_yr_override = 'T' then null else hscap_base_yr_comment end, --hscap_base_yr_comment
	case when hscap_base_yr_override = 'T' then null else hscap_base_yr_date end, --hscap_base_yr_date
	mapsco,
	last_appraiser_id,
	next_appraiser_id,
	last_appraisal_dt,
	next_appraisal_dt,
	next_appraisal_rsn,
	value_appraiser_id,
	land_appraiser_id,
	cost_value,
	income_value,
	shared_value,
	appr_method,
	cost_land_hstd_val,
	cost_land_non_hstd_val,
	cost_imprv_hstd_val,
	cost_imprv_non_hstd_val,
	cost_market,
	cost_ag_use_val,
	cost_ag_market,
	cost_ag_loss,
	cost_timber_market,
	cost_timber_use,
	cost_timber_loss,
	income_land_hstd_val,
	income_land_non_hstd_val,
	income_imprv_hstd_val,
	income_imprv_non_hstd_val,
	income_market,
	income_ag_use_val,
	income_ag_market,
	income_ag_loss,
	income_timber_market,
	income_timber_use,
	income_timber_loss,
	shared_land_hstd_val,
	shared_land_non_hstd_val,
	shared_imprv_hstd_val,
	shared_imprv_non_hstd_val,
	shared_market,
	shared_ag_use_val,
	shared_ag_market,
	shared_ag_loss,
	shared_timber_market,
	shared_timber_use,
	shared_timber_loss,
	sub_market_cd, 
	property_use_cd, 
	visibility_access_cd,
	shared_other_val,
	reviewed_dt,
	reviewed_appraiser, 
	arb_land_hstd_val,
	arb_land_non_hstd_val,
	arb_imprv_hstd_val,
	arb_imprv_non_hstd_val,
	arb_market,
	arb_ag_use_val,
	arb_ag_market,
	arb_timber_market,
	arb_timber_use,
	arb_timber_loss,
	udi_parent,
	udi_parent_prop_id,
	udi_status, 
	dist_land_hstd_val,
	dist_land_non_hstd_val,
	dist_imprv_hstd_val,
	dist_imprv_non_hstd_val,
	dist_market,
	dist_ag_use_val,
	dist_ag_market,
	dist_timber_market,
	dist_timber_use,
	dist_timber_loss,
	owner_update_dt,
	agent_update_dt,
	penpad_comments,
	last_actual_appraisal_dt,
	last_owner_id,
	cad_value_option,
	condo_pct,
	udi_child_legal_desc,
	image_id,
	last_arb_appr_method,
	pp_sq_ft,
	pp_rentable_sq_ft_rate,
	dist_vit_val,
	-- below new for 9.0
	secondary_use_cd,
	assessment_use_cd,
	state_district_cd,
	tax_area_mileage,
	total_mileage,
	dor_value,
	apply_miscellaneous_codes,
	book_page,
	sup_comment,
	change_of_value_form,
	sub_type,
	urban_growth_cd,
	cycle,
	cycle_override,
	pp_farm,
	pp_non_farm,
	ag_hs_use_val,
	ag_hs_mkt_val,
	ag_hs_loss,
	timber_hs_use_val,
	timber_hs_mkt_val,
	timber_hs_loss,
	cost_ag_hs_use_val,
	cost_ag_hs_mkt_val,
	cost_ag_hs_loss,
	cost_timber_hs_use_val,
	cost_timber_hs_mkt_val,
	cost_timber_hs_loss,
	shared_ag_hs_use_val,
	shared_ag_hs_mkt_val,
	shared_ag_hs_loss,
	shared_timber_hs_use_val,
	shared_timber_hs_mkt_val,
	shared_timber_hs_loss,
	arb_ag_hs_use_val,
	arb_ag_hs_mkt_val,
	arb_ag_hs_loss,
	arb_timber_hs_use_val,
	arb_timber_hs_mkt_val,
	arb_timber_hs_loss,
	dist_ag_hs_use_val,
	dist_ag_hs_mkt_val,
	dist_ag_hs_loss,
	dist_timber_hs_use_val,
	dist_timber_hs_mkt_val,
	dist_timber_hs_loss,
	sup_verified_user,
	new_val_imprv_hs,
	new_val_imprv_nhs,
	new_val_land_hs,
	new_val_land_nhs,
	sup_verified_date,
	change_form_printed,
	exclude_change_of_value_form,
	gis_real_coord_x,
	gis_real_coord_y,
	0, --late_filing_penalty_pct
	fraud_penalty_pct,
	prop_state,
	--imprv_val  -- computed column
	case when retain_notice_prior_year_value_setting = 1 then suppress_notice_prior_year_values else 0 end,
	0, --retain_notice_prior_year_value_setting

	township_code,
	range_code,
	township_section,
	township_q_section,
	
	case when appr_method = 'G' then mktappr_market else 0 end,
	case when appr_method = 'G' then mktappr_land_hstd_val else 0 end,
	case when appr_method = 'G' then mktappr_land_non_hstd_val else 0 end,
	case when appr_method = 'G' then mktappr_imprv_hstd_val else 0 end,
	case when appr_method = 'G' then mktappr_imprv_non_hstd_val else 0 end,
	case when appr_method = 'G' then mktappr_ag_use_val else 0 end,
	case when appr_method = 'G' then mktappr_ag_market else 0 end,
	case when appr_method = 'G' then mktappr_ag_loss else 0 end,
	case when appr_method = 'G' then mktappr_timber_market else 0 end,
	case when appr_method = 'G' then mktappr_timber_use else 0 end,
	case when appr_method = 'G' then mktappr_timber_loss else 0 end,
	case when appr_method = 'G' then mktappr_ag_hs_use_val else 0 end,
	case when appr_method = 'G' then mktappr_ag_hs_mkt_val else 0 end,
	case when appr_method = 'G' then mktappr_ag_hs_loss else 0 end,
	case when appr_method = 'G' then mktappr_timber_hs_use_val else 0 end,
	case when appr_method = 'G' then mktappr_timber_hs_mkt_val else 0 end,
	case when appr_method = 'G' then mktappr_timber_hs_loss else 0 end,
	ubi_number,
	tax_registration,
	business_start_dt,
	business_close_dt,
	business_sold_dt

from create_property_layer_prop_list as cplpl with(tablockx)
join property_val with(tablockx) on
	property_val.prop_val_yr = cplpl.prop_val_yr and
	property_val.sup_num = cplpl.sup_num and
	property_val.prop_id = cplpl.prop_id
join property with(tablockx) on
	property.prop_id = cplpl.prop_id
--order by property_val.prop_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into property_val End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

-- comparable_grid_prop_year_comptype
set @StartStep = getdate()  --logging capture start time

insert dbo.comparable_grid_prop_year_comptype (
	lYear,
	lPropID,
	szCompType,
	lPropGridID,
	lMarketValPropGridID
)
select
	@input_to_yr,
	pv.prop_id,
	pyc.szCompType,
	null,
	pyc.lMarketValPropGridID
from create_property_layer_prop_list as cplpl with(tablockx)
join property_val as pv with(tablockx) on
	pv.prop_val_yr = cplpl.prop_val_yr and
	pv.sup_num = cplpl.sup_num and
	pv.prop_id = cplpl.prop_id and
	pv.appr_method = 'G'
join comparable_grid_prop_year_comptype as pyc with(tablockx) on
	pyc.lYear = pv.prop_val_yr and
	pyc.lPropID = pv.prop_id and
	pyc.szCompType = 'S'
where not exists (
	select 1 from comparable_grid_prop_year_comptype c with(tablockx)
	where c.lYear = @input_to_yr
	and c.lPropID = pv.prop_id
	and c.szCompType = pyc.szCompType
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into comparable_grid_prop_year_comptype End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--entity_prop_assoc
-- rgoolsby : no new columns for 9.0
insert into entity_prop_assoc with(tablockx)
(
	entity_id,
	prop_id,
	entity_prop_id,
	entity_prop_pct,
	conv_taxable_val,
	conv_taxable_value,
	sup_num,
	tax_yr,
	annex_yr,
	entity_taxable_val,
	pct_imprv_hs,
	pct_imprv_nhs,
	pct_land_hs,
	pct_land_nhs,
	pct_ag_use,
	pct_ag_mkt,
	pct_tim_use,
	pct_tim_mkt,
	new_val_hs,
	new_val_hs_override,
	new_val_hs_override_amount,
	new_val_nhs,
	new_val_nhs_override,
	new_val_nhs_override_amount,
	new_val_p,
	new_val_p_override,
	new_val_p_override_amount
)
select 
	epa.entity_id,
	epa.prop_id,
	epa.entity_prop_id,
	epa.entity_prop_pct,
	epa.conv_taxable_val,
	epa.conv_taxable_value,
	0,
	@input_to_yr,
	epa.annex_yr,
	epa.entity_taxable_val,
	epa.pct_imprv_hs,
	epa.pct_imprv_nhs,
	epa.pct_land_hs,
	epa.pct_land_nhs,
	epa.pct_ag_use,
	epa.pct_ag_mkt,
	epa.pct_tim_use,
	epa.pct_tim_mkt,
	case when epa.tax_yr = 0 then epa.new_val_hs else null end,
	case when epa.tax_yr = 0 then epa.new_val_hs_override else 0 end,
	case when epa.tax_yr = 0 then epa.new_val_hs_override_amount else null end,
	case when epa.tax_yr = 0 then epa.new_val_nhs else null end,
	case when epa.tax_yr = 0 then epa.new_val_nhs_override else 0 end,
	case when epa.tax_yr = 0 then epa.new_val_nhs_override_amount else null end,
	case when epa.tax_yr = 0 then epa.new_val_p else null end,
	case when epa.tax_yr = 0 then epa.new_val_p_override else 0 end,
	case when epa.tax_yr = 0 then epa.new_val_p_override_amount else null end
from create_property_layer_prop_list as cplpl with(tablockx)
join entity_prop_assoc as epa with(tablockx) on
	epa.tax_yr = cplpl.prop_val_yr and
	epa.sup_num = cplpl.sup_num and
	epa.prop_id = cplpl.prop_id
---order by epa.prop_id asc, epa.entity_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into entity_prop_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


--property_exemption
if @input_HOF = 0 -- set up for NULL value test
   begin
      set @input_HOF = NULL
   end

set @StartStep = getdate()  --logging capture start time

insert into property_exemption with(tablockx)
(
	prop_id,
	owner_id,
	exmpt_tax_yr,
	owner_tax_yr,
	prop_type_cd,
	exmpt_type_cd,
	applicant_nm,
	birth_dt,
	spouse_birth_dt,
	prop_exmpt_dl_num,
	prop_exmpt_ss_num,
	effective_dt,
	termination_dt,
	apply_pct_owner,
	sup_num,
	effective_tax_yr,
	qualify_yr,
	sp_date_approved,
	sp_expiration_date,
	sp_comment,
	sp_value_type,
	sp_value_option,
	absent_flag,
	absent_expiration_date,
	absent_comment,
	deferral_date,
	apply_local_option_pct_only,
	apply_no_exemption_amount,
-- following added for 9.0
    exmpt_subtype_cd,
    exemption_pct,
    combined_disp_income,
    exempt_qualify_cd,
    review_request_date,
    review_status_cd,
    review_last_year,
	dor_value_type,
	dor_exmpt_amount,
	dor_exmpt_percent
)
select
	pe.prop_id,
	pe.owner_id,
	@input_to_yr,
	@input_to_yr,
	pe.prop_type_cd,
	pe.exmpt_type_cd,
	pe.applicant_nm,
	pe.birth_dt,
	pe.spouse_birth_dt,
	pe.prop_exmpt_dl_num,
	pe.prop_exmpt_ss_num,
	pe.effective_dt,
	pe.termination_dt,
	pe.apply_pct_owner,
	0,
	pe.effective_tax_yr,
	pe.qualify_yr,
	pe.sp_date_approved,
	pe.sp_expiration_date,
	pe.sp_comment,
	pe.sp_value_type,
	pe.sp_value_option,
	pe.absent_flag,
	pe.absent_expiration_date,
	pe.absent_comment,
	pe.deferral_date,
	pe.apply_local_option_pct_only,
	pe.apply_no_exemption_amount,
-- following added for 9.0
    exmpt_subtype_cd,
    exemption_pct,
    combined_disp_income,
    exempt_qualify_cd,
    case when @input_from_yr = @input_to_yr then review_request_date else null end,
    case when @input_from_yr = @input_to_yr then review_status_cd else null end,
    review_last_year,
	pe.dor_value_type,
	pe.dor_exmpt_amount,
	pe.dor_exmpt_percent
from create_property_layer_prop_list as cplpl with(tablockx)
join property_exemption as pe with(tablockx) on
	pe.exmpt_tax_yr = cplpl.prop_val_yr and
	pe.owner_tax_yr = cplpl.prop_val_yr and
	pe.sup_num = cplpl.sup_num and
	pe.prop_id = cplpl.prop_id 
join property_val pv on
	pe.exmpt_tax_yr = pv.prop_val_yr and
	pe.owner_tax_yr = pv.prop_val_yr and
	pe.sup_num = pv.sup_num and
	pe.prop_id = pv.prop_id 
where 
	--Only keep HOF exemptions if the user checks the option to keep them
	--and then only if the market value is at or under the specified amount
	(pe.exmpt_type_cd != 'HOF' or (@input_HOF IS NOT NULL and pv.market <= @input_HOF))
	--Only keep exemptions if not prorated or if prorate expiriation date is still in the future
	and (pe.termination_dt is null or convert(int, @input_from_yr) < year(pe.termination_dt))

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into property_exemption End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

-- Only copy the Active income information
insert into property_exemption_income with(tablockx)
(
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	owner_id,
	exmpt_type_cd,
	inc_id,
	active,
	income_year,
	created_date,
	created_by_id,
	tax_return,
	deny_exemption,
	comment
)

select distinct
	@input_to_yr,
	@input_to_yr,
	0,
	pei.prop_id,
	pei.owner_id,
	pei.exmpt_type_cd,
	pei.inc_id,
	pei.active,
	pei.income_year,
	pei.created_date,
	pei.created_by_id,
	pei.tax_return,
	pei.deny_exemption,
	pei.comment
from create_property_layer_prop_list as cplpl with(tablockx)
join property_exemption_income as pei with(tablockx) on
	pei.exmpt_tax_yr = cplpl.prop_val_yr and
	pei.owner_tax_yr = cplpl.prop_val_yr and
	pei.sup_num = cplpl.sup_num and
	pei.prop_id = cplpl.prop_id 
join property_exemption as pe with(tablockx) on
	pe.exmpt_tax_yr = @input_to_yr and
	pe.owner_tax_yr = @input_to_yr and
	pe.sup_num = 0 and
	pe.prop_id = pei.prop_id and
	pe.owner_id = pei.owner_id and
	pe.exmpt_type_cd = pei.exmpt_type_cd
where pei.active = 1
	

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into property_exemption_income End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

-- Only copy the Active income detail information
insert into property_exemption_income_detail with(tablockx)
(
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	owner_id,
	exmpt_type_cd,
	inc_id,
	inc_detail_id,
	id_flag,
	code,
	amount
)

select distinct 
	@input_to_yr,
	@input_to_yr,
	0,
	peid.prop_id,
	peid.owner_id,
	peid.exmpt_type_cd,
	peid.inc_id,
	peid.inc_detail_id,
	peid.id_flag,
	peid.code,
	peid.amount

from create_property_layer_prop_list as cplpl with(tablockx)
join property_exemption_income_detail as peid with (tablockx) on
	peid.exmpt_tax_yr = cplpl.prop_val_yr and
	peid.owner_tax_yr = cplpl.prop_val_yr and
	peid.sup_num = cplpl.sup_num and
	peid.prop_id = cplpl.prop_id
join property_exemption_income as pei with(tablockx) on
	pei.exmpt_tax_yr = @input_to_yr and
	pei.owner_tax_yr = @input_to_yr and
	pei.sup_num = 0 and
	pei.prop_id = cplpl.prop_id and
	peid.owner_id = pei.owner_id and
	peid.exmpt_type_cd = pei.exmpt_type_cd and
	peid.inc_id = pei.inc_id
where pei.active = 1


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into property_exemption_income_detail End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

-- [property_exemption_dor_detail]
insert into property_exemption_dor_detail with(tablockx)
(
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	owner_id,
	exmpt_type_cd,
	item_type,
	item_id,
	value_type,
	exmpt_amount,
	exmpt_percent
)

select distinct
	@input_to_yr,
	@input_to_yr,
	0,
	pedd.prop_id,
	pedd.owner_id,
	pedd.exmpt_type_cd,
	pedd.item_type,
	pedd.item_id,
	pedd.value_type,
	pedd.exmpt_amount,
	pedd.exmpt_percent
from create_property_layer_prop_list as cplpl with(tablockx)
join property_exemption_dor_detail as pedd with(tablockx) on
	pedd.exmpt_tax_yr = cplpl.prop_val_yr and
	pedd.owner_tax_yr = cplpl.prop_val_yr and
	pedd.sup_num = cplpl.sup_num and
	pedd.prop_id = cplpl.prop_id 
join property_exemption as pe with(tablockx) on
	pe.exmpt_tax_yr = @input_to_yr and
	pe.owner_tax_yr = @input_to_yr and
	pe.sup_num = 0 and
	pe.prop_id = pedd.prop_id and
	pe.owner_id = pedd.owner_id and
	pe.exmpt_type_cd = pedd.exmpt_type_cd
	

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into property_exemption_dor_detail End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


set @StartStep = getdate()  --logging capture start time

-- LTIF property associations
insert tif_area_prop_assoc with(tablockx) (
	tif_area_id,
	prop_id,
	year,
	sup_num
)
select
	tapa.tif_area_id,
	tapa.prop_id,
	@input_to_yr,
	0 --sup_num
from create_property_layer_prop_list as cplpl with(tablockx)
join tif_area_prop_assoc as tapa with(tablockx)
	on tapa.year = cplpl.prop_val_yr
	and tapa.sup_num = cplpl.sup_num
	and tapa.prop_id = cplpl.prop_id
join dbo.tif_area ta with(tablockx)
	on ta.tif_area_id = tapa.tif_area_id
where
	ta.completed = 0 and
	@input_to_yr < isnull(ta.expiration_year, 9999)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into tif_area_prop_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


set @StartStep = getdate()  --logging capture start time

-- property_freeze
-- rgoolsby: no new column for 9.0
insert into property_freeze with(tablockx)
(
	prop_id,
	owner_id,
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	entity_id,
	exmpt_type_cd,
	use_freeze,
	transfer_dt,
	prev_tax_due,
	prev_tax_nofrz,
	freeze_yr,
	freeze_ceiling,
	transfer_pct,
	transfer_pct_override,
	pacs_freeze,
	pacs_freeze_date,
	pacs_freeze_ceiling,
	pacs_freeze_run,
	freeze_override
)
select
	pf.prop_id,
	pf.owner_id,
	@input_to_yr,
	@input_to_yr,
	0,
	pf.entity_id,
	pf.exmpt_type_cd,
	pf.use_freeze,
	pf.transfer_dt,
	pf.prev_tax_due,
	pf.prev_tax_nofrz,
	pf.freeze_yr,
	pf.freeze_ceiling,
	pf.transfer_pct,
	pf.transfer_pct_override,
	pf.pacs_freeze,
	pf.pacs_freeze_date,
	pf.pacs_freeze_ceiling,
	pf.pacs_freeze_run,
	pf.freeze_override
from create_property_layer_prop_list as cplpl with(tablockx)
join property_freeze as pf with(tablockx) on
	pf.exmpt_tax_yr = cplpl.prop_val_yr and
	pf.owner_tax_yr = cplpl.prop_val_yr and
	pf.sup_num = cplpl.sup_num and
	pf.prop_id = cplpl.prop_id
join entity_exmpt as ee with(tablockx) on
	ee.entity_id = pf.entity_id and
	ee.exmpt_tax_yr = pf.exmpt_tax_yr and
	ee.exmpt_type_cd = pf.exmpt_type_cd and
	ee.freeze_flag = 1
inner join
	dbo.entity_prop_assoc as epa with (nolock)
on
	epa.entity_id = pf.entity_id
and	epa.prop_id = pf.prop_id
and	epa.tax_yr = @input_to_yr
and	epa.sup_num = 0
--order by pf.prop_id asc, pf.owner_id asc, pf.entity_id asc, pf.exmpt_type_cd asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into property_freeze End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--property_special_entity_exemption
-- rgoolsby: no new columns for 9.0
insert into property_special_entity_exemption with(tablockx)
(
	prop_id,
	owner_id,
	sup_num,
	exmpt_tax_yr,
	owner_tax_yr,
	exmpt_type_cd,
	entity_id,
	sp_amt,
	sp_pct,
	exmpt_amt,
	sp_value_type,
	sp_value_option,
	sp_segment_amt
)
select 
	psee.prop_id,
	psee.owner_id,
	0, --sup_num
	@input_to_yr, --exmpt_tax_yr
	@input_to_yr, --owner_tax_yr
	psee.exmpt_type_cd,
	psee.entity_id,
	psee.sp_amt,
	psee.sp_pct,
	psee.exmpt_amt,
	psee.sp_value_type,
	psee.sp_value_option,
	psee.sp_segment_amt
from create_property_layer_prop_list as cplpl with(tablockx)
join property_special_entity_exemption as psee with(tablockx) on
	psee.exmpt_tax_yr = cplpl.prop_val_yr and
	psee.owner_tax_yr = cplpl.prop_val_yr and
	psee.sup_num = cplpl.sup_num and
	psee.prop_id = cplpl.prop_id
order by psee.prop_id asc, psee.owner_id asc, psee.entity_id asc, psee.exmpt_type_cd asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into property_special_entity_exemption End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time


-- "Psuedo" disabling of triggers so we don't update property_val.owner_update_dt
exec dbo.TriggerEnable 'owner', 0

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'exec dbo.TriggerEnable End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--owner
insert into owner with(tablockx)
(
	owner_id,
	owner_tax_yr,
	prop_id,
	updt_dt,
	pct_ownership,
	owner_cmnt,
	over_65_defer,
	over_65_date,
	ag_app_filed,
	apply_pct_exemptions,
	sup_num,
	type_of_int,
	hs_prop,
	birth_dt,
	roll_exemption,
	roll_state_code,
	roll_entity,
	pct_imprv_hs,
	pct_imprv_nhs,
	pct_land_hs,
	pct_land_nhs,
	pct_ag_use,
	pct_ag_mkt,
	pct_tim_use,
	pct_tim_mkt,
	pct_pers_prop,
	udi_child_prop_id,
	percent_type,
-- following added for 9.0
	pct_ag_use_hs,
	pct_ag_mkt_hs,
	pct_tim_use_hs,
	pct_tim_mkt_hs,
	linked_cd
)
select
	o.owner_id,
	@input_to_yr, --owner_tax_yr
	o.prop_id,
	o.updt_dt,
	o.pct_ownership,
	o.owner_cmnt,
	o.over_65_defer,
	o.over_65_date,
	o.ag_app_filed,
	o.apply_pct_exemptions,
	0, --sup_num
	o.type_of_int,
	o.hs_prop,
	o.birth_dt,
	null,
	null,
	null,
	o.pct_imprv_hs,
	o.pct_imprv_nhs,
	o.pct_land_hs,
	o.pct_land_nhs,
	o.pct_ag_use,
	o.pct_ag_mkt,
	o.pct_tim_use,
	o.pct_tim_mkt,
	o.pct_pers_prop,
	o.udi_child_prop_id,
	o.percent_type,
-- following added for 9.0
	pct_ag_use_hs,
	pct_ag_mkt_hs,
	pct_tim_use_hs,
	pct_tim_mkt_hs,
	linked_cd
from create_property_layer_prop_list as cplpl with(tablockx)
join owner as o with(tablockx) on
	o.owner_tax_yr = cplpl.prop_val_yr and
	o.sup_num = cplpl.sup_num and
	o.prop_id = cplpl.prop_id
--order by o.prop_id asc, o.owner_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into owner End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

-- "Pseudo" enabling of triggers, now that we're done inserting owners
exec dbo.TriggerEnable 'owner', 1


-- "Psuedo" disabling of triggers so we don't update property_val.owner_update_dt
exec dbo.TriggerEnable 'prop_linked_owner', 0

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'exec dbo.TriggerEnable End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--owner
insert into prop_linked_owner with(tablockx)
(
	prop_val_yr,
	sup_num,
	prop_id, 
	owner_id, 
	owner_desc, 
	link_type_cd
)
select
	@input_to_yr, --prop_val_yr
	0, --sup_num
	plo.prop_id,
	plo.owner_id,
	plo.owner_desc,
	plo.link_type_cd
from create_property_layer_prop_list as cplpl with(tablockx)
join prop_linked_owner as plo with(tablockx) on
	plo.prop_val_yr = cplpl.prop_val_yr and
	plo.sup_num = cplpl.sup_num and
	plo.prop_id = cplpl.prop_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into prop_linked_owner End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


-- "Pseudo" enabling of triggers, now that we're done inserting owners
exec dbo.TriggerEnable 'prop_linked_owner', 1

set @StartStep = getdate()  --logging capture start time

--imprv
insert into imprv with(tablockx)
(
	prop_id,
	prop_val_yr,
	imprv_id,
	sup_num,
	sale_id,
	imprv_type_cd,
	imprv_sl_locked,
	primary_imprv,
	imprv_state_cd,
	imprv_homesite,
	imprv_desc,
	imprv_val,
	misc_cd,
	imp_new_yr,
	imp_new_val,
	imp_new_val_override,
	original_val,
	base_val,
	calc_val,
	adjusted_val,
	living_area_up,
	err_flag,
	imprv_image_url,
	imprv_cmnt,
	mbl_hm_make,
	mbl_hm_model,
	mbl_hm_sn,
	mbl_hm_sn_2,
	mbl_hm_sn_3,
	mbl_hm_hud_num,
	mbl_hm_hud_num_2,
	mbl_hm_hud_num_3,
	mbl_hm_title_num,
	imp_new_pc,
	flat_val,
	value_type,
	imprv_adj_amt,
	imprv_adj_factor,
	imprv_mass_adj_factor,
	imprv_val_source,
	economic_pct,
	physical_pct,
	functional_pct,
	economic_cmnt,
	physical_cmnt,
	functional_cmnt,
	effective_yr_blt,
	percent_complete,
	percent_complete_cmnt,
	ref_id1,
	num_imprv,
	arb_val,
	stories,
	dep_pct,
	dep_cmnt,
	dist_val,
	hs_pct,
	hs_pct_override,
-- following added for 9.0
    primary_use_cd,
    primary_use_override,
    secondary_use_cd,
    secondary_use_override,
    actual_year_built,
    building_number,
    building_name,
    flat_value_comment,
    flat_value_user_id,
    flat_value_date,
    building_id,
    recalc_error_validate_flag,
    recalc_error_validate_date,
    recalc_error_validate_user_id
)
select      
	imprv.prop_id,
	@input_to_yr, --prop_val_yr
	imprv.imprv_id,
	0, --sup_num
	0, --sale_id
	imprv.imprv_type_cd,
	imprv.imprv_sl_locked,
	imprv.primary_imprv,
	imprv.imprv_state_cd,
	imprv.imprv_homesite,
	imprv.imprv_desc,
	imprv.imprv_val,
	imprv.misc_cd,
	@input_to_yr, --imp_new_yr
	0, --imp_new_val
	'0', --imp_new_val_override,
	imprv.original_val,
	imprv.base_val,
	imprv.calc_val,
	imprv.adjusted_val,
	imprv.living_area_up,
	imprv.err_flag,
	imprv.imprv_image_url,
	imprv.imprv_cmnt,
	imprv.mbl_hm_make,
	imprv.mbl_hm_model,
	imprv.mbl_hm_sn,
	imprv.mbl_hm_sn_2,
	imprv.mbl_hm_sn_3,
	imprv.mbl_hm_hud_num,
	imprv.mbl_hm_hud_num_2,
	imprv.mbl_hm_hud_num_3,
	imprv.mbl_hm_title_num,
	imprv.imp_new_pc,
	case when imprv.imprv_val_source <> 'F' then 0 else imprv.flat_val end, --flat_val
	imprv.value_type,
	imprv.imprv_adj_amt,
	imprv.imprv_adj_factor,
	imprv.imprv_mass_adj_factor,
	imprv.imprv_val_source,
	imprv.economic_pct,
	imprv.physical_pct,
	imprv.functional_pct,
	imprv.economic_cmnt,
	imprv.physical_cmnt,
	imprv.functional_cmnt,
	imprv.effective_yr_blt,
	imprv.percent_complete,
	imprv.percent_complete_cmnt,
	imprv.ref_id1,
	imprv.num_imprv,
	imprv.arb_val,
	imprv.stories,
	imprv.dep_pct,
	imprv.dep_cmnt,
	imprv.dist_val,
	imprv.hs_pct,
	imprv.hs_pct_override,
-- following added for 9.0
    primary_use_cd,
    primary_use_override,
    imprv.secondary_use_cd,
    secondary_use_override,
    actual_year_built,
    building_number,
    building_name,
    flat_value_comment,
    flat_value_user_id,
    flat_value_date,
    building_id,
    recalc_error_validate_flag,
    recalc_error_validate_date,
    recalc_error_validate_user_id    
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv with(tablockx) on
	imprv.prop_val_yr = cplpl.prop_val_yr and
	imprv.sup_num = cplpl.sup_num and
	imprv.sale_id = 0 and
	imprv.prop_id = cplpl.prop_id
	join property_val with(tablockx) on
	property_val.prop_val_yr = cplpl.prop_val_yr and
	property_val.sup_num = cplpl.sup_num and
	property_val.prop_id = cplpl.prop_id	
--order by imprv.prop_id asc, imprv.imprv_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--imprv_detail                                                                                                                                                               
insert into imprv_detail with(tablockx)
(
	prop_id,
	prop_val_yr,
	imprv_id,
	imprv_det_id,
	sup_num,
	sale_id,
	imprv_det_class_cd,
	imprv_det_meth_cd,
	imprv_det_type_cd,
	seq_num,
	imprv_det_val,
	imprv_det_val_source,
	imprv_det_desc,
	imprv_det_area,
	imprv_det_area_type,
	condition_cd,
	cubic_area,
	calc_area,
	sketch_area,
	override_area,
	override_cubic_area,
	override_perimeter,
	perimeter,
	length,
	width,
	height,
	unit_price,
	yr_new,
	yr_built,
	depreciation_yr,
	depreciation_yr_override,
	imprv_det_orig_val,
	imprv_det_orig_up,
	effective_tax_yr,
	imprv_det_adj_factor,
	imprv_det_adj_amt,
	imprv_det_calc_val,
	imprv_det_adj_val,
	imprv_det_flat_val,
	economic_pct,
	physical_pct,
	physical_pct_source,
	functional_pct,
	economic_pct_override,
	physical_pct_override,
	functional_pct_override,
	economic_cmnt,
	physical_cmnt,
	functional_cmnt,
	percent_complete,
	percent_complete_override,
	percent_complete_cmnt,
	new_value_flag,
	new_value,
	new_value_override,
	sketch_cmds,
	use_up_for_pct_base,
	ref_id1,
	reserved1,
	can_close_sketch,
	imprv_det_sub_class_cd,
	num_units,
	num_stories,
	stories_multiplier,
	dep_pct,
	dep_pct_override,
	add_factor,
	add_factor_override,
	size_adj_pct,
	size_adj_pct_override,
-- following added for 9.0
    lease_class,
    actual_year_built_override,
    flat_value_comment,
    flat_value_user_id,
    flat_value_date,
    depreciated_replacement_cost_new,
    floor_number,
    load_factor,
    actual_age,
    net_rentable_area,
    building_id,
    permanent_crop_acres,
    permanent_crop_irrigation_acres,
    permanent_crop_age_group,
    permanent_crop_trellis,
    permanent_crop_irrigation_system_type,
    permanent_crop_irrigation_sub_class,
    permanent_crop_density,
    imprv_det_cost_unit_price,
    imprv_det_ms_val,
    imprv_det_ms_unit_price,
    recalc_error_validate_flag,
    recalc_error_validate_date,
    recalc_error_validate_user_id

)
select 
	imprv_detail.prop_id,
	@input_to_yr, --prop_val_yr
	imprv_id,
	imprv_det_id,
	0, --sup_num
	0, --sale_id
	imprv_det_class_cd,
	imprv_det_meth_cd,
	imprv_det_type_cd,
	seq_num,
	imprv_det_val,
	imprv_det_val_source,
	imprv_det_desc,
	imprv_det_area,
	imprv_det_area_type,
	condition_cd,
	cubic_area,
	calc_area,
	sketch_area,
	override_area,
	override_cubic_area,
	override_perimeter,
	perimeter,
	length,
	width,
	height,
	unit_price,
	yr_new,
	yr_built,
	depreciation_yr,
	depreciation_yr_override,
	imprv_det_orig_val,
	imprv_det_orig_up,
	effective_tax_yr,
	imprv_det_adj_factor,
	imprv_det_adj_amt,
	imprv_det_calc_val,
	imprv_det_adj_val,
	case when imprv_det_val_source <> 'F' then 0 else imprv_det_flat_val end, --imprv_det_flat_val
	economic_pct,
	physical_pct,
	physical_pct_source,
	functional_pct,
	economic_pct_override,
	physical_pct_override,
	functional_pct_override,
	economic_cmnt,
	physical_cmnt,
	functional_cmnt,
	percent_complete,
	percent_complete_override,
	percent_complete_cmnt,
	'F', --new_value_flag
	0, --new_value
	'F', --new_value_override
	sketch_cmds,
	use_up_for_pct_base,
	ref_id1,
	reserved1,
	can_close_sketch,
	imprv_det_sub_class_cd,
	num_units,
	num_stories,
	stories_multiplier,
	dep_pct,
	dep_pct_override,
	add_factor,
	add_factor_override,
	size_adj_pct,
	size_adj_pct_override,
-- following added for 9.0
    lease_class,
    actual_year_built_override,
    flat_value_comment,
    flat_value_user_id,
    flat_value_date,
    depreciated_replacement_cost_new,
    floor_number,
    load_factor,
    actual_age,
    net_rentable_area,
    building_id,
    
    permanent_crop_acres,
    permanent_crop_irrigation_acres,
    permanent_crop_age_group,
    permanent_crop_trellis,
    permanent_crop_irrigation_system_type,
    permanent_crop_irrigation_sub_class,
    permanent_crop_density,
    imprv_det_cost_unit_price,
    imprv_det_ms_val,
    imprv_det_ms_unit_price,
    recalc_error_validate_flag,
    recalc_error_validate_date,
    recalc_error_validate_user_id

from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail with(tablockx) on
	imprv_detail.prop_val_yr = cplpl.prop_val_yr and
	imprv_detail.sup_num = cplpl.sup_num and
	imprv_detail.sale_id = 0 and
	imprv_detail.prop_id = cplpl.prop_id
--order by imprv_detail.prop_id asc, imprv_detail.imprv_id asc, imprv_detail.imprv_det_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_detail End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--imprv_remodel

-- logging end of step 
 SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_remodel End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

insert into imprv_remodel with (tablockx)
(
[year],
sup_num,
imprv_remodel.prop_id,
app_num,
app_date_received,
submitted_by,
imprv_desc,
est_cost,
beginning_value_date,
contractor,
app_status,
permit_issued_by,
permit_num,
permit_date,
assess_yr_begin,
assess_yr_removed,
value_after,
value_prior,
increase_in_val,
exemption_amount,
taxable_val,
construction_finish_date,
construction_begin_date,
[percent],
assess_yr_requalify,
imprv_det_assoc,
imprv_assoc,
comments,
final_value_date,
complete,
expired,
override
)
SELECT
@input_to_yr,
0, -- sup_num
imprv_remodel.prop_id,
app_num, -- app_num
app_date_received,
submitted_by,
imprv_desc,
est_cost,
beginning_value_date,
contractor,
app_status,
permit_issued_by,
permit_num,
permit_date,
assess_yr_begin,
assess_yr_removed,
value_after,
value_prior,
increase_in_val,
exemption_amount,
taxable_val,
construction_finish_date,
construction_begin_date,
[percent],
assess_yr_requalify,
imprv_det_assoc,
imprv_assoc,
comments,
final_value_date,
complete,
expired,
override

from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_remodel with(tablockx) on
	imprv_remodel.[year] = cplpl.prop_val_yr and
	imprv_remodel.sup_num = cplpl.sup_num and
	imprv_remodel.prop_id = cplpl.prop_id

set @StartStep = getdate()  --logging capture start time

insert into imprv_sketch with(tablockx)
(
prop_id,
prop_val_yr,
imprv_id,
sup_num,
sale_id,
sketch
)
select
isn.prop_id,
@input_to_yr, --prop_val_yr
isn.imprv_id,
0, --sup_num
0, --sale_id
isn.sketch
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_sketch as isn with(tablockx) on
	isn.prop_val_yr = cplpl.prop_val_yr and
	isn.sup_num = cplpl.sup_num and
	isn.sale_id = 0 and
	isn.prop_id = cplpl.prop_id
join imprv  as i on  -- has fk reference to imprv table so match
    i.prop_val_yr = @input_to_yr
and i.sup_num = 0
and i.sale_id = 0
and i.sale_id = isn.sale_id
and i.prop_id = isn.prop_id
and i.imprv_id = isn.imprv_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_sketch End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

-- Begin Sketch Images
--	@input_from_yr 		numeric(4,0),
--	@input_to_yr   		numeric(4,0),
declare @image_id int
declare @ref_id int
declare @ref_type varchar(5)
declare @new_image_id int
declare @new_basedir varchar(4000)
declare	@new_subdir varchar(4000)
declare @new_name varchar(4000)
declare @new_path varchar(4000)
declare @old_path varchar(4000)
declare @copy_cmd varchar(4000)

-- list the images to copy, and get a new path for each
if object_id('tempdb..#pacs_image_copy') is not null
	drop table #pacs_image_copy

create table #pacs_image_copy
(
	image_id int,
	ref_id int,
	ref_type varchar(5),
	old_path varchar(4000) null,
	new_image_id int,
	new_path varchar(4000) null,
	new_name varchar(4000) null,

	constraint PK_pacs_image_copy primary key clustered (image_id, ref_id, ref_type)
)

declare image_copy_cursor cursor for
	select image_id, ref_id, ref_type, location
	from create_property_layer_prop_list as cplpl with(tablockx)
	join dbo.pacs_image pim with(nolock) on
		pim.ref_year = cplpl.prop_val_yr and
		pim.ref_id = cplpl.prop_id and
		pim.ref_id2 = cplpl.sup_num and
		pim.ref_id3 = 0 and -- sale_id
		pim.ref_type = 'SKTCH'
for read only

open image_copy_cursor
fetch next from image_copy_cursor into @image_id, @ref_id, @ref_type, @old_path

set @LogTotRows = 0

while @@fetch_status = 0
begin
	exec GetNextImageIDOutput @new_subdir output, @new_image_id output, @new_basedir output

	set @new_name = convert(varchar(50), @new_image_id) + '.jpg'
	set @new_path = @new_basedir + '\' + @new_subdir + '\' + @new_name
	set @LogTotRows = @LogTotRows + 1

	insert #pacs_image_copy
	(image_id, ref_id, ref_type, old_path, new_image_id, new_path, new_name)
	select @image_id, @ref_id, @ref_type, @old_path, @new_image_id, @new_path, @new_name

	fetch next from image_copy_cursor into @image_id, @ref_id, @ref_type, @old_path
end

close image_copy_cursor
deallocate image_copy_cursor

SET @LogErrCode = @@ERROR 
SET @LogStatus =  'generating destination file paths for copied sketch images End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time


-- copy the [pacs_image] records
insert into pacs_image with(tablockx) (
	image_id, image_type, location, image_nm, 
	scan_dt, expiration_dt, sub_type, rec_type, eff_yr, status_cd, status_dt,
	comment, image_dt, chg_reason, pacs_user_id, status_user_id,
	ref_id, ref_type, ref_year, expiry_dt_override, role_attribute_id,
	ref_id1, ref_id2, ref_id3
)
select
	pic.new_image_id, pi.image_type, pic.new_path, pic.new_name,
	pi.scan_dt, pi.expiration_dt, pi.sub_type, pi.rec_type, pi.eff_yr, pi.status_cd, pi.status_dt,
	pi.comment, pi.image_dt, pi.chg_reason, pi.pacs_user_id, pi.status_user_id,
	pi.ref_id, pi.ref_type, @input_to_yr, pi.expiry_dt_override, pi.role_attribute_id,
	pi.ref_id1, 0, 0

from #pacs_image_copy pic

join pacs_image pi
on pic.image_id = pi.image_id
and pic.ref_id = pi.ref_id
and pic.ref_type = pi.ref_type
	 
SET @LogErrCode = @@ERROR 
SET @LogStatus =  'insert into pacs_image End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time


-- copy the image files
declare image_file_copy_cursor cursor for
select old_path, new_path
from #pacs_image_copy
for read only

open image_file_copy_cursor
fetch next from image_file_copy_cursor into @old_path, @new_path

while @@fetch_status = 0
begin
	set @copy_cmd = 'copy "' + @old_path + '" "' + @new_path + '"'
	exec xp_cmdshell @copy_cmd, no_output

	fetch next from image_file_copy_cursor into @old_path, @new_path
end

close image_file_copy_cursor
deallocate image_file_copy_cursor

drop table #pacs_image_copy

-- End Sketch Images

SET @LogErrCode = @@ERROR 
SET @LogStatus =  'copy sketch image files End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--imprv_sketch_note
-- rgoolsby: no new columns for 9.0
insert into imprv_sketch_note with(tablockx)
(
	prop_id,
	prop_val_yr,
	imprv_id,
	sup_num,
	sale_id,
	seq_num,
	NoteType,
	xLocation, 
	yLocation, 
	NoteText, 
	xLine, 
	yLine, 
	NoteLineType, 
	NoteBorderType, 
	NoteFontSize, 
	NoteJustification, 
	NoteColor
)
select
	isn.prop_id,
	@input_to_yr, --prop_val_yr
	isn.imprv_id,
	0, --sup_num
	0, --sale_id
	isn.seq_num,
	isn.NoteType,
	isn.xLocation, 
	isn.yLocation, 
	isn.NoteText, 
	isn.xLine, 
	isn.yLine, 
	isn.NoteLineType, 
	isn.NoteBorderType, 
	isn.NoteFontSize, 
	isn.NoteJustification, 
	isn.NoteColor
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_sketch_note as isn with(tablockx) on
	isn.prop_val_yr = cplpl.prop_val_yr and
	isn.sup_num = cplpl.sup_num and
	isn.sale_id = 0 and
	isn.prop_id = cplpl.prop_id
--order by isn.prop_id asc, isn.imprv_id asc, isn.seq_num asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_sketch_note End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

--imprv_adj             
insert into imprv_adj with(tablockx)
(
	prop_id,
	prop_val_yr,
	imprv_id,
	imprv_adj_seq,
	sale_id,
	sup_num,
	imprv_adj_type_cd,
	imprv_adj_desc,
	imprv_adj_pc,
	imprv_adj_amt,
-- following added for 9.0
	year_added,
	imprv_adj_method
)
select 
	imprv_adj.prop_id,
	@input_to_yr, --prop_val_yr
	imprv_adj.imprv_id,
	imprv_adj.imprv_adj_seq,
	0, --sale_id
	0, --sup_num
	imprv_adj.imprv_adj_type_cd,
	imprv_adj.imprv_adj_desc,
	imprv_adj.imprv_adj_pc,
	imprv_adj.imprv_adj_amt,
-- following added for 9.0
	imprv_adj.year_added,
	imprv_adj.imprv_adj_method
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_adj with(tablockx) on
	imprv_adj.prop_val_yr = cplpl.prop_val_yr and
	imprv_adj.sup_num = cplpl.sup_num and
	imprv_adj.sale_id = 0 and
	imprv_adj.prop_id = cplpl.prop_id
--order by imprv_adj.prop_id asc, imprv_adj.imprv_id asc, imprv_adj.imprv_adj_seq asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_adj End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--imprv_det_adj
--rgoolsby: now new columns for 9.0
insert into imprv_det_adj with(tablockx)
(
	prop_id,
	prop_val_yr,
	imprv_id,
	imprv_det_id,
	imprv_det_adj_seq,
	sup_num,
	sale_id,
	imprv_adj_type_cd,
	imprv_det_adj_cd,
	imprv_det_adj_desc,
	imprv_det_adj_pc,
	imprv_det_adj_amt,
	sys_flag,
	imprv_det_adj_lid_year_added,
	imprv_det_adj_lid_orig_value,
	imprv_det_adj_lid_econ_life,
	imprv_det_adj_lid_residual_pct,
	imprv_det_adj_method
)
select 
	ida.prop_id,     
	@input_to_yr, --prop_val_yr
	ida.imprv_id,    
	ida.imprv_det_id, 
	ida.imprv_det_adj_seq, 
	0, --sup_num
	0, --sale_id
	ida.imprv_adj_type_cd, 
	ida.imprv_det_adj_cd, 
	ida.imprv_det_adj_desc,                                 
	ida.imprv_det_adj_pc, 
	ida.imprv_det_adj_amt, 
	ida.sys_flag,
	ida.imprv_det_adj_lid_year_added,
	ida.imprv_det_adj_lid_orig_value,
	ida.imprv_det_adj_lid_econ_life,
	ida.imprv_det_adj_lid_residual_pct,
	ida.imprv_det_adj_method
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_det_adj as ida with(tablockx) on
	ida.prop_val_yr = cplpl.prop_val_yr and
	ida.sup_num = cplpl.sup_num and
	ida.sale_id = 0 and
	ida.prop_id = cplpl.prop_id
--order by ida.prop_id asc, ida.imprv_id asc, ida.imprv_det_id asc, ida.imprv_det_adj_seq asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_det_adj End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--imprv_attr
--rgoolsby: no new columns for 9.0
insert into imprv_attr with(tablockx)
(
	imprv_id,
	prop_id,
	imprv_det_id,
	imprv_attr_id,
	prop_val_yr,
	sup_num,
	sale_id,
	i_attr_val_id,
	i_attr_val_cd,
	imprv_attr_val,
	i_attr_unit,
	i_attr_up,
	i_attr_factor
)   
select 
	ia.imprv_id,
	ia.prop_id,
	ia.imprv_det_id,
	ia.imprv_attr_id,
	@input_to_yr, --prop_val_yr
	0, --sup_num
	0, --sale_id
	ia.i_attr_val_id,
	ia.i_attr_val_cd,
	ia.imprv_attr_val,
	ia.i_attr_unit,
	ia.i_attr_up,
	ia.i_attr_factor
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_attr as ia with(tablockx) on
	ia.prop_val_yr = cplpl.prop_val_yr and
	ia.sup_num = cplpl.sup_num and
	ia.sale_id = 0 and
	ia.prop_id = cplpl.prop_id
--order by ia.prop_id asc, ia.imprv_id asc, ia.imprv_det_id asc, ia.imprv_attr_id asc, ia.i_attr_val_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_attr End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- imprv_entity_assoc
--rgoolsby: no new columns for 9.0
insert into imprv_entity_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	imprv_id,
	sale_id,
	entity_id,
	entity_pct
)
select
	ea.prop_id,
	0,
	@input_to_yr, --prop_val_yr
	ea.imprv_id,
	0, --sale_id
	ea.entity_id,
	ea.entity_pct
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_entity_assoc as ea with(tablockx) on
	ea.prop_val_yr = cplpl.prop_val_yr and
	ea.sup_num = cplpl.sup_num and
	ea.sale_id = 0 and
	ea.prop_id = cplpl.prop_id
--order by ea.prop_id asc, ea.imprv_id asc, ea.entity_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_entity_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- imprv_owner_assoc
--rgoolsby: no new columns for 9.0
insert into imprv_owner_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	imprv_id,
	sale_id,
	owner_id,
	owner_pct
)
select
	oa.prop_id,
	0,
	@input_to_yr,
	oa.imprv_id,
	0,
	oa.owner_id,
	oa.owner_pct
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_owner_assoc as oa with(tablockx) on
	oa.prop_val_yr = cplpl.prop_val_yr and
	oa.sup_num = cplpl.sup_num and
	oa.sale_id = 0 and
	oa.prop_id = cplpl.prop_id
--order by oa.prop_id asc, oa.imprv_id asc, oa.owner_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into imprv_owner_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- imprv_exemption_assoc
--rgoolsby: no new columns for 9.0
insert into imprv_exemption_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	imprv_id,
	sale_id,
	entity_id,
	exmpt_type_cd,
	owner_id,
	amount,
	exempt_pct,
	value_type,
	calc_amount
)
select
	ea.prop_id,
	0,
	@input_to_yr, --prop_val_yr
	ea.imprv_id,
	0, --sale_id
	ea.entity_id,
	ea.exmpt_type_cd,
	ea.owner_id,
	ea.amount,
	ea.exempt_pct,
	ea.value_type,
	ea.calc_amount
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_exemption_assoc as ea with(tablockx) on
	ea.prop_val_yr = cplpl.prop_val_yr and
	ea.sup_num = cplpl.sup_num and
	ea.sale_id = 0 and
	ea.prop_id = cplpl.prop_id
--order by ea.prop_id asc, ea.imprv_id asc, ea.owner_id asc, ea.entity_id asc, ea.exmpt_type_cd asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into insert into imprv_exemption_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--land_detail
insert into land_detail with(tablockx)
(
	prop_id,
	prop_val_yr,
	land_seg_id,
	sup_num,
	sale_id,
	ls_mkt_id,
	ls_ag_id,
	land_type_cd,
	ag_land_type_cd,
	land_seg_desc,
	land_seg_sl_lock,
	state_cd,
	land_seg_homesite,
	size_acres,
	size_square_feet,
	effective_front,
	effective_depth,
	mkt_unit_price,
	land_seg_mkt_val,
	mkt_calc_val,
	mkt_adj_val,
	mkt_flat_val,
	ag_loss,
	mkt_val_source,
	ag_use_cd,
	ag_unit_price,
	ag_apply,
	ag_val,
	ag_calc_val,
	ag_adj_val,
	ag_flat_val,
	ag_val_type,
	ag_timb_conv_dt,
	ag_val_source,
	ag_eff_tax_year,
	land_seg_comment,
	ag_apply_yr,
	land_seg_orig_val,
	land_seg_up,
	land_adj_type_cd,
	width_front,
	width_back,
	depth_right,
	depth_left,
	eff_size_acres,
	land_adj_amt,
	land_adj_factor,
	land_mass_adj_factor,
	effective_tax_year,
	land_new_val,
	late_ag_apply,
	ref_id1,
	oa_mkt_val,
	oa_ag_val,
	eff_size_acres_override,
	num_lots,
	new_ag,
	new_ag_prev_val,
	new_ag_prev_val_override,
	appraisal_cd,
	arb_val,
	size_useable_acres,           
	size_useable_square_feet,
	dist_val,
	land_class_code,
	land_influence_code,
	timber_78_val,
	timber_78_val_pct,
	land_soil_code,
	prev_st_land_type_cd,
	hs_pct,
	hs_pct_override,
-- following added for 9.0
    flat_value_comment,
    flat_value_user_id,
    flat_value_dt,
    misc_value,
    new_construction_flag,
    new_construction_value,
    new_construction_value_override,
    last_import_date,
    last_import_user_id,
    assessment_yr_qualified,
    current_use_effective_acres,
    primary_use_cd,
    primary_use_override,
    sub_use_cd,
    use_type_schedule,
    type_schedule,
    application_number,
    recording_number,
    recalc_error_validate_flag,
    recalc_error_validate_date,
    recalc_error_validate_user_id,
    waterfront_footage,
    ag_pbrs_pct
)
select
	land_detail.prop_id,
	@input_to_yr, --prop_val_yr
	land_detail.land_seg_id,
	0, --sup_num
	0, --sale_id
	land_detail.ls_mkt_id,
	land_detail.ls_ag_id,
	land_detail.land_type_cd,
	land_detail.ag_land_type_cd,
	land_detail.land_seg_desc,
	land_detail.land_seg_sl_lock,
	land_detail.state_cd,
	land_detail.land_seg_homesite,
	land_detail.size_acres,
	land_detail.size_square_feet,
	land_detail.effective_front,
	land_detail.effective_depth,
	land_detail.mkt_unit_price,
	land_detail.land_seg_mkt_val,
	land_detail.mkt_calc_val,
	land_detail.mkt_adj_val,
	case when land_detail.mkt_val_source <> 'F' then 0 else land_detail.mkt_flat_val end, --mkt_flat_val
	land_detail.ag_loss,
	land_detail.mkt_val_source,
	land_detail.ag_use_cd,
	land_detail.ag_unit_price,
	land_detail.ag_apply,
	land_detail.ag_val,
	land_detail.ag_calc_val,
	land_detail.ag_adj_val,
	case when land_detail.ag_val_source <> 'F' then 0 else land_detail.ag_flat_val end, --ag_flat_val
	land_detail.ag_val_type,
	land_detail.ag_timb_conv_dt,
	land_detail.ag_val_source,
	land_detail.ag_eff_tax_year,
	land_detail.land_seg_comment,
	land_detail.ag_apply_yr,
	land_detail.land_seg_orig_val,
	land_detail.land_seg_up,
	land_detail.land_adj_type_cd,
	land_detail.width_front,
	land_detail.width_back,
	land_detail.depth_right,
	land_detail.depth_left,
	land_detail.eff_size_acres,
	land_detail.land_adj_amt,
	land_detail.land_adj_factor,
	land_detail.land_mass_adj_factor,
	null, --effective_tax_year
	0, --land_new_val
	'F', --late_ag_apply
	land_detail.ref_id1,
	land_detail.oa_mkt_val,
	land_detail.oa_ag_val,
	land_detail.eff_size_acres_override,
	land_detail.num_lots,
	'F', -- new_ag
	0,   -- new_ag_prev_val,
	'F', -- new_ag_prev_val_override,
	land_detail.appraisal_cd,
	land_detail.arb_val,
	land_detail.size_useable_acres,
	land_detail.size_useable_square_feet,
	land_detail.dist_val,
	land_detail.land_class_code,
	land_detail.land_influence_code,
	land_detail.timber_78_val,
	land_detail.timber_78_val_pct,
	land_detail.land_soil_code,
	land_detail.prev_st_land_type_cd,
	land_detail.hs_pct,
	land_detail.hs_pct_override,
-- following added for 9.0
    flat_value_comment,
    flat_value_user_id,
    flat_value_dt,
    misc_value,
    0, -- new_construction_flag,
    0, -- new_construction_value,
    0, -- new_construction_value_override,
    last_import_date,
    last_import_user_id,
    assessment_yr_qualified,
    current_use_effective_acres,
    primary_use_cd,
    primary_use_override,
    sub_use_cd,
    use_type_schedule,
    type_schedule,
    application_number,
    recording_number,
    recalc_error_validate_flag,
    recalc_error_validate_date,
    recalc_error_validate_user_id,
    land_detail.waterfront_footage,
    land_detail.ag_pbrs_pct
from create_property_layer_prop_list as cplpl with(tablockx)
join land_detail with(tablockx) on
	land_detail.prop_val_yr = cplpl.prop_val_yr and
	land_detail.sup_num = cplpl.sup_num and
	land_detail.sale_id = 0 and
	land_detail.prop_id = cplpl.prop_id
--order by land_detail.prop_id asc, land_detail.land_seg_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into land_detail End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--land_adj
--rgoolsby: no new columns for 9.0
insert into land_adj with(tablockx)
(
	prop_id,
	prop_val_yr,
	land_seg_id,
	land_seg_adj_seq,
	sup_num,
	sale_id,
	land_value,
	land_seg_adj_dt,
	land_seg_adj_type,
	land_seg_adj_desc,
	land_seg_adj_cd,
	land_seg_adj_pc,
	land_seg_adj_method
)
select
	land_adj.prop_id,
	@input_to_yr, --prop_val_yr
	land_adj.land_seg_id,
	land_adj.land_seg_adj_seq,
	0, --sup_num
	0, --sale_id
	land_adj.land_value,
	land_adj.land_seg_adj_dt,
	land_adj.land_seg_adj_type,
	land_adj.land_seg_adj_desc,
	land_adj.land_seg_adj_cd,
	land_adj.land_seg_adj_pc,
	land_adj.land_seg_adj_method
from create_property_layer_prop_list as cplpl with(tablockx)
join land_adj with(tablockx) on
	land_adj.prop_val_yr = cplpl.prop_val_yr and
	land_adj.sup_num = cplpl.sup_num and
	land_adj.sale_id = 0 and
	land_adj.prop_id = cplpl.prop_id
--order by land_adj.prop_id asc, land_adj.land_seg_id asc, land_adj.land_seg_adj_seq asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into land_adj End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- land_entity_assoc
--rgoolsby: no new columns for 9.0
insert into land_entity_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	land_seg_id,
	sale_id,
	entity_id,
	entity_pct
)
select
	ea.prop_id,
	0,
	@input_to_yr, --prop_val_yr
	ea.land_seg_id,
	0, --sale_id
	ea.entity_id,
	ea.entity_pct
from create_property_layer_prop_list as cplpl with(tablockx)
join land_entity_assoc as ea with(tablockx) on
	ea.prop_val_yr = cplpl.prop_val_yr and
	ea.sup_num = cplpl.sup_num and
	ea.sale_id = 0 and
	ea.prop_id = cplpl.prop_id
--order by ea.prop_id asc, ea.land_seg_id asc, ea.entity_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into land_entity_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

-- land_owner_assoc
--rgoolsby: no new columns for 9.0
insert into land_owner_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	land_seg_id,
	sale_id,
	owner_id,
	owner_pct
)
select
	oa.prop_id,
	0,
	@input_to_yr,
	oa.land_seg_id,
	0,
	oa.owner_id,
	oa.owner_pct
from create_property_layer_prop_list as cplpl with(tablockx)
join land_owner_assoc as oa with(tablockx) on
	oa.prop_val_yr = cplpl.prop_val_yr and
	oa.sup_num = cplpl.sup_num and
	oa.sale_id = 0 and
	oa.prop_id = cplpl.prop_id
--order by oa.prop_id asc, oa.land_seg_id asc, oa.owner_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into land_owner_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- land_exemption_assoc
--rgoolsby: no new columns for 9.0
insert into land_exemption_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	land_seg_id,
	sale_id,
	entity_id,
	exmpt_type_cd,
	owner_id,
	amount,
	exempt_pct,
	value_type,
	calc_amount
)
select
	ea.prop_id,
	0,
	@input_to_yr, --prop_val_yr
	ea.land_seg_id,
	0, --sale_id
	ea.entity_id,
	ea.exmpt_type_cd,
	ea.owner_id,
	ea.amount,
	ea.exempt_pct,
	ea.value_type,
	ea.calc_amount
from create_property_layer_prop_list as cplpl with(tablockx)
join land_exemption_assoc as ea with(tablockx) on
	ea.prop_val_yr = cplpl.prop_val_yr and
	ea.sup_num = cplpl.sup_num and
	ea.sale_id = 0 and
	ea.prop_id = cplpl.prop_id
--order by ea.prop_id asc, ea.land_seg_id asc, ea.owner_id asc, ea.entity_id asc, ea.exmpt_type_cd asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into land_exemption_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--pers_prop_seg
insert into pers_prop_seg with(tablockx)
(
	prop_id,
	prop_val_yr,
	sup_num,
	pp_seg_id,
	sale_id,
	pp_sched_cd,
	pp_table_meth_cd,
	pp_type_cd,
	pp_class_cd,
	pp_density_cd,
	pp_adj_cd,
	pp_area,
	pp_unit_count,
	pp_yr_aquired,
	pp_dep_method,
	pp_pct_good,
	pp_orig_cost,
	pp_economic_pct,
	pp_physical_pct,
	pp_flat_val,
	pp_rendered_val,
	pp_prior_yr_val,
	pp_last_notice_val,
	pp_method_val,
	pp_appraised_val,
	pp_appraise_meth,
	pp_new_val,
	pp_new_val_yr,
	pp_mkt_val,
	pp_comment,
	pp_unit_price,
	pp_qual_cd,
	pp_description,
	pp_sic_cd,
	pp_mkt_val_cd,
	pp_state_cd,
	pp_deprec_type_cd,
	pp_deprec_deprec_cd,
	pp_deprec_override,
	pp_deprec_pct,
	pp_active_flag,
	pp_make,
	pp_model,
	pp_vin,
	pp_matching_status,
	pp_matching_dt,
	pp_year,
	pp_special_val,
	pp_subseg_val,
	sp_method,
	sp_per_unit_val,
	sp_per_area_val,
	sp_units_area_number,
	arb_val,
	dist_val,
	pp_license,
	pp_condition_cd,
	pp_new_val_override,
	pp_new_val_yr_override,
	pp_new_segment,
-- following added for 9.0
	farm_asset
) 
select 
	pers_prop_seg.prop_id,
	@input_to_yr, --prop_val_yr
	0, --sup_num
	pp_seg_id,
	0, --sale_id
	pp_sched_cd,
	pp_table_meth_cd,
	pp_type_cd,
	pp_class_cd,
	pp_density_cd,
	pp_adj_cd,
	pp_area,
	pp_unit_count,
	pp_yr_aquired,
	pp_dep_method,
	pp_pct_good,
	pp_orig_cost,
	pp_economic_pct,
	pp_physical_pct,

	--pp_flat_val
	case
		when (@input_bpp_rendered_to_flat = 1 and pp_appraise_meth = 'R')
		then pp_rendered_val
		else
			case when pp_appraise_meth <> 'F' then 0 else pp_flat_val end
	end,

	0, --pp_rendered_val
	pp_appraised_val, --pp_prior_yr_val
	pp_last_notice_val,
	pp_method_val,
	pp_appraised_val,

	--pp_appraise_meth
	case
		when (@input_bpp_rendered_to_flat = 1 and pp_appraise_meth = 'R')
		then 'F'
		else
			case when pp_appraise_meth = 'R' then 'A' else pp_appraise_meth end
	end,

	case when pers_prop_seg.prop_val_yr = 0 then pp_new_val			else 0 end,	-- pp_new_val:			use 0 unless copying from future year (0)
	null,		-- pp_new_val_yr is obsolete
	pp_mkt_val,
	pp_comment,
	pp_unit_price,
	pp_qual_cd,
	pp_description,
	pp_sic_cd,
	pp_mkt_val_cd,
	pp_state_cd,
	pp_deprec_type_cd,
	pp_deprec_deprec_cd,
	pp_deprec_override,
	pp_deprec_pct,
	pp_active_flag,
	pp_make,
	pp_model,
	pp_vin,
	pp_matching_status,
	pp_matching_dt,
	pp_year,
	pp_special_val,
	pp_subseg_val,
	sp_method,
	sp_per_unit_val,
	sp_per_area_val,
	sp_units_area_number,
	arb_val,
	dist_val,
	pp_license,
	pp_condition_cd,
	case when pers_prop_seg.prop_val_yr = 0 then pp_new_val_override	else 0 end,	-- pp_new_val_override:		use 0 unless copying from future year (0)
	0,											-- pp_new_val_yr_override:	always use 0 (this column is now obsolete)
	case when pers_prop_seg.prop_val_yr = 0 then pp_new_segment		else 0 end,	-- pp_new_segment:		use 0 unless copying from future year (0)
-- following added for 9.0
	farm_asset
from create_property_layer_prop_list as cplpl with(tablockx)
join pers_prop_seg with(tablockx) on
	pers_prop_seg.prop_val_yr = cplpl.prop_val_yr and
	pers_prop_seg.sup_num = cplpl.sup_num and
	pers_prop_seg.prop_id = cplpl.prop_id

	and pers_prop_seg.sale_id = 0
--order by pers_prop_seg.prop_id asc, pers_prop_seg.pp_seg_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into pers_prop_seg End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--pers_prop_sub_seg
--rgoolsby: no new columns in 9.0
insert into pers_prop_sub_seg with(tablockx)
(
	prop_id			 ,		
	prop_val_yr		 ,		
	sup_num			 ,		
	pp_seg_id		 ,		
	pp_sub_seg_id	 ,		
	descrip			 ,		
	pp_orig_cost	 ,		
	pp_yr_aquired	 ,		
	pp_new_used		 ,		
	pp_type_cd		 ,		
	pp_dep_pct		 ,		
	pp_pct_good		 ,		
	pp_economic_pct	 ,		
	pp_physical_pct	 ,		
	pp_flat_val		 ,		
	pp_rendered_val	 ,		
	pp_mkt_val		 ,		
	calc_method_flag ,		
	pp_sic_cd		 ,		
	pp_sic_desc		 ,		
	pp_dep_type_cd	 ,		
	pp_dep_deprec_cd ,
	pp_veh_year,
	pp_veh_make,
	pp_veh_model,
	pp_veh_vin,
	pp_veh_license,
	asset_id
) 
select
	ppss.prop_id,
	@input_to_yr, --prop_val_yr
	0,
	ppss.pp_seg_id		 ,		
	ppss.pp_sub_seg_id	 ,		
	ppss.descrip			 ,		
	ppss.pp_orig_cost	 ,		
	ppss.pp_yr_aquired	 ,		
	ppss.pp_new_used		 ,		
	ppss.pp_type_cd		 ,		
	ppss.pp_dep_pct		 ,		
	ppss.pp_pct_good		 ,		
	ppss.pp_economic_pct	 ,		
	ppss.pp_physical_pct	 ,		
	ppss.pp_flat_val		 ,		
	ppss.pp_rendered_val	 ,		
	ppss.pp_mkt_val		 ,		
	ppss.calc_method_flag ,		
	ppss.pp_sic_cd		 ,		
	ppss.pp_sic_desc		 ,		
	ppss.pp_dep_type_cd	 ,		
	ppss.pp_dep_deprec_cd ,
	ppss.pp_veh_year,
	ppss.pp_veh_make,
	ppss.pp_veh_model,
	ppss.pp_veh_vin,
	ppss.pp_veh_license,
	asset_id
from create_property_layer_prop_list as cplpl with(tablockx)
join pers_prop_sub_seg as ppss with(tablockx) on
	ppss.prop_val_yr = cplpl.prop_val_yr and
	ppss.sup_num = cplpl.sup_num and
	ppss.prop_id = cplpl.prop_id
--order by ppss.prop_id asc, ppss.pp_seg_id asc, ppss.pp_sub_seg_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into pers_prop_sub_seg End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--pp_seg_sched_assoc
--rgoolsby: no new columns in 9.0
insert into pp_seg_sched_assoc with(tablockx)
(
	prop_id,
	pp_seg_id,
	prop_val_yr,
	sup_num, 	sale_id,
	pp_sched_id,
	value_method,
	table_code,
	segment_type,
	active_flag,
	unit_price,
	flat_price_flag
) 
select
	pp_seg_sched_assoc.prop_id,
	pp_seg_sched_assoc.pp_seg_id,
	@input_to_yr, --prop_val_yr
	0, --sup_num
	0, --sale_id
	pp_seg_sched_assoc.pp_sched_id,
	pp_seg_sched_assoc.value_method,
	pp_seg_sched_assoc.table_code,
	pp_seg_sched_assoc.segment_type,
	pp_seg_sched_assoc.active_flag,
	pp_seg_sched_assoc.unit_price,
	pp_seg_sched_assoc.flat_price_flag
from create_property_layer_prop_list as cplpl with(tablockx)
join pp_seg_sched_assoc with(tablockx) on
	pp_seg_sched_assoc.prop_val_yr = cplpl.prop_val_yr and
	pp_seg_sched_assoc.sup_num = cplpl.sup_num and
	pp_seg_sched_assoc.sale_id = 0 and
	pp_seg_sched_assoc.prop_id = cplpl.prop_id
--order by pp_seg_sched_assoc.prop_id asc, pp_seg_sched_assoc.pp_seg_id asc, pp_seg_sched_assoc.pp_sched_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into pp_seg_sched_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- pers_prop_entity_assoc
--rgoolsby: no new columns in 9.0
insert into pers_prop_entity_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	pp_seg_id,
	sale_id,
	entity_id,
	entity_pct
)
select
	ea.prop_id,
	0,
	@input_to_yr, --prop_val_yr
	ea.pp_seg_id,
	0, --sale_id
	ea.entity_id,
	ea.entity_pct
from create_property_layer_prop_list as cplpl with(tablockx)
join pers_prop_entity_assoc as ea with(tablockx) on
	ea.prop_val_yr = cplpl.prop_val_yr and
	ea.sup_num = cplpl.sup_num and
	ea.sale_id = 0 and
	ea.prop_id = cplpl.prop_id
--order by ea.prop_id, ea.pp_seg_id, ea.entity_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into pers_prop_entity_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- pers_prop_owner_assoc
--rgoolsby: no new columns in 9.0
insert into pers_prop_owner_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	pp_seg_id,
	sale_id,
	owner_id,
	owner_pct
)
select
	oa.prop_id,
	0,
	@input_to_yr,
	oa.pp_seg_id,
	0,
	oa.owner_id,
	oa.owner_pct
from create_property_layer_prop_list as cplpl with(tablockx)
join pers_prop_owner_assoc as oa with(tablockx) on
	oa.prop_val_yr = cplpl.prop_val_yr and
	oa.sup_num = cplpl.sup_num and
	oa.sale_id = 0 and
	oa.prop_id = cplpl.prop_id
--order by oa.prop_id asc, oa.pp_seg_id asc, oa.owner_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into pers_prop_owner_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- pers_prop_exemption_assoc
--rgoolsby: no new columns in 9.0
insert into pers_prop_exemption_assoc with(tablockx)
(
	prop_id,
	sup_num,
	prop_val_yr,
	pp_seg_id,
	sale_id,
	entity_id,
	exmpt_type_cd,
	owner_id,
	amount,
	exempt_pct,
	value_type,
	calc_amount
)
select
	ea.prop_id,
	0,
	@input_to_yr, --prop_val_yr
	ea.pp_seg_id,
	0, --sale_id
	ea.entity_id,
	ea.exmpt_type_cd,
	ea.owner_id,
	ea.amount,
	ea.exempt_pct,
	ea.value_type,
	ea.calc_amount
from create_property_layer_prop_list as cplpl with(tablockx)
join pers_prop_exemption_assoc as ea with(tablockx) on
	ea.prop_val_yr = cplpl.prop_val_yr and
	ea.sup_num = cplpl.sup_num and
	ea.sale_id = 0 and
	ea.prop_id = cplpl.prop_id
--order by ea.prop_id asc, ea.pp_seg_id asc, ea.owner_id asc, ea.entity_id asc, ea.exmpt_type_cd asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into pers_prop_exemption_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- "Pseudo" disabling of triggers so that we don't update property_val.agent_update_dt
exec dbo.TriggerEnable 'agent_assoc', 0

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'exec dbo.TriggerEnable  agent_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--agent_assoc
--rgoolsby: no new columns in 9.0
insert into agent_assoc with(tablockx)
(
	owner_tax_yr,
	agent_id,
	arb_mailings,
	prop_id,
	ca_mailings,
	owner_id,
	expired_dt_tm,
	ent_mailings,
	appl_dt,
	eff_dt,
	exp_dt,
	agent_cmnt,
	purge_dt,
	auth_to_protest,
	auth_to_resolve,
	auth_confidential,
	auth_other
)
select
	@input_to_yr, --owner_tax_yr
	aa.agent_id,
	aa.arb_mailings,
	aa.prop_id,
	aa.ca_mailings,
	aa.owner_id,
	aa.expired_dt_tm,
	aa.ent_mailings,
	aa.appl_dt,
	aa.eff_dt,
	aa.exp_dt,
	aa.agent_cmnt,
	aa.purge_dt,
	aa.auth_to_protest,
	aa.auth_to_resolve,
	aa.auth_confidential,
	aa.auth_other
from create_property_layer_prop_list as cplpl with(tablockx)
join agent_assoc as aa with(tablockx) on
	aa.owner_tax_yr = cplpl.prop_val_yr and
	aa.prop_id = cplpl.prop_id
--order by aa.prop_id asc, aa.owner_id asc, aa.agent_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into agent_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- "Pseudo" enabling of triggers now that we're through
exec dbo.TriggerEnable 'agent_assoc', 1

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'exec dbo.TriggerEnable agent_assoc, 1 End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--shared_prop
--rgoolsby: no new columns in 9.0
insert into shared_prop with(tablockx)
(
	pacs_prop_id,
	shared_year,
	shared_cad_code,
	shared_prop_id,
	tape_run_dt,
	tape_load_dt,
	link_dt,
	deed_dt,
	situs_city,
	legal,
	map_id,
	prev_tax_unfrozen,
	owner_name,
	owner_addr,
	owner_state,
	owner_zip,
	ag_use,
	special_exmpt_entity_cd,
	situs_street_num,
	dv_exemption_amount,
	cad_name,
	exmpt,
	deed_volume,
	ref_id,
	prorated_qualify_dt,
	prorated_remove_dt,
	arb_hearing_dt,
	oa_qual_dt,
	owner_addr2,
	owner_city,
	prorated_exmpt_flg,
	productivity_code,
	oa_remove_dt,
	situs_zip,
	situs_state,
	prev_tax_due,
	special_exmpt_amt,
	arb_indicator,
	deed_page,
	special_exemption_cd,
	situs_street,
	dba_name,
	new_hs_value,
	owner_addr_line1,
	owner_addr_line2,
	owner_addr_line3,
	cad_sup_num,
	cad_sup_code,
	num_imprv_segs,
	imprv_ptd_code,
	imprv_class,
	num_land_segs,
	land_ptd_code,
	size_acres,
	mineral_ptd_code,
	personal_ptd_code,
	entities,
	freeze_transfer_flag,
	transfer_pct,
	imprv_hs_val,
	imprv_non_hs_val,
	land_hs,
	land_non_hs,
	shared_prop.ag_market,
	shared_prop.timber_use,
	shared_prop.timber_market,
	shared_prop.market,
	shared_prop.appraised_val,
	cad_ten_percent_cap,
	cad_assessed_val,
	arb_status,
	arb_dt,
	sales_dt,
	sales_price,
	appraiser,
	cad_sup_comment,
	exempt_prev_tax,
	exempt_prev_tax_unfrozen,
	ag_use_val,
	sup_num,
	multi_owner,
	imp_new_value,
	land_new_value,
	run_id,
	productivity_loss
)
select 
	sp.pacs_prop_id,
	@input_to_yr, --shared_year
	sp.shared_cad_code,
	sp.shared_prop_id,
	sp.tape_run_dt,
	sp.tape_load_dt,
	sp.link_dt,
	sp.deed_dt,
	sp.situs_city,
	sp.legal,
	sp.map_id,
	sp.prev_tax_unfrozen,
	sp.owner_name,
	sp.owner_addr,
	sp.owner_state,
	sp.owner_zip,
	sp.ag_use,
	sp.special_exmpt_entity_cd,
	sp.situs_street_num,
	sp.dv_exemption_amount,
	sp.cad_name,
	sp.exmpt,
	sp.deed_volume,
	sp.ref_id,
	sp.prorated_qualify_dt,
	sp.prorated_remove_dt,
	sp.arb_hearing_dt,
	sp.oa_qual_dt,
	sp.owner_addr2,
	sp.owner_city,
	sp.prorated_exmpt_flg,
	sp.productivity_code,
	sp.oa_remove_dt,
	sp.situs_zip,
	sp.situs_state,
	sp.prev_tax_due,
	sp.special_exmpt_amt,
	sp.arb_indicator,
	sp.deed_page,
	sp.special_exemption_cd,
	sp.situs_street,
	sp.dba_name,
	sp.new_hs_value,
	sp.owner_addr_line1,
	sp.owner_addr_line2,
	sp.owner_addr_line3,
	sp.cad_sup_num,
	sp.cad_sup_code,
	sp.num_imprv_segs,
	sp.imprv_ptd_code,
	sp.imprv_class,
	sp.num_land_segs,
	sp.land_ptd_code,
	sp.size_acres,
	sp.mineral_ptd_code,
	sp.personal_ptd_code,
	sp.entities,
	sp.freeze_transfer_flag,
	sp.transfer_pct,
	sp.imprv_hs_val,
	sp.imprv_non_hs_val,
	sp.land_hs,
	sp.land_non_hs,
	sp.ag_market,
	sp.timber_use,
	sp.timber_market,
	sp.market,
	sp.appraised_val,
	sp.cad_ten_percent_cap,
	sp.cad_assessed_val,
	sp.arb_status,
	sp.arb_dt,
	sp.sales_dt,
	sp.sales_price,
	sp.appraiser,
	sp.cad_sup_comment,
	sp.exempt_prev_tax,
	sp.exempt_prev_tax_unfrozen,
	sp.ag_use_val,
	0,
	sp.multi_owner,
	sp.imp_new_value,
	sp.land_new_value,
	sp.run_id,
	sp.productivity_loss
from create_property_layer_prop_list as cplpl with(tablockx)
join shared_prop as sp with(tablockx) on
	sp.shared_year = cplpl.prop_val_yr and
	sp.sup_num  = cplpl.sup_num and
	sp.pacs_prop_id = cplpl.prop_id
--order by sp.pacs_prop_id asc, sp.shared_cad_code asc, sp.shared_prop_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into shared_prop End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--shared_prop_value
--rgoolsby: no new columns in 9.0
insert into shared_prop_value with(tablockx)
(
	pacs_prop_id,
	shared_prop_id,
	shared_year,
	shared_cad_code,
	shared_value_id,
	state_code,
	shared_value,
	acres,
	ag_use_code,
	record_type,
	land_type_code,
	homesite_flag,
	ag_use_value,
	sup_num
)
select 
	spv.pacs_prop_id,
	spv.shared_prop_id,
	@input_to_yr,
	spv.shared_cad_code,
	spv.shared_value_id,
	spv.state_code,
	spv.shared_value,
	spv.acres,
	spv.ag_use_code,
	spv.record_type,
	spv.land_type_code,
	spv.homesite_flag,
	spv.ag_use_value,
	0
from create_property_layer_prop_list as cplpl with(tablockx)
join shared_prop_value as spv with(tablockx) on
	spv.shared_year = cplpl.prop_val_yr and
	spv.sup_num = cplpl.sup_num and
	spv.pacs_prop_id = cplpl.prop_id
--order by spv.pacs_prop_id asc, spv.shared_cad_code asc, spv.shared_prop_id asc, spv.shared_value_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert into shared_prop_value End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--Get rid of all exemptions that are prorated with a date less than Jan 1 of the new year...
declare @prorate_delete_dt datetime

set @prorate_delete_dt = cast((cast(@input_to_yr as varchar(4)) + '-01-01 00:00:00.000') as datetime)

delete property_exemption_income_detail from property_exemption_income_detail peid
join property_exemption_income as pei with(tablockx) on
	pei.exmpt_tax_yr = peid.exmpt_tax_yr and
	pei.owner_tax_yr = peid.owner_tax_yr and
	pei.sup_num = peid.sup_num and
	pei.prop_id = peid.prop_id and
	pei.owner_id = peid.owner_id and
	pei.exmpt_type_cd = peid.exmpt_type_cd and
	pei.inc_id = peid.inc_id
join property_exemption as pe with(tablockx) on
	pe.exmpt_tax_yr = pei.exmpt_tax_yr and
	pe.owner_tax_yr = pei.owner_tax_yr and
	pe.sup_num = pei.sup_num and
	pe.prop_id = pei.prop_id and
	pe.owner_id = pei.owner_id and 
	pe.exmpt_type_cd = pei.exmpt_type_cd
where pe.exmpt_tax_yr = @input_to_yr and
pe.owner_tax_yr = @input_to_yr and 
pe.termination_dt < @prorate_delete_dt

delete property_exemption from property_exemption_income pei
join property_exemption as pe with(tablockx) on
	pe.exmpt_tax_yr = pei.exmpt_tax_yr and
	pe.owner_tax_yr = pei.owner_tax_yr and
	pe.sup_num = pei.sup_num and
	pe.prop_id = pei.prop_id and
	pe.owner_id = pei.owner_id and 
	pe.exmpt_type_cd = pei.exmpt_type_cd
where pe.exmpt_tax_yr = @input_to_yr and
pe.owner_tax_yr = @input_to_yr and 
pe.termination_dt < @prorate_delete_dt

delete property_exemption with(tablockx)
where exmpt_tax_yr = @input_to_yr
and owner_tax_yr   = @input_to_yr
--and termination_dt is not null /* James - removed, redundant since ansi_nulls is on and below expression exists */
and termination_dt < @prorate_delete_dt

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'delete property_exemption End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

/* copy income valuations */

--rgoolsby: no new columns in 9.0
insert into income with(tablockx)
(
	income_id,
	sup_num,
	income_yr,
	GBA,
	NRA,
	TAX,
	override_tax,
	override_gba,
	DC_LA,
	DC_VA,
	DC_BE,
	DC_OR,
	DC_VR,
	DC_LARate,
	DC_VARate,
	DC_LI,
	DC_VI,
	DC_GPI,
	DC_GPIVR,
	DC_GPIVI,
	DC_GPICLR,
	DC_GPICLI,
	DC_GPIRER,
	DC_GPIRE,
	DC_GPISIR,
	DC_GPISI,
	DC_EGI,
	DC_EXPOEI,
	DC_MGMTR,
	DC_MGMTI,
	DC_RRR,
	DC_RRI,
	DC_TIR,
	DC_TII,
	DC_LCR,
	DC_LCI,
	DC_EXP,
	DC_NOI,
	DC_CAPR,
	DC_CAPI,
	DC_PERS,
	DC_IND,
	DC_GPIRSF,
	DC_GPIVRSF,
	DC_GPICLRSF,
	DC_GPIRERSF,
	DC_GPISIRSF,
	DC_EGIRSF,
	DC_EGIPCTREV,
	DC_EXPOERSF,
	DC_EXPTAXRSF,
	DC_EXPMGMTRSF,
	DC_RRRSF,
	DC_EXPTIRSF,
	DC_EXPLCRSF,
	DC_EXPRSF,
	DC_EXPPCTREV,
	DC_NOIRSF,
	DC_NOIPCTREV,
	SCH_LA,
	SCH_VA,
	SCH_BE,
	SCH_OR,
	SCH_VR,
	SCH_LARate,
	SCH_VARate,
	SCH_LI,
	SCH_VI,
	SCH_GPI,
	SCH_GPIVR,
	SCH_GPIVI,
	SCH_GPICLR,
	SCH_GPICLI,
	SCH_GPIRER,
	SCH_GPIRE,
	SCH_GPISIR,
	SCH_GPISI,
	SCH_EGI,
	SCH_EXPOEI,
	SCH_MGMTR,
	SCH_MGMTI,
	SCH_RRR,
	SCH_RRI,
	SCH_TIR,
	SCH_TII,
	SCH_LCR,
	SCH_LCI,
	SCH_EXP,
	SCH_NOI,
	SCH_CAPR,
	SCH_CAPI,
	SCH_PERS,
	SCH_IND,
	SCH_GPIRSF,
	SCH_GPIVRSF,
	SCH_GPICLRSF,
	SCH_GPIRERSF,
	SCH_GPISIRSF,
	SCH_EGIRSF,
	SCH_EGIPCTREV,
	SCH_EXPOERSF,
	SCH_EXPTAXRSF,
	SCH_EXPMGMTRSF,
	SCH_RRRSF,
	SCH_EXPTIRSF,
	SCH_EXPLCRSF,
	SCH_EXPRSF,
	SCH_EXPPCTREV,
	SCH_NOIRSF,
	SCH_NOIPCTREV,
	PF_LA,
	PF_VA,
	PF_BE,
	PF_OR,
	PF_VR,
	PF_LARate,
	PF_VARate,
	PF_LI,
	PF_VI,
	PF_GPI,
	PF_GPIVR,
	PF_GPIVI,
	PF_GPICLR,
	PF_GPICLI,
	PF_GPIRER,
	PF_GPIRE,
	PF_GPISIR,
	PF_GPISI,
	PF_EGI,
	PF_EXPOEI,
	PF_MGMTR,
	PF_MGMTI,
	PF_RRR,
	PF_RRI,
	PF_TIR,
	PF_TII,
	PF_LCR,
	PF_LCI,
	PF_EXP,
	PF_NOI,
	PF_CAPR,
	PF_CAPI,
	PF_PERS,
	PF_IND,
	PF_GPIRSF,
	PF_GPIVRSF,
	PF_GPICLRSF,
	PF_GPIRERSF,
	PF_GPISIRSF,
	PF_EGIRSF,
	PF_EGIPCTREV,
	PF_EXPOERSF,
	PF_EXPTAXRSF,
	PF_EXPMGMTRSF,
	PF_RRRSF,
	PF_EXPTIRSF,
	PF_EXPLCRSF,
	PF_EXPRSF,
	PF_EXPPCTREV,
	PF_NOIRSF,
	PF_NOIPCTREV,
	flat_value,
	econ_area,
	prop_type_cd,
	class,
	level_cd,
	yr_blt,
	stories,
	prop_name,
	comment,
	value_method,
	income_value,
	lease_company,
	lease_contact,
	lease_address,
	lease_phone,
	lease_fax,
	lease_email,
	lease_survery_dt,
	recalc_flag,
	pf_input_ocr,
	pf_input_mgmtr,
	pf_input_exp_rsf,
	pf_input_si_rsf,
	pf_input_tir,
	pf_input_rrr,
	pf_input_capr,
	pf_input_lease_rsf,
	pf_date,
	DC_TAX,
	SCH_TAX,
	PF_TAX,
	override_dc_tax,
	override_sch_tax,
	override_pf_tax,
	land_ratio,
	land_ratio_typical,
	land_rsf,
	land_size,
	land_excess_value,
	lu_rent_loss_area,
	lu_rent_sf,
	lu_rent_num_year,
	lu_rent_total,
	lu_lease_pct,
	lu_lease_total,
	lu_tfo_sf,
	lu_tfo_total,
	lu_disc_rate,
	lu_num_year,
	lu_cost,
	dc_ind_rsf,
	sch_ind_rsf,
	pf_ind_rsf,
	dc_ocr_rsf,
	sch_ocr_rsf,
	pf_ocr_rsf,
	dc_ocr_runit,
	sch_ocr_runit,
	pf_ocr_runit,
	dc_ind_runit,
	sch_ind_runit,
	pf_ind_runit,
	num_units,
	override_num_units,
	lu_override_cost,
	pf_input_VARate,
	expense_structure_cd,
	lease_type_cd,
	rent_type_cd,
	pf_input_clr,
	pf_input_rer,
	pf_input_lcr,
	include_in_pf,
	DC_other_value,
	DC_other_value_comment,
	DC_base_indicated_value,
	SCH_other_value,
	SCH_other_value_comment,
	SCH_base_indicated_value,
	PF_other_value,
	PF_other_value_comment,
	PF_base_indicated_value,
	include_in_grm_gim,
	non_income_land_imps_value,
	non_income_land_value,
	non_income_imprv_value,
	other_land_value,
	schil_grid_static,
	schil_override_schedule_values,
	schil_method_value,
	schil_personal_property_value,
	schil_other_value,
	schil_other_value_comment,
	schil_base_indicated_value,
	schil_indicated_value,
	schil_indicated_land_value,
	schil_indicated_imprv_value,
	num_designated_units,
	gba_designated_units,
	DC_indicated_imprv_value,
	SCH_indicated_imprv_value,
	PF_indicated_imprv_value
)
select distinct
	income.income_id,
	0,
	@input_to_yr, 
	GBA,
	NRA,
	TAX,
	override_tax,
	override_gba,
	DC_LA,
	DC_VA,
	DC_BE,
	DC_OR,
	DC_VR,
	DC_LARate,
	DC_VARate,
	DC_LI,
	DC_VI,
	DC_GPI,
	DC_GPIVR,
	DC_GPIVI,
	DC_GPICLR,
	DC_GPICLI,
	DC_GPIRER,
	DC_GPIRE,
	DC_GPISIR,
	DC_GPISI,
	DC_EGI,
	DC_EXPOEI,
	DC_MGMTR,
	DC_MGMTI,
	DC_RRR,
	DC_RRI,
	DC_TIR,
	DC_TII,
	DC_LCR,
	DC_LCI,
	DC_EXP,
	DC_NOI,
	DC_CAPR,
	DC_CAPI,
	DC_PERS,
	DC_IND,
	DC_GPIRSF,
	DC_GPIVRSF,
	DC_GPICLRSF,
	DC_GPIRERSF,
	DC_GPISIRSF,
	DC_EGIRSF,
	DC_EGIPCTREV,
	DC_EXPOERSF,
	DC_EXPTAXRSF,
	DC_EXPMGMTRSF,
	DC_RRRSF,
	DC_EXPTIRSF,
	DC_EXPLCRSF,
	DC_EXPRSF,
	DC_EXPPCTREV,
	DC_NOIRSF,
	DC_NOIPCTREV,
	SCH_LA,
	SCH_VA,
	SCH_BE,
	SCH_OR,
	SCH_VR,
	SCH_LARate,
	SCH_VARate,
	SCH_LI,
	SCH_VI,
	SCH_GPI,
	SCH_GPIVR,
	SCH_GPIVI,
	SCH_GPICLR,
	SCH_GPICLI,
	SCH_GPIRER,
	SCH_GPIRE,
	SCH_GPISIR,
	SCH_GPISI,
	SCH_EGI,
	SCH_EXPOEI,
	SCH_MGMTR,
	SCH_MGMTI,
	SCH_RRR,
	SCH_RRI,
	SCH_TIR,
	SCH_TII,
	SCH_LCR,
	SCH_LCI,
	SCH_EXP,
	SCH_NOI,
	SCH_CAPR,
	SCH_CAPI,
	SCH_PERS,
	SCH_IND,
	SCH_GPIRSF,
	SCH_GPIVRSF,
	SCH_GPICLRSF,
	SCH_GPIRERSF,
	SCH_GPISIRSF,
	SCH_EGIRSF,
	SCH_EGIPCTREV,
	SCH_EXPOERSF,
	SCH_EXPTAXRSF,
	SCH_EXPMGMTRSF,
	SCH_RRRSF,
	SCH_EXPTIRSF,
	SCH_EXPLCRSF,
	SCH_EXPRSF,
	SCH_EXPPCTREV,
	SCH_NOIRSF,
	SCH_NOIPCTREV,
	PF_LA,
	PF_VA,
	PF_BE,
	PF_OR,
	PF_VR,
	PF_LARate,
	PF_VARate,
	PF_LI,
	PF_VI,
	PF_GPI,
	PF_GPIVR,
	PF_GPIVI,
	PF_GPICLR,
	PF_GPICLI,
	PF_GPIRER,
	PF_GPIRE,
	PF_GPISIR,
	PF_GPISI,
	PF_EGI,
	PF_EXPOEI,
	PF_MGMTR,
	PF_MGMTI,
	PF_RRR,
	PF_RRI,
	PF_TIR,
	PF_TII,
	PF_LCR,
	PF_LCI,
	PF_EXP,
	PF_NOI,
	PF_CAPR,
	PF_CAPI,
	PF_PERS,
	PF_IND,
	PF_GPIRSF,
	PF_GPIVRSF,
	PF_GPICLRSF,
	PF_GPIRERSF,
	PF_GPISIRSF,
	PF_EGIRSF,
	PF_EGIPCTREV,
	PF_EXPOERSF,
	PF_EXPTAXRSF,
	PF_EXPMGMTRSF,
	PF_RRRSF,
	PF_EXPTIRSF,
	PF_EXPLCRSF,
	PF_EXPRSF,
	PF_EXPPCTREV,
	PF_NOIRSF,
	PF_NOIPCTREV,
	flat_value,
	econ_area,
	prop_type_cd,
	class,
	level_cd,
	yr_blt,
	stories,
	prop_name,
	comment,
	value_method,
	income_value,
	lease_company,
	lease_contact,
	lease_address,
	lease_phone,
	lease_fax,
	lease_email,
	lease_survery_dt,
	recalc_flag,
	pf_input_ocr,
	pf_input_mgmtr,
	pf_input_exp_rsf,
	pf_input_si_rsf,
	pf_input_tir,
	pf_input_rrr,
	pf_input_capr,
	pf_input_lease_rsf,
	pf_date,
	DC_TAX,
	SCH_TAX,
	PF_TAX,
	override_dc_tax,
	override_sch_tax,
	override_pf_tax,
	land_ratio,
	land_ratio_typical,
	land_rsf,
	land_size,
	land_excess_value,
	lu_rent_loss_area,
	lu_rent_sf,
	lu_rent_num_year,
	lu_rent_total,
	lu_lease_pct,
	lu_lease_total,
	lu_tfo_sf,
	lu_tfo_total,
	lu_disc_rate,
	lu_num_year,
	lu_cost,
	dc_ind_rsf,
	sch_ind_rsf,
	pf_ind_rsf,
	dc_ocr_rsf,
	sch_ocr_rsf,
	pf_ocr_rsf,
	dc_ocr_runit,
	sch_ocr_runit,
	pf_ocr_runit,
	dc_ind_runit,
	sch_ind_runit,
	pf_ind_runit,
	num_units,
	override_num_units,
	lu_override_cost,
	pf_input_VARate,
	expense_structure_cd,
	lease_type_cd,
	rent_type_cd,
	pf_input_clr,
	pf_input_rer,
	pf_input_lcr,
	include_in_pf,
	DC_other_value,
	DC_other_value_comment,
	DC_base_indicated_value,
	SCH_other_value,
	SCH_other_value_comment,
	SCH_base_indicated_value,
	PF_other_value,
	PF_other_value_comment,
	PF_base_indicated_value,
	include_in_grm_gim,
	non_income_land_imps_value,
	non_income_land_value,
	non_income_imprv_value,
	other_land_value,
	schil_grid_static,
	schil_override_schedule_values,
	schil_method_value,
	schil_personal_property_value,
	schil_other_value,
	schil_other_value_comment,
	schil_base_indicated_value,
	schil_indicated_value,
	schil_indicated_land_value,
	schil_indicated_imprv_value,
	num_designated_units,
	gba_designated_units,
	DC_indicated_imprv_value,
	SCH_indicated_imprv_value,
	PF_indicated_imprv_value
from create_property_layer_income_list as cplil with(tablockx)
join income with(tablockx) on
	income.income_yr = cplil.prop_val_yr and
	income.sup_num = cplil.sup_num and
	income.income_id = cplil.income_id
--order by income.income_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
--rgoolsby: no new columns in 9.0
insert into income_prop_assoc with(tablockx)
(
	income_id,
	prop_id,
	sup_num,
	prop_val_yr,
	income_pct,
	income_value,
	active_valuation
)
select distinct
	ipa.income_id,
	ipa.prop_id,
	0,
	@input_to_yr,
	ipa.income_pct,
	ipa.income_value,
	ipa.active_valuation
from create_property_layer_prop_list as cplpl with(tablockx)
join income_prop_assoc as ipa with(tablockx) on
	ipa.prop_val_yr = cplpl.prop_val_yr and
	ipa.sup_num = cplpl.sup_num and
	ipa.prop_id = cplpl.prop_id
where
exists (
	select i.income_yr
	from income as i with(tablockx)
	where
		i.income_yr = @input_to_yr and
		i.sup_num = 0 and
		i.income_id = ipa.income_id
)
--order by ipa.income_id asc, ipa.prop_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income_prop_assoc End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
insert into income_grm_gim with(tablockx)
(
	income_yr,
	sup_num,
	income_id,
	sch_pgi_annual,
	sch_pgi_monthly,
	sch_gim,
	sch_grm,
	sch_indicated_value_gim,
	sch_indicated_value_grm,
	sch_personal_property_value,
	sch_other_value,
	sch_base_indicated_value,
	sch_indicated_value,
	pf_pgi_annual,
	pf_pgi_monthly,
	pf_gim,
	pf_grm,
	pf_indicated_value_gim,
	pf_indicated_value_grm,
	pf_personal_property_value,
	pf_other_value,
	pf_base_indicated_value,
	pf_indicated_value,
	dc_pgi_annual,
	dc_pgi_monthly,
	dc_gim,
	dc_grm,
	dc_indicated_value_gim,
	dc_indicated_value_grm,
	dc_personal_property_value,
	dc_other_value,
	dc_base_indicated_value,
	dc_indicated_value
)
select distinct
	@input_to_yr,
	0,
	igg.income_id,
	sch_pgi_annual,
	sch_pgi_monthly,
	sch_gim,
	sch_grm,
	sch_indicated_value_gim,
	sch_indicated_value_grm,
	sch_personal_property_value,
	sch_other_value,
	sch_base_indicated_value,
	sch_indicated_value,
	pf_pgi_annual,
	pf_pgi_monthly,
	pf_gim,
	pf_grm,
	pf_indicated_value_gim,
	pf_indicated_value_grm,
	pf_personal_property_value,
	pf_other_value,
	pf_base_indicated_value,
	pf_indicated_value,
	dc_pgi_annual,
	dc_pgi_monthly,
	dc_gim,
	dc_grm,
	dc_indicated_value_gim,
	dc_indicated_value_grm,
	dc_personal_property_value,
	dc_other_value,
	dc_base_indicated_value,
	dc_indicated_value
from create_property_layer_income_list as cplil with(tablockx)
join income_grm_gim as igg with(tablockx) on
	igg.income_yr = cplil.prop_val_yr and
	igg.sup_num = cplil.sup_num and
	igg.income_id = cplil.income_id


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income_grm_gim End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
insert into income_imprv_assoc with(tablockx)
(
	income_yr,
	sup_num,
	income_id,
	prop_id,
	imprv_id,
	included,
	[value]
)
select distinct
	@input_to_yr,
	0,
	iia.income_id,
	prop_id,
	imprv_id,
	included,
	[value]
from create_property_layer_income_list as cplil with(tablockx)
join income_imprv_assoc as iia with(tablockx) on
	iia.income_yr = cplil.prop_val_yr and
	iia.sup_num = cplil.sup_num and
	iia.income_id = cplil.income_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income_imprv_assoc End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

set identity_insert income_improvement_level_detail on

insert into income_improvement_level_detail with(tablockx)
(
	income_yr,
	sup_num,
	income_id,
	seq_num,
	prop_id,
	imprv_id,
	imprv_det_id,
	included,
	[override],
	copied,
	hood_cd,
	imprv_det_type_cd,
	imprv_det_meth_cd,
	floor_number,
	floor_number_override,
	primary_use_cd,
	lease_class,
	effective_year_built,
	gross_building_area,
	gross_building_area_override,
	load_factor,
	load_factor_override,
	net_rentable_area,
	net_rentable_area_override,
	daily_rent_rate,
	monthly_rent_rate,
	yearly_rent_rate,
	rent_rate_override,
	occupancy_pct,
	occupancy_pct_override,
	collection_loss,
	collection_loss_override,
	reimbursed_expenses,
	reimbursed_expenses_override,
	secondary_income,
	secondary_income_override,
	gross_potential_income,
	effective_gross_income,
	expense_ratio,
	expense_ratio_override,
	expense_per_sqft,
	expense_per_sqft_override,
	expense_overall,
	expense_overall_override,
	cap_rate,
	cap_rate_override,
	tax_rate,
	tax_rate_override,
	overall_rate,
	net_operating_income,
	value,
	imprv_desc,
	economic_area,
	economic_area_override,
	unit_count,
	unit_mix_code,
	unit_size,
	use_unit_count
)
select distinct
	@input_to_yr,
	0,
	iild.income_id,
	seq_num,
	prop_id,
	imprv_id,
	imprv_det_id,
	included,
	[override],
	copied,
	hood_cd,
	imprv_det_type_cd,
	imprv_det_meth_cd,
	floor_number,
	floor_number_override,
	primary_use_cd,
	lease_class,
	effective_year_built,
	gross_building_area,
	gross_building_area_override,
	load_factor,
	load_factor_override,
	net_rentable_area,
	net_rentable_area_override,
	daily_rent_rate,
	monthly_rent_rate,
	yearly_rent_rate,
	rent_rate_override,
	occupancy_pct,
	occupancy_pct_override,
	collection_loss,
	collection_loss_override,
	reimbursed_expenses,
	reimbursed_expenses_override,
	secondary_income,
	secondary_income_override,
	gross_potential_income,
	effective_gross_income,
	expense_ratio,
	expense_ratio_override,
	expense_per_sqft,
	expense_per_sqft_override,
	expense_overall,
	expense_overall_override,
	cap_rate,
	cap_rate_override,
	tax_rate,
	tax_rate_override,
	overall_rate,
	net_operating_income,
	value,
	imprv_desc,
	economic_area,
	economic_area_override,
	unit_count,
	unit_mix_code,
	unit_size,
	use_unit_count
from create_property_layer_income_list as cplil with(tablockx)
join income_improvement_level_detail as iild with(tablockx) on
	iild.income_yr = cplil.prop_val_yr and
	iild.sup_num = cplil.sup_num and
	iild.income_id = cplil.income_id

set identity_insert income_improvement_level_detail off

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income_improvement_level_detail End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
insert into income_land_detail_assoc with(tablockx)
(
	income_yr,
	sup_num,
	income_id,
	prop_id,
	land_seg_id,
	included,
	[value]
)
select distinct
	@input_to_yr,
	0,
	ilda.income_id,
	prop_id,
	land_seg_id,
	included,
	[value]
from create_property_layer_income_list as cplil with(tablockx)
join income_land_detail_assoc as ilda with(tablockx) on
	ilda.income_yr = cplil.prop_val_yr and
	ilda.sup_num = cplil.sup_num and
	ilda.income_id = cplil.income_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income_land_detail_assoc End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
insert into income_pf_criteria_assoc with(tablockx)
(
	income_id,
	sup_num,
	income_yr,
	criteria_id,
	active_valuations_only,
	grm_gim_flag
)
select distinct
	ipca.income_id,
	0,
	@input_to_yr,	
	criteria_id,
	active_valuations_only,
	grm_gim_flag
from create_property_layer_income_list as cplil with(tablockx)
join income_pf_criteria_assoc as ipca with(tablockx) on
	ipca.income_yr = cplil.prop_val_yr and
	ipca.sup_num = cplil.sup_num and
	ipca.income_id = cplil.income_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income_pf_criteria_assoc End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
insert into income_pro_forma_assoc with(tablockx)
(
	income_yr,
	sup_num,
	income_id,
	pf_income_id,
	pf_grm_gim_flag
)
select distinct
	@input_to_yr,
	0,
	ipfa.income_id,
	pf_income_id,
	pf_grm_gim_flag
from create_property_layer_income_list as cplil with(tablockx)
join income_pro_forma_assoc as ipfa with(tablockx) on
	ipfa.income_yr = cplil.prop_val_yr and
	ipfa.sup_num = cplil.sup_num and
	ipfa.income_id = cplil.income_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert income_pro_forma_assoc End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


set @StartStep = getdate()  --logging capture start time
--pp_rendition_tracking
--rgoolsby: no new columns in 9.0
insert into pp_rendition_tracking with(tablockx)
(
	prop_id,
	prop_val_yr,
	extension1,
	extension1_processed_dt,
	extension1_printed_dt,
	extension1_comment,
	extension2,
	extension2_processed_dt,
	extension2_printed_dt,
	extension2_comment,
	imposition_letter_dt,
	imposition_letter_receieved_dt,
	request_support_doc_comment,
	request_support_doc_dt,
	print_request_support_doc_dt,
	request_support_doc_rec_dt,
	penalty_waiver_status,
	penalty_waiver_status_dt,
	penalty_waiver_request_dt,
	penalty_waiver_print_dt,
	waiver_request_mandatory_dt,
	penalty_comment,
	penalty_amount,
	penalty_amount_override,
	penalty_amount_dt,
	penalty_paid_dt,
	fraud_penalty_dt,
	fraud_penalty_amount,
	fraud_penalty_paid_dt,
	fraud_comment,
	do_not_print_until,
	do_not_print_until_year,
	do_not_print_ever
)
select distinct
	p.prop_id,  --prop_id,                       
	@input_to_yr, 	   --prop_val_yr,                   
	'NR',			   --extension1,                    
	NULL,			   --extension1_processed_dt,       
	NULL,			   --extension1_printed_dt,         
	'',				   --extension1_comment,            
	'NR',			   --extension2,                    
	NULL,			   --extension2_processed_dt,       
	NULL,			   --extension2_printed_dt,         
	'',				   --extension2_comment,            
	NULL,			   --imposition_letter_dt,          
	NULL,			   --imposition_letter_receieved_dt,
	'',		--request_support_doc_comment,	   
	NULL,	--request_support_doc_dt,		   
	NULL,	--print_request_support_doc_dt,	   
	NULL,	--request_support_doc_rec_dt,	   
	'NR',	--penalty_waiver_status,
	NULL,	--penalty_waiver_status_dt,
	NULL,	--penalty_waiver_request_dt,
	NULL,	--penalty_waiver_print_dt,
	NULL,	--waiver_request_mandatory_dt,
	'',		--penalty_comment,
	0,		--penalty_amount,
	0,		--penalty_amount_override,  checkbox
	NULL,	--penalty_amount_dt,
	NULL,	--penalty_paid_dt,
	NULL,	--fraud_penalty_dt,
	0,		--fraud_penalty_amount,
	NULL,	--fraud_penalty_paid_dt,
	'',		--fraud_comment
	case when pprt.do_not_print_until = 1 and pprt.do_not_print_until_year < @input_to_yr then 1 else 0 end, --do_not_print_until
	case when pprt.do_not_print_until = 1 and pprt.do_not_print_until_year < @input_to_yr then pprt.do_not_print_until_year else NULL end, --do_not_print_until_year
	pprt.do_not_print_ever --do_not_print_ever
from create_property_layer_prop_list as cplpl with(tablockx)
join property as p with(tablockx) on
	p.prop_id = cplpl.prop_id and
	p.prop_type_cd = 'P'
join pp_rendition_tracking as pprt with(tablockx) on
	pprt.prop_val_yr = cplpl.prop_val_yr and
	pprt.prop_id = cplpl.prop_id and
	pprt.sup_num = cplpl.sup_num
--order by p.prop_id asc

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert pp_rendition_tracking End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
-- Effective acres

insert effective_acres_group with(tablockx) (
	group_id,
	prop_val_yr,
	[description],
	acreage,
	created_dt,
	created_by
)
select
	group_id,
	@input_to_yr,
	[description],
	acreage,
	created_dt,
	created_by
from effective_acres_group as eold
where
	prop_val_yr = @input_from_yr and
	not exists (
		select *
		from effective_acres_group as enew
		where
			enew.prop_val_yr = @input_to_yr and
			enew.group_id = eold.group_id
	)


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert effective_acres_group End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

insert effective_acres_assoc with(tablockx) (
	group_id,
	prop_val_yr,
	prop_id,
	date_added,
	Added_By
)
select
	group_id,
	@input_to_yr,
	prop_id,
	date_added,
	Added_By
from effective_acres_assoc as eold
where
	prop_val_yr = @input_from_yr and
	not exists (
		select *
		from effective_acres_assoc as enew
		where
			enew.prop_val_yr = @input_to_yr and
			enew.group_id = eold.group_id and
			enew.prop_id = eold.prop_id
	)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert effective_acres_assoc End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time

-- property_assoc
insert into property_assoc with(tablockx)
(
	parent_prop_id,
	child_prop_id,
	prop_val_yr,
	sup_num,
	lOrder,
	link_type_cd,
	link_sub_type_cd
)
select
	pa.parent_prop_id,
	pa.child_prop_id,
	@input_to_yr,
	0,
	pa.lOrder,
	pa.link_type_cd,
	pa.link_sub_type_cd
from create_property_layer_prop_list as cplpl with(tablockx)
join property_assoc as pa with(tablockx) on
	pa.prop_val_yr = cplpl.prop_val_yr and
	pa.sup_num = cplpl.sup_num and
	pa.parent_prop_id = cplpl.prop_id
--order by pa.parent_prop_id asc, pa.child_prop_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert property_assoc : parent End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


set @StartStep = getdate()  --logging capture start time

-- property_current_use_review
INSERT INTO property_current_use_review
	WITH (TABLOCKX)
(
	prop_id,
	[year],
	sup_num,
	manual_select,
	auto_select,
	status_code,
	status_date,
	review_date,
	next_inspection_date,
	next_inspection_reason
)
SELECT
	cplpl.prop_id,
	@input_to_yr,
	0,
	manual_select,
	auto_select,
	status_code,
	status_date,
	review_date,
	next_inspection_date,
	next_inspection_reason
FROM create_property_layer_prop_list AS cplpl
	WITH (TABLOCKX)
	JOIN property_current_use_review AS pcurold
		WITH (NOLOCK)
		ON pcurold.[year] = cplpl.prop_val_yr
			AND pcurold.sup_num = cplpl.sup_num
			AND pcurold.prop_id = cplpl.prop_id
WHERE [year] = @input_from_yr
	AND NOT EXISTS
	(
		SELECT *
		FROM property_current_use_review AS pcurnew
			WITH (NOLOCK)
		WHERE pcurnew.[year] = @input_to_yr
			AND pcurnew.prop_id = pcurold.prop_id
	)


SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert property_current_use_review : parent End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


set @StartStep = getdate()  --logging capture start time

-- property_current_use_removal
INSERT INTO property_current_use_removal
	WITH (TABLOCKX)
(
	prop_id,
	[year],
	removal_id,
	application_number,
	size_acres,
	removal_date,
	sup_num,
	manual_select,
	auto_select
)
SELECT
	cplpl.prop_id,
	@input_to_yr,
	removal_id,
	application_number,
	size_acres,
	removal_date,
	0,
	manual_select,
	auto_select
FROM create_property_layer_prop_list AS cplpl
	WITH (TABLOCKX)
	JOIN property_current_use_removal AS pcurold
		WITH (NOLOCK)
		ON pcurold.[year] = cplpl.prop_val_yr
			AND pcurold.sup_num = cplpl.sup_num
			AND pcurold.prop_id = cplpl.prop_id
WHERE [year] = @input_from_yr
	AND NOT EXISTS
	(
		SELECT *
		FROM property_current_use_review AS pcurnew
			WITH (NOLOCK)
		WHERE pcurnew.[year] = @input_to_yr
			AND pcurnew.prop_id = cplpl.prop_id
	)

SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert property_current_use_removal : parent End Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

-- rgoolsby: following added for 9.0 PACS  - procs contain logging statements

exec dbo.CreatePropertyLayer_property_special_assessment @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_land_misc_code @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_income_characteristic @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_income_characteristic_tenant @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_income_characteristic_amount @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_income_characteristic_unit_mix @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_tax_area @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_land_detail_characteristic @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_legal_description @input_from_yr,@input_to_yr,@proc

-- call proc to copy tables with user defined columns
exec CreateFY_NY_UserDefinedTables @input_from_yr,@input_to_yr,'user_owner','owner_tax_yr',@proc

exec CreateFY_NY_UserDefinedTables @input_from_yr,@input_to_yr,'user_property_val','prop_val_yr',@proc

exec CreateFY_NY_UserDefinedTables @input_from_yr,@input_to_yr,'user_land_detail','prop_val_yr',@proc

exec CreateFY_NY_UserDefinedTables @input_from_yr,@input_to_yr,'user_property_special_assessment','year',@proc
--

exec dbo.CreatePropertyLayer_prop_characteristic_assoc @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_property_assessment_attribute_val @input_from_yr,@input_to_yr,@proc

exec dbo.CreatePropertyLayer_ImprovDetailCMS @input_from_yr, @input_to_yr, @proc
exec dbo.CreatePropertyLayer_ImprovDetailRMS @input_from_yr, @input_to_yr, @proc

set @StartStep = getdate()  --logging capture start time


-- Now copy the state specific property_val table
        declare @szRegion varchar(2)
        select @szRegion = szConfigValue
        from core_config with(nolock)
        where szGroup = 'SYSTEM' and szConfigName = 'REGION'

        declare @szSQL varchar(8000)
        set @szSQL = 'exec ' + @szRegion + 'NewYearLayerCopyTablePV ' +
                    convert(varchar(12), @input_from_yr) + ',' +
                    convert(varchar(12), @input_to_yr) + ',' +
                    @proc

        exec(@szSQL)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'insert state specific property_val End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


/* turn on logging */
exec SetMachineLogChanges 1

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

