
CREATE VIEW arbitration_reports_vw
AS

SELECT
			arbitration_case_assoc.prop_val_yr,
			arbitration_case_assoc.case_id,
			arbitration_case_assoc.prop_id,
			case property_val.udi_parent
				when 'T' then
					'UDI Property'
				when 'D' then 
					'UDI Property'
				else
					owner_account.file_as_name 
			end AS owner_name,
			property.geo_id,
			arbitration.cad_arbitration_number,
			arbitration.appraiser_id,
			appraiser.appraiser_full_name AS appraiser_name,
			arbitration.arbitration_status,
			arbitration.arbitration_decision,
			isnull(arbitration.cad_arbitrator_fee_amt, 0) as cad_arbitrator_fee_amt,
			isnull(arbitration_case_assoc.begin_assessed_val, 0) as begin_assessed_val,
			isnull(arbitration_case_assoc.final_assessed_val, 0) as final_assessed_val,
			isnull(arbitration_case_assoc.final_assessed_val,0)-isnull(arbitration_case_assoc.begin_assessed_val,0) AS loss_assessed_val
FROM
			arbitration_case_assoc WITH (NOLOCK)
INNER JOIN
			arbitration WITH (NOLOCK)
ON
			arbitration.arbitration_id = arbitration_case_assoc.arbitration_id
		and	arbitration.prop_val_yr = arbitration_case_assoc.prop_val_yr
INNER JOIN
			property WITH (NOLOCK)
ON
			property.prop_id = arbitration_case_assoc.prop_id
INNER JOIN	
			prop_supp_assoc WITH (NOLOCK)
ON
			prop_supp_assoc.prop_id = arbitration_case_assoc.prop_id
		AND prop_supp_assoc.owner_tax_yr = arbitration_case_assoc.prop_val_yr
INNER JOIN
			property_val WITH (NOLOCK)
ON
			property_val.prop_id = prop_supp_assoc.prop_id
		AND property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
		AND property_val.sup_num = prop_supp_assoc.sup_num
INNER JOIN
	(
		SELECT prop_id, owner_tax_yr, sup_num, min(owner_id) as owner_id
		FROM owner WITH (NOLOCK)
		GROUP BY prop_id, owner_tax_yr, sup_num
	) AS owner 
on
			owner.prop_id = prop_supp_assoc.prop_id
		AND owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
		AND owner.sup_num = prop_supp_assoc.sup_num
INNER JOIN
			account AS owner_account WITH (NOLOCK)
ON
			owner_account.acct_id = owner.owner_id
LEFT OUTER JOIN
			appraiser WITH (NOLOCK)
ON
			appraiser.appraiser_id = arbitration.appraiser_id

GO

