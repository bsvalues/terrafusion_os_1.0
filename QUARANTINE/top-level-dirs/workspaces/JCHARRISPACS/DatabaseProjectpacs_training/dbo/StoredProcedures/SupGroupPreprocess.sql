create procedure SupGroupPreprocess

	@sup_group_id int,
	@pacs_user_id int

as

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(400)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @sup_group_id =' +  convert(varchar(30),@sup_group_id) + ','
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

declare @sup_group_status_cd varchar(5)
--declare @cert_roll_rpt_print_refid2 char(1)

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 1 Start' --logging 

select @sup_group_status_cd = status_cd
from sup_group
with (nolock)
where sup_group_id = @sup_group_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 2 SupGroupResetTables Start' --logging 

exec SupGroupResetTables @sup_group_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 2 SupGroupResetTables End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#srr_supp_assoc'))
begin
	drop table #srr_supp_assoc
end



/*
 * Create temp table for current/previous sup_num's and sup_action
 */

create table #srr_supp_assoc
(
	prop_val_yr numeric(4,0) not null,
	prop_id int not null,
	curr_sup_num int not null,
	prev_sup_num int null,
	sup_action char(1) null,
	PRIMARY KEY CLUSTERED
	(
		prop_val_yr,
		prop_id,
		curr_sup_num
	) WITH FILLFACTOR = 90
)

/*
 * First insert those properties that are in the supplement group being
 * processed.  Make sure to exclude UDI parent and reference properties.
 */

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Start' --logging 

insert #srr_supp_assoc
(prop_id, prop_val_yr, curr_sup_num, sup_action)

select pv.prop_id, pv.prop_val_yr, pv.sup_num,
		case when pv.prop_inactive_dt is not null then 'D' else null end
from property_val as pv
with (nolock)
join property as p
with (nolock)
on pv.prop_id = p.prop_id
join supplement as s
with (nolock)
on pv.prop_val_yr = s.sup_tax_yr
and pv.sup_num = s.sup_num
and s.sup_group_id = @sup_group_id
where isnull(pv.udi_parent,'') = ''
and isnull(p.reference_flag,'F') <> 'T'

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


/*
 * Now for each of the properties involved above, determine the prev_sup_num and the
 * sup_action.
 */

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Start' --logging 

update #srr_supp_assoc
with (tablock)
set 
 prev_sup_num = t.sup_num
from #srr_supp_assoc as s
join
(
select pv.prop_id, pv.prop_val_yr,  max(pv.sup_num) as sup_num
from property_val as pv
with (nolock)
join #srr_supp_assoc as ssa
with (nolock)
on pv.prop_id = ssa.prop_id
and pv.prop_val_yr = ssa.prop_val_yr
where pv.sup_num < ssa.curr_sup_num
group by pv.prop_val_yr, pv.prop_id 
) as t
on s.prop_id = t.prop_id
and s.prop_val_yr = t.prop_val_yr

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Start' --logging 

update #srr_supp_assoc
with (tablock)
set 

 sup_action = case when sup_action is null and t.prop_inactive_dt is not null then 'A'
      when sup_action is not null then sup_action
      else null end
from #srr_supp_assoc as s
join
(
select pv.prop_id, pv.prop_val_yr, pv.prop_inactive_dt, max(pv.sup_num) as sup_num
from property_val as pv
with (nolock)
join #srr_supp_assoc as ssa
with (nolock)
on pv.prop_id = ssa.prop_id
and pv.prop_val_yr = ssa.prop_val_yr
where pv.sup_num = ssa.prev_sup_num
group by pv.prop_val_yr, pv.prop_id,  pv.prop_inactive_dt
) as t
on s.prop_id = t.prop_id
and s.prop_val_yr = t.prop_val_yr

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 6 Start' --logging 

/*
 * Fill in the blanks for the situations missed above.
 */

update #srr_supp_assoc
with (tablock)
set sup_action = case when prev_sup_num is null then 'A' else 'M' end
where sup_action is null

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 7 Start' --logging 

/*
 * Get the configuration flag for the property_identifier to be printed
 * on the report.
 */


