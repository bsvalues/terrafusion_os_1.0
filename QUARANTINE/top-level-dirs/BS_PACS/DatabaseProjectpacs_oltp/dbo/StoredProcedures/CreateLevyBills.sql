
/******************************************************************************************
 Procedure: CreateLevyBills
 Synopsis:	Creates Levy Bill Records for the most recent accepted Levy Certification
			Run.  This causes records to be created in levy_supp_assoc, trans_group, bill,
			levy_bill, and pending_coll_transaction.
			
 Call From:	App Server
 ******************************************************************************************/
CREATE PROCEDURE CreateLevyBills
	@effective_due_date datetime,
	@pacs_user_id		int,
	-- optional, if not provided the first 'Accepted' status Levy Certification Run is used
	@year				numeric(4, 0) = 0,		
	@levy_cert_run_id	int	= 0,
	@batch_id			int = 0
AS
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
 + ' @effective_due_date =' +  convert(varchar(30),@effective_due_date,120) + ','
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @levy_cert_run_id =' +  convert(varchar(30),@levy_cert_run_id) + ','
 + ' @batch_id =' +  convert(varchar(30),@batch_id) + ','
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

 
	declare @return_message varchar(255)
	
	if @year = 0 or @levy_cert_run_id = 0
		begin
			set @StartStep = getdate()  --logging capture start time
			exec dbo.CurrentActivityLogInsert @proc, 'Step 1 Start' --logging 

			-- get the current certified year for which an Accepted Levy Certification Run 
			-- exists that Levy Bills have not yet been created

			if not exists(
				select * 
				from levy_cert_run as lcr with (nolock) 
				join pacs_year as py with (nolock) on
					py.tax_yr = lcr.[year]
				where py.certification_dt is not null and lcr.status = 'Accepted')
			begin
				set @return_message = 'No "Accepted" Levy Certification Run exists for which levy bills have not been created.'
				goto quit
			end
			
			select 
				@levy_cert_run_id = lcr.levy_cert_run_id,
				@year = lcr.[year]
			from levy_cert_run as lcr with (nolock) 
			join pacs_year as py with (nolock) on py.tax_yr = lcr.[year]
			where 
					py.certification_dt is not null 
				and lcr.status = 'Accepted'

			-- logging end of step 
			SELECT @LogTotRows = @@ROWCOUNT, 
				   @LogErrCode = @@ERROR 
			   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
			exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


		end
	else
		begin
			set @StartStep = getdate()  --logging capture start time
			exec dbo.CurrentActivityLogInsert @proc, 'Step 2 Start' --logging 

			if not exists
			(
				select * 
				from levy_cert_run as lcr with (nolock) 
				join pacs_year as py with (nolock) on
					py.tax_yr = lcr.[year]
				where 
						lcr.levy_cert_run_id	= @levy_cert_run_id
					and lcr.[year]				= @year
					and lcr.status				= 'Accepted'
					and py.certification_dt		is not null 
			)
			begin
				set @return_message = 'The specified Levy Certification Run must have an "Accepted" status for a year whose property values have been certified.'
				goto quit
			end

			-- logging end of step 
			SELECT @LogTotRows = @@ROWCOUNT, 
				   @LogErrCode = @@ERROR 
			   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
			exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
		end
	

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Start' --logging 

