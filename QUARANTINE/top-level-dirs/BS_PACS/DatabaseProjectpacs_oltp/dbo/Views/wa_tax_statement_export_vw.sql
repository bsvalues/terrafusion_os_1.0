
create view wa_tax_statement_export_vw
as

select
	wts.year,
	wts.group_id,
	wts.run_id,
	wts.statement_id,
	
	wtssa.office_name,
	payment_type = case
		when wtsr.type = 'D' then 'Delinquent'
		when wtsr.first_half_payment = 1 then '1st'
		else '2nd'
	end,
	statement_type = case
		when wtsg.include_property_taxes = 1 and wtsg.include_assessments = 1
		then 'Tax And Assessment'
		when wtsg.include_property_taxes = 1
		then 'Tax'
		else 'Assessment'
	end,
	wts.property_type_desc,
	wtssa.property_tax_questions_phone,
	wtssa.internet_address,
	wtssa.property_value_questions_phone,
	wtssa.treasurer_name,
	convert(varchar(20), wtssa.county_name) as county_name,
	wtssa.addr_line1,
	wtssa.addr_line2,
	wtssa.addr_line3,
	wtssa.addr_city,
	wtssa.addr_state,
	wtssa.addr_zip,
	wtssa.office_hours_line1,
	wtssa.office_hours_line2,
	wtssa.office_hours_line3,
	wts.prop_id,
	owner_name = left(wts.owner_name, 33),
	care_of_name = left(wts.care_of_name, 33),
	owner_addr_line1 = left(wts.owner_addr_line1, 33),
	owner_addr_line2 = left(wts.owner_addr_line2, 33),
	owner_addr_line3 = left(wts.owner_addr_line3, 33),
	mailing_csz = left(wts.owner_addr_city + ', ' + wts.owner_addr_state + ' ' + wts.owner_addr_zip, 33),
	situs_address = left(case
		when charindex(char(13) + char(10), wts.situs_display) > 0
		then
			substring(wts.situs_display, 1, charindex(char(13) + char(10), wts.situs_display) - 1)
		else ''
	end, 33),
	situs_csz = left(case
		when charindex(char(13) + char(10), wts.situs_display) > 0
		then
			substring(
					wts.situs_display,
					charindex(char(13) + char(10), wts.situs_display) + 2,
					len(wts.situs_display) - charindex(char(13) + char(10), wts.situs_display) - 1
			)
		else ''
	end, 33),
	wts.owner_addr_country,
	legal_desc = left(wts.legal_desc, 100),
	tsc.message,
	tax_area_code = left(wts.tax_area_code, 6),
	wts.prior_year_taxes_paid,
	wts.prior_year_pi_paid,
	wts.prior_year_value,
	wts.prior_year_tax_rate,
	wts.current_year_value,
	wts.current_year_tax_rate,
	
	voted_levy_01_name = votedlevy1.tax_district_desc,
	voted_levy_01_rate = votedlevy1.levy_rate,
	voted_levy_01_tax  = votedlevy1.tax_amount,
	voted_levy_02_name = votedlevy2.tax_district_desc,
	voted_levy_02_rate = votedlevy2.levy_rate,
	voted_levy_02_tax  = votedlevy2.tax_amount,
	voted_levy_03_name = votedlevy3.tax_district_desc,
	voted_levy_03_rate = votedlevy3.levy_rate,
	voted_levy_03_tax  = votedlevy3.tax_amount,
	voted_levy_04_name = votedlevy4.tax_district_desc,
	voted_levy_04_rate = votedlevy4.levy_rate,
	voted_levy_04_tax  = votedlevy4.tax_amount,
	voted_levy_05_name = votedlevy5.tax_district_desc,
	voted_levy_05_rate = votedlevy5.levy_rate,
	voted_levy_05_tax  = votedlevy5.tax_amount,
	voted_levy_06_name = votedlevy6.tax_district_desc,
	voted_levy_06_rate = votedlevy6.levy_rate,
	voted_levy_06_tax  = votedlevy6.tax_amount,
	voted_levy_07_name = votedlevy7.tax_district_desc,
	voted_levy_07_rate = votedlevy7.levy_rate,
	voted_levy_07_tax  = votedlevy7.tax_amount,
	voted_levy_08_name = votedlevy8.tax_district_desc,
	voted_levy_08_rate = votedlevy8.levy_rate,
	voted_levy_08_tax  = votedlevy8.tax_amount,
	voted_levy_09_name = votedlevy9.tax_district_desc,
	voted_levy_09_rate = votedlevy9.levy_rate,
	voted_levy_09_tax  = votedlevy9.tax_amount,
	voted_levy_10_name = votedlevy10.tax_district_desc,
	voted_levy_10_rate = votedlevy10.levy_rate,
	voted_levy_10_tax  = votedlevy10.tax_amount,
	voted_total_levy_rate = convert(numeric(13,10), votedlevysummary.total_levy_rate),
	voted_total_tax_amount = convert(numeric(14,2), votedlevysummary.total_tax_amount),
	
	nonvoted_levy_01_name = nonvotedlevy1.tax_district_desc,
	nonvoted_levy_01_rate = nonvotedlevy1.levy_rate,
	nonvoted_levy_01_tax  = nonvotedlevy1.tax_amount,
	nonvoted_levy_02_name = nonvotedlevy2.tax_district_desc,
	nonvoted_levy_02_rate = nonvotedlevy2.levy_rate,
	nonvoted_levy_02_tax  = nonvotedlevy2.tax_amount,
	nonvoted_levy_03_name = nonvotedlevy3.tax_district_desc,
	nonvoted_levy_03_rate = nonvotedlevy3.levy_rate,
	nonvoted_levy_03_tax  = nonvotedlevy3.tax_amount,
	nonvoted_levy_04_name = nonvotedlevy4.tax_district_desc,
	nonvoted_levy_04_rate = nonvotedlevy4.levy_rate,
	nonvoted_levy_04_tax  = nonvotedlevy4.tax_amount,
	nonvoted_levy_05_name = nonvotedlevy5.tax_district_desc,
	nonvoted_levy_05_rate = nonvotedlevy5.levy_rate,
	nonvoted_levy_05_tax  = nonvotedlevy5.tax_amount,
	nonvoted_levy_06_name = nonvotedlevy6.tax_district_desc,
	nonvoted_levy_06_rate = nonvotedlevy6.levy_rate,
	nonvoted_levy_06_tax  = nonvotedlevy6.tax_amount,
	nonvoted_levy_07_name = nonvotedlevy7.tax_district_desc,
	nonvoted_levy_07_rate = nonvotedlevy7.levy_rate,
	nonvoted_levy_07_tax  = nonvotedlevy7.tax_amount,
	nonvoted_levy_08_name = nonvotedlevy8.tax_district_desc,
	nonvoted_levy_08_rate = nonvotedlevy8.levy_rate,
	nonvoted_levy_08_tax  = nonvotedlevy8.tax_amount,
	nonvoted_levy_09_name = nonvotedlevy9.tax_district_desc,
	nonvoted_levy_09_rate = nonvotedlevy9.levy_rate,
	nonvoted_levy_09_tax  = nonvotedlevy9.tax_amount,
	nonvoted_levy_10_name = nonvotedlevy10.tax_district_desc,
	nonvoted_levy_10_rate = nonvotedlevy10.levy_rate,
	nonvoted_levy_10_tax  = nonvotedlevy10.tax_amount,
	nonvoted_total_levy_rate = convert(numeric(13,10), nonvotedlevysummary.total_levy_rate),
	nonvoted_total_tax_amount = convert(numeric(14,2), nonvotedlevysummary.total_tax_amount),

	af01_desc = af1.item_desc,
	af01_amount = af1.assessment_fee_amount,
	af02_desc = af2.item_desc,
	af02_amount = af2.assessment_fee_amount,
	af03_desc = af3.item_desc,
	af03_amount = af3.assessment_fee_amount,
	af04_desc = af4.item_desc,
	af04_amount = af4.assessment_fee_amount,
	af05_desc = af5.item_desc,
	af05_amount = af5.assessment_fee_amount,
	af06_desc = af6.item_desc,
	af06_amount = af6.assessment_fee_amount,
	af07_desc = af7.item_desc,
	af07_amount = af7.assessment_fee_amount,
	af08_desc = af8.item_desc,
	af08_amount = af8.assessment_fee_amount,
	af09_desc = af9.item_desc,
	af09_amount = af9.assessment_fee_amount,
	af10_desc = af10.item_desc,
	af10_amount = af10.assessment_fee_amount,
	total_assessment_fee_amount = convert(numeric(14,2), afsummary.total_assessment_fee_amount),
	
	wts.total_taxes_assessments_fees,
	
	mortgage_company = left(wts.mortgage_company, 33),
	full_tax_due_date = wts.due_date,
	wts.full_tax_amount,
	wts.full_interest_amount,
	wts.full_penalty_amount,
	wts.full_total_due,
	half_tax_due_date = wts.due_date,
	half_tax_amount,
	wts.half_interest_amount,
	wts.half_penalty_amount,
	wts.half_total_due,
	wts.delinquent_tax_amount,
	wts.delinquent_interest_amount,
	wts.delinquent_total_due,
	total_due_if_paid_by = convert(varchar(11), wts.due_date, 100),
	barcode = convert(varchar(4), wts.year) + '-' + convert(varchar(12), wts.statement_id),
	
	delq1_year = convert(varchar(12), delq1.delinquent_year),
	delq1_base = delq1.base_amount,
	delq1_interest = delq1.interest_amount,
	delq1_penalty = delq1.penalty_amount,
	delq1_total = delq1.total,
	
	delq2_year = convert(varchar(12), delq2.delinquent_year),
	delq2_base = delq2.base_amount,
	delq2_interest = delq2.interest_amount,
	delq2_penalty = delq2.penalty_amount,
	delq2_total = delq2.total,

	delq3_year = convert(varchar(12), delq3.delinquent_year),
	delq3_base = delq3.base_amount,
	delq3_interest = delq3.interest_amount,
	delq3_penalty = delq3.penalty_amount,
	delq3_total = delq3.total,

	delq4_year = convert(varchar(12), delq4.delinquent_year) + ' & Prior',
	delq4_base = delq4.base_amount,
	delq4_interest = delq4.interest_amount,
	delq4_penalty = delq4.penalty_amount,
	delq4_total = delq4.total,

	wts.total_due,
	
	wts.mailto_name,
	wts.mailto_addr_line1,
	wts.mailto_addr_line2,
	wts.mailto_addr_line3,
	mailto_address_csz = left(wts.mailto_addr_city + ', ' + wts.mailto_addr_state + ' ' + wts.mailto_addr_zip, 90),
	
	wts.scanline,
	
	voted_history_01_name = votedhistory1.tax_district_desc,
	voted_history_01_curr_rate = votedhistory1.curr_year_levy_rate,
	voted_history_01_curr_tax = votedhistory1.curr_year_taxes,
	voted_history_01_prev_rate = votedhistory1.prior_year_levy_rate,
	voted_history_01_prev_tax = votedhistory1.prior_year_taxes,
	voted_history_01_pct_change_rate = votedhistory1.pct_change_levy_rate,
	voted_history_01_pct_change_tax = votedhistory1.pct_change_taxes,

	voted_history_02_name = votedhistory2.tax_district_desc,
	voted_history_02_curr_rate = votedhistory2.curr_year_levy_rate,
	voted_history_02_curr_tax = votedhistory2.curr_year_taxes,
	voted_history_02_prev_rate = votedhistory2.prior_year_levy_rate,
	voted_history_02_prev_tax = votedhistory2.prior_year_taxes,
	voted_history_02_pct_change_rate = votedhistory2.pct_change_levy_rate,
	voted_history_02_pct_change_tax = votedhistory2.pct_change_taxes,

	voted_history_03_name = votedhistory3.tax_district_desc,
	voted_history_03_curr_rate = votedhistory3.curr_year_levy_rate,
	voted_history_03_curr_tax = votedhistory3.curr_year_taxes,
	voted_history_03_prev_rate = votedhistory3.prior_year_levy_rate,
	voted_history_03_prev_tax = votedhistory3.prior_year_taxes,
	voted_history_03_pct_change_rate = votedhistory3.pct_change_levy_rate,
	voted_history_03_pct_change_tax = votedhistory3.pct_change_taxes,

	voted_history_04_name = votedhistory4.tax_district_desc,
	voted_history_04_curr_rate = votedhistory4.curr_year_levy_rate,
	voted_history_04_curr_tax = votedhistory4.curr_year_taxes,
	voted_history_04_prev_rate = votedhistory4.prior_year_levy_rate,
	voted_history_04_prev_tax = votedhistory4.prior_year_taxes,
	voted_history_04_pct_change_rate = votedhistory4.pct_change_levy_rate,
	voted_history_04_pct_change_tax = votedhistory4.pct_change_taxes,

	voted_history_05_name = votedhistory5.tax_district_desc,
	voted_history_05_curr_rate = votedhistory5.curr_year_levy_rate,
	voted_history_05_curr_tax = votedhistory5.curr_year_taxes,
	voted_history_05_prev_rate = votedhistory5.prior_year_levy_rate,
	voted_history_05_prev_tax = votedhistory5.prior_year_taxes,
	voted_history_05_pct_change_rate = votedhistory5.pct_change_levy_rate,
	voted_history_05_pct_change_tax = votedhistory5.pct_change_taxes,

	voted_history_06_name = votedhistory6.tax_district_desc,
	voted_history_06_curr_rate = votedhistory6.curr_year_levy_rate,
	voted_history_06_curr_tax = votedhistory6.curr_year_taxes,
	voted_history_06_prev_rate = votedhistory6.prior_year_levy_rate,
	voted_history_06_prev_tax = votedhistory6.prior_year_taxes,
	voted_history_06_pct_change_rate = votedhistory6.pct_change_levy_rate,
	voted_history_06_pct_change_tax = votedhistory6.pct_change_taxes,

	voted_history_07_name = votedhistory7.tax_district_desc,
	voted_history_07_curr_rate = votedhistory7.curr_year_levy_rate,
	voted_history_07_curr_tax = votedhistory7.curr_year_taxes,
	voted_history_07_prev_rate = votedhistory7.prior_year_levy_rate,
	voted_history_07_prev_tax = votedhistory7.prior_year_taxes,
	voted_history_07_pct_change_rate = votedhistory7.pct_change_levy_rate,
	voted_history_07_pct_change_tax = votedhistory7.pct_change_taxes,

	voted_history_08_name = votedhistory8.tax_district_desc,
	voted_history_08_curr_rate = votedhistory8.curr_year_levy_rate,
	voted_history_08_curr_tax = votedhistory8.curr_year_taxes,
	voted_history_08_prev_rate = votedhistory8.prior_year_levy_rate,
	voted_history_08_prev_tax = votedhistory8.prior_year_taxes,
	voted_history_08_pct_change_rate = votedhistory8.pct_change_levy_rate,
	voted_history_08_pct_change_tax = votedhistory8.pct_change_taxes,

	voted_history_09_name = votedhistory9.tax_district_desc,
	voted_history_09_curr_rate = votedhistory9.curr_year_levy_rate,
	voted_history_09_curr_tax = votedhistory9.curr_year_taxes,
	voted_history_09_prev_rate = votedhistory9.prior_year_levy_rate,
	voted_history_09_prev_tax = votedhistory9.prior_year_taxes,
	voted_history_09_pct_change_rate = votedhistory9.pct_change_levy_rate,
	voted_history_09_pct_change_tax = votedhistory9.pct_change_taxes,

	voted_history_10_name = votedhistory10.tax_district_desc,
	voted_history_10_curr_rate = votedhistory10.curr_year_levy_rate,
	voted_history_10_curr_tax = votedhistory10.curr_year_taxes,
	voted_history_10_prev_rate = votedhistory10.prior_year_levy_rate,
	voted_history_10_prev_tax = votedhistory10.prior_year_taxes,
	voted_history_10_pct_change_rate = votedhistory10.pct_change_levy_rate,
	voted_history_10_pct_change_tax = votedhistory10.pct_change_taxes,

	nonvoted_history_01_name = nonvotedhistory1.tax_district_desc,
	nonvoted_history_01_curr_rate = nonvotedhistory1.curr_year_levy_rate,
	nonvoted_history_01_curr_tax = nonvotedhistory1.curr_year_taxes,
	nonvoted_history_01_prev_rate = nonvotedhistory1.prior_year_levy_rate,
	nonvoted_history_01_prev_tax = nonvotedhistory1.prior_year_taxes,
	nonvoted_history_01_pct_change_rate = nonvotedhistory1.pct_change_levy_rate,
	nonvoted_history_01_pct_change_tax = nonvotedhistory1.pct_change_taxes,

	nonvoted_history_02_name = nonvotedhistory2.tax_district_desc,
	nonvoted_history_02_curr_rate = nonvotedhistory2.curr_year_levy_rate,
	nonvoted_history_02_curr_tax = nonvotedhistory2.curr_year_taxes,
	nonvoted_history_02_prev_rate = nonvotedhistory2.prior_year_levy_rate,
	nonvoted_history_02_prev_tax = nonvotedhistory2.prior_year_taxes,
	nonvoted_history_02_pct_change_rate = nonvotedhistory2.pct_change_levy_rate,
	nonvoted_history_02_pct_change_tax = nonvotedhistory2.pct_change_taxes,

	nonvoted_history_03_name = nonvotedhistory3.tax_district_desc,
	nonvoted_history_03_curr_rate = nonvotedhistory3.curr_year_levy_rate,
	nonvoted_history_03_curr_tax = nonvotedhistory3.curr_year_taxes,
	nonvoted_history_03_prev_rate = nonvotedhistory3.prior_year_levy_rate,
	nonvoted_history_03_prev_tax = nonvotedhistory3.prior_year_taxes,
	nonvoted_history_03_pct_change_rate = nonvotedhistory3.pct_change_levy_rate,
	nonvoted_history_03_pct_change_tax = nonvotedhistory3.pct_change_taxes,

	nonvoted_history_04_name = nonvotedhistory4.tax_district_desc,
	nonvoted_history_04_curr_rate = nonvotedhistory4.curr_year_levy_rate,
	nonvoted_history_04_curr_tax = nonvotedhistory4.curr_year_taxes,
	nonvoted_history_04_prev_rate = nonvotedhistory4.prior_year_levy_rate,
	nonvoted_history_04_prev_tax = nonvotedhistory4.prior_year_taxes,
	nonvoted_history_04_pct_change_rate = nonvotedhistory4.pct_change_levy_rate,
	nonvoted_history_04_pct_change_tax = nonvotedhistory4.pct_change_taxes,

	nonvoted_history_05_name = nonvotedhistory5.tax_district_desc,
	nonvoted_history_05_curr_rate = nonvotedhistory5.curr_year_levy_rate,
	nonvoted_history_05_curr_tax = nonvotedhistory5.curr_year_taxes,
	nonvoted_history_05_prev_rate = nonvotedhistory5.prior_year_levy_rate,
	nonvoted_history_05_prev_tax = nonvotedhistory5.prior_year_taxes,
	nonvoted_history_05_pct_change_rate = nonvotedhistory5.pct_change_levy_rate,
	nonvoted_history_05_pct_change_tax = nonvotedhistory5.pct_change_taxes,

	nonvoted_history_06_name = nonvotedhistory6.tax_district_desc,
	nonvoted_history_06_curr_rate = nonvotedhistory6.curr_year_levy_rate,
	nonvoted_history_06_curr_tax = nonvotedhistory6.curr_year_taxes,
	nonvoted_history_06_prev_rate = nonvotedhistory6.prior_year_levy_rate,
	nonvoted_history_06_prev_tax = nonvotedhistory6.prior_year_taxes,
	nonvoted_history_06_pct_change_rate = nonvotedhistory6.pct_change_levy_rate,
	nonvoted_history_06_pct_change_tax = nonvotedhistory6.pct_change_taxes,

	nonvoted_history_07_name = nonvotedhistory7.tax_district_desc,
	nonvoted_history_07_curr_rate = nonvotedhistory7.curr_year_levy_rate,
	nonvoted_history_07_curr_tax = nonvotedhistory7.curr_year_taxes,
	nonvoted_history_07_prev_rate = nonvotedhistory7.prior_year_levy_rate,
	nonvoted_history_07_prev_tax = nonvotedhistory7.prior_year_taxes,
	nonvoted_history_07_pct_change_rate = nonvotedhistory7.pct_change_levy_rate,
	nonvoted_history_07_pct_change_tax = nonvotedhistory7.pct_change_taxes,

	nonvoted_history_08_name = nonvotedhistory8.tax_district_desc,
	nonvoted_history_08_curr_rate = nonvotedhistory8.curr_year_levy_rate,
	nonvoted_history_08_curr_tax = nonvotedhistory8.curr_year_taxes,
	nonvoted_history_08_prev_rate = nonvotedhistory8.prior_year_levy_rate,
	nonvoted_history_08_prev_tax = nonvotedhistory8.prior_year_taxes,
	nonvoted_history_08_pct_change_rate = nonvotedhistory8.pct_change_levy_rate,
	nonvoted_history_08_pct_change_tax = nonvotedhistory8.pct_change_taxes,

	nonvoted_history_09_name = nonvotedhistory9.tax_district_desc,
	nonvoted_history_09_curr_rate = nonvotedhistory9.curr_year_levy_rate,
	nonvoted_history_09_curr_tax = nonvotedhistory9.curr_year_taxes,
	nonvoted_history_09_prev_rate = nonvotedhistory9.prior_year_levy_rate,
	nonvoted_history_09_prev_tax = nonvotedhistory9.prior_year_taxes,
	nonvoted_history_09_pct_change_rate = nonvotedhistory9.pct_change_levy_rate,
	nonvoted_history_09_pct_change_tax = nonvotedhistory9.pct_change_taxes,

	nonvoted_history_10_name = nonvotedhistory10.tax_district_desc,
	nonvoted_history_10_curr_rate = nonvotedhistory10.curr_year_levy_rate,
	nonvoted_history_10_curr_tax = nonvotedhistory10.curr_year_taxes,
	nonvoted_history_10_prev_rate = nonvotedhistory10.prior_year_levy_rate,
	nonvoted_history_10_prev_tax = nonvotedhistory10.prior_year_taxes,
	nonvoted_history_10_pct_change_rate = nonvotedhistory10.pct_change_levy_rate,
	nonvoted_history_10_pct_change_tax = nonvotedhistory10.pct_change_taxes,

	wts.comparison_voted_sum_prev_levy_rate,
	wts.comparison_voted_sum_prev_taxes,
	wts.comparison_voted_sum_curr_levy_rate,
	wts.comparison_voted_sum_curr_taxes,
	wts.comparison_voted_overall_pct_change_levy_rate,
	wts.comparison_voted_overall_pct_change_taxes,

	wts.comparison_nonvoted_sum_prev_levy_rate,
	wts.comparison_nonvoted_sum_prev_taxes,
	wts.comparison_nonvoted_sum_curr_levy_rate,
	wts.comparison_nonvoted_sum_curr_taxes,
	wts.comparison_nonvoted_overall_pct_change_levy_rate,
	wts.comparison_nonvoted_overall_pct_change_taxes,
	
	show_half_pay_line = convert(int, wts.show_half_pay_line)