insert td_sup_group_property_info
(sup_group_id,
 sup_yr,
 sup_num,
 data_flag,
 prop_id,
 pacs_user_id,
 sup_action,
 sup_cd,
 owner_id,
 pct_ownership,
 prop_type_cd,
 prop_sub_type_cd,
 property_identifier,
 ref_id2,
 geo_id,
 mineral_int_pct,
 type_of_int,
 acres,
 imprv_hstd_val,
 market,
 file_as_name,
 legal_desc,
 imprv_non_hstd_val,
 prod_loss,
 addr_line1,
 land_hstd_val,
 appraised_val,
 addr_line2,
 appraiser_nm,
 operator,
 legal_acreage,
 land_non_hstd_val,
 ten_percent_cap,
 addr_line3,
 state_codes,
 map_id,
 curr_use_hs_market,
 tax_area,
 situs_display,
 verified_user_id,
 verified_dt,
 exemptions,
 senior_pct,
 new_value,
 new_senior_value,
 curr_use_nhs_market,
 personal_property_market,
 frozen_appraised_val,
 non_frozen_appraised_val,
 senior_exemption_loss,
 exemption_loss,
 frozen_taxable,
 non_frozen_taxable,
 taxable,
 addr_line4,
 mortgage_cd,
 ref_id1,
 sup_desc,
 addr_is_international,
 country_name,
 tax_area_id,
 pending_tax_area,
 ag_use_val,
 ag_hs_use_val,
 prorate_begin,
 prorate_end)

select distinct @sup_group_id  as SupGroup,
 srr.prop_val_yr as SupYear,
 srr.curr_sup_num as SupNum,
0 as DataFlag,
srr.prop_id as PropID,
@pacs_user_id as PacsUser,
srr.sup_action as SupAction,
pv.sup_cd as SupCode,
o.owner_id as OwnerID,
o.pct_ownership as PCT_Ownership,
p.prop_type_cd as PropTypeCD,
pv.sub_type as SubTypeCD,
'Geo: ' + p.geo_id as property_identifier,
p.ref_id2 as RefID2,
p.geo_id as GeoID,
pv.mineral_int_pct as MineralIntPct,
o.type_of_int as TypeOfInt,
isnull(pv.eff_size_acres,0) as Acres,
isnull(pv.imprv_hstd_val,0) as ImprvHstdVal,
case when (pv.prop_inactive_dt is null or pv.udi_parent = 'T') then isnull(pv.market,0) else 0 end as Market,
a.file_as_name as FileAsName, 
replace(replace(replace(pv.legal_desc, char(10), ''), char(13), ' '), char(9), ' ') as LegalDesc,
isnull(pv.imprv_non_hstd_val,0) as ImprvNonHstdVal, 
isnull(pv.ag_loss,0) + isnull(pv.timber_loss,0) + isnull(pv.ag_hs_loss,0) + isnull(pv.timber_hs_loss,0),
--isnull(pv.ag_use_val,0) + isnull(pv.timber_use,0) - isnull(pv.ag_market,0) - isnull(pv.timber_market,0) as ProdLoss,
ad.addr_line1 as AddrLine1,
isnull(pv.land_hstd_val,0) as LandHstdVal,
isnull(wpv.appraised_classified,0) + isnull(wpv.appraised_non_classified,0) as AppraisedVal,
ad.addr_line2 as AddrLine2, 
isnull(ap.appraiser_nm,'') as AppraiserName,
isnull(pu.pacs_user_name, '') as Operator,
isnull(pv.legal_acreage,0) as LegalAcreage,
isnull(pv.land_non_hstd_val,0) as LandNonHstdVal,
isnull(pv.ten_percent_cap,0) as TenPercentCap, 
ad.addr_line3 as AddrLine3,
dbo.fn_GetStateCodes(pv.prop_id, pv.prop_val_yr, pv.sup_num) as StateCodes,
pv.map_id as MapID,
pv.ag_hs_mkt_val as CurrUseHSMarket,
ta.tax_area_number as TaxAreaID,
replace(replace(s.situs_display, char(13), ''), char(10), ' ') as SitusDisplay, 
pv.sup_verified_user as VerifiedUser,
pv.sup_verified_date as VerifiedDate,
--*Exemptions BEGIN
dbo.fn_GetExemptions( pv.prop_id, pv.prop_val_yr, pv.sup_num ) as Exemptions,
--Exemptions END
isnull(pe.exempt_pct,0) as SNRPCT,
pv.new_val as NewValue,
wpv.snr_new_val as SeniorNewVal,
pv.ag_market as CurrUseNHSMarket,
case when p.prop_type_cd = 'P' then pv.appraised_val else 0 end as PersonalMarket,
wpv.appraised_classified as FrozenAppraised,
isnull(wpv.appraised_non_classified,0) as NonFrozenAppraised,
wpv.snr_exempt_loss as SeniorExmptLoss,
isnull(wpoe.exempt_loss,0) as ExemptionLoss,
isnull(wpov.taxable_classified,0) as FrozenTaxable,
isnull(wpov.taxable_non_classified,0) as NonFrozenTaxable,
case when (pv.prop_inactive_dt is null or pv.udi_parent = 'T') then isnull(wpov.taxable_classified,0) + isnull(wpov.taxable_non_classified,0) else 0 end as Taxable,
isnull(ad.addr_city,'') + ', ' + isnull(ad.addr_state,'') + ' ' + isnull(ad.addr_zip,'') as AddrLine4,
--dbo.fn_GetMortgageCodes(pv.prop_id) as MortgageCd,
(select convert(varchar(10),min(mortgage_co_id)) + (case when count(*)>1 then '+' else '' end) from mortgage_assoc ma where ma.prop_id = pv.prop_id) as MortgageCd,
p.ref_id1 as RefID1,
 replace(replace(replace(pv.sup_desc, char(10), ''), char(13), ' '), char(9), ' ') as SupDesc,
 isnull(ad.is_international,0), 
