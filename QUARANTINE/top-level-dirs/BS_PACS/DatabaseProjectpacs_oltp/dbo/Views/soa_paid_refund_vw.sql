
create view soa_paid_refund_vw
as

	------------------------
	-- BEGIN:  Levy Bills --
	------------------------

	select
	
		derivedTable.dataset_id,
		
		-- Callout K:a
		item_desc = 'Property Taxes',
		
		-- Callout K:b
		derivedTable.year,

		-- Callout K:c
		derivedTable.statement_id,
		
		-- Callout K:d
		payee = isnull(ref.refund_to_name, acct.file_as_name),
		
		-- Callout K:e
		ref.check_number,
		
		-- Callout K:f
		rt.refund_reason,
		
		-- Callout K:g
		ref.refund_date,
		
		-- Callout K:h
		derivedTable.amount_refunded,

		-- Provided for easy sorting
		OrderByDummy = 1
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
		
	from (
		select
			run.dataset_id,
			rtxa.refund_id,
			b.year,
			b.statement_id,
			rtxa.refund_type_cd,
			rtxa.refund_type_year,
			amount_refunded = sum(
				ct.base_amount_pd + ct.penalty_amount_pd + 
				ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd
			) * -1.0
		from soa_run as run with(nolock)
		join refund_transaction_assoc as rtxa with(nolock) on
			rtxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = rtxa.transaction_id
		join bill as b with(nolock) on
			b.bill_id = ct.trans_group_id and
			b.is_active = 1
		join levy_bill as lb with(nolock) on
			lb.bill_id = ct.trans_group_id
		where
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_refund_year_option is 0 if 'All Years' was selected
			--     paid_refund_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_refund_year_option is null and therefore >= will select no rows
			b.year >= run.paid_refund_year_option
		group by
			run.dataset_id,
			rtxa.refund_id,
			b.year,
			b.statement_id,
			rtxa.refund_type_cd,
			rtxa.refund_type_year
	) as derivedTable
	join refund as ref with(nolock) on
		ref.refund_id = derivedTable.refund_id
	join refund_type as rt with(nolock) on
		rt.year = derivedTable.refund_type_year and
		rt.refund_type_cd = derivedTable.refund_type_cd
	left outer join account as acct with(nolock) on
		acct.acct_id = ref.account_id

	----------------------
	-- END:  Levy Bills --
	----------------------

	union all
	
	------------------------------------------------
	-- BEGIN:  Assessment Bills & Associated Fees --
	------------------------------------------------

	select
	
		derivedTable.dataset_id,
		
		-- Callout K:a
		item_desc = derivedTable.assessment_description,
		
		-- Callout K:b
		derivedTable.year,

		-- Callout K:c
		derivedTable.statement_id,
		
		-- Callout K:d
		payee = isnull(ref.refund_to_name, acct.file_as_name),
		
		-- Callout K:e
		ref.check_number,
		
		-- Callout K:f
		rt.refund_reason,
		
		-- Callout K:g
		ref.refund_date,
		
		-- Callout K:h
		amount_refunded = derivedTable.amount_refunded + isnull(assocFees.amount_refunded, 0),

		-- Provided for easy sorting
		OrderByDummy = 2
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
		
	from (
		select
			run.dataset_id,
			rtxa.refund_id,
			b.year,
			b.statement_id,
			saa.assessment_description,
			rtxa.refund_type_cd,
			rtxa.refund_type_year,
			amount_refunded = sum(
				ct.base_amount_pd + ct.penalty_amount_pd + 
				ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd
			) * -1.0
		from soa_run as run with(nolock)
		join refund_transaction_assoc as rtxa with(nolock) on
			rtxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = rtxa.transaction_id
		join bill as b with(nolock) on
			b.bill_id = ct.trans_group_id and
			b.is_active = 1
		join assessment_bill as ab with(nolock) on
			ab.bill_id = ct.trans_group_id
		join special_assessment_agency as saa with(nolock) on
			saa.agency_id = ab.agency_id
		where
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_refund_year_option is 0 if 'All Years' was selected
			--     paid_refund_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_refund_year_option is null and therefore >= will select no rows
			b.year >= run.paid_refund_year_option
		group by
			run.dataset_id,
			rtxa.refund_id,
			b.year,
			b.statement_id,
			saa.assessment_description,
			rtxa.refund_type_cd,
			rtxa.refund_type_year
	) as derivedTable
	left outer join (
		select
			rtxa.refund_id,
			f.year,
			f.statement_id,
			saa.assessment_description,
			rtxa.refund_type_cd,
			amount_refunded = sum(
				ct.base_amount_pd + ct.penalty_amount_pd + 
				ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd
			) * -1.0
		from fee as f with(nolock)
		join bill_fee_assoc as bfa with(nolock) on
			bfa.fee_id = f.fee_id
		join bill as b with(nolock) on
			b.bill_id = bfa.bill_id
		join assessment_bill as ab with(nolock) on
			ab.bill_id = b.bill_id
		join refund_transaction_assoc as rtxa with(nolock) on
			rtxa.prop_id = b.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = rtxa.transaction_id and
			ct.trans_group_id = f.fee_id
		join special_assessment_agency as saa with(nolock) on
			saa.agency_id = ab.agency_id
		where f.is_active = 1
		group by
			rtxa.refund_id,
			f.year,
			f.statement_id,
			saa.assessment_description,
			rtxa.refund_type_cd
	) as assocFees on
		assocFees.refund_id = derivedTable.refund_id and
		assocFees.year = derivedTable.year and
		assocFees.statement_id = derivedTable.statement_id and
		assocFees.assessment_description = derivedTable.assessment_description and
		assocFees.refund_type_cd = derivedTable.refund_type_cd
	join refund as ref with(nolock) on
		ref.refund_id = derivedTable.refund_id
	join refund_type as rt with(nolock) on
		rt.year = derivedTable.refund_type_year and
		rt.refund_type_cd = derivedTable.refund_type_cd
	left outer join account as acct with(nolock) on
		acct.acct_id = ref.account_id

	----------------------------------------------
	-- END:  Assessment Bills & Associated Fees --
	----------------------------------------------

	union all
	
	------------------------------------------------------------------
	-- BEGIN:  Fees associated to neither levy nor assessment bills --
	------------------------------------------------------------------

	select
	
		derivedTable.dataset_id,
		
		-- Callout K:a
		item_desc = 'Fees',
		
		-- Callout K:b
		derivedTable.year,

		-- Callout K:c
		derivedTable.statement_id,
		
		-- Callout K:d
		payee = isnull(ref.refund_to_name, acct.file_as_name),
		
		-- Callout K:e
		ref.check_number,
		
		-- Callout K:f
		rt.refund_reason,
		
		-- Callout K:g
		ref.refund_date,
		
		-- Callout K:h
		derivedTable.amount_refunded,

		-- Provided for easy sorting
		OrderByDummy = 3
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc

	from (
		select
			run.dataset_id,
			rtxa.refund_id,
			f.year,
			f.statement_id,
			rtxa.refund_type_cd,
			rtxa.refund_type_year,
			amount_refunded = sum(
				ct.base_amount_pd + ct.penalty_amount_pd + 
				ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd
			) * -1.0
		from soa_run as run with(nolock)
		join refund_transaction_assoc as rtxa with(nolock) on
			rtxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = rtxa.transaction_id
		join fee as f with(nolock) on
			f.fee_id = ct.trans_group_id and
			f.is_active = 1
		where not exists (
			select *
			from bill_fee_assoc as bfa with(nolock)
			where bfa.fee_id = f.fee_id
		) and
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_refund_year_option is 0 if 'All Years' was selected
			--     paid_refund_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_refund_year_option is null and therefore >= will select no rows
			f.year >= run.paid_refund_year_option
		group by
			run.dataset_id,
			rtxa.refund_id,
			f.year,
			f.statement_id,
			rtxa.refund_type_cd,
			rtxa.refund_type_year
	) as derivedTable
	join refund as ref with(nolock) on
		ref.refund_id = derivedTable.refund_id
	join refund_type as rt with(nolock) on
		rt.year = derivedTable.refund_type_year and
		rt.refund_type_cd = derivedTable.refund_type_cd
	left outer join account as acct with(nolock) on
		acct.acct_id = ref.account_id

	----------------------------------------------------------------
	-- END:  Fees associated to neither levy nor assessment bills --
	----------------------------------------------------------------

	union all

	----------------------------------------
	-- BEGIN:  Fees associated to levy bills
	----------------------------------------

	select

		derivedTable.dataset_id,
		
		-- Callout K:a
		item_desc = ft.fee_type_desc,
		
		-- Callout K:b
		derivedTable.year,

		-- Callout K:c
		derivedTable.statement_id,
		
		-- Callout K:d
		payee = isnull(ref.refund_to_name, acct.file_as_name),
		
		-- Callout K:e
		ref.check_number,
		
		-- Callout K:f
		rt.refund_reason,
		
		-- Callout K:g
		ref.refund_date,
		
		-- Callout K:h
		derivedTable.amount_refunded,

		-- Provided for easy sorting
		OrderByDummy = 4
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc

	from (
		select
			run.dataset_id,
			rtxa.refund_id,
			f.year,
			f.statement_id,
			f.fee_type_cd,
			rtxa.refund_type_cd,
			rtxa.refund_type_year,
			amount_refunded = sum(
				ct.base_amount_pd + ct.penalty_amount_pd + 
				ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd
			) * -1.0
		from soa_run as run with(nolock)
		join refund_transaction_assoc as rtxa with(nolock) on
			rtxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = rtxa.transaction_id
		join fee as f with(nolock) on
			f.fee_id = ct.trans_group_id and
			f.is_active = 1
		join bill_fee_assoc as bfa with(nolock) on
			bfa.fee_id = ct.trans_group_id
		join levy_bill as lb with(nolock) on
			lb.bill_id = bfa.bill_id
		where
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_refund_year_option is 0 if 'All Years' was selected
			--     paid_refund_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_refund_year_option is null and therefore >= will select no rows
			f.year >= run.paid_refund_year_option
		group by
			run.dataset_id,
			rtxa.refund_id,
			f.year,
			f.statement_id,
			f.fee_type_cd,
			rtxa.refund_type_cd,
			rtxa.refund_type_year
	) as derivedTable
	join refund as ref with(nolock) on
		ref.refund_id = derivedTable.refund_id
	join refund_type as rt with(nolock) on
		rt.year = derivedTable.refund_type_year and
		rt.refund_type_cd = derivedTable.refund_type_cd
	join fee_type as ft with(nolock) on
		ft.fee_type_cd = derivedTable.fee_type_cd
	left outer join account as acct with(nolock) on
		acct.acct_id = ref.account_id

	--------------------------------------
	-- END:  Fees associated to levy bills
	--------------------------------------

	union all

	----------------------------------------
	-- BEGIN:  Overpayment credits
	----------------------------------------

	select

		derivedTable.dataset_id,
		
		-- Callout K:a
		item_desc = derivedTable.description,
		
		-- Callout K:b
		derivedTable.year,

		-- Callout K:c
		derivedTable.statement_id,
		
		-- Callout K:d
		payee = isnull(ref.refund_to_name, acct.file_as_name),
		
		-- Callout K:e
		ref.check_number,
		
		-- Callout K:f
		rt.refund_reason,
		
		-- Callout K:g
		ref.refund_date,
		
		-- Callout K:h
		derivedTable.amount_refunded,

		-- Provided for easy sorting
		OrderByDummy = 5
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc

	from (
		select
			run.dataset_id,
			rtxa.refund_id,
			NULL as [year],
			NULL as [statement_id],
			opc.description,
			rtxa.refund_type_cd,
			rtxa.refund_type_year,
			amount_refunded = sum(
				ct.base_amount_pd + ct.penalty_amount_pd + 
				ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd
			) * -1.0
		from soa_run as run with(nolock)
		join refund_transaction_assoc as rtxa with(nolock) on
			rtxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = rtxa.transaction_id and ct.transaction_type in ('AOC', 'ROC')
		join overpayment_credit opc with(nolock) on 
			opc.overpmt_credit_id = ct.trans_group_id
		group by
			run.dataset_id,
			rtxa.refund_id,
			opc.description,
			rtxa.refund_type_cd,
			rtxa.refund_type_year
	) as derivedTable
	join refund as ref with(nolock) on
		ref.refund_id = derivedTable.refund_id
	join refund_type as rt with(nolock) on
		rt.year = derivedTable.refund_type_year and
		rt.refund_type_cd = derivedTable.refund_type_cd
	left outer join account as acct with(nolock) on
		acct.acct_id = ref.account_id

	--------------------------------------
	-- END:  Overpayment credits
	--------------------------------------

GO