from wa_tax_statement as wts with(nolock)
join wa_tax_statement_system_address as wtssa with(nolock) on
	wtssa.year = wts.year and
	wtssa.group_id = wts.group_id and
	wtssa.run_id = wts.run_id
join wa_tax_statement_run as wtsr with(nolock) on
	wtsr.year = wts.year and
	wtsr.group_id = wts.group_id and
	wtsr.run_id = wts.run_id
join wa_tax_statement_group as wtsg with(nolock) on
	wtsg.year = wts.year and
	wtsg.group_id = wts.group_id

left outer join tax_statement_config as tsc with(nolock) on
	tsc.tax_statement_cd = wts.message_cd

left outer join wa_tax_statement_levy_vw as votedlevy1 with(nolock) on
	votedlevy1.year = wts.year and
	votedlevy1.group_id = wts.group_id and
	votedlevy1.run_id = wts.run_id and
	votedlevy1.statement_id = wts.statement_id and
	votedlevy1.voted = 1 and
	votedlevy1.order_num = 1
left outer join wa_tax_statement_levy_vw as votedlevy2 with(nolock) on
	votedlevy2.year = wts.year and
	votedlevy2.group_id = wts.group_id and
	votedlevy2.run_id = wts.run_id and
	votedlevy2.statement_id = wts.statement_id and
	votedlevy2.voted = 1 and
	votedlevy2.order_num = 2
