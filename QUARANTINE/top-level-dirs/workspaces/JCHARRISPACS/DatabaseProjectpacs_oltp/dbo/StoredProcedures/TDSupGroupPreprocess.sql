

CREATE procedure [dbo].[TDSupGroupPreprocess]

	@sup_group_id int,
	@pacs_user_id int

as

set nocount on

declare @sup_group_status_cd varchar(5)
declare @cert_roll_rpt_print_refid2 char(1)

select @sup_group_status_cd = status_cd
from sup_group
with (nolock)
where sup_group_id = @sup_group_id


exec SupGroupResetTables @sup_group_id

if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#srr_supp_assoc'))
begin
	drop table #srr_supp_assoc
end


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
 country_name)

select @sup_group_id as SupGroup,
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
case when @cert_roll_rpt_print_refid2 = 'T' then 'RefID2: ' + p.ref_id2 else 'Geo: ' + p.geo_id end as property_identifier,
p.ref_id2 as RefID2,
p.geo_id as GeoID,
pv.mineral_int_pct as MineralIntPct,
o.type_of_int as TypeOfInt,
isnull(pv.eff_size_acres,0) as Acres,
isnull(pv.imprv_hstd_val,0) as ImprvHstdVal,
isnull(pv.market,0) as Market,
a.file_as_name as FileAsName, 
replace(replace(replace(pv.legal_desc, char(10), ''), char(13), ' '), char(9), ' ') as LegalDesc,
isnull(pv.imprv_non_hstd_val,0) as ImprvNonHstdVal, 
isnull(pv.ag_use_val,0) + isnull(pv.timber_use,0) - isnull(pv.ag_market,0) - isnull(pv.timber_market,0) as ProdLoss,
ad.addr_line1 as AddrLine1,
isnull(pv.land_hstd_val,0) as LandHstdVal,
isnull(pv.appraised_val,0) as AppraisedVal,
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
pta.tax_area_id as TaxAreaID,
replace(replace(s.situs_display, char(13), ''), char(10), ' ') as SitusDisplay, 
pv.sup_verified_user as VerifiedUser,
pv.sup_verified_data as VerifiedData,
--*Exemptions BEGIN
null as Exemptions,
--Exemptions END
--*SNRPCT BEGIN
null as SNRPCT,
--SNRPCT END
pv.new_val as NewValue,
wpv.snr_new_val as SeniorNewVal,
pv.ag_market as CurrUseNHSMarket,
pv.appraised_val as PersonalMarket,
wpv.appraised_classified as FrozenAppraised,
wpv.appraised_non_classified as NonFrozenAppraised,
wpv.snr_exempt_loss as SeniorExmptLoss,
-- sum (case when wpoe.exmpt_type_cd <> 'SNR/DSBL' then wpoe.exempt_value else 0 end) as ExemptLoss,
--*ExemptLoss BEGIN
null as ExemptLoss,
--ExemptLoss END
wpov.taxable_non_classified as FrozenTaxable,
wpov.taxable_classified as NonFrozenTaxable,
isnull(wpov.taxable_non_classified,0) + isnull(wpov.taxable_non_classified,0) as Taxable,
isnull(ad.addr_city,'') + ', ' + isnull(ad.addr_state,'') + ' ' + isnull(ad.addr_zip,'') as AddrLine4,
dbo.fn_GetMortgageCodes(pv.prop_id) as MortgageCd,
p.ref_id1 as RefID1,
 replace(replace(replace(pv.sup_desc, char(10), ''), char(13), ' '), char(9), ' ') as SupDesc,
 ad.is_international, 
country.country_name


from property_val as pv
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pv.prop_val_yr = srr.prop_val_yr
and pv.sup_num = srr.curr_sup_num
and pv.prop_id = srr.prop_id

left outer join wash_property_val as wpv
with (nolock)
on wpv.prop_id = pv.prop_val_yr
and wpv.sup_num = pv.sup_num
and wpv.prop_val_yr = pv.prop_val_yr

left outer join property_tax_area as pta
with (nolock)
on pv.prop_val_yr = pta.year
and pv.sup_num = pta.sup_num
and pv.prop_id = pta.prop_id

left outer join wash_prop_owner_val as wpov
with (nolock)
on wpov.prop_id = pv.prop_val_yr
and wpov.sup_num = pv.sup_num
and wpov.year = pv.prop_val_yr

left outer join wash_prop_owner_exemption as wpoe
with (nolock)
on wpoe.prop_id = pv.prop_val_yr
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

join address as ad
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
 country_name)

