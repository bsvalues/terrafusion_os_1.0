
create view soa_paid_item_vw
as

	------------------------
	-- BEGIN:  Levy Bills --
	------------------------

	select
	
		derivedTable.dataset_id,

		-- Callout G:a
		item_desc = 'Property Taxes',
		
		-- Callout G:b
		derivedTable.year,

		-- Callout G:c
		derivedTable.statement_id,
		
		-- Callout G:d
		derivedTable.tax_paid,
		
		-- Callout G:e
		derivedTable.p_and_i_paid,
		
		-- Callout G:f
		derivedTable.under_over_paid,

		-- Callout G:g
		pay.post_date,
		
		-- Callout G:h
		derivedTable.amount_paid,
		
		-- Provided for easy sorting
		OrderByDummy = 1
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
		
	from (
		select
			run.dataset_id,
			ptxa.payment_id,
			b.year,
			b.statement_id,
			tax_paid = sum(
				ct.base_amount_pd
			),
			p_and_i_paid = sum(
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd
			),
			under_over_paid = sum(
				ct.underage_amount_pd + ct.overage_amount_pd
			),
			amount_paid = sum(
				ct.base_amount_pd +
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd +
				ct.overage_amount_pd - ct.underage_amount_pd
			)
		from soa_run as run with(nolock)
		join payment_transaction_assoc as ptxa with(nolock) on
			ptxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = ptxa.transaction_id
		join bill as b with(nolock) on
			b.bill_id = ct.trans_group_id and
			b.is_active = 1
		join levy_bill as lb with(nolock) on
			lb.bill_id = ct.trans_group_id
		where
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_item_year_option is 0 if 'All Years' was selected
			--     paid_item_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_item_year_option is null and therefore >= will select no rows
			b.year >= run.paid_item_year_option
		group by
			run.dataset_id,
			ptxa.payment_id,
			b.year,
			b.statement_id
	) as derivedTable
	join payment as pay with(nolock) on
		pay.payment_id = derivedTable.payment_id
	
	----------------------
	-- END:  Levy Bills --
	----------------------

	union all
	
	------------------------------------------------
	-- BEGIN:  Assessment Bills & Associated Fees --
	------------------------------------------------

	select
	
		derivedTable.dataset_id,

		-- Callout G:a
		item_desc = derivedTable.assessment_description,
		
		-- Callout G:b
		derivedTable.year,

		-- Callout G:c
		derivedTable.statement_id,
		
		-- Callout G:d
		tax_paid = derivedTable.tax_paid + isnull(assocFees.tax_paid, 0),
		
		-- Callout G:e
		p_and_i_paid = derivedTable.p_and_i_paid + isnull(assocFees.p_and_i_paid, 0),
		
		-- Callout G:f
		under_over_paid = derivedTable.under_over_paid + isnull(assocFees.under_over_paid, 0),

		-- Callout G:g
		pay.post_date,
		
		-- Callout G:h
		amount_paid = derivedTable.amount_paid + isnull(assocFees.amount_paid, 0),
		
		-- Provided for easy sorting
		OrderByDummy = 2
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
		
	from (
		select
			run.dataset_id,
			ptxa.payment_id,
			b.year,
			b.statement_id,
			saa.assessment_description,
			tax_paid = sum(
				ct.base_amount_pd
			),
			p_and_i_paid = sum(
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd
			),
			under_over_paid = sum(
				ct.underage_amount_pd + ct.overage_amount_pd
			),
			amount_paid = sum(
				ct.base_amount_pd +
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd +
				ct.overage_amount_pd - ct.underage_amount_pd
			)
		from soa_run as run with(nolock)
		join payment_transaction_assoc as ptxa with(nolock) on
			ptxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = ptxa.transaction_id
		join bill as b with(nolock) on
			b.bill_id = ct.trans_group_id and
			b.is_active = 1
		join assessment_bill as ab with(nolock) on
			ab.bill_id = ct.trans_group_id
		join special_assessment_agency as saa with(nolock) on
			saa.agency_id = ab.agency_id
		where
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_item_year_option is 0 if 'All Years' was selected
			--     paid_item_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_item_year_option is null and therefore >= will select no rows
			b.year >= run.paid_item_year_option
		group by
			run.dataset_id,
			ptxa.payment_id,
			b.year,
			b.statement_id,
			saa.assessment_description
	) as derivedTable
	left outer join (
		select
			ptxa.payment_id,
			f.year,
			f.statement_id,
			saa.assessment_description,
			tax_paid = sum(
				ct.base_amount_pd
			),
			p_and_i_paid = sum(
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd
			),
			under_over_paid = sum(
				ct.underage_amount_pd + ct.overage_amount_pd
			),
			amount_paid = sum(
				ct.base_amount_pd +
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd +
				ct.overage_amount_pd - ct.underage_amount_pd
			)
		from fee as f with(nolock)
		join bill_fee_assoc as bfa with(nolock) on
			bfa.fee_id = f.fee_id
		join bill as b with(nolock) on
			b.bill_id = bfa.bill_id
		join assessment_bill as ab with(nolock) on
			ab.bill_id = b.bill_id
		join payment_transaction_assoc as ptxa with(nolock) on
			ptxa.prop_id = b.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = ptxa.transaction_id and
			ct.trans_group_id = f.fee_id
		join special_assessment_agency as saa with(nolock) on
			saa.agency_id = ab.agency_id
		where f.is_active = 1
		group by
			ptxa.payment_id,
			f.year,
			f.statement_id,
			saa.assessment_description
	) as assocFees on
		assocFees.payment_id = derivedTable.payment_id and
		assocFees.year = derivedTable.year and
		assocFees.statement_id = derivedTable.statement_id and
		assocFees.assessment_description = derivedTable.assessment_description
	join payment as pay with(nolock) on
		pay.payment_id = derivedTable.payment_id

	----------------------------------------------
	-- END:  Assessment Bills & Associated Fees --
	----------------------------------------------

	union all
	
	------------------------------------------------------------------
	-- BEGIN:  Fees associated to neither levy nor assessment bills --
	------------------------------------------------------------------

	select
	
		derivedTable.dataset_id,

		-- Callout G:a
		item_desc = 'Fees',
		
		-- Callout G:b
		derivedTable.year,

		-- Callout G:c
		derivedTable.statement_id,
		
		-- Callout G:d
		tax_paid = derivedTable.tax_paid,
		
		-- Callout G:e
		p_and_i_paid = derivedTable.p_and_i_paid,
		
		-- Callout G:f
		under_over_paid = derivedTable.under_over_paid,

		-- Callout G:g
		pay.post_date,
		
		-- Callout G:h
		amount_paid = derivedTable.amount_paid,
		
		-- Provided for easy sorting
		OrderByDummy = 3
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc

	from (
		select
			run.dataset_id,
			ptxa.payment_id,
			f.year,
			f.statement_id,
			tax_paid = sum(
				ct.base_amount_pd
			),
			p_and_i_paid = sum(
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd
			),
			under_over_paid = sum(
				ct.underage_amount_pd + ct.overage_amount_pd
			),
			amount_paid = sum(
				ct.base_amount_pd +
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd +
				ct.overage_amount_pd - ct.underage_amount_pd
			)
		from soa_run as run with(nolock)
		join payment_transaction_assoc as ptxa with(nolock) on
			ptxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = ptxa.transaction_id
		join fee as f with(nolock) on
			f.fee_id = ct.trans_group_id and
			f.is_active = 1
		where not exists (
			select *
			from bill_fee_assoc as bfa with(nolock)
			where bfa.fee_id = f.fee_id
		) and
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_item_year_option is 0 if 'All Years' was selected
			--     paid_item_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_item_year_option is null and therefore >= will select no rows
			f.year >= run.paid_item_year_option
		group by
			run.dataset_id,
			ptxa.payment_id,
			f.year,
			f.statement_id
	) as derivedTable
	join payment as pay with(nolock) on
		pay.payment_id = derivedTable.payment_id
		
	----------------------------------------------------------------
	-- END:  Fees associated to neither levy nor assessment bills --
	----------------------------------------------------------------

	union all

	----------------------------------------
	-- BEGIN:  Fees associated to levy bills
	----------------------------------------

	select

		derivedTable.dataset_id,

		-- Callout G:a
		item_desc = ft.fee_type_desc,
		
		-- Callout G:b
		derivedTable.year,

		-- Callout G:c
		derivedTable.statement_id,
		
		-- Callout G:d
		tax_paid = derivedTable.tax_paid,
		
		-- Callout G:e
		p_and_i_paid = derivedTable.p_and_i_paid,
		
		-- Callout G:f
		under_over_paid = derivedTable.under_over_paid,

		-- Callout G:g
		pay.post_date,
		
		-- Callout G:h
		amount_paid = derivedTable.amount_paid,
		
		-- Provided for easy sorting
		OrderByDummy = 4
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc

	from (
		select
			run.dataset_id,
			ptxa.payment_id,
			f.year,
			f.statement_id,
			f.fee_type_cd,
			tax_paid = sum(
				ct.base_amount_pd
			),
			p_and_i_paid = sum(
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd
			),
			under_over_paid = sum(
				ct.underage_amount_pd + ct.overage_amount_pd
			),
			amount_paid = sum(
				ct.base_amount_pd +
				ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd +
				ct.overage_amount_pd - ct.underage_amount_pd
			)
		from soa_run as run with(nolock)
		join payment_transaction_assoc as ptxa with(nolock) on
			ptxa.prop_id = run.prop_id
		join coll_transaction as ct with(nolock) on
			ct.transaction_id = ptxa.transaction_id
		join fee as f with(nolock) on
			f.fee_id = ct.trans_group_id and
			f.is_active = 1
		join bill_fee_assoc as bfa with(nolock) on
			bfa.fee_id = ct.trans_group_id
		join levy_bill as lb with(nolock) on
			lb.bill_id = bfa.bill_id
		where
			-- When 'Include Paid Bill Summary' is checked:
			--     paid_item_year_option is 0 if 'All Years' was selected
			--     paid_item_year_option is the max property year if 'Current Tax Year Only' was selected
			-- Otherwise paid_item_year_option is null and therefore >= will select no rows
			f.year >= run.paid_item_year_option
		group by
			run.dataset_id,
			ptxa.payment_id,
			f.year,
			f.statement_id,
			f.fee_type_cd
	) as derivedTable
	join payment as pay with(nolock) on
		pay.payment_id = derivedTable.payment_id
	join fee_type as ft with(nolock) on
		ft.fee_type_cd = derivedTable.fee_type_cd

	--------------------------------------
	-- END:  Fees associated to levy bills
	--------------------------------------

GO