left outer join wa_tax_statement_levy_vw as votedlevy3 with(nolock) on
	votedlevy3.year = wts.year and
	votedlevy3.group_id = wts.group_id and
	votedlevy3.run_id = wts.run_id and
	votedlevy3.statement_id = wts.statement_id and
	votedlevy3.voted = 1 and
	votedlevy3.order_num = 3
left outer join wa_tax_statement_levy_vw as votedlevy4 with(nolock) on
	votedlevy4.year = wts.year and
	votedlevy4.group_id = wts.group_id and
	votedlevy4.run_id = wts.run_id and
	votedlevy4.statement_id = wts.statement_id and
	votedlevy4.voted = 1 and
	votedlevy4.order_num = 4
left outer join wa_tax_statement_levy_vw as votedlevy5 with(nolock) on
	votedlevy5.year = wts.year and
	votedlevy5.group_id = wts.group_id and
	votedlevy5.run_id = wts.run_id and
	votedlevy5.statement_id = wts.statement_id and
	votedlevy5.voted = 1 and
	votedlevy5.order_num = 5
left outer join wa_tax_statement_levy_vw as votedlevy6 with(nolock) on
	votedlevy6.year = wts.year and
	votedlevy6.group_id = wts.group_id and
	votedlevy6.run_id = wts.run_id and
	votedlevy6.statement_id = wts.statement_id and
	votedlevy6.voted = 1 and
	votedlevy6.order_num = 6
