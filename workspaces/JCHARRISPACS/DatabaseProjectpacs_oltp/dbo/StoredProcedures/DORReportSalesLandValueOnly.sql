
create procedure [dbo].[DORReportSalesLandValueOnly]
	@dataset_id int,
	@year numeric(4,0),
	@as_of_sup_num int,
	@valid_sales bit,
	@run_08_validation_only bit,
	@senior_freeze numeric(16,2) = NULL,
	@forestland numeric(16,2) = NULL
as
-- Programmer Note: There exists a dependency in the order of operations in this process 
-- that determines whether or not a property has an active senior exemption on in
-- after the sale of a property.

-- ================================================================================
-- turn off result counting
-- ================================================================================
set nocount on

declare @boe_cert_run_flag bit
set @boe_cert_run_flag = 0
if ( @dataset_id is null )
begin
	set @boe_cert_run_flag = 1
	
	exec dbo.GetUniqueID 'dor_report_run', @dataset_id output, 1, 0
	
	insert dor_report_run(dataset_id, run_dt)
	values (@dataset_id, getdate())
end


-- ================================================================================
-- clean data 
-- ================================================================================
delete from ##dor_report_sale_overall where dataset_id = @dataset_id
delete from ##dor_report_sale_strata where dataset_id = @dataset_id
delete from ##dor_report_sale_detail where dataset_id = @dataset_id


-- ================================================================================
-- Get Report Configuration Info
-- ================================================================================
-- determine our minimum and maximum sales date ranges for the year selected
-- and other DOR Report configuration settings
declare @sale_date_begin datetime
declare @sale_date_end datetime
declare @separate_current_use_group bit
declare @use_custom_stratum bit
declare @custom_stratum_name varchar(70)
declare	@custom_stratum_exists bit

select 
	@sale_date_begin = sale_date_begin,
	@sale_date_end = sale_date_end,
	@separate_current_use_group = separate_current_use_group,
	@use_custom_stratum = use_custom_stratum,
	@custom_stratum_name = isnull(custom_stratum_name, '')
from dor_report_config with (nolock)
where [year] = @year and [type] = 'R'

if (@boe_cert_run_flag = 1)
begin
	set @separate_current_use_group = 1
end

-- If retrieved Custom Stratum Name is empty, set default name
if @custom_stratum_name = '' 
	set @custom_stratum_name = 'Custom Stratum'
else
	set @custom_stratum_name = 'Custom Stratum - ' + @custom_stratum_name


if @use_custom_stratum = 1 
Begin
	set @custom_stratum_exists = 
	case when exists
	  ( select drcsu.property_use_cd 
		from dor_report_config_stratum_use_codes drcsu with(nolock)
		where drcsu.[year] = @year
			and drcsu.[type] = 'R'
			and drcsu.group_type = 'X' ) then 1 else 0
	end
end
else
	set @custom_stratum_exists = 0


-- ================================================================================
-- Collect Sales Data
-- ================================================================================
-- get sales data for properties that sold within the specified date range
declare @SaleData table
(
	chg_of_owner_id int,
	main_prop_id int,
	prop_id int,
	sale_date datetime,
	sale_price numeric(14, 0),
	adj_sale_price numeric(14, 0),
	sale_ratio_type_cd char(5),
	excise_number int,
	invalid_sales_code varchar(5) null,
	invalid_reason varchar(100) null,
	bPrimary bit,	-- marker for which property is the main property in a multi-property sale
	is_valid_sale bit,
	deed_type_cd char(10) null,
	deed_type_desc varchar(50) null,
	land_only_sale bit null,	-- marker for which property is land only sale (impacts ratio)
	land_sale_value numeric(14, 0),	
	primary key clustered (chg_of_owner_id, prop_id)
)

insert into @SaleData
(
	chg_of_owner_id,
	prop_id,
	sale_date,
	sale_price,
	adj_sale_price,
	sale_ratio_type_cd,
	excise_number,
	invalid_sales_code,
	invalid_reason,
	bPrimary,
	is_valid_sale,
	deed_type_cd,
	deed_type_desc,
	land_only_sale,
	land_sale_value
)
select
	coopa.chg_of_owner_id,
	coopa.prop_id,
	sale.sl_dt,
	sale.adjusted_sl_price,
	sale.adjusted_sl_price * .99,
	sale.sl_ratio_type_cd,
	isnull(reet.excise_number, coo.excise_number),
	invalid_sales_code = case when isnull(srt.invalid_sale, 0) = 1 then sale.sl_ratio_type_cd else null end, 
	invalid_reason = case when isnull(srt.invalid_sale, 0) = 1 then sale.sl_ratio_cd_reason else null end,  -- invalid_reason
	coopa.bPrimary,
	case when isnull(srt.invalid_sale, 0) = 1 then 0 else 1 end,
	dt.deed_type_cd,
	dt.deed_type_desc,
	sale.land_only_sale,
	land_value.land_market_value
from chg_of_owner_prop_assoc as coopa with (nolock)
join chg_of_owner as coo with (nolock)
on coopa.chg_of_owner_id = coo.chg_of_owner_id
join sale with (nolock) on sale.chg_of_owner_id = coopa.chg_of_owner_id
join [property] as p with (nolock) on p.prop_id = coopa.prop_id
join prop_supp_assoc as psa with(nolock) on p.prop_id = psa.prop_id and @year = psa.owner_tax_yr
--Clark & a few others can have sl_ratio_type_cd = null, 
--which is then considered to be a valid sale
left join sale_ratio_type as srt with (nolock) on
		srt.sl_ratio_type_cd = sale.sl_ratio_type_cd
left join reet_chg_of_owner_assoc as rcooa with (nolock) on
		rcooa.chg_of_owner_id = coopa.chg_of_owner_id
left join reet with (nolock) on
		reet.reet_id = rcooa.reet_id
left join deed_type dt with(nolock) on
		dt.deed_type_cd = coo.deed_type_cd
left join (
	select ld.prop_id, ld.prop_val_yr, ld.sale_id, ld.sup_num, sum(land_seg_mkt_val) land_market_value from land_detail ld with(nolock) group by prop_id, sale_id, prop_val_yr, sup_num
) land_value on 0 = land_value.sale_id and p.prop_id = land_value.prop_id and land_value.prop_val_yr = @year and land_value.sup_num = psa.sup_num	
where
	sale.sl_dt is not null
	and
	(@sale_date_begin is null or sale.sl_dt >= @sale_date_begin)
	and
	(@sale_date_end is null or sale.sl_dt < dateadd(day, 1, @sale_date_end))
	and sale.sl_price > 0
	and p.prop_type_cd in ('R', 'MH')


-- ================================================================================
-- Collect Property Value Data
-- ================================================================================
-- Get the most curent property values for properties listed in the SalesData table
declare @PropData table 
(
	[year] numeric(4, 0),
	sup_num int,
	prop_id int,
	prop_type_cd char(5),
	-- property_val.market,
	market_value numeric(14, 0),
	-- wash_prop_owner_val.taxable_classifed
	senior_value numeric(14, 0),	
	-- land_detail.ag_val for non-homesite land and non-senior homesite land in the timber current use program
	timber_ag_value numeric(14, 0),	
	-- land_detail.ag_val for non-homesite land and non-senior homesite land in the DFL current use program
	forest_ag_value numeric(14, 0),
	-- land_detail.ag_val for non-homesite land and non-senior homesite land where ag_apply is true, 
	-- but the land is not in the timber or DFL program
	other_ag_value numeric(14, 0),  
	-- land_detail.land_seg_mkt_val for non-homesite land and non-senior homesite land where ag_apply is false
	other_land_market_value numeric(14, 0),
	-- imprv.imprv_val for non-homesite improvements and non-senior homesite improvements
	-- How the value is stratified depends on the is_current_use flag (see below) and whether or not
	-- @separate_current_use_group is true
	other_imprv_market_value numeric(14, 0),
	-- the calculated assessed value
	assessed_value numeric(14,0),
	stratify_value numeric(14,0),
	-- the dor use code for the property
	dor_use_cd varchar(10),
	-- a category assigned to the property based on the attribute flags of the dor use code
	dor_group_type char(1),
	-- flag indicating whether or not ther is a senior exemption on the property
	is_senior bit,
	-- flag indicating whether or not the property has a 'U500' exemption
	has_u500_exemption bit,
	-- flag indicating whether or not the property has an 'EX' exemption
	has_ex_exemption bit,
	-- flag indicating that either the entire property is classified as current use property
	-- because of its dor use code, or some portion of the property is in some type of
	-- current use program because a land_detail.ag_apply flag is true.
	is_current_use bit, 
	-- the stratum for the property based on the calculated assessed value.
	stratum_id int null,
	senior_exemption_loss numeric(14,0),
    dor_use_custom_flag bit null,	-- flag indicates if a custom stratum exists for
	property_use_cd varchar(10) null,
	prior_assessed_value numeric(14,0),
	prior_senior_value numeric(14, 0),	
	prior_senior_exemption_loss numeric(14,0),
	prior_forest_ag_value numeric(14, 0),
	prior_timber_ag_value numeric(14, 0),	
	prior_other_imprv_market_value numeric(14, 0),
	-- primary use code of the property
	primary key clustered ([year], sup_num, prop_id, dor_group_type)
)

insert into @PropData
(
	[year],
	sup_num,
	prop_id,
	dor_group_type
)
select
	pv.prop_val_yr,
	max(pv.sup_num),
	pv.prop_id,
	'Z'		-- insert 'Z' as default since group type being part of the primary key cannot be null