-- Check to see if record already exists
-- If already exists then nothing to do.
-- May have to use cursor
	declare @owner_tax_yr  numeric(4,0),
		@sup_num1	int,
		@prop_id1	int,
		@type		char

	declare levySupAssoc cursor fast_forward for
		select 
			'L',
			psa.owner_tax_yr,
			psa.sup_num,
			psa.prop_id
		from prop_accepted_supp_assoc_vw as psa with(nolock)
		join property_val as pv with(nolock) on
			pv.prop_val_yr = psa.owner_tax_yr and
			pv.sup_num = psa.sup_num and
			pv.prop_id = psa.prop_id and
			pv.prop_inactive_dt is null
		where psa.owner_tax_yr = @year

	-- begin processing each record
	set nocount on
	open levySupAssoc
	fetch next from levySupAssoc into
		@type, @owner_tax_yr, @sup_num1, @prop_id1
	
	while @@fetch_status = 0
	begin
		if (not exists(select prop_id
			from levy_supp_assoc lsa with (nolock)
			where lsa.[type] = @type
			and lsa.prop_id = @prop_id1
			and lsa.sup_num = @sup_num1
			and lsa.sup_yr = @owner_tax_yr))
		begin
			insert into levy_supp_assoc ([type], sup_yr, sup_num, prop_id)
			select @type, @owner_tax_yr, @sup_num1, @prop_id1
		end
		fetch next from levySupAssoc into
			@type, @owner_tax_yr, @sup_num1, @prop_id1
	end -- end while

	close levySupAssoc
	deallocate levySupAssoc



	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Cursor Start' --logging 

	-- TIF work tables
	if object_id('tempdb..#bill_data') is not null
	drop table #bill_data
	if object_id('tempdb..#tif_data') is not null
		drop table #tif_data
	if object_id('tempdb..#tif_levy_data') is not null
		drop table #tif_levy_data

	create table #tif_data
	(
		prop_id int not null,
		year numeric(4,0) not null,
		sup_num int not null,
		tax_district_id int not null,
		levy_cd varchar(10) not null,
		tif_area_id int null,
		taxable_nc numeric(14, 0) null,
		taxable_c numeric(14, 0) null,
		increment_nc numeric(14, 0) null,
		increment_c numeric(14, 0) null,

		primary key (prop_id, year, sup_num, tax_district_id, levy_cd)
	)

	create table #tif_levy_data
	(
		tax_district_id int not null,
		levy_cd varchar(10) not null,
		tif_area_id int not null,
		taxable_nc numeric(14, 0) null,
		taxable_c numeric(14, 0) null,
		increment_nc numeric(14, 0) null,
		increment_c numeric(14, 0) null,

		primary key (tax_district_id, levy_cd, tif_area_id)
	)

	-- declare variables and a cursor to process each property and create its bills.
	declare @scale_config varchar(511)
	declare @scale_tif_increments bit

	select @scale_config = szConfigValue
	from pacs_config
	where szGroup = 'Levy'
	and szConfigName = 'Scale LTIF Increments'

	set @scale_tif_increments = case when @scale_config in ('1','T') then 1 else 0 end


	declare 
		@tax_yr					int,
		@sup_num				int,
		@prop_id				int,
		@owner_id				int,
		@prop_type_cd			char(5),
		@tax_district_id		int,
		@levy_cd				varchar(10),
		@levy_exempts_snr		varchar(10),
		@levy_exempts_farm		varchar(10),
		@levy_rate				numeric(13, 10),
		@senior_levy_rate		numeric(13, 10),
		@prop_exempts_snr		bit,
		@levy_rate_classified	numeric(13, 10),
		@levy_rate_non_classified numeric(13, 10),
		@taxable_classified		numeric(14, 0),
		@taxable_non_classified	numeric(14, 0),
		@state_assessed			numeric(14, 0),
		@total_taxable_value	numeric(14, 0),
		@base_tax_due			numeric(14, 2),
		@bill_id				int,
		@transaction_id			int,
		@late_filing_penalty_pct numeric(5,2),
		@late_fee_type_cd		varchar(10),
		@late_penalty_amount	numeric(14,2),
		@late_fee_id			int,
		@late_fee_current_amount_due	numeric(14,2),
		@fraud_fee_type_cd		varchar(10),
		@fraud_penalty_amount	numeric(14,2),
		@fraud_fee_id			int,
		@fraud_penalty_pct		numeric(5,2),
		@fraud_fee_current_amount_due	numeric(14,2),
		@tax_area_id				int,
		@max_penalty				int,
		@is_tif_originating_levy	bit,
		@is_tif_sponsoring_levy		bit,
		@tif_area_id				int,
		@tif_base_non_classified	numeric(14, 0),
		@tif_base_classified		numeric(14, 0),
		@new_val_classified			numeric(14, 0),
		@new_val_non_classified		numeric(14, 0),
		@state						numeric(14, 0),
		@state_prev					numeric(14, 0),
		@tif_originating_tax_district_id	int,
		@tif_originating_levy_cd			varchar(10),
		@tif_originating_levy_rate			numeric(13, 10),
		@tif_originating_senior_levy_rate	numeric(13, 10),

		@tif_increment_classified		numeric(14, 0),
		@tif_increment_non_classified	numeric(14, 0),

		@tif_taxable_nc		numeric(14,0),
		@tif_increment_nc	numeric(14,0),
		@tif_taxable_c		numeric(14,0),
		@tif_increment_c	numeric(14,0)

		
	--Fee Types
	select @late_fee_type_cd = isNull(szConfigValue, 'LATE')
	from pacs_config
	where szGroup = 'BPPRenditionFees'	
	and szConfigName = 'Late Filing'

	select @fraud_fee_type_cd = isNull(szConfigValue, 'FRAUD')
	from pacs_config
	where szGroup = 'BPPRenditionFees'	
	and szConfigName = 'Fraud'

		-- create a bill data set with every property/levy that will have bills created
		select 
			lsa.sup_yr, -- @tax_yr
			lsa.sup_num, -- @sup_num
			lsa.prop_id, -- @prop_id
			tafa.tax_district_id, -- @tax_district_id
			tafa.levy_cd, -- @levy_cd
			o.owner_id, -- @owner_id
			p.prop_type_cd, -- @prop_type_cd
			isnull(le_snr.exmpt_type_cd, '') as levy_exempts_snr, -- @levy_exempts_snr
			isnull(le_frm.exmpt_type_cd, '') as levy_exempts_farm, -- @levy_exempts_farm
			isnull(l.levy_rate, 0) levy_rate, -- @levy_rate
			isnull(l.senior_levy_rate, 0) senior_levy_rate, -- @senior_levy_rate
			case when (pe_snr.exmpt_type_cd is not null) then 1 else 0 end as prop_exempts_snr, -- @prop_exempts_snr
			isnull(wpov.taxable_classified, 0) as taxable_classified, -- @taxable_classified
			isnull(wpov.taxable_non_classified, 0) as taxable_non_classified, -- @taxable_non_classified
			isnull(wpov.state_assessed, 0) as state_assessed, -- @state_assessed
			isNull(pv.late_filing_penalty_pct, 0) as late_filing_penalty_pct, -- @late_filing_penalty_pct
			isNull(rpc.max_penalty, 999999999) as max_penalty, -- @max_penalty
			isNull(pv.fraud_penalty_pct, 0) as fraud_penalty_pct, -- @fraud_penalty_pct
			pta.tax_area_id, -- @tax_area_id
			lb.bill_id, -- @bill_id
			case when tif_originating.tif_area_id is null then 0 else 1 end is_tif_originating_levy, --@is_tif_originating_levy
			case when tif_sponsoring.tif_area_id is null then 0 else 1 end is_tif_sponsoring_levy, --is_tif_sponsoring_levy
			isnull(tif_originating.tif_area_id, tif_sponsoring.tif_area_id) tif_area_id, -- @tif_area_id
			isnull(tif_originating.base_non_classified, tif_sponsoring.base_non_classified) tif_base_non_classified, -- @tif_base_non_classified
			isnull(tif_originating.base_classified, tif_sponsoring.base_classified) tif_base_classified, -- @tif_base_classified
			tif_sponsoring.tif_originating_tax_district_id,
			tif_sponsoring.tif_originating_levy_cd,
			isnull(tif_sponsoring.tif_originating_levy_rate, 0) tif_originating_levy_rate,
			isnull(tif_sponsoring.tif_originating_senior_levy_rate, 0) tif_originating_senior_levy_rate,
			isnull(wpov.new_val_nhs, 0) + isnull(wpov.new_val_p, 0) as new_val_non_classified, -- @new_val_non_classified
			isnull(wpov.new_val_hs, 0) as new_val_classified, -- @new_val_classified
			isnull(wpov.state_assessed, 0) as state, -- @state
			isnull(wpov_prev.state_assessed, 0) as state_prev -- @state_prev

		into #bill_data

		from levy_supp_assoc as lsa with (nolock)
		join [owner] as o with (nolock) on
				o.owner_tax_yr			= lsa.sup_yr
			and o.sup_num				= lsa.sup_num
			and o.prop_id				= lsa.prop_id
		join [property] as p with (nolock) on
				p.prop_id				= lsa.prop_id

		join property_val as pv with (nolock) on
			pv.prop_val_yr				= lsa.sup_yr
			and pv.sup_num				= lsa.sup_num
			and pv.prop_id				= lsa.prop_id

		join wash_prop_owner_val as wpov with (nolock) on
				wpov.[year]				= lsa.sup_yr
			and wpov.sup_num			= lsa.sup_num
			and wpov.prop_id			= lsa.prop_id
			and wpov.owner_id			= o.owner_id
		join property_tax_area as pta with (nolock) on
				pta.[year]				= lsa.sup_yr
			and pta.sup_num				= lsa.sup_num
			and pta.prop_id				= lsa.prop_id
		join tax_area_fund_assoc as tafa with (nolock) on
				tafa.[year]				= pta.[year]
			and tafa.tax_area_id		= pta.tax_area_id
		join levy as l with (nolock) on
				l.[year]				= tafa.[year]
			and l.tax_district_id		= tafa.tax_district_id
			and l.levy_cd				= tafa.levy_cd
		join levy_cert_run_detail as lcrd with(nolock) on
				lcrd.[year]				= l.[year]
			and lcrd.tax_district_id	= l.tax_district_id
			and lcrd.levy_cd			= l.levy_cd

		left join prop_accepted_supp_assoc_vw psa_prev with(nolock)
			on psa_prev.prop_id = lsa.prop_id
			and psa_prev.owner_tax_yr = lsa.sup_yr - 1
		left join wash_prop_owner_val wpov_prev with(nolock)
			on wpov_prev.prop_id = psa_prev.prop_id
			and wpov_prev.year = psa_prev.owner_tax_yr
			and wpov_prev.sup_num = psa_prev.sup_num
			and wpov_prev.owner_id = o.owner_id

		outer apply (
			select top 1 lct.year, lct.tax_district_id, lct.levy_cd, ta.base_year, ta.tif_area_id, 
				tapv.base_value - tapv.senior_base_value as base_non_classified, tapv.senior_base_value as base_classified
			from levy_cert_tif lct
			join tif_area ta with(nolock)
				on ta.tif_area_id = lct.tif_area_id
			join tif_area_prop_values tapv with(nolock) 
				on tapv.tif_area_id = ta.tif_area_id
				and tapv.prop_id = pv.prop_id
			where lct.levy_cert_run_id = lcrd.levy_cert_run_id
			and lct.year = lcrd.year
			and lct.tax_district_id = l.tax_district_id
			and lct.levy_cd = l.levy_cd
		) tif_originating

		outer apply (
			select top 1 tal.year, tal.tax_district_id, tal.levy_cd, ta.base_year, ta.tif_area_id, 
				tapv.base_value - tapv.senior_base_value as base_non_classified, tapv.senior_base_value as base_classified,
				ol.tax_district_id tif_originating_tax_district_id, ol.levy_cd tif_originating_levy_cd,
				ol.levy_rate tif_originating_levy_rate, ol.senior_levy_rate tif_originating_senior_levy_rate
			from levy_cert_tif lct
			join tif_area_levy tal
				on lct.tif_area_id = tal.tif_area_id
				and lct.year = tal.year
				and lct.tax_district_id = tal.tax_district_id
				and lct.levy_cd = tal.levy_cd
			join tif_area ta with(nolock)
				on ta.tif_area_id = lct.tif_area_id
			join tif_area_prop_values tapv with(nolock) 
				on tapv.tif_area_id = ta.tif_area_id
				and tapv.prop_id = pv.prop_id
			join tif_area_prop_assoc tapa with(nolock)
				on tapa.tif_area_id = lct.tif_area_id 
				and tapa.prop_id = pv.prop_id
				and tapa.year = pv.prop_val_yr
				and tapa.sup_num = pv.sup_num
			join levy ol with(nolock)
				on ol.tax_district_id = tal.tax_district_id
				and ol.levy_cd = tal.levy_cd
				and ol.year = tal.year
			where 
				lct.levy_cert_run_id = lcrd.levy_cert_run_id
				and tal.year = l.year
				and tal.linked_tax_district_id = l.tax_district_id
				and tal.linked_levy_cd = l.levy_cd
		) tif_sponsoring

		left join levy_exemption as le_snr with (nolock) on
				le_snr.[year]			= l.[year]
			and le_snr.tax_district_id	= l.tax_district_id
			and le_snr.levy_cd			= l.levy_cd
			and le_snr.exmpt_type_cd	= 'SNR/DSBL'
		left join levy_exemption as le_frm with (nolock) on
				le_frm.[year]			= l.[year]
			and le_frm.tax_district_id	= l.tax_district_id
			and le_frm.levy_cd			= l.levy_cd
			and le_frm.exmpt_type_cd	= 'FARM'
		left join property_exemption as pe_snr with(nolock)
			on pe_snr.exmpt_tax_yr		= lsa.sup_yr
			and pe_snr.owner_tax_yr		= lsa.sup_yr
			and pe_snr.prop_id			= lsa.prop_id
			and pe_snr.sup_num			= lsa.sup_num
			and pe_snr.owner_id			= o.owner_id
			and pe_snr.exmpt_type_cd	= 'SNR/DSBL'
		left join (
			select levb.bill_id, levb.levy_cd, levb.[year], levb.tax_district_id, b.prop_id
			from levy_bill levb with(nolock)
			inner join bill b with(nolock)
			on levb.bill_id = b.bill_id
			) lb on
				lb.levy_cd = tafa.levy_cd
			and lb.[year] = lsa.sup_yr
			and lb.tax_district_id = l.tax_district_id
			and lb.prop_id = lsa.prop_id
		outer apply (
			select top 1 rpci.*
			from rendition_penalty_config rpci
			where rpci.year = pv.prop_val_yr
			and rpci.penalty_percent = pv.late_filing_penalty_pct
			order by rpci.start_date
		) rpc
		where	lcrd.levy_cert_run_id	= @levy_cert_run_id
			and lcrd.[year]				= @year
			and isNull(pv.prop_inactive_dt, '')	= ''

			-- Create LTIF sponsoring levy bills on the correct LTIF area properties only
			and not (
				tif_sponsoring.tif_area_id is null
				and exists (
					select 1 from tif_area_levy tal with(nolock)
					where tal.linked_tax_district_id = l.tax_district_id
					and tal.linked_levy_cd = l.levy_cd
					and tal.year = l.year
				)
			)


	alter table #bill_data
	add primary key (sup_yr, sup_num, prop_id, tax_district_id, levy_cd)


	-- Calculate taxable values and increments per property.
	insert #tif_data
	(
		prop_id, year, sup_num, tax_district_id, levy_cd, 
		tif_area_id, taxable_nc, taxable_c, increment_nc, increment_c
	)
	select prop_id, sup_yr, sup_num, tax_district_id, levy_cd, tif_area_id, 
		taxable_non_classified, taxable_classified, 
		taxable_non_classified - tif_base_non_classified - new_val_non_classified - (case when state > state_prev then state - state_prev else 0 end),
		taxable_classified - tif_base_classified - new_val_classified
	from #bill_data bd
	where bd.is_tif_originating_levy = 1


	if @scale_tif_increments = 0
	begin
		-- calculate bills using the amounts on each property individually

		-- keep property increments in bounds
		update #tif_data set
			increment_nc = case when increment_nc < 0 then 0 when increment_nc > taxable_nc then taxable_nc else increment_nc end,
			increment_c = case when increment_c < 0 then 0 when increment_c > taxable_c then taxable_c else increment_c end
	end

	else begin
		-- Scale the increments: Set each property increment to a fixed percentage of its taxable value,
		-- so that the increments for each levy will sum to match the increment calculated from the total values.

		-- get levy data sums
		insert #tif_levy_data
		(tax_district_id, levy_cd, tif_area_id, taxable_nc, taxable_c, increment_nc, increment_c)
		select tax_district_id, levy_cd, tif_area_id,
			sum(taxable_nc) as taxable_nc, sum(taxable_c) as taxable_c,
			sum(increment_nc) as increment_nc, sum(increment_c) as increment_c
		from #tif_data
		group by tax_district_id, levy_cd, tif_area_id
	
		-- get the actual increments from levy cert
		update tld
		set increment_nc = isnull(lct.tif_non_senior_increment, 0),
			increment_c = isnull(lct.tif_senior_increment, 0)
		from #tif_levy_data tld
		join levy_cert_tif lct
			on lct.levy_cert_run_id = @levy_cert_run_id
			and lct.year = @year
			and lct.tax_district_id = tld.tax_district_id
			and lct.levy_cd = tld.levy_cd
			and lct.tif_area_id = tld.tif_area_id

		-- keep levy increments in bounds
		update #tif_levy_data set
			increment_nc = case when increment_nc < 0 then 0 when increment_nc > taxable_nc then taxable_nc else increment_nc end,
			increment_c = case when increment_c < 0 then 0 when increment_c > taxable_c then taxable_c else increment_c end

		-- scale the increments
		update td
		set increment_nc = case when tld.taxable_nc = 0 then 0 else td.taxable_nc * (tld.increment_nc / tld.taxable_nc) end,
			increment_c = case when tld.taxable_c = 0 then 0 else td.taxable_c * (tld.increment_c / tld.taxable_c) end
		from #tif_data td
		join #tif_levy_data tld
			on tld.tax_district_id = td.tax_district_id
			and tld.levy_cd = td.levy_cd
			and tld.tif_area_id = td.tif_area_id
	end


	-- output to [tif_area_bill_values]
	update tabv
	set remainder_nc = td.taxable_nc - td.increment_nc,
		increment_nc = td.increment_nc,
		remainder_c = td.taxable_c - td.increment_c,
		increment_c = td.increment_c
	from tif_area_bill_values tabv
	join #tif_data td
	on td.tif_area_id = tabv.tif_area_id
	and td.prop_id = tabv.prop_id
	and td.year = tabv.year
	and td.sup_num = tabv.sup_num
	and td.tax_district_id = tabv.tax_district_id
	and td.levy_cd = tabv.levy_cd

	insert tif_area_bill_values
	(tif_area_id, prop_id, year, sup_num, tax_district_id, levy_cd,
		remainder_nc, increment_nc, remainder_c, increment_c)
	select tif_area_id, prop_id, year, sup_num, tax_district_id, levy_cd,
		td.taxable_nc - td.increment_nc, td.increment_nc,
		td.taxable_c - td.increment_c, td.increment_c
	from #tif_data td
	where not exists (
		select 1 from tif_area_bill_values x
		where x.tif_area_id = td.tif_area_id
		and x.prop_id = td.prop_id
		and x.year = td.year
		and x.sup_num = td.sup_num
		and x.tax_district_id = td.tax_district_id
		and x.levy_cd = td.levy_cd
	)
	

	declare billData cursor fast_forward for
	select bd.*, 
		isnull(orig.taxable_nc, spon.taxable_nc) taxable_nc, isnull(orig.increment_nc, spon.increment_nc) increment_nc, 
		isnull(orig.taxable_c, spon.taxable_c) taxable_c, isnull(orig.increment_c, spon.increment_c) increment_c 
	from #bill_data bd
	left join #tif_data orig
		on orig.prop_id = bd.prop_id
		and orig.year = bd.sup_yr
		and orig.sup_num = bd.sup_num
		and orig.tax_district_id = bd.tax_district_id
		and orig.levy_cd = bd.levy_cd
	left join #tif_data spon
		on spon.prop_id = bd.prop_id
		and spon.year = bd.sup_yr
		and spon.sup_num = bd.sup_num
		and spon.tax_district_id = bd.tif_originating_tax_district_id
		and spon.levy_cd = bd.tif_originating_levy_cd



	-- begin processing each record
	set nocount on
	open billData
	fetch next from billData into
		@tax_yr, @sup_num, @prop_id, @tax_district_id, @levy_cd, @owner_id, @prop_type_cd, 
		@levy_exempts_snr, @levy_exempts_farm, @levy_rate, @senior_levy_rate, @prop_exempts_snr,
		@taxable_classified, @taxable_non_classified, @state_assessed, @late_filing_penalty_pct, @max_penalty,
		@fraud_penalty_pct, @tax_area_id, @bill_id, 
		@is_tif_originating_levy, @is_tif_sponsoring_levy, @tif_area_id, @tif_base_non_classified, @tif_base_classified, 
		@tif_originating_tax_district_id, @tif_originating_levy_cd,
		@tif_originating_levy_rate, @tif_originating_senior_levy_rate,
		@new_val_non_classified, @new_val_classified, @state, @state_prev,
		@tif_taxable_nc, @tif_increment_nc, @tif_taxable_c, @tif_increment_c
	
	while @@fetch_status = 0
	begin

		-- only create records for this levy if there is a levy rate
		if @levy_rate <> 0
		begin
		
			if ((@is_tif_originating_levy = 1) or (@is_tif_sponsoring_levy = 1))
			begin
				-- override the taxable values and tax rates
				if (@is_tif_originating_levy = 1)
				begin
					-- originating: amount left after increment removed
					set @taxable_classified = @tif_taxable_c - @tif_increment_c
					set @taxable_non_classified = @tif_taxable_nc - @tif_increment_nc
				end
				else if (@is_tif_sponsoring_levy = 1)
				begin
					-- sponsoring: increments
					set @taxable_classified = @tif_increment_c
					set @taxable_non_classified = @tif_increment_nc

					-- replace the sponsoring levy's tax rates with the rates of the originating levy
					set @levy_rate = @tif_originating_levy_rate
					set @senior_levy_rate = @tif_originating_senior_levy_rate
				end
			end

			-- determine total taxable value for this levy
			if @prop_type_cd in ('R', 'MH') and @levy_exempts_snr = 'SNR/DSBL'
				begin
					-- classified value is exempt, assume no state assessed
					set @total_taxable_value = @taxable_non_classified
					set @levy_rate_classified = 0
				end
			else if @prop_type_cd = 'P' and @levy_exempts_farm = 'FARM'
				begin
					-- classified value is exempt, assume no state assessed
					set @total_taxable_value = @taxable_non_classified
					set @levy_rate_classified = 0
				end
			else if (@prop_exempts_snr = 1 and @senior_levy_rate > 0)
				begin
					-- senior properties are exempt from a Lid Lift on this levy, 
					-- and have a reduced levy rate on classified value
					set @total_taxable_value = @taxable_non_classified + @taxable_classified
					set @levy_rate_classified = @senior_levy_rate						
				end
			else
				begin
					-- classified value is not exempt, state assessed may exist
					set @total_taxable_value = @taxable_non_classified + @taxable_classified 
					set @levy_rate_classified = @levy_rate
				end



			set @levy_rate_non_classified = @levy_rate

			-- calculate a tax due amount
			set @base_tax_due = (@taxable_classified * @levy_rate_classified / 1000.0) +
				(@taxable_non_classified * @levy_rate_non_classified / 1000.0)

			-- only create records if the levy bill doesn't already exist
			if (@bill_id is null)
			begin
				-- get a new trans_group_id (ie bill_id)
				exec GetUniqueID 'trans_group', @bill_id output

				-- create the trans_group record
				insert into trans_group (trans_group_id, trans_group_type) values (@bill_id, 'LB')

				-- create a record in the bill table
				insert into bill
				(
					bill_id,
					prop_id,
					[year],
					sup_num,
					owner_id,
					initial_amount_due,
					current_amount_due,
					amount_paid,
					effective_due_date,
					bill_type,
					is_active,
					created_by_type_cd
				)
				values
				(
					@bill_id,
					@prop_id,
					@tax_yr,
					@sup_num,
					@owner_id,
					@base_tax_due,
					@base_tax_due,
					0,
					@effective_due_date,
					'L',
					0,
					'CERT'
				)


				-- create a levy_bill record
				insert into levy_bill
				(
					bill_id,
					levy_cd,
					[year],
					tax_district_id,
					taxable_val,
					tax_area_id
				)
				values
				(
					@bill_id,
					@levy_cd,
					@tax_yr,
					@tax_district_id,
					@total_taxable_value,
					@tax_area_id
				)

				-- create a bill_payments_due record
				insert into bill_payments_due
				(
					bill_id,
					bill_payment_id,
					amount_due,
					amount_paid,
					due_date
				)
				values
				(
					@bill_id,
					0,
					@base_tax_due,
					0,
					@effective_due_date
				)
			end -- if bill_id is null
			
		
			-- get a new transaction_id
			exec GetUniqueID 'coll_transaction', @transaction_id output

			-- create a pending_coll_transaction record
			-- needs to go outside the if / else since it gets created anyway
			insert into pending_coll_transaction
			(
				pending_transaction_id,
				trans_group_id,
				base_amount,
				base_amount_pd,
				penalty_amount_pd,
				interest_amount_pd,
				bond_interest_pd,
				transaction_type,
				underage_amount_pd,
				overage_amount_pd,
				other_amount_pd,
				pacs_user_id,
				transaction_date
			)
			values
			(
				@transaction_id,
				@bill_id,
				@base_tax_due,
				0,						-- base_amount_pd
				0,						-- penalty_amount_pd
				0,						-- interest_amount_pd
				0,						-- bond_interest_pd
				'CLB', 					-- transaction_type
				0,						-- underage_amount_pd
				0,						-- overage_amount_pd
				0,						-- other_amount_pd
				@pacs_user_id,
				getdate()
			)

			-- Calculate BPP penalties for Personal property
			if @prop_type_cd = 'P' and @base_tax_due > 0
			begin 
				-- Calculate BPP penalties for Personal property
				set @late_penalty_amount = @base_tax_due * (@late_filing_penalty_pct / 100)
				if (@late_penalty_amount > @max_penalty) begin
					set @late_penalty_amount = @max_penalty
				end

				set @fraud_penalty_amount = @base_tax_due * (@fraud_penalty_pct / 100)

				if (@late_penalty_amount > 0)
				begin
					exec CreatePropOrBillFee		0, @pacs_user_id, @tax_yr, @batch_id, 0, @bill_id, 
													@sup_num, @owner_id, @late_penalty_amount, 
													@late_fee_type_cd, @effective_due_date, 0, 
													null, null, null, null, null, null, null, null, null, 0
				end

				if (@fraud_penalty_amount > 0)
				begin
					exec CreatePropOrBillFee		0, @pacs_user_id, @tax_yr, @batch_id, 0, @bill_id, 
													@sup_num, @owner_id, @fraud_penalty_amount, 
													@fraud_fee_type_cd, @effective_due_date, 0,
													null, null, null, null, null, null, null, null, null, 0
				end
			end
		end

		fetch next from billData into
		@tax_yr, @sup_num, @prop_id, @tax_district_id, @levy_cd, @owner_id, @prop_type_cd,
		@levy_exempts_snr, @levy_exempts_farm, @levy_rate, @senior_levy_rate, @prop_exempts_snr,
		@taxable_classified, @taxable_non_classified, @state_assessed, @late_filing_penalty_pct, @max_penalty,
		@fraud_penalty_pct, @tax_area_id, @bill_id, 
		@is_tif_originating_levy, @is_tif_sponsoring_levy, @tif_area_id, @tif_base_non_classified, @tif_base_classified, 
		@tif_originating_tax_district_id, @tif_originating_levy_cd,
		@tif_originating_levy_rate, @tif_originating_senior_levy_rate,
		@new_val_non_classified, @new_val_classified, @state, @state_prev,
		@tif_taxable_nc, @tif_increment_nc, @tif_taxable_c, @tif_increment_c
	end

	close billData
	deallocate billData

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 5 Cursor End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 6 Start' --logging 

	--update levy cert run record 
	update levy_cert_run set
		bills_created_date = getdate(),
		bills_created_by_id = @pacs_user_id,
		[status] = 'Bills Created'
	where	levy_cert_run_id = @levy_cert_run_id
		and [year] = @year

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


quit:
	select @return_message as return_message
-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate())) + '; ' +  isnull(@return_message,'')

exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