left outer join wa_tax_statement_levy_vw as votedlevy7 with(nolock) on
	votedlevy7.year = wts.year and
	votedlevy7.group_id = wts.group_id and
	votedlevy7.run_id = wts.run_id and
	votedlevy7.statement_id = wts.statement_id and
	votedlevy7.voted = 1 and
	votedlevy7.order_num = 7
left outer join wa_tax_statement_levy_vw as votedlevy8 with(nolock) on
	votedlevy8.year = wts.year and
	votedlevy8.group_id = wts.group_id and
	votedlevy8.run_id = wts.run_id and
	votedlevy8.statement_id = wts.statement_id and
	votedlevy8.voted = 1 and
	votedlevy8.order_num = 8
left outer join wa_tax_statement_levy_vw as votedlevy9 with(nolock) on
	votedlevy9.year = wts.year and
	votedlevy9.group_id = wts.group_id and
	votedlevy9.run_id = wts.run_id and
	votedlevy9.statement_id = wts.statement_id and
	votedlevy9.voted = 1 and
	votedlevy9.order_num = 9
left outer join wa_tax_statement_levy_vw as votedlevy10 with(nolock) on
	votedlevy10.year = wts.year and
	votedlevy10.group_id = wts.group_id and
	votedlevy10.run_id = wts.run_id and
	votedlevy10.statement_id = wts.statement_id and
	votedlevy10.voted = 1 and
	votedlevy10.order_num = 10