from property_val as pv with (nolock) 
where pv.prop_val_yr = @year
	and pv.sup_num <= @as_of_sup_num
group by pv.prop_val_yr, pv.prop_id

-- We are only interested in active real and mobile home property that isn't state assessed
delete from @PropData
from @PropData as tbl
join [property] as p with (nolock) on
		p.prop_id = tbl.prop_id
join property_val as pv with (nolock) on
		pv.prop_val_yr = tbl.[year]
	and pv.sup_num = tbl.sup_num
	and pv.prop_id = tbl.prop_id
left join property_sub_type as pst on
		pv.sub_type = pst.property_sub_cd
where p.prop_type_cd not in ('R', 'MH')
	or (p.prop_type_cd = 'R' and pst.imp_leased_land = 1)	-- Improvements on Leased Land is Personal Property, so delete them
	or pv.prop_inactive_dt is not null						-- Remove deleted and udi parents
	or pst.state_assessed_utility = 1						-- Remove State Assessed Utilities 
	or pst.local_assessed_utility = 1						-- Remove Local Assessed Utilities 
	or pv.prop_state = 'P'									-- Dunno what this is about but, the Abstract of Value report removes them
	or p.reference_flag = 'T'								-- Remove reference properties
	or isnull(pst.state_bid_timber, 0) = 1 
    or isnull(pst.boat, 0) = 1

-- Update value information for the remaining properties
update @PropData set
	market_value = pv.market,
	stratify_value = (wpov.appraised_classified + wpov.appraised_non_classified),
	prop_type_cd = p.prop_type_cd,
	senior_value = case
		when
			wpoe.exmpt_type_cd = 'SNR/DSBL' and
			pe.exmpt_type_cd = 'SNR/DSBL' and
			(pe.termination_dt is null or pe.termination_dt > @sale_date_end)
		then wpv.snr_taxable_portion
		else 0
	end,
	assessed_value = case when dor_use_code.current_use = 1 then pv.market else pv.assessed_val end,
	dor_use_cd = property_use.dor_use_code,
	is_senior = case 
		when
			wpoe.exmpt_type_cd = 'SNR/DSBL' and
			pe.exmpt_type_cd = 'SNR/DSBL' and
			(pe.termination_dt is null or pe.termination_dt > @sale_date_end)
		then 1
		else 0
	end,
	dor_group_type = case
		
		when dor_use_code.residential = 1
		then 'R'
		
		when @separate_current_use_group = 1 and @boe_cert_run_flag = 1 and (
				 isnull(dor_use_code.multifamily, 0) = 1
              or isnull(dor_use_code.commercial, 0) = 1
              or isnull(dor_use_code.industrial, 0) = 1
              or isnull(dor_use_code.mh_park, 0) = 1
			  or isnull(dor_use_code.other, 0 ) = 1
		)
		then 'C'
		
		when @separate_current_use_group = 1 and @boe_cert_run_flag = 0 and (
				 isnull(dor_use_code.multifamily, 0) = 1
              or isnull(dor_use_code.commercial, 0) = 1
              or isnull(dor_use_code.industrial, 0) = 1
              or isnull(dor_use_code.mh_park, 0) = 1
			  
		)
		then 'C'		

		else 'O'
		
	end,
	is_current_use = case 
		when dor_use_code.current_use = 1 then 1
		when dor_use_code.other = 1 then 1
		when isnull(pv.ag_use_val, 0) + isnull(pv.timber_use, 0) + isnull(pv.ag_hs_use_val, 0) + isnull(pv.timber_hs_use_val, 0) > 0 then 1
		else 0
	end,
	has_u500_exemption = case when wpoe_u500.exmpt_type_cd = 'U500' then 1 else 0 end,
	has_ex_exemption = case when wpoe_ex.exmpt_type_cd = 'EX' then 1 else 0 end,
	senior_exemption_loss = IsNull(wpv.snr_exempt_loss,0),
    dor_use_custom_flag = 0,
	property_use_cd = pv.property_use_cd
from @PropData as PropData
join property_val as pv with (nolock) on
		pv.prop_val_yr = PropData.[year]
	and pv.sup_num = PropData.sup_num
	and pv.prop_id = PropData.prop_id
join [property] as p with (nolock) on
		p.prop_id = PropData.prop_id
join wash_prop_owner_val as wpov with(nolock) on
	wpov.year = pv.prop_val_yr and
	wpov.sup_num = pv.sup_num and
	wpov.prop_id = pv.prop_id
join wash_property_val as wpv with (nolock) on
		wpv.prop_val_yr = PropData.[year]
	and wpv.sup_num = PropData.sup_num
	and wpv.prop_id = PropData.prop_id
left join property_use with(nolock) on
	property_use.property_use_cd = pv.property_use_cd
left join dor_use_code with(nolock) on
	dor_use_code.sub_cd = property_use.dor_use_code
left join wash_prop_owner_exemption as wpoe with (nolock) on
		wpoe.[year] = PropData.[year]
	and wpoe.sup_num = PropData.sup_num
	and wpoe.prop_id = PropData.prop_id
	and wpoe.exmpt_type_cd = 'SNR/DSBL'
left join property_exemption as pe with (nolock) on
		pe.exmpt_tax_yr = PropData.[year]
	and pe.sup_num = PropData.sup_num
	and pe.prop_id = PropData.prop_id
	and pe.exmpt_type_cd = 'SNR/DSBL'
left join wash_prop_owner_exemption as wpoe_u500 with(nolock) on
		wpoe_u500.year = PropData.[year] 
	and wpoe_u500.sup_num = PropData.sup_num
	and wpoe_u500.prop_id = PropData.prop_id
	and wpoe_u500.exmpt_type_cd = 'U500'
left join wash_prop_owner_exemption as wpoe_ex with(nolock) on
		wpoe_ex.year = PropData.[year] 
	and wpoe_ex.sup_num = PropData.sup_num 
	and wpoe_ex.prop_id = PropData.prop_id 
	and wpoe_ex.exmpt_type_cd = 'EX'



-- Update value prior year assessed information for the remaining properties
update @PropData set
	prior_assessed_value = case when dor_use_code.current_use = 1 then pv.market else pv.assessed_val end,
	prior_senior_value = case
		when
			wpoe.exmpt_type_cd = 'SNR/DSBL' and
			pe.exmpt_type_cd = 'SNR/DSBL' and
			(pe.termination_dt is null or pe.termination_dt > @sale_date_end)
		then wpv.snr_taxable_portion
		else 0
	end,
	prior_senior_exemption_loss = IsNull(wpv.snr_exempt_loss,0)
from @PropData as PropData
join prop_supp_assoc as psa with(nolock) on
	psa.owner_tax_yr = PropData.[year]-1
	and psa.prop_id = PropData.prop_id
join property_val as pv with (nolock) on
	pv.prop_val_yr = psa.owner_tax_yr
	and pv.sup_num = psa.sup_num
	and pv.prop_id = psa.prop_id
join wash_property_val as wpv with (nolock) on
		wpv.prop_val_yr = PropData.[year]
	and wpv.sup_num = PropData.sup_num
	and wpv.prop_id = PropData.prop_id
left join property_use with(nolock) on
	property_use.property_use_cd = pv.property_use_cd
left join dor_use_code with(nolock) on
	dor_use_code.sub_cd = property_use.dor_use_code
left join wash_prop_owner_exemption as wpoe with (nolock) on
		wpoe.[year] = PropData.[year]
	and wpoe.sup_num = PropData.sup_num
	and wpoe.prop_id = PropData.prop_id
	and wpoe.exmpt_type_cd = 'SNR/DSBL'
left join property_exemption as pe with (nolock) on
		pe.exmpt_tax_yr = PropData.[year]
	and pe.sup_num = PropData.sup_num
	and pe.prop_id = PropData.prop_id
	and pe.exmpt_type_cd = 'SNR/DSBL'


-- Insert properties belonging to the use codes selected under the Custom Stratum, if it exists
if @use_custom_stratum = 1 and @custom_stratum_exists = 1
Begin

select * into #PropDataCopy from @PropData 

insert into @PropData
(
	[year],
	sup_num,
	prop_id,
	market_value,
	stratify_value,
	prop_type_cd,
	senior_value,
	assessed_value,
	dor_use_cd,
	is_senior,
	dor_group_type,
	is_current_use,
	has_u500_exemption,
	has_ex_exemption,
	senior_exemption_loss,
	dor_use_custom_flag,
	property_use_cd
)
select
	[year],
	sup_num,
	prop_id,
	market_value,
	stratify_value,
	prop_type_cd,
	senior_value,
	assessed_value,
	dor_use_cd,
	is_senior,
	dor_group_type = 'X',
	is_current_use,
	has_u500_exemption,
	has_ex_exemption,
	senior_exemption_loss,
	dor_use_custom_flag = 1,
	property_use_cd
from #PropDataCopy as pdc with (nolock) 
where pdc.property_use_cd in ( select property_use_cd
						from dor_report_config_stratum_use_codes drcsu with(nolock)
						where drcsu.[year] = @year
							  and drcsu.[type] = 'R'
							  and drcsu.group_type = 'X')
end

-- Delete properties not in the selected Use Codes list for Single Family Stratum
	if exists ( select drcsu.property_use_cd 
				from dor_report_config_stratum_use_codes drcsu with(nolock)
				where drcsu.[year] = @year
					and drcsu.[type] = 'R'
					and drcsu.group_type = 'R' )
	Begin
      delete from @PropData
      where dor_group_type = 'R' 
			and property_use_cd not in (select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							  where drcsu.[year] = @year
									and drcsu.[type] = 'R'
									and drcsu.group_type = 'R' ) 
	End 
		