select @sup_group_id as SupGroup,
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
case when @cert_roll_rpt_print_refid2 = 'T' then 'RefID2: ' + p.ref_id2 else 'Geo: ' + p.geo_id end as property_identifier,
p.ref_id2 as RefID2,
p.geo_id as GeoID,
pv.mineral_int_pct as MineralIntPct,
o.type_of_int as TypeOfInt,
isnull(pv.eff_size_acres,0) as Acres,
isnull(pv.imprv_hstd_val,0) as ImprvHstdVal,
isnull(pv.market,0) as Market,
a.file_as_name as FileAsName, 
replace(replace(replace(pv.legal_desc, char(10), ''), char(13), ' '), char(9), ' ') as LegalDesc,
isnull(pv.imprv_non_hstd_val,0) as ImprvNonHstdVal, 
isnull(pv.ag_use_val,0) + isnull(pv.timber_use,0) - isnull(pv.ag_market,0) - isnull(pv.timber_market,0) as ProdLoss,
ad.addr_line1 as AddrLine1,
isnull(pv.land_hstd_val,0) as LandHstdVal,
isnull(pv.appraised_val,0) as AppraisedVal,
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
pta.tax_area_id as TaxAreaID,
replace(replace(s.situs_display, char(13), ''), char(10), ' ') as SitusDisplay, 
pv.sup_verified_user as VerifiedUser,
pv.sup_verified_data as VerifiedData,
--*Exemptions BEGIN
null as Exemptions,
--Exemptions END
--*SNRPCT BEGIN
null as SNRPCT,
--SNRPCT END
pv.new_val as NewValue,
wpv.snr_new_val as SeniorNewVal,
pv.ag_market as CurrUseNHSMarket,
pv.appraised_val as PersonalMarket,
wpv.appraised_classified as FrozenAppraised,
wpv.appraised_non_classified as NonFrozenAppraised,
wpv.snr_exempt_loss as SeniorExmptLoss,
-- sum (case when wpoe.exmpt_type_cd <> 'SNR/DSBL' then wpoe.exempt_value else 0 end) as ExemptLoss,
--*ExemptLoss BEGIN
null as ExemptLoss,
--ExemptLoss END
wpov.taxable_non_classified as FrozenTaxable,
wpov.taxable_classified as NonFrozenTaxable,
isnull(wpov.taxable_non_classified,0) + isnull(wpov.taxable_non_classified,0) as Taxable,
isnull(ad.addr_city,'') + ', ' + isnull(ad.addr_state,'') + ' ' + isnull(ad.addr_zip,'') as AddrLine4,
dbo.fn_GetMortgageCodes(pv.prop_id) as MortgageCd,
p.ref_id1 as RefID1,
 replace(replace(replace(pv.sup_desc, char(10), ''), char(13), ' '), char(9), ' ') as SupDesc,
 ad.is_international, 
country.country_name


from property_val as pv
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pv.prop_val_yr = srr.prop_val_yr
and pv.sup_num = srr.prev_sup_num
and pv.prop_id = srr.prop_id

left outer join wash_property_val as wpv
with (nolock)
on wpv.prop_id = pv.prop_val_yr
and wpv.sup_num = pv.sup_num
and wpv.prop_val_yr = pv.prop_val_yr

left outer join property_tax_area as pta
with (nolock)
on pv.prop_val_yr = pta.year
and pv.sup_num = pta.sup_num
and pv.prop_id = pta.prop_id

left outer join wash_prop_owner_val as wpov
with (nolock)
on wpov.prop_id = pv.prop_val_yr
and wpov.sup_num = pv.sup_num
and wpov.year = pv.prop_val_yr

left outer join wash_prop_owner_exemption as wpoe
with (nolock)
on wpoe.prop_id = pv.prop_val_yr
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

join address as ad
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
 country_name)

select @sup_group_id, srr.prop_val_yr, -1, 1, srr.prop_id, @pacs_user_id, srr.sup_action,
 null, tsgpi.owner_id, null, null, null, null,
 tsgpi.geo_id, null, null, null, 0, 0,
 tsgpi.file_as_name, null, 0, 0, null, 0,
 0, null, null, tsgpi.operator, null, 0,
 0, null, null, null, null, null, 0, 
 null, null, null, null

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

/*
 * HS 39167 - make the previous operator the same as the current operator if the
 *            previous operator is null for this sup_group_id.
 */

update prev
set operator = curr.operator
from td_sup_group_property_info as prev
with (nolock)
join sup_group_property_info as curr
with (nolock)
on curr.sup_group_id = prev.sup_group_id
and curr.sup_yr = prev.sup_yr
and curr.prop_id = prev.prop_id
and curr.data_flag = 0
and prev.data_flag = 1
where prev.sup_group_id = @sup_group_id
and len(prev.operator) = 0