left outer join (
	select
		wtsl.year,
		wtsl.group_id,
		wtsl.run_id,
		wtsl.statement_id,
		wtsl.voted,
		total_levy_rate = sum(wtsl.levy_rate),
		total_tax_amount = sum(wtsl.tax_amount)
	from wa_tax_statement_levy as wtsl with(nolock)
	group by
		wtsl.year,
		wtsl.group_id,
		wtsl.run_id,
		wtsl.statement_id,
		wtsl.voted
) as votedlevysummary on
	votedlevysummary.year = wts.year and
	votedlevysummary.group_id = wts.group_id and
	votedlevysummary.run_id = wts.run_id and
	votedlevysummary.statement_id = wts.statement_id and
	votedlevysummary.voted = 1
left outer join wa_tax_statement_levy_vw as nonvotedlevy1 with(nolock) on
	nonvotedlevy1.year = wts.year and
	nonvotedlevy1.group_id = wts.group_id and
	nonvotedlevy1.run_id = wts.run_id and
	nonvotedlevy1.statement_id = wts.statement_id and
	nonvotedlevy1.voted = 0 and
	nonvotedlevy1.order_num = 1
left outer join wa_tax_statement_levy_vw as nonvotedlevy2 with(nolock) on
	nonvotedlevy2.year = wts.year and
	nonvotedlevy2.group_id = wts.group_id and
	nonvotedlevy2.run_id = wts.run_id and
	nonvotedlevy2.statement_id = wts.statement_id and
	nonvotedlevy2.voted = 0 and
	nonvotedlevy2.order_num = 2
