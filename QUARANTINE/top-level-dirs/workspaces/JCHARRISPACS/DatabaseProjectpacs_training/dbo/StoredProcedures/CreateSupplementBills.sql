
CREATE PROCEDURE [dbo].[CreateSupplementBills]
	@effective_due_date datetime,
	@omitted_effective_due_date datetime,
	@pacs_user_id		int,
	@sup_group_id	int	= 0,
	@batch_id int = 0
AS
	set nocount on
	declare @return_message varchar(255)

	if @sup_group_id > -1
		begin
				if not exists(
					select *
					from sup_group as sg with (nolock)
					where sg.sup_group_id = @sup_group_id)
				begin
					set @return_message = 'Invalid Supplement Group.'
					goto quit			
				end
		end		
		else
		begin
			set @return_message = 'Invalid Supplement Group.'
			goto quit
		end

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
		@tax_area_id	int,
		@is_active	bit,
		@levy_exempts_snr		varchar(10),
		@levy_exempts_farm		varchar(10),
		@levy_rate				numeric(13, 10),
		@base_tax_due			numeric(14, 2),
		@total_taxable_value	numeric(14, 0),
		@state_assessed			numeric(14, 0),
		@transaction_id			int,
		@bill_adjustment_amount	numeric(14,2),
		@bill_adj_id			int,
		@sup_cd					varchar(10),
		@supp_attribute			int,  
		@current_tax_yr			int,
		@offset					int   
		
		
	--Determine the system's current tax year
	select @current_tax_yr = tax_yr
	from pacs_system				

	declare billData cursor fast_forward for
		select distinct
				s.sup_tax_yr,
				s.sup_num,
				wpov.prop_id,
				o.owner_id,
				p.prop_type_cd,
				tafa.tax_district_id,
				tafa.levy_cd,
				wpov.taxable_classified,
				wpov.taxable_non_classified,
				isnull(wpov.state_assessed, 0),
				isnull(b.bill_id, 0) as bill_id,
				b.current_amount_due,
				b.initial_amount_due,
				pta.tax_area_id,
				b.is_active,
				isnull(le_snr.exmpt_type_cd, '') as levy_exempts_snr,
				isnull(le_frm.exmpt_type_cd, '') as levy_exempts_farm,
				isnull(l.levy_rate, 0),
				pv.sup_cd,
				isNull(supp.supp_attribute, 0) as supp_attribute

				from sup_group as sg with (nolock)
				inner join supplement as s with (nolock)
				on s.sup_group_id = sg.sup_group_id

				inner join wash_prop_owner_val as wpov with (nolock)
					ON wpov.year = s.sup_tax_yr
					AND wpov.sup_num = s.sup_num

				inner join owner as o with (nolock)
					on o.owner_tax_yr = s.sup_tax_yr
					and o.sup_num = s.sup_num
					and o.prop_id = wpov.prop_id
					and o.owner_id = wpov.owner_id

				inner join property as p with (nolock)
					on p.prop_id = wpov.prop_id
					
				inner join property_val as pv with(nolock)
					on pv.prop_id = wpov.prop_id
					and pv.prop_val_yr = wpov.year
					and pv.sup_num = wpov.sup_num
					
				inner join supp with (nolock)
					on pv.sup_cd = supp.sup_type_cd

				inner join property_tax_area as pta with (nolock)
					on pta.year = s.sup_tax_yr
					and pta.sup_num = s.sup_num
					and pta.prop_id = wpov.prop_id

				inner join tax_area_fund_assoc as tafa with (nolock)
					on tafa.year = pta.year
					and tafa.tax_area_id = pta.tax_area_id

				left outer join 
				(
					bill as b with (nolock)
					join levy_bill as lb with (nolock)
					on lb.bill_id = b.bill_id
					and lb.[year] = b.[year]
				)
					ON b.[year] = s.sup_tax_yr
					AND b.prop_id = wpov.prop_id
					AND lb.tax_district_id = tafa.tax_district_id
					AND lb.levy_cd = tafa.levy_cd
					AND lb.[year] = tafa.[year]
				left outer join levy as l with (nolock) on
					l.[year]				= tafa.[year]
					and l.tax_district_id		= tafa.tax_district_id
					and l.levy_cd				= tafa.levy_cd

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

				WHERE s.sup_group_id = @sup_group_id


	set nocount on
	open billData

	fetch next from billData into
		@tax_yr, @sup_num, @prop_id, @owner_id, @prop_type_cd,
		@tax_district_id, @levy_cd, @taxable_classified,
		@taxable_non_classified, @state_assessed, @bill_id, @bill_current_amount_due,
		@bill_initial_amount_due, @tax_area_id, @is_active,
		@levy_exempts_snr, @levy_exempts_farm, @levy_rate, @sup_cd, @supp_attribute

	while @@fetch_status = 0
	begin
		--calculate the effective due date
		--If the bill's tax year is less than the current year, then it is due in 30 days
		if @tax_yr + 1 < @current_tax_yr or @supp_attribute = 0		
		begin 
			--add 30 days to the current day
			--set @effective_due_date = dateadd(day, 30, getDate())
			
			--add 30 days to the current day and go to the last day of that month
			set @effective_due_date = dateadd(month, 1, dateadd(day, 30, getDate()))
			set @offset = datepart(day, @effective_due_date) * -1
			set @effective_due_date = dateadd(day, @offset, @effective_due_date)	
		end
		
		--for Manifest Error, Board of Equalization, Destroyed, Senior Citizen/DOR Exempt
		else if @supp_attribute in (1, 2, 3, 4) 
		begin 
			if datediff(day, dateadd(year, (@current_tax_yr-datepart(year, '2000/4/30')), '2000/4/30'), getdate()) < 0
			begin
				set @effective_due_date = dateadd(year, (@current_tax_yr-datepart(year, '2000/4/30')), '2000/4/30')
			end
			
			else if datediff(day, dateadd(year, (@current_tax_yr-datepart(year, '2000/10/31')), '2000/10/31'), getdate()) < 0
			begin
				set @effective_due_date = dateadd(year, (@current_tax_yr-datepart(year, '2000/10/31')), '2000/10/31')
			end
			else 
			begin
				--add 30 days to the current day and go to the last day of that month
				set @effective_due_date = dateadd(month, 1, dateadd(day, 30, getDate()))
				set @offset = datepart(day, @effective_due_date) * -1
				set @effective_due_date = dateadd(day, @offset, @effective_due_date)	
			end
		end

		--for Omitted Property, Current Use Removal, Historic Exemption Removal, Segregation/Combination
		else --if @supp_attribute in (5,6,7,8)
		begin 
			set @effective_due_date = @omitted_effective_due_date 
			--if omitted_effective_due_date is not used then the line below should be used instead
			--set @effective_due_date = dateadd(year+1, (@year-datepart(year, '2000/4/30')), '2000/4/30')
		end	
	
		if @levy_rate <> 0
		begin
			-- determine total taxable value for this levy
			if @prop_type_cd in ('R', 'MH') and @levy_exempts_snr = 'SNR/DSBL'
				begin
					-- classified value is exempt, assume no state assessed
					set @total_taxable_value = @taxable_non_classified
				end
			else if @prop_type_cd = 'P' and @levy_exempts_farm = 'FARM'
				begin
					-- classified value is exempt, assume no state assessed
					set @total_taxable_value = @taxable_non_classified
				end
			else
				begin
					-- classified value is not exempt, state assessed may exist
					set @total_taxable_value = @taxable_non_classified + @taxable_classified + @state_assessed
				end
			
			-- Calculate BPP penalties for Personal property
			/*
			if @prop_type_cd = 'P'
			begin
				-- TO BE FINISHED AFTER SDS 2016 DEVELOPMENT COMPLETED
			end	
			*/

			-- calculate a tax due amount
			set @base_tax_due = (@total_taxable_value * @levy_rate) / 1000

			if @bill_id = 0
			begin
				set @bill_id = 0
				-- create a new trans_group_id
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
					is_active
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
					0
				)

				-- create a levy_bill record
				insert into levy_bill
				(
					bill_id,
					levy_cd,
					[year],
					tax_district_id
				)
				values
				(
					@bill_id,
					@levy_cd,
					@tax_yr,
					@tax_district_id
				)

				-- get a new transaction_id
				exec GetUniqueID 'coll_transaction', @transaction_id output

				-- create a pending_coll_transaction record
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
			end				
			else
			begin
				if( @base_tax_due <> @bill_initial_amount_due )
				begin
					
					set @bill_adjustment_amount = @base_tax_due - @bill_initial_amount_due
					print cast(@base_tax_due as varchar(20)) + ' ' +
						cast(@bill_initial_amount_due as varchar(20)) + ' ' +
						cast(@bill_adjustment_amount as varchar(20)) + ' ' + 
						cast(@prop_id as varchar(20)) + ' ' + @levy_cd + ' ' +
						cast(@tax_yr as varchar(20)) + ' ' + 
						cast(@bill_id as varchar(20))
					
					update bill set
						current_amount_due = current_amount_due + @bill_adjustment_amount
						,sup_num = @sup_num
						,effective_due_date = 
							CASE WHEN (@base_tax_due > @bill_initial_amount_due) THEN @effective_due_date 
								ELSE effective_due_date END
					where 
						bill_id = @bill_id
	
					--get a new transaction_id
					exec GetUniqueID 'coll_transaction', @transaction_id output
	
					-- create a pending_coll_transaction record
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
						transaction_date
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
						getdate()
					)
					
					--get a new bill_adj_id
					exec GetUniqueID 'bill_adjustment', @bill_adj_id output
					
					insert into bill_adjustment
					(
						bill_adj_id,
						bill_id,
						transaction_id,
						batch_id,
						modify_cd
					)
					values
					(
						@bill_adj_id,
						@bill_id,
						@transaction_id,
						@batch_id,
						@sup_cd
					)

				end
				
			end
		end

		fetch next from billData into
		@tax_yr, @sup_num, @prop_id, @owner_id, @prop_type_cd,
		@tax_district_id, @levy_cd, @taxable_classified,
		@taxable_non_classified, @state_assessed, @bill_id, @bill_current_amount_due,
		@bill_initial_amount_due, @tax_area_id, @is_active,
		@levy_exempts_snr, @levy_exempts_farm, @levy_rate,@sup_cd, @supp_attribute
	end
	close billData
	deallocate billData
quit:
	select @return_message as return_message
	set nocount off

GO