/*
 * Do current normal exemptions
 */

insert sup_group_exemption_info
(sup_group_id, sup_yr, sup_num, data_flag, prop_id, exmpt_type_cd, exemption, pacs_user_id)

select @sup_group_id, srr.prop_val_yr, srr.curr_sup_num, 0, srr.prop_id,
 pe.exmpt_type_cd, pe.exmpt_type_cd, @pacs_user_id
from property_exemption as pe
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pe.prop_id = srr.prop_id
and pe.exmpt_tax_yr = srr.prop_val_yr
and pe.owner_tax_yr = srr.prop_val_yr
and pe.sup_num = srr.curr_sup_num

/*
 * Do current prorated exemptions (effective)
 */

insert sup_group_exemption_info
(sup_group_id, sup_yr, sup_num, data_flag, prop_id, exmpt_type_cd, exemption, pacs_user_id)

select @sup_group_id, srr.prop_val_yr, srr.curr_sup_num, 0, srr.prop_id,
 pe.exmpt_type_cd, 'IN-' + convert(varchar(10), pe.effective_dt, 101), @pacs_user_id
from property_exemption as pe
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pe.prop_id = srr.prop_id
and pe.exmpt_tax_yr = srr.prop_val_yr
and pe.owner_tax_yr = srr.prop_val_yr
and pe.sup_num = srr.curr_sup_num
where pe.effective_dt is not null

/*
 * Do current prorated exemptions (terminated)
 */

insert sup_group_exemption_info
(sup_group_id, sup_yr, sup_num, data_flag, prop_id, exmpt_type_cd, exemption, pacs_user_id)

select @sup_group_id, srr.prop_val_yr, srr.curr_sup_num, 0, srr.prop_id,
 pe.exmpt_type_cd, 'OUT-' + convert(varchar(10), pe.termination_dt, 101), @pacs_user_id
from property_exemption as pe
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pe.prop_id = srr.prop_id
and pe.exmpt_tax_yr = srr.prop_val_yr
and pe.owner_tax_yr = srr.prop_val_yr
and pe.sup_num = srr.curr_sup_num
where pe.termination_dt is not null

/*
 * Do previous normal exemptions
 */

insert sup_group_exemption_info
(sup_group_id, sup_yr, sup_num, data_flag, prop_id, exmpt_type_cd, exemption, pacs_user_id)

select @sup_group_id, srr.prop_val_yr, srr.prev_sup_num, 1, srr.prop_id,
 pe.exmpt_type_cd, pe.exmpt_type_cd, @pacs_user_id
from property_exemption as pe
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pe.prop_id = srr.prop_id
and pe.exmpt_tax_yr = srr.prop_val_yr
and pe.owner_tax_yr = srr.prop_val_yr
and pe.sup_num = srr.prev_sup_num

/*
 * Do previous prorated exemptions (effective)
 */

insert sup_group_exemption_info
(sup_group_id, sup_yr, sup_num, data_flag, prop_id, exmpt_type_cd, exemption, pacs_user_id)

select @sup_group_id, srr.prop_val_yr, srr.prev_sup_num, 1, srr.prop_id,
 pe.exmpt_type_cd, 'IN-' + convert(varchar(10), pe.effective_dt, 101), @pacs_user_id
from property_exemption as pe
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pe.prop_id = srr.prop_id
and pe.exmpt_tax_yr = srr.prop_val_yr
and pe.owner_tax_yr = srr.prop_val_yr
and pe.sup_num = srr.prev_sup_num
where pe.effective_dt is not null

/*
 * Do previous prorated exemptions (terminated)
 */

insert sup_group_exemption_info
(sup_group_id, sup_yr, sup_num, data_flag, prop_id, exmpt_type_cd, exemption, pacs_user_id)

select @sup_group_id, srr.prop_val_yr, srr.prev_sup_num, 1, srr.prop_id,
 pe.exmpt_type_cd, 'OUT-' + convert(varchar(10), pe.termination_dt, 101), @pacs_user_id
from property_exemption as pe
with (nolock)
join #srr_supp_assoc as srr
with (nolock)
on pe.prop_id = srr.prop_id
and pe.exmpt_tax_yr = srr.prop_val_yr
and pe.owner_tax_yr = srr.prop_val_yr
and pe.sup_num = srr.prev_sup_num
where pe.termination_dt is not null

/*
 * Do current entity info
 */

drop table #srr_supp_assoc

GO

