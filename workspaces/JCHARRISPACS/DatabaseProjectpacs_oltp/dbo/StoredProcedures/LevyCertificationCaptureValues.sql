
/******************************************************************************************
 Procedure: LevyCertificationCaptureValues
 Synopsis:	Captures a summary of property values by tax district/levy for use with a
			Levy Certification Run.
 Call From:	App Server
 ******************************************************************************************/
create PROCEDURE LevyCertificationCaptureValues
	@year			numeric (4, 0),
	@as_of_sup_num	int,
	@pacs_user_id	int,
	@description	varchar(50),
	@dataset_id		int = -1,
	@report_only	bit = 0
AS
	-- Notes:
	-- This stored procedure also collects taxable value information for reporting.  If
	-- the @dataset_id value is something other than -1, then the stored procedure doesn't
	-- create a captured values run, but rather writes information to the 
	-- ##report_captured_value global temp table

	SET NOCOUNT ON
	set ansi_warnings off	
/* Top of each procedure to capture input parameters */

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
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @as_of_sup_num =' +  convert(varchar(30),@as_of_sup_num) + ','
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @description =' + @description + ','
 + ' @dataset_id =' +  convert(varchar(30),@dataset_id) + ','
 + ' @report_only =' +  convert(varchar(30),@report_only)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

	declare @captured_value_run_id			int 

	if @dataset_id = -1
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 1 @dataset_id = -1 Start' --logging 

		-- get a new run id 
		exec GetUniqueID 'captured_value_run', @captured_value_run_id output

		-- see if property value has been certified yet
		declare @is_certified_value bit

		set @is_certified_value = 0

		if exists (select * from pacs_year where tax_yr = @year and certification_dt is not null)
		begin
			set @is_certified_value = 1
		end

		-- create the captured_value_run record
		delete captured_value_run where captured_value_run_id = @captured_value_run_id

		insert into captured_value_run
		(captured_value_run_id, [year], [description], as_of_sup_num, created_date, created_by_id, is_certified_value, [status])
		values
		(@captured_value_run_id, @year, @description, @as_of_sup_num, getdate(), @pacs_user_id, @is_certified_value, 'Executing')

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 1 @dataset_id = -1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end

	
	-- create a temporary table to hold all captured value broken out by category
	if object_id('tempdb..#captured_value') is not null
		drop table #captured_value

	create table #captured_value
	(
		[year] numeric(4,0),
		sup_num int,
		prop_id int,
		tax_district_id int,
		levy_cd varchar(10),
		fund_id int,
		tax_area_id int,
		appraised_classified numeric(16, 0) not null,
		appraised_non_classified numeric(16, 0) not null,
		real_pers_value_non_annex numeric(14, 0) not null,
		state_value_non_annex numeric(14, 0) not null,
		senior_value_non_annex numeric(14, 0) not null,
		new_const_value_non_annex numeric(14, 0) not null,
		senior_new_const_value_non_annex numeric(14, 0) not null,
		opinion_of_value_highly_disputed numeric(14, 0) not null,
		real_pers_value_annex numeric(14, 0) not null,
		state_value_annex numeric(14, 0) not null,
		senior_value_annex numeric(14, 0) not null,
		new_const_value_annex numeric(14, 0) not null,
		senior_new_const_value_annex numeric(14, 0) not null,
		real_value numeric(16, 0) not null,
		personal_value numeric(16, 0) not null,
		senior_real_value numeric(16, 0) not null,
		senior_personal_value numeric(16, 0) not null,
		exempt_senior_value_non_annex numeric(16, 0) not null,
		exempt_senior_value_annex numeric(16, 0) not null,
		is_annexation_value bit,
		ioll bit,
		active_tif_area_id int null,
		tif_base_value numeric(14,0) not null,
		tif_senior_base_value numeric(14, 0) not null,
		prev_state_value numeric(14, 0) null,
	)

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 2 Start' --logging 

	-- create a 'fake' prop_supp_assoc from wash_prop_owner_val
	select [year], max(sup_num) as sup_num, prop_id
	into #prop_supp_assoc
	from wash_prop_owner_val with (nolock)
	where [year] = @year and sup_num <= @as_of_sup_num
	group by [year], prop_id 

	-- previous year version
	declare @prev_captured_value_run_id int
	declare @prev_cert_sup_num int
	
	select @prev_captured_value_run_id = cvr.captured_value_run_id,
		@prev_cert_sup_num = cvr.as_of_sup_num 
	from levy_cert_run lcr with(nolock)
	join captured_value_run cvr with(nolock)
		on cvr.captured_value_run_id = lcr.captured_value_run_id 
		and cvr.[year] = lcr.[year]
	where lcr.accepted_date is not null
		and lcr.[year] = @year - 1

	select [year], max(sup_num) as sup_num, prop_id
	into #prev_prop_supp_assoc
	from wash_prop_owner_val with (nolock)
	where [year] = @year - 1
	and sup_num <= @prev_cert_sup_num
	group by [year], prop_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
	
	create index #ndx_prop_supp_assoc on #prop_supp_assoc([year], sup_num, prop_id)
	create index #ndx_prev_prop_supp_assoc on #prev_prop_supp_assoc([year], sup_num, prop_id)


	-- update the fund_id to reflect the fund associated with any pending tax areas
	-- whose active annexations take effect as of January 1, {Tex Year}
	declare @as_of_date datetime
	set @as_of_date = convert(datetime, '1/1/' + cast((@year + 1) as varchar))

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Start' --logging 

	create table #pv(prop_val_yr numeric(4,0), sup_num int, prop_id int, state_assessed_utility bit, ioll bit)
	create table #prev_pv(prop_val_yr numeric(4,0), sup_num int, prop_id int, state_assessed_utility bit)

	-- set up pv table for performance on insert to #captured_value
	insert into #pv
	select pv.prop_val_yr, pv.sup_num, pv.prop_id, isnull(pst.state_assessed_utility, 0), isnull(pst.imp_leased_land, 0)
	from #prop_supp_assoc psa 
	join property_val as pv with(nolock) 
		on psa.[year] = pv.prop_val_yr
		and psa.sup_num = pv.sup_num
		and psa.prop_id = pv.prop_id
	left join property_sub_type as pst with(nolock)
		on pst.property_sub_cd = pv.sub_type

	-- previous year version
	insert into #prev_pv
	select pv.prop_val_yr, pv.sup_num, pv.prop_id, isnull(pst.state_assessed_utility, 0)
	from #prev_prop_supp_assoc ppsa
	join property_val pv with(nolock) 
		on ppsa.[year] = pv.prop_val_yr
		and ppsa.sup_num = pv.sup_num
		and ppsa.prop_id = pv.prop_id
	left join property_sub_type pst with(nolock)
		on pst.property_sub_cd = pv.sub_type


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
	
	create index idx_tmp_pv on #pv(prop_val_yr, sup_num, prop_id, state_assessed_utility)
	create index idx_tmp_prev_pv on #prev_pv(prop_val_yr, sup_num, prop_id, state_assessed_utility)

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Start' --logging 

	-- populate the temp table with all values for the current year
	insert into #captured_value
	(
		[year],
		sup_num,
		prop_id,
		tax_district_id,
		levy_cd,
		fund_id, 
		tax_area_id,
		appraised_classified,
		appraised_non_classified,
		real_pers_value_non_annex,
		state_value_non_annex,
		senior_value_non_annex,
		new_const_value_non_annex,
		senior_new_const_value_non_annex,
		opinion_of_value_highly_disputed,
		real_pers_value_annex,
		state_value_annex,
		senior_value_annex,
		new_const_value_annex,
		senior_new_const_value_annex,
		real_value,
		personal_value,
		senior_real_value,
		senior_personal_value,
		exempt_senior_value_non_annex,
		exempt_senior_value_annex,
		is_annexation_value,
		ioll,
		tif_base_value,
		tif_senior_base_value,
		prev_state_value
	)
	select
		@year, -- year
		psa.sup_num, -- sup_num
		psa.prop_id, -- prop_id
		tafa.tax_district_id, -- tax_district_id
		tafa.levy_cd, -- levy_cd
		tafa.fund_id, -- fund_id
		tafa.tax_area_id, -- tax_area_id
		isnull(wpov.appraised_classified, 0),	-- appraised_classified
		isnull(wpov.appraised_non_classified, 0), -- appraised_non_classified	
		isnull(wpov.taxable_non_classified, 0), -- real_pers_value_non_annex
		case									-- state_value_non_annex 
			when pv.state_assessed_utility = 1 then isnull(wpov.taxable_non_classified, 0)
			else 0  
		end as state_assessed,	
		isnull(wpov.taxable_classified, 0), -- senior_value_non_annex
		isnull(wpov.new_val_hs, 0) + isnull(wpov.new_val_nhs, 0) + isnull(wpov.new_val_p, 0), -- new_const_value_non_annex
		isnull(wpov.new_val_hs, 0), -- senior_new_const_value_non_annex
		isnull(ap.opinion_of_value, 0), -- opinion_of_value_highly_disputed
		0, -- real_pers_value_annex
		0, -- state_value_annex
		0, -- senior_value_annex
		0, -- new_const_value_annex
		0, -- senior_new_const_value_annex
		0, -- real_value
		0, -- personal_value
		0, -- senior_real_value
		0, -- senior_personal_value
		0, -- exempt_senior_value_non_annex
		0, -- exempt_senior_value_annex
		0, -- is_annexation_value
		isnull(pv.ioll, 0), -- ioll
		0, -- tif_base_value
		0, -- tif_senior_base_value
		case when ppv.state_assessed_utility = 1 
			then isnull(prev_wpov.taxable_non_classified, 0) else 0 
			end as prev_state_value	
	from wash_prop_owner_val as wpov with(nolock)
	join #prop_supp_assoc as psa 
		on wpov.[year] = @year
		and psa.[year] = wpov.[year]
		and psa.sup_num = wpov.sup_num
		and psa.prop_id = wpov.prop_id
	join property_tax_area as pta with(nolock)
		on pta.[year] = wpov.[year]
		and pta.sup_num = wpov.sup_num
		and pta.prop_id = wpov.prop_id
	join tax_area_fund_assoc as tafa with (nolock) 
		on tafa.[year] = pta.[year]
		and tafa.tax_area_id = pta.tax_area_id
	join fund as f with(nolock) 
		on f.[year] = tafa.[year]
		and f.tax_district_id = tafa.tax_district_id
		and f.levy_cd = tafa.levy_cd
		and f.fund_id = tafa.fund_id
		and @as_of_date >= convert(datetime, convert(varchar, f.begin_date, 101), 101)
		and @as_of_date < dateadd(day, 1, convert(datetime, convert(varchar, isnull(f.end_date, '1/1/9999'), 101), 101))
	join #pv as pv with(nolock)
		on psa.[year] = pv.prop_val_yr
		and psa.sup_num = pv.sup_num
		and psa.prop_id = pv.prop_id
	left join _arb_protest as ap with(nolock)
		on ap.prop_val_yr = pv.prop_val_yr
		and ap.prop_id = pv.prop_id
		and ap.highly_disputed_property = 1

	left join #prev_prop_supp_assoc ppsa
		on ppsa.prop_id = psa.prop_id
	left join wash_prop_owner_val prev_wpov with(nolock)
		on prev_wpov.prop_id = ppsa.prop_id
		and prev_wpov.year = ppsa.year
		and prev_wpov.sup_num = ppsa.sup_num
		and prev_wpov.owner_id = wpov.owner_id
	left join #prev_pv ppv
		on ppv.prop_id = ppsa.prop_id
		and ppv.prop_val_yr = ppsa.year
		and ppv.sup_num = ppsa.sup_num


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	
	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Start' --logging 
		
	-- if state assessed value exists, then zero out the non-classified value
	update #captured_value set 
		real_pers_value_non_annex = 0 
	where state_value_non_annex > 0

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 6 Start' --logging 
				
    	
-- Although Real Property may have classified value, a levy may not necessarily
	-- exempt classified value for Senior/Disabled.  If it does however,  
	-- copy classified value to the exempt_senior_value column for later use
	update #captured_value set

