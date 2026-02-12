

CREATE PROCEDURE ARBSignInListView

	@input_date as varchar(10) = ''

AS

declare @year int
declare @start_date as datetime
declare @end_date as datetime

IF @input_date = ''
BEGIN
	SET @input_date = CONVERT(varchar(10), getdate(), 101)
--	SET @input_date = '09/24/2002'
END

SET @start_date = @input_date + ' 00:00'
SET @end_date = @input_date + ' 23:59'

SELECT TOP 1 @year = appr_yr
FROM pacs_system
WHERE system_type = 'A' OR system_type = 'B'


SELECT convert(varchar(4), arb_protest.appr_year) + '-' + convert(varchar(15), arb_protest.case_id) as cause_number,
	arb_protest.inquiry_type_cd as protest_type,
	arb_protest.prop_id,
	property.geo_id,
	CASE WHEN agent_assoc.arb_mailings = 'T'
		THEN ag.file_as_name + ' (ARB)'
		WHEN agent_assoc.ca_mailings = 'T'
		THEN ag.file_as_name + ' (CAD)'
		WHEN agent_assoc.ent_mailings = 'T'
		THEN ag.file_as_name + ' (ENTITY)'
	END as agent_authority,
	account.file_as_name as owner_name,
	arb_protest.arb_taxpayer_arg_cd as reason,
	arb_protest.arb_hearing_date as meeting_date,
	arb_protest.sign_in_time as sign_in,
	appraiser.appraiser_nm as appraiser_name,
	arb_protest.arb_board as panel,
	property_profile.state_cd as state_code,
	arb_protest.arb_cad_arg_cd as cad_arg_code

FROM arb_protest

INNER JOIN prop_supp_assoc
ON arb_protest.prop_id = prop_supp_assoc.prop_id
AND prop_supp_assoc.owner_tax_yr = @year

INNER JOIN property
ON arb_protest.prop_id = property.prop_id

INNER JOIN property_profile
ON prop_supp_assoc.prop_id = property_profile.prop_id
AND prop_supp_assoc.owner_tax_yr = property_profile.prop_val_yr
AND prop_supp_assoc.sup_num = property_profile.sup_num

INNER JOIN owner
ON prop_supp_assoc.prop_id = owner.prop_id
AND prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
AND prop_supp_assoc.sup_num = owner.sup_num

INNER JOIN account
ON owner.owner_id = account.acct_id

INNER JOIN appraiser
ON arb_protest.protest_appraiser_id = appraiser.appraiser_id

LEFT OUTER JOIN agent_assoc
ON prop_supp_assoc.owner_tax_yr = agent_assoc.owner_tax_yr
AND prop_supp_assoc.prop_id = agent_assoc.prop_id
AND owner.owner_id = agent_assoc.owner_id
AND ISNULL(agent_assoc.exp_dt, getdate() + 1) > getdate()

LEFT OUTER JOIN account as ag
ON agent_assoc.agent_id = ag.acct_id

WHERE arb_protest.close_date IS NULL
AND arb_protest.arb_hearing_date >= @start_date
AND arb_protest.arb_hearing_date <= @end_date
--AND arb_protest.sign_in_time >= @start_date
--AND arb_protest.sign_in_time <= @start_date

ORDER BY arb_protest.arb_hearing_date, account.file_as_name

GO