country.country_name,
ta.tax_area_id,
ta2.tax_area_number,
isnull(pv.ag_use_val, 0) + isnull(pv.timber_use, 0),
isnull(pv.ag_hs_use_val, 0) + isnull(pv.timber_hs_use_val,0),
wpov.prorate_begin, 
wpov.prorate_end

from property_val as pv
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pv.prop_val_yr = srr.prop_val_yr
and pv.sup_num = srr.curr_sup_num
and pv.prop_id = srr.prop_id

left outer join wash_property_val as wpv
with (nolock)
on wpv.prop_id = pv.prop_id
and wpv.sup_num = pv.sup_num
and wpv.prop_val_yr = pv.prop_val_yr

left outer join property_tax_area as pta
with (nolock)
on pv.prop_val_yr = pta.year
and pv.sup_num = pta.sup_num
and pv.prop_id = pta.prop_id

left outer join tax_area as ta
with (nolock)
on ta.tax_area_id = pta.tax_area_id

left outer join tax_area as ta2
with (nolock)
on ta2.tax_area_id = pta.tax_area_id_pending 

left outer join wash_prop_owner_val as wpov
with (nolock)
on wpov.prop_id = pv.prop_id
and wpov.sup_num = pv.sup_num
and wpov.year = pv.prop_val_yr

left outer join
(
select sum(wpoe.exempt_value) as exempt_loss, wpoe.prop_id, wpoe.sup_num, wpoe.year
from wash_prop_owner_exemption as wpoe with (nolock)
where exmpt_type_cd <> 'SNR/DSBL'
group by wpoe.prop_id, wpoe.sup_num, wpoe.year
) as wpoe
on wpoe.prop_id = pv.prop_id
and wpoe.sup_num = pv.sup_num
and wpoe.year = pv.prop_val_yr

join owner as o
with (nolock)
on pv.prop_id = o.prop_id
and pv.prop_val_yr = o.owner_tax_yr
and pv.sup_num = o.sup_num
join account as a
with (nolock)
on o.owner_id = a.acct_id
join property as p
with (nolock)
on pv.prop_id = p.prop_id

left outer join
(
select eqc.percentage as exempt_pct, wpoe.prop_id, wpoe.[year] as exmpt_tax_yr, wpoe.owner_id, wpoe.sup_num
from wash_prop_owner_exemption as wpoe with (nolock)
join exmpt_qualify_code as eqc with (nolock) on
		eqc.[year] = wpoe.[year] 
	and eqc.exempt_type_cd = wpoe.exmpt_type_cd 
	and eqc.exemption_code = wpoe.exempt_qualify_cd
where wpoe.exmpt_type_cd = 'SNR/DSBL'
) as pe
on pe.prop_id = pv.prop_id
and pe.owner_id = o.owner_id
and pe.exmpt_tax_yr = pv.prop_val_yr
and pe.sup_num = pv.sup_num

left outer join address as ad
with (nolock)
on o.owner_id = ad.acct_id
and ad.primary_addr = 'Y'
and ad.addr_type_cd =
(
	select
		cast(max(addr_type_cd) as char(5))	-- Jeremy Wilson 43517 changes
	from
		address with(nolock)
	where
		acct_id = ad.acct_id
	and	primary_addr = 'Y'					-- Jeremy Wilson 43517 changes
)
left outer join country with (nolock) on country.country_cd = ad.country_cd

