

CREATE VIEW arb_protest_info_vw

AS

SELECT arb_protest.appr_year, 
		arb_protest.case_id, 
		arb_protest.prop_id, 
		arb_protest.prop_val_yr, 
		arb_protest.sup_num,
		arb_protest.arb_hearing_date, 
		arb_protest.inquiry_taxpayer_comment, 
		account.file_as_name,
		account.first_name,
		account.last_name,
		account.confidential_flag, 
		address.addr_line1, 
		address.addr_line2, 
		address.addr_line3, 
		address.addr_city, 
		address.addr_state, 
		address.country_cd, 
		address.addr_zip, 
		property.geo_id, 
		property_val.legal_desc, 
		arb_protest.date_created, 
		arb_protest.inquiry_type_cd, 
		phone.phone_num AS home_phone_num, 
		arb_protest.inquiry_appraiser_id, 
		arb_protest.inquiry_operator_comment, 
		arb_protest.appraiser_comment, 
		phone1.phone_num AS bus_phone_num, 
		property.prop_type_cd, 
		property_val.land_hstd_val, 
		property_val.land_non_hstd_val, 
		property_val.imprv_hstd_val, 
		property_val.imprv_non_hstd_val, 
		property_val.assessed_val, 
		property_val.market, 
		property_val.ag_use_val, 
		property_val.ag_market, 
		property_val.timber_market, 
		appr_notice_config_maint.arb_location, 
		arb_resolution_cd.approved_flag, 
		arb_protest.resolution_comment, 
		arb_board.arb_board_meeting_length, 
		arb_protest.arb_taxpayer_comment, 
		arb_protest.inquiry_by_id, 
		arb_protest.arb_taxpayer_arg_cd, 
		arb_taxpayer.taxpayer_arg_desc,
		agent_assoc.agent_id,
		ag.file_as_name as agent_name,
		aga.addr_line1 as agent_addr_line1,
		aga.addr_line2 as agent_addr_line2,
		aga.addr_line3 as agent_addr_line3,
		aga.addr_city as agent_addr_city,
		aga.addr_state as agent_addr_state,
		aga.country_cd as agent_country_cd,
		aga.addr_zip as agent_addr_zip,
		arb_protest.letter_final_order_date,
		arb_protest.letter_notice_protest_date,
		arb_protest.letter_protest_hearing_date,
		arb_protest.letter_order_protest_date,
		arb_protest.letter_settlement_waiver_date,
		arb_protest.letter_taxpayer_inquiry_date,
		arb_protest.letter_waive_notice_protest_date,
		arb_protest.letter_settlement_informal_date,
		arb_protest.letter_affidavit_hearing_date

FROM	arb_protest

INNER JOIN property_val
ON		arb_protest.prop_id = property_val.prop_id
AND		arb_protest.prop_val_yr = property_val.prop_val_yr
AND		arb_protest.sup_num = property_val.sup_num

INNER JOIN property
ON		arb_protest.prop_id = property.prop_id

LEFT OUTER JOIN arb_taxpayer
ON		arb_protest.arb_taxpayer_arg_cd = arb_taxpayer.taxpayer_arg_cd

LEFT OUTER JOIN account
ON		arb_protest.inquiry_by_id = account.acct_id

LEFT OUTER JOIN address
ON		account.acct_id = address.acct_id
AND		address.primary_addr = 'Y'

LEFT OUTER JOIN phone
ON		account.acct_id = phone.acct_id
AND		phone.phone_type_cd = 'H'

LEFT OUTER JOIN phone as phone1
ON		account.acct_id = phone.acct_id
AND		phone.phone_type_cd = 'B'

LEFT OUTER JOIN appr_notice_config_maint
ON		arb_protest.appr_year = appr_notice_config_maint.notice_yr

LEFT OUTER JOIN arb_resolution_cd
ON		arb_protest.resolution_cd = arb_resolution_cd.resolution_cd

LEFT OUTER JOIN arb_board
ON		arb_protest.arb_board = arb_board.arb_board_cd

LEFT OUTER JOIN agent_assoc
ON arb_protest.prop_val_yr = agent_assoc.owner_tax_yr
AND arb_protest.prop_id = agent_assoc.prop_id
AND arb_protest.inquiry_by_id = agent_assoc.owner_id
AND arb_protest.inquiry_source_cd = 'AG'
AND agent_assoc.arb_mailings = 'T'

LEFT OUTER JOIN account as ag
ON agent_assoc.agent_id = ag.acct_id

LEFT OUTER JOIN address as aga
ON agent_assoc.agent_id = aga.acct_id
AND aga.primary_addr = 'Y'

GO

