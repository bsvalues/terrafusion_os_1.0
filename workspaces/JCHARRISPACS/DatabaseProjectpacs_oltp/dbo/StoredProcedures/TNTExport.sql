
CREATE PROCEDURE TNTExport

	@input_year int,
	@input_pacs_user_id int,
	@input_entity_ids varchar(500),
	@input_tnt_export_id int

WITH RECOMPILE
AS


declare @prev_year varchar(4)
declare @curr_year varchar(4)
declare @strSQL as varchar(3000)

SET @curr_year = CONVERT(varchar(4), @input_year)
SET @prev_year = CONVERT(varchar(4), @input_year - 1)


SET NOCOUNT ON

if exists (select * from sysobjects where id = object_id(N'[dbo].[_tnt_export]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
BEGIN
	DROP TABLE [dbo].[_tnt_export]
END

CREATE TABLE [dbo].[_tnt_export] (
	[entity_id] [int] NOT NULL ,
	[entity_desc] [varchar] (35) NOT NULL ,
	[fund_name] [varchar] (50) NULL ,
	[entity_type_cd] [varchar] (5) NOT NULL ,
	[taxing_unit_num] [varchar] (50) NULL ,
	[ptd_multi_unit] [varchar] (5) NULL ,
	[prev_yr_mno_rate] [numeric](13, 10) NULL ,
	[prev_yr_ins_rate] [numeric](13, 10) NULL ,
	[prev_yr_taxable_val] [numeric](14, 0) NULL ,
	[prev_yr_freeze_taxable_val] [numeric](14, 0) NULL ,
	[prev_yr_actual_tax] [numeric](14, 2) NULL ,
	[curr_yr_taxable_val] [numeric](14, 0) NULL ,
	[curr_yr_freeze_taxable_val] [numeric](14, 0) NULL ,
	[curr_yr_actual_tax] [numeric](14, 2) NULL ,
	[curr_yr_absolute_market_exemptions] [numeric](14, 0) NULL ,
	[curr_yr_partial_exemptions] [numeric](14, 0) NULL ,
	[curr_yr_value_lost_new_exemptions] [numeric](14, 0) NULL ,
	[curr_yr_ag_lost_market] [numeric](14, 0) NULL,
	[curr_yr_ag_exempt_amount] [numeric](14, 0) NULL,
	[curr_yr_value_lost_new_ag] [numeric](14, 0) NULL ,
	[curr_yr_tif_taxes] [numeric](14, 0) NULL ,
	[curr_yr_pollution_control_exemptions] [numeric](14, 0) NULL ,
	[curr_yr_tif_taxable] [numeric](14, 0) NULL ,
	[curr_yr_under_arb_review] [numeric](14, 0) NULL ,
	[curr_yr_annexations] [numeric](14, 0) NULL ,
	[curr_yr_value_new_improvements_bpp] [numeric](14, 0) NULL 
) ON [PRIMARY]

SET @strSQL = 'INSERT INTO [dbo].[_tnt_export] '
SET @strSQL = @strSQL + '(entity_id, entity_desc, fund_name, entity_type_cd, taxing_unit_num, ptd_multi_unit, '
SET @strSQL = @strSQL + 'prev_yr_mno_rate, prev_yr_ins_rate, prev_yr_taxable_val, prev_yr_freeze_taxable_val, '
SET @strSQL = @strSQL + 'prev_yr_actual_tax, curr_yr_taxable_val, curr_yr_freeze_taxable_val, curr_yr_actual_tax, '
SET @strSQL = @strSQL + 'curr_yr_absolute_market_exemptions, curr_yr_partial_exemptions, '
SET @strSQL = @strSQL + 'curr_yr_value_lost_new_exemptions, curr_yr_value_lost_new_ag, curr_yr_tif_taxes, '
SET @strSQL = @strSQL + 'curr_yr_pollution_control_exemptions, curr_yr_tif_taxable, curr_yr_under_arb_review, '
SET @strSQL = @strSQL + 'curr_yr_annexations, curr_yr_value_new_improvements_bpp) '
SET @strSQL = @strSQL + 'SELECT e.entity_id, '
SET @strSQL = @strSQL + 'LEFT(a.file_as_name,35) as entity_desc, '
SET @strSQL = @strSQL + 'CASE WHEN ptd_multi_unit = ''A'' '
SET @strSQL = @strSQL + '    THEN ''County General Fund'' '
SET @strSQL = @strSQL + '    WHEN ptd_multi_unit IN (''B'',''C'') '
SET @strSQL = @strSQL + '    THEN LEFT(a.file_as_name,50) '
SET @strSQL = @strSQL + '    ELSE '''' '
SET @strSQL = @strSQL + '    END as fund_name, '
SET @strSQL = @strSQL + 'e.entity_type_cd, '
SET @strSQL = @strSQL + 'e.taxing_unit_num, '
SET @strSQL = @strSQL + 'ISNULL(e.ptd_multi_unit,''''), '
SET @strSQL = @strSQL + 'ptr.m_n_o_tax_pct as prev_yr_mno_rate, '
SET @strSQL = @strSQL + 'ptr.i_n_s_tax_pct as prev_yr_ins_rate, '
SET @strSQL = @strSQL + '0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 '

SET @strSQL = @strSQL + 'FROM entity as e '
SET @strSQL = @strSQL + 'WITH (NOLOCK) '

SET @strSQL = @strSQL + 'INNER JOIN account as a '
SET @strSQL = @strSQL + 'WITH (NOLOCK) '
SET @strSQL = @strSQL + 'ON e.entity_id = a.acct_id '

SET @strSQL = @strSQL + 'INNER JOIN tax_rate as ptr '
SET @strSQL = @strSQL + 'WITH (NOLOCK) '
SET @strSQL = @strSQL + 'ON e.entity_id = ptr.entity_id '
SET @strSQL = @strSQL + 'AND ptr.tax_rate_yr = ' + @prev_year + ' '

SET @strSQL = @strSQL + 'WHERE e.entity_id IN (' + @input_entity_ids + ') '

SET @strSQL = @strSQL + 'GROUP BY e.entity_id, a.file_as_name, e.entity_type_cd, e.taxing_unit_num, '
SET @strSQL = @strSQL + 'e.ptd_multi_unit, ptr.m_n_o_tax_pct, ptr.i_n_s_tax_pct '

exec (@strSQL)


/*
 * First get the previous year values.  This will be done by calling PopulateAppraisalTotals
 * as of sup_num X.  This logic is in Report_Dialog/PrintTotalsdlg.cpp::PopulateSuppCombo().
 */

declare @sup_num int
declare @last_sup_num int
declare @status_cd varchar(5)
declare @bFound bit

declare SUPPS CURSOR FAST_FORWARD
FOR SELECT DISTINCT sup_num, status_cd
	FROM supplement as s
	WITH (NOLOCK)
	INNER JOIN sup_group as sg
	WITH (NOLOCK)
	ON s.sup_group_id = sg.sup_group_id
	WHERE sup_tax_yr = @input_year - 1
	ORDER BY sup_num

OPEN SUPPS

FETCH NEXT FROM SUPPS INTO @sup_num, @status_cd

SET @bFound = 0
SET @last_sup_num = 0

WHILE @@FETCH_STATUS = 0 AND @bFound = 0
BEGIN
	IF @status_cd <> 'A' AND @status_cd <> 'BC'
	BEGIN
		SET @bFound = 1
	END
	ELSE
	BEGIN
		SET @last_sup_num = @sup_num
	END

	FETCH NEXT FROM SUPPS INTO @sup_num, @status_cd
END

CLOSE SUPPS
DEALLOCATE SUPPS

/*
 * Must clear the appraisal_totals tables as this might be a repeat export.
 */

exec PopulateAppraisalTotals 0, @input_pacs_user_id, 0, '', '', 1, @input_tnt_export_id

/*
 * Now populate appraisal_totals_criteria_entity and appraisal_totals_criteria_proptype
 */

DELETE FROM appraisal_totals_criteria_entity
WHERE pacs_user_id = @input_pacs_user_id

DELETE FROM appraisal_totals_criteria_proptype
WHERE pacs_user_id = @input_pacs_user_id

SET @strSQL = 'INSERT INTO appraisal_totals_criteria_entity '
SET @strSQL = @strSQL + '(pacs_user_id, entity_id, tnt_export_id) '
SET @strSQL = @strSQL + 'SELECT ' + CONVERT(varchar(10), @input_pacs_user_id) + ', entity_id, '
SET @strSQL = @strSQL + CONVERT(varchar(10), @input_tnt_export_id) + ' '
SET @strSQL = @strSQL + 'FROM entity '
SET @strSQL = @strSQL + 'WHERE entity_id IN (' + @input_entity_ids + ') '
exec (@strSQL)

INSERT INTO appraisal_totals_criteria_proptype
(pacs_user_id, prop_type_cd, tnt_export_id)
SELECT @input_pacs_user_id, LTRIM(prop_type_cd), @input_tnt_export_id
FROM property_type
WHERE prop_type_cd IN ('R', 'P', 'MH', 'MN', 'A')

declare @last_year int
SET @last_year = @input_year - 1

exec PopulateAppraisalTotals @last_year, @input_pacs_user_id, @last_sup_num, 'A', '', 1, @input_tnt_export_id

/*
 * Be careful, there may be more than 1 row for an entity due to arb_status.  Need the
 * sum total of both rows.
 */

UPDATE [dbo].[_tnt_export]
SET prev_yr_taxable_val = taxable_val
FROM (SELECT apt.entity_id, apt.pacs_user_id, apt.tnt_export_id,
	SUM(land_hstd_val + land_non_hstd_val + imprv_hstd_val + imprv_non_hstd_val + personal_val + mineral_val + auto_val + ag_market + timber_market + ISNULL(ag_market_ex,0) + ISNULL(timber_market_ex,0) - 
		ISNULL(productivity_loss,0) - ISNULL(ten_percent_cap,0) - ISNULL(total_exemption_amount,0)) as taxable_val
	FROM appraisal_totals as apt
	with (nolock)
	WHERE apt.tnt_export_id = @input_tnt_export_id
	AND apt.prop_val_yr = @last_year
	AND apt.arb_status in ('A','C')
	GROUP BY apt.tnt_export_id, apt.entity_id, apt.pacs_user_id) as at_temp
WHERE at_temp.pacs_user_id = @input_pacs_user_id
AND at_temp.entity_id = [dbo].[_tnt_export].entity_id

/*
 * 08/04/2005 - TNT rule change.  See page 16 in Truth-In-Taxation guide from the State,
 * bottom left paragraph, continues to top of right column.
 *
 * Ok, this is where it gets complicated.  Previously, only school districts could have
 * freezes on OV65* and DP exemptions.  However, now other entities can do this.  Since
 * 2005 is the first year it's possible, there's a few possibilities.
 *
 * Previously, everything went off the totals report data, but now that's not possible due
 * to this new rule.  The key is entity_exmpt.freeze_flag.  Here are the different possibilities:
 *
 * 1. freeze_flag = 0:  Ok, no freezes, this should result in 0 freeze taxable value, which is
 *    what all _tnt_export rows are initialized with, so no update is necessary.
 *
 * 2. first time freeze_flag = 1:  Ok, using 2005 as current year and 2004 as previous year.  If
 *    2005 has freeze_flag = 1 and 2004 has freeze_flag = 0, this is the first time the entity
 *    has allowed freezes.  However, the reports need the freeze values for 2004.  So they must
 *    be determined even if that year did NOT do them.  This is done by taking all 2005 properties
 *    that have freezes and figuring out the 2004 taxable value for them.  The totals report does
 *    not do this so it must be done manually.
 *
 * 3. normal freeze_flag = 1:  If the current year is 2005 and the previous year is 2004, and
 *    freeze_flag = 1 for both, then can use the totals report figures as it handles this properly.
 *
 * The way this is going to be done is that the normal update will be done first, then if there
 * are items in situation 2, they will update again and override the first update.
 */

UPDATE [dbo].[_tnt_export]
SET prev_yr_freeze_taxable_val = freeze_taxable_val,
	prev_yr_actual_tax = actual_tax
FROM (SELECT atf.entity_id, atf.pacs_user_id, atf.tnt_export_id,
	SUM(isnull(atf.freeze_taxable,0)) as freeze_taxable_val,
	SUM(isnull(atf.actual_tax,0)) as actual_tax
	FROM appraisal_totals_freezes as atf
	with (nolock)
	WHERE atf.tnt_export_id = @input_tnt_export_id
	AND atf.prop_val_yr = @last_year
	AND atf.arb_status in ('A','C')
	GROUP BY atf.tnt_export_id, atf.entity_id, atf.pacs_user_id) as at_temp
WHERE at_temp.pacs_user_id = @input_pacs_user_id
AND at_temp.entity_id = [dbo].[_tnt_export].entity_id

update [dbo].[_tnt_export]
set prev_yr_freeze_taxable_val = freeze_taxable_val
from (select poev.entity_id, sum(poev.taxable_val - (poev.ag_use_val + 
							    poev.timber_use + 
							    poev.imprv_non_hstd_val + 
							    poev.land_non_hstd_val)
) as freeze_taxable_val
from prop_owner_entity_val as poev
with (nolock)
join prop_supp_assoc as psa
with (nolock)
on poev.prop_id = psa.prop_id
and poev.sup_yr = psa.owner_tax_yr
and poev.sup_num = psa.sup_num
join property_val as pv
with (nolock)
on poev.prop_id = pv.prop_id
and poev.sup_yr = pv.prop_val_yr
and poev.sup_num = pv.sup_num
and pv.prop_inactive_dt is null
join entity as e
with (nolock)
on poev.entity_id = e.entity_id
where sup_yr = @last_year
and poev.prop_id in
(
	select pf.prop_id
	from property_freeze pf 
	with (nolock)
	join entity e 
	with (nolock) 
	on pf.entity_id = e.entity_id
	join property_val pv05 
	with (nolock) 
	on pf.prop_id = pv05.prop_id
	and pf.exmpt_tax_yr = pv05.prop_val_yr
	and pf.sup_num = pv05.sup_num
	and pf.owner_tax_yr = pv05.prop_val_yr
	and pv05.prop_inactive_dt is null
	where pf.exmpt_tax_yr = @input_year
	and pf.use_freeze = 'T'
	and e.entity_id = poev.entity_id
)
group by poev.entity_id) as frz_temp
where frz_temp.entity_id = [dbo].[_tnt_export].entity_id

/*
 * Next run calculate taxable to make sure the values are up to date,
 * BUT only if the year has NOT been certified!
 */

IF EXISTS(SELECT tax_yr FROM pacs_year WHERE tax_yr = @input_year AND certification_dt IS NULL)
BEGIN
	exec CalculateTaxable @input_entity_ids, 0, @input_year, 0, '', 0, 0
END

/*
 * Next run the populate appraisal totals for the current year and with the effective
 * tax rate assumptions flag set.
 */

exec PopulateAppraisalTotals 0, @input_pacs_user_id, 0, '', '', 0, 0
exec PopulateAppraisalTotals @input_year, @input_pacs_user_id, 0, 'P', '', 0, @input_tnt_export_id

UPDATE [dbo].[_tnt_export]
SET curr_yr_taxable_val = taxable_val,
	curr_yr_under_arb_review = under_arb_review,
	curr_yr_tif_taxable = tif_taxable

FROM (SELECT apt.entity_id, apt.pacs_user_id,
		SUM(land_hstd_val + land_non_hstd_val + imprv_hstd_val + imprv_non_hstd_val + personal_val + mineral_val + auto_val + ag_market + timber_market + ISNULL(ag_market_ex,0) + ISNULL(timber_market_ex, 0) - ISNULL(productivity_loss,0) - 
		ISNULL(ten_percent_cap,0) - ISNULL(total_exemption_amount,0)) as taxable_val,
		SUM(CASE WHEN apt.arb_status = 'A' 
				THEN land_hstd_val + land_non_hstd_val + imprv_hstd_val + imprv_non_hstd_val + personal_val + mineral_val + auto_val + ag_market + timber_market + ISNULL(ag_market_ex,0) + ISNULL(timber_market_ex,0) 
					- ISNULL(productivity_loss,0) - ISNULL(ten_percent_cap,0) - ISNULL(total_exemption_amount,0)
				ELSE 0
				END) as under_arb_review,
		SUM(tax_increment_loss) as tif_taxable
		FROM appraisal_totals as apt
		with (nolock)
		WHERE apt.tnt_export_id = @input_tnt_export_id
		AND apt.pacs_user_id = @input_pacs_user_id
		AND apt.prop_val_yr = @input_year
		AND apt.arb_status in ('A','C')
		GROUP BY apt.entity_id, apt.pacs_user_id) as at_temp
WHERE at_temp.pacs_user_id = @input_pacs_user_id
AND at_temp.entity_id = [dbo].[_tnt_export].entity_id

-- get under_arb_review from protest value table now
-- 7/12/06 - This wasn't right... it's the market value under ARB review
-- and curr_yr_under_arb_review needs to be taxable value
--UPDATE [dbo].[_tnt_export]
--set curr_yr_under_arb_review = under_arb_review
--
--from (SELECT apt.entity_id, apt.pacs_user_id,
--		sum(protest_value) as under_arb_review
--
--		FROM appraisal_totals_protest_value as apt with (nolock)
--
--		WHERE apt.tnt_export_id = @input_tnt_export_id
--		AND apt.pacs_user_id = @input_pacs_user_id
--		AND apt.prop_val_yr = @input_year
--		GROUP BY apt.entity_id, apt.pacs_user_id ) as at_temp
--WHERE at_temp.pacs_user_id = @input_pacs_user_id
--AND at_temp.entity_id = [dbo].[_tnt_export].entity_id


UPDATE [dbo].[_tnt_export]
SET curr_yr_freeze_taxable_val = freeze_taxable_val,
	curr_yr_actual_tax = actual_tax

FROM (SELECT atf.entity_id, atf.pacs_user_id, atf.tnt_export_id,
		SUM(isnull(atf.freeze_taxable,0)) as freeze_taxable_val,
		SUM(isnull(atf.actual_tax,0)) as actual_tax
		FROM appraisal_totals_freezes as atf
		with (nolock)
		WHERE atf.tnt_export_id = @input_tnt_export_id
		AND atf.pacs_user_id = @input_pacs_user_id
		AND atf.prop_val_yr = @input_year
		AND atf.arb_status in ('A','C')
		GROUP BY atf.tnt_export_id, atf.entity_id, atf.pacs_user_id) as at_temp
WHERE at_temp.pacs_user_id = @input_pacs_user_id
AND at_temp.entity_id = [dbo].[_tnt_export].entity_id


UPDATE [dbo].[_tnt_export]
SET curr_yr_value_lost_new_exemptions = value_lost_new_exemptions,
	curr_yr_absolute_market_exemptions = absolute_market_exemptions,
	curr_yr_partial_exemptions = partial_exemptions,
	curr_yr_pollution_control_exemptions = pollution_control_exemptions
FROM (SELECT entity_id, pacs_user_id,
	  SUM(value_loss) as value_lost_new_exemptions,
	  SUM(last_year_absolute_mkt) as absolute_market_exemptions,
	  SUM(this_year_exmpt_amt) as partial_exemptions,
	  SUM(CASE WHEN exmpt_type_cd = 'PC'
				THEN this_year_exmpt_amt
				ELSE 0
				END) as pollution_control_exemptions
	  FROM appraisal_totals_new_exemptions
	  WHERE prop_val_yr = @input_year
	  AND pacs_user_id = @input_pacs_user_id
	  AND tnt_export_id = @input_tnt_export_id
	  GROUP BY entity_id, pacs_user_id) as at_temp
WHERE at_temp.pacs_user_id = @input_pacs_user_id
AND at_temp.entity_id = [dbo].[_tnt_export].entity_id

UPDATE [dbo].[_tnt_export]
SET curr_yr_ag_lost_market = ISNULL(last_year_prod_mkt,0),
	curr_yr_ag_exempt_amount = ISNULL(this_year_prod_use,0),
	curr_yr_value_lost_new_ag = value_loss
FROM appraisal_totals_new_ag as atna
WHERE atna.prop_val_yr = @input_year
AND atna.pacs_user_id = @input_pacs_user_id
AND atna.entity_id = [dbo].[_tnt_export].entity_id
AND atna.tnt_export_id = @input_tnt_export_id

UPDATE [dbo].[_tnt_export]
SET curr_yr_annexations = taxable_value
FROM appraisal_totals_new_annex as atna
WHERE atna.prop_val_yr = @input_year
AND atna.pacs_user_id = @input_pacs_user_id
AND atna.entity_id = [dbo].[_tnt_export].entity_id
AND atna.tnt_export_id = @input_tnt_export_id

UPDATE [dbo].[_tnt_export]
SET curr_yr_value_new_improvements_bpp = new_taxable_value
FROM (SELECT entity_id, pacs_user_id,
		SUM(new_taxable_value) as new_taxable_value
		FROM appraisal_totals_new_value as atnv
		WHERE prop_val_yr = @input_year
		AND pacs_user_id = @input_pacs_user_id
		AND tnt_export_id = @input_tnt_export_id
		GROUP BY entity_id, pacs_user_id) as at_temp
WHERE at_temp.pacs_user_id = @input_pacs_user_id
AND at_temp.entity_id = [dbo].[_tnt_export].entity_id

/*
 * Now, in case there are no rows for entities in these other tables,
 * make sure there aren't any NULL values
 */

UPDATE [dbo].[_tnt_export]
SET curr_yr_value_lost_new_exemptions = ISNULL(curr_yr_value_lost_new_exemptions, 0),
	curr_yr_absolute_market_exemptions = ISNULL(curr_yr_absolute_market_exemptions, 0),
	curr_yr_partial_exemptions = ISNULL(curr_yr_partial_exemptions, 0),
	curr_yr_pollution_control_exemptions = ISNULL(curr_yr_pollution_control_exemptions, 0),
	curr_yr_ag_lost_market = ISNULL(curr_yr_ag_lost_market,0),
	curr_yr_ag_exempt_amount = ISNULL(curr_yr_ag_exempt_amount,0),
	curr_yr_value_lost_new_ag = ISNULL(curr_yr_value_lost_new_ag,0),
	curr_yr_annexations = ISNULL(curr_yr_annexations,0),
	curr_yr_value_new_improvements_bpp = ISNULL(curr_yr_value_new_improvements_bpp,0)

GO

