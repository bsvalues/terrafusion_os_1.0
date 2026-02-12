

create procedure ElectronicTaxationExport
@bill_dataset_id int,
@fee_dataset_id int,
@as_of_date datetime,
@where	varchar(max),
@filter	varchar(max),
@redactOwnerName bit

as

SET NOCOUNT ON

declare @sqlCommand nvarchar(max)
declare @DEBUG bit = 0

			-- avoid warnings about null values in aggregates
	set ansi_warnings off

	select @DEBUG = szConfigValue from pacs_config where szConfigName = 'Debug Bill Export'

	if (@DEBUG = 1) begin
		if object_id('_debug_tax_due_calc_bill') is not null begin drop table _debug_tax_due_calc_bill end
		if object_id('_debug_tax_due_calc_bill_payments_due') is not null begin drop table _debug_tax_due_calc_bill_payments_due end
		if object_id('_debug_tax_due_calc_fee') is not null begin drop table _debug_tax_due_calc_fee end
		if object_id('_debug_tax_due_calc_fee_payments_due') is not null begin drop table _debug_tax_due_calc_fee_payments_due end

		select * into _debug_tax_due_calc_bill from ##tax_due_calc_bill where dataset_id = @bill_dataset_id
		select * into _debug_tax_due_calc_bill_payments_due from ##tax_due_calc_bill_payments_due where dataset_id = @bill_dataset_id
		select * into _debug_tax_due_calc_fee from ##tax_due_calc_fee where dataset_id = @fee_dataset_id
		select * into _debug_tax_due_calc_fee_payments_due from ##tax_due_calc_fee_payments_due where dataset_id = @fee_dataset_id
	end

	--create an empty temp table with data structure needed
	if object_id('tempdb..#proplist') is not null begin drop table #proplist end
	select prop_id, prop_val_yr
	into #proplist
	from property_val pv with(nolock)					
	where 1=2

	--populate temp table with our property selection information
	set @sqlCommand = 'insert into #proplist ' + @filter
	exec (@sqlCommand)

			-- all-properties lookup
			if object_id('tempdb..#all_props') is not null begin drop table #all_props end
			create table #all_props
			(
				prop_id int,
				year numeric(4,0),
				is_personal bit

				primary key clustered (prop_id, year)
			)
				
			insert into #all_props (prop_id, year, is_personal)
			select distinct q.prop_id, q.year, convert(bit, case when p.prop_type_cd = 'P' 
				or p.prop_type_cd = 'A' or isnull(pst.imp_leased_land, 0) = 1 then 1 else 0 end)
			from
			(
			   select prop_id, prop_val_yr as year from #proplist
			)q

			join property p with(nolock)
			on q.prop_id = p.prop_id

			join prop_supp_assoc psa with(nolock)
			on q.prop_id = psa.prop_id
			and q.year = psa.owner_tax_yr

			join property_val pv with(nolock)
			on psa.prop_id = pv.prop_id
			and psa.owner_tax_yr = pv.prop_val_yr
			and psa.sup_num = pv.sup_num

			left join property_sub_type pst with(nolock)
			on pst.property_sub_cd = pv.sub_type

			-- individual bills and fees table
			if object_id('tempdb..#individual_bills') is not null begin drop table #individual_bills end
			create table #individual_bills
			(
				trans_group_id int,
				prop_id int,
				statement_id int,
				year numeric(4,0),
				payment_type char(1),
				rollback_id int,
				current_use_removal int,
				[1st Installment Due] numeric(14,2),
				[2nd Installment Due] numeric(14,2),
				[Full Amount Due] numeric(14,2),
				[1st Installment Due Date] datetime,
				[2nd Installment Due Date] datetime,
				[Full Amount Due Date] datetime,
				[Initial First Half] numeric(14,2),
				[Initial Second Half] numeric(14,2),
				[Initial Base Amount] numeric(14,2)			
			)
			create index #ndx_individual_bills on #individual_bills(trans_group_id, prop_id)

			-- individual bills query
			insert #individual_bills (
				trans_group_id,
				prop_id,
				statement_id,
				year,
				payment_type,
				rollback_id,
				current_use_removal,
				[1st Installment Due],
				[2nd Installment Due],
				[Full Amount Due],
				[1st Installment Due Date],
				[2nd Installment Due Date],
				[Full Amount Due Date],
				[Initial First Half],
				[Initial Second Half],
				[Initial Base Amount]				
			)
			select
				cb.bill_id
				,cb.prop_id
				,isnull(cb.statement_id, 0) statement_id
				,cb.year
				,case when paba.payout_agreement_id is not null then 'A' else null end payment_type
				,rollback_id
				,case when bill_type = 'R' then 1 else 0 end current_use_removal
				,q_output.*
			from
				##tax_due_calc_bill cb with(nolock)

				join #all_props ap
				on ap.prop_id = cb.prop_id
				and ap.year = cb.year

				left join [payout_agreement_bill_assoc] paba
				on paba.bill_id = cb.bill_id

				outer apply (
					select amount_due, amount_paid, due_date, total_due_as_of_posting total_due
					from ##tax_due_calc_bill_payments_due cbpd with(nolock)
					where cbpd.bill_id = cb.bill_id
					and cbpd.payment_id = 0
					and cbpd.dataset_id = cb.dataset_id 
					and cb.payment_status_type_cd = 'HALF'
				) h1_payment

				outer apply (
					select amount_due, amount_paid, due_date, total_due_as_of_posting total_due
					from ##tax_due_calc_bill_payments_due cbpd with(nolock)
					where cbpd.bill_id = cb.bill_id
					and cbpd.payment_id = 1
					and cbpd.dataset_id = cb.dataset_id 
					and cb.payment_status_type_cd = 'HALF'
				) h2_payment

				outer apply (
					select
						(case when h1_payment.amount_due is not null then 1 else 0 end) h1_exists,
						(case when h2_payment.amount_due is not null then 1 else 0 end) h2_exists,
						(case when (@as_of_date <= h2_payment.due_date and isnull(h1_payment.amount_due,0) - isnull(h1_payment.amount_paid,0) > 0) then 1 else 0 end) h1_flag,
						(case when (@as_of_date <= h2_payment.due_date and isnull(h2_payment.amount_due,0) - isnull(h2_payment.amount_paid,0) > 0 ) or (h1_payment.amount_paid >= h1_payment.amount_due) then 1 else 0 end) h2_flag,				
						case when isnull(h1_payment.amount_paid,0) >= isnull(h1_payment.amount_due,0) then 1 else 0 end h1_paid
				) q_flags

				outer apply (
					select sum(total_due_as_of_posting) amount_full, 
						max(due_date) date_full, sum(amount_due) orig_full 
					from ##tax_due_calc_bill_payments_due cbpd with(nolock)
					where cbpd.dataset_id = cb.dataset_id 
					and cbpd.bill_id = cb.bill_id 
					group by cbpd.bill_id
				) q_bill_payments


				outer apply (
					select cfpd.amount_due, cfpd.amount_paid, cfpd.due_date,cfpd.total_due_as_of_posting total_due
					from ##tax_due_calc_fee_payments_due cfpd with(nolock)
					inner join ##tax_due_calc_fee as cf with(nolock)
					on  cfpd.dataset_id = cf.dataset_id
					and cfpd.fee_id = cf.fee_id
					and cfpd.payment_id = 0
					and cf.payment_status_type_cd = 'HALF'
					inner join bill_fee_assoc bfa with(nolock)
					on  bfa.fee_id = cf.fee_id
					and bfa.bill_id = cb.bill_id
					where cfpd.dataset_id = @fee_dataset_id
				) h1_fee_payment

				outer apply (
					select cfpd.amount_due, cfpd.amount_paid, cfpd.due_date,cfpd.total_due_as_of_posting total_due
					from ##tax_due_calc_fee_payments_due cfpd with(nolock)
					inner join ##tax_due_calc_fee cf with(nolock)
					on  cfpd.dataset_id = cf.dataset_id
					and cfpd.fee_id = cf.fee_id
					and cfpd.payment_id = 1
					and cf.payment_status_type_cd = 'HALF'
					inner join bill_fee_assoc bfa with(nolock)
					on  bfa.fee_id = cf.fee_id
					and bfa.bill_id = cb.bill_id
					where cfpd.dataset_id = @fee_dataset_id
				) h2_fee_payment

				outer apply (
					select
						(case when h1_fee_payment.amount_due is not null then 1 else 0 end) h1_fee_exists,
						(case when h2_fee_payment.amount_due is not null then 1 else 0 end) h2_fee_exists,
						(case when (@as_of_date <= h2_fee_payment.due_date)  then 1 else 0 end) h1_fee_flag,
						(case when (@as_of_date <= h2_fee_payment.due_date)  or (h1_fee_payment.amount_paid >= h1_fee_payment.amount_due) then 1 else 0 end) h2_fee_flag                       
				) q_fee_flags

				outer apply (
					select sum(cfpd.total_due_as_of_posting) fee_total_due, 
						sum(cfpd.amount_due) fee_orig_full
					from ##tax_due_calc_fee_payments_due cfpd with(nolock)
					join bill_fee_assoc bfa with(nolock)
					on bfa.fee_id = cfpd.fee_id
					and bfa.bill_id = cb.bill_id
					where cfpd.dataset_id = @fee_dataset_id
				) q_fee_payments

				outer apply (

					-- individual bills and bill-associated fees
					-- 1.If the bill is to be paid in full, we treat the fee as being full pay regardless.
					-- 2.If h1_flag = 1 => h2_flag = 1 follows.
					-- 3.If h1_fee_flag = 1 => h2_fee_flag = 1 follows.

					select 
						(case when h1_flag = 1 
									then (case when h1_fee_flag = 1
														then isnull(h1_payment.total_due,0) + isnull(h1_fee_payment.total_due,0)
														when h1_fee_flag = 0 and h2_fee_flag = 0 
														then isnull(h1_payment.total_due,0) + isnull(fee_total_due,0)
														else isnull(h1_payment.total_due,0) end)
									when h1_flag = 0 and h2_flag = 0
									then isnull(amount_full,0) + isnull(fee_total_due,0) 
									else 0 end) [1st Installment Due],

						(case when h2_flag = 1 and h1_flag = 1 
									then (case when h2_fee_flag = 1 
														then isnull(h2_payment.total_due, 0) + isnull(h2_fee_payment.total_due,0)
														else isnull(h2_payment.total_due,0) end)
									when h2_flag = 1 and h1_flag = 0
									then isnull(h2_payment.total_due,0) + isnull(fee_total_due,0)
									else 0 end) [2nd Installment Due],                             

						isnull(amount_full,0) + isnull(fee_total_due,0) [Full Amount Due],

						(case when h1_flag = 1 
							then h1_payment.due_date 
							  when h1_flag = 0 and h2_flag = 0
							then date_full else null end) [1st Installment Due Date],
						(case when h2_flag = 1 
							then h2_payment.due_date else null end) [2nd Installment Due Date],
						(case when h1_paid = 0
							then h1_payment.due_date 
							else isnull(h2_payment.due_date, date_full) end) [Full Amount Due Date],


						(case 
							when h1_exists = 1 
							then (
								case when h1_fee_exists = 1
								then isnull(h1_payment.amount_due,0) + isnull(h1_fee_payment.amount_due,0)
								when h1_fee_exists = 0 and h2_fee_exists = 0 
								then isnull(h1_payment.amount_due,0) + isnull(fee_orig_full,0)
								else isnull(h1_payment.amount_due,0) 
								end)
							when h1_exists = 0 and h2_exists = 0
							then isnull(orig_full,0) + isnull(fee_orig_full,0) 
							else 0 end
						) [Initial First Half],

						(case 
							when h2_exists = 1 and h1_exists = 1 
							then (
								case when h2_fee_exists = 1 
								then isnull(h2_payment.amount_due, 0) + isnull(h2_fee_payment.amount_due,0)
								else isnull(h2_payment.amount_due,0) 
								end)
							when h2_exists = 1 and h1_exists = 0
							then isnull(h2_payment.amount_due,0) + isnull(fee_orig_full,0)
							else 0 end
						) [Initial Second Half],

						isnull(orig_full,0) + isnull(fee_orig_full,0) [Initial Base Amount]
				) q_output

				cross apply (
					select rollback_id from bill with(nolock)
					where bill_id = cb.bill_id
				) q_rollback


			where cb.dataset_id = @bill_dataset_id

			-- individual property fees
			insert #individual_bills (
				trans_group_id,
				prop_id,
				statement_id,
				year,
				payment_type,
				rollback_id,
				current_use_removal,
				[1st Installment Due],
				[2nd Installment Due],
				[Full Amount Due],
				[1st Installment Due Date],
				[2nd Installment Due Date],
				[Full Amount Due Date],
				[Initial First Half],
				[Initial Second Half],
				[Initial Base Amount]				
			)
			select
				cf.fee_id,
				fpa.prop_id
				,isnull(cf.statement_id, 0) statement_id
				,cf.year
				,null payment_type
				,null rollback_id
				,0 current_use_removal
				,q_output.*
			from
				##tax_due_calc_fee cf with(nolock)

				join fee_prop_assoc fpa with(nolock)
				on fpa.fee_id = cf.fee_id

				join #all_props ap
				on ap.prop_id = fpa.prop_id
				and ap.year = cf.year

				outer apply (
					select amount_due, amount_paid, due_date, total_due_as_of_posting total_due
					from ##tax_due_calc_fee_payments_due cfpd with(nolock)
					where cfpd.fee_id = cf.fee_id
					and cfpd.payment_id = 0
					and cfpd.dataset_id = cf.dataset_id 
					and cf.payment_status_type_cd = 'HALF'
				) h1_payment

				outer apply (
					select amount_due, amount_paid, due_date, total_due_as_of_posting total_due
					from ##tax_due_calc_fee_payments_due cfpd with(nolock)
					where cfpd.fee_id = cf.fee_id
					and cfpd.payment_id = 1
					and cfpd.dataset_id = cf.dataset_id 
					and cf.payment_status_type_cd = 'HALF'
				) h2_payment

				outer apply (
					select
						(case when h1_payment.amount_due is not null then 1 else 0 end) h1_exists,
						(case when h2_payment.amount_due is not null then 1 else 0 end) h2_exists,
						(case when (@as_of_date <= h2_payment.due_date and isnull(h1_payment.amount_due,0) - isnull(h1_payment.amount_paid,0) > 0) then 1 else 0 end) h1_flag,
						(case when (@as_of_date <= h2_payment.due_date and isnull(h2_payment.amount_due,0) - isnull(h2_payment.amount_paid,0) > 0 ) or (h1_payment.amount_paid >= h1_payment.amount_due) then 1 else 0 end) h2_flag,
						case when isnull(h1_payment.amount_paid,0) >= isnull(h1_payment.amount_due,0) then 1 else 0 end h1_paid
				) q_flags

				outer apply (
					select sum(total_due_as_of_posting) amount_full, 
						max(due_date) date_full, sum(amount_due) orig_full 
					from ##tax_due_calc_fee_payments_due cfpd with(nolock)
					where cfpd.dataset_id = cf.dataset_id 
					and cfpd.fee_id = cf.fee_id 
					group by cfpd.fee_id
				) q_fee_payments

				outer apply (
					select 

						(case 
							when h1_flag = 1 then isnull(h1_payment.total_due,0)
							when h1_flag = 0 and h2_flag = 0 then isnull(amount_full,0) 
							else 0 end) [1st Installment Due],

						(case
							when h2_flag = 1 then isnull(h2_payment.total_due,0)
							else 0 end) [2nd Installment Due],                             

						isnull(amount_full,0) [Full Amount Due],

						(case 
							when h1_flag = 1 then h1_payment.due_date 
						    when h1_flag = 0 and h2_flag = 0 then date_full 
							else null end) [1st Installment Due Date],

						(case 
							when h2_flag = 1 then h2_payment.due_date 
							else null end) [2nd Installment Due Date],

						(case when h1_paid = 0
							then h1_payment.due_date 
							else isnull(h2_payment.due_date, date_full) end) [Full Amount Due Date],

						(case 
							when h1_exists = 1 then isnull(h1_payment.amount_due,0)
							when h1_exists = 0 and h2_exists = 0 then isnull(orig_full,0) 
							else 0 end) [Initial First Half],

						(case 
							when h2_exists = 1 and h1_exists = 1 then isnull(h2_payment.amount_due,0)
							else 0 end) [Initial Second Half],

						isnull(orig_full,0) [Initial Base Amount]
				) q_output

			where cf.dataset_id = @fee_dataset_id

			-- placeholders for no-bill properties
			insert #individual_bills (
				trans_group_id,
				prop_id,
				statement_id,
				year,
				payment_type,
				rollback_id,
				current_use_removal,
				[1st Installment Due],
				[2nd Installment Due],
				[Full Amount Due],
				[1st Installment Due Date],
				[2nd Installment Due Date],
				[Full Amount Due Date],
				[Initial First Half],
				[Initial Second Half],
				[Initial Base Amount]				
			)
			select * from
			(
				select -1 trans_group_id
					,prop_id
					,0 statement_id
					,year
					,null payment_type
					,0 rollback_id
					,0 current_use_removal
					,0 [1st Installment Due]
					,0 [2nd Installment Due]
					,0 [Full Amount Due]
					,null [1st Installment Due Date]
					,null [2nd Installment Due Date]
					,null [Full Amount Due Date]
					,0 [Initial First Half]
					,0 [Initial Second Half]
					,0 [Initial Base Amount]

				from #all_props
			)ap
			where not exists (
				select 1 from #individual_bills ib
				where ib.prop_id = ap.prop_id
				and ib.year = ap.year
			)


			-- create #max_pv lookup
			if object_id('tempdb..#max_pv') is not null begin drop table #max_pv end
			create table #max_pv
			(
				prop_id int,
				prop_val_yr numeric(4, 0)
			)
			create index #ndx_max_pv on #max_pv(prop_id, prop_val_yr)

			insert into #max_pv(prop_id, prop_val_yr)
			select prop_id, max(year) 
			from #individual_bills
			group by prop_id

			-- main query: Add additional property-related fields
			set @sqlCommand = '
			set nocount off
			select
				b.prop_id as [Prop_ID]
				,left(p.geo_id, 25) as [Geo_ID]
				,replace(left(s.situs_display, 50), char(13) + char(10), '' '') as [Situs]
				,replace(left(pv.legal_desc, 100), char(13) + char(10), '' '') as [Legal]
				,isnull(b.statement_id, 0) as [Statement ID]
				,case when rollback_id > 0 then ''R''
					when b_sup.sup_num > 0 then ''M'' else ''K'' end as [Segment Type]
				,b.year+1 as [Tax Year]
				,b.[1st Installment Due]
				,b.[1st Installment Due Date]
				,b.[2nd Installment Due]
				,b.[2nd Installment Due Date]
				,b.[Full Amount Due]
				,b.[Full Amount Due Date]
				,mc.lender_num as [Lender Number]
				,left(ma.mortgage_acct_id, 10) as [Loan ID]
				,b.[Initial First Half]
				,b.[Initial Second Half]
				,b.[Initial Base Amount]
                ,case when ' + cast(@redactOwnerName as char(1)) + ' = 0 then owner_account.file_as_name else ''XXXXXXXXXXXXXXXXXXXX'' end as [Owner Name]
				,p.prop_type_cd [Property Type]
				,case when wtsg.include_property_taxes = 1 then ''Property Taxes'' else wtsg.description end [Statement Description]
				,convert(numeric(1,0), current_use_removal) [Current Use Removal]
				,b.[payment_type] as [Payment Type]
				,o.owner_id as [Owner ID]
			from
			(
				-- sum up the bills by property
				select
					prop_id
					,statement_id
					,year
					,payment_type
					,max(isnull(rollback_id, 0)) rollback_id
					,max(current_use_removal) current_use_removal
					,sum([1st Installment Due]) [1st Installment Due]
					,sum([2nd Installment Due]) [2nd Installment Due]
					,sum([Full Amount Due]) [Full Amount Due]
					,min([1st Installment Due Date]) [1st Installment Due Date] 
					,min([2nd Installment Due Date] ) [2nd Installment Due Date] 
					,min([Full Amount Due Date]) [Full Amount Due Date]
					,sum([Initial First Half]) [Initial First Half]
					,sum([Initial Second Half]) [Initial Second Half]
					,sum([Initial Base Amount]) [Initial Base Amount]

				from #individual_bills
				group by prop_id, statement_id, year, payment_type
			) b

			join property p with(nolock)
			on b.prop_id = p.prop_id

			join #max_pv
			on #max_pv.prop_id = b.prop_id

			join property_val pv with(nolock)
			on #max_pv.prop_val_yr = pv.prop_val_yr
			and #max_pv.prop_id = pv.prop_id

			join prop_supp_assoc psa with(nolock)
			on p.prop_id = psa.prop_id
			and pv.prop_val_yr = psa.owner_tax_yr
			and pv.sup_num = psa.sup_num

			outer apply (
				select top 1 *
				from situs with(nolock)
				where psa.prop_id = situs.prop_id
				order by (case when primary_situs = ''Y'' then 1 else 2 end)
			) s

			outer apply (
				select top 1 mortgage_co_id, mortgage_acct_id
				from mortgage_assoc with(nolock)
				where mortgage_assoc.prop_id = p.prop_id
			) ma

			left join mortgage_co mc with(nolock)
			on ma.mortgage_co_id = mc.mortgage_co_id

			outer apply (
				select top 1 owner_id
				from owner o with(nolock)
				inner join supplement s with(nolock) on
				s.sup_tax_yr = o.owner_tax_yr and s.sup_num = o.sup_num
				inner join sup_group sg with(nolock) on
				sg.sup_group_id = s.sup_group_id
				where psa.prop_id = o.prop_id
				and  (select max(prop_val_yr) from property_val with(nolock) where prop_id = o.prop_id) = o.owner_tax_yr
				and (sg.status_cd in (''BC'', ''BA'', ''A'') or sg.sup_group_id = 0)
				order by o.sup_num desc, pct_ownership desc
			) o

			left join account owner_account with(nolock)
			on o.owner_id = owner_account.acct_id

			outer apply (
				select min(group_id) group_id
				from wa_tax_statement with(nolock)
				where wa_tax_statement.prop_id = b.prop_id
				and wa_tax_statement.year = b.year
				and wa_tax_statement.statement_id = b.statement_id
			) wts

			left join wa_tax_statement_group wtsg with(nolock)
			on wtsg.group_id = wts.group_id
			and wtsg.year = b.year

			outer apply (
				select sup_num
				from prop_supp_assoc psa with(nolock)
				where psa.prop_id = b.prop_id
				and psa.owner_tax_yr = b.year
			) b_sup
			' + @where + '
			order by b.prop_id, b.year
			'

exec sp_executesql @sqlCommand

GO