left outer join wa_tax_statement_levy_vw as nonvotedlevy3 with(nolock) on
	nonvotedlevy3.year = wts.year and
	nonvotedlevy3.group_id = wts.group_id and
	nonvotedlevy3.run_id = wts.run_id and
	nonvotedlevy3.statement_id = wts.statement_id and
	nonvotedlevy3.voted = 0 and
	nonvotedlevy3.order_num = 3
left outer join wa_tax_statement_levy_vw as nonvotedlevy4 with(nolock) on
	nonvotedlevy4.year = wts.year and
	nonvotedlevy4.group_id = wts.group_id and
	nonvotedlevy4.run_id = wts.run_id and
	nonvotedlevy4.statement_id = wts.statement_id and
	nonvotedlevy4.voted = 0 and
	nonvotedlevy4.order_num = 4
left outer join wa_tax_statement_levy_vw as nonvotedlevy5 with(nolock) on
	nonvotedlevy5.year = wts.year and
	nonvotedlevy5.group_id = wts.group_id and
	nonvotedlevy5.run_id = wts.run_id and
	nonvotedlevy5.statement_id = wts.statement_id and
	nonvotedlevy5.voted = 0 and
	nonvotedlevy5.order_num = 5
left outer join wa_tax_statement_levy_vw as nonvotedlevy6 with(nolock) on
	nonvotedlevy6.year = wts.year and
	nonvotedlevy6.group_id = wts.group_id and
	nonvotedlevy6.run_id = wts.run_id and
	nonvotedlevy6.statement_id = wts.statement_id and
	nonvotedlevy6.voted = 0 and
	nonvotedlevy6.order_num = 6
left outer join wa_tax_statement_levy_vw as nonvotedlevy7 with(nolock) on
	nonvotedlevy7.year = wts.year and
	nonvotedlevy7.group_id = wts.group_id and
	nonvotedlevy7.run_id = wts.run_id and
	nonvotedlevy7.statement_id = wts.statement_id and
	nonvotedlevy7.voted = 0 and
	nonvotedlevy7.order_num = 7
left outer join wa_tax_statement_levy_vw as nonvotedlevy8 with(nolock) on
	nonvotedlevy8.year = wts.year and
	nonvotedlevy8.group_id = wts.group_id and
	nonvotedlevy8.run_id = wts.run_id and
	nonvotedlevy8.statement_id = wts.statement_id and
	nonvotedlevy8.voted = 0 and
	nonvotedlevy8.order_num = 8
left outer join wa_tax_statement_levy_vw as nonvotedlevy9 with(nolock) on
	nonvotedlevy9.year = wts.year and
	nonvotedlevy9.group_id = wts.group_id and
	nonvotedlevy9.run_id = wts.run_id and
	nonvotedlevy9.statement_id = wts.statement_id and
	nonvotedlevy9.voted = 0 and
	nonvotedlevy9.order_num = 9
left outer join wa_tax_statement_levy_vw as nonvotedlevy10 with(nolock) on
	nonvotedlevy10.year = wts.year and
	nonvotedlevy10.group_id = wts.group_id and
	nonvotedlevy10.run_id = wts.run_id and
	nonvotedlevy10.statement_id = wts.statement_id and
	nonvotedlevy10.voted = 0 and
	nonvotedlevy10.order_num = 10
left outer join (
	select
		wtsl.year,
		wtsl.group_id,
		wtsl.run_id,
		wtsl.statement_id,
		wtsl.voted,
		total_levy_rate = sum(wtsl.levy_rate),
		total_tax_amount = sum(wtsl.tax_amount)
	from wa_tax_statement_levy as wtsl with(nolock)
	group by
		wtsl.year,
		wtsl.group_id,
		wtsl.run_id,
		wtsl.statement_id,
		wtsl.voted
) as nonvotedlevysummary on
	nonvotedlevysummary.year = wts.year and
	nonvotedlevysummary.group_id = wts.group_id and
	nonvotedlevysummary.run_id = wts.run_id and
	nonvotedlevysummary.statement_id = wts.statement_id and
	nonvotedlevysummary.voted = 0
