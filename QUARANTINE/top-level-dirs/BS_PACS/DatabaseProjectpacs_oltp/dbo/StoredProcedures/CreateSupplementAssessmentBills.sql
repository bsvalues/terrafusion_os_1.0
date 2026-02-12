

CREATE PROCEDURE [dbo].[CreateSupplementAssessmentBills]
	@effective_due_date datetime,
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
		@bill_id				int,
		@fee_id				int,
		@agency_id				int,
		@bill_current_amount_due	numeric(14, 2),
		@bill_initial_amount_due	numeric(14, 2),
		@base_tax_due			numeric(14, 2),
		@transaction_id			int,
		@bill_adjustment_amount	numeric(14,2),
		@bill_adj_id			int,
		@sup_cd					varchar(10),
		@sup_desc				varchar(500),
		@fee_type_cd			varchar(10),
		@supp_attribute			int,  
		@current_tax_yr			int,
		@offset					int,
		@additional_fee_amt		numeric(14, 2),
		@fee_current_amount_due	numeric(14,2),
		@fee_adj_id				int,
		@payment_count			int,
		@statement_id			int,
		@wtsLevyStatementID		int,
		@currentPropID			int,
		@currentStatementYear	int,
		@currentEffDate			datetime,
		@amount_paid			numeric(14,2),
		@is_half_pay			bit,
		@stmt_h1_paid			bit,
		@payment_status			varchar(10),
		@statement_eff_date		datetime,
		@ignoreOct30			bit,
		@splitMergeID			int,
		@splitMergeType			varchar(10),
		@postpone_duedate		bit
	
	--Determine the system's current tax year
	select @current_tax_yr = tax_yr
	from pacs_system	

	select @postpone_duedate = postpone_duedate
 	from pacs_system	


	select @ignoreOct30 = isNull(cast(szConfigValue as bit), 0)
	from pacs_config
	where szGroup = 'SupplementDueDate'	
	and szConfigName = 'Ignore Oct 31'
	
	set @currentPropID = -1		

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
		insert into #tmpPropIDs
		select prop_val_yr, pv.prop_id, pv.sup_num
		from property_val pv with (nolock)
		join supplement s with (nolock) 
			on s.sup_tax_yr = pv.prop_val_yr
			and s.sup_num = pv.sup_num
		where s.sup_group_id = @sup_group_id
		and not exists (
			select 1 from ag_rollback ar
			where ar.prop_id = pv.prop_id
			and ar.accept_sup_group_id = @sup_group_id
			and isnull(ar.accept_sup_group_id, 0) <> isnull(ar.void_sup_group_id, 0)
		)
	end

	if not exists (select * from supplement_idlist where sup_group_id = @sup_group_id)
	begin 
		insert into supplement_idlist
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
				join bill_payments_due bpd1 with (nolock) on bpd1.bill_id = bill.bill_id
				and bpd1.bill_payment_id = 1
				group by year, prop_id, statement_id) b on b.year = stmt.year
		and b.prop_id = stmt.prop_id and b.statement_id = stmt.statement_id

		left join (	select fee.year, prop_id, statement_id, sum(current_amount_due) totalDue,
				sum(fpd.amount_paid - fpd.amount_due) due 
				from fee with (nolock)
				join fee_property_vw fpv with (nolock) on fpv.fee_id = fee.fee_id
				join fee_payments_due fpd with (nolock) on fpd.fee_id = fee.fee_id
				and fpd.fee_payment_id = 0
				join fee_payments_due fpd1 with (nolock) on fpd1.fee_id = fee.fee_id
				and fpd1.fee_payment_id = 1
				group by fee.year, prop_id, statement_id) f on f.year = stmt.year
		and f.prop_id = stmt.prop_id and f.statement_id = stmt.statement_id
		where stmt.sup_group_id = @sup_group_id
	end
	else
	begin
		update supplement_idlist
		set updated = 0
		where sup_group_id = @sup_group_id
	end


	declare billData cursor fast_forward for
		select distinct s.sup_tax_yr,
		s.sup_num,
		wpov.prop_id,
		o.owner_id,
		p.prop_type_cd,
		isNull(ab.agency_id, sa.agency_id),
		isNull(psas.assessment_amt, 0), 
		isNull(psas.additional_fee_amt, 0) as additional_fee_amt,
		isNull(sa.fee_type_cd, isNull(f.fee_type_cd, '')) as fee_type_cd,
		isnull(b.bill_id, 0) as bill_id,
		isNull(b.current_amount_due, 0) as current_amount_due,
		isNull(b.initial_amount_due, 0) as initial_amount_due,
		isNull(pv.sup_cd, ''),
		isNull(pv.sup_desc, ''),
		isNull(bfa.fee_id, 0) as fee_id,
		isNull(f.current_amount_due, 0) as fee_current_amount_due,
		isNull(supp.supp_attribute, 0) as supp_attribute,
		b.effective_due_date,
		b.amount_paid,
		isNull(b.statement_id, 0),
		isNull(b.payment_status_type_cd, 'NONE'),
		isNull(split.split_merge_id, -1),
		split.[type]

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
			
		full join special_assessment as sa with (nolock)
			on sa.[year] = wpov.[year]
		
		full join 
		(
			assessment_bill as ab with (nolock)
			join bill as b with (nolock)
			on ab.bill_id = b.bill_id
		)
			on b.prop_id = wpov.prop_id
			and b.[year] = sa.[year]
			and ab.agency_id = sa.agency_id
			and b.is_active = 1

		full join property_special_assessment as psas with (nolock)
			on psas.[year] = sa.[year]
			and psas.sup_num = wpov.sup_num
			and psas.prop_id = wpov.prop_id
			and psas.agency_id = isNull(ab.agency_id, sa.agency_id)
							
		left outer join 
		(
			bill_fee_assoc as bfa with (nolock)
			join fee as f with (nolock)
			on f.fee_id = bfa.fee_id
		)
			on bfa.bill_id = b.bill_id	
			and f.[year] = wpov.[year]
			and f.is_active = 1

		left join (
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

		WHERE s.sup_group_id = @sup_group_id
		and isNull(ab.agency_id, isNull(psas.agency_id, -1)) <> -1
		-- do not include properties that had bills created individually				
		and isNull(pv.accept_create_id, 0) = 0
		and isNull(sa.recalculate_during_supplement, 0) = 1
		and isNull(sa.bill_create_date, '') <> ''
		order by s.sup_tax_yr, wpov.prop_id

	set nocount on
	open billData

	fetch next from billData into
		@tax_yr, @sup_num, @prop_id, @owner_id, @prop_type_cd,
		@agency_id, @base_tax_due, @additional_fee_amt, @fee_type_cd, @bill_id, @bill_current_amount_due,
		@bill_initial_amount_due, @sup_cd, @sup_desc, @fee_id, @fee_current_amount_due, @supp_attribute, @currentEffDate, 
		@amount_paid, @statement_id, @payment_status, @splitMergeID, @splitMergeType

	while @@fetch_status = 0
	begin
		if (@postpone_duedate = 1)
		begin
			-------------------******************************************************************************************
			-------------------***********************************************Effective Due Date
			--Split \ Merge
			if (@supp_attribute in (8) and @splitMergeID > 0)
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

			--If the current tax due is greater then the adjusted tax due, then the eff date does not change
			--If the amount due is not positive, then the eff date does not change
			--If the calculated date is less than the current due date
			else if(	@base_tax_due - @amount_paid <= 0 or 
				@bill_current_amount_due = @base_tax_due or
				dbo.[fn_GetEffectiveDueDate30](getdate()) < @currentEffDate)
			begin
				set @effective_due_date = @currentEffDate
			end
			
			-- 30 days, or 4/30, or 10/31
			else
			begin
				--add 30 days to the current day and go to the last day of that month
				set @effective_due_date =	dbo.[fn_GetEffectiveDueDate30](getdate())

				--If 4/30 is greater than the calculated date, then use 4/30
				if datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), @effective_due_date) <= 0
				begin
					set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), 0)
				end
							
				----Else If 4/30 is less than the calculated date, then if 10/31 is greater than the calculated date, then use 10/31
				else if @ignoreOct30 = 0 and datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), @effective_due_date) <= 0
				begin
					set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), 0)
				end
			end

			if (@currentEffDate is not null and @effective_due_date < @currentEffDate and @supp_attribute not in (8) and @splitMergeID <= 0)
				begin
					set @effective_due_date = @currentEffDate
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
						insert into supplement_idlist
						values (@sup_group_id, @tax_yr, @prop_id, @statement_id, @effective_due_date, 0, 0)
					end
			end
			
		end		
		else     -- if @postpone_duedate = 0
		begin
		--Split \ Merge
		if (@supp_attribute in (8) and @splitMergeID > 0)
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

		--If the current tax due is greater then the adjusted tax due, then the eff date does not change
		--If the amount due is not positive, then the eff date does not change
		--If the calculated date is less than the current due date
		else if(	@base_tax_due - @amount_paid <= 0 or 
			@bill_current_amount_due >= @base_tax_due or
			dbo.[fn_GetEffectiveDueDate30](getdate()) < @currentEffDate)
		begin
			set @effective_due_date = @currentEffDate
		end
		
		-- 30 days, or 4/30, or 10/31
		else
		begin
			--add 30 days to the current day and go to the last day of that month
			set @effective_due_date =	dbo.[fn_GetEffectiveDueDate30](getdate())

			--If 4/30 is greater than the calculated date, then use 4/30
			if datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), @effective_due_date) <= 0
			begin
				set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/4/30')), '2000/4/30'), 0)
			end
						
			----Else If 4/30 is less than the calculated date, then if 10/31 is greater than the calculated date, then use 10/31
			else if @ignoreOct30 = 0 and datediff(day, dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), @effective_due_date) <= 0
			begin
				set @effective_due_date = dbo.fn_FormatDate(dateadd(year, (@current_tax_yr + 1 - datepart(year, '2000/10/31')), '2000/10/31'), 0)
			end
		end

		if (@currentEffDate is not null and @effective_due_date < @currentEffDate and @supp_attribute not in (8) and @splitMergeID <= 0)
			begin
				set @effective_due_date = @currentEffDate
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
					insert into supplement_idlist
					values (@sup_group_id, @tax_yr, @prop_id, @statement_id, @effective_due_date, 0, 0)
				end
		end

		end		
		-------------------******************************************************************************************
		-------------------***********************************************Effective Due Date
		--new bill
		if @bill_id = 0 and @base_tax_due > 0
		begin
			set @wtsLevyStatementID = 0

			-- create a new trans_group_id
			exec GetUniqueID 'trans_group', @bill_id output, 1, 0

			-- create the trans_group record
			insert into trans_group (trans_group_id, trans_group_type) values (@bill_id, 'AB')

			--Statement ID Assignment :: This process is not done for manually created bills.
			--1. If the agency is part of the group used to create the levy statement
			--   Then use that statement id.  Note: This will only occur if there is 1 levy bill statement id
			if isNull((	select count(distinct bill.statement_id) 
						from bill with (nolock)
						join levy_bill lb with (nolock) on 
							bill.bill_id = lb.bill_id
						left join wa_tax_statement wts with (nolock) on
							wts.year = bill.year
							and wts.prop_id = bill.prop_id
							and wts.statement_id = bill.statement_id
						where bill.year = @tax_yr
							and bill.prop_id = @prop_id
							and isNull(bill.bill_type, 'L') not in ('MCSA', 'MCSL', 'R', 'MCL', 'MCA')
							and isNull(bill.statement_id, 0) <> 0), 0) = 1
			begin
				--1a. Get the statement id
				select @wtsLevyStatementID = bill.statement_id
				from bill with (nolock)
				join levy_bill lb with (nolock) on 
					bill.bill_id = lb.bill_id
				left join wa_tax_statement wts with (nolock) on
					wts.year = bill.year
					and wts.prop_id = bill.prop_id
					and wts.statement_id = bill.statement_id
				where bill.year = @tax_yr
					and bill.prop_id = @prop_id
					and isNull(bill.bill_type, 'L') not in ('MC', 'R', 'RR')
					and isNull(bill.statement_id, 0) <> 0			


			end
			
			--1b. If the group included this bill's agency id, then use that statement id
			if @wtsLevyStatementID > 0
			begin								
				if exists (	select * 
						from wa_tax_statement_group wtsg with (nolock)
						join (	select min(run_id) runId, group_id, year
								from wa_tax_statement with (nolock)
								where year = @tax_yr
									and prop_id = @prop_id
									and statement_id = @wtsLevyStatementID		
								group by group_id, year) wts on
							wtsg.year = wts.year 
							and wtsg.group_id = wts.group_id
						left join wa_tax_statement_assessment wtsa with (nolock) on
							wtsg.year = wtsa.year
							and wtsg.group_id = wtsa.group_id
						where wtsa.agency_id = @agency_id 
							and isNull(wtsg.include_assessments, 0) = 1)
				begin
					set @statement_id = @wtsLevyStatementID
				end
			-- If there is not an assessment statement for other assessment bills on that property however there is a levy bill
			--   Then use that statement id.  Note: This will only occur if there is 1 NEW levy bill statement id
				else if isNull((	
					select count(distinct b.statement_id) 
					from bill b with (nolock)
					join prop_supp_assoc psa with(nolock) on
						psa.prop_id = b.prop_id and
						psa.owner_tax_yr = b.year and
						psa.sup_num = b.sup_num	
					join supplement s with(nolock) on
						s.sup_tax_yr = b.year and
						s.sup_num = b.sup_num and
						s.sup_num = psa.sup_num															 								
					where b.prop_id = @prop_id
						and isNull(b.statement_id, 0) <> 0
						and isNull(b.bill_type, 'L') <> 'MC'
						and ISNULL(s.sup_group_id, 0) = @sup_group_id
						and ISNULL(s.sup_tax_yr, 0) = @tax_yr), 0
					) = 1
				begin
					select @statement_id = b.statement_id
					from bill b with (nolock)
					join prop_supp_assoc psa with(nolock) on
						psa.prop_id = b.prop_id and
						psa.owner_tax_yr = b.year and
						psa.sup_num = b.sup_num	
					join supplement s with(nolock) on
						s.sup_tax_yr = b.year and
						s.sup_num = b.sup_num and
						s.sup_num = psa.sup_num															 								
					where b.prop_id = @prop_id
						and isNull(b.statement_id, 0) <> 0
						and isNull(b.bill_type, 'L') <> 'MC'
						and ISNULL(s.sup_group_id, 0) = @sup_group_id
						and ISNULL(s.sup_tax_yr, 0) = @tax_yr
				end	
				--3. If an existing statement id cannot be used and the bill is for a delinquent year
				--   Then get the next id 
				else if (@tax_yr < @current_tax_yr)
				begin

					--use the current assigned statement id unless its for another property, year, or is 0
					if(@currentPropID <> @prop_id or @currentStatementYear <> @tax_yr or @statement_id = 0)
					begin									
						exec GetNextStatementID @tax_yr, @statement_id output, 0, 1
					end					
				end									
				
			end -- if @wtsLevyStatementID > 0
			
			--2. If an assessment statement was created for other assessment bills on that property
			--   Then use that statement id.  Note: This will only occur if there is 1 levy bill statement id
			else if isNull((	select count(distinct b.statement_id) 
								from bill b with (nolock)
								join assessment_bill ab with (nolock) on
									b.bill_id = ab.bill_id
								where b.prop_id = @prop_id
									and isNull(b.statement_id, 0) <> 0
									and isNull(b.bill_type, 'L') <> 'MC'
									and b.statement_id not in (	select bill.statement_id
																from bill with (nolock)
																join levy_bill lb with (nolock) on
																	bill.bill_id = lb.bill_id
																where bill.year = @tax_yr
																	and bill.prop_id = @prop_id
																	and isNull(bill.bill_type, 'L') <> 'MC'
																	and isNull(bill.statement_id, 0) <> 0)), 0) = 1
				begin
					select @statement_id = b.statement_id
					from bill b with (nolock)
					join assessment_bill ab with (nolock) on
						b.bill_id = ab.bill_id
					where b.prop_id = @prop_id
						and isNull(b.statement_id, 0) <> 0
						and isNull(b.bill_type, 'L') <> 'MC'
						and b.statement_id not in (	select bill.statement_id
													from bill with (nolock)
													join levy_bill lb with (nolock) on
														bill.bill_id = lb.bill_id
													where bill.year = @tax_yr
														and bill.prop_id = @prop_id
														and isNull(bill.bill_type, 'L') <> 'MC'
														and isNull(bill.statement_id, 0) <> 0)
				end



			--3. If an existing statement id cannot be used and the bill is for a delinquent year
			--   Then get the next id 
			else if (@tax_yr < @current_tax_yr)
			begin

				--use the current assigned statement id unless its for another property, year, or is 0
				if(@currentPropID <> @prop_id or @currentStatementYear <> @tax_yr or @statement_id = 0)
				begin									
					exec GetNextStatementID @tax_yr, @statement_id output, 0, 1
				end					
			end
			


			set @currentPropID = @prop_id
			set @currentStatementYear = @tax_yr			

			--determine the statement due date
			set @statement_eff_date = null
		
			if (isNull(@statement_id, 0) > 0 and @supp_attribute not in (8) and @splitMergeID <= 0) 
			begin
				select @statement_eff_date = effective_due_date, 
					   @stmt_h1_paid = isNull(h1_paid, 0)
				from supplement_idlist
				where year = @tax_yr
				and prop_id = @prop_id
				and statement_id = @statement_id
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
				insert into supplement_idlist
				values (@sup_group_id, @tax_yr, @prop_id, @statement_id, @effective_due_date, 0, 0)
			end
	
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
				statement_id,
				created_by_type_cd,
				last_modified
			)
			values
			(
				@bill_id,
				@prop_id,
				@tax_yr,
				@sup_num,
				@owner_id,
				0, --initial amount due is 0.00 
				@base_tax_due, 
				0,
				@effective_due_date,
				'A',
				case when @accept_prop_id > 0 then 1 else 0 end,
				@statement_id,
				'SUP',
				getdate()
			)

			-- create a assessment_bill record
			insert into assessment_bill
			(
				[year],
				agency_id,				
				bill_id
			)
			values
			(
				@tax_yr,
				@agency_id,
				@bill_id
			)

			-- get a new transaction_id
			exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0
			
			-- create a coll_transaction record
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
					0,
					0,						-- base_amount_pd
					0,						-- penalty_amount_pd
					0,						-- interest_amount_pd
					0,						-- bond_interest_pd
					'CAB', 					-- transaction_type
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
					0,
					0,						-- base_amount_pd
					0,						-- penalty_amount_pd
					0,						-- interest_amount_pd
					0,						-- bond_interest_pd
					'CAB', 					-- transaction_type
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
					'ADJAB', 					-- transaction_type
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
					'ADJAB', 					-- transaction_type
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
				modify_reason
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
				0,
				'SM',
				0,
				@base_tax_due,
				@sup_cd,
				@sup_desc
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
		
		--bill exists, requires an adjustment
		else if @bill_id > 0
		begin
			--if the bill is part of a payout agreement, then set the status to locked
			UPDATE payout_agreement
			SET status_cd = 'L'
			FROM payout_agreement pa with(nolock)
			INNER JOIN payout_agreement_bill_assoc paba with(nolock)
				ON paba.payout_agreement_id = pa.payout_agreement_id
			WHERE paba.bill_id = @bill_id						

			--the property has been deleted		
			if exists(
				select prop_id from property_val 
				where prop_id = @prop_id
				and prop_val_yr = @tax_yr
				and sup_num = @sup_num
				and isNull(prop_inactive_dt, '') <> ''
				and isNull(udi_parent, '') = '')
			begin
				set @base_tax_due = 0
				set @additional_fee_amt = 0
			end
			
			set @bill_adjustment_amount = @base_tax_due - @bill_current_amount_due
			
			--get a new transaction_id
			exec GetUniqueID 'coll_transaction', @transaction_id output, 1, 0

			-- create a pending_coll_transaction record
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
					@bill_adjustment_amount,
					0,						-- base_amount_pd
					0,						-- penalty_amount_pd
					0,						-- interest_amount_pd
					0,						-- bond_interest_pd
					'ADJAB', 				-- transaction_type
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
					@bill_adjustment_amount,
					0,						-- base_amount_pd
					0,						-- penalty_amount_pd
					0,						-- interest_amount_pd
					0,						-- bond_interest_pd
					'ADJAB', 				-- transaction_type
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
				previous_payment_status_type_cd
			)
			select	@bill_adj_id, @bill_id, @transaction_id, @batch_id,
					@sup_num, b.code, b.code, b.effective_due_date, @effective_due_date, 
					0, 0, 'SM', b.current_amount_due, @base_tax_due,
					@sup_cd, @sup_desc, b.payment_status_type_cd
			from bill b
			join assessment_bill ab
			on ab.bill_id = b.bill_id
			where b.bill_id = @bill_id

			insert into #tmpAdj (bill_adjustment_id, bill_id)
			values (@bill_adj_id, @bill_id)					

			update bill set
				current_amount_due = current_amount_due + @bill_adjustment_amount
				,sup_num = @sup_num
				,effective_due_date = 
					CASE WHEN (@base_tax_due > @bill_current_amount_due) THEN @effective_due_date 
						ELSE effective_due_date END
				,last_modified = getdate()
			where 
				bill_id = @bill_id

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
		begin
			set @is_half_pay = 1
		end						

		--the refactor process will handle updating the payments due records if nothing has been paid
		if @is_half_pay = 1 and @bill_adjustment_amount > 0
		begin
			update h2
			set amount_due = @base_tax_due - h1.amount_due
			from bill_payments_due h2 with (nolock)
			join bill_payments_due h1 with (nolock)
			on h2.bill_id = h1.bill_id 
			and h1.bill_payment_id = 0
			where h2.bill_id = @bill_id
			and h2.bill_payment_id = 1	
		end
		else
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

		--Fees
		if (@additional_fee_amt > 0 or @fee_id > 0)
		begin
			exec CreatePropOrBillFee		@fee_id, @pacs_user_id, @tax_yr,
											@batch_id, 0, @bill_id, @sup_num, @owner_id, 
											@additional_fee_amt, @fee_type_cd, @effective_due_date, 
											@statement_id, 'SM', @fee_current_amount_due, 'Assessment Administrative Fee',
											@sup_cd, @sup_desc, null, null, null, @accept_prop_id
		end		

		fetch next from billData into
			@tax_yr, @sup_num, @prop_id, @owner_id, @prop_type_cd,
			@agency_id, @base_tax_due, @additional_fee_amt, @fee_type_cd, @bill_id, @bill_current_amount_due,
			@bill_initial_amount_due, @sup_cd, @sup_desc, @fee_id, @fee_current_amount_due, @supp_attribute, @currentEffDate, 
			@amount_paid, @statement_id, @payment_status, @splitMergeID, @splitMergeType
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





 

set ansi_nulls on
set quoted_identifier on

GO

