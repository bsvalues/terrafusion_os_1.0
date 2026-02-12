

/*
	This monitor was written for Chelan Co.
	It returns all the props with a SNR/DSBL 
	with New Construction.
	
	Name: SNR/DSBL with New Construction by year
	
	One Variable: @appryr is the year
					
	command: {call SNRwithNC (2016)}
*/

CREATE procedure [dbo].[SNRwithNC]

@appryr  int

as

--Finds New Construction with SNR/DSBL:

SELECT DISTINCT pv.prop_id, 
sum(wpov.new_val_hs + wpov.new_val_nhs) as Total_New_Val_hs_and_nhs,
wpoe.exmpt_type_cd, pv.prop_val_yr
FROM property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN wash_prop_owner_val wpov WITH (nolock) ON
	pv.prop_id = wpov.prop_id
	AND pv.prop_val_yr = wpov.year
	AND pv.sup_num = wpov.sup_num
INNER JOIN wash_prop_owner_exemption wpoe WITH (nolock) ON
	wpov.prop_id = wpoe.prop_id	
	AND wpov.year = wpoe.year
	AND wpov.sup_num = wpoe.sup_num
	AND wpoe.exmpt_type_cd = 'SNR/DSBL'
WHERE wpov.year = @appryr
AND pv.prop_inactive_dt is null
AND (wpov.new_val_hs + wpov.new_val_nhs) > 0
GROUP BY pv.prop_id, wpoe.exmpt_type_cd, pv.prop_val_yr
ORDER BY pv.prop_id

GO