left outer join wa_tax_statement_assessment_fee_vw as af1 with(nolock) on
	af1.year = wts.year and
	af1.group_id = wts.group_id and
	af1.run_id = wts.run_id and
	af1.statement_id = wts.statement_id and
	af1.order_num = 1
left outer join wa_tax_statement_assessment_fee_vw as af2 with(nolock) on
	af2.year = wts.year and
	af2.group_id = wts.group_id and
	af2.run_id = wts.run_id and
	af2.statement_id = wts.statement_id and
	af2.order_num = 2
left outer join wa_tax_statement_assessment_fee_vw as af3 with(nolock) on
	af3.year = wts.year and
	af3.group_id = wts.group_id and
	af3.run_id = wts.run_id and
	af3.statement_id = wts.statement_id and
	af3.order_num = 3
left outer join wa_tax_statement_assessment_fee_vw as af4 with(nolock) on
	af4.year = wts.year and
	af4.group_id = wts.group_id and
	af4.run_id = wts.run_id and
	af4.statement_id = wts.statement_id and
	af4.order_num = 4
left outer join wa_tax_statement_assessment_fee_vw as af5 with(nolock) on
	af5.year = wts.year and
	af5.group_id = wts.group_id and
	af5.run_id = wts.run_id and
	af5.statement_id = wts.statement_id and
	af5.order_num = 5
left outer join wa_tax_statement_assessment_fee_vw as af6 with(nolock) on
	af6.year = wts.year and
	af6.group_id = wts.group_id and
	af6.run_id = wts.run_id and
	af6.statement_id = wts.statement_id and
	af6.order_num = 6
left outer join wa_tax_statement_assessment_fee_vw as af7 with(nolock) on
	af7.year = wts.year and
	af7.group_id = wts.group_id and
	af7.run_id = wts.run_id and
	af7.statement_id = wts.statement_id and
	af7.order_num = 7
left outer join wa_tax_statement_assessment_fee_vw as af8 with(nolock) on
	af8.year = wts.year and
	af8.group_id = wts.group_id and
	af8.run_id = wts.run_id and
	af8.statement_id = wts.statement_id and
	af8.order_num = 8
left outer join wa_tax_statement_assessment_fee_vw as af9 with(nolock) on
	af9.year = wts.year and
	af9.group_id = wts.group_id and
	af9.run_id = wts.run_id and
	af9.statement_id = wts.statement_id and
	af9.order_num = 9
left outer join wa_tax_statement_assessment_fee_vw as af10 with(nolock) on
	af10.year = wts.year and
	af10.group_id = wts.group_id and
	af10.run_id = wts.run_id and
	af10.statement_id = wts.statement_id and
	af10.order_num = 10
left outer join (
	select
		wtsaf.year,
		wtsaf.group_id,
		wtsaf.run_id,
		wtsaf.statement_id,
		total_assessment_fee_amount = sum(wtsaf.assessment_fee_amount)
	from wa_tax_statement_assessment_fee as wtsaf with(nolock)
	group by
		wtsaf.year,
		wtsaf.group_id,
		wtsaf.run_id,
		wtsaf.statement_id
) as afsummary on
	afsummary.year = wts.year and
	afsummary.group_id = wts.group_id and
	afsummary.run_id = wts.run_id and
	afsummary.statement_id = wts.statement_id
join wa_tax_statement_delinquent_history as delq1 with(nolock) on
	delq1.year = wts.year and
	delq1.group_id = wts.group_id and
	delq1.run_id = wts.run_id and
	delq1.statement_id = wts.statement_id and
	delq1.delinquent_year = (wts.year - 0)
join wa_tax_statement_delinquent_history as delq2 with(nolock) on
	delq2.year = wts.year and
	delq2.group_id = wts.group_id and
	delq2.run_id = wts.run_id and
	delq2.statement_id = wts.statement_id and
	delq2.delinquent_year = (wts.year - 1)
join wa_tax_statement_delinquent_history as delq3 with(nolock) on
	delq3.year = wts.year and
	delq3.group_id = wts.group_id and
	delq3.run_id = wts.run_id and
	delq3.statement_id = wts.statement_id and
	delq3.delinquent_year = (wts.year - 2)