-- Delete properties not in the selected Use Codes list for Commercial / Multi-Family / Industrial Stratum
	if exists ( select drcsu.property_use_cd 
				from dor_report_config_stratum_use_codes drcsu with(nolock)
				where drcsu.[year] = @year
					and drcsu.[type] = 'R'
					and drcsu.group_type = 'C' )
	Begin
      delete from @PropData
      where dor_group_type = 'C' 
			and property_use_cd not in ( select property_use_cd
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where
								  drcsu.[year] = @year
								  and drcsu.[type] = 'R'
								  and drcsu.group_type = 'C')
	End
		
-- Delete properties not in the selected Use Codes list for Current Use / Agri / Other Stratum
	if exists ( select drcsu.property_use_cd 
				from dor_report_config_stratum_use_codes drcsu with(nolock)
				where drcsu.[year] = @year
					and drcsu.[type] = 'R'
					and drcsu.group_type = 'O' )
	Begin
      delete from @PropData
      where dor_group_type = 'O' 
			and property_use_cd not in ( select property_use_cd
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where
								  drcsu.[year] = @year
								  and drcsu.[type] = 'R'
								  and drcsu.group_type = 'O')
	End
		
-- Delete properties not in the selected Use Codes list for Custom Stratum
	if exists ( select drcsu.property_use_cd 
				from dor_report_config_stratum_use_codes drcsu with(nolock)
				where drcsu.[year] = @year
					and drcsu.[type] = 'R'
					and drcsu.group_type = 'X' )
	Begin
      delete from @PropData
      where dor_use_custom_flag = 1 
			and property_use_cd not in ( select property_use_cd
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where
								  drcsu.[year] = @year
								  and drcsu.[type] = 'R'
								  and drcsu.group_type = 'X')
	End


-------------------------------------------------------

update @PropData set 
	timber_ag_value = tmp.ag_val
