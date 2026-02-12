
/******************************************************************************************
 Procedure: [SetFiscalYearBeginBalances]
 Synopsis:	This sp will update all of the beginning balances after the Levy or SA Activate 
			Bills process is run
			
 Call From:	ActivateLevyBills or ActivateAssessmentBills
 ******************************************************************************************/
CREATE PROCEDURE SetFiscalYearBeginBalances
	@year		numeric(4, 0),
	@process	int = 0 --0 = Levy, 1 = SA
AS



	set nocount on
	declare @return_message varchar(255),
	@fiscal_year_id int, 
	@district_id int,
	@balance numeric(14,2),
	@previous_fiscal_year int,
	@previous_fiscal_year_id int,
	@previous_fiscal_year_last_month int
			
	if @process = 0 and @year > 0 --Levy Bills
	begin
		declare districtData cursor fast_forward for
			select td.tax_district_id, (select top 1 fy.fiscal_year_id
										from fiscal_year as fy with (nolock)
										join fiscal_month as fm with(nolock) 
											on fm.tax_year = fy.begin_tax_year
											and fm.tax_month = fy.begin_tax_month
										where begin_tax_year = @year+1
											and isNull(end_tax_year, -1) = -1
											and isNull(end_tax_month, -1) = -1	
											and fy.district_id = td.tax_district_id
											order by fm.begin_date DESC)
			from tax_district as td with (nolock)
			
		open districtData
		fetch next from districtData into @district_id, @fiscal_year_id
		
		while @@fetch_status = 0
		begin
			-- only update fiscal balances if a fiscal_year exists
			if not isnull(@fiscal_year_id,0) = 0 
			begin
				--Create the balance due record if it does not exist
				if not exists (	select * 
								from fiscal_year_collection_year_begin_balance_due 
								where fiscal_year_id = @fiscal_year_id
								and collection_year = @year)
				begin
					insert into fiscal_year_collection_year_begin_balance_due 
							(fiscal_year_id, collection_year, balance_due)
					values	(@fiscal_year_id, @year, 0)
				end
				
				--Create the fiscal_year_collection_year_begin_balance_due_levy records 
				delete fiscal_year_collection_year_begin_balance_due_levy
				where fiscal_year_id = @fiscal_year_id
				and collection_year = @year
				
				insert into fiscal_year_collection_year_begin_balance_due_levy 
							(fiscal_year_id, collection_year, levy_cd, balance_due)
							
						select @fiscal_year_id, @year, levy.levy_cd, sum(isNull(tmp.balance_due, 0))
								from levy with (nolock)
								join levy_bill lb with (nolock)
									on lb.levy_cd = levy.levy_cd
									and lb.tax_district_id = levy.tax_district_id
									and lb.year = levy.year
								join (	select sum(isNull(ct.base_amount, 0)) as balance_due, trans_group_id
										from coll_transaction ct with (nolock)
										join transaction_type tt with (nolock)
											on ct.transaction_type = tt.transaction_type
										where tt.core_transaction_type = 1
										group by trans_group_id) as tmp
									on tmp.trans_group_id = lb.bill_id
								where levy.year = @year
								and levy.tax_district_id = @district_id
								group by levy.levy_cd

				-- Add ending balances from the last year of the previous month
				select @previous_fiscal_year = begin_tax_year,
					@previous_fiscal_year_id = fiscal_year_id,
					@previous_fiscal_year_last_month = end_tax_month 
				from fiscal_year with(nolock)
				where district_id = @district_id
				and begin_tax_year =
					(select begin_tax_year - 1 from fiscal_year 
					 where fiscal_year_id = @fiscal_year_id)


				update fiscal_year_collection_year_begin_balance_due_levy
				set balance_due = begin_bal.balance_due + tmp.balance_due
				from fiscal_year_collection_year_begin_balance_due_levy begin_bal with(nolock)
				cross apply
				(
					select balance_due 
					from fiscal_year_month_end_balance_due_levy end_bal with(nolock)
					where end_bal.fiscal_year_id = @previous_fiscal_year_id
					and end_bal.levy_cd = begin_bal.levy_cd
					and end_bal.tax_year = @previous_fiscal_year
					and end_bal.tax_month = @previous_fiscal_year_last_month
					and end_bal.collection_year = @previous_fiscal_year
				) tmp
				where begin_bal.fiscal_year_id = @fiscal_year_id
				and begin_bal.collection_year = @year

				--Update the balances
				update fiscal_year_collection_year_begin_balance_due
				set balance_due = tmp.balance_due 
				from fiscal_year_collection_year_begin_balance_due as fybd with (nolock)
				join (select sum(fybl.balance_due) as balance_due, fybl.fiscal_year_id, fybl.collection_year
						from fiscal_year_collection_year_begin_balance_due_levy as fybl with (nolock)
						group by fybl.fiscal_year_id, fybl.collection_year) as tmp
					on tmp.fiscal_year_id = fybd.fiscal_year_id
					and tmp.collection_year = fybd.collection_year
				where fybd.fiscal_year_id = @fiscal_year_id
					and fybd.collection_year = @year
			end
			
			fetch next from districtData into @district_id, @fiscal_year_id
		end
		close districtData
		deallocate districtData
	end


	else if @process = 1 and @year > 0 --SA Bills
	begin
	declare districtData cursor fast_forward for
			select sa.agency_id, (	select top 1 fy.fiscal_year_id
										from fiscal_year as fy with (nolock)
										join fiscal_month as fm with(nolock) 
											on fm.tax_year = fy.begin_tax_year
											and fm.tax_month = fy.begin_tax_month
										where begin_tax_year = @year+1
											and isNull(end_tax_year, -1) = -1
											and isNull(end_tax_month, -1) = -1	
											and fy.district_id = sa.agency_id
											order by fm.begin_date DESC)
			from special_assessment_agency as sa with (nolock)		
		 
		open districtData
		fetch next from districtData into @district_id, @fiscal_year_id
		
		while @@fetch_status = 0
		begin
			-- only update fiscal balances if a fiscal_year exists
			if not isnull(@fiscal_year_id,0) = 0 
			begin

				--Create the balance due record if it does not exist
				if not exists (	select * 
								from fiscal_year_collection_year_begin_balance_due 
								where fiscal_year_id = @fiscal_year_id
								and collection_year = @year)
				begin
					insert into fiscal_year_collection_year_begin_balance_due 
							(fiscal_year_id, collection_year, balance_due)
					values	(@fiscal_year_id, @year, 0)
				end
				
				--Update the balances
				update fiscal_year_collection_year_begin_balance_due
				set balance_due = tmp.balance_due
				from fiscal_year_collection_year_begin_balance_due as fybd with (nolock)
				join fiscal_year as fy with (nolock)
					on fy.fiscal_year_id = fybd.fiscal_year_id
				join (select ab.agency_id, sum(isNull(t.balance_due,0)) as balance_due 
						from assessment_bill ab
						join (select sum(isNull(ct.base_amount, 0)) as balance_due, trans_group_id 
								from coll_transaction ct with (nolock)
								join transaction_type tt with (nolock)
									on ct.transaction_type = tt.transaction_type
								where tt.core_transaction_type = 1
								group by trans_group_id) as t
							on t.trans_group_id = ab.bill_id
						where ab.year = @year
						group by ab.agency_id) as tmp
					on tmp.agency_id = fy.district_id
				where fybd.fiscal_year_id = @fiscal_year_id
					and fybd.collection_year = @year
					and fy.district_id = @district_id

				-- Add ending balances from the last year of the previous month
				select @previous_fiscal_year = begin_tax_year,
					@previous_fiscal_year_id = fiscal_year_id,
					@previous_fiscal_year_last_month = end_tax_month 
				from fiscal_year with(nolock)
				where district_id = @district_id
				and begin_tax_year =
					(select begin_tax_year - 1 from fiscal_year 
					 where fiscal_year_id = @fiscal_year_id)

				update fiscal_year_collection_year_begin_balance_due
				set balance_due = begin_bal.balance_due + tmp.balance_due
				from fiscal_year_collection_year_begin_balance_due begin_bal with(nolock)
				cross apply
				(
					select balance_due 
					from fiscal_year_month_end_balance_due end_bal with(nolock)
					where end_bal.fiscal_year_id = @previous_fiscal_year_id
					and end_bal.tax_year = @previous_fiscal_year
					and end_bal.tax_month = @previous_fiscal_year_last_month
					and end_bal.collection_year = @previous_fiscal_year
				) tmp
				where begin_bal.fiscal_year_id = @fiscal_year_id
				and begin_bal.collection_year = @year

			end

			fetch next from districtData into @district_id, @fiscal_year_id
		end
		close districtData
		deallocate districtData
	
	end


	else 
	begin
		set @return_message = 'Invalid parameters'
		goto quit
	end


quit:
	select @return_message as return_message
	set nocount off

GO