join wa_tax_statement_delinquent_history as delq4 with(nolock) on
	delq4.year = wts.year and
	delq4.group_id = wts.group_id and
	delq4.run_id = wts.run_id and
	delq4.statement_id = wts.statement_id and
	delq4.delinquent_year = (wts.year - 3)
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory1 with(nolock) on
	votedhistory1.year = wts.year and
	votedhistory1.group_id = wts.group_id and
	votedhistory1.run_id = wts.run_id and
	votedhistory1.statement_id = wts.statement_id and
	votedhistory1.voted = 1 and
	votedhistory1.order_num = 1	
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory2 with(nolock) on
	votedhistory2.year = wts.year and
	votedhistory2.group_id = wts.group_id and
	votedhistory2.run_id = wts.run_id and
	votedhistory2.statement_id = wts.statement_id and
	votedhistory2.voted = 1 and
	votedhistory2.order_num = 2
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory3 with(nolock) on
	votedhistory3.year = wts.year and
	votedhistory3.group_id = wts.group_id and
	votedhistory3.run_id = wts.run_id and
	votedhistory3.statement_id = wts.statement_id and
	votedhistory3.voted = 1 and
	votedhistory3.order_num = 3
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory4 with(nolock) on
	votedhistory4.year = wts.year and
	votedhistory4.group_id = wts.group_id and
	votedhistory4.run_id = wts.run_id and
	votedhistory4.statement_id = wts.statement_id and
	votedhistory4.voted = 1 and
	votedhistory4.order_num = 4
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory5 with(nolock) on
	votedhistory5.year = wts.year and
	votedhistory5.group_id = wts.group_id and
	votedhistory5.run_id = wts.run_id and
	votedhistory5.statement_id = wts.statement_id and
	votedhistory5.voted = 1 and
	votedhistory5.order_num = 5
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory6 with(nolock) on
	votedhistory6.year = wts.year and
	votedhistory6.group_id = wts.group_id and
	votedhistory6.run_id = wts.run_id and
	votedhistory6.statement_id = wts.statement_id and
	votedhistory6.voted = 1 and
	votedhistory6.order_num = 6
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory7 with(nolock) on
	votedhistory7.year = wts.year and
	votedhistory7.group_id = wts.group_id and
	votedhistory7.run_id = wts.run_id and
	votedhistory7.statement_id = wts.statement_id and
	votedhistory7.voted = 1 and
	votedhistory7.order_num = 7
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory8 with(nolock) on
	votedhistory8.year = wts.year and
	votedhistory8.group_id = wts.group_id and
	votedhistory8.run_id = wts.run_id and
	votedhistory8.statement_id = wts.statement_id and
	votedhistory8.voted = 1 and
	votedhistory8.order_num = 8
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory9 with(nolock) on
	votedhistory9.year = wts.year and
	votedhistory9.group_id = wts.group_id and
	votedhistory9.run_id = wts.run_id and
	votedhistory9.statement_id = wts.statement_id and
	votedhistory9.voted = 1 and
	votedhistory9.order_num = 9
left outer join wa_tax_statement_tax_history_comparison_vw as votedhistory10 with(nolock) on
	votedhistory10.year = wts.year and
	votedhistory10.group_id = wts.group_id and
	votedhistory10.run_id = wts.run_id and
	votedhistory10.statement_id = wts.statement_id and
	votedhistory10.voted = 1 and
	votedhistory10.order_num = 10
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory1 with(nolock) on
	nonvotedhistory1.year = wts.year and
	nonvotedhistory1.group_id = wts.group_id and
	nonvotedhistory1.run_id = wts.run_id and
	nonvotedhistory1.statement_id = wts.statement_id and
	nonvotedhistory1.voted = 0 and
	nonvotedhistory1.order_num = 1	
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory2 with(nolock) on
	nonvotedhistory2.year = wts.year and
	nonvotedhistory2.group_id = wts.group_id and
	nonvotedhistory2.run_id = wts.run_id and
	nonvotedhistory2.statement_id = wts.statement_id and
	nonvotedhistory2.voted = 0 and
	nonvotedhistory2.order_num = 2
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory3 with(nolock) on
	nonvotedhistory3.year = wts.year and
	nonvotedhistory3.group_id = wts.group_id and
	nonvotedhistory3.run_id = wts.run_id and
	nonvotedhistory3.statement_id = wts.statement_id and
	nonvotedhistory3.voted = 0 and
	nonvotedhistory3.order_num = 3
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory4 with(nolock) on
	nonvotedhistory4.year = wts.year and
	nonvotedhistory4.group_id = wts.group_id and
	nonvotedhistory4.run_id = wts.run_id and
	nonvotedhistory4.statement_id = wts.statement_id and
	nonvotedhistory4.voted = 0 and
	nonvotedhistory4.order_num = 4
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory5 with(nolock) on
	nonvotedhistory5.year = wts.year and
	nonvotedhistory5.group_id = wts.group_id and
	nonvotedhistory5.run_id = wts.run_id and
	nonvotedhistory5.statement_id = wts.statement_id and
	nonvotedhistory5.voted = 0 and
	nonvotedhistory5.order_num = 5
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory6 with(nolock) on
	nonvotedhistory6.year = wts.year and
	nonvotedhistory6.group_id = wts.group_id and
	nonvotedhistory6.run_id = wts.run_id and
	nonvotedhistory6.statement_id = wts.statement_id and
	nonvotedhistory6.voted = 0 and
	nonvotedhistory6.order_num = 6
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory7 with(nolock) on
	nonvotedhistory7.year = wts.year and
	nonvotedhistory7.group_id = wts.group_id and
	nonvotedhistory7.run_id = wts.run_id and
	nonvotedhistory7.statement_id = wts.statement_id and
	nonvotedhistory7.voted = 0 and
	nonvotedhistory7.order_num = 7
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory8 with(nolock) on
	nonvotedhistory8.year = wts.year and
	nonvotedhistory8.group_id = wts.group_id and
	nonvotedhistory8.run_id = wts.run_id and
	nonvotedhistory8.statement_id = wts.statement_id and
	nonvotedhistory8.voted = 0 and
	nonvotedhistory8.order_num = 8
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory9 with(nolock) on
	nonvotedhistory9.year = wts.year and
	nonvotedhistory9.group_id = wts.group_id and
	nonvotedhistory9.run_id = wts.run_id and
	nonvotedhistory9.statement_id = wts.statement_id and
	nonvotedhistory9.voted = 0 and
	nonvotedhistory9.order_num = 9
left outer join wa_tax_statement_tax_history_comparison_vw as nonvotedhistory10 with(nolock) on
	nonvotedhistory10.year = wts.year and
	nonvotedhistory10.group_id = wts.group_id and
	nonvotedhistory10.run_id = wts.run_id and
	nonvotedhistory10.statement_id = wts.statement_id and
	nonvotedhistory10.voted = 0 and
	nonvotedhistory10.order_num = 10

GO