--		appraised_non_classified = appraised_non_classified + appraised_classified,
--		real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex
--    exclude IOLL properties..

		exempt_senior_value_non_annex = senior_value_non_annex,
		senior_value_non_annex = 0
	where 
			prop_id in (select prop_id from [property] where prop_type_cd in ('R', 'MH'))
--			and #captured_value.ioll = 0
		and exists (
			select * from levy_exemption as le with (nolock) where
				le.[year]				= #captured_value.[year]
			and le.tax_district_id		= #captured_value.tax_district_id
			and le.levy_cd				= #captured_value.levy_cd
			and le.exmpt_type_cd		= 'SNR/DSBL'
		)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 7 Start' --logging 
				
 	-- Although Personal Property may have classified value, a levy may not necessarily
	-- exempt classified value for Farm.  If it does however,  
	-- copy classified value to the exempt_senior_value column for later use
	update #captured_value set
--		appraised_non_classified = appraised_non_classified + appraised_classified,
--		real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex
		exempt_senior_value_non_annex = senior_value_non_annex,
		senior_value_non_annex = 0		
	where 
			( prop_id in (select prop_id from [property] where prop_type_cd not in ('R', 'MH'))
			--or  #captured_value.ioll = 1 
			)
		and exists (
			select * from levy_exemption as le with (nolock) where
				le.[year]				= #captured_value.[year]
			and le.tax_district_id		= #captured_value.tax_district_id
			and le.levy_cd				= #captured_value.levy_cd
			and le.exmpt_type_cd		= 'FARM'
		)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 8 Start' --logging 
				
