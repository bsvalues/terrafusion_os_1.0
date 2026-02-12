
CREATE PROCEDURE [dbo].[CreateSupplementLevyBills]
	@effective_due_date datetime,
	@omitted_effective_due_date datetime,
	@pacs_user_id		int,
	@sup_group_id	int	= 0,
	@batch_id int = 0,
	@accept_prop_id int = 0,
	@accept_prop_yr int = 0
AS
	set nocount on

	-- declare variables and a curose to process each property and create its bills.
	declare 
		@tax_yr					int,
		@sup_num				int,
		@prop_id				int,
		@owner_id				int,
		@prop_type_cd			char(5),
		@tax_district_id		int,
		@levy_cd				varchar(10),
		@taxable_classified		numeric(14, 0),
		@taxable_non_classified	numeric(14, 0),			
		@bill_id				int,
		@bill_current_amount_due	numeric(14, 2),
		@bill_initial_amount_due	numeric(14, 2),
		@tax_area_id			int,
		@levy_exempts_snr		varchar(10),
		@levy_exempts_farm		varchar(10),
		@levy_rate				numeric(13, 10),
		@senior_levy_rate		numeric(13, 10),
		@prop_exempts_snr		bit,
		@base_tax_due			numeric(14, 2),
		@total_taxable_value	numeric(14, 0),
		@state_assessed			numeric(14, 0),
		@transaction_id			int,
		@bill_adjustment_amount	numeric(14,2),
		@bill_adj_id			int,
		@sup_cd					varchar(10),
		@sup_desc				varchar(500),
		@supp_attribute			int,  
		@current_tax_yr			int,
		@offset					int,
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
		@appraised				numeric(14,0),
		@prorate_type			varchar(5),
		@prorate_pct			decimal(20,19),
		@destroyed_prop			bit,
		@destroyed_prorate_pct  decimal(20,19),
		@destroyed_jan1_classified_value numeric(14,0),
		@destroyed_jan1_non_classified_value numeric(14,0),
		@payment_count			int,
		@levy_rate_classified	numeric(13,10),
		@levy_rate_non_classified numeric(13,10),
		@balance_dt				datetime,
		@current_eff_date		datetime,
		@amount_paid			numeric(14,2),
		@statement_id			int,
		@currentPropID			int,
		@currentStatementYear	int,
		@is_half_pay			bit,
		@stmt_h1_paid			bit,
		@payment_status			varchar(10),
		@statement_eff_date		datetime,
		@ignoreOct31			bit,
		@splitMergeID			int,
		@splitMergeType			varchar(10),
		@currentStatementID		int,
		@postpone_duedate		bit,
		@prorated_tax_amt	numeric(14,2),
		@is_tif_originating_levy	bit,
		@is_tif_sponsoring_levy		bit,
		@tif_area_id				int,
		@tif_base_non_classified	numeric(14, 0),
		@tif_base_classified		numeric(14, 0),
		@new_val_classified			numeric(14, 0),
		@new_val_non_classified		numeric(14, 0),
		@state						numeric(14, 0),
		@state_prev					numeric(14, 0),
		@tif_originating_levy_rate			numeric(13, 10),
		@tif_originating_senior_levy_rate	numeric(13, 10),
		@tif_remainder_classified		numeric(14, 0),
		@tif_remainder_non_classified	numeric(14, 0),
		@tif_increment_classified		numeric(14, 0),
		@tif_increment_non_classified	numeric(14, 0),

		@tif_value_change_c				numeric(14, 0),
		@tif_value_change_nc			numeric(14, 0)

	--Determine the system info
	select @current_tax_yr = tax_yr
	from pacs_system		
	
	select top 1 @postpone_duedate = postpone_duedate
 	from pacs_system	
	order by  system_type desc
	
	select @late_fee_type_cd = szConfigValue
	from pacs_config
	where szGroup = 'BPPRenditionFees'	
	and szConfigName = 'Late Filing'

	select @fraud_fee_type_cd = szConfigValue
	from pacs_config
	where szGroup = 'BPPRenditionFees'	
	and szConfigName = 'Fraud'

	select @ignoreOct31 = isNull(cast(szConfigValue as bit), 0)
	from pacs_config
	where szGroup = 'SupplementDueDate'	
	and szConfigName = 'Ignore Oct 31'

	

	select @balance_dt = balance_dt
	from batch
	where batch_id = @batch_id
	set @currentPropID = -1
	set @currentStatementYear = -1
	set @currentStatementID = -1

	--create temp tables to store statement-level information
	if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#tmpAdj'))
	begin
		drop table #tmpAdj
	end			
		
	if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#tmpPropIDs'))
	begin
		drop table #tmpPropIDs
	end	
		
	create table #tmpAdj (bill_adjustment_id int, bill_id int)
	create index #ndx_bill_adj_id_bill_id on #tmpAdj (bill_adjustment_id, bill_id)

	create table #tmpPropIDs (year numeric(4, 0), prop_id int, sup_num int)
	create index #ndx_year_prop_id_sup_num on #tmpPropIDs (year, prop_id, sup_num)	

	--create temp tables to store property and statement-level information
	if(@accept_prop_id > 0) 
	begin
		insert into #tmpPropIDs (year, prop_id, sup_num)
		select prop_val_yr, pv.prop_id, pv.sup_num
		from property_val pv with (nolock)
		join supplement s with (nolock) 
			on s.sup_tax_yr = pv.prop_val_yr
			and s.sup_num = pv.sup_num
		join levy_cert_run as lcr with (nolock) on
			lcr.year = pv.prop_val_yr and
			isNull(lcr.bills_activated_date, '') <> ''
		where s.sup_group_id = @sup_group_id
		and pv.prop_id = @accept_prop_id 
		and pv.prop_val_yr = @accept_prop_yr
		and not exists (
			select 1 from ag_rollback ar
			where ar.prop_id = pv.prop_id
			and ar.accept_sup_group_id = @sup_group_id
			and isnull(ar.accept_sup_group_id, 0) <> isnull(ar.void_sup_group_id, 0)
		)
	end
	else
	begin
		insert into #tmpPropIDs (year, prop_id, sup_num)
		select prop_val_yr, pv.prop_id, pv.sup_num
		from property_val pv with (nolock)
		join supplement s with (nolock) 
			on s.sup_tax_yr = pv.prop_val_yr
			and s.sup_num = pv.sup_num
		join levy_cert_run as lcr with (nolock) on
			lcr.year = pv.prop_val_yr and
			isNull(lcr.bills_activated_date, '') <> ''
		where s.sup_group_id = @sup_group_id
		and not exists (
			select 1 from ag_rollback ar
			where ar.prop_id = pv.prop_id
			and ar.accept_sup_group_id = @sup_group_id
			and isnull(ar.accept_sup_group_id, 0) <> isnull(ar.void_sup_group_id, 0)
		)
	end

	--insert statement data
	insert into supplement_idlist (sup_group_id, year, prop_id, statement_id, effective_due_date, h1_paid, updated)
	select @sup_group_id, year, prop_id, statement_id, max(effective_due_date), 0, 0
	from (
			select b.year, b.prop_id, statement_id, b.effective_due_date
			from bill b with (nolock)
			join #tmpPropIDs t on t.prop_id = b.prop_id and t.year = b.year
			where isNull(case when bill_type = 'RR' then 0 else rollback_id end, 0) = 0
			and isNull(statement_id, 0) > 0

			union all

			select f.year, fpv.prop_id, statement_id, f.effective_due_date
			from fee f with (nolock)
			join fee_property_vw fpv with (nolock)
			on f.fee_id = fpv.fee_id
			join #tmpPropIDs t on t.prop_id = fpv.prop_id and t.year = f.year
			where isNull(rollback_id, 0) = 0
			and isNull(statement_id, 0) > 0
	) tmp 
	group by year, prop_id, statement_id

	update supplement_idlist
	set h1_paid = case 
					when (isNull(b.totalDue, 0) + isNull(f.totalDue, 0) > 0) and
					isNull(b.due, 0) = 0 and isNull(f.due, 0) = 0 then 1 else 0 end
	from supplement_idlist stmt
	left join (	select year, prop_id, statement_id, sum(current_amount_due) totalDue,
			sum(bpd.amount_paid - bpd.amount_due) due 
			from bill with (nolock)
			join bill_payments_due bpd with (nolock) on bpd.bill_id = bill.bill_id
			and bpd.bill_payment_id = 0
			group by year, prop_id, statement_id) b on b.year = stmt.year
	and b.prop_id = stmt.prop_id and b.statement_id = stmt.statement_id

	left join (	select fee.year, prop_id, statement_id, sum(current_amount_due) totalDue,
			sum(fpd.amount_paid - fpd.amount_due) due 
			from fee with (nolock)
			join fee_property_vw fpv with (nolock) on fpv.fee_id = fee.fee_id
			join fee_payments_due fpd with (nolock) on fpd.fee_id = fee.fee_id
			and fpd.fee_payment_id = 0
			group by fee.year, prop_id, statement_id) f on f.year = stmt.year
	and f.prop_id = stmt.prop_id and f.statement_id = stmt.statement_id
	where stmt.sup_group_id = @sup_group_id

	declare billData cursor fast_forward for
				select distinct
					s.sup_tax_yr,
					s.sup_num,
					wpov.prop_id,
					o.owner_id,
					p.prop_type_cd,
					isNull(lb.tax_district_id, tafa.tax_district_id),
					isNull(lb.levy_cd, tafa.levy_cd),
					wpov.taxable_classified,
					wpov.taxable_non_classified,
					isnull(wpov.state_assessed, 0),
					isnull(b.bill_id, 0) as bill_id,
					isNull(b.current_amount_due, 0),
					isNull(b.initial_amount_due, 0),
					isnull(le_snr.exmpt_type_cd, '') as levy_exempts_snr,
					isnull(le_frm.exmpt_type_cd, '') as levy_exempts_farm,
					isnull(l.levy_rate, 0),
					isnull(l.senior_levy_rate, 0),
					case when pe_snr.exmpt_type_cd is not null then 1 else 0 end as prop_exempts_snr,
					isNull(pv.sup_cd, ''),
					isNull(pv.sup_desc, ''),
					isNull(supp.supp_attribute, 0) as supp_attribute,
					isNull(pv.late_filing_penalty_pct, 0),
					isNull(pv.fraud_penalty_pct, 0)		,
					isNull(late.fee_id, 0),
					isNull(lateFee.current_amount_due, 0),
					isNull(fraud.fee_id, 0),
					isNull(fraudFee.current_amount_due, 0),
					isnull(wpov.appraised,0),
					isnull(wpov.prorate_type, ''),
					dbo.fn_GetProratePct(wpov.prorate_begin, wpov.prorate_end, wpov.year+1),
					wpov.destroyed_prop,
					isnull(wpov.destroyed_prorate_pct, 0),
					wpov.destroyed_jan1_classified_value,
					wpov.destroyed_jan1_non_classified_value,
					b.effective_due_date,
					b.amount_paid,
					isNull(b.payment_status_type_cd, 'NONE'),
					isNull(b.statement_id, -1),
					isNull(split.split_merge_id, -1),
					split.[type],
					prorated_tax_amt, 
					case when tif_originating.tif_area_id is null then 0 else 1 end is_tif_originating_levy, --@is_tif_originating_levy
					case when tif_sponsoring.tif_area_id is null then 0 else 1 end is_tif_sponsoring_levy, --is_tif_sponsoring_levy
					ta.tif_area_id, -- @tif_area_id
					isnull(tif_originating.base_non_classified, tif_sponsoring.base_non_classified) tif_base_non_clasified, -- @tif_base_non_classified
					isnull(tif_originating.base_classified, tif_sponsoring.base_classified) tif_base_classified, -- @tif_base_classified
					isnull(tif_sponsoring.tif_originating_levy_rate, 0),
					isnull(tif_sponsoring.tif_originating_senior_levy_rate, 0),
					isnull(wpov.new_val_nhs, 0) + isnull(wpov.new_val_p, 0), -- @new_val_non_classified
					isnull(wpov.new_val_hs, 0), -- @new_val_classified
					isnull(wpov.state_assessed, 0), -- @state
					isnull(wpov_prev.state_assessed, 0), -- @state_prev
					isnull(tif_cert_values_orig.remainder_nc, tif_cert_values_spon.remainder_nc), -- @tif_remainder_non_classified
					isnull(tif_cert_values_orig.increment_nc, tif_cert_values_spon.increment_nc), -- @tif_increment_non_classified
					isnull(tif_cert_values_orig.remainder_c, tif_cert_values_spon.remainder_c), -- @tif_remainder_classified
					isnull(tif_cert_values_orig.increment_c, tif_cert_values_spon.increment_c) -- @tif_increment_clasified

					from sup_group as sg with (nolock)
					inner join supplement as s with (nolock)
					on s.sup_group_id = sg.sup_group_id

					inner join wash_prop_owner_val as wpov with (nolock)
						ON wpov.[year] = s.sup_tax_yr
						AND wpov.sup_num = s.sup_num

					inner join #tmpPropIDs tmp
						on tmp.year = wpov.year
						and tmp.sup_num = wpov.sup_num
						and tmp.prop_id = wpov.prop_id

					inner join owner as o with (nolock)
						on o.owner_tax_yr = s.sup_tax_yr
						and o.sup_num = s.sup_num
						and o.prop_id = wpov.prop_id
						and o.owner_id = wpov.owner_id

					inner join property as p with (nolock)
						on p.prop_id = wpov.prop_id
						
					inner join property_val as pv with(nolock)
						on pv.prop_id = wpov.prop_id
						and pv.prop_val_yr = wpov.[year]
						and pv.sup_num = wpov.sup_num
						
					inner join supplement_type as supp with (nolock)
						on pv.sup_cd = supp.sup_type_cd

					full join fund as f with (nolock)
						on f.[year] = pv.prop_val_yr

					full outer join 
						(
							levy_bill as lb with (nolock)
							join bill as b with (nolock)
							on b.bill_id = lb.bill_id
							and b.[year] = lb.[year]
							join #tmpPropIDs props with (nolock)
							on props.year = b.year
							and props.prop_id = b.prop_id
						)
							on b.prop_id = pv.prop_id
							and lb.[year] = pv.prop_val_yr
							and lb.tax_district_id = f.tax_district_id
							and lb.levy_cd = f.levy_cd
							and b.bill_type not in ('MCSA', 'MCSL', 'R', 'RR')
							and b.is_active = 1

					full outer join tax_area_fund_assoc as tafa with (nolock)
						on tafa.tax_area_id = 
							[dbo].[fn_GetCurrentTaxAreaID](wpov.prop_id, wpov.[year], getdate(), wpov.sup_num)
						and tafa.[year] = wpov.[year]
						and tafa.tax_district_id = f.tax_district_id
						and tafa.levy_cd = f.levy_cd

					left outer join levy as l with (nolock) on
						l.[year]				= isNull(tafa.[year], lb.[year])
						and l.tax_district_id	= isNull(tafa.tax_district_id, 
													case when (isNull(tafa.tax_area_id, 0) > 0 or b.bill_type = 'MCL')
														then lb.tax_district_id else 0 end)
						and l.levy_cd			= isNull(tafa.levy_cd, 
													case when (isNull(tafa.tax_area_id, 0) > 0 or b.bill_type = 'MCL')
														then lb.levy_cd else '' end)

					left join prop_accepted_supp_assoc_vw psa_prev with(nolock)
						on psa_prev.prop_id = pv.prop_id
						and psa_prev.owner_tax_yr = pv.prop_val_yr - 1
					left join wash_prop_owner_val wpov_prev with(nolock)
						on wpov_prev.prop_id = psa_prev.prop_id
						and wpov_prev.year = psa_prev.owner_tax_yr
						and wpov_prev.sup_num = psa_prev.sup_num
						and wpov_prev.owner_id = o.owner_id

					outer apply (
						select top 1 levy_cert_run_id
						from levy_cert_run with(nolock)
						where levy_cert_run.year = l.year
						and levy_cert_run.accepted_date is not null
						order by levy_cert_run_id desc
					) lcr

					outer apply (
						select top 1 lct.year, lct.tax_district_id, lct.levy_cd, ta.base_year, ta.tif_area_id, 
							tapv.base_value - tapv.senior_base_value as base_non_classified, tapv.senior_base_value as base_classified
						from levy_cert_tif lct
						join tif_area ta with(nolock)
							on ta.tif_area_id = lct.tif_area_id
						join tif_area_prop_values tapv with(nolock) 
							on tapv.tif_area_id = ta.tif_area_id
							and tapv.prop_id = pv.prop_id
						where lct.levy_cert_run_id = lcr.levy_cert_run_id
						and lct.year = l.year
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
							lct.levy_cert_run_id = lcr.levy_cert_run_id
							and tal.year = l.year
							and tal.linked_tax_district_id = l.tax_district_id
							and tal.linked_levy_cd = l.levy_cd
					) tif_sponsoring

					outer apply (
						select isnull(tif_originating.tif_area_id, tif_sponsoring.tif_area_id) tif_area_id
					) ta

					outer apply (
						select top 1 tabv.*
						from tif_area_bill_values tabv with(nolock)
						where tabv.tif_area_id = ta.tif_area_id
						and tabv.prop_id = pv.prop_id
						and tabv.year = pv.prop_val_yr
						and tabv.tax_district_id = tif_originating.tax_district_id
						and tabv.levy_cd = tif_originating.levy_cd
						order by tabv.sup_num asc
					) tif_cert_values_orig

					outer apply (
						select top 1 tabv.*
						from tif_area_bill_values tabv with(nolock)
						where tabv.tif_area_id = ta.tif_area_id
						and tabv.prop_id = pv.prop_id
						and tabv.year = pv.prop_val_yr
						and tabv.tax_district_id = tif_sponsoring.tif_originating_tax_district_id
						and tabv.levy_cd = tif_sponsoring.tif_originating_levy_cd
						order by tabv.sup_num asc
					) tif_cert_values_spon

					left outer join levy_exemption as le_snr with (nolock) on
						le_snr.[year]			= l.[year]
						and le_snr.tax_district_id	= l.tax_district_id
						and le_snr.levy_cd			= l.levy_cd
						and le_snr.exmpt_type_cd	= 'SNR/DSBL'

					left join levy_exemption as le_frm with (nolock) on
					le_frm.[year] = l.[year]
						and le_frm.tax_district_id	= l.tax_district_id
						and le_frm.levy_cd			= l.levy_cd
						and le_frm.exmpt_type_cd	= 'FARM'

					left join property_exemption as pe_snr with(nolock)
						on pe_snr.exmpt_tax_yr		= s.sup_tax_yr
						and pe_snr.owner_tax_yr		= s.sup_tax_yr
						and pe_snr.prop_id			= wpov.prop_id
						and pe_snr.sup_num			= wpov.sup_num
						and pe_snr.owner_id			= wpov.owner_id
						and pe_snr.exmpt_type_cd	= 'SNR/DSBL'

					left outer join 
					(
						bill_fee_assoc as late with (nolock)
						join fee as lateFee with (nolock)
						on lateFee.fee_id = late.fee_id
						and lateFee.fee_type_cd = @late_fee_type_cd 
					)
						on late.bill_id = b.bill_id	
						and lateFee.[year] = wpov.[year]

					left outer join 
					(
						bill_fee_assoc as fraud with (nolock)
						join fee as fraudFee with (nolock)
						on fraudFee.fee_id = fraud.fee_id
						and fraudFee.fee_type_cd = @fraud_fee_type_cd
					)
						on fraud.bill_id = b.bill_id	
						and fraudFee.[year] = wpov.[year]

					left join 
					(
						select	isNull(sm.split_merge_id, -1) split_merge_id, 
								isNull(smpa.prop_id, 0) prop_id, isNull(smya.[year], 0) [year],
								isNull(sm.[type], 'NONE') [type]
						from split_merge sm with (nolock)
						join split_merge_year_assoc smya with (nolock)
						on sm.split_merge_id = smya.split_merge_id
						join split_merge_prop_assoc smpa with (nolock)
						on sm.split_merge_id = smpa.split_merge_id
						where status = 'COMPLETE'
						and sup_group = @sup_group_id
					) split 
						on split.prop_id = pv.prop_id
						and split.[year] = pv.prop_val_yr							

					outer apply (
						select prorated_tax_amt = convert(numeric(14,2), sum(
							(
								(wpov_past.taxable_classified * wlr.levy_rate_classified / 1000.0) + 
								(wpov_past.taxable_non_classified * wlr.levy_rate_non_classified / 1000.0) 
							) * wpop.ex_value_pct
							+ (wpov_past.appraised * wlr.levy_rate_non_classified / 1000.0) * wpop.no_ex_value_pct
						))
		
						from wash_prop_owner_proration wpop with(nolock)

						join wash_prop_owner_val wpov_past with(nolock)
						on wpov_past.year = wpop.year
						and wpov_past.sup_num = wpop.past_sup_num
						and wpov_past.prop_id = wpop.prop_id
						and wpov_past.owner_id = wpop.past_owner_id

						join wash_prop_owner_levy_assoc wpola with(nolock)
						on wpola.year = wpov_past.year
						and wpola.sup_num = wpov_past.sup_num
						and wpola.prop_id = wpov_past.prop_id
						and wpola.pending = 0

						join wash_prop_levy_rate_vw wlr with(nolock)
						on wlr.year = wpola.year
						and wlr.prop_id = wpola.prop_id
						and wlr.sup_num = wpola.sup_num 
						and	wlr.tax_district_id = wpola.tax_district_id 
						and wlr.levy_cd = wpola.levy_cd

						where wpop.year = wpov.year
						and wpop.sup_num = wpov.sup_num
						and wpop.prop_id = wpov.prop_id
						and wpop.owner_id = wpov.owner_id
						
						and wpola.tax_district_id = lb.tax_district_id
						and wpola.levy_cd = lb.levy_cd

					) table_proration

					WHERE s.sup_group_id = @sup_group_id
					and isNull(lb.tax_district_id, isNull(tafa.tax_district_id, -1)) <> -1
					and isNull(lb.levy_cd, isNull(tafa.levy_cd, '')) <> ''
					-- do not include properties that had bills created individually				
					and isNull(pv.accept_create_id, 0) = 0

					-- Create LTIF sponsoring levy bills on LTIF properties only
					and not (
						tif_sponsoring.tif_area_id is null
						and exists (
							select 1 from tif_area_levy tal with(nolock)
							where tal.linked_tax_district_id = l.tax_district_id
							and tal.linked_levy_cd = l.levy_cd
							and tal.year = l.year
						)
					)

					order by s.sup_tax_yr, wpov.prop_id

	set nocount on
	open billData

	fetch next from billData into
		@tax_yr, @sup_num, @prop_id, @owner_id, @prop_type_cd,
		@tax_district_id, @levy_cd, @taxable_classified,
		@taxable_non_classified, @state_assessed, @bill_id, @bill_current_amount_due,
		@bill_initial_amount_due, 
		@levy_exempts_snr, @levy_exempts_farm, @levy_rate, @senior_levy_rate, @prop_exempts_snr,
		@sup_cd, @sup_desc, @supp_attribute,
		@late_filing_penalty_pct, @fraud_penalty_pct, @late_fee_id, @late_fee_current_amount_due,
		@fraud_fee_id, @fraud_fee_current_amount_due, @appraised, @prorate_type, @prorate_pct, 
		@destroyed_prop, @destroyed_prorate_pct, 
		@destroyed_jan1_classified_value, @destroyed_jan1_non_classified_value, 
		@current_eff_date, @amount_paid,
		@payment_status, @statement_id, @splitMergeID, @splitMergeType, @prorated_tax_amt, 
		@is_tif_originating_levy, @is_tif_sponsoring_levy, @tif_area_id, @tif_base_non_classified, @tif_base_classified, 
		@tif_originating_levy_rate, @tif_originating_senior_levy_rate,
		@new_val_non_classified, @new_val_classified, @state, @state_prev,
		@tif_remainder_non_classified, @tif_increment_non_classified, @tif_remainder_classified, @tif_increment_classified


	while @@fetch_status = 0
	begin	
		if ((@is_tif_originating_levy = 1) or (@is_tif_sponsoring_levy = 1))
		begin
			if ((@tif_increment_non_classified is not null) and (@tif_increment_classified is not null) and
				(@tif_remainder_non_classified is not null) and (@tif_remainder_classified is not null))
			begin
				-- start with the certification bill values and adjust for the changed value
				-- apply value change only to the increment, unless the increment would go below zero
				set @tif_value_change_nc = @taxable_non_classified - (@tif_remainder_non_classified + @tif_increment_non_classified) 
				set @tif_increment_non_classified = @tif_increment_non_classified + @tif_value_change_nc
				if (@tif_increment_non_classified < 0)
				begin
					set @tif_remainder_non_classified = @tif_remainder_non_classified + @tif_increment_non_classified
					set @tif_increment_non_classified = 0
				end

				set @tif_value_change_c = @taxable_classified - (@tif_remainder_classified + @tif_increment_classified) 
				set @tif_increment_classified = @tif_increment_classified + @tif_value_change_c
				if (@tif_increment_classified < 0)
				begin
					set @tif_remainder_classified = @tif_remainder_classified + @tif_increment_classified
					set @tif_increment_classified = 0
				end
			end

			else begin
				-- no previous saved values, calculate this the same as a cert levy bill
				-- LTIF originating or sponsoring levy - calculate LTIF increments
				set @tif_increment_non_classified = @taxable_non_classified - @tif_base_non_classified - @new_val_non_classified -
					case when @state > @state_prev then @state - @state_prev else 0 end
				set @tif_increment_classified = @taxable_classified - @tif_base_classified - @new_val_classified

				-- keep increments in bounds
				set @tif_increment_non_classified = case 
					when @tif_increment_non_classified < 0 then 0
					when @tif_increment_non_classified > @taxable_non_classified then @taxable_non_classified
					else @tif_increment_non_classified end
				set @tif_increment_classified = case
					when @tif_increment_classified < 0 then 0
					when @tif_increment_classified > @taxable_classified then @taxable_classified
					else @tif_increment_classified end

				set @tif_remainder_non_classified = @taxable_non_classified - @tif_increment_non_classified
				set @tif_remainder_classified = @taxable_classified - @tif_increment_classified
			end	

			-- create or update the [tif_area_bill_values] record
			if (@is_tif_originating_levy = 1)
			begin
				if not exists(
					select 1 from tif_area_bill_values tabv with(nolock)
					where tabv.tif_area_id = @tif_area_id
					and tabv.prop_id = @prop_id
					and tabv.year = @tax_yr
					and tabv.sup_num = @sup_num)
				begin
					insert tif_area_bill_values
					(tif_area_id, prop_id, year, sup_num, tax_district_id, levy_cd, remainder_nc, increment_nc, remainder_c, increment_c)
					values (@tif_area_id, @prop_id, @tax_yr, @sup_num, @tax_district_id, @levy_cd,
						@tif_remainder_non_classified, @tif_increment_non_classified,
						@tif_remainder_classified, @tif_increment_classified)
				end
				else begin
					update tif_area_bill_values set
						remainder_nc = @tif_remainder_non_classified,
						increment_nc = @tif_increment_non_classified,
						remainder_c = @tif_remainder_classified,
						increment_c = @tif_increment_classified
					where tif_area_id = @tif_area_id
					and prop_id = @prop_id
					and year = @tax_yr
					and sup_num = @sup_num
					and tax_district_id = @tax_district_id
					and levy_cd = @levy_cd
				end
			end

			-- override the taxable values and tax rates
			if (@is_tif_originating_levy = 1)
			begin
				-- originating: amount left after increment removed
				set @taxable_classified = @taxable_classified - @tif_increment_classified
				set @taxable_non_classified = @taxable_non_classified - @tif_increment_non_classified
			end
			else if (@is_tif_sponsoring_levy = 1)
			begin
				-- sponsoring: increments
				set @taxable_classified = @tif_increment_classified
				set @taxable_non_classified = @tif_increment_non_classified

				-- replace the sponsoring levy's tax rates with the rates of the originating levy
				set @levy_rate = @tif_originating_levy_rate
				set @senior_levy_rate = @tif_originating_senior_levy_rate
			end
		end

		if @levy_rate <> 0 or @bill_id > 0
		begin
			-- determine total taxable value for this levy
			-- if it is a deleted property, then set the total taxable value to 0
			if exists(
				select prop_id from property_val 
				where prop_id = @prop_id
				and prop_val_yr = @tax_yr
				and sup_num = @sup_num
				and isNull(prop_inactive_dt, '') <> ''
				and isNull(udi_parent, '') = ''
			)
			begin
				set @total_taxable_value = 0
				set @levy_rate_classified = 0
			end
			
			else
			begin
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
			end

			set @levy_rate_non_classified = @levy_rate


			-- calculate a tax due amount
			if (@prorated_tax_amt is not null)
			begin
				-- advanced prorated exemption
				set @base_tax_due = @prorated_tax_amt
			end
			else if @destroyed_prop = 1
			begin
				--destroyed property proration
				set @base_tax_due =	(
						(@taxable_classified * @levy_rate_classified / 1000.0) +
						(@taxable_non_classified * @levy_rate_non_classified / 1000.0)
					) * @destroyed_prorate_pct +
					(
						(@destroyed_jan1_classified_value * @levy_rate_classified / 1000.0) +
						(@destroyed_jan1_non_classified_value * @levy_rate_non_classified / 1000.0)
					) * (1.0000 - @destroyed_prorate_pct)
			end
			else if len(@prorate_type) > 0
			begin
				-- simple prorated exemption
				set @base_tax_due = ((@taxable_classified * @levy_rate_classified / 1000.0) +
									(@taxable_non_classified * @levy_rate_non_classified / 1000.0)) * @prorate_pct + 
									(@appraised * @levy_rate_non_classified / 1000.0) * (1.0000 - @prorate_pct)
			end
			else
			begin
				-- no proration
				set @base_tax_due = (@taxable_classified * @levy_rate_classified / 1000.0) +
					(@taxable_non_classified * @levy_rate_non_classified / 1000.0)
			end
			
			-------------------******************************************************************************************
			-------------------***********************************************Effective Due Date
			--For Current Year Omitted Property, Historic Exemption Removal
			if @supp_attribute in (5, 7)
			begin 
				set @effective_due_date = dbo.fn_FormatDate(@omitted_effective_due_date, 0)
			end	

			--Split\Merge
			else if @supp_attribute in (8) and @splitMergeID > 0
			begin
				--for a split, determine the parent 
				if(@splitMergeType = 'Split')
				begin 
					select @effective_due_date = max(s.effective_due_date)
					from supplement_idlist s with (nolock)
					where s.year = @tax_yr
					and s.prop_id = (	select min(prop_id) prop_id
										from split_merge_prop_assoc with (nolock)
										where split_merge_id = @splitMergeID )
							
				end
				else if (@splitMergeType = 'Merge')
				begin
					select @effective_due_date = max(s.effective_due_date)
					from supplement_idlist s with (nolock)
					where s.year = @tax_yr
					and s.prop_id in (	select prop_id
										from split_merge_prop_assoc with (nolock)
										where split_merge_id = @splitMergeID 
										and isNull(merge_to, 0) <> 1)
				end
			end
			
			--For other cases
			else 
			begin
				--determine the adjustment amount
				set @bill_adjustment_amount = @base_tax_due - @bill_current_amount_due
							
				--If the current tax due is greater then the adjusted tax due, then the eff date does not change
				--If the amount due is not positive, then the eff date does not change
				--If the calculated date is less than the current due date
				if (@postpone_duedate = 1) -- If TRUE then we always postpone the due date even when amount due decreases
				begin


					if(	@base_tax_due - @amount_paid <= 0)
					begin 
							--add 30 days to the current day and go to the last day of that month
							set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
					end 	
												
					else if(@bill_current_amount_due = @base_tax_due or
						dbo.[fn_GetEffectiveDueDate30](getdate()) < @current_eff_date)
					begin 
						set @effective_due_date = @current_eff_date
					end 

					else --calculate the effective due date
					begin
						--If the bill's tax year is less than the current year, then it is due in 30 days 
						if @tax_yr < @current_tax_yr
						begin 
							--add 30 days to the current day and go to the last day of that month
							set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
						end
						
						--for Manifest Error, Board of Equalization, Destroyed, Senior Citizen/DOR Exempt, Current Use Removal
						else --if @supp_attribute in (0, 1, 2, 3, 4, 6) 
						begin 
							--add 30 days to the current day and go to the last day of that month
							set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
							
							--If 4/30 is greater than the calculated date, then use 4/30
							if datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), @effective_due_date) <= 0
							begin
								set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), 0)
							end
							
							----Else If 4/30 is less than the calculated date, then if 10/31 is greater than the calculated date, then use 10/31
							else if @ignoreOct31 = 0 and datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), @effective_due_date) <= 0
							begin
								set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
							end
						end
					end
				end
				else
				begin
				
					if(	@base_tax_due - @amount_paid <= 0 or 
						@bill_current_amount_due >= @base_tax_due or
						dbo.[fn_GetEffectiveDueDate30](getdate()) < @current_eff_date)
					begin 
						set @effective_due_date = @current_eff_date
					end 

					else --calculate the effective due date
					begin
					
						--If the bill's tax year is less than the current year, then it is due in 30 days 
						if @tax_yr < @current_tax_yr
						begin 
									
							--add 30 days to the current day and go to the last day of that month
							set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
						end
						
						--for Manifest Error, Board of Equalization, Destroyed, Senior Citizen/DOR Exempt, Current Use Removal
						else --if @supp_attribute in (0, 1, 2, 3, 4, 6) 
						begin 
						
							--add 30 days to the current day and go to the last day of that month
							set @effective_due_date = dbo.[fn_GetEffectiveDueDate30](getdate())
							
							--If 4/30 is greater than the calculated date, then use 4/30
							if datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), @effective_due_date) <= 0
							begin
							
								set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), 0)
							end
							
							----Else If 4/30 is less than the calculated date, then if 10/31 is greater than the calculated date, then use 10/31
							else if @ignoreOct31 = 0 and datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), @effective_due_date) <= 0
							begin
							
								if (@bill_adjustment_amount <= 0) set @effective_due_date = @effective_due_date
								else set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), 0)
									
							end
						end
					end
				end
			end


			if (@current_eff_date is not null and @effective_due_date < @current_eff_date and @supp_attribute not in (8) and @splitMergeID <= 0)
			begin
				set @effective_due_date = @current_eff_date
			end		


			--determine the statement due date
			set @statement_eff_date = null
		
			if (isNull(@statement_id, 0) > 0 and @supp_attribute not in (8) and @splitMergeID <= 0) 
			begin
			
				select @statement_eff_date = effective_due_date 
				from supplement_idlist
				where year = @tax_yr
				and prop_id = @prop_id
				and statement_id = @statement_id
				and sup_group_id = @sup_group_id

	



				if (@statement_eff_date is not null and @statement_eff_date > @effective_due_date)
				begin
					set @effective_due_date = @statement_eff_date
				end 
				else if (@statement_eff_date is not null and @statement_eff_date < @effective_due_date)
				begin
				
					update supplement_idlist
					set effective_due_date = @effective_due_date,					
					updated = 1
					where year = @tax_yr
					and prop_id = @prop_id
					and statement_id = @statement_id
					and sup_group_id = @sup_group_id

					set @statement_eff_date = @effective_due_date
					
				end
				else if not exists (select *
									from supplement_idlist
									where year = @tax_yr
									and prop_id = @prop_id
									and statement_id = @statement_id
									and sup_group_id = @sup_group_id)
				begin
				
					insert into supplement_idlist (sup_group_id, year, prop_id, statement_id, effective_due_date, h1_paid, updated)
					values (@sup_group_id, @tax_yr, @prop_id, @statement_id, @effective_due_date, 0, 0)
				end
			end
	
			-------------------***********************************************Effective Due Date
			-------------------******************************************************************************************

			if @bill_id = 0
			begin		
				--Determine if other levy bills exist for the year
				--if not, then get the next statement id for that year
				--if yes, then check if there is 1 distinct statement id and use that
				if(@currentPropID <> @prop_id or @currentStatementYear <> @tax_yr or @currentStatementID <= 0)
				begin
					set @currentStatementID = 0
					set @stmt_h1_paid = 0
				
					if not exists (	select * 
									from bill with (nolock)
									join levy_bill lb with (nolock) on
										bill.bill_id = lb.bill_id
									where bill.year = @tax_yr
										and bill.prop_id = @prop_id
										and isNull(bill.statement_id, 0) <> 0)
						and @tax_yr < @current_tax_yr
					begin
						exec GetNextStatementID @tax_yr, @currentStatementID output, 0, 1
					end

					else if isNull((select count(distinct statement_id) 
									from bill with (nolock)
									join levy_bill lb with (nolock) on
										bill.bill_id = lb.bill_id
									where bill.year = @tax_yr
										and bill_type not in ('R')
										and bill.prop_id = @prop_id
										and isNull(bill.statement_id, 0) <> 0), 0) = 1
					begin
						select @currentStatementID = statement_id
						from bill with (nolock)
						join levy_bill lb with (nolock) on
							bill.bill_id = lb.bill_id
						where bill.year = @tax_yr
							and bill.prop_id = @prop_id
							and isNull(bill.statement_id, 0) <> 0
							and bill.bill_type not in ('R')
					end

					set @currentPropID = @prop_id
					set @currentStatementYear = @tax_yr
					set @statement_id = @currentStatementID

					--determine the statement due date
					set @statement_eff_date = null
				
					if (isNull(@currentStatementID, 0) > 0 and @supp_attribute not in (8) and @splitMergeID <= 0) 
					begin
						select @statement_eff_date = effective_due_date, 
							   @stmt_h1_paid = isNull(h1_paid, 0)
						from supplement_idlist
						where year = @tax_yr
						and prop_id = @prop_id
						and statement_id = @currentStatementID
						and sup_group_id = @sup_group_id
					end
					
					
							

					if (@statement_eff_date is not null and @statement_eff_date >= @effective_due_date)
					begin
						set @effective_due_date = @statement_eff_date
					end 
					else if (@statement_eff_date is not null and @statement_eff_date < @effective_due_date)
					begin
						update supplement_idlist
						set effective_due_date = @effective_due_date,
							updated = 1
						where year = @tax_yr
						and prop_id = @prop_id
						and statement_id = @currentStatementID
						and sup_group_id = @sup_group_id

						set @statement_eff_date = @effective_due_date
					end
					else if not exists (select *
										from supplement_idlist
										where year = @tax_yr
										and prop_id = @prop_id
										and statement_id = @currentStatementID
										and sup_group_id = @sup_group_id)
					begin
					
						insert into supplement_idlist
						values (@sup_group_id, @tax_yr, @prop_id, @currentStatementID, @effective_due_date, 0, 0)
					end
				end
				else if (@statement_id = -1)
				begin
				
					set @statement_id = @currentStatementID
				end

				select
					@tax_area_id = tax_area_id 
				from 
					dbo.fn_TaxAreaId_ReturnTable(@balance_dt, @tax_yr, @prop_id)

				-- create a new trans_group_id
				exec GetUniqueID 'trans_group', @bill_id output, 1, 0

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
					last_modified,
					created_by_type_cd,
					statement_id
				)
				values
				(
					@bill_id,
					@prop_id,
					@tax_yr,
					@sup_num,
					@owner_id,
					0,
					@base_tax_due,
					0,
					@effective_due_date,
					'L',
					case when @accept_prop_id > 0 then 1 else 0 end,
					getdate(),
					'SUP',
					@statement_id
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

				-- get a new transaction_id
				exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0

				if(@accept_prop_id > 0)
				begin
					-- create a coll_transaction record
					insert into coll_transaction
					(
						transaction_id,
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
						transaction_date,
						batch_id
					)
					values
					(
						@transaction_id,
						@bill_id,
						0,
						0,						-- base_amount_pd
						0,						-- penalty_amount_pd
						0,						-- interest_amount_pd
						0,						-- bond_interest_pd
						'CLB', 					-- transaction_type
						0,						-- underage_amount_pd
						0,						-- overage_amount_pd
						0,						-- other_amount_pd
						@pacs_user_id,
						getdate(),
						@batch_id
					)
				end
				
				else 
				begin
					-- create a pending_coll_transaction record
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
						transaction_date,
						batch_id
					)
					values
					(
						@transaction_id,
						@bill_id,
						0,
						0,						-- base_amount_pd
						0,						-- penalty_amount_pd
						0,						-- interest_amount_pd
						0,						-- bond_interest_pd
						'CLB', 					-- transaction_type
						0,						-- underage_amount_pd
						0,						-- overage_amount_pd
						0,						-- other_amount_pd
						@pacs_user_id,
						getdate(),
						@batch_id
					)
				end
	
				--create an adjustment record
				exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0
				if @accept_prop_id > 0
				begin
					insert into coll_transaction
					(
						transaction_id,
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
						transaction_date,
						batch_id
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
						'ADJLB', 					-- transaction_type
						0,						-- underage_amount_pd
						0,						-- overage_amount_pd
						0,						-- other_amount_pd
						@pacs_user_id,
						getdate(),
						@batch_id
					)
				end						

				else 
				begin
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
						transaction_date,
						batch_id
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
						'ADJLB', 					-- transaction_type
						0,						-- underage_amount_pd
						0,						-- overage_amount_pd
						0,						-- other_amount_pd
						@pacs_user_id,
						getdate(),
						@batch_id
					)
				end			
	
				exec GetUniqueID 'bill_adjustment', @bill_adj_id output, 1, 0
				insert into bill_adjustment
				(
					bill_adj_id,
					bill_id,
					transaction_id,
					batch_id,
					sup_num,
					effective_due_dt,
					previous_taxable_val,
					taxable_val,
					bill_calc_type_cd,
					previous_base_tax,
					base_tax,
					modify_cd,
					modify_reason,
					tax_area_id
				)
				values
				(
					@bill_adj_id,
					@bill_id, 
					@transaction_id,
					@batch_id,
					@sup_num,
					@effective_due_date,
					0,
					@total_taxable_value,
					'SM',
					0,
					@base_tax_due,
					@sup_cd,
					@sup_desc,
					@tax_area_id
				)	
				
				insert into #tmpAdj (bill_adjustment_id, bill_id)
				values (@bill_adj_id, @bill_id)

				if @stmt_h1_paid = 1
				begin
					--This is required to view the bill
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
						0,
						0,
						@effective_due_date
					)

					--This is required to view the bill
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
						1,
						@base_tax_due,
						0,
						@effective_due_date
					)
				end
				else
				begin
					--This is required to view the bill
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
				end
			end

			else if @bill_id > 0 --bill exists, an adjustment record is created, even if there is no change
			begin
				--if the bill is part of a payout agreement, then set the status to locked
				UPDATE payout_agreement
				SET status_cd = 'L'
				FROM payout_agreement pa with(nolock)
				INNER JOIN payout_agreement_bill_assoc paba with(nolock)
					ON paba.payout_agreement_id = pa.payout_agreement_id
				WHERE paba.bill_id = @bill_id										

				--determine the adjustment amount
				set @bill_adjustment_amount = @base_tax_due - @bill_current_amount_due
				
				--get a new transaction_id
				exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0
	
				if @accept_prop_id > 0
				begin
					-- create a coll_transaction record
					insert into coll_transaction
					(
						transaction_id,
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
						transaction_date,
						batch_id
					)
					values
					(
						@transaction_id,
						@bill_id,
						@bill_adjustment_amount,
						0,						-- base_amount_pd
						0,						-- penalty_amount_pd
						0,						-- interest_amount_pd
						0,						-- bond_interest_pd
						'ADJLB', 				-- transaction_type
						0,						-- underage_amount_pd
						0,						-- overage_amount_pd
						0,						-- other_amount_pd
						@pacs_user_id,
						getdate(),
						@batch_id
					)
				end

				else 
				begin
					-- create a pending_coll_transaction record
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
						transaction_date,
						batch_id
					)
					values
					(
						@transaction_id,
						@bill_id,
						@bill_adjustment_amount,
						0,						-- base_amount_pd
						0,						-- penalty_amount_pd
						0,						-- interest_amount_pd
						0,						-- bond_interest_pd
						'ADJLB', 				-- transaction_type
						0,						-- underage_amount_pd
						0,						-- overage_amount_pd
						0,						-- other_amount_pd
						@pacs_user_id,
						getdate(),
						@batch_id
					)
				end
				
				--get a new bill_adj_id
				exec GetUniqueID 'bill_adjustment', @bill_adj_id output, 1, 0
				
				insert into bill_adjustment
				(
					bill_adj_id,
					bill_id,
					transaction_id,
					batch_id,
					sup_num,
					previous_bill_fee_cd,
					bill_fee_cd,
					previous_effective_due_dt,
					effective_due_dt,
					previous_taxable_val,
					taxable_val,
					bill_calc_type_cd,
					previous_base_tax,
					base_tax,
					modify_cd,
					modify_reason,
					tax_area_id,
					previous_payment_status_type_cd
				)
				select	@bill_adj_id, @bill_id, @transaction_id, @batch_id,
						@sup_num, b.code, b.code, b.effective_due_date, @effective_due_date, 
						lb.taxable_val, @total_taxable_value, 'SM', b.current_amount_due, @base_tax_due,
						@sup_cd, @sup_desc, dbo.fn_BillLastTaxAreaId(b.bill_id,null) as tax_area_id, b.payment_status_type_cd
				from bill as b with (nolock)
				join levy_bill as lb with (nolock)
				on lb.bill_id = b.bill_id
				where b.bill_id = @bill_id					

				insert into #tmpAdj (bill_adjustment_id, bill_id)
				values (@bill_adj_id, @bill_id)

				update bill set
					current_amount_due = current_amount_due + @bill_adjustment_amount,
					sup_num = @sup_num,
					effective_due_date = @effective_due_date,
					last_modified = getdate()
				where 
					bill_id = @bill_id

				update levy_bill 
					set taxable_val = @total_taxable_value
					where bill_id = @bill_id

				set @is_half_pay = 0
				set @stmt_h1_paid = 0
	
				select @stmt_h1_paid = isNull(h1_paid, 0)
				from supplement_idlist with (nolock)
				where year = @tax_yr
				and prop_id = @prop_id
				and statement_id = @statement_id
				and sup_group_id = @sup_group_id
	
				if @payment_status <> 'PAYOUT' 
					and 
					(	select count(distinct bill_payment_id) 
						from bill_payments_due with (nolock)
						where bill_id = @bill_id
						and is_payout_payment = 0 ) = 2
					and @current_tax_yr - @tax_yr <= 1
				begin
					set @is_half_pay = 1
				end						



				--the refactor process will handle updating the payments due records if nothing has been paid
				if @is_half_pay = 1 and @bill_adjustment_amount > 0
				begin
					if (@ignoreOct31 = 0)			
					begin	
						-- did not pay bills, entire balance will be due on h2
						if (@stmt_h1_paid = 0)
						begin
							update h1			
							set h1.amount_due = 0,
								h1.amount_paid = 0							
							from bill_payments_due h2 with (nolock)
							join bill_payments_due h1 with (nolock)
							on h2.bill_id = h1.bill_id 
							and h1.bill_payment_id = 0
							where h2.bill_id = @bill_id
							and h2.bill_payment_id = 1					
						end							
					end
					
					if (@ignoreOct31 = 1)	
					begin
						update h1			
						set h1.amount_due = (@base_tax_due / 2), h1.due_date = @effective_due_date
						from bill_payments_due h2 with (nolock)
						join bill_payments_due h1 with (nolock)
						on h2.bill_id = h1.bill_id 
						and h1.bill_payment_id = 0
						where h2.bill_id = @bill_id
						and h2.bill_payment_id = 1											
					end	
					
					-- adjust h2 payment and duedate to current needs
					update h2			
					set h2.amount_due = @base_tax_due - h1.amount_due, h2.due_date = @effective_due_date
					from bill_payments_due h2 with (nolock)
					join bill_payments_due h1 with (nolock)
					on h2.bill_id = h1.bill_id 
					and h1.bill_payment_id = 0
					where h2.bill_id = @bill_id
					and h2.bill_payment_id = 1			
				end
				
				else --- not half payment
				begin
					delete from bill_payments_due
					where bill_id = @bill_id

					--This is required to view the bill
					insert into bill_payments_due 
					(
						bill_id,
						bill_payment_id,
						amount_due,
						amount_paid,
						due_date		
					)
					select 
						@bill_id, 
						0, 
						@base_tax_due, 
						amount_paid, 
						@effective_due_date
					from bill 
						where bill_id = @bill_id
				end
			end
			
			--BPP fees
			if (@prop_type_cd = 'P' and @bill_id > 0)
			begin 
				-- Calculate BPP penalties for Personal property
				set @late_penalty_amount = @base_tax_due * (@late_filing_penalty_pct / 100)
				set @fraud_penalty_amount = @base_tax_due * (@fraud_penalty_pct / 100)
				
				if exists(select prop_id from property_val 
					where prop_id = @prop_id
					and prop_val_yr = @tax_yr
					and sup_num = @sup_num
					and isNull(prop_inactive_dt, '') <> ''
					and isNull(udi_parent, '') = '')
				begin
					set @late_penalty_amount = 0
					set @fraud_penalty_amount = 0
				end

				--if the same fee is selected for both types
				--then add the amounts together and set one type to 0 so that only 1 adjustment is made
				if(@late_fee_id = @fraud_fee_id)
				begin
					set @late_penalty_amount = @late_penalty_amount + @fraud_penalty_amount
					set @fraud_penalty_amount = 0
					set @fraud_fee_id = 0
				end

				if (@late_fee_id > 0 or @late_penalty_amount > 0) --and @include_bpp_fees = 1))
				begin
					exec CreatePropOrBillFee		@late_fee_id, @pacs_user_id, @tax_yr,
													@batch_id, 0, @bill_id, @sup_num, @owner_id, 
													@late_penalty_amount, @late_fee_type_cd, @effective_due_date, 
													@statement_id, 'SM', @late_fee_current_amount_due, 'Late Filing Rendition Penalty', 
													@sup_cd, @sup_desc, NULL, NULL, NULL, @accept_prop_id, 1, @stmt_h1_paid
				end

				if (@fraud_fee_id > 0 or @fraud_penalty_amount > 0) --and @include_bpp_fees = 1))
				begin
					exec CreatePropOrBillFee		@fraud_fee_id, @pacs_user_id, @tax_yr,
													@batch_id, 0, @bill_id, @sup_num, @owner_id, 
													@fraud_penalty_amount, @fraud_fee_type_cd, @effective_due_date,
													@statement_id, 'SM', @fraud_fee_current_amount_due, 'Fraud Rendition Penalty',
													@sup_cd, @sup_desc, NULL, NULL, NULL, @accept_prop_id, 1, @stmt_h1_paid
				end
			end
						
		end

		fetch next from billData into
		@tax_yr, @sup_num, @prop_id, @owner_id, @prop_type_cd,
		@tax_district_id, @levy_cd, @taxable_classified,
		@taxable_non_classified, @state_assessed, @bill_id, @bill_current_amount_due,
		@bill_initial_amount_due, @levy_exempts_snr, @levy_exempts_farm, 
		@levy_rate, @senior_levy_rate, @prop_exempts_snr, @sup_cd, @sup_desc, @supp_attribute,
		@late_filing_penalty_pct, @fraud_penalty_pct, @late_fee_id, @late_fee_current_amount_due,
		@fraud_fee_id, @fraud_fee_current_amount_due, @appraised, @prorate_type, @prorate_pct, 
		@destroyed_prop, @destroyed_prorate_pct, 
		@destroyed_jan1_classified_value, @destroyed_jan1_non_classified_value,
		@current_eff_date, @amount_paid, 
		@payment_status, @statement_id, @splitMergeID, @splitMergeType, @prorated_tax_amt, 
		@is_tif_originating_levy, @is_tif_sponsoring_levy, @tif_area_id, @tif_base_non_classified, @tif_base_classified, 
		@tif_originating_levy_rate, @tif_originating_senior_levy_rate,
		@new_val_non_classified, @new_val_classified, @state, @state_prev,
		@tif_remainder_non_classified, @tif_increment_non_classified, @tif_remainder_classified, @tif_increment_classified
	
	end
	close billData
	deallocate billData

	if exists (select * from supplement_idlist where updated = 1 and sup_group_id = @sup_group_id)
	begin
		--update bill and statement items where the effective date was updated
		update b
		set effective_due_date = stmt.effective_due_date
		from bill b with (nolock)
		join supplement_idlist stmt with (nolock) on stmt.year = b.year
		and stmt.prop_id = b.prop_id
		and stmt.statement_id = b.statement_id
		where stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id

		update bpd
		set due_date = stmt.effective_due_date
		from bill_payments_due bpd with (nolock) 
		join bill b with (nolock) on b.bill_id = bpd.bill_id
		join supplement_idlist stmt with (nolock) on stmt.year = b.year
		and stmt.prop_id = b.prop_id
		and stmt.statement_id = b.statement_id
		where bpd.bill_payment_id = 0
		and stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id
		
		update ba
		set effective_due_dt = stmt.effective_due_date
		from bill_adjustment ba with (nolock)
		join bill b with (nolock) on b.bill_id = ba.bill_id
		join supplement_idlist stmt with (nolock) on stmt.year = b.year
		and stmt.prop_id = b.prop_id
		and stmt.statement_id = b.statement_id
		join #tmpAdj adj on adj.bill_id = ba.bill_id
		and adj.bill_adjustment_id = ba.bill_adj_id
		where stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id

		update f
		set effective_due_date = stmt.effective_due_date
		from fee f with (nolock)
		join fee_property_vw fpv with (nolock) on fpv.fee_id = f.fee_id
		join supplement_idlist stmt with (nolock) on stmt.year = f.year
		and stmt.prop_id = fpv.prop_id
		and stmt.statement_id = f.statement_id
		where stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id

		update fpd
		set due_date = stmt.effective_due_date
		from fee_payments_due fpd with (nolock) 
		join fee f with (nolock) on f.fee_id = fpd.fee_id
		join fee_property_vw fpv with (nolock) on fpv.fee_id = f.fee_id
		join supplement_idlist stmt with (nolock) on stmt.year = f.year
		and stmt.prop_id = fpv.prop_id
		and stmt.statement_id = f.statement_id
		where fpd.fee_payment_id = 0
		and stmt.updated = 1
		and stmt.sup_group_id = @sup_group_id

		update fa
		set effective_due_dt = stmt.effective_due_date
		from fee_adjustment fa with (nolock)
		join fee f with (nolock) on f.fee_id = fa.fee_id
		join fee_property_vw fpv with (nolock) on fpv.fee_id = f.fee_id
		join supplement_idlist stmt with (nolock) on stmt.year = f.year
		and stmt.prop_id = fpv.prop_id
		and stmt.statement_id = f.statement_id
		join trans_group tg with (nolock) on tg.trans_group_id = f.fee_id
		and fa.transaction_id = mrtransid_adj
		join supplement s with (nolock) on s.sup_tax_yr = f.year
		and s.sup_group_id = @sup_group_id
		where stmt.updated = 1
		and fa.bill_calc_type_cd = 'SM'
		and fa.sup_num = s.sup_num
		and stmt.sup_group_id = @sup_group_id
	end
	
	if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#tmpAdj'))
	begin
		drop table #tmpAdj
	end			
		
	if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#tmpPropIDs'))
	begin
		drop table #tmpPropIDs
	end

GO