from (
	select
		PropData.[year], PropData.sup_num, PropData.prop_id,
		ag_val = sum( -- Everything but SNR HS
			amlv.ag_value_nhs +
			case when PropData.is_senior = 0 then amlv.ag_value_hs else 0 end
		)
	from @PropData as PropData
	join property_val as pv with (nolock) on
			pv.prop_val_yr = PropData.[year]
		and pv.sup_num = PropData.sup_num
		and pv.prop_id = PropData.prop_id
	join land_detail as ld with (nolock) on
			ld.prop_val_yr = PropData.[year]
		and ld.sup_num = PropData.sup_num
		and ld.prop_id = PropData.prop_id
		and ld.sale_id = 0
	join appr_method_land_value_vw as amlv with(nolock) on
		amlv.prop_val_yr = ld.prop_val_yr and
		amlv.sup_num = ld.sup_num and
		amlv.sale_id = ld.sale_id and
		amlv.prop_id = ld.prop_id and
		amlv.land_seg_id = ld.land_seg_id
	join ag_use with(nolock) on
		ag_use.ag_use_cd = ld.ag_use_cd 
	where ld.ag_apply = 'T' 
	and ag_use.timber = 1 and PropData.has_u500_exemption = 0
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id


update @PropData set 
	prior_timber_ag_value = tmp.ag_val
from (
	select
		PropData.[year], PropData.sup_num, PropData.prop_id,
		ag_val = sum( -- Everything but SNR HS
			amlv.ag_value_nhs +
			case when PropData.is_senior = 0 then amlv.ag_value_hs else 0 end
		)
	from @PropData as PropData
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = PropData.[year]-1
		and psa.prop_id = PropData.prop_id
	join property_val as pv with (nolock) on
			pv.prop_val_yr = PropData.[year]
		and pv.sup_num = PropData.sup_num
		and pv.prop_id = PropData.prop_id
	join land_detail as ld with (nolock) on
			ld.prop_val_yr = PropData.[year]
		and ld.sup_num = PropData.sup_num
		and ld.prop_id = PropData.prop_id
		and ld.sale_id = 0
	join appr_method_land_value_vw as amlv with(nolock) on
		amlv.prop_val_yr = ld.prop_val_yr and
		amlv.sup_num = ld.sup_num and
		amlv.sale_id = ld.sale_id and
		amlv.prop_id = ld.prop_id and
		amlv.land_seg_id = ld.land_seg_id
	join ag_use with(nolock) on
		ag_use.ag_use_cd = ld.ag_use_cd 
	where ld.ag_apply = 'T' 
	and ag_use.timber = 1 and PropData.has_u500_exemption = 0
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id

-------------------------------------------------------


update @PropData set 
	forest_ag_value = tmp.ag_val
from (
	select PropData.[year], PropData.sup_num, PropData.prop_id,
		ag_val = sum( -- Everything but SNR HS
			amlv.ag_value_nhs +
			case when PropData.is_senior = 0 then amlv.ag_value_hs else 0 end
		)
	from @PropData as PropData
	join property_val as pv with (nolock) on
			pv.prop_val_yr = PropData.[year]
		and pv.sup_num = PropData.sup_num
		and pv.prop_id = PropData.prop_id
	join land_detail as ld with (nolock) on
			ld.prop_val_yr = PropData.[year]
		and ld.sup_num = PropData.sup_num
		and ld.prop_id = PropData.prop_id
		and ld.sale_id = 0
	join appr_method_land_value_vw as amlv with(nolock) on
		amlv.prop_val_yr = ld.prop_val_yr and
		amlv.sup_num = ld.sup_num and
		amlv.sale_id = ld.sale_id and
		amlv.prop_id = ld.prop_id and
		amlv.land_seg_id = ld.land_seg_id
	join ag_use with(nolock) on
		ag_use.ag_use_cd = ld.ag_use_cd 
	where ld.ag_apply = 'T' 
	and ag_use.dfl = 1
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id

update @PropData set 
	prior_forest_ag_value = tmp.ag_val
from (
	select PropData.[year], PropData.sup_num, PropData.prop_id,
		ag_val = sum( -- Everything but SNR HS
			amlv.ag_value_nhs +
			case when PropData.is_senior = 0 then amlv.ag_value_hs else 0 end
		)
	from @PropData as PropData
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = PropData.[year]-1
		and psa.prop_id = PropData.prop_id
	join property_val as pv with (nolock) on
		pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		and pv.prop_id = psa.prop_id
	join land_detail as ld with (nolock) on
			ld.prop_val_yr = PropData.[year]
		and ld.sup_num = PropData.sup_num
		and ld.prop_id = PropData.prop_id
		and ld.sale_id = 0
	join appr_method_land_value_vw as amlv with(nolock) on
		amlv.prop_val_yr = ld.prop_val_yr and
		amlv.sup_num = ld.sup_num and
		amlv.sale_id = ld.sale_id and
		amlv.prop_id = ld.prop_id and
		amlv.land_seg_id = ld.land_seg_id
	join ag_use with(nolock) on
		ag_use.ag_use_cd = ld.ag_use_cd 
	where ld.ag_apply = 'T' 
	and ag_use.dfl = 1
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id

-------------------------------------------------------


update @PropData set 
	other_ag_value = tmp.ag_val
from (
	select PropData.[year], PropData.sup_num, PropData.prop_id,
		ag_val = sum( -- Everything but SNR HS
			amlv.ag_value_nhs +
			case when PropData.is_senior = 0 then amlv.ag_value_hs else 0 end
		)
	from @PropData as PropData
	join property_val as pv with (nolock) on
			pv.prop_val_yr = PropData.[year]
		and pv.sup_num = PropData.sup_num
		and pv.prop_id = PropData.prop_id
	join land_detail as ld with (nolock) on
			ld.prop_val_yr = PropData.[year]
		and ld.sup_num = PropData.sup_num
		and ld.prop_id = PropData.prop_id
		and ld.sale_id = 0
	join appr_method_land_value_vw as amlv with(nolock) on
		amlv.prop_val_yr = ld.prop_val_yr and
		amlv.sup_num = ld.sup_num and
		amlv.sale_id = ld.sale_id and
		amlv.prop_id = ld.prop_id and
		amlv.land_seg_id = ld.land_seg_id
	join ag_use with(nolock) on
		ag_use.ag_use_cd = ld.ag_use_cd 
	where ld.ag_apply = 'T' 
	and isnull(ag_use.timber, 0) = 0 and isnull(ag_use.dfl, 0) = 0 
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id

update @PropData set 
	other_land_market_value = tmp.value
from (
	select PropData.[year], PropData.sup_num, PropData.prop_id,
		value = sum( -- Everything but SNR HS
			amlv.mkt_value_nhs +
			case when PropData.is_senior = 0 then amlv.mkt_value_hs else 0 end
		)
	from @PropData as PropData
	join land_detail as ld with (nolock) on
			ld.prop_val_yr = PropData.[year]
		and ld.sup_num = PropData.sup_num
		and ld.prop_id = PropData.prop_id
		and ld.sale_id = 0
	join appr_method_land_value_vw as amlv with(nolock) on
		amlv.prop_val_yr = ld.prop_val_yr and
		amlv.sup_num = ld.sup_num and
		amlv.sale_id = ld.sale_id and
		amlv.prop_id = ld.prop_id and
		amlv.land_seg_id = ld.land_seg_id
	where isnull(ld.ag_apply, 'F') <> 'T' 
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id


----------------------------------------


update @PropData set 
	other_imprv_market_value = tmp.value
from (
	select PropData.[year], PropData.sup_num, PropData.prop_id,
		value = sum( -- Everything but SNR HS
			amiv.value_nhs +
			case when PropData.is_senior = 0 then amiv.value_hs else 0 end
		)
	from @PropData as PropData
	join imprv with (nolock) on
			imprv.prop_val_yr = PropData.[year]
		and imprv.sup_num = PropData.sup_num
		and imprv.prop_id = PropData.prop_id
		and imprv.sale_id = 0
	join appr_method_improvement_value_vw as amiv with(nolock) on
		amiv.prop_val_yr = imprv.prop_val_yr and
		amiv.sup_num = imprv.sup_num and
		amiv.sale_id = imprv.sale_id and
		amiv.prop_id = imprv.prop_id and
		amiv.imprv_id = imprv.imprv_id
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id


update @PropData set 
	prior_other_imprv_market_value = tmp.value
from (
	select PropData.[year], PropData.sup_num, PropData.prop_id,
		value = sum( -- Everything but SNR HS
			amiv.value_nhs +
			case when PropData.is_senior = 0 then amiv.value_hs else 0 end
		)
	from @PropData as PropData
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = PropData.[year]-1
		and psa.prop_id = PropData.prop_id
	join imprv with (nolock) on
			imprv.prop_val_yr = PropData.[year]
		and imprv.sup_num = PropData.sup_num
		and imprv.prop_id = PropData.prop_id
		and imprv.sale_id = 0
	join appr_method_improvement_value_vw as amiv with(nolock) on
		amiv.prop_val_yr = imprv.prop_val_yr and
		amiv.sup_num = imprv.sup_num and
		amiv.sale_id = imprv.sale_id and
		amiv.prop_id = imprv.prop_id and
		amiv.imprv_id = imprv.imprv_id
	group by PropData.[year], PropData.sup_num, PropData.prop_id
) as tmp
join @PropData as PropData on
		PropData.[year] = tmp.[year]
	and PropData.sup_num = tmp.sup_num
	and PropData.prop_id = tmp.prop_id

----------------------------------------




-- if there is any value on the property that is in a current use program, then
-- mark the entire property as in current use
update @PropData set 
	is_current_use = 1
where is_current_use = 0 
and (timber_ag_value > 0 or forest_ag_value > 0 or other_ag_value > 0)

update @PropData set market_value = 0 where market_value is null
update @PropData set senior_value = 0 where senior_value is null
update @PropData set timber_ag_value = 0 where timber_ag_value is null
update @PropData set forest_ag_value = 0 where forest_ag_value is null
update @PropData set other_ag_value = 0 where other_ag_value is null
update @PropData set other_land_market_value = 0 where other_land_market_value is null
update @PropData set other_imprv_market_value = 0 where other_imprv_market_value is null

if (@boe_cert_run_flag = 0) 
begin
	update @PropData set 
		--assessed_value = other_land_market_value  + other_imprv_market_value + other_ag_value,
		stratify_value = stratify_value - timber_ag_value - forest_ag_value
end
else
begin
	update @PropData set 
		assessed_value = other_land_market_value  + other_imprv_market_value + other_ag_value,
		stratify_value = stratify_value - timber_ag_value - forest_ag_value
end
/*
if object_id('_dor_sales_prop_data') is null
begin
	select *
	into _dor_sales_prop_data
	from @PropData
end
*/

-- ================================================================================
-- Stratify the Properties
-- ================================================================================
if @valid_sales = 1
begin
	update @PropData set
		stratum_id = drcs.stratum_id
	from @PropData as tbl
	join dor_report_config_stratum as drcs with (nolock) on
			drcs.[year] = tbl.[year]
		and drcs.[type] = 'R'
		and tbl.assessed_value between drcs.begin_value and drcs.end_value
		and drcs.group_type = tbl.dor_group_type
end


-- ================================================================================
-- Corrolate Sales and Property Data and Combine the Results
-- ================================================================================
-- delete sales records for properties where no property data exists
delete from @SaleData
where prop_id not in (select prop_id from @PropData)

-- Update the main prop_id in the sales data
-- Determine the main prop ID for each sale
-- First consideration is given to whether or not the primary flag was set.
-- Secondary consideration is given for the property with the highest assessed value.
declare @main_prop_lookup table
(
      chg_of_owner_id int,
      bPrimary bit,
      market numeric(14,0),
      prop_id int
      
      unique (chg_of_owner_id, bPrimary, market, prop_id)
)

insert @main_prop_lookup (chg_of_owner_id, bPrimary, market, prop_id)
select distinct sd.chg_of_owner_id, isnull(sd.bPrimary, 0), pv.market, sd.prop_id
from @SaleData sd
join @PropData pd
on sd.prop_id = pd.prop_id
join property_val pv with(nolock)
on pv.prop_id = pd.prop_id
and pv.prop_val_yr = pd.[year]
and pv.sup_num = pd.sup_num


update SaleData
set main_prop_id = mainprop.prop_id
from @SaleData SaleData

cross apply
(
      select top 1 prop_id
      from @main_prop_lookup mpl
      where mpl.chg_of_owner_id = SaleData.chg_of_owner_id
      order by isnull(mpl.bPrimary, 0) desc, mpl.market desc, mpl.prop_id asc
) mainprop

-- insert the combined data into a new table
declare @CombinedData table 
(
	[year] numeric(4, 0),
	sup_num int,
	prop_id int,
	-------------------------------
	-- Property Data
	-------------------------------
	prop_type_cd char(5),
	-- property_val.market,
	market_value numeric(14, 0),
	-- wash_prop_owner_val.taxable_classifed
	senior_value numeric(14, 0),	
	-- land_detail.ag_val for non-homesite land and non-senior homesite land in the timber current use program
	timber_ag_value numeric(14, 0),	
	-- land_detail.ag_val for non-homesite land and non-senior homesite land in the DFL current use program
	forest_ag_value numeric(14, 0),
	-- land_detail.ag_val for non-homesite land and non-senior homesite land where ag_apply is true, 
	-- but the land is not in the timber or DFL program
	other_ag_value numeric(14, 0),  
	-- land_detail.land_seg_mkt_val for non-homesite land and non-senior homesite land where ag_apply is false
	other_land_market_value numeric(14, 0),
	-- imprv.imprv_val for non-homesite improvements and non-senior homesite improvements
	-- How the value is stratified depends on the is_current_use flag (see below) and whether or not
	-- @separate_current_use_group is true
	other_imprv_market_value numeric(14, 0),
	-- the dor use code for the property
	dor_use_cd varchar(10),
	-- a category assigned to the property based on the attribute flags of the dor use code
	dor_group_type char(1),
	-- flag indicating whether or not ther is a senior exemption on the property
	is_senior bit,
	-- flag indicating whether or not the property has a 'U500' exemption
	has_u500_exemption bit,
	-- flag indicating whether or not the property has an 'EX' exemption
	has_ex_exemption bit,
	-- flag indicating that either the entire property is classified as current use property
	-- because of its dor use code, or some portion of the property is in some type of
	-- current use program because a land_detail.ag_apply flag is true.
	is_current_use bit, 
	-------------------------------
	-- Multi-property Sales Data
	-------------------------------
	main_prop_id int,
	summed_market_value numeric(14, 0),

	-------------------------------
	-- Sales Data
	-------------------------------
	chg_of_owner_id int,
	sale_date datetime,
	sale_price numeric(14, 0),
	adj_sale_price numeric(14, 0),
	sale_ratio_type_cd char(5),
	sale_ratio numeric(14,6) null,
	excise_number int,
	invalid_sales_code varchar(5) null,
	invalid_reason varchar(100) null,
	is_valid_sale bit,
	deed_type_cd char(10) null,
	deed_type_desc varchar(50) null,
	land_only_sale bit null,
	land_sale_value numeric(14, 0),

	-------------------------------
	-- Stratification Data
	-------------------------------
	-- the stratum_id of the sale used for calculating stratum ratios based on 
	-- full market value and the adjusted sale price
	ratio_stratum_id int null,
	-- the calculated assessed value used to determine the stratum for the property
	assessed_value numeric(14, 0),  
	prior_assessed_value numeric(14, 0),  
	primary key clustered (year, sup_num, prop_id, chg_of_owner_id)
)

insert into @CombinedData
(
	[year],
	sup_num,
	prop_id,
	chg_of_owner_id,
	main_prop_id,
	prop_type_cd,
	market_value,
	senior_value,
	timber_ag_value,
	forest_ag_value,
	other_ag_value,
	other_land_market_value,
	other_imprv_market_value,
	assessed_value,
	dor_use_cd,
	dor_group_type,
	is_senior,
	has_u500_exemption,
	has_ex_exemption,
	is_current_use,
	sale_date,
	sale_price,
	adj_sale_price,
	sale_ratio_type_cd,
	excise_number,
	invalid_sales_code,
	invalid_reason,
	is_valid_sale,
	deed_type_cd,
	deed_type_desc,
	land_only_sale,
	land_sale_value,
	prior_assessed_value
)
select
	PropData.[year],
	PropData.sup_num,
	PropData.prop_id,
	SaleData.chg_of_owner_id,
	SaleData.main_prop_id,
	PropData.prop_type_cd,
	PropData.market_value,
	PropData.senior_value,
	PropData.timber_ag_value,
	PropData.forest_ag_value,
	PropData.other_ag_value,
	PropData.other_land_market_value,
	PropData.other_imprv_market_value,
	PropData.assessed_value,
	PropData.dor_use_cd,
	PropData.dor_group_type,
	PropData.is_senior,
	PropData.has_u500_exemption,
	PropData.has_ex_exemption,
	PropData.is_current_use,
	SaleData.sale_date,
	SaleData.sale_price,
	SaleData.adj_sale_price,
	SaleData.sale_ratio_type_cd,
	SaleData.excise_number,
	SaleData.invalid_sales_code,
	SaleData.invalid_reason,
	SaleData.is_valid_sale,
	SaleData.deed_type_cd,
	SaleData.deed_type_desc,
	SaleData.land_only_sale,
	SaleData.land_sale_value,
	PropData.prior_assessed_value

from @PropData as PropData
join @SaleData as SaleData on
		SaleData.prop_id = PropData.prop_id


-- ================================================================================
-- Calculate Sales Ratios
-- ================================================================================
-- Update the combined market value for the main property records in the cases 
-- of multi-property sales so that the sale can be stratified
update @CombinedData set 
	summed_market_value = case when (land_only_sale = 1) then isnull(land_value, 0) else summed.market_value end
from @CombinedData as tbl
join (
	select chg_of_owner_id,
		market_value = sum(market_value),
		land_value = sum(land_sale_value)
	from @CombinedData
	group by chg_of_owner_id
) as summed on
		summed.chg_of_owner_id = tbl.chg_of_owner_id
where tbl.prop_id = tbl.main_prop_id


-- calculate a sale ratio based on the market value so the sale can be checked
-- for ratio outlyer validation
update @CombinedData set
	sale_ratio = convert(numeric(14, 6), summed_market_value / adj_sale_price)
where adj_sale_price > 0
	and prop_id = main_prop_id


-- ================================================================================
-- Invalidate Sales Based on Pre-defined Conditions
-- ================================================================================
-- mark sales invalid that are associated with a mobile home property
update @CombinedData set
	is_valid_sale = 0
where prop_type_cd = 'MH'

-- Sales with a sl_price of zero are invalid
update @CombinedData set
	is_valid_sale = 0 
where chg_of_owner_id > 0 and isnull(adj_sale_price, 0) = 0 and prop_id = main_prop_id

-- Determine ratio outlyers
declare @numSales int
select @numSales = count(distinct chg_of_owner_id) from @SaleData

-- Outlyer sales are invalid only if they account for less than 5% of all sales
declare @fivePercentOfSaleCount numeric(18,4)
set @fivePercentOfSaleCount = convert(numeric(18,4), @numSales) * 0.05

declare @countOutlierSales int
select @countOutlierSales = count(*)
from @CombinedData
where chg_of_owner_id > 0 and sale_price is not null and (sale_ratio < 0.25 or sale_ratio > 1.75)

if (@countOutlierSales < @fivePercentOfSaleCount)
begin
	update @CombinedData set
		is_valid_sale = 0,
		invalid_sales_code = '', 
		invalid_reason = isnull(invalid_reason, 'Ratio Outlier')
	where chg_of_owner_id > 0 
	and isnull(invalid_sales_code, '') <> '' -- don't override if something is already there
	and prop_id = main_prop_id
	and (sale_ratio is null or sale_ratio < 0.25 or sale_ratio > 1.75)
end

-- For multi-property sales, if any child property qualifies the sale as
-- invalid, then mark entire sale as invalid
update @CombinedData set
	is_valid_sale = tmp.is_valid_sale
from @CombinedData as tbl
join (
	select 
		chg_of_owner_id, 
		is_valid_sale = convert(bit, min(convert(int, isnull(is_valid_sale, 1))))
	from @CombinedData
	where chg_of_owner_id > 0 
	group by chg_of_owner_id
) as tmp on
		tmp.chg_of_owner_id = tbl.chg_of_owner_id


-- ================================================================================
-- Perform Stratum Ratio Calculations for the Valid Sales Report
-- ================================================================================
-- Stratum ratios are determined using the adjusted sale price and full market 
-- value for the sale as a whole.  The stratum the sale is placed into depends 
-- on the dor use code for the parent property of the sale.
if @valid_sales = 1
begin
	update @CombinedData set
		ratio_stratum_id = drcs.stratum_id
	from @CombinedData as tbl
	join dor_report_config_stratum as drcs with (nolock) on
			drcs.[year] = tbl.[year]
		and drcs.[type] = 'R'
		and tbl.summed_market_value between drcs.begin_value and drcs.end_value
		and drcs.group_type = tbl.dor_group_type
	where tbl.prop_id = tbl.main_prop_id

	-- Update the stratum ratio
	declare @summed_strata_values table 
	(
		stratum_id int,
		stratum_ratio numeric(14, 6),
		primary key clustered (stratum_id)	
	)

	insert into @summed_strata_values (stratum_id, stratum_ratio)
	select 
		drcs.stratum_id,
		stratum_ratio = convert(numeric(14, 6), 100 * (sum(tbl.summed_market_value) / sum(tbl.adj_sale_price)))
	from dor_report_config_stratum as drcs with (nolock)
	join @CombinedData as tbl on
			tbl.ratio_stratum_id = drcs.stratum_id
		and tbl.[year] = drcs.[year]
	where tbl.chg_of_owner_id > 0 
		and tbl.adj_sale_price > 0
		and tbl.is_valid_sale = 1
		and tbl.prop_id = tbl.main_prop_id
	group by drcs.stratum_id

	insert into ##dor_report_sale_strata
	(
		dataset_id,
		sort_order,
		strata_group,
		stratum_min,
		stratum_max,
		number_of_sales,
		assessed_value,
		adjusted_sale_price,
		stratum_ratio
	)
	select
		@dataset_id,
		sort_order = 
			case
			when drcs.group_type = 'R' then 1
			when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 2
			when @separate_current_use_group = 1 and drcs.group_type = 'C' then 2
			when @separate_current_use_group = 1 and drcs.group_type = 'O' then 3
			when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 4
			else null
			end,
		strata_group = 
			case 
			when drcs.group_type = 'R' then
				'Single Family Residence'
			when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 
				'Multifamily Residence, Commercial, Manufacturing, Agricultural, Current Use, Open Space, Other'
			when @separate_current_use_group = 1 and drcs.group_type = 'C' then
				'Multifamily Residence, Commercial, Manufacturing'
			when @separate_current_use_group = 1 and drcs.group_type = 'O' then
				'Agricultural, Current Use, Open Space, Other'
			when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 
				@custom_stratum_name
			else null
			end,
		stratum_min = drcs.begin_value,
		stratum_max = drcs.end_value,
		number_of_sales = count(distinct tbl.chg_of_owner_id),
		assessed_value = avg(tbl.summed_market_value),
		adjusted_sale_price = avg(tbl.adj_sale_price),
		stratum_ratio = ssv.stratum_ratio
	from @CombinedData as tbl
	join dor_report_config_stratum as drcs with (nolock) on
			drcs.stratum_id = tbl.ratio_stratum_id
		and drcs.[year] = tbl.[year]
	left join @summed_strata_values as ssv on
			ssv.stratum_id = tbl.ratio_stratum_id
	where tbl.chg_of_owner_id > 0 and tbl.is_valid_sale = 1 and tbl.prop_id = tbl.main_prop_id
	group by 
		case
		when drcs.group_type = 'R' then 1
		when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 2
		when @separate_current_use_group = 1 and drcs.group_type = 'C' then 2
		when @separate_current_use_group = 1 and drcs.group_type = 'O' then 3
		when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 4
		else null
		end,
		case 
		when drcs.group_type = 'R' then
			'Single Family Residence'
		when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 
			'Multifamily Residence, Commercial, Manufacturing, Agricultural, Current Use, Open Space, Other'
		when @separate_current_use_group = 1 and drcs.group_type = 'C' then
			'Multifamily Residence, Commercial, Manufacturing'
		when @separate_current_use_group = 1 and drcs.group_type = 'O' then
			'Agricultural, Current Use, Open Space, Other'
		when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 
			@custom_stratum_name
		else null
		end,
		drcs.begin_value, drcs.end_value, ssv.stratum_ratio
end



-- ================================================================================
-- Output Data to the Strata Global Temp Tables
-- ================================================================================
if @valid_sales = 1 
begin

if @boe_cert_run_flag <> 1 
	begin
		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_name,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 1,
			strata_group = 'Senior Freeze - Display Only, Not Included in Total',
			stratum_name = '$0 & Over',
			assessed_value = sum(case when senior_value > (senior_value - senior_exemption_loss) then (senior_value - senior_exemption_loss) else senior_value end ),
			stratum_ratio = 100.0,
			market_to_assessed_value = sum(senior_value),
			prior_assessed_value = sum(case when prior_senior_value > (prior_senior_value - prior_senior_exemption_loss) then (prior_senior_value - prior_senior_exemption_loss) else prior_senior_value end )
		from @PropData
		where is_senior = 1 and has_u500_exemption = 0
			--and prop_id in (SELECT prop_id FROM @PropData GROUP BY prop_id HAVING COUNT(prop_id) = 1)
	end
	else
	begin
		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_name,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 1,
			strata_group = 'Senior Freeze',
			stratum_name = '$0 & Over',
			assessed_value = sum(case when senior_value > (senior_value - senior_exemption_loss) then (senior_value - senior_exemption_loss) else senior_value end ),
			stratum_ratio = 100.0,
			market_to_assessed_value = sum(senior_value),
			prior_assessed_value = sum(case when prior_senior_value > (prior_senior_value - prior_senior_exemption_loss) then (prior_senior_value - prior_senior_exemption_loss) else prior_senior_value end )
		from @PropData
		where is_senior = 1 and has_u500_exemption = 0
			--and prop_id in (SELECT prop_id FROM @PropData GROUP BY prop_id HAVING COUNT(prop_id) = 1)
	end
	
	if @boe_cert_run_flag <> 1 
	begin
		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_name,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 2,
			strata_group = 'Forest Land - Display Only, Not Included in Total',
			stratum_name = '$0 & Over',
			assessed_value = sum(forest_ag_value),
			stratum_ratio = 100.0,
			market_to_assessed_value = sum(forest_ag_value),
			prior_assessed_value = sum(prior_forest_ag_value)

		from @PropData
		where forest_ag_value > 0 and dor_use_cd is not null and has_u500_exemption = 0 and has_ex_exemption = 0
			--and prop_id in (SELECT prop_id FROM @PropData GROUP BY prop_id HAVING COUNT(prop_id) = 1)
	end
	else
	begin
		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_name,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 2,
			strata_group = 'Forest Land',
			stratum_name = '$0 & Over',
			assessed_value = sum(forest_ag_value),
			stratum_ratio = 100.0,
			market_to_assessed_value = sum(forest_ag_value),
			prior_assessed_value = sum(prior_forest_ag_value)

		from @PropData
		where forest_ag_value > 0 and dor_use_cd is not null and has_u500_exemption = 0 and has_ex_exemption = 0
			--and prop_id in (SELECT prop_id FROM @PropData GROUP BY prop_id HAVING COUNT(prop_id) = 1)
	end

	insert into ##dor_report_sale_overall
	(
		dataset_id, 
		stata_order,
		strata_group,
		stratum_name,
		assessed_value,
		stratum_ratio,
		market_to_assessed_value,
		prior_assessed_value
	)
	select
		@dataset_id,
		stata_order = 3,
		strata_group = 'Senior Freeze - BOE',
		stratum_name = '$0 & Over',
		assessed_value = @senior_freeze,
		stratum_ratio = 100.0,
		market_to_assessed_value = @senior_freeze,
		prior_assessed_value = @senior_freeze


	insert into ##dor_report_sale_overall
	(
		dataset_id, 
		stata_order,
		strata_group,
		stratum_name,
		assessed_value,
		stratum_ratio,
		market_to_assessed_value,
		prior_assessed_value

	)
	select
		@dataset_id,
		stata_order = 4,
		strata_group = 'Timber Land',
		stratum_name = '$0 & Over',
		assessed_value = sum(timber_ag_value),
		stratum_ratio = 100.0,
		market_to_assessed_value = sum(timber_ag_value),
		prior_assessed_value = sum(prior_timber_ag_value)
	from @PropData
	where timber_ag_value > 0 and dor_use_cd is not null and has_u500_exemption = 0 and has_ex_exemption = 0
			--and prop_id in (SELECT prop_id FROM @PropData GROUP BY prop_id HAVING COUNT(prop_id) = 1)
	
	insert into ##dor_report_sale_overall
	(
		dataset_id, 
		stata_order,
		strata_group,
		stratum_name,
		assessed_value,
		stratum_ratio,
		market_to_assessed_value,
		prior_assessed_value
	)
	select
		@dataset_id,
		stata_order = 5,
		strata_group = 'Forest Land - BOE',
		stratum_name = '$0 & Over',
		assessed_value = @forestland,
		stratum_ratio = 100.0,
		market_to_assessed_value = @forestland,
		prior_assessed_value = @forestland

	-- Insert information for Single Family Residence Only
	insert into ##dor_report_sale_overall
	(
		dataset_id, 
		stata_order,
		strata_group,
		stratum_min,
		stratum_max,
		assessed_value,
		stratum_ratio,
		market_to_assessed_value,
			prior_assessed_value

	)
	select
		@dataset_id,
		stata_order = 6,
		strata_group ='Single Family Residence',
		stratum_min = drcs.begin_value,
		stratum_max = drcs.end_value,
		assessed_value = sum(tbl.assessed_value),
		stratum_ratio = ssv.stratum_ratio,
		market_to_assessed_value = 
			case 
			when ssv.stratum_ratio is null then sum(tbl.assessed_value)
			else sum(tbl.assessed_value) / (ssv.stratum_ratio / 100.0)
			end,
		prior_assessed_value = sum(prior_assessed_value)

	from @PropData as tbl
	join dor_report_config_stratum as drcs with (nolock) on
			drcs.stratum_id = tbl.stratum_id
		and drcs.[year] = tbl.[year]
	left join @summed_strata_values as ssv on
			ssv.stratum_id = tbl.stratum_id
	where drcs.group_type = 'R' and has_u500_exemption = 0 and has_ex_exemption = 0 and is_senior = 0 and timber_ag_value = 0 and forest_ag_value = 0
	group by drcs.begin_value, drcs.end_value, ssv.stratum_ratio
	
	-- Insert value for Commercial and Ag Stratum if grouped together
	-- We also need to include other current use value from the residential stratum
	if @separate_current_use_group = 0
	begin
		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_min,
			stratum_max,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 7,
			strata_group = 'Multifamily Residence, Commercial, Manufacturing, Agricultural, Current Use, Open Space, Other',
			stratum_min = drcs.begin_value,
			stratum_max = drcs.end_value,
			assessed_value = sum(tbl.assessed_value),
			stratum_ratio = ssv.stratum_ratio,
			market_to_assessed_value = 
				case 
				when ssv.stratum_ratio is null then sum(tbl.assessed_value)
				else sum(tbl.assessed_value) / (ssv.stratum_ratio / 100.0)
				end,
			prior_assessed_value = sum(prior_assessed_value)

		from @PropData as tbl
		join dor_report_config_stratum as drcs with (nolock) on
				drcs.stratum_id = tbl.stratum_id
			and drcs.[year] = tbl.[year]
		left join @summed_strata_values as ssv on
				ssv.stratum_id = tbl.stratum_id
		where drcs.group_type in ('C', 'O')and has_u500_exemption = 0 and has_ex_exemption = 0 and is_senior = 0 and timber_ag_value = 0 and forest_ag_value = 0
		group by drcs.begin_value, drcs.end_value, ssv.stratum_ratio
	end
	else
	begin
		-- Otherwise, insert commercial, then separate lines for Land and Improvement Value on Current Use
		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_min,
			stratum_max,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 7,
			strata_group = 'Multifamily Residence, Commercial, Manufacturing',
			stratum_min = drcs.begin_value,
			stratum_max = drcs.end_value,
			assessed_value = sum(tbl.assessed_value),
			stratum_ratio = ssv.stratum_ratio,
			market_to_assessed_value = 
				case 
				when ssv.stratum_ratio is null then sum(tbl.assessed_value)
				else sum(tbl.assessed_value) / (ssv.stratum_ratio / 100.0)
				end,
			prior_assessed_value = sum(prior_assessed_value)

		from @PropData as tbl
		join dor_report_config_stratum as drcs with (nolock) on
				drcs.stratum_id = tbl.stratum_id
			and drcs.[year] = tbl.[year]
		left join @summed_strata_values as ssv on
				ssv.stratum_id = tbl.stratum_id
		where drcs.group_type = 'C' and has_u500_exemption = 0 and has_ex_exemption = 0 and is_senior = 0 and timber_ag_value = 0 and forest_ag_value = 0
		group by drcs.begin_value, drcs.end_value, ssv.stratum_ratio

		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_min,
			stratum_max,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 8,
			strata_group = 'Agricultural, Current Use, Open Space, Other Land',
			stratum_min = drcs.begin_value,
			stratum_max = drcs.end_value,
			assessed_value = sum(tbl.assessed_value - tbl.other_imprv_market_value),
			stratum_ratio = ssv.stratum_ratio,
			market_to_assessed_value = 
				case 
				when ssv.stratum_ratio is null then sum(tbl.assessed_value - tbl.other_imprv_market_value)
				else sum(tbl.assessed_value - tbl.other_imprv_market_value) / (ssv.stratum_ratio / 100.0)
				end,
			prior_assessed_value = sum(tbl.prior_assessed_value - tbl.prior_other_imprv_market_value)
		from @PropData as tbl
		join dor_report_config_stratum as drcs with (nolock) on
				drcs.stratum_id = tbl.stratum_id
			and drcs.[year] = tbl.[year]
		left join @summed_strata_values as ssv on
				ssv.stratum_id = tbl.stratum_id
		where drcs.group_type = 'O' and has_u500_exemption = 0 and has_ex_exemption = 0  and is_senior = 0 and timber_ag_value = 0 and forest_ag_value = 0
		group by drcs.begin_value, drcs.end_value, ssv.stratum_ratio

		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_min,
			stratum_max,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value

		)
		select
			@dataset_id,
			stata_order = 9,
			strata_group = 'Agricultural, Current Use, Open Space, Other Improvement',
			stratum_min = drcs.begin_value,
			stratum_max = drcs.end_value,
			assessed_value = sum(tbl.other_imprv_market_value),
			stratum_ratio = ssv.stratum_ratio,
			market_to_assessed_value = 
				case 
				when ssv.stratum_ratio is null then sum(tbl.other_imprv_market_value)
				else sum(tbl.other_imprv_market_value) / (ssv.stratum_ratio / 100.0)
				end,
			prior_assessed_value = sum(tbl.prior_other_imprv_market_value)
		from @PropData as tbl
		join dor_report_config_stratum as drcs with (nolock) on
				drcs.stratum_id = tbl.stratum_id
			and drcs.[year] = tbl.[year]
		left join @summed_strata_values as ssv on
				ssv.stratum_id = tbl.stratum_id
		where drcs.group_type = 'O' and has_u500_exemption = 0 and has_ex_exemption = 0  and is_senior = 0 and timber_ag_value = 0 and forest_ag_value = 0
		group by drcs.begin_value, drcs.end_value, ssv.stratum_ratio
	end
end

	
-- Insert value for Custom Stratum if grouped together
if @use_custom_stratum = 1 and @custom_stratum_exists = 1
	begin
		insert into ##dor_report_sale_overall
		(
			dataset_id, 
			stata_order,
			strata_group,
			stratum_min,
			stratum_max,
			assessed_value,
			stratum_ratio,
			market_to_assessed_value,
			prior_assessed_value
		)
		select
			@dataset_id,
			stata_order = 90,
			strata_group = @custom_stratum_name,
			stratum_min = drcs.begin_value,
			stratum_max = drcs.end_value,
			assessed_value = sum(tbl.assessed_value),
			stratum_ratio = ssv.stratum_ratio,
			market_to_assessed_value = 
				case 
				when ssv.stratum_ratio is null then sum(tbl.assessed_value)
				else sum(tbl.assessed_value) / (ssv.stratum_ratio / 100.0)
				end,
			prior_assessed_value = sum(prior_assessed_value)

		from @PropData as tbl
		join dor_report_config_stratum as drcs with (nolock) on
				drcs.stratum_id = tbl.stratum_id
			and drcs.[year] = tbl.[year]
		left join @summed_strata_values as ssv on
				ssv.stratum_id = tbl.stratum_id
		where drcs.group_type in ('X')and has_u500_exemption = 0 and has_ex_exemption = 0 and is_senior = 0 and timber_ag_value = 0 and forest_ag_value = 0
		group by drcs.begin_value, drcs.end_value, ssv.stratum_ratio
end

-- ================================================================================
-- Output Data to the Details Global Temp Table
-- ================================================================================
-- Gather information about multiproperty sales and insert it into the combined data
declare @MultiPropData table
(
	chg_of_owner_id int,
	prop_count int,
	excise_number int,
	sale_date datetime,
	sale_price numeric(14, 0),
	adj_sale_price numeric(14, 0),
	market_value numeric(14, 0),
	sale_ratio numeric(14, 6),
	primary key clustered (chg_of_owner_id)
)

insert into @MultiPropData
(
	chg_of_owner_id,
	prop_count,
	excise_number,
	sale_date,
	sale_price,
	adj_sale_price,
	market_value
)
select
	chg_of_owner_id,
	count(prop_id),
	excise_number,
	sale_date,
	sale_price,
	adj_sale_price,
	sum(market_value)
from @CombinedData
group by
	chg_of_owner_id,
	excise_number,
	sale_date,
	sale_price,
	adj_sale_price

delete from @MultiPropData where prop_count = 1

delete from @MultiPropData 
where chg_of_owner_id in (select chg_of_owner_id from @CombinedData where is_valid_sale = case @valid_sales when 0 then 1 else 0 end)

-- calculate a sale ratio based on the summed market value so the 
-- ratio can be properly reported
update @MultiPropData set
	sale_ratio = convert(numeric(14, 6), market_value / adj_sale_price)
where adj_sale_price > 0

insert into ##dor_report_sale_detail
(
	dataset_id,
	chg_of_owner_id,
	excise_number,
	main_prop_id,
	prop_id,
	sale_date,
	sale_price,
	adjusted_sale_price,
	dor_use_cd,
	assessed_val,
	sale_ratio,
	sl_ratio_type_cd,
	invalid_sales_code,
	invalid_reason,
	prop_type_cd,
	sort_order,
	stratum_group,
	stratum_min,
	stratum_max,
	stratum_ratio,
	deed_type_cd,
	deed_type_desc,
	prior_assessed_val,
	land_only_sale

)
select
	@dataset_id,
	MultiPropData.chg_of_owner_id,
	MultiPropData.excise_number,
	null,
	null,
	MultiPropData.sale_date,
	MultiPropData.sale_price,
	MultiPropData.adj_sale_price,
	pu.dor_use_code,
	CombinedData.summed_market_value,
	MultiPropData.sale_ratio,
	null,
	null,
	null,
	null,
	sort_order = case
		when drcs.group_type = 'R' then 1
		when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 2
		when @separate_current_use_group = 1 and drcs.group_type = 'C' then 2
		when @separate_current_use_group = 1 and drcs.group_type = 'O' then 3
		when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 4
		else null
	end,
	stratum_group = case 
		when drcs.group_type = 'R' then
			'Single Family Residence'
		when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 
			'Multifamily Residence, Commercial, Manufacturing, Agricultural, Current Use, Open Space, Other'
		when @separate_current_use_group = 1 and drcs.group_type = 'C' then
			'Multifamily Residence, Commercial, Manufacturing'
		when @separate_current_use_group = 1 and drcs.group_type = 'O' then
			'Agricultural, Current Use, Open Space, Other'
		when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 
			@custom_stratum_name
		else null
	end,
	stratum_min = drcs.begin_value,
	stratum_max = drcs.end_value,
	null,
	CombinedData.deed_type_cd,
	CombinedData.deed_type_desc,
	CombinedData.prior_assessed_value,
	CombinedData.land_only_sale
from @MultiPropData as MultiPropData
join @CombinedData as CombinedData on
		CombinedData.chg_of_owner_id = MultiPropData.chg_of_owner_id
	and CombinedData.prop_id = CombinedData.main_prop_id
join property_val as pv with(nolock) on
	pv.prop_val_yr = CombinedData.year and
	pv.sup_num = CombinedData.sup_num and
	pv.prop_id = CombinedData.main_prop_id
left outer join property_use as pu with(nolock) on
	pu.property_use_cd = pv.property_use_cd
left outer join dor_use_code with(nolock) on
	dor_use_code.sub_cd = pu.dor_use_code
join dor_report_config_stratum as drcs with (nolock) on
		drcs.[year] = CombinedData.[year]
	and MultiPropData.market_value between drcs.begin_value and drcs.end_value
	--and (MultiPropData.sale_ratio < 25 or  MultiPropData.sale_ratio > 175)
	and drcs.group_type = CombinedData.dor_group_type

-- For child properties in a sale, eliminate irrelevant info so that 
-- the info isn't displayed in the report
--update @CombinedData set 
--	sale_date = null,
--	sale_price = null,
--	adj_sale_price = null,
--	market_value = null,
--	summed_market_value = null,
--	sale_ratio = null
--where chg_of_owner_id in (select chg_of_owner_id from @MultiPropData)

if @valid_sales is not null 
begin
	insert into ##dor_report_sale_detail
	(
		dataset_id,
		chg_of_owner_id,
		excise_number,
		main_prop_id,
		prop_id,
		sale_date,
		sale_price,
		adjusted_sale_price,
		dor_use_cd,
		assessed_val,
		sale_ratio,
		sl_ratio_type_cd,
		invalid_sales_code,
		invalid_reason,
		prop_type_cd,
		sort_order,
		stratum_group,
		stratum_min,
		stratum_max,
		stratum_ratio,
		deed_type_cd,
		deed_type_desc,
		prior_assessed_val,
		land_only_sale
	)
	select
		@dataset_id,
		CombinedData.chg_of_owner_id,
		CombinedData.excise_number,
		CombinedData.main_prop_id,
		CombinedData.prop_id,
		CombinedData.sale_date,
		CombinedData.sale_price,
		CombinedData.adj_sale_price,
		CombinedData.dor_use_cd,
		CombinedData.summed_market_value,
		CombinedData.sale_ratio,
		CombinedData.sale_ratio_type_cd,
		CombinedData.invalid_sales_code,
		CombinedData.invalid_reason,
		CombinedData.prop_type_cd,
		sort_order = case
			when drcs.group_type = 'R' then 1
			when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 2
			when @separate_current_use_group = 1 and drcs.group_type = 'C' then 2
			when @separate_current_use_group = 1 and drcs.group_type = 'O' then 3
			when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 4
			else null
		end,
		stratum_group = case 
			when drcs.group_type = 'R' then
				'Single Family Residence'
			when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 
				'Multifamily Residence, Commercial, Manufacturing, Agricultural, Current Use, Open Space, Other'
			when @separate_current_use_group = 1 and drcs.group_type = 'C' then
				'Multifamily Residence, Commercial, Manufacturing'
			when @separate_current_use_group = 1 and drcs.group_type = 'O' then
				'Agricultural, Current Use, Open Space, Other'
			when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 
				@custom_stratum_name
			else null
		end,
		stratum_min = drcs.begin_value,
		stratum_max = drcs.end_value,
		null,
		CombinedData.deed_type_cd,
		CombinedData.deed_type_desc,
		CombinedData.prior_assessed_value,
		CombinedData.land_only_sale
	from @CombinedData as CombinedData
	left join dor_report_config_stratum as drcs with (nolock) on
			drcs.stratum_id = CombinedData.ratio_stratum_id
		and drcs.[year] = CombinedData.[year]
	where CombinedData.is_valid_sale = @valid_sales
	--and (CombinedData.sale_ratio < 25 or CombinedData.sale_ratio > 175)
end
else
begin
	-- in this case, we don't care whether sales are valid or not, we are simply 
	-- needing the sales ratios to be calculated for the sales check report
	insert into ##dor_report_sale_detail
	(
		dataset_id,
		chg_of_owner_id,
		excise_number,
		main_prop_id,
		prop_id,
		sale_date,
		sale_price,
		adjusted_sale_price,
		dor_use_cd,
		assessed_val,
		sale_ratio,
		sl_ratio_type_cd,
		invalid_sales_code,
		invalid_reason,
		prop_type_cd,
		sort_order,
		stratum_group,
		stratum_min,
		stratum_max,
		stratum_ratio,
		deed_type_cd,
		deed_type_desc,
		prior_assessed_val,
		land_only_sale
	)
	select
		@dataset_id,
		CombinedData.chg_of_owner_id,
		CombinedData.excise_number,
		CombinedData.main_prop_id,
		CombinedData.prop_id,
		CombinedData.sale_date,
		CombinedData.sale_price,
		CombinedData.adj_sale_price,
		CombinedData.dor_use_cd,
		CombinedData.summed_market_value,
		CombinedData.sale_ratio,
		CombinedData.sale_ratio_type_cd,
		CombinedData.invalid_sales_code,
		CombinedData.invalid_reason,
		CombinedData.prop_type_cd,
		sort_order = case
			when drcs.group_type = 'R' then 1
			when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 2
			when @separate_current_use_group = 1 and drcs.group_type = 'C' then 2
			when @separate_current_use_group = 1 and drcs.group_type = 'O' then 3
			when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 4
			else null
		end,
		stratum_group = case 
			when drcs.group_type = 'R' then
				'Single Family Residence'
			when @separate_current_use_group = 0 and drcs.group_type in ('C', 'O') then 
				'Multifamily Residence, Commercial, Manufacturing, Agricultural, Current Use, Open Space, Other'
			when @separate_current_use_group = 1 and drcs.group_type = 'C' then
				'Multifamily Residence, Commercial, Manufacturing'
			when @separate_current_use_group = 1 and drcs.group_type = 'O' then
				'Agricultural, Current Use, Open Space, Other'
			when @use_custom_stratum = 1 and @custom_stratum_exists = 1 and drcs.group_type = 'X' then 
				@custom_stratum_name
			else null
		end,
		stratum_min = drcs.begin_value,
		stratum_max = drcs.end_value,
		null,
		CombinedData.deed_type_cd,
		CombinedData.deed_type_desc,
		CombinedData.prior_assessed_value,
		CombinedData.land_only_sale
	from @CombinedData as CombinedData
	left join dor_report_config_stratum as drcs with (nolock) on
			drcs.stratum_id = CombinedData.ratio_stratum_id
		and drcs.[year] = CombinedData.[year]
		--where (CombinedData.sale_ratio < 25 or CombinedData.sale_ratio > 175)
end

-- child properties in a multi-property sale do not have a ratio_stratum_id 
-- value, so information will need to be updated for these properties
update ##dor_report_sale_detail set 
	sort_order = parent.sort_order,
	stratum_group = parent.stratum_group,
	stratum_min = parent.stratum_min,
	stratum_max = parent.stratum_max
from ##dor_report_sale_detail
join ##dor_report_sale_detail as parent on
		parent.chg_of_owner_id = ##dor_report_sale_detail.chg_of_owner_id
	and parent.main_prop_id is null
where ##dor_report_sale_detail.sort_order is null

-- multi-prop sales have the adj sales price being accounted for multiple times, this takes care of that

update ##dor_report_sale_detail set
	adjusted_sale_price = null
from ##dor_report_sale_detail
where sale_ratio is null

-- ================================================================================
-- Process DOR 08 Validation Only If Needed
-- ================================================================================
if @valid_sales = 0 and @run_08_validation_only = 1
begin
	-- We are only interested in categorizing the main records for the sale,
	-- i.e., delete any child property rows for multiple-property sales.
	delete from ##dor_report_sale_detail
	where dataset_id = @dataset_id and main_prop_id <> prop_id

	-- We only want to report sales coded with an '08' invalid code, but 
	-- which don't meet the sales ratio outlyer criteria.
	delete from ##dor_report_sale_detail
	where dataset_id = @dataset_id and 
	(
		isnull(sl_ratio_type_cd, 'NULL') <> '08' 
	or (sl_ratio_type_cd = '08' and (sale_ratio <= .25 or sale_ratio >= 1.75))
	)

	declare @count_of_valid_sales int
	declare @count_of_08_coded_sales int
	declare @count_ratio numeric(8, 4)

	select @count_of_valid_sales = count(distinct chg_of_owner_id)
	from @CombinedData
	where chg_of_owner_id > 0 
	and prop_id = main_prop_id
	and is_valid_sale = 1

	select @count_of_08_coded_sales = count(distinct chg_of_owner_id)
	from @CombinedData
	where chg_of_owner_id > 0 
	and prop_id = main_prop_id
	and is_valid_sale = 0 
	and sale_ratio_type_cd = '08'

	set @count_ratio = 
		convert(numeric(8,4), @count_of_08_coded_sales) / convert(numeric(8,4), @count_of_valid_sales)

	if @count_ratio >= .05
	begin
		update ##dor_report_sale_detail set 
			sl_ratio_type_cd = '08***'
		where dataset_id = @dataset_id and sl_ratio_type_cd = '08'
	end
end

if (@boe_cert_run_flag = 1)
begin
	declare @BOECert table (
		value_group varchar(255) not null,
		value numeric(14,0) null
	)
	declare @value numeric(14,0)
	
	select @value = sum(assessed_value)
	from ##dor_report_sale_overall
	where dataset_id = @dataset_id and strata_group = 'Forest Land'
	set @value = isnull(@value, 0)
	insert @BOECert (value_group, value)
	values ('Forest Land Assessed Value', @value)

	select @value = sum(assessed_value)
	from ##dor_report_sale_overall
	where dataset_id = @dataset_id and strata_group = 'Agricultural, Current Use, Open Space, Other Land'
	set @value = isnull(@value, 0)
	insert @BOECert (value_group, value)
	values ('Current Use Land Assessed Value', @value)

	select @value = sum(assessed_value)
	from ##dor_report_sale_overall
	where dataset_id = @dataset_id and strata_group = 'Agricultural, Current Use, Open Space, Other Improvement'
	set @value = isnull(@value, 0)
	insert @BOECert (value_group, value)
	values ('Improvement Value on Current Use Lands', @value)

	select @value = sum(assessed_value)
	from ##dor_report_sale_overall
	where dataset_id = @dataset_id and strata_group = 'Senior Freeze'
	set @value = isnull(@value, 0)
	insert @BOECert (value_group, value)
	values ('Senior Freeze Assesseed Value', @value)

	if @use_custom_stratum = 1 and @custom_stratum_exists = 1
	Begin
		select @value = sum(assessed_value)
		from ##dor_report_sale_overall
		where dataset_id = @dataset_id and strata_group like '%Custom Stratum%'
		set @value = isnull(@value, 0)
		insert @BOECert (value_group, value)
		values (@custom_stratum_name, @value)
	end
	
	select @value = sum(assessed_value)
	from ##dor_report_sale_overall
	where dataset_id = @dataset_id and strata_group in(
		'Timber Land','Single Family Residence',
		'Multifamily Residence, Commercial, Manufacturing'
	)
	set @value = isnull(@value, 0)
	insert @BOECert (value_group, value)
	values ('Real Property Assessed Value (Excluding Items 1-4)', @value)

	select @value = sum(value)
	from @BOECert
	insert @BOECert (value_group, value)
	values ('Total Taxable Assessed Value of Real Property (Total of items 1-5)', @value)
	
	declare @total_value numeric(14,0)
	set @total_value = @value

	select @value = sum(wpov.taxable_classified + wpov.taxable_non_classified - wpov.new_val_hs - wpov.new_val_nhs) -- Yes, the _hs & _nhs columns, not the _p column ; this is because of imp on leased land, and the reqs say to deduct new *construction* value
	from (
		select
			pv.prop_val_yr,
			sup_num = max(pv.sup_num),
			pv.prop_id
		from property_val as pv with(nolock) 
		where pv.prop_val_yr = @year and pv.sup_num <= @as_of_sup_num
		group by pv.prop_val_yr, pv.prop_id
	) as psa
	join property_val as pv with(nolock) on
		pv.prop_val_yr = psa.prop_val_yr and
		pv.sup_num = psa.sup_num and
		pv.prop_id = psa.prop_id
	join property as p with(nolock) on
		p.prop_id = psa.prop_id
	join wash_prop_owner_val as wpov with(nolock) on
		wpov.year = pv.prop_val_yr and
		wpov.sup_num = pv.sup_num and
		wpov.prop_id = pv.prop_id
	left outer join property_sub_type as pst with(nolock) on
		pst.property_sub_cd = pv.sub_type
	where
		(p.prop_type_cd in ('P','A') or pst.imp_leased_land = 1) and
		pv.prop_inactive_dt is null and
		isnull(pst.state_assessed_utility, 0) = 0 and
		isnull(pst.local_assessed_utility, 0) = 0 and
		isnull(pv.prop_state, '') <> 'P' and
		isnull(p.reference_flag, '') <> 'T'
	set @value = isnull(@value, 0)
	
	insert @BOECert (value_group, value)
	values ('Personal Property Assessed Value', @value)
	
	set @total_value = @total_value + @value
	insert @BOECert (value_group, value)
	values ('Total County Locally Assessed Value (Total of items 6-7)', @total_value)

	-- cleanup report tables that aren't used for the BOE cert run
	delete from ##dor_report_sale_overall where dataset_id = @dataset_id
	delete from ##dor_report_sale_strata where dataset_id = @dataset_id
	delete from ##dor_report_sale_detail where dataset_id = @dataset_id

	-- select output
	set nocount off
	select * from @BOECert
end

IF OBJECT_ID('tempdb..#PropDataCopy') IS NOT NULL
drop table #PropDataCopy

GO