-- xraf	update #captured_value set
--		senior_value_non_annex = 0 
-- xraf	where exempt_senior_value_non_annex > 0

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 9 Start' --logging 
	
	-- Per Bug 8867, any senior value for personal property that is non-exempt
	-- should be shifted to the real_pers_value column and zeroed out
	-- leave the IOLL properties 
	update #captured_value set
		real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex,
		senior_value_non_annex = 0
	where senior_value_non_annex > 0
	and prop_id in (select prop_id from [property] where (prop_type_cd not in ('R', 'MH')))

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 9.1 Start' --logging 
		
--xraf	update #captured_value set
--		senior_value_non_annex = 0
--	where senior_value_non_annex > 0
--	and prop_id in (select prop_id from [property] where (prop_type_cd not in ('R', 'MH')))

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 9.1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 10 Start' --logging 

    create index idx_tmp_prop_id on #captured_value(prop_id,real_pers_value_non_annex,senior_value_non_annex)
	
	-- Classifiy taxable property value into real property or personal property for reporting
	
	update #captured_value set
		real_value = real_pers_value_non_annex,
		senior_real_value = senior_value_non_annex
	where 
		prop_id in (select prop_id from [property] where prop_type_cd in ('R', 'MH'))
		and  #captured_value.ioll = 0
	    
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 11 Start' --logging 
	
	update #captured_value set
		personal_value = real_pers_value_non_annex,
		senior_personal_value = senior_value_non_annex
	where 
			(prop_id in (select prop_id from [property] where (prop_type_cd not in ('R', 'MH'))) or #captured_value.ioll = 1)
	
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 12 Start' --logging 
	
	-- now update the annex values for any properties involved in an active 
	-- annexation for the current year
	update #captured_value set
		real_pers_value_annex = real_pers_value_non_annex,
		state_value_annex = state_value_non_annex,
		senior_value_annex = senior_value_non_annex,
		exempt_senior_value_annex = exempt_senior_value_non_annex,
		new_const_value_annex = new_const_value_non_annex,
		senior_new_const_value_annex = senior_new_const_value_non_annex,
		is_annexation_value = 1
	from #captured_value as cv
	join (
		select distinct apa.prop_id, a.start_year as [year], pta_child.tax_area_id, a.tax_district_id
		from annexation as a with (nolock)
		join annexation_property_assoc as apa with (nolock) on
				apa.annexation_id = a.annexation_id
		join tax_area_mapping as tam with (nolock) on
				tam.annexation_id = a.annexation_id
		join #prop_supp_assoc as psa on
				psa.[year] = a.start_year
			and psa.prop_id = apa.prop_id
		join property_tax_area as pta_child with (nolock) on
				pta_child.prop_id = apa.prop_id
			and pta_child.[year] = a.start_year
			and pta_child.is_annex_value = 1
			and pta_child.tax_area_id = tam.tax_area_destination_id
			and pta_child.sup_num = psa.sup_num
		where a.start_year = @year
		and a.annexation_status = 1
	) as pta on
			pta.prop_id			= cv.prop_id
		and pta.[year]			= cv.[year]
		and pta.tax_area_id		= cv.tax_area_id
		and pta.tax_district_id = cv.tax_district_id

	-- annexation for the previous year
	update #captured_value set
		prev_state_value = 0
	from #captured_value as cv
	join (
		select distinct apa.prop_id, a.start_year as [year], pta_child.tax_area_id, a.tax_district_id
		from annexation as a with (nolock)
		join annexation_property_assoc as apa with (nolock) on
				apa.annexation_id = a.annexation_id
		join tax_area_mapping as tam with (nolock) on
				tam.annexation_id = a.annexation_id
		join #prev_prop_supp_assoc as psa on
				psa.[year] = a.start_year
			and psa.prop_id = apa.prop_id
		join property_tax_area as pta_child with (nolock) on
				pta_child.prop_id = apa.prop_id
			and pta_child.[year] = a.start_year
			and pta_child.is_annex_value = 1
			and pta_child.tax_area_id = tam.tax_area_destination_id
			and pta_child.sup_num = psa.sup_num
		where a.start_year = @year - 1
		and a.annexation_status = 1
	) as pta on
			pta.prop_id			= cv.prop_id
		and pta.[year] + 1		= cv.[year]
		and pta.tax_area_id		= cv.tax_area_id
		and pta.tax_district_id = cv.tax_district_id


	drop table #prop_supp_assoc
	drop table #prev_prop_supp_assoc

	drop table #pv
	drop table #prev_pv

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 12.1 Start' --logging 


	-- identify properties in an active LTIF area
	update cv
	set active_tif_area_id = ta.tif_area_id,
		tif_base_value = isnull(tapv.base_value, 0),
		tif_senior_base_value = isnull(tapv.senior_base_value, 0)
	from #captured_value cv
	join tif_area_prop_assoc tapa with(nolock)
		on tapa.prop_id = cv.prop_id
		and tapa.year = cv.year
		and tapa.sup_num = cv.sup_num
	join tif_area ta with(nolock)
		on ta.tif_area_id = tapa.tif_area_id
	join tif_area_levy tal with(nolock)
		on tal.tif_area_id = ta.tif_area_id
		and tal.year = cv.year
		and tal.tax_district_id = cv.tax_district_id
		and tal.levy_cd = cv.levy_cd
	left join tif_area_prop_values tapv with(nolock)
		on tapv.tif_area_id = ta.tif_area_id
		and tapv.prop_id = tapa.prop_id
	where ta.base_values_captured_date is not null
	and ta.suspended = 0
	and cv.year > ta.base_year


	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 12.1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 13 Start' --logging 

	-- clear new construction non-annex value for property that was annexed.
	-- We don't want new construction value to be summed in the the total new construction value 
	update #captured_value set
		new_const_value_non_annex = 0
	where is_annexation_value = 1
	and new_const_value_annex > 0

	update #captured_value set
		senior_new_const_value_non_annex = 0
	where is_annexation_value = 1
	and senior_new_const_value_annex > 0

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	if @report_only = 0
	begin
	   set @StartStep = getdate()  --logging capture start time
	   exec dbo.CurrentActivityLogInsert @proc, 'Step 14 Start' --logging 

		-- Now populate the captured_value table with sums according to the following rules:
		--    1.    Total taxable value = real_pers_value + senior_value + state_value from non-annex columns
		--    2.    Annex Value = real_pers_value + senior_value + state_value from annex columns
		--    3.    New Construction value = sum of non-annexed new construction value
		delete captured_value where captured_value_run_id = @captured_value_run_id

		set ansi_warnings on
		insert into captured_value (
			captured_value_run_id,
			[year],
			tax_district_id,
			levy_cd,
			tax_area_id,
			real_pers_value,
			state_value,
			senior_value,
			new_const_value,
			senior_new_const_value,
			taxable_value,
			annex_value,
			senior_annex_value,
			real_value,
			personal_value,
			senior_real_value,
			senior_personal_value,
			exempted_senior_value,
			state_value_annex,
			is_joint_district_value)
		select
			@captured_value_run_id,
			@year, -- year
			cv.tax_district_id, -- tax_district_id
			cv.levy_cd, -- levy_cd
			cv.tax_area_id, -- tax_area_id
			sum(real_pers_value_non_annex), -- real_pers_value
			sum(state_value_non_annex), -- state_value
			sum(senior_value_non_annex), -- senior_value
			sum(new_const_value_non_annex), -- new_const_value
			sum(senior_new_const_value_non_annex), -- senior_new_const_value
			--sum(real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex),  -- taxable_value		
			sum(
			case when (opinion_of_value_highly_disputed is NULL or opinion_of_value_highly_disputed <= 0)
			then (real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex) 
			else (state_value_non_annex + opinion_of_value_highly_disputed) end), -- taxable_value
			
			sum(real_pers_value_annex + state_value_annex + senior_value_annex), -- annex_value
			sum(senior_value_annex), -- senior_annex_value
			sum(real_value), -- real_value
			sum(personal_value), -- personal_value
			sum(senior_real_value), -- senior_real_value
			sum(senior_personal_value), -- senior_personal_value
			sum(exempt_senior_value_non_annex), -- exempted_senior_value
			sum(state_value_annex), -- state_value_annex
			0 -- is_joint_district_value
		from #captured_value as cv with (nolock)
		group by
			cv.tax_district_id,
			cv.levy_cd,
			cv.tax_area_id

		-- add LTIF values
		insert captured_value_tif
		(
			captured_value_run_id, year, tax_district_id, levy_cd, tax_area_id, is_joint_district_value, tif_area_id,
			tif_taxable_value, tif_base_value, tif_new_const_value, tif_state_value, tif_prev_state_value,
			tif_senior_taxable_value, tif_senior_base_value, tif_senior_new_const_value
		)
		select @captured_value_run_id captured_value_run_id,
			@year year,
			cv.tax_district_id,
			cv.levy_cd,
			cv.tax_area_id,
			0 as is_joint_district_value,
			cv.active_tif_area_id as tif_area_id,
			sum(case when (opinion_of_value_highly_disputed is NULL or opinion_of_value_highly_disputed <= 0)
				then (real_pers_value_non_annex + real_pers_value_annex + state_value_non_annex + state_value_annex + senior_value_non_annex + senior_value_annex) 
				else (state_value_non_annex + state_value_annex + opinion_of_value_highly_disputed) end) tif_taxable_value,
			sum(cv.tif_base_value) tif_base_value,
			sum(new_const_value_non_annex + new_const_value_annex) tif_new_const_value,
			sum(state_value_non_annex + state_value_annex) tif_state_value,
			sum(prev_state_value) tif_prev_state_value,
			sum(senior_value_non_annex + senior_value_annex) tif_senior_taxable_value,
			sum(cv.tif_senior_base_value) tif_senior_base_value,
			sum(senior_new_const_value_non_annex + senior_new_const_value_annex) tif_senior_new_const_value
		from #captured_value cv
		where active_tif_area_id is not null
		group by
			cv.tax_district_id,
			cv.levy_cd,
			cv.tax_area_id,
			cv.active_tif_area_id

		-- copy previous year TIF state value, where available
		update cv
			set tif_prev_state_value = x.tif_state_value
		from captured_value_tif cv
		cross apply (
			select top 1 cv_prev.tif_state_value
			from captured_value_tif cv_prev with(nolock)
			where cv_prev.captured_value_run_id = @prev_captured_value_run_id
			and cv_prev.year = @year - 1
			and cv_prev.tax_district_id = cv.tax_district_id
			and cv_prev.levy_cd = cv.levy_cd
			and cv_prev.tax_area_id = cv.tax_area_id
			and cv_prev.is_joint_district_value = cv.is_joint_district_value
			and cv_prev.tif_area_id is not null
		) x
		where cv.captured_value_run_id = @captured_value_run_id


		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 15 Start' --logging 

		-- add joint district values
		insert into captured_value (
			captured_value_run_id,
			[year],
			tax_district_id,
			levy_cd,
			tax_area_id,
			real_pers_value,
			state_value,
			senior_value,
			new_const_value,
			senior_new_const_value,
			taxable_value,
			annex_value,
			senior_annex_value,
			real_value,
			personal_value,
			senior_real_value,
			senior_personal_value,
			exempted_senior_value,
			state_value_annex,
			is_joint_district_value)
		select
			@captured_value_run_id, -- captured_value_run_id
			@year, -- year
			tdj.tax_district_id, -- tax_district_id
			tdj.levy_cd, -- levy_cd
			tdj.acct_id_linked, -- tax_area_id
			isnull(tdj.assessed_value, 0), -- real_pers_value
			isnull(tdj.state_assessed_value, 0), -- state_value
			isnull(tdj.senior_assessed_value, 0), -- senior_value
			isnull(tdj.new_const_value, 0), -- new_const_value
			0, -- senior_new_const_value
			isnull(tdj.assessed_value, 0) + isnull(tdj.senior_assessed_value, 0) + isnull(tdj.state_assessed_value, 0), -- taxable_value
			isnull(tdj.annex_value, 0), -- annex_value
			0, -- senior_annex_value
			0, -- real_value
			0, -- personal_value
			0, -- senior_real_value
			0, -- senior_personal_value
			0, -- exempted_senior_value
			0, -- state_value_annex
			1      -- is_joint_district_value
		from tax_district_joint as tdj with (nolock)
		where tdj.[year] = @year

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 16 Start' --logging 

		insert into captured_value_by_fund (
			captured_value_run_id,
			[year],
			tax_district_id,
			levy_cd,
			fund_id,
			tax_area_id,
			real_pers_value,
			state_value,
			senior_value,
			new_const_value,
			senior_new_const_value,
			taxable_value,
			annex_value,
			senior_annex_value,
			real_value,
			personal_value,
			senior_real_value,
			senior_personal_value,
			exempted_senior_value,
			state_value_annex,
			is_joint_district_value)
		select
			@captured_value_run_id, -- captured_value_run_id
			@year, -- year
			cv.tax_district_id, -- tax_district_id
			cv.levy_cd, -- levy_cd
			cv.fund_id, -- fund_id
			cv.tax_area_id, -- tax_area_id
			sum(real_pers_value_non_annex), -- real_pers_value
			sum(state_value_non_annex), -- state_value
			sum(senior_value_non_annex), -- senior_value
			sum(new_const_value_non_annex), -- new_const_value 
			sum(senior_new_const_value_non_annex), -- senior_new_const_value
			--sum(real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex), -- taxable_value	
			sum(
			case when (opinion_of_value_highly_disputed is NULL or opinion_of_value_highly_disputed <= 0)
			then (real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex) 
			else (state_value_non_annex + opinion_of_value_highly_disputed) end), -- taxable_value

			sum(real_pers_value_annex + state_value_annex + senior_value_annex), -- annex_value
			sum(senior_value_annex), -- senior_annex_value
			sum(real_value), -- real_value
			sum(personal_value), -- personal_value
			sum(senior_real_value), -- senior_real_value
			sum(senior_personal_value), -- senior_personal_value
			sum(exempt_senior_value_non_annex), -- exempted_senior_value
			sum(state_value_annex), -- state_value_annex
			0 -- is_joint_district_value
		from #captured_value as cv with (nolock)
		group by
			cv.tax_district_id,
			cv.levy_cd,
			cv.fund_id,
			cv.tax_area_id

		-- add LTIF values
		insert captured_value_tif_by_fund
		(
			captured_value_run_id, year, tax_district_id, levy_cd, fund_id, tax_area_id, is_joint_district_value, tif_area_id,
			tif_taxable_value, tif_base_value, tif_new_const_value, tif_state_value, tif_prev_state_value,
			tif_senior_taxable_value, tif_senior_base_value, tif_senior_new_const_value
		)
		select @captured_value_run_id captured_value_run_id,
			@year year,
			cv.tax_district_id,
			cv.levy_cd,
			cv.fund_id,
			cv.tax_area_id,
			0 as is_joint_district_value,
			cv.active_tif_area_id as tif_area_id,
			sum(case when (opinion_of_value_highly_disputed is NULL or opinion_of_value_highly_disputed <= 0)
				then (real_pers_value_non_annex + real_pers_value_annex + state_value_non_annex + state_value_annex + senior_value_non_annex + senior_value_annex) 
				else (state_value_non_annex + state_value_annex + opinion_of_value_highly_disputed) end) tif_taxable_value,
			sum(cv.tif_base_value) tif_base_value,
			sum(new_const_value_non_annex + new_const_value_annex) tif_new_const_value,
			sum(state_value_non_annex + state_value_annex) tif_state_value,
			sum(prev_state_value) tif_prev_state_value,
			sum(senior_value_non_annex + senior_value_annex) tif_senior_taxable_value,
			sum(cv.tif_senior_base_value) tif_senior_base_value,
			sum(senior_new_const_value_non_annex + senior_new_const_value_annex) tif_senior_new_const_value
		from #captured_value cv
		where active_tif_area_id is not null
		group by
			cv.tax_district_id,
			cv.levy_cd,
			cv.fund_id,
			cv.tax_area_id,
			cv.active_tif_area_id

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 16 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 17 Start' --logging 

		-- set the status on the run to Ready
		update captured_value_run set
			[status] = 'Ready'
		where captured_value_run_id = @captured_value_run_id
			and [year] = @year

		set ansi_warnings off
		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 17 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end
	else
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 18 Start' --logging 

		insert into ##report_captured_value (
			dataset_id,
			as_of_sup_num,
			[year],
			tax_district_id,
			levy_cd,
			tax_area_id,
			appraised_classified,
			appraised_non_classified,
			real_pers_value,
			state_value,
			senior_value,
			new_const_value,
			taxable_value,
			annex_value,
			real_value,
			personal_value,
			senior_real_value,
			senior_personal_value,
			exempted_senior_value,
			is_joint_district_value)
		select
			@dataset_id, -- dataset_id
			@as_of_sup_num, -- as_of_sup_num
			@year, -- year
			cv.tax_district_id, -- tax_district_id
			cv.levy_cd, -- levy_cd
			cv.tax_area_id, -- tax_area_id
			sum(appraised_classified), -- appraised_classified
			sum(appraised_non_classified), -- appraised_non_classified
			sum(real_pers_value_non_annex), -- real_pers_value
			sum(state_value_non_annex), -- state_value 
			sum(senior_value_non_annex), -- senior_value
			sum(new_const_value_non_annex), -- new_const_value
			--sum(real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex), -- taxable_value
			sum(
			case when (opinion_of_value_highly_disputed is NULL or opinion_of_value_highly_disputed <= 0)
			then (real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex) 
			else (state_value_non_annex + opinion_of_value_highly_disputed) end), -- taxable_value

			sum(real_pers_value_annex + state_value_annex + senior_value_annex), -- annex_value
			sum(real_value), -- real_value
			sum(personal_value), -- personal_value
			sum(senior_real_value), -- senior_real_value
			sum(senior_personal_value), -- senior_personal_value
			sum(exempt_senior_value_non_annex), -- exempted_senior_value
			0 -- is_joint_district_value
		from #captured_value as cv with (nolock)
		group by
			cv.tax_district_id,
			cv.levy_cd,
			cv.tax_area_id

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 18 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 19 Start' --logging 

		insert into ##report_captured_value_by_fund (
			dataset_id,
			[year],
			as_of_sup_num,
			tax_district_id,
			levy_cd,
			fund_id,
			tax_area_id,
			appraised_classified,
			appraised_non_classified,
			real_pers_value,
			state_value,
			senior_value,
			new_const_value,
			taxable_value,
			annex_value,
			real_value,
			personal_value,
			senior_real_value,
			senior_personal_value,
			exempted_senior_value,
			is_joint_district_value)
		select
			@dataset_id, -- dataset_id
			@year, -- year
			@as_of_sup_num, -- as_of_sup_num
			cv.tax_district_id, -- tax_district_id
			cv.levy_cd, -- levy_cd
			cv.fund_id, -- fund_id
			cv.tax_area_id, -- tax_area_id
			sum(appraised_classified), -- appraised_classified
			sum(appraised_non_classified), -- appraised_non_classified
			sum(real_pers_value_non_annex), -- real_pers_value
			sum(state_value_non_annex), -- state_value
			sum(senior_value_non_annex), -- senior_value
			sum(new_const_value_non_annex), -- new_const_value
			--sum(real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex), -- taxable_value
			sum(
			case when (opinion_of_value_highly_disputed is NULL or opinion_of_value_highly_disputed <= 0)
			then (real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex) 
			else (state_value_non_annex + opinion_of_value_highly_disputed) end), -- taxable_value

			sum(real_pers_value_annex + state_value_annex + senior_value_annex), -- annex_value
			sum(real_value), -- real_value
			sum(personal_value), -- personal_value
			sum(senior_real_value), -- senior_real_value
			sum(senior_personal_value), -- senior_personal_value
			sum(exempt_senior_value_non_annex), -- exempted_senior_value
			0 -- is_joint_district_value
		from #captured_value as cv with (nolock)
		group by
			cv.tax_district_id,
			cv.levy_cd,
			cv.fund_id,
			cv.tax_area_id

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 19 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end

	if object_id('tempdb..#captured_value') is not null
		drop table #captured_value

	set ansi_warnings on

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

