
create view soa_credit_due_vw
as

	------------------------
	-- BEGIN:  Levy Bills --
	------------------------

	select	
		run.dataset_id,
		item_desc = 'Property Taxes',
		b.year,
		reason = case when isnull(ba.modify_reason, '') = '' then 'None' else ba.modify_reason end,
		base_amount = sum(tdcsummary.base_amount),
		p_and_i_amount = sum(tdcsummary.p_and_i_amount),
		total_amount = sum(tdcsummary.base_amount + tdcsummary.p_and_i_amount),
		
		-- sort/order fields
		SubSectionOrder = 1,
		OrderByDummy = 1,
		SubSection = 'ADJ'
		
	from soa_run run with(nolock)

	join tax_due_calc_bill tdc with(nolock) 
	on tdc.dataset_id = run.bill_dataset_id
	and tdc.amount_paid > tdc.current_amount_due

	join (
		select tdcpd.dataset_id, tdcpd.bill_id,
			base_amount = -sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = -sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_bill_payments_due tdcpd with(nolock)
		group by tdcpd.dataset_id, tdcpd.bill_id
	) as tdcsummary 
	on tdcsummary.dataset_id = tdc.dataset_id
	and tdcsummary.bill_id = tdc.bill_id

	join bill b with(nolock)
	on b.bill_id = tdc.bill_id

	join levy_bill lb with(nolock)
	on lb.bill_id = b.bill_id

	join trans_group tg with(nolock)
	on tg.trans_group_id = tdc.bill_id

	left join bill_adjustment ba with(nolock)
	on ba.transaction_id = tg.mrtransid_adj
	
	group by run.dataset_id, b.year, ba.modify_reason

	----------------------
	-- END:  Levy Bills --
	----------------------

	union all
	
	------------------------------------------------
	-- BEGIN:  Assessment Bills & Associated Fees --
	------------------------------------------------

	select
		assessmentBills.dataset_id,
		assessmentBills.item_desc,
		assessmentBills.year,
		reason = case when isnull(assessmentBills.reason, '') = '' then 'None' else assessmentBills.reason end,
		base_amount = assessmentBills.base_amount + isnull(assocFees.base_amount, 0),
		p_and_i_amount = assessmentBills.p_and_i_amount + isnull(assocFees.p_and_i_amount, 0),
		total_amount = assessmentBills.total_amount + isnull(assocFees.total_amount, 0),
		
		-- sort/order fields
		SubSectionOrder = 1,
		OrderByDummy = 2,
		SubSection = 'ADJ'
	
	from (
		-- assessment bills
		select
			run.dataset_id,
			item_desc = saa.assessment_description,
			tdc.year,
			reason = badj.modify_reason,
			base_amount = -sum(tdcsummary.base_amount),
			p_and_i_amount = -sum(tdcsummary.p_and_i_amount),
			total_amount = -sum(tdcsummary.base_amount + tdcsummary.p_and_i_amount)
			
		from soa_run run with(nolock)

		join tax_due_calc_bill tdc with(nolock) 
		on tdc.dataset_id = run.bill_dataset_id
		and tdc.amount_paid > tdc.current_amount_due
		
		join (
			select
				tdcpd.dataset_id, tdcpd.bill_id,
				base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
				p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
			
			from tax_due_calc_bill_payments_due tdcpd with(nolock)
			group by tdcpd.dataset_id, tdcpd.bill_id
		) as tdcsummary
		on tdcsummary.dataset_id = tdc.dataset_id
		and tdcsummary.bill_id = tdc.bill_id
		
		join assessment_bill ab with(nolock)
		on ab.bill_id = tdc.bill_id
		
		join special_assessment_agency saa with(nolock)
		on saa.agency_id = ab.agency_id
		
		join trans_group tg with(nolock)
		on tg.trans_group_id = tdc.bill_id
		
		left outer join bill_adjustment badj with(nolock)
		on badj.bill_id = tdc.bill_id
		and badj.transaction_id = tg.mrtransid_adj
		
		group by run.dataset_id, saa.assessment_description, tdc.year, badj.modify_reason
	) as assessmentBills

	left outer join (
		-- associated fees
		select
			run.dataset_id,
			item_desc = saa.assessment_description,
			f.year,
			base_amount = -sum(tdcsummary.base_amount),
			p_and_i_amount = -sum(tdcsummary.p_and_i_amount),
			total_amount = -sum(tdcsummary.base_amount + tdcsummary.p_and_i_amount)
			
		from soa_run as run with(nolock)

		join tax_due_calc_fee tdc with(nolock)
		on tdc.dataset_id = run.fee_dataset_id
		and tdc.amount_paid > tdc.current_amount_due
		
		join (
			select
				tdcpd.dataset_id, tdcpd.fee_id,
				base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
				p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
			
			from tax_due_calc_fee_payments_due as tdcpd with(nolock)
			
			group by tdcpd.dataset_id, tdcpd.fee_id
		) as tdcsummary
		on tdcsummary.dataset_id = tdc.dataset_id 
		and tdcsummary.fee_id = tdc.fee_id
		
		join fee f with(nolock)
		on f.fee_id = tdc.fee_id
		and f.is_active = 1
		
		join bill_fee_assoc bfa with(nolock)
		on bfa.fee_id = tdc.fee_id
		
		join assessment_bill ab with(nolock)
		on ab.bill_id = bfa.bill_id
		
		join special_assessment_agency saa with(nolock)
		on saa.agency_id = ab.agency_id

		group by run.dataset_id, saa.assessment_description, f.year
	) as assocFees
	on assocFees.dataset_id = assessmentBills.dataset_id
	and assocFees.item_desc = assessmentBills.item_desc
	and assocFees.year = assessmentBills.year
	
	----------------------------------------------
	-- END:  Assessment Bills & Associated Fees --
	----------------------------------------------

	union all
	
	------------------------------------------------------------------
	-- BEGIN:  Fees associated to neither levy nor assessment bills --
	------------------------------------------------------------------

	select
		run.dataset_id,
		item_desc = 'Fees',
		f.year,
		reason = case when isnull(fadj.modify_reason, '') = '' then 'None' else fadj.modify_reason end,
		base_amount = sum(tdcsummary.base_amount * -1.0),
		p_and_i_amount = sum(tdcsummary.p_and_i_amount * -1.0),
		total_amount = sum((tdcsummary.base_amount + tdcsummary.p_and_i_amount) * -1.0),
		
		-- sort/order fields
		SubSectionOrder = 1,
		OrderByDummy = 3,
		SubSection = 'ADJ'
		
	from soa_run run with(nolock)

	join tax_due_calc_fee tdc with(nolock) 
	on tdc.dataset_id = run.fee_dataset_id
	and tdc.amount_paid > tdc.current_amount_due
	
	join (
		select
			tdcpd.dataset_id, tdcpd.fee_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_fee_payments_due as tdcpd with(nolock)
		group by tdcpd.dataset_id, tdcpd.fee_id
	) as tdcsummary 
	on tdcsummary.dataset_id = tdc.dataset_id
	and tdcsummary.fee_id = tdc.fee_id
	
	join fee f with(nolock)
	on f.fee_id = tdc.fee_id
	and f.is_active = 1
	
	join trans_group tg with(nolock)
	on tg.trans_group_id = f.fee_id

	left join fee_adjustment fadj
	on fadj.transaction_id = tg.mrtransid_adj

	where not exists (
		select 1
		from bill_fee_assoc bfa with(nolock)
		where bfa.fee_id = f.fee_id
	)

	group by run.dataset_id, f.year, fadj.modify_reason

	----------------------------------------------------------------
	-- END:  Fees associated to neither levy nor assessment bills --
	----------------------------------------------------------------

	union all

	----------------------------------------
	-- BEGIN:  Fees associated to levy bills
	----------------------------------------

	select
		run.dataset_id,
		item_desc = ft.fee_type_desc,
		f.year,
		reason = case when isnull(fadj.modify_reason, '') = '' then 'None' else fadj.modify_reason end,
		base_amount = sum(tdcsummary.base_amount * -1.0),
		p_and_i_amount = sum(tdcsummary.p_and_i_amount * -1.0),
		total_amount = sum((tdcsummary.base_amount + tdcsummary.p_and_i_amount) * -1.0),
		
		-- sort/order fields
		SubSectionOrder = 1,
		OrderByDummy = 4,
		SubSection = 'ADJ'
		
	from soa_run run with(nolock)

	join tax_due_calc_fee tdc with(nolock)
	on tdc.dataset_id = run.fee_dataset_id
	and tdc.amount_paid > tdc.current_amount_due
	
	join (
		select
			tdcpd.dataset_id, tdcpd.fee_id,
			base_amount = sum(tdcpd.amount_due - tdcpd.amount_paid),
			p_and_i_amount = sum(tdcpd.amt_penalty + tdcpd.amt_interest + tdcpd.amt_bond_interest)
		from tax_due_calc_fee_payments_due tdcpd with(nolock)
		group by tdcpd.dataset_id, tdcpd.fee_id
	) as tdcsummary
	on tdcsummary.dataset_id = tdc.dataset_id
	and tdcsummary.fee_id = tdc.fee_id
	
	join fee f with(nolock)
	on f.fee_id = tdc.fee_id
	and f.is_active = 1
	
	join fee_type ft with(nolock)
	on ft.fee_type_cd = f.fee_type_cd

	join bill_fee_assoc bfa with(nolock)
	on bfa.fee_id = f.fee_id
	
	join levy_bill lb with(nolock)
	on lb.bill_id = bfa.bill_id
	
	join trans_group tg with(nolock)
	on tg.trans_group_id = f.fee_id

	left join fee_adjustment fadj with(nolock)
	on fadj.transaction_id = tg.mrtransid_adj	

	group by run.dataset_id, ft.fee_type_desc, f.year, fadj.modify_reason

	--------------------------------------
	-- END:  Fees associated to levy bills
	--------------------------------------

	union all
	
	---------------------------------
	-- BEGIN:  Overpayment Credits --
	---------------------------------

	select
		run.dataset_id,
		item_desc = 'Overpayment Credit',
		year = convert(numeric(4,0), null),
		reason = case when isnull(opc.description, '') = '' then 'None' else opc.description end,
		base_amount = null,
		p_and_i_amount = null,
		total_amount = -tdc.amount_base,
		
		-- sort/order fields
		SubSectionOrder = 2,
		OrderByDummy = 1,
		SubSection = 'OPC'

	from soa_run as run with(nolock)
	join tax_due_calc_overpayment_credit as tdc with(nolock) on
		tdc.dataset_id = run.overpayment_credit_dataset_id and
		tdc.amount_paid < 0
	join overpayment_credit as opc with(nolock) on
		opc.overpmt_credit_id = tdc.overpmt_credit_id

	-------------------------------
	-- END:  Overpayment Credits --
	-------------------------------

	union all
	
	---------------------
	-- BEGIN:  Escrows --
	---------------------

	select
		run.dataset_id,
		item_desc = 'Escrow',
		e.year,
		reason = case when isnull(e.comment, '') = '' then 'None' else e.comment end,
		base_amount = null,
		p_and_i_amount = null,
		total_amount = e.amount_paid,
		
		-- sort/order fields
		SubSectionOrder = 3,
		OrderByDummy = 1,
		SubSection = 'ESC'

	from soa_run run with(nolock)

	join escrow e with(nolock) 
	on e.prop_id = run.prop_id	
	and e.amount_paid > 0
	and e.amount_paid = e.amount_due
	and e.amount_applied = 0
		
	-------------------
	-- END:  Escrows --
	-------------------

GO

