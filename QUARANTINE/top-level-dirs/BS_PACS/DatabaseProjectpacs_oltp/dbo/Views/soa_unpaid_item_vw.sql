
create view soa_unpaid_item_vw
as

	-- The callouts on the SRD mockup were removed with Cynthia's changes.
	-- Therefore, the report column to view column relation is described
	-- below not with the standard callout notation i.e. I:a, but rather,
	-- with the report column heading text.
	
	------------------------
	-- BEGIN:  Levy Bills --
	------------------------

	select
	
		run.dataset_id,
		
		-- "Type" column heading
		item_desc = 'Property Taxes',
		
		-- "Year" column heading
		b.year,
		
		-- "Statement ID" column heading
		b.statement_id,
		
		-- "Levy Rate" column heading
		levy_rate = sum(levy.levy_rate),
		
		-- "Bill Type" column heading
		item_type = b.bill_type,
		
		-- "Base Due" column heading
		base_amount = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h2.base_amount, 0)
		),
		
		-- "Pen/Int" column heading
		p_and_i_amount = sum(
			isnull(tdcsummary_h1.p_and_i_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
		),
		
		-- "1st Half/Next Due" column heading
		h1_next_due = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0)
		),
		
		-- "Full Amt Due" column heading
		full_amt_due = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0) +
			isnull(tdcsummary_h2.base_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
		),
		
		-- Provided for easy sorting
		OrderByDummy = 1
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
		
	from soa_run as run with(nolock)
	join tax_due_calc_bill as tdc with(nolock) on
		tdc.dataset_id = run.bill_dataset_id and
		tdc.current_amount_due > tdc.amount_paid
	left outer join (
		select
			tdcpd.dataset_id,
			tdcpd.bill_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_bill_payments_due as tdcpd with(nolock)
		where tdcpd.is_h1_payment = 1
		group by
			tdcpd.dataset_id,
			tdcpd.bill_id
	) as tdcsummary_h1 on
		tdcsummary_h1.dataset_id = tdc.dataset_id and
		tdcsummary_h1.bill_id = tdc.bill_id
	left outer join (
		select
			tdcpd.dataset_id,
			tdcpd.bill_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_bill_payments_due as tdcpd with(nolock)
		where tdcpd.is_h1_payment = 0
		group by
			tdcpd.dataset_id,
			tdcpd.bill_id
	) as tdcsummary_h2 on
		tdcsummary_h2.dataset_id = tdc.dataset_id and
		tdcsummary_h2.bill_id = tdc.bill_id
	join bill as b with(nolock) on
		b.bill_id = tdc.bill_id and
		b.is_active = 1
	join levy_bill as lb with(nolock) on
		lb.bill_id = tdc.bill_id
	join levy with(nolock) on
		levy.year = lb.year and
		levy.tax_district_id = lb.tax_district_id and
		levy.levy_cd = lb.levy_cd
	group by
		run.dataset_id,
		b.year,
		b.statement_id,
		b.bill_type

	----------------------
	-- END:  Levy Bills --
	----------------------

	union all
	
	------------------------------------------------
	-- BEGIN:  Assessment Bills & Associated Fees --
	------------------------------------------------

	select
	
		assessmentBills.dataset_id,
			
		-- "Type" column heading
		assessmentBills.item_desc,
		
		-- "Year" column heading
		assessmentBills.year,
		
		-- "Statement ID" column heading
		assessmentBills.statement_id,
		
		-- "Levy Rate" column heading
		assessmentBills.levy_rate,
		
		-- "Bill Type" column heading
		assessmentBills.item_type,
		
		-- "Base Due" column heading
		base_amount = assessmentBills.base_amount + isnull(assocFees.base_amount, 0),
		
		-- "Pen/Int" column heading
		p_and_i_amount = assessmentBills.p_and_i_amount + isnull(assocFees.p_and_i_amount, 0),
		
		-- "1st Half/Next Due" column heading
		h1_next_due = assessmentBills.h1_next_due + isnull(assocFees.h1_next_due, 0),
		
		-- "Full Amt Due" column heading
		full_amt_due = assessmentBills.full_amt_due + isnull(assocFees.full_amt_due, 0),
		
		-- Provided for easy sorting
		OrderByDummy = 2
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
	
	from (
		select

			run.dataset_id,
				
			-- "Type" column heading
			item_desc = saa.assessment_description,
			
			-- "Year" column heading
			b.year,
			
			-- "Statement ID" column heading
			b.statement_id,
			
			-- "Levy Rate" column heading
			levy_rate = convert(numeric(13,10), null),
			
			-- "Bill Type" column heading
			item_type = b.bill_type,
			
			-- "Base Due" column heading
			base_amount = sum(
				isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h2.base_amount, 0)
			),
			
			-- "Pen/Int" column heading
			p_and_i_amount = sum(
				isnull(tdcsummary_h1.p_and_i_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
			),
			
			-- "1st Half/Next Due" column heading
			h1_next_due = sum(
				isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0)
			),
			
			-- "Full Amt Due" column heading
			full_amt_due = sum(
				isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0) +
				isnull(tdcsummary_h2.base_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
			)
						
		from soa_run as run with(nolock)
		join tax_due_calc_bill as tdc with(nolock) on
			tdc.dataset_id = run.bill_dataset_id and
			tdc.current_amount_due > tdc.amount_paid
		left outer join (
			select
				tdcpd.dataset_id,
				tdcpd.bill_id,
				base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
				p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
			from tax_due_calc_bill_payments_due as tdcpd with(nolock)
			where tdcpd.is_h1_payment = 1
			group by
				tdcpd.dataset_id,
				tdcpd.bill_id
		) as tdcsummary_h1 on
			tdcsummary_h1.dataset_id = tdc.dataset_id and
			tdcsummary_h1.bill_id = tdc.bill_id
		left outer join (
			select
				tdcpd.dataset_id,
				tdcpd.bill_id,
				base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
				p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
			from tax_due_calc_bill_payments_due as tdcpd with(nolock)
			where tdcpd.is_h1_payment = 0
			group by
				tdcpd.dataset_id,
				tdcpd.bill_id
		) as tdcsummary_h2 on
			tdcsummary_h2.dataset_id = tdc.dataset_id and
			tdcsummary_h2.bill_id = tdc.bill_id
		join bill as b with(nolock) on
			b.bill_id = tdc.bill_id and
			b.is_active = 1
		join assessment_bill as ab with(nolock) on
			ab.bill_id = tdc.bill_id
		join special_assessment_agency as saa with(nolock) on
			saa.agency_id = ab.agency_id
		group by
			run.dataset_id,
			saa.assessment_description,
			b.year,
			b.statement_id,
			b.bill_type
	) as assessmentBills
	left outer join (
		select

			run.dataset_id,
				
			-- "Type" column heading
			item_desc = saa.assessment_description,
			
			-- "Year" column heading
			f.year,
			
			-- "Statement ID" column heading
			f.statement_id,
			
			-- "Base Due" column heading
			base_amount = sum(
				isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h2.base_amount, 0)
			),
			
			-- "Pen/Int" column heading
			p_and_i_amount = sum(
				isnull(tdcsummary_h1.p_and_i_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
			),
			
			-- "1st Half/Next Due" column heading
			h1_next_due = sum(
				isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0)
			),
			
			-- "Full Amt Due" column heading
			full_amt_due = sum(
				isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0) +
				isnull(tdcsummary_h2.base_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
			)
						
		from soa_run as run with(nolock)
		join tax_due_calc_fee as tdc with(nolock) on
			tdc.dataset_id = run.fee_dataset_id and
			tdc.current_amount_due > tdc.amount_paid
		left outer join (
			select
				tdcpd.dataset_id,
				tdcpd.fee_id,
				base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
				p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
			from tax_due_calc_fee_payments_due as tdcpd with(nolock)
			where tdcpd.is_h1_payment = 1
			group by
				tdcpd.dataset_id,
				tdcpd.fee_id
		) as tdcsummary_h1 on
			tdcsummary_h1.dataset_id = tdc.dataset_id and
			tdcsummary_h1.fee_id = tdc.fee_id
		left outer join (
			select
				tdcpd.dataset_id,
				tdcpd.fee_id,
				base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
				p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
			from tax_due_calc_fee_payments_due as tdcpd with(nolock)
			where tdcpd.is_h1_payment = 0
			group by
				tdcpd.dataset_id,
				tdcpd.fee_id
		) as tdcsummary_h2 on
			tdcsummary_h2.dataset_id = tdc.dataset_id and
			tdcsummary_h2.fee_id = tdc.fee_id
		join fee as f with(nolock) on
			f.fee_id = tdc.fee_id and
			f.is_active = 1
		join bill_fee_assoc as bfa with(nolock) on
			bfa.fee_id = tdc.fee_id
		join assessment_bill as ab with(nolock) on
			ab.bill_id = bfa.bill_id
		join special_assessment_agency as saa with(nolock) on
			saa.agency_id = ab.agency_id
		group by
			run.dataset_id,
			saa.assessment_description,
			f.year,
			f.statement_id
	) as assocFees on
		assocFees.dataset_id = assessmentBills.dataset_id and
		assocFees.item_desc = assessmentBills.item_desc and
		assocFees.year = assessmentBills.year and
		assocFees.statement_id = assessmentBills.statement_id
	
	----------------------------------------------
	-- END:  Assessment Bills & Associated Fees --
	----------------------------------------------

	union all
	
	------------------------------------------------------------------
	-- BEGIN:  Fees associated to neither levy nor assessment bills --
	------------------------------------------------------------------

	select
	
		run.dataset_id,
		
		-- "Type" column heading
		item_desc = 'Fees',
		
		-- "Year" column heading
		f.year,
		
		-- "Statement ID" column heading
		f.statement_id,
		
		-- "Levy Rate" column heading
		levy_rate = convert(numeric(13,10), null),
		
		-- "Bill Type" column heading
		item_type = null,
		
		-- "Base Due" column heading
		base_amount = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h2.base_amount, 0)
		),
		
		-- "Pen/Int" column heading
		p_and_i_amount = sum(
			isnull(tdcsummary_h1.p_and_i_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
		),
		
		-- "1st Half/Next Due" column heading
		h1_next_due = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0)
		),
		
		-- "Full Amt Due" column heading
		full_amt_due = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0) +
			isnull(tdcsummary_h2.base_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
		),
		
		-- Provided for easy sorting
		OrderByDummy = 3
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
		
	from soa_run as run with(nolock)
	join tax_due_calc_fee as tdc with(nolock) on
		tdc.dataset_id = run.fee_dataset_id and
		tdc.current_amount_due > tdc.amount_paid
	left outer join (
		select
			tdcpd.dataset_id,
			tdcpd.fee_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_fee_payments_due as tdcpd with(nolock)
		where tdcpd.is_h1_payment = 1
		group by
			tdcpd.dataset_id,
			tdcpd.fee_id
	) as tdcsummary_h1 on
		tdcsummary_h1.dataset_id = tdc.dataset_id and
		tdcsummary_h1.fee_id = tdc.fee_id
	left outer join (
		select
			tdcpd.dataset_id,
			tdcpd.fee_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_fee_payments_due as tdcpd with(nolock)
		where tdcpd.is_h1_payment = 0
		group by
			tdcpd.dataset_id,
			tdcpd.fee_id
	) as tdcsummary_h2 on
		tdcsummary_h2.dataset_id = tdc.dataset_id and
		tdcsummary_h2.fee_id = tdc.fee_id
	join fee as f with(nolock) on
		f.fee_id = tdc.fee_id and
		f.is_active = 1
	where not exists (
		select *
		from bill_fee_assoc as bfa with(nolock)
		where bfa.fee_id = f.fee_id
	)
	group by
		run.dataset_id,
		f.year,
		f.statement_id
		
	----------------------------------------------------------------
	-- END:  Fees associated to neither levy nor assessment bills --
	----------------------------------------------------------------

	union all

	----------------------------------------
	-- BEGIN:  Fees associated to levy bills
	----------------------------------------

	select
	
		run.dataset_id,
		
		-- "Type" column heading
		item_desc = ft.fee_type_desc,
		
		-- "Year" column heading
		f.year,
		
		-- "Statement ID" column heading
		f.statement_id,
		
		-- "Levy Rate" column heading
		levy_rate = convert(numeric(13,10), null),
		
		-- "Bill Type" column heading
		item_type = null,
		
		-- "Base Due" column heading
		base_amount = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h2.base_amount, 0)
		),
		
		-- "Pen/Int" column heading
		p_and_i_amount = sum(
			isnull(tdcsummary_h1.p_and_i_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
		),
		
		-- "1st Half/Next Due" column heading
		h1_next_due = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0)
		),
		
		-- "Full Amt Due" column heading
		full_amt_due = sum(
			isnull(tdcsummary_h1.base_amount, 0) + isnull(tdcsummary_h1.p_and_i_amount, 0) +
			isnull(tdcsummary_h2.base_amount, 0) + isnull(tdcsummary_h2.p_and_i_amount, 0)
		),
		
		-- Provided for easy sorting
		OrderByDummy = 4
		-- View consumer (Crystal Report) should:  order by year asc, OrderByDummy asc
		
	from soa_run as run with(nolock)
	join tax_due_calc_fee as tdc with(nolock) on
		tdc.dataset_id = run.fee_dataset_id and
		tdc.current_amount_due > tdc.amount_paid
	left outer join (
		select
			tdcpd.dataset_id,
			tdcpd.fee_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_fee_payments_due as tdcpd with(nolock)
		where tdcpd.is_h1_payment = 1
		group by
			tdcpd.dataset_id,
			tdcpd.fee_id
	) as tdcsummary_h1 on
		tdcsummary_h1.dataset_id = tdc.dataset_id and
		tdcsummary_h1.fee_id = tdc.fee_id
	left outer join (
		select
			tdcpd.dataset_id,
			tdcpd.fee_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_fee_payments_due as tdcpd with(nolock)
		where tdcpd.is_h1_payment = 0
		group by
			tdcpd.dataset_id,
			tdcpd.fee_id
	) as tdcsummary_h2 on
		tdcsummary_h2.dataset_id = tdc.dataset_id and
		tdcsummary_h2.fee_id = tdc.fee_id
	join fee as f with(nolock) on
		f.fee_id = tdc.fee_id and
		f.is_active = 1
	join fee_type as ft with(nolock) on
		ft.fee_type_cd = f.fee_type_cd
	join bill_fee_assoc as bfa with(nolock) on
		bfa.fee_id = f.fee_id
	join levy_bill as lb with(nolock) on
		lb.bill_id = bfa.bill_id
	group by
		run.dataset_id,
		ft.fee_type_desc,
		f.year,
		f.statement_id

	--------------------------------------
	-- END:  Fees associated to levy bills
	--------------------------------------

GO

