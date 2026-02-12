
/*
Jeremy Wilson 34585 changes
The stored procedure wasn't designed is a fashion consistent with the original
way multi-line address tags were intended to be processed by the word merge classes.

Even more so, it appears the stored procedure was left half done since no alias name 
select statement was put in place to make nice with the word merge tree view.

So I decided to add the code to comply with that standard while I was in here adding stuff
for this ticket.  I also refactored some code where necessary to bring ARB letters more
into compliance with the way the Word Merge Letters Processing works.
*/

CREATE procedure AR

	@arbitration_id int,
	@prop_val_yr numeric(4,0),
	@ID2 int = null

as

IF @arbitration_id > 0
BEGIN
	select cad_id, ref_id, cad_arbitration_number, arbitration_status,
			convert(varchar(10), arbitration_status_dt, 101) as arbitration_status_dt,
			convert(varchar(10), create_dt, 101) as create_dt,
			pu.full_name as created_by,
			arbitrated_by_type,

			a.file_as_name as arbitrated_by_name,
			a.file_as_name 				as arbitrated_by_name_address,
			a.file_as_name 				as arbitrated_by_name_address_5lines,
			a.file_as_name 				as arbitrated_by_name_address_6lines,
			arbitrated_by_address.addr_line1 	as arbitrated_by_addr_line1,
			arbitrated_by_address.addr_line2 	as arbitrated_by_addr_line2,
			arbitrated_by_address.addr_line3 	as arbitrated_by_addr_line3,
			arbitrated_by_address.addr_city 	as arbitrated_by_addr_city,
			arbitrated_by_address.addr_state 	as arbitrated_by_addr_state,
			arbitrated_by_address.addr_zip 		as arbitrated_by_addr_zip,
			arbitrated_by_address.country_cd 	as arbitrated_by_addr_country_cd,
			arbitrated_by_country.country_name 	as arbitrated_by_addr_country_name,
			arbitrated_by_address.is_international as arbitrated_by_addr_is_international,
			arbitrated_by_address.zip 			as arbitrated_by_zip,
			arbitrated_by_address.cass 			as arbitrated_by_cass,
			arbitrated_by_address.route 		as arbitrated_by_route,
			arbitrated_by_address.zip_4_2 		as arbitrated_by_ZIP_BARCODE,

			convert(varchar(10), arbitration_received_dt, 101) as arbitration_received_dt,
			convert(varchar(10), order_determining_protest_sent_dt, 101) as order_determining_protest_sent_dt,
			convert(varchar(10), order_determining_protest_received_dt, 101) as order_determining_protest_received_dt,
			convert(varchar(10), arbitration_received_dt, 101) as arbitration_received_dt,
			payment_amount,
			check_money_order_number,
			case when filed_timely_flag = 1 then 'Yes' else 'No' end as filed_timely_flag,
			case when taxes_not_delinquent_flag = 1 then 'Yes' else 'No' end as taxes_not_delinquent_flag,
			convert(varchar(10), taxes_verified_dt, 101) as taxes_verified_dt,
			put.full_name as taxes_verified_by,
			owner_opinion_of_value,	
			convert(varchar(10), reject_dt, 101) as reject_dt,
			reject_reason,
			convert(varchar(10), reject_letter_print_dt, 101) as reject_letter_print_dt,
			convert(varchar(10), request_sent_dt, 101) as request_sent_dt,
			convert(varchar(10), request_letter_printed_dt, 101) as request_letter_printed_dt,
			convert(varchar(10), certified_mailer_printed_dt, 101) as certified_mailer_printed_dt,
			convert(varchar(10), state_approval_dt, 101) as state_approval_dt,
			convert(varchar(10), arbitrator_selection_dt, 101) as arbitrator_selection_dt,
			convert(varchar(10), arbitrator_selection_letter_printed_dt, 101) as arbitrator_selection_letter_printed_dt,
			convert(varchar(10), arbitrator_selection_due_dt, 101) as arbitrator_selection_due_dt,

			apa.file_as_name as plaintiff_arbitrator,
			apa.file_as_name 							as plaintiff_arbitrator_name_address,
			apa.file_as_name 							as plaintiff_arbitrator_name_address_5lines,
			apa.file_as_name 							as plaintiff_arbitrator_name_address_6lines,
			plaintiff_arbitrator_address.addr_line1 	as plaintiff_arbitrator_addr_line1,
			plaintiff_arbitrator_address.addr_line2 	as plaintiff_arbitrator_addr_line2,
			plaintiff_arbitrator_address.addr_line3 	as plaintiff_arbitrator_addr_line3,
			plaintiff_arbitrator_address.addr_city 		as plaintiff_arbitrator_addr_city,
			plaintiff_arbitrator_address.addr_state 	as plaintiff_arbitrator_addr_state,
			plaintiff_arbitrator_address.addr_zip 		as plaintiff_arbitrator_addr_zip,
			plaintiff_arbitrator_address.country_cd 	as plaintiff_arbitrator_addr_country_cd,
			plaintiff_arbitrator_country.country_name 	as plaintiff_arbitrator_addr_country_name,
			plaintiff_arbitrator_address.is_international as plaintiff_arbitrator_addr_is_international,
			plaintiff_arbitrator_address.zip 			as plaintiff_arbitrator_zip,
			plaintiff_arbitrator_address.cass 			as plaintiff_arbitrator_cass,
			plaintiff_arbitrator_address.route 			as plaintiff_arbitrator_route,
			plaintiff_arbitrator_address.zip_4_2 		as plaintiff_arbitrator_ZIP_BARCODE,

			aca.file_as_name as cad_arbitrator,
			aca.file_as_name 						as cad_arbitrator_name_address,
			aca.file_as_name 						as cad_arbitrator_name_address_5lines,
			aca.file_as_name 						as cad_arbitrator_name_address_6lines,
			cad_arbitrator_address.addr_line1 		as cad_arbitrator_addr_line1,
			cad_arbitrator_address.addr_line2 		as cad_arbitrator_addr_line2,
			cad_arbitrator_address.addr_line3 		as cad_arbitrator_addr_line3,
			cad_arbitrator_address.addr_city 		as cad_arbitrator_addr_city,
			cad_arbitrator_address.addr_state 		as cad_arbitrator_addr_state,
			cad_arbitrator_address.addr_zip 		as cad_arbitrator_addr_zip,
			cad_arbitrator_address.country_cd 		as cad_arbitrator_addr_country_cd,
			cad_arbitrator_country.country_name 	as cad_arbitrator_addr_country_name,
			cad_arbitrator_address.is_international as cad_arbitrator_addr_is_international,
			cad_arbitrator_address.zip 				as cad_arbitrator_zip,
			cad_arbitrator_address.cass 			as cad_arbitrator_cass,
			cad_arbitrator_address.route 			as cad_arbitrator_route,
			cad_arbitrator_address.zip_4_2 			as cad_arbitrator_ZIP_BARCODE,

			aaa.file_as_name as arbitrator_assigned,
			aaa.file_as_name 						as arbitrator_assigned_name_address,
			aaa.file_as_name 						as arbitrator_assigned_name_address_5lines,
			aaa.file_as_name 						as arbitrator_assigned_name_address_6lines,
			arbitrator_assigned_address.addr_line1 		as arbitrator_assigned_addr_line1,
			arbitrator_assigned_address.addr_line2 		as arbitrator_assigned_addr_line2,
			arbitrator_assigned_address.addr_line3 		as arbitrator_assigned_addr_line3,
			arbitrator_assigned_address.addr_city 		as arbitrator_assigned_addr_city,
			arbitrator_assigned_address.addr_state 		as arbitrator_assigned_addr_state,
			arbitrator_assigned_address.addr_zip 		as arbitrator_assigned_addr_zip,
			arbitrator_assigned_address.country_cd 		as arbitrator_assigned_addr_country_cd,
			arbitrator_assigned_country.country_name 	as arbitrator_assigned_addr_country_name,
			arbitrator_assigned_address.is_international as arbitrator_assigned_addr_is_international,
			arbitrator_assigned_address.zip 				as arbitrator_assigned_zip,
			arbitrator_assigned_address.cass 			as arbitrator_assigned_cass,
			arbitrator_assigned_address.route 			as arbitrator_assigned_route,
			arbitrator_assigned_address.zip_4_2 			as arbitrator_assigned_ZIP_BARCODE,

			convert(varchar(10), arbitrator_assigned_dt, 101) as arbitrator_assigned_dt,
			convert(varchar(10), estimated_completion_dt, 101) as estimated_completion_dt,
			convert(varchar(10), arbitration_dt, 101) as arbitration_dt,
			arbitration_place,	
			arbitration_method,
			convert(varchar(10), arbitration_completion_dt, 101) as arbitration_completion_dt,
			app.appraiser_nm as appraiser_name,
			comments,
			convert(varchar(10), evidence_prepared_dt, 101) as evidence_prepared_dt,
			pue.full_name as evidence_prepared_by,
			convert(varchar(10), evidence_letter_printed_dt, 101) as evidence_letter_printed_dt,
			convert(varchar(10), additional_evidence_requested_dt, 101) as additional_evidence_requested_dt,
			additional_evidence_type,
			convert(varchar(10), additional_evidence_letter_printed_dt, 101) as additional_evidence_letter_printed_dt,
			puae.full_name as additional_evidence_prepared_staff,
			convert(varchar(10), additional_evidence_delivery_dt, 101) as additional_evidence_delivery_dt,
			arbitrators_assigned_value,
			arbitrators_opinion_of_value,
			case when arbitrators_opinion_of_value_override = 1 then 'Yes' else 'No' end as arbitrators_opinion_of_value_override,
			arbitrators_arb_value,
			case when arbitrators_arb_value_override = 1 then 'Yes' else 'No' end as arbitrators_arb_value_override,
			arbitrators_diff_arb_value,
			arbitrators_diff_opinion_of_value,
			case when arbitration_decision = 1 then 'Ruling for the Taxpayer' else 'Ruling for the Appraisal District' end as arbitration_decision,
			convert(varchar(10), cad_arbitrator_fee_dt, 101) as cad_arbitrator_fee_dt,
			cad_arbitrator_check_number,
			cad_arbitrator_fee_amt,
			puc.full_name as closed_pacs_user,
	
			-- HS 35855
			aaaa.file_as_name as owner_name,
			-- HS 34585
			aaaa.file_as_name as owner_name_address,
			aaaa.file_as_name as owner_name_address_5lines,
			aaaa.file_as_name as owner_name_address_6lines,
			owner_address.addr_line1 as owner_addr_line1,
			owner_address.addr_line2 as owner_addr_line2,
			owner_address.addr_line3 as owner_addr_line3,
			owner_address.addr_city as owner_addr_city,
			owner_address.addr_state as owner_addr_state,
			owner_address.addr_zip as owner_addr_zip,
			owner_address.country_cd as owner_addr_country_cd,
			country.country_name as owner_addr_country_name,
			owner_address.is_international as owner_addr_is_international,
			owner_address.zip as owner_zip,
			owner_address.cass as owner_cass,
			owner_address.route as owner_route,
			owner_address.zip_4_2 as owner_ZIP_BARCODE

	from arbitration as arbit
	with (nolock)
	join pacs_user as pu
	with (nolock)
	on arbit.created_by = pu.pacs_user_id
	left outer join account as a
	with (nolock)
	on arbit.arbitrated_by_id = a.acct_id

	left outer join primary_address_vw as arbitrated_by_address
	with (nolock)
	on arbitrated_by_address.acct_id = a.acct_id
	left outer join country as arbitrated_by_country
	with (nolock)
	on arbitrated_by_country.country_cd = arbitrated_by_address.country_cd

	left outer join pacs_user as put
	with (nolock)
	on arbit.taxes_verified_by_id = put.pacs_user_id
	left outer join account as apa
	with (nolock)
	on arbit.plaintiff_arbitrator_id = apa.acct_id

	left outer join primary_address_vw as plaintiff_arbitrator_address
	with (nolock)
	on plaintiff_arbitrator_address.acct_id = apa.acct_id
	left outer join country as plaintiff_arbitrator_country
	with (nolock)
	on plaintiff_arbitrator_country.country_cd = plaintiff_arbitrator_address.country_cd

	left outer join account as aca
	with (nolock)
	on arbit.cad_arbitrator_id = aca.acct_id

	left outer join primary_address_vw as cad_arbitrator_address
	with (nolock)
	on cad_arbitrator_address.acct_id = aca.acct_id
	left outer join country as cad_arbitrator_country
	with (nolock)
	on cad_arbitrator_country.country_cd = cad_arbitrator_address.country_cd

	left outer join account as aaa
	with (nolock)
	on arbit.arbitrator_assigned_id = aaa.acct_id

	left outer join primary_address_vw as arbitrator_assigned_address
	with (nolock)
	on arbitrator_assigned_address.acct_id = aaa.acct_id
	left outer join country as arbitrator_assigned_country
	with (nolock)
	on arbitrator_assigned_country.country_cd = arbitrator_assigned_address.country_cd

	left outer join appraiser as app
	with (nolock)
	on arbit.appraiser_id = app.appraiser_id
	left outer join pacs_user as pue
	with (nolock)
	on arbit.evidence_prepared_staff = pue.pacs_user_id
	left outer join pacs_user as puae
	with (nolock)
	on arbit.additional_evidence_prepared_staff = puae.pacs_user_id
	left outer join pacs_user as puc
	with (nolock)
	on arbit.closed_pacs_user_id = puc.pacs_user_id
	
	-- HS 35855
	left outer join arbitration_case_assoc as acass
	with (nolock)
	on arbit.arbitration_id = acass.arbitration_id
	and arbit.prop_val_yr = acass.prop_val_yr
	left outer join _arb_protest as arb
	with (nolock)
	on acass.prop_id = arb.prop_id
	and acass.prop_val_yr = arb.prop_val_yr
	and acass.case_id = arb.case_id
	left outer join property as p
	with (nolock)
	on acass.prop_id = p.prop_id
	left outer join owner as o
	with (nolock)
	on acass.prop_val_yr = o.owner_tax_yr
	and acass.prop_id = o.prop_id
	left outer join prop_supp_assoc as psa
	with (nolock)
	on o.prop_id = psa.prop_id
	and o.owner_tax_yr = psa.owner_tax_yr
	and o.sup_num = psa.sup_num
	left outer join account as aaaa
	on o.owner_id = aaaa.acct_id
	left outer join address as owner_address
	WITH (NOLOCK)
	ON aaaa.acct_id = owner_address.acct_id
	AND owner_address.primary_addr = 'Y'
	left outer join country on country.country_cd = owner_address.country_cd
	left outer join property_val as pv
	with (nolock)
	on o.prop_id = pv.prop_id
	and o.owner_tax_yr = pv.prop_val_yr
	and o.sup_num = pv.sup_num
	--
	
	where arbit.arbitration_id = @arbitration_id
	and arbit.prop_val_yr = @prop_val_yr
