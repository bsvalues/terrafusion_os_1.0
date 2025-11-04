
create procedure [dbo].[DORReportStratification]
	@dataset_id int,
	@year numeric(4,0),
	@as_of_sup_num int,
	
	@bReal bit -- When 1, the Real property report, else the Personal property report
	
as

set nocount on

	declare @Assess_Using_GEO_ID char(1)
	select @Assess_Using_GEO_ID = 
		szConfigValue
		from pacs_config
		where szGroup = 'DORAssessedValueReport' 
		and szConfigName = 'Assess_Using_GEO_ID'




-- Determine report options
declare
    @exclude_current_use bit,
    @separate_current_use_group bit,
    @use_custom_stratum bit,
		@sale_date_begin datetime,
		@sale_date_end datetime,
		@custom_stratum_exists bit


select
    @exclude_current_use = exclude_current_use,
    @separate_current_use_group = isnull(separate_current_use_group, 0),
    @use_custom_stratum = isnull(use_custom_stratum, 0),
		@sale_date_begin = sale_date_begin,
		@sale_date_end = sale_date_end
from dor_report_config with(nolock)
where [year] = @year
and [type] = 'R'


	      
  -- Table variable to hold the staging data
  -- This is what we will operate upon to create the data
  create table #tblReport (
				dataset_id int not null, --new
		year numeric(4,0) not null,
		sup_num int not null,
		prop_id int not null,
		geo_id varchar(50) null,
		
		stratum_id int not null,
		owner_name varchar(70) not null,
		addr_line1 varchar(60) not null,
		addr_line2 varchar(60) not null,
		addr_line3 varchar(60) not null,
		addr_city varchar(50) not null,
		addr_state varchar(50) not null,
		addr_zip varchar(5) not null,
		dor_land_use_code varchar(10) not null,
		assessed_value numeric(14,0) not null,
		dba_name varchar(50) not null,

		is_sample bit not null,
		is_ioll bit not null,
		overall_flag bit not null,
		senior_flag bit not null,
		senior_value numeric(14,0) not null,
		forestland_flag bit not null,
		forestland_value numeric(14,0) not null,
		properties_under_flag bit not null,

		dor_use_singlefamily_flag bit not null,
		dor_use_commercial_flag bit not null,
		dor_use_other_flag bit not null,

		timberland_value numeric(14,0) not null,
		dor_use_custom_flag bit not null,
		property_use_cd varchar(10) null,
		prior_assessed_value numeric(14,0)


		primary key clustered (year, sup_num, prop_id)
		with fillfactor = 100
  )
			  

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
      
      
      
      
	declare
		@stratum_id int,
		@group_type char(1),
		@begin_value numeric(14,0),
		@end_value numeric(14,0),
		@sample_frequency int,
		@sample_start int
	declare
		@index int,
		@indexNextSample int,
		@prop_id int
					
					      
      
	-- PROPERTY ID REPORTS
	if (@Assess_Using_GEO_ID = 0 or @bReal = 0) begin		
	
				-- Build the as of sup num table
			create table #tblAsOfSupNum 
			(
				  year numeric(4,0) not null,
				  sup_num int not null,
				  prop_id int not null,
				  primary key clustered (year, sup_num, prop_id)
			)	
			      
			insert #tblAsOfSupNum (year, sup_num, prop_id)
			select
				pv.prop_val_yr, max(pv.sup_num), pv.prop_id
			from property_val as pv with(nolock)
			where pv.prop_val_yr = @year
			and pv.sup_num <= @as_of_sup_num
			group by pv.prop_val_yr, pv.prop_id

			delete from #tblAsOfSupNum
			from #tblAsOfSupNum
			join property_val as pv with(nolock) on
									pv.prop_val_yr = #tblAsOfSupNum.[year]
						and pv.prop_id = #tblAsOfSupNum.prop_id
						and pv.sup_num = #tblAsOfSupNum.sup_num
			left join property_sub_type as pst with (nolock) on
							pv.sub_type = pst.property_sub_cd
			where
						pv.prop_inactive_dt is not null --Exclude deleted and udi parents
						or isnull(pst.state_assessed_utility, 0) = 1 -- State assessed utilities are always excluded


			delete from #tblAsOfSupNum
			from #tblAsOfSupNum
			join property_val as pv with (nolock) on
									pv.prop_val_yr = #tblAsOfSupNum.[year]
						and pv.prop_id = #tblAsOfSupNum.prop_id
						and pv.sup_num = #tblAsOfSupNum.sup_num
			join property as p with(nolock) on
				p.prop_id = pv.prop_id
			left join property_sub_type as pst with (nolock) on 
						pv.sub_type = pst.property_sub_cd 
			where not
			(
				(@bReal = 1 and p.prop_type_cd in ('R','MH') and isnull(pst.imp_leased_land, 0) = 0)
				or
				(
					@bReal = 0
					and
					(
						p.prop_type_cd in ('A','P')
						or
						(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 1)
					)
				)
			)

			-- State bid timber is always excluded on personal
			-- Boats are always excluded on personal
			if (@bReal = 0)
			begin
				  delete from #tblAsOfSupNum
				  from #tblAsOfSupNum
				  join property_val as pv with(nolock) on
							  pv.prop_val_yr = #tblAsOfSupNum.[year]
						and pv.prop_id = #tblAsOfSupNum.prop_id
						and pv.sup_num = #tblAsOfSupNum.sup_num
				  left join property_sub_type as pst with (nolock) on 
						pv.sub_type = pst.property_sub_cd 
				  where isnull(pst.state_bid_timber, 0) = 1 
						or isnull(pst.boat, 0) = 1
			end


			-- Exempt properties are always excluded
			delete from #tblAsOfSupNum
			from #tblAsOfSupNum
			join owner as o with (nolock) on 
						o.owner_Tax_yr = #tblAsOfSupNum.[year]    
				  and o.prop_id = #tblAsOfSupNum.prop_id
				  and o.sup_num = #tblAsOfSupNum.sup_num
			join property_exemption as pe with(nolock) on
						pe.owner_tax_yr = #tblAsOfSupNum.[year]
				  and   pe.sup_num = #tblAsOfSupNum.sup_num 
				  and   pe.prop_id = #tblAsOfSupNum.prop_id 
				  and   pe.owner_id = o.owner_id 
				  and   pe.exmpt_type_cd = 'EX'


			-- Timberland properties are always excluded on real
			if @bReal = 1
			begin
				  delete from #tblAsOfSupNum
				  where exists 
				  (
						select *
						from land_detail as ld with(nolock)
						join ag_use with(nolock) on
								ag_use.ag_use_cd = ld.ag_use_cd 
							  and ag_use.timber = 1
						where
								ld.prop_val_yr = #tblAsOfSupNum.[year]
							  and ld.sup_num = #tblAsOfSupNum.sup_num
							  and ld.sale_id = 0 
							  and   ld.prop_id = #tblAsOfSupNum.prop_id
								and ld.ag_apply = 'T'
				  )

				  -- Exclude current use properties on real if so configured
				  if @exclude_current_use = 1
				  begin
						delete from #tblAsOfSupNum
						from #tblAsOfSupNum
						join property_val as pv with(nolock) on
									pv.prop_val_yr = #tblAsOfSupNum.[year]
							  and pv.prop_id = #tblAsOfSupNum.prop_id
							  and pv.sup_num = #tblAsOfSupNum.sup_num
						left join property_sub_type as pst with (nolock) on 
									pv.sub_type = pst.property_sub_cd 
						where isnull(pv.ag_use_val, 0) + isnull(pv.timber_use, 0) + isnull(pv.ag_hs_use_val, 0) + isnull(pv.timber_hs_use_val, 0) > 0
				  end
			end

			
				
			  
			  insert #tblReport (
							dataset_id,--new
					year,
					sup_num,
					prop_id,
					stratum_id,
					owner_name,
					addr_line1,
					addr_line2,
					addr_line3,
					addr_city,
					addr_state,
					addr_zip,
					dor_land_use_code,
					assessed_value,
					dba_name,
					is_sample,
					is_ioll,
					overall_flag,
					senior_flag,
					senior_value,
					forestland_flag,
					forestland_value,
					properties_under_flag,
					dor_use_singlefamily_flag,
					dor_use_commercial_flag,
					dor_use_other_flag,
					timberland_value,
					dor_use_custom_flag,
					property_use_cd
			  )
			  select
							@dataset_id as dataset_id,
					pv.prop_val_yr,
					pv.sup_num,
					pv.prop_id,

					-1, -- stratum_id
					isnull(acct.file_as_name, ''),
					isnull(addr.addr_line1, ''),
					isnull(addr.addr_line2, ''),
					isnull(addr.addr_line3, ''),
					isnull(addr.addr_city, ''),
					isnull(addr.addr_state, ''),
					isnull(addr.zip, ''),
					isnull(dor_use_code.sub_cd, ''),
					case
						  when isnull(dor_use_code.current_use, 0) = 1 
											or isnull(pv.market, 0) < 1000 then isnull(pv.market, 0)
						  when @bReal = 1 then isnull(pv.assessed_val, 0)
						  else isnull(pv.assessed_val, 0) - isnull(wpoe_hof.exempt_value, 0)
					end, -- assessed_value
					isnull(p.dba_name, ''),
					0, -- is_sample
					isnull(pst.imp_leased_land, 0), -- is_ioll
					0, -- overall_flag,
					case when wpoe_snr.year is null then 0 else 1 end, -- senior_flag
					case when wpoe_snr.year is null then 0 else wpov.appraised_classified end, -- senior_value
					case when land_info.forest_nhs > 0 or land_info.forest_hs > 0 then 1 else 0 end, -- forestland_flag,
					forestland_value =	isnull(land_info.forest_nhs, 0) + case when wpoe_snr.year is null then isnull(land_info.forest_hs, 0) else 0 end, --forestland_value
					0,  -- properties_under_flag,

					isnull(dor_use_code.residential, 0),  --dor_use_singlefamily_flag
					case
						  when @separate_current_use_group = 1 and
						  (isnull(dor_use_code.multifamily, 0) = 1
						  or isnull(dor_use_code.commercial, 0) = 1
						  or isnull(dor_use_code.industrial, 0) = 1
						  or isnull(dor_use_code.mh_park, 0) = 1)
						  then 1 else 0 
					end, -- dor_use_commercial_flag           
					case
						  when isnull(dor_use_code.residential, 0) = 1 
						  or 
						  (@separate_current_use_group = 1 and
								(isnull(dor_use_code.multifamily, 0) = 1
								 or isnull(dor_use_code.commercial, 0) = 1
								 or isnull(dor_use_code.industrial, 0) = 1
								 or isnull(dor_use_code.mh_park, 0) = 1)
						  )
						  then 0 else 1
					end, -- dor_use_other_flag
					timberland_value = isnull(land_info.timber_nhs, 0) + case when wpoe_snr.year is null then isnull(land_info.timber_hs, 0) else 0 end, --timberland_value
					case
						  when  
						  ( @bReal = 1 and
							@use_custom_stratum = 1 and
								(pv.property_use_cd in ( select property_use_cd
									from dor_report_config_stratum_use_codes drcsu with(nolock)
									where drcsu.[year] = @year
										  and drcsu.[type] = 'R'
										  and drcsu.group_type = 'X'))
							and (pv.property_use_cd not in ( select property_use_cd
									from dor_report_config_stratum_use_codes drcsu with(nolock)
									where drcsu.[year] = @year
										  and drcsu.[type] = 'R'
										  and drcsu.group_type in ('R', 'C', 'O')))
						  )
						  then 1 else 0
					end, -- dor_use_custom_flag - Set flag only for those use codes that are not already selected in other stratums to keep the Prop Id unique in the report
					pv.property_use_cd
					
			  from property_val as pv with(nolock)
			  join #tblAsOfSupNum as asof on
				--			asof.dataset_id = @dataset_id and --new
					asof.year = pv.prop_val_yr and
					asof.sup_num = pv.sup_num and
					asof.prop_id = pv.prop_id
				cross apply (
					select top 1 ow.*
					from owner ow with(nolock)
					where ow.owner_tax_yr = pv.prop_val_yr
					and ow.sup_num = pv.sup_num
					and ow.prop_id = pv.prop_id
					order by ow.pct_ownership desc
				) o
				join wash_prop_owner_val wpov with(nolock)
					on wpov.year = pv.prop_val_yr 
					and wpov.sup_num = pv.sup_num
					and wpov.prop_id = pv.prop_id
					and wpov.owner_id = o.owner_id
			  join account as acct with(nolock) on
					acct.acct_id = o.owner_id
			  join property as p with(nolock) on
					p.prop_id = pv.prop_id
				outer apply (
					select top 1 *
					from address with(nolock)
					where acct_id = o.owner_id
					and primary_addr = 'Y'
					order by addr_type_cd 
				) addr
			  left outer join property_use with(nolock) on
					property_use.property_use_cd = pv.property_use_cd
			  left outer join dor_use_code with(nolock) on
					dor_use_code.sub_cd = property_use.dor_use_code
				left join property_exemption pe with(nolock) on
					pe.exmpt_tax_yr = o.owner_tax_yr and 
					pe.sup_num = o.sup_num and 
					pe.prop_id = o.prop_id and 
					pe.owner_id = o.owner_id and
					(pe.termination_dt is null or pe.termination_dt > @sale_date_end)
			  left outer join wash_prop_owner_exemption as wpoe_hof with(nolock) on
					wpoe_hof.year = pe.exmpt_tax_yr and
					wpoe_hof.sup_num = pe.sup_num and
					wpoe_hof.prop_id = pe.prop_id and
					wpoe_hof.owner_id = pe.owner_id and
					wpoe_hof.exmpt_type_cd = 'HOF'
			  left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
					wpoe_snr.year = pe.exmpt_tax_yr and
					wpoe_snr.sup_num = pe.sup_num and
					wpoe_snr.prop_id = pe.prop_id and
					wpoe_snr.owner_id = pe.owner_id and
					wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
			  left outer join (
					select
						amlv.prop_val_yr,
						amlv.sup_num,
						amlv.prop_id,
						forest_hs = sum(case when ag_use.dfl = 1 then amlv.ag_value_hs else 0 end),
						forest_nhs = sum(case when ag_use.dfl = 1 then amlv.ag_value_nhs else 0 end),
						timber_hs = sum(case when ag_use.timber = 1 then amlv.ag_value_hs else 0 end),
						timber_nhs = sum(case when ag_use.timber = 1 then amlv.ag_value_nhs else 0 end)
					from appr_method_land_value_vw as amlv with(nolock)
					join land_detail as ld with(nolock) on
						ld.prop_val_yr = amlv.prop_val_yr and
						ld.sup_num = amlv.sup_num and
						ld.sale_id = amlv.sale_id and
						ld.prop_id = amlv.prop_id	and
						ld.land_seg_id = amlv.land_seg_id and
						ld.ag_apply = 'T'
					join ag_use with(nolock) on
						ag_use.ag_use_cd = ld.ag_use_cd and
						(ag_use.dfl = 1 or ag_use.timber = 1)
					where @bReal = 1 and amlv.sale_id = 0
					group by
						amlv.prop_val_yr,
						amlv.sup_num,
						amlv.prop_id
				) as land_info on
					land_info.prop_val_yr = pv.prop_val_yr and
					land_info.sup_num = pv.sup_num and
					land_info.prop_id = pv.prop_id
				left join property_sub_type pst with(nolock)
				on pst.property_sub_cd = pv.sub_type







			if @bReal = 1
			begin

			-- Delete properties not in the selected Use Codes list for Single Family Stratum AND Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'R' )
				Begin
				  delete from #tblReport
				  where dor_use_singlefamily_flag = 1 
						and property_use_cd not in (select drcsu.property_use_cd 
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										  where drcsu.[year] = @year
												and drcsu.[type] = 'R'
												and drcsu.group_type = 'R' ) 
						and 0 = (case when @use_custom_stratum = 1 and 
										   @custom_stratum_exists = 1 and
											dor_use_custom_flag = 1 and 
											property_use_cd in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
									  then 1
									  else 0 end)
				End 
					
			-- Delete properties not in the selected Use Codes list for Commercial / Multi-Family / Industrial Stratum AND Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'C' )
				Begin
				  delete from #tblReport
				  where dor_use_commercial_flag = 1 
						and property_use_cd not in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where
											  drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'C')
						and 0 = (case when @use_custom_stratum = 1 and 
										   @custom_stratum_exists = 1 and
											dor_use_custom_flag = 1 and 
											property_use_cd in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
									  then 1
									  else 0 end)
				End
					
			-- Delete properties not in the selected Use Codes list for Current Use / Agri / Other Stratum AND Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'O' )
				Begin
				  delete from #tblReport
				  where dor_use_other_flag = 1 
						and property_use_cd not in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where
											  drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'O')
						and 0 = (case when @use_custom_stratum = 1 and 
										   @custom_stratum_exists = 1 and
											dor_use_custom_flag = 1 and 
											property_use_cd in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
									  then 1
									  else 0 end)
				End
					
			-- Delete properties not in the selected Use Codes list for Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'X' )
				Begin
				  delete from #tblReport
				  where dor_use_custom_flag = 1 
						and property_use_cd not in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where
											  drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
				End
			      
			end



			--	if ( @bReal = 1 )
			--	begin
			--		-- Update flag for senior properties
			--		update t
			--			set t.senior_flag = 1
			--		from #tblReport as t
			--		join property_exemption as pe with(nolock) on
			--			pe.exmpt_tax_yr = t.year and
			--			pe.owner_tax_yr = t.year and
			--			pe.sup_num = t.sup_num and
			--			pe.prop_id = t.prop_id and
			--			pe.exmpt_type_cd = 'SNR/DSBL'
			--		
			--		-- Update flag for forest land properties
			--		update t
			--			set t.forestland_flag = 1
			--		from #tblReport as t
			--		join land_detail as ld with(nolock) on
			--			ld.prop_val_yr = t.year and
			--			ld.sup_num = t.sup_num and
			--			ld.sale_id = 0 and
			--			ld.prop_id = t.prop_id	
			--		join ag_use with(nolock) on
			--			ag_use.ag_use_cd = ld.ag_use_cd and
			--			ag_use.dfl = 1
			--	end
				
				-- Update flags for senior properties
				update #tblReport
					set forestland_flag = 0
				where
					senior_flag = 1
							
				
				-- Update flag for properties under $1000
				update #tblReport
					set properties_under_flag = 1
				where
					assessed_value < 1000 and
					senior_flag = 0 and
					forestland_flag = 0
					
				-- Set the overall flag on those with none of the other exclusion flags
				update #tblReport
					set overall_flag = 1
				where
					senior_flag = 0 and
					forestland_flag = 0 and
					properties_under_flag = 0 and
					is_ioll = 0
				
				
				-- Now enumerate each stratum layer
				declare curStratums cursor
				for
					select
						stratum_id, group_type, begin_value, end_value, sample_frequency, sample_start
					from dor_report_config_stratum
					with (nolock)
					where [year] = @year
					and (
									(@bReal = 1 and group_type in ('R','C','O','X')) 
									or (@bReal = 0 and group_type = 'P')
							)
				for read only

					
				open curStratums
				fetch next from curStratums into @stratum_id, @group_type, @begin_value, @end_value, @sample_frequency, @sample_start
				
				while ( @@fetch_status = 0 )
				begin
					if (@group_type = 'R')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_singlefamily_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_singlefamily_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'C')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_commercial_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_commercial_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'O')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_other_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_other_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'X')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_custom_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_custom_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'P')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								stratum_id = @stratum_id
						for update
					end		

					-- Now set various properties as the ones to be sampled, based on the start position & frequency
					-- In my not so humble opinion, start position is retarded.  Its all dependent on how we order the properties, which is arbitrary.
					-- So to make it especially arbitrary, I'm not going to put an order by clause in the cursor below.

					open curProps
					fetch next from curProps into @prop_id
					
					set @index = 0
					set @indexNextSample = @sample_start
					while ( @@fetch_status = 0 )
					begin
						set @index = @index + 1
						
						if (@index = @indexNextSample)
						begin
							update #tblReport
							set is_sample = 1
							where current of curProps
							
							set @indexNextSample = @indexNextSample + @sample_frequency
						end
						
						fetch next from curProps into @prop_id
					end
					
					close curProps
					deallocate curProps
					
					fetch next from curStratums into @stratum_id, @group_type, @begin_value, @end_value, @sample_frequency, @sample_start
				end
				
				close curStratums
				deallocate curStratums


				-- Now account for stratum layers out of defined range
				-- stratum_id needs to be different for each type, but also unique to anything the user may ever use
				declare leftoverStratums cursor
				for
					select
						group_type, min(begin_value) begin_value, max(end_value) end_value
					from dor_report_config_stratum
					with (nolock)
					group by group_type, year
					having [year] = @year
					and (
									(@bReal = 1 and group_type in ('R','C','O','X')) 
									or (@bReal = 0 and group_type = 'P')
							)
				for read only

					
				open leftoverStratums
				fetch next from leftoverStratums into @group_type, @begin_value, @end_value
				
				while ( @@fetch_status = 0 )
				begin
					if (@group_type = 'R')
					begin
						update #tblReport
							set stratum_id = 111111
						where
							dor_use_singlefamily_flag = 1 and						
							(assessed_value < @begin_value or assessed_value > @end_value)
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								dor_use_singlefamily_flag = 1 and						
								stratum_id = 111111
						for update
					end		

					if (@group_type = 'C')
					begin
						update #tblReport
							set stratum_id = 222222
						where
							dor_use_commercial_flag = 1 and						
							(assessed_value < @begin_value or assessed_value > @end_value)
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								dor_use_commercial_flag = 1 and						
								stratum_id = 222222
						for update
					end		

					if (@group_type = 'O')
					begin
						update #tblReport
							set stratum_id = 333333
						where
							dor_use_other_flag = 1 and						
							(assessed_value < @begin_value or assessed_value > @end_value)
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								dor_use_other_flag = 1 and						
								stratum_id = 333333
						for update
					end		

					if (@group_type = 'X')
					begin
						update #tblReport
							set stratum_id = 444444
						where
							dor_use_custom_flag = 1 and						
							(assessed_value < @begin_value or assessed_value > @end_value)
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								dor_use_custom_flag = 1 and						
								stratum_id = 444444
						for update
					end		

					if (@group_type = 'P')
					begin
						update #tblReport
							set stratum_id = 555555
						where
							(assessed_value < @begin_value or assessed_value > @end_value)
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								stratum_id = 555555
						for update
					end		

					-- Now set various properties as the ones to be sampled, based on the start position & frequency
					-- In my not so humble opinion, start position is retarded.  Its all dependent on how we order the properties, which is arbitrary.
					-- So to make it especially arbitrary, I'm not going to put an order by clause in the cursor below.

					open curProps
					fetch next from curProps into @prop_id
					
					set @index = 0
					set @indexNextSample = @sample_start
					while ( @@fetch_status = 0 )
					begin
						set @index = @index + 1
						
						if (@index = @indexNextSample)
						begin
							update #tblReport
							set is_sample = 1
							where current of curProps
							
							set @indexNextSample = @indexNextSample + @sample_frequency
						end
						
						fetch next from curProps into @prop_id
					end
					
					close curProps
					deallocate curProps
					
					fetch next from leftoverStratums into @group_type, @begin_value, @end_value
				end
				
				close leftoverStratums
				deallocate leftoverStratums

				update #tblReport
				set prior_assessed_value = case
        					  when isnull(dor_use_code.current_use, 0) = 1 
						or isnull(pv.market, 0) < 1000 then isnull(pv.market, 0)
							  when @bReal = 1 then isnull(pv.assessed_val, 0)
        					  else isnull(pv.assessed_val, 0) - isnull(wpoe_hof.exempt_value, 0)
						end
				 from 
				#tblReport as tblReport
				join prop_supp_assoc as psa with(nolock) on
					psa.owner_tax_yr = tblReport.year-1
					and psa.prop_id = tblReport.prop_id
				join property_val as pv with (nolock) on
					pv.prop_val_yr = psa.owner_tax_yr
					and pv.sup_num = psa.sup_num
					and pv.prop_id = psa.prop_id
				join owner as o with(nolock) on
        				o.owner_tax_yr = pv.prop_val_yr and
						o.sup_num = pv.sup_num and
						o.prop_id = pv.prop_id
				left outer join property_use with(nolock) on
        				property_use.property_use_cd = pv.property_use_cd
				left outer join dor_use_code with(nolock) on
        				dor_use_code.sub_cd = property_use.dor_use_code
				left join property_exemption pe with(nolock) on
					pe.exmpt_tax_yr = o.owner_tax_yr and 
					pe.sup_num = o.sup_num and 
					pe.prop_id = o.prop_id and 
					pe.owner_id = o.owner_id and
					(pe.termination_dt is null or pe.termination_dt > @sale_date_end)
				left outer join wash_prop_owner_exemption as wpoe_hof with(nolock) on
					wpoe_hof.year = pe.exmpt_tax_yr and
					wpoe_hof.sup_num = pe.sup_num and
					wpoe_hof.prop_id = pe.prop_id and
					wpoe_hof.owner_id = pe.owner_id and
					wpoe_hof.exmpt_type_cd = 'HOF'



				
				-- Add the data to the real report table
				delete dor_report_stratification
				where dataset_id = @dataset_id

				insert dor_report_stratification (
					dataset_id,
					year,
					sup_num,
					prop_id,
					stratum_id,
					owner_name,
					addr_line1,
					addr_line2,
					addr_line3,
					addr_city,
					addr_state,
					addr_zip,
					dor_land_use_code,
					assessed_value,
					senior_value,
					dba_name,
					is_sample,
					is_ioll,
					overall_flag,
					senior_flag,
					forestland_flag,
					forestland_value,
					properties_under_flag,
					prior_assessed_value,
					row
				)
				select 	
					dataset_id,
					year,
					sup_num,
					prop_id,
					stratum_id,
					owner_name,
					addr_line1,
					addr_line2,
					addr_line3,
					addr_city,
					addr_state,
					addr_zip,
					dor_land_use_code,
					assessed_value,
					senior_value,
					dba_name,
					is_sample,
					is_ioll,
					overall_flag,
					senior_flag,
					forestland_flag,
					forestland_value,
					properties_under_flag,
					prior_assessed_value,
					row_number() over (partition by stratum_id order by stratum_id) as row
			from #tblReport           
			--PC bug 17638 stratum_id is irrelevant for senior, forestland, and properties under $1000
			--views that use dor_report_stratification and stratum_ids filter out -1 anyway
			where dataset_id = @dataset_id --and stratum_id > -1 
			order by year, sup_num, prop_id

			-- if keeping these changes, add droptable calls here	
			drop table #tblAsOfSupNum
			
	end

	-- GEO ID REPORTS
	else begin
	
				-- Build the as of sup num table
			create table #tblAsOfSupNumGeoID
			(
				  year numeric(4,0) not null,
				  sup_num int not null,
				  geo_id varchar(50) not null,
				  primary key clustered (year, sup_num, geo_id)
			)	
			
			
					
			insert #tblAsOfSupNumGeoID (year, sup_num, geo_id)
			select
				pv.prop_val_yr, max(pv.sup_num), p.geo_id
			from property_val as pv with(nolock)
			inner join property as p with(nolock)
			on pv.prop_id = p.prop_id
			where pv.prop_val_yr = @year
			and pv.sup_num <= @as_of_sup_num
			and p.geo_id is not null
			group by pv.prop_val_yr, p.geo_id
			

			delete from #tblAsOfSupNumGeoID
			from #tblAsOfSupNumGeoID
			join property as p with(nolock) on
				#tblAsOfSupNumGeoID.geo_id = p.geo_id
			join property_val as pv with(nolock) on
									pv.prop_val_yr = #tblAsOfSupNumGeoID.[year]
						and pv.prop_id = p.prop_id
						and pv.sup_num = #tblAsOfSupNumGeoID.sup_num
			left join property_sub_type as pst with (nolock) on
							pv.sub_type = pst.property_sub_cd
			where
						pv.prop_inactive_dt is not null --Exclude deleted and udi parents
						or isnull(pst.state_assessed_utility, 0) = 1 -- State assessed utilities are always excluded



			delete from #tblAsOfSupNumGeoID
			from #tblAsOfSupNumGeoID
			join property as p with(nolock) on
				#tblAsOfSupNumGeoID.geo_id = p.geo_id			
			join property_val as pv with (nolock) on
									pv.prop_val_yr = #tblAsOfSupNumGeoID.[year]
						and pv.prop_id = p.prop_id
						and pv.sup_num = #tblAsOfSupNumGeoID.sup_num
			left join property_sub_type as pst with (nolock) on 
						pv.sub_type = pst.property_sub_cd 
			where not
			(
				(@bReal = 1 and p.prop_type_cd in ('R','MH') and isnull(pst.imp_leased_land, 0) = 0)
				or
				(
					@bReal = 0
					and
					(
						p.prop_type_cd in ('A','P')
						or
						(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 1)
					)
				)
			)

			

			-- State bid timber is always excluded on personal
			-- Boats are always excluded on personal
			if (@bReal = 0)
			begin
				  delete from #tblAsOfSupNumGeoID
				  from #tblAsOfSupNumGeoID
				  join property as p with(nolock) on
					#tblAsOfSupNumGeoID.geo_id = p.geo_id				  				  
				  join property_val as pv with(nolock) on
							  pv.prop_val_yr = #tblAsOfSupNumGeoID.[year]
						and pv.prop_id = p.prop_id
						and pv.sup_num = #tblAsOfSupNumGeoID.sup_num
				  left join property_sub_type as pst with (nolock) on 
						pv.sub_type = pst.property_sub_cd 
				  where isnull(pst.state_bid_timber, 0) = 1 
						or isnull(pst.boat, 0) = 1
			end


			-- Exempt properties are always excluded
			delete from #tblAsOfSupNumGeoID
			from #tblAsOfSupNumGeoID
			join property as p with(nolock) on
			#tblAsOfSupNumGeoID.geo_id = p.geo_id			
			join owner as o with (nolock) on 
						o.owner_Tax_yr = #tblAsOfSupNumGeoID.[year]    
				  and o.prop_id = p.prop_id
				  and o.sup_num = #tblAsOfSupNumGeoID.sup_num
			join property_exemption as pe with(nolock) on
						pe.owner_tax_yr = #tblAsOfSupNumGeoID.[year]
				  and   pe.sup_num = #tblAsOfSupNumGeoID.sup_num 
				  and   pe.prop_id = p.prop_id 
				  and   pe.owner_id = o.owner_id 
				  and   pe.exmpt_type_cd = 'EX'




			-- Timberland properties are always excluded on real
			if @bReal = 1
			begin
				  delete from #tblAsOfSupNumGeoID
				  where exists 
				  (
						select *
						from land_detail as ld with(nolock)
						join property as p with(nolock) on
							ld.prop_id = p.prop_id	and
							#tblAsOfSupNumGeoID.geo_id = p.geo_id				
						join ag_use with(nolock) on
								ag_use.ag_use_cd = ld.ag_use_cd 
							  and ag_use.timber = 1
						where
								ld.prop_val_yr = #tblAsOfSupNumGeoID.[year]
							  and ld.sup_num = #tblAsOfSupNumGeoID.sup_num
							  and ld.sale_id = 0 
							  and   ld.prop_id = p.prop_id
								and ld.ag_apply = 'T'
				  )

				  -- Exclude current use properties on real if so configured
				  if @exclude_current_use = 1
				  begin
						delete from #tblAsOfSupNumGeoID
						from #tblAsOfSupNumGeoID
						join property_val as pv with(nolock) on
									pv.prop_val_yr = #tblAsOfSupNumGeoID.[year]
							  and pv.prop_id = #tblAsOfSupNumGeoID.prop_id
							  and pv.sup_num = #tblAsOfSupNumGeoID.sup_num
						left join property_sub_type as pst with (nolock) on 
									pv.sub_type = pst.property_sub_cd 
						where isnull(pv.ag_use_val, 0) + isnull(pv.timber_use, 0) + isnull(pv.ag_hs_use_val, 0) + isnull(pv.timber_hs_use_val, 0) > 0
				  end
			end

	
	
		
			  insert #tblReport (
							dataset_id,--new
					year,
					sup_num,
					prop_id,
					geo_id,
					stratum_id,
					owner_name,
					addr_line1,
					addr_line2,
					addr_line3,
					addr_city,
					addr_state,
					addr_zip,
					dor_land_use_code,
					assessed_value,
					dba_name,
					is_sample,
					is_ioll,
					overall_flag,
					senior_flag,
					senior_value,
					forestland_flag,
					forestland_value,
					properties_under_flag,
					dor_use_singlefamily_flag,
					dor_use_commercial_flag,
					dor_use_other_flag,
					timberland_value,
					dor_use_custom_flag,
					property_use_cd
			  )
			  select
							@dataset_id as dataset_id,
					pv.prop_val_yr,
					pv.sup_num,
					pv.prop_id,
					asof.geo_id,
					-1, -- stratum_id
					isnull(acct.file_as_name, ''),
					isnull(addr.addr_line1, ''),
					isnull(addr.addr_line2, ''),
					isnull(addr.addr_line3, ''),
					isnull(addr.addr_city, ''),
					isnull(addr.addr_state, ''),
					isnull(addr.zip, ''),
					isnull(dor_use_code.sub_cd, ''),
					case
						  when isnull(dor_use_code.current_use, 0) = 1 
											or isnull(pv.market, 0) < 1000 then isnull(pv.market, 0)
						  when @bReal = 1 then isnull(pv.assessed_val, 0)
						  else isnull(pv.assessed_val, 0) - isnull(wpoe_hof.exempt_value, 0)
					end, -- assessed_value
					isnull(p.dba_name, ''),
					0, -- is_sample
					isnull(pst.imp_leased_land, 0), -- is_ioll
					0, -- overall_flag,
					case when wpoe_snr.year is null then 0 else 1 end, -- senior_flag
					case when wpoe_snr.year is null then 0 else wpov.appraised_classified end, -- senior_value
					case when land_info.forest_nhs > 0 or land_info.forest_hs > 0 then 1 else 0 end, -- forestland_flag,
					forestland_value =	isnull(land_info.forest_nhs, 0) + case when wpoe_snr.year is null then isnull(land_info.forest_hs, 0) else 0 end, --forestland_value
					0,  -- properties_under_flag,

					isnull(dor_use_code.residential, 0),  --dor_use_singlefamily_flag
					case
						  when @separate_current_use_group = 1 and
						  (isnull(dor_use_code.multifamily, 0) = 1
						  or isnull(dor_use_code.commercial, 0) = 1
						  or isnull(dor_use_code.industrial, 0) = 1
						  or isnull(dor_use_code.mh_park, 0) = 1)
						  then 1 else 0 
					end, -- dor_use_commercial_flag           
					case
						  when isnull(dor_use_code.residential, 0) = 1 
						  or 
						  (@separate_current_use_group = 1 and
								(isnull(dor_use_code.multifamily, 0) = 1
								 or isnull(dor_use_code.commercial, 0) = 1
								 or isnull(dor_use_code.industrial, 0) = 1
								 or isnull(dor_use_code.mh_park, 0) = 1)
						  )
						  then 0 else 1
					end, -- dor_use_other_flag
					timberland_value = isnull(land_info.timber_nhs, 0) + case when wpoe_snr.year is null then isnull(land_info.timber_hs, 0) else 0 end, --timberland_value
					case
						  when  
						  ( @bReal = 1 and
							@use_custom_stratum = 1 and
								(pv.property_use_cd in ( select property_use_cd
									from dor_report_config_stratum_use_codes drcsu with(nolock)
									where drcsu.[year] = @year
										  and drcsu.[type] = 'R'
										  and drcsu.group_type = 'X'))
							and (pv.property_use_cd not in ( select property_use_cd
									from dor_report_config_stratum_use_codes drcsu with(nolock)
									where drcsu.[year] = @year
										  and drcsu.[type] = 'R'
										  and drcsu.group_type in ('R', 'C', 'O')))
						  )
						  then 1 else 0
					end, -- dor_use_custom_flag - Set flag only for those use codes that are not already selected in other stratums to keep the Prop Id unique in the report
					pv.property_use_cd
					
					
			  from #tblAsOfSupNumGeoID as asof
			  join property as p with(nolock) on
					p.geo_id = asof.geo_id
			  join property_val as pv with(nolock) on
				--			asof.dataset_id = @dataset_id and --new
					asof.year = pv.prop_val_yr and
					asof.sup_num = pv.sup_num and
					p.prop_id = pv.prop_id
				cross apply (
					select top 1 ow.*
					from owner ow with(nolock)
					where ow.owner_tax_yr = pv.prop_val_yr
					and ow.sup_num = pv.sup_num
					and ow.prop_id = pv.prop_id
					order by ow.pct_ownership desc
				) o
				join wash_prop_owner_val wpov with(nolock)
					on wpov.year = pv.prop_val_yr 
					and wpov.sup_num = pv.sup_num
					and wpov.prop_id = pv.prop_id
					and wpov.owner_id = o.owner_id
			  join account as acct with(nolock) on
					acct.acct_id = o.owner_id
				outer apply (
					select top 1 *
					from address with(nolock)
					where acct_id = o.owner_id
					and primary_addr = 'Y'
					order by addr_type_cd 
				) addr
			  left outer join property_use with(nolock) on
					property_use.property_use_cd = pv.property_use_cd
			  left outer join dor_use_code with(nolock) on
					dor_use_code.sub_cd = property_use.dor_use_code
				left join property_exemption pe with(nolock) on
					pe.exmpt_tax_yr = o.owner_tax_yr and 
					pe.sup_num = o.sup_num and 
					pe.prop_id = o.prop_id and 
					pe.owner_id = o.owner_id and
					(pe.termination_dt is null or pe.termination_dt > @sale_date_end)
			  left outer join wash_prop_owner_exemption as wpoe_hof with(nolock) on
					wpoe_hof.year = pe.exmpt_tax_yr and
					wpoe_hof.sup_num = pe.sup_num and
					wpoe_hof.prop_id = pe.prop_id and
					wpoe_hof.owner_id = pe.owner_id and
					wpoe_hof.exmpt_type_cd = 'HOF'
			  left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
					wpoe_snr.year = pe.exmpt_tax_yr and
					wpoe_snr.sup_num = pe.sup_num and
					wpoe_snr.prop_id = pe.prop_id and
					wpoe_snr.owner_id = pe.owner_id and
					wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
			  left outer join (
					select
						amlv.prop_val_yr,
						amlv.sup_num,
						amlv.prop_id,
						forest_hs = sum(case when ag_use.dfl = 1 then amlv.ag_value_hs else 0 end),
						forest_nhs = sum(case when ag_use.dfl = 1 then amlv.ag_value_nhs else 0 end),
						timber_hs = sum(case when ag_use.timber = 1 then amlv.ag_value_hs else 0 end),
						timber_nhs = sum(case when ag_use.timber = 1 then amlv.ag_value_nhs else 0 end)
					from appr_method_land_value_vw as amlv with(nolock)
					join land_detail as ld with(nolock) on
						ld.prop_val_yr = amlv.prop_val_yr and
						ld.sup_num = amlv.sup_num and
						ld.sale_id = amlv.sale_id and
						ld.prop_id = amlv.prop_id	and
						ld.land_seg_id = amlv.land_seg_id and
						ld.ag_apply = 'T'
					join ag_use with(nolock) on
						ag_use.ag_use_cd = ld.ag_use_cd and
						(ag_use.dfl = 1 or ag_use.timber = 1)
					where @bReal = 1 and amlv.sale_id = 0
					group by
						amlv.prop_val_yr,
						amlv.sup_num,
						amlv.prop_id
				) as land_info on
					land_info.prop_val_yr = pv.prop_val_yr and
					land_info.sup_num = pv.sup_num and
					land_info.prop_id = pv.prop_id
				left join property_sub_type pst with(nolock)
				on pst.property_sub_cd = pv.sub_type


	



			if @bReal = 1
			begin

			-- Delete properties not in the selected Use Codes list for Single Family Stratum AND Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'R' )
				Begin
				  delete from #tblReport
				  where dor_use_singlefamily_flag = 1 
						and property_use_cd not in (select drcsu.property_use_cd 
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										  where drcsu.[year] = @year
												and drcsu.[type] = 'R'
												and drcsu.group_type = 'R' ) 
						and 0 = (case when @use_custom_stratum = 1 and 
										   @custom_stratum_exists = 1 and
											dor_use_custom_flag = 1 and 
											property_use_cd in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
									  then 1
									  else 0 end)
				End 
					
			-- Delete properties not in the selected Use Codes list for Commercial / Multi-Family / Industrial Stratum AND Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'C' )
				Begin
				  delete from #tblReport
				  where dor_use_commercial_flag = 1 
						and property_use_cd not in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where
											  drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'C')
						and 0 = (case when @use_custom_stratum = 1 and 
										   @custom_stratum_exists = 1 and
											dor_use_custom_flag = 1 and 
											property_use_cd in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
									  then 1
									  else 0 end)
				End
					
			-- Delete properties not in the selected Use Codes list for Current Use / Agri / Other Stratum AND Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'O' )
				Begin
				  delete from #tblReport
				  where dor_use_other_flag = 1 
						and property_use_cd not in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where
											  drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'O')
						and 0 = (case when @use_custom_stratum = 1 and 
										   @custom_stratum_exists = 1 and
											dor_use_custom_flag = 1 and 
											property_use_cd in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
									  then 1
									  else 0 end)
				End
					
			-- Delete properties not in the selected Use Codes list for Custom Stratum
				if exists ( select drcsu.property_use_cd 
							from dor_report_config_stratum_use_codes drcsu with(nolock)
							where drcsu.[year] = @year
								and drcsu.[type] = 'R'
								and drcsu.group_type = 'X' )
				Begin
				  delete from #tblReport
				  where dor_use_custom_flag = 1 
						and property_use_cd not in ( select property_use_cd
										from dor_report_config_stratum_use_codes drcsu with(nolock)
										where
											  drcsu.[year] = @year
											  and drcsu.[type] = 'R'
											  and drcsu.group_type = 'X')
				End
			      
			end



			--	if ( @bReal = 1 )
			--	begin
			--		-- Update flag for senior properties
			--		update t
			--			set t.senior_flag = 1
			--		from #tblReport as t
			--		join property_exemption as pe with(nolock) on
			--			pe.exmpt_tax_yr = t.year and
			--			pe.owner_tax_yr = t.year and
			--			pe.sup_num = t.sup_num and
			--			pe.prop_id = t.prop_id and
			--			pe.exmpt_type_cd = 'SNR/DSBL'
			--		
			--		-- Update flag for forest land properties
			--		update t
			--			set t.forestland_flag = 1
			--		from #tblReport as t
			--		join land_detail as ld with(nolock) on
			--			ld.prop_val_yr = t.year and
			--			ld.sup_num = t.sup_num and
			--			ld.sale_id = 0 and
			--			ld.prop_id = t.prop_id	
			--		join ag_use with(nolock) on
			--			ag_use.ag_use_cd = ld.ag_use_cd and
			--			ag_use.dfl = 1
			--	end
				
				-- Update flags for senior properties
				update #tblReport
					set forestland_flag = 0
				where
					senior_flag = 1
							
				
				-- Update flag for properties under $1000
				update #tblReport
					set properties_under_flag = 1
				where
					assessed_value < 1000 and
					senior_flag = 0 and
					forestland_flag = 0
					
				-- Set the overall flag on those with none of the other exclusion flags
				update #tblReport
					set overall_flag = 1
				where
					senior_flag = 0 and
					forestland_flag = 0 and
					properties_under_flag = 0 and
					is_ioll = 0
				
				
				-- Now enumerate each stratum layer
				declare curStratums cursor
				for
					select
						stratum_id, group_type, begin_value, end_value, sample_frequency, sample_start
					from dor_report_config_stratum
					with (nolock)
					where [year] = @year
					and (
									(@bReal = 1 and group_type in ('R','C','O','X')) 
									or (@bReal = 0 and group_type = 'P')
							)
				for read only
				

					
				open curStratums
				fetch next from curStratums into @stratum_id, @group_type, @begin_value, @end_value, @sample_frequency, @sample_start
				
				while ( @@fetch_status = 0 )
				begin
					if (@group_type = 'R')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_singlefamily_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_singlefamily_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'C')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_commercial_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_commercial_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'O')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_other_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_other_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'X')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							dor_use_custom_flag = 1 and						
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								dor_use_custom_flag = 1 and						
								stratum_id = @stratum_id
						for update
					end		

					if (@group_type = 'P')
					begin
						update #tblReport
							set stratum_id = @stratum_id
						where
							overall_flag = 1 and
							assessed_value >= @begin_value and
							assessed_value <= @end_value
						
						declare curProps cursor
						for
							select prop_id
							from #tblReport
							where
								overall_flag = 1 and
								stratum_id = @stratum_id
						for update
					end		

					-- Now set various properties as the ones to be sampled, based on the start position & frequency
					-- In my not so humble opinion, start position is retarded.  Its all dependent on how we order the properties, which is arbitrary.
					-- So to make it especially arbitrary, I'm not going to put an order by clause in the cursor below.

					open curProps
					fetch next from curProps into @prop_id
					
					set @index = 0
					set @indexNextSample = @sample_start
					while ( @@fetch_status = 0 )
					begin
						set @index = @index + 1
						
						if (@index = @indexNextSample)
						begin
							update #tblReport
							set is_sample = 1
							where current of curProps
							
							set @indexNextSample = @indexNextSample + @sample_frequency
						end
						
						fetch next from curProps into @prop_id
					end
					
					close curProps
					deallocate curProps
					
					fetch next from curStratums into @stratum_id, @group_type, @begin_value, @end_value, @sample_frequency, @sample_start
				end
				
				close curStratums
				deallocate curStratums


				update #tblReport
				set prior_assessed_value = case
        					  when isnull(dor_use_code.current_use, 0) = 1 
						or isnull(pv.market, 0) < 1000 then isnull(pv.market, 0)
							  when @bReal = 1 then isnull(pv.assessed_val, 0)
        					  else isnull(pv.assessed_val, 0) - isnull(wpoe_hof.exempt_value, 0)
						end
				 from 
				#tblReport as tblReport
				join prop_supp_assoc as psa with(nolock) on
					psa.owner_tax_yr = tblReport.year-1
					and psa.prop_id = tblReport.prop_id
				join property_val as pv with (nolock) on
					pv.prop_val_yr = psa.owner_tax_yr
					and pv.sup_num = psa.sup_num
					and pv.prop_id = psa.prop_id
				join owner as o with(nolock) on
        				o.owner_tax_yr = pv.prop_val_yr and
						o.sup_num = pv.sup_num and
						o.prop_id = pv.prop_id
				left outer join property_use with(nolock) on
        				property_use.property_use_cd = pv.property_use_cd
				left outer join dor_use_code with(nolock) on
        				dor_use_code.sub_cd = property_use.dor_use_code
				left join property_exemption pe with(nolock) on
					pe.exmpt_tax_yr = o.owner_tax_yr and 
					pe.sup_num = o.sup_num and 
					pe.prop_id = o.prop_id and 
					pe.owner_id = o.owner_id and
					(pe.termination_dt is null or pe.termination_dt > @sale_date_end)
				left outer join wash_prop_owner_exemption as wpoe_hof with(nolock) on
					wpoe_hof.year = pe.exmpt_tax_yr and
					wpoe_hof.sup_num = pe.sup_num and
					wpoe_hof.prop_id = pe.prop_id and
					wpoe_hof.owner_id = pe.owner_id and
					wpoe_hof.exmpt_type_cd = 'HOF'



				
				-- Add the data to the real report table
				delete dor_report_stratification
				where dataset_id = @dataset_id

				insert dor_report_stratification (
					dataset_id,
					year,
					sup_num,
					prop_id,
					geo_id,
					stratum_id,
					owner_name,
					addr_line1,
					addr_line2,
					addr_line3,
					addr_city,
					addr_state,
					addr_zip,
					dor_land_use_code,
					assessed_value,
					senior_value,
					dba_name,
					is_sample,
					is_ioll,
					overall_flag,
					senior_flag,
					forestland_flag,
					forestland_value,
					properties_under_flag,
					prior_assessed_value,
					row
				)
				select 	
					dataset_id,
					year,
					sup_num,
					prop_id,
					geo_id,
					stratum_id,
					owner_name,
					addr_line1,
					addr_line2,
					addr_line3,
					addr_city,
					addr_state,
					addr_zip,
					dor_land_use_code,
					assessed_value,
					senior_value,
					dba_name,
					is_sample,
					is_ioll,
					overall_flag,
					senior_flag,
					forestland_flag,
					forestland_value,
					properties_under_flag,
					prior_assessed_value,
					row_number() over (partition by stratum_id order by stratum_id) as row
			from #tblReport           
			--PC bug 17638 stratum_id is irrelevant for senior, forestland, and properties under $1000
			--views that use dor_report_stratification and stratum_ids filter out -1 anyway
			where dataset_id = @dataset_id --and stratum_id > -1 
			order by year, sup_num, prop_id

			-- if keeping these changes, add droptable calls here	
			drop table #tblAsOfSupNumGeoID			
end	

-- if keeping these changes, add droptable calls here	
drop table #tblReport

GO

