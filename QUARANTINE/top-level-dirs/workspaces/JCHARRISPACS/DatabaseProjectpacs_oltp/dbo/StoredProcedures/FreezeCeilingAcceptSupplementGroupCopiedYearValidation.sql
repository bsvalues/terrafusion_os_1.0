




create procedure FreezeCeilingAcceptSupplementGroupCopiedYearValidation
	@run_id int
as


--	This procedure is for validation of freeze ceilings that have been
--	copied to the year after the selected year for the freeze ceiling
--	run.  Since there is no calculation being performed, the primary
--	validations are (1) to make sure that a freeze ceiling is offered by
--	an entity in the year; and (2) that the property is still eligible
--	for the freeze ceiling in the year.

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


-- Is a freeze offered for the entity / exemption?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Freeze Ceiling is not offered by Entity for this Freeze Type',
	report_sort_order = 200,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	isnull(detail.freeze_flag, 0) <> 1
where
	fcr.run_id = @run_id



-- Does the property exist?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Property does not exist.',
	report_sort_order = 300,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and
(
	isnull(detail.prop_id, -1) < 0
or	isnull(detail.owner_id, -1) < 0
or	isnull(detail.tax_yr, -1) < 0
or	isnull(detail.sup_num, -1) < 0
)
where
	fcr.run_id = @run_id
	

-- Has the property been supplemented and not accepted?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Property is in a non-accepted supplement for the Tax Year.',
	report_sort_order = 400,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	isnull(detail.sup_status, '') not in ('', 'A', 'BC')
where
	fcr.run_id = @run_id



-- Is the entity associated with the property?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Entity is not on property for the Tax Year.',
	report_sort_order = 500,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.entity_id <> isnull(detail.curr_yr_entity_id, -1)
where
	fcr.run_id = @run_id



-- Does the exemption exist on the property?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Exemption is not on property for the Tax Year.',
	report_sort_order = 600,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.freeze_type <> isnull(detail.exmpt_type_cd, '')
where
	fcr.run_id = @run_id



-- Does the exemption have a qualify year?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Qualify Year for the Exemption is missing.',
	report_sort_order = 610,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.qualify_yr is null
where
	fcr.run_id = @run_id



-- Is the qualify year for the exemption in the future?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Qualify Year for the Exemption is equal to or greater than the Tax Year.',
	report_sort_order = 620,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.qualify_yr >= detail.tax_yr
where
	fcr.run_id = @run_id



-- Does the qualify year for the exemption in the tax year match the qualify year
-- for the exemption in the previous tax year?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 1,
	action_message = 'Qualify Year for the Exemption is not equal to Qualify Year in the previous Tax Year.',
	report_sort_order = 650,
	calculated_freeze_ceiling = null,
	calculated_freeze_yr = null
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.qualify_yr <> isnull(detail.prev_yr_qualify_yr, case when detail.owner_id = detail.prev_yr_owner_id then detail.qualify_yr else -1 end)
where
	fcr.run_id = @run_id



-- Anything left over should have a calculated freeze ceiling.
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 2,
	action_message = 'Freeze Ceiling copied forward.',
	report_sort_order = 810
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
where
	fcr.run_id = @run_id



-- Has the freeze ceiling information changed?
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 2,
	action_message = 'Freeze Ceiling information unchanged.',
	report_sort_order = 820
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator = 2
and	isnull(detail.use_freeze, 'F') = 'T'
and	isnull(detail.freeze_ceiling, -1.0) = detail.calculated_freeze_ceiling
and	isnull(detail.freeze_yr, -1) = detail.calculated_freeze_yr
where
	fcr.run_id = @run_id



-- Is the entity flagged for freeze ceiling calculation
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 3,
	action_message = 'Freeze Ceiling calculation is not enabled for the entity.',
	report_sort_order = 830
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator = 2
and	isnull(detail.enable_freeze_ceiling_calculation, 0) = 0
where
	fcr.run_id = @run_id



-- Existing freezes that have the freeze_override flag set should not be overriden with the calculated freeze ceiling.
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	action_indicator = 3,
	action_message = 'Freeze Ceiling not applied because of freeze override flag.',
	report_sort_order = 840
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator = 2
and	detail.freeze_override = 1
where
	fcr.run_id = @run_id

GO