END
ELSE
BEGIN
	select 
		'CAD ID' as cad_id, 
		'Property Ref ID' as ref_id, 
		'CAD Arbitration #' as cad_arbitration_number, 
		'Arbitration Status' as arbitration_status,
		'Arbitration Status Date' as arbitration_status_dt,
		'Arbitration Created Date' as create_dt,
		'Arbitration Created By' as created_by,
		'Arbitrated By Type' as	arbitrated_by_type,

		'Arbitrated By Name' as arbitrated_by_name,
		'Arbitrated By Name and Address (5 Lines)'	as arbitrated_by_name_address,
		'Arbitrated By Name and Address (6 Lines - Intl)'	as arbitrated_by_name_address_6lines,
		'Arbitrated By Address Line 1'			as arbitrated_by_addr_line1,
		'Arbitrated By Address Line 2'			as arbitrated_by_addr_line2,
		'Arbitrated By Address Line 3'			as arbitrated_by_addr_line3,
		'Arbitrated By Address City'			as arbitrated_by_addr_city,
		'Arbitrated By Address State'			as arbitrated_by_addr_state,
		'Arbitrated By Address Zip'				as arbitrated_by_addr_zip,
		'Arbitrated By Address Country Code'	as arbitrated_by_addr_country_cd,
		'Arbitrated By Address Country Name'	as arbitrated_by_addr_country_name,
		'Arbitrated By Zip'						as arbitrated_by_zip,
		'Arbitrated By Cass'					as arbitrated_by_cass,
		'Arbitrated By Route'					as arbitrated_by_route,
		'Arbitrated By Zip Barcode'				as arbitrated_by_ZIP_BARCODE,
		
		'Arbitration Received Date' as arbitration_received_dt,
		'Order Determining Protest Sent Date' as order_determining_protest_sent_dt,
		'Order Determining Protest Received Date'  as order_determining_protest_received_dt,
		'Arbitration Received Date' as arbitration_received_dt,
		'Payment Amount' as payment_amount,
		'Check/Money Order Number' as check_money_order_number,
		'Filed Timely Flag' as filed_timely_flag,
		'Taxes Not Delinquent Flag' as taxes_not_delinquent_flag,
		'Taxes Verified Date' as taxes_verified_dt,
		'Taxes Verified By' as taxes_verified_by,
		'Owner Opinion of Value' as owner_opinion_of_value,	
		'Reject Date' as reject_dt,
		'Reject Reason' as reject_reason,
	 	'Reject Letter Print Date' as reject_letter_print_dt,
		'Request Sent Date' as request_sent_dt,
		'Request Letter Printed Date' as request_letter_printed_dt,
		'Certified Mailer Printed Date' as certified_mailer_printed_dt,
		'State Approval Date' as state_approval_dt,
		'Arbitrator Selection Date' as arbitrator_selection_dt,
		'Arbitrator Selection Letter Printed Date' as arbitrator_selection_letter_printed_dt,
		'Arbitrator Selection Due Date' as arbitrator_selection_due_dt,

		'Plaintiff Arbitrator Name' as plaintiff_arbitrator,
		'Plaintiff Arbitrator Name and Address (5 Lines)'	as plaintiff_arbitrator_name_address,
		'Plaintiff Arbitrator Name and Address (6 Lines - Intl)'	as plaintiff_arbitrator_name_address_6lines,
		'Plaintiff Arbitrator Address Line 1'				as plaintiff_arbitrator_addr_line1,
		'Plaintiff Arbitrator Address Line 2'				as plaintiff_arbitrator_assigned_addr_line2,
		'Plaintiff Arbitrator Address Line 3'				as plaintiff_arbitrator_addr_line3,
		'Plaintiff Arbitrator Address City'				as plaintiff_arbitrator_addr_city,
		'Plaintiff Arbitrator Address State'				as plaintiff_arbitrator_addr_state,
		'Plaintiff Arbitrator Address Zip'				as plaintiff_arbitrator_addr_zip,
		'Plaintiff Arbitrator Address Country Code'		as plaintiff_arbitrator_addr_country_cd,
		'Plaintiff Arbitrator Address Country Name'		as plaintiff_arbitrator_addr_country_name,
		'Plaintiff Arbitrator Zip'						as plaintiff_arbitrator_zip,
		'Plaintiff Arbitrator Cass'						as plaintiff_arbitrator_cass,
		'Plaintiff Arbitrator Route'						as plaintiff_arbitrator_route,
		'Plaintiff Arbitrator Zip Barcode'				as plaintiff_arbitrator_ZIP_BARCODE,

		'CAD Arbitrator Name' as cad_arbitrator,
		'CAD Arbitrator Name and Address (5 Lines)'	as cad_arbitrator_name_address,
		'CAD Arbitrator Name and Address (6 Lines - Intl)'	as cad_arbitrator_name_address_6lines,
		'CAD Arbitrator Address Line 1'				as cad_arbitrator_addr_line1,
		'CAD Arbitrator Address Line 2'				as cad_arbitrator_assigned_addr_line2,
		'CAD Arbitrator Address Line 3'				as cad_arbitrator_addr_line3,
		'CAD Arbitrator Address City'				as cad_arbitrator_addr_city,
		'CAD Arbitrator Address State'				as cad_arbitrator_addr_state,
		'CAD Arbitrator Address Zip'				as cad_arbitrator_addr_zip,
		'CAD Arbitrator Address Country Code'		as cad_arbitrator_addr_country_cd,
		'CAD Arbitrator Address Country Name'		as cad_arbitrator_addr_country_name,
		'CAD Arbitrator Zip'						as cad_arbitrator_zip,
		'CAD Arbitrator Cass'						as cad_arbitrator_cass,
		'CAD Arbitrator Route'						as cad_arbitrator_route,
		'CAD Arbitrator Zip Barcode'				as cad_arbitrator_ZIP_BARCODE,

		'Arbitrator Assigned Name' as arbitrator_assigned,
		'Arbitrator Assigned Name and Address (5 Lines)'	as arbitrator_assigned_name_address,
		'Arbitrator Assigned Name and Address (6 Lines - Intl)'	as arbitrator_assigned_name_address_6lines,
		'Arbitrator Assigned Address Line 1'			as arbitrator_assigned_addr_line1,
		'Arbitrator Assigned Address Line 2'			as arbitrator_assigned_addr_line2,
		'Arbitrator Assigned Address Line 3'			as arbitrator_assigned_addr_line3,
		'Arbitrator Assigned Address City'				as arbitrator_assigned_addr_city,
		'Arbitrator Assigned Address State'				as arbitrator_assigned_addr_state,
		'Arbitrator Assigned Address Zip'				as arbitrator_assigned_addr_zip,
		'Arbitrator Assigned Address Country Code'		as arbitrator_assigned_addr_country_cd,
		'Arbitrator Assigned Address Country Name'		as arbitrator_assigned_addr_country_name,
		'Arbitrator Assigned Zip'						as arbitrator_assigned_zip,
		'Arbitrator Assigned Cass'						as arbitrator_assigned_cass,
		'Arbitrator Assigned Route'						as arbitrator_assigned_route,
		'Arbitrator Assigned Zip Barcode'				as arbitrator_assigned_ZIP_BARCODE,

		'Arbitrator Assigned Date' as arbitrator_assigned_dt,
		'Estimated Completion Date' as estimated_completion_dt,
		'Arbitration Date' as arbitration_dt,
		'Arbitration Place' as arbitration_place,	
		'Arbitration Period' as	arbitration_method,
		'Arbitration Completion Date' as arbitration_completion_dt,
		'Appraiser Name' as appraiser_name,
		'Comments' as comments,
		'Evidence Prepared Date' as evidence_prepared_dt,
		'Evidence Prepared By' as evidence_prepared_by,
		'Evidence Letter Printed Date' as evidence_letter_printed_dt,
		'Additional Evidence Requested Date' as additional_evidence_requested_dt,
		'Additional Evidence Type' as additional_evidence_type,
		'Additional Evidence Letter Printed Date' as additional_evidence_letter_printed_dt,
		'Additional Evidence Prepared Staff Name' as additional_evidence_prepared_staff,
		'Additional Evidence Delivery Date' as additional_evidence_delivery_dt,
		'Arbitrator''s Assigned Value' as arbitrators_assigned_value,
		'Arbitrator''s Opinion of Value' as arbitrators_opinion_of_value,
		'Arbitrator''s Opinion of Value Override' as arbitrators_opinion_of_value_override,
		'Arbitrator''s ARB Value' as arbitrators_arb_value,
		'Arbitrator''s ARB Value Override' as arbitrators_arb_value_override,
		'Arbitrator''s Diff ARB Value' as arbitrators_diff_arb_value,
		'Arbitrator''s Diff Opinion of Value' as arbitrators_diff_opinion_of_value,
		'Arbitration Decision' as arbitration_decision,
		'CAD Arbitrator Fee Date' as cad_arbitrator_fee_dt,
		'CAD Arbitrator Check #' as cad_arbitrator_check_number,
		'CAD Arbitrator Fee Amount' as cad_arbitrator_fee_amt,
		'Closed By' as closed_pacs_user,

		'Owner Name'					as owner_name,
		'Owner Name and Address (5 Lines)'	as owner_name_address,
		'Owner Name and Address (6 Lines - Intl)'	as owner_name_address_6lines,
		'Owner Address Line 1'			as owner_addr_line1,
		'Owner Address Line 2'			as owner_addr_line2,
		'Owner Address Line 3'			as owner_addr_line3,
		'Owner Address City'			as owner_addr_city,
		'Owner Address State'			as owner_addr_state,
		'Owner Address Zip'				as owner_addr_zip,
		'Owner Address Country Code'	as owner_addr_country_cd,
		'Owner Address Country Name'	as owner_addr_country_name,
		'Owner Zip'						as owner_zip,
		'Owner Cass'					as owner_cass,
		'Owner Route'					as owner_route,
		'Owner Zip Barcode'				as owner_ZIP_BARCODE,

		'Property Geo ID' as geo_id,
		'Property ID' as prop_id,
		'Appraisal Year' as prop_val_yr,
		'Property Legal Description' as legal_desc,
		'Case ID' as case_id
END

GO