left outer join situs as s
with (nolock)
on pv.prop_id = s.prop_id
and s.primary_situs = 'Y'
and s.situs_id =
(
	select
		max(situs_id)
	from
		situs with (nolock)
	where
		prop_id = s.prop_id
	and	s.primary_situs = 'Y'
)
left outer join appraiser as ap
with (nolock)
on pv.last_appraiser_id = ap.appraiser_id
left outer join pacs_user as pu
with (nolock)
on pv.last_pacs_user_id = pu.pacs_user_id

where not exists (
	select 1 from ag_rollback ar
	where pv.prop_id = ar.prop_id
	and (@sup_group_id = ar.accept_sup_group_id or @sup_group_id = ar.void_sup_group_id)
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 8 Start' --logging 


/*
 * Now do previous supplement data
 */

insert td_sup_group_property_info
(sup_group_id,
 sup_yr,
 sup_num,
 data_flag,
 prop_id,
 pacs_user_id,
 sup_action,
 sup_cd,
 owner_id,
 pct_ownership,
 prop_type_cd,
 prop_sub_type_cd,
 property_identifier,
 ref_id2,
 geo_id,
 mineral_int_pct,
 type_of_int,
 acres,
 imprv_hstd_val,
 market,
 file_as_name,
 legal_desc,
 imprv_non_hstd_val,
 prod_loss,
 addr_line1,
 land_hstd_val,
 appraised_val,
 addr_line2,
 appraiser_nm,
 operator,
 legal_acreage,
 land_non_hstd_val,
 ten_percent_cap,
 addr_line3,
 state_codes,
 map_id,
 curr_use_hs_market,
 tax_area,
 situs_display,
 verified_user_id,
 verified_dt,
 exemptions,
 senior_pct,
 new_value,
 new_senior_value,
 curr_use_nhs_market,
 personal_property_market,
 frozen_appraised_val,
 non_frozen_appraised_val,
 senior_exemption_loss,
 exemption_loss,
 frozen_taxable,
 non_frozen_taxable,
 taxable,
 addr_line4,
 mortgage_cd,
 ref_id1,
 sup_desc,
 addr_is_international,
 country_name,
 tax_area_id,
 pending_tax_area,
 ag_use_val,
 ag_hs_use_val)




select distinct @sup_group_id  as SupGroup,
 srr.prop_val_yr as SupYear,
 srr.prev_sup_num as SupNum,
1 as DataFlag,
srr.prop_id as PropID,
@pacs_user_id as PacsUser,
srr.sup_action as SupAction,
pv.sup_cd as SupCode,
o.owner_id as OwnerID,
o.pct_ownership as PCT_Ownership,
p.prop_type_cd as PropTypeCD,
pv.sub_type as SubTypeCD,
'Geo: ' + p.geo_id as property_identifier,
p.ref_id2 as RefID2,
p.geo_id as GeoID,
pv.mineral_int_pct as MineralIntPct,
o.type_of_int as TypeOfInt,
isnull(pv.eff_size_acres,0) as Acres,
isnull(pv.imprv_hstd_val,0) as ImprvHstdVal,
case when (pv.prop_inactive_dt is null or pv.udi_parent = 'T') then isnull(pv.market,0) else 0 end as Market,
a.file_as_name as FileAsName, 
replace(replace(replace(pv.legal_desc, char(10), ''), char(13), ' '), char(9), ' ') as LegalDesc,
isnull(pv.imprv_non_hstd_val,0) as ImprvNonHstdVal, 
--isnull(pv.ag_use_val,0) + isnull(pv.timber_use,0) - isnull(pv.ag_market,0) - isnull(pv.timber_market,0) as ProdLoss,
isnull(pv.ag_loss,0) + isnull(pv.timber_loss,0) + isnull(pv.ag_hs_loss,0) + isnull(pv.timber_hs_loss,0),
ad.addr_line1 as AddrLine1,
isnull(pv.land_hstd_val,0) as LandHstdVal,
isnull(wpv.appraised_classified, 0) + isnull(wpv.appraised_non_classified, 0) as AppraisedVal,
ad.addr_line2 as AddrLine2, 
isnull(ap.appraiser_nm,'') as AppraiserName,
isnull(pu.pacs_user_name, '') as Operator,
isnull(pv.legal_acreage,0) as LegalAcreage,
isnull(pv.land_non_hstd_val,0) as LandNonHstdVal,
isnull(pv.ten_percent_cap,0) as TenPercentCap, 
ad.addr_line3 as AddrLine3,
dbo.fn_GetStateCodes(pv.prop_id, pv.prop_val_yr, pv.sup_num) as StateCodes,
pv.map_id as MapID,
pv.ag_hs_mkt_val as CurrUseHSMarket,
ta.tax_area_number as TaxAreaID,
replace(replace(s.situs_display, char(13), ''), char(10), ' ') as SitusDisplay, 
pv.sup_verified_user as VerifiedUser,
pv.sup_verified_date as VerifiedDate,
--*Exemptions BEGIN
dbo.fn_GetExemptions( pv.prop_id, pv.prop_val_yr, pv.sup_num ) as Exemptions,
--Exemptions END
isnull(pe.exempt_pct,0) as SNRPCT,
pv.new_val as NewValue,
wpv.snr_new_val as SeniorNewVal,
pv.ag_market as CurrUseNHSMarket,
case when p.prop_type_cd = 'P' then pv.appraised_val else 0 end as PersonalMarket,
isnull(wpv.appraised_classified,0) as FrozenAppraised,
isnull(wpv.appraised_non_classified,0) as NonFrozenAppraised,
wpv.snr_exempt_loss as SeniorExmptLoss,
isnull(wpoe.exempt_loss,0) as ExemptionLoss,
isnull(wpov.taxable_classified,0) as FrozenTaxable,
isnull(wpov.taxable_non_classified,0) as NonFrozenTaxable,
case when (pv.prop_inactive_dt is null or pv.udi_parent = 'T') then isnull(wpov.taxable_classified,0) + isnull(wpov.taxable_non_classified,0) else 0 end as Taxable,
isnull(ad.addr_city,'') + ', ' + isnull(ad.addr_state,'') + ' ' + isnull(ad.addr_zip,'') as AddrLine4,
--dbo.fn_GetMortgageCodes(pv.prop_id) as MortgageCd,
(select convert(varchar(10),min(mortgage_co_id)) + (case when count(*)>1 then '+' else '' end) from mortgage_assoc ma where ma.prop_id = pv.prop_id) as MortgageCd,
p.ref_id1 as RefID1,
 replace(replace(replace(pv.sup_desc, char(10), ''), char(13), ' '), char(9), ' ') as SupDesc,
 isnull(ad.is_international,0), 
country.country_name,
ta.tax_area_id,
ta2.tax_area_number,
isnull(pv.ag_use_val, 0) + isnull(pv.timber_use, 0),
isnull(pv.ag_hs_use_val, 0) + isnull(pv.timber_hs_use_val,0)

from property_val as pv
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pv.prop_val_yr = srr.prop_val_yr
and pv.sup_num = srr.prev_sup_num
and pv.prop_id = srr.prop_id

left outer join wash_property_val as wpv
with (nolock)
on wpv.prop_id = pv.prop_id
and wpv.sup_num = pv.sup_num
and wpv.prop_val_yr = pv.prop_val_yr

left outer join property_tax_area as pta
with (nolock)
on pv.prop_val_yr = pta.year
and pv.sup_num = pta.sup_num
and pv.prop_id = pta.prop_id


left outer join tax_area as ta
with (nolock)
on ta.tax_area_id = pta.tax_area_id

left outer join tax_area as ta2
with (nolock)
on ta2.tax_area_id = pta.tax_area_id_pending 


left outer join wash_prop_owner_val as wpov
with (nolock)
on wpov.prop_id = pv.prop_id
and wpov.sup_num = pv.sup_num
and wpov.year = pv.prop_val_yr

left outer join
(
select sum(wpoe.exempt_value) as exempt_loss, wpoe.prop_id, wpoe.sup_num, wpoe.year
from wash_prop_owner_exemption as wpoe with (nolock)
where exmpt_type_cd <> 'SNR/DSBL'
group by wpoe.prop_id, wpoe.sup_num, wpoe.year
) as wpoe
on wpoe.prop_id = pv.prop_id
and wpoe.sup_num = pv.sup_num
and wpoe.year = pv.prop_val_yr

join owner as o
with (nolock)
on pv.prop_id = o.prop_id
and pv.prop_val_yr = o.owner_tax_yr
and pv.sup_num = o.sup_num
join account as a
with (nolock)
on o.owner_id = a.acct_id
join property as p
with (nolock)
on pv.prop_id = p.prop_id

left outer join
(
select eqc.percentage as exempt_pct, wpoe.prop_id, wpoe.[year] as exmpt_tax_yr, wpoe.owner_id, wpoe.sup_num
from wash_prop_owner_exemption as wpoe with (nolock)
join exmpt_qualify_code as eqc with (nolock) on
		eqc.[year] = wpoe.[year] 
	and eqc.exempt_type_cd = wpoe.exmpt_type_cd 
	and eqc.exemption_code = wpoe.exempt_qualify_cd
where wpoe.exmpt_type_cd = 'SNR/DSBL'
) as pe
on pe.prop_id = pv.prop_id
and pe.owner_id = o.owner_id
and pe.exmpt_tax_yr = pv.prop_val_yr
and pe.sup_num = pv.sup_num

left outer join address as ad
with (nolock)
on o.owner_id = ad.acct_id
and ad.primary_addr = 'Y'
and ad.addr_type_cd =
(
	select
		cast(max(addr_type_cd) as char(5))	-- Jeremy Wilson 43517 changes
	from
		address with(nolock)
	where
		acct_id = ad.acct_id
	and	primary_addr = 'Y'					-- Jeremy Wilson 43517 changes
)
left outer join country with (nolock) on country.country_cd = ad.country_cd

left outer join situs as s
with (nolock)
on pv.prop_id = s.prop_id
and s.primary_situs = 'Y'
and s.situs_id =
(
	select
		max(situs_id)
	from
		situs with (nolock)
	where
		prop_id = s.prop_id
	and	s.primary_situs = 'Y'
)
left outer join appraiser as ap
with (nolock)
on pv.last_appraiser_id = ap.appraiser_id
left outer join pacs_user as pu
with (nolock)
on pv.last_pacs_user_id = pu.pacs_user_id

where not exists (
	select 1 from ag_rollback ar
	where pv.prop_id = ar.prop_id
	and (@sup_group_id = ar.accept_sup_group_id or @sup_group_id = ar.void_sup_group_id)
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 9 Start' --logging 

/*
 * Now create a "fake" record for the "Additions" that don't have previous
 * supplements.  The Crystal Report requires a current as well as a previous
 * supplement record for each property.
 *
 * A sup_num = -1 will be used for these special records.
 * All sorted fields must be included or it will throw off the report.
 */

insert td_sup_group_property_info
(sup_group_id,
 sup_yr,
 sup_num,
 data_flag,
 prop_id,
 pacs_user_id,
 sup_action,
 sup_cd,
 owner_id,
 pct_ownership,
 prop_type_cd,
 property_identifier,
 ref_id2,
 geo_id,
 mineral_int_pct,
 type_of_int,
 acres,
 imprv_hstd_val,
 market,
 file_as_name,
 legal_desc,
 imprv_non_hstd_val,
 prod_loss,
 addr_line1,
 land_hstd_val,
 appraised_val,
 addr_line2,
 appraiser_nm,
 operator,
 legal_acreage,
 land_non_hstd_val,
 ten_percent_cap,
 addr_line3,
 state_codes,
 map_id,
 addr_line4,
 situs_display,
 mortgage_cd,
 ref_id1,
 sup_desc,
 addr_is_international,
 country_name,
 tax_area_id,
 pending_tax_area)

 select @sup_group_id, srr.prop_val_yr, -1, 1, srr.prop_id, @pacs_user_id, srr.sup_action,  
 null, tsgpi.owner_id, null, '', null, null,  
 tsgpi.geo_id, null, null, null, 0, 0,  
 tsgpi.file_as_name, null, 0, 0, null, 0,  
 0, null, null, tsgpi.operator, null, 0,  
 0, null, null, null, null, null, 0,   
 null, null, 0, null, null, null

from #srr_supp_assoc as srr
with (nolock)
join td_sup_group_property_info as tsgpi
with (nolock)
on srr.prop_val_yr = tsgpi.sup_yr
and srr.prop_id = tsgpi.prop_id

and srr.curr_sup_num = tsgpi.sup_num
where srr.sup_action = 'A'
and srr.prev_sup_num is null
and tsgpi.sup_group_id = @sup_group_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 10 Start' --logging 

/*
 * HS 39167 - make the previous operator the same as the current operator if the
 *            previous operator is null for this sup_group_id.
 */

update prev
set operator = curr.operator
from td_sup_group_property_info as prev
with (nolock)
join td_sup_group_property_info as curr
with (nolock)
on curr.sup_group_id = prev.sup_group_id
and curr.sup_yr = prev.sup_yr
and curr.prop_id = prev.prop_id
and curr.data_flag = 0
and prev.data_flag = 1
where prev.sup_group_id = @sup_group_id
and len(prev.operator) = 0

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 11 Start' --logging 

/*
 * Populate td_sup_group_tax_area_summary
 */

insert td_sup_group_tax_area_summary
(sup_group_id, tax_area_id, sup_action, sup_yr, prop_id, sup_num, tax_area_number, 
curr_market, curr_taxable, curr_tax, 
prev_market, prev_taxable, prev_tax, 
gl_market, gl_taxable, gl_tax )

select @sup_group_id, curr.tax_area_id, isnull(curr.sup_action, 'A'), curr.sup_yr, 
curr.prop_id, curr.sup_num, curr.tax_area,
 
	sum(isnull(curr.market,0)),
	sum(isnull(curr.taxable,0)), 
	0,
	sum(isnull(prev.market,0)),
	sum(isnull(prev.taxable,0)), 
	0,
	sum(isnull(curr.market,0) - isnull(prev.market,0)),
	sum(isnull(curr.taxable,0) - isnull(prev.taxable,0)),
	0
from td_sup_group_property_info as curr
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on curr.sup_yr = srr.prop_val_yr
and curr.sup_num = srr.curr_sup_num
and curr.prop_id = srr.prop_id
and curr.sup_action = srr.sup_action
left outer join td_sup_group_property_info as prev
with (nolock)
on curr.sup_group_id = prev.sup_group_id
and srr.prop_val_yr = prev.sup_yr
and srr.prev_sup_num = prev.sup_num
and srr.prop_id = prev.prop_id
and curr.tax_area_id = prev.tax_area_id
and prev.data_flag = 1
where curr.data_flag = 0
and curr.sup_group_id = @sup_group_id
and curr.tax_area_id is not null
and curr.tax_area is not null
group by  curr.sup_yr, curr.sup_num, curr.prop_id, curr.tax_area_id,
	curr.sup_action, curr.tax_area

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 12 Start' --logging 

insert td_sup_group_tax_area_summary
(sup_group_id, tax_area_id, sup_action, sup_yr, prop_id, sup_num, tax_area_number, 
curr_market, curr_taxable, curr_tax, 
prev_market, prev_taxable, prev_tax, 
gl_market, gl_taxable, gl_tax )

select @sup_group_id, prev.tax_area_id, srr.sup_action, srr.prop_val_yr, srr.prop_id,
	srr.curr_sup_num, prev.tax_area,
 
	sum(isnull(curr.market,0)),
	sum(isnull(curr.taxable,0)), 
	0,
	sum(isnull(prev.market,0)),
	sum(isnull(prev.taxable,0)), 
	0,
	sum(isnull(curr.market,0) - isnull(prev.market,0)),
	sum(isnull(curr.taxable,0) - isnull(prev.taxable,0)),
	0
from td_sup_group_property_info as prev
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on prev.sup_yr = srr.prop_val_yr
and prev.sup_num = srr.prev_sup_num
and prev.prop_id = srr.prop_id
and prev.sup_action = srr.sup_action
left outer join td_sup_group_property_info as curr
with (nolock)
on curr.sup_group_id = prev.sup_group_id
and srr.prop_val_yr = curr.sup_yr
and srr.curr_sup_num = curr.sup_num
and srr.prop_id = curr.prop_id
and curr.tax_area_id = prev.tax_area_id
and curr.data_flag = 0
where prev.data_flag = 1
and prev.sup_group_id = @sup_group_id
and curr.prop_id is null
and prev.tax_area_id is not null
and prev.tax_area is not null
group by srr.prop_val_yr, srr.curr_sup_num, srr.prop_id, prev.tax_area_id,
	srr.sup_action, prev.tax_area

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 13 Start' --logging 

insert td_sup_group_tax_area_subtotal
(sup_group_id, sup_yr, sup_num, tax_area_id, sup_action, tax_area_number, 
 prop_count, curr_market, curr_taxable, curr_tax, prev_market, prev_taxable, prev_tax,
 gl_market, gl_taxable, gl_tax)

select sup_group_id, sup_yr, sup_num, tax_area_id, sup_action, tax_area_number,
	count(prop_id), sum(curr_market), sum(curr_taxable), sum(curr_tax),
	sum(prev_market), sum(prev_taxable), sum(prev_tax),
	0, 0, 0
from td_sup_group_tax_area_summary
with (nolock)
where sup_group_id = @sup_group_id
group by sup_group_id, sup_yr, sup_num, tax_area_id, tax_area_number, sup_action

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 14 Start' --logging 

-- Now insert the 0 rows for all actions that need them.

insert td_sup_group_tax_area_subtotal
(sup_group_id, sup_yr, sup_num, tax_area_id, sup_action, tax_area_number,
 prop_count, curr_market, curr_taxable, curr_tax, prev_market, prev_taxable, prev_tax,
 gl_market, gl_taxable, gl_tax)

select distinct sup_group_id, sup_yr, sup_num, tax_area_id, 'A', tax_area_number,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0
from td_sup_group_tax_area_summary as tsgpi
with (nolock)
where sup_group_id = @sup_group_id
and not exists 
(
	select sup_group_id
	from td_sup_group_tax_area_subtotal
	with (nolock)
	where sup_group_id = tsgpi.sup_group_id
	and sup_yr = tsgpi.sup_yr
	and tax_area_id = tsgpi.tax_area_id
	and sup_action = 'A'
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 15 Start' --logging 

insert td_sup_group_tax_area_subtotal
(sup_group_id, sup_yr, sup_num, tax_area_id, sup_action, tax_area_number,
 prop_count, curr_market, curr_taxable, curr_tax, prev_market, prev_taxable, prev_tax,
 gl_market, gl_taxable, gl_tax)

select distinct sup_group_id, sup_yr, sup_num, tax_area_id, 'M', tax_area_number,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0
from td_sup_group_tax_area_summary as tsgpi
with (nolock)
where sup_group_id = @sup_group_id
and not exists 
(
	select sup_group_id
	from td_sup_group_tax_area_subtotal
	with (nolock)
	where sup_group_id = tsgpi.sup_group_id
	and sup_yr = tsgpi.sup_yr
	and tax_area_id = tsgpi.tax_area_id
	and sup_action = 'M'
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 16 Start' --logging 

insert td_sup_group_tax_area_subtotal
(sup_group_id, sup_yr, sup_num, tax_area_id, sup_action, tax_area_number,
 prop_count, curr_market, curr_taxable, curr_tax, prev_market, prev_taxable, prev_tax,
 gl_market, gl_taxable, gl_tax)

select distinct sup_group_id, sup_yr, sup_num, tax_area_id, 'D', tax_area_number,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0
from td_sup_group_tax_area_summary as tsgpi
with (nolock)
where sup_group_id = @sup_group_id
and not exists 
(
	select sup_group_id
	from td_sup_group_tax_area_subtotal
	with (nolock)
	where sup_group_id = tsgpi.sup_group_id
	and sup_yr = tsgpi.sup_yr
	and tax_area_id = tsgpi.tax_area_id
	and sup_action = 'D'
)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 16 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 17 Start' --logging 

insert td_sup_group_tax_area_subtotal
(sup_group_id, sup_yr, sup_num, tax_area_id, sup_action, tax_area_number,
 prop_count, curr_market, curr_taxable, curr_tax, prev_market, prev_taxable, prev_tax,
 gl_market, gl_taxable, gl_tax)

select sup_group_id, sup_yr, sup_num, tax_area_id, 'T', tax_area_number,
	sum(prop_count), sum(curr_market), sum(curr_taxable), sum(curr_tax),
	sum(prev_market), sum(prev_taxable), sum(prev_tax),
	sum(gl_market), sum(gl_taxable), sum(gl_tax)
from td_sup_group_tax_area_subtotal
with (nolock)
where sup_group_id = @sup_group_id
group by sup_group_id, sup_yr, sup_num, tax_area_id, tax_area_number

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 17 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time
exec dbo.CurrentActivityLogInsert @proc, 'Step 18 Start' --logging 

update td_sup_group_tax_area_subtotal
set gl_market = curr_market - prev_market,
	gl_taxable = curr_taxable - prev_taxable
where sup_group_id = @sup_group_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 18 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


drop table #srr_supp_assoc

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

