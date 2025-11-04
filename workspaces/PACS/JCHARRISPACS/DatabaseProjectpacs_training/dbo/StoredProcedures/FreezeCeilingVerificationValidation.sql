




create procedure FreezeCeilingVerificationValidation
	@run_id int
as



--	This procedure is for validation of freeze ceilings that will be
--	calculated for the selected year for the freeze ceiling run.

--	NOTE:	report_sort_order exists primarily for sorting of reports and queries.
--		While there is no specific scheme for assigning values to report_sort_order,
--		the intent was to try to group similar types of situations together by using
--		a common value:
--			100-199 are Wizard validation issues
--			200-299 are system-related freeze ceiling validation issues
--			300-399 are property-related validation issues
--			400-499 are supplement validation issues
--			500-599 are entity validation issues
--			600-699 are exemption / qualify year validation issues
--			700-799 are calculation-related validation issues
--			800-899 are used to indicate that a freeze ceiling will be calculated
--
--		The values are also being assigned in the order processed, so it will be
--		easier to identify the order of processing the validation.  Also, there are
--		intentional gaps within each grouping so that new values may be easily
--		inserted, if desired.


-- Is any action indicated?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 0,
	action_message  = 'No action indicated.',
	report_sort_order = 110,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	isnull(detail.missing_freeze, 0) = 0
and	isnull(detail.qualify_year_freeze, 0) = 0
where
	fcr.run_id = @run_id



-- Is a freeze offered for the entity / exemption?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Freeze Ceiling is not offered by Entity for this Freeze Type.',
	report_sort_order = 200,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	isnull(detail.freeze_flag, 0) <> 1
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id




-- Have the tax rates been set for the previous year so that the freeze can be calculated?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Tax Rates are not set for the previous Tax Year.',
	report_sort_order = 220,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	isnull(prev_yr_m_n_o_tax_pct, 0.0) = 0.0
and	isnull(prev_yr_i_n_s_tax_pct, 0.0) = 0.0
and	detail.qualify_year_freeze = 1
where
	fcr.run_id = @run_id



-- Does the property exist in the previous year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Property does not exist for the previous Tax Year.',
	report_sort_order = 310,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.prev_yr_tax_yr is null
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Has the property been supplemented and not accepted?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Property is in a non-accepted supplement for the Tax Year.',
	report_sort_order = 400,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	isnull(detail.sup_status, '') not in ('', 'A', 'BC')
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Has the property been supplemented and not accepted in the previous year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Property is in a non-accepted supplement for the previous Tax Year.',
	report_sort_order = 410,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.prev_yr_sup_status in ('C', 'P', 'L', 'TO')
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Is the entity associated with the property?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Entity is not on property for the Tax Year.',
	report_sort_order = 500,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.entity_id <> isnull(detail.curr_yr_entity_id, -1)
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Is the entity associated with the property in the previous tax year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Entity is not on property for the previous Tax Year.',
	report_sort_order = 510,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.entity_id <> isnull(detail.prev_yr_entity_id, -1)
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Does the exemption exist on the property?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Exemption is not on property for the Tax Year.',
	report_sort_order = 600,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.freeze_type <> isnull(detail.exmpt_type_cd, '')
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Does the exemption have a qualify year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Qualify Year for the Exemption is missing.',
	report_sort_order = 610,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.qualify_yr is null
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Is the qualify year for the exemption in the future?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Qualify Year for the Exemption is equal to or greater than the Tax Year.',
	report_sort_order = 620,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.qualify_yr >= detail.tax_yr
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Does the exemption exist on the property in the previous year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Exemption is not on property for the previous Tax Year.',
	report_sort_order = 640,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.freeze_type <> isnull(detail.prev_yr_exmpt_type_cd, '')
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Does the qualify year for the exemption in the tax year match the qualify year
-- for the exemption in the previous tax year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Qualify Year for the Exemption is not equal to Qualify Year in the previous Tax Year.',
	report_sort_order = 650,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.qualify_yr <> isnull(detail.prev_yr_qualify_yr, case when detail.owner_id = detail.prev_yr_owner_id then detail.qualify_yr else -1 end)
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Does the freeze information exist in the previous year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Freeze Ceiling does not exist in the Previous Tax Year.',
	report_sort_order = 670,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and
(
	isnull(detail.prev_yr_use_freeze, '') <> 'T'
or	isnull(detail.prev_yr_freeze_ceiling, -1.0) < 0.0
or	isnull(detail.prev_yr_freeze_yr, -1) <= 0
)
and	detail.missing_freeze = 1
where
	fcr.run_id = @run_id



/*
-- Does the information needed to perform the calculation exist?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Tax Year info not available for freeze ceiling calculation.',
	report_sort_order = 700,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.land_hstd_val is null
and	detail.imprv_hstd_val is null
and	detail.ten_percent_cap is null
and	
(
	detail.missing_freeze = 1	-- needed for update of poev.freeze_assessed_value and poev.freeze_taxable_value
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id




*/
-- Does the previous year information needed to perform the calculation exist?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Previous Tax Year info not available for freeze ceiling calculation.',
	report_sort_order = 710,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.prev_yr_land_hstd_val is null
and	detail.prev_yr_imprv_hstd_val is null
and	detail.prev_yr_ten_percent_cap is null
and	detail.qualify_year_freeze = 1
where
	fcr.run_id = @run_id




-- Do the exemption amounts exist for the selected year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Tax Year exemption amount info not available.',
	report_sort_order = 720,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.local_exemption_amt is null
and	detail.state_exemption_amt is null
and
(
	detail.missing_freeze = 1	-- needed for update of poev.freeze_assessed_value and poev.freeze_taxable_value
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Do the exemption amounts exist for the previous year?
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 1,
	action_message = 'Previous Tax Year exemption amount info not available.',
	report_sort_order = 730,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.prev_yr_local_exemption_amt is null
and	detail.prev_yr_state_exemption_amt is null
and	detail.qualify_year_freeze = 1
where
	fcr.run_id = @run_id



-- Anything left over should have a calculated freeze ceiling.
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 2,
	action_message = 'Freeze Ceiling calculated.',
	report_sort_order = 800
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id



-- Is the entity flagged for freeze ceiling calculation
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 3,
	action_message = 'Freeze Ceiling calculation is not enabled for the entity.',
	report_sort_order = 830
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator = 2
and	isnull(detail.enable_freeze_ceiling_calculation, 0) = 0
where
	fcr.run_id = @run_id



-- Existing freezes that have the freeze_override flag set should not be overriden with the calculated freeze ceiling.
update
	freeze_ceiling_verification_run_detail
set
	action_indicator = 3,
	action_message = 'Freeze Ceiling calculated but not applied because of freeze override flag.',
	report_sort_order = 840
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator = 2
and	detail.freeze_override = 1
and
(
	detail.missing_freeze = 1
or	detail.qualify_year_freeze = 1
)
where
	fcr.run_id = @run_id

GO

