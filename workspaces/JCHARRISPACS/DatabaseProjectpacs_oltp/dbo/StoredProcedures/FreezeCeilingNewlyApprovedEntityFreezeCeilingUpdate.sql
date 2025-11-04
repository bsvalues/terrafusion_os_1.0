




create procedure FreezeCeilingNewlyApprovedEntityFreezeCeilingUpdate
	@run_id int,
	@user_id int
as


-- Update existing property_freeze rows with the newly calculated freeze information
update
	property_freeze
set
	use_freeze = 'T',
	freeze_ceiling = detail.calculated_freeze_ceiling,
	freeze_yr = detail.calculated_freeze_yr,
	freeze_override = 0,
	pacs_freeze = 'T',
	pacs_freeze_date = getdate(),
	pacs_freeze_ceiling = detail.calculated_freeze_ceiling,
	pacs_freeze_run = detail.run_id
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator = 2
and	detail.freeze_sup_num is not null
and	detail.calculated_freeze_ceiling is not null
and	detail.calculated_freeze_yr is not null
inner join
	property_freeze as pf with (nolock)
on
	pf.prop_id = detail.prop_id
and	pf.owner_id = detail.owner_id
and	pf.entity_id = detail.entity_id
and	pf.owner_tax_yr = detail.tax_yr
and	pf.exmpt_tax_yr = detail.tax_yr
and	pf.sup_num = detail.freeze_sup_num
and	ltrim(rtrim(pf.exmpt_type_cd)) = detail.freeze_type
and	isnull(pf.freeze_override, 0) = 0	-- This isn't really necessary at this point, as action_indicator = 2 assures us that freeze_override = 0
where
	fcr.run_id = @run_id



-- Create new property_freeze rows, if necessary, for the newly calculated freeze information
insert into
	property_freeze
(
	prop_id,
	owner_id,
	entity_id,
	owner_tax_yr,
	exmpt_tax_yr,
	sup_num,
	exmpt_type_cd,
	use_freeze,
	freeze_ceiling,
	freeze_yr,
	pacs_freeze,
	pacs_freeze_date,
	pacs_freeze_ceiling,
	pacs_freeze_run,
	freeze_override
)
select
	detail.prop_id,
	detail.owner_id,
	detail.entity_id,
	detail.tax_yr,
	detail.tax_yr,
	detail.freeze_sup_num,
	detail.freeze_type,
	'T',
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr,
	'T',
	getdate(),
	detail.calculated_freeze_ceiling,
	detail.run_id,
	0
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator = 2
and	detail.freeze_sup_num is not null
and	detail.calculated_freeze_ceiling is not null
and	detail.calculated_freeze_yr is not null
where
	fcr.run_id = @run_id
and	not exists
(
	select
		*
	from
		property_freeze as pf with (nolock)
	where
		pf.prop_id = detail.prop_id
	and	pf.owner_id = detail.owner_id
	and	pf.entity_id = detail.entity_id
	and	pf.owner_tax_yr = detail.tax_yr
	and	pf.exmpt_tax_yr = detail.tax_yr
	and	pf.sup_num = detail.freeze_sup_num
	and	ltrim(rtrim(pf.exmpt_type_cd)) = detail.freeze_type
)



-- Update prop_owner_entity_val rows with newly calculated freeze information.
-- NOTE:  There might not be a poev row if the information is in a 'non-accepted'
--	  supplement status.
update
	prop_owner_entity_val
set
	freeze_type = replace(detail.freeze_type, 'OV65S', 'OV65'),
	freeze_ceiling = detail.calculated_freeze_ceiling,
	freeze_yr = detail.calculated_freeze_yr,
	frz_taxable_val = isnull(detail.calculated_freeze_taxable_amount, 0),
	frz_assessed_val = isnull(detail.calculated_freeze_assessed_amount, 0),
	transfer_flag = 'F',
	transfer_pct = 0,
	transfer_freeze_assessed = 0,
	transfer_freeze_taxable = 0,
	transfer_entity_taxable = 0,
	transfer_taxable_adjustment = 0
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator = 2
and	detail.freeze_sup_num is not null
and	detail.calculated_freeze_ceiling is not null
and	detail.calculated_freeze_yr is not null
inner join
	prop_owner_entity_val as poev with (nolock)
on
	poev.prop_id = detail.prop_id
and	poev.owner_id = detail.owner_id
and	poev.entity_id = detail.entity_id
and	poev.sup_yr = detail.tax_yr
and	poev.sup_num = detail.freeze_sup_num
where
	fcr.run_id = @run_id



update
	entity_exmpt
set
	set_initial_freeze_date = getdate(),
	set_initial_freeze_user_id = @user_id
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_run_entity_freeze_type as fcreft with (nolock)
on
	fcreft.run_id = fcr.run_id
inner join
	entity_exmpt as ee with (nolock)
on
	ee.entity_id = fcreft.entity_id
and	ltrim(rtrim(ee.exmpt_type_cd)) = fcreft.freeze_type
and	ee.exmpt_tax_yr >= fcr.year
and	ee.freeze_flag = 1
and	ee.set_initial_freeze_date is null
where
	fcr.run_id = @run_id



-- Recalculate any supplemented properties
declare @recalc_year numeric(4,0)
declare @recalc_sup_num int


declare RECALC scroll cursor
for
select
	year,
	sup_num
from
	freeze_ceiling_run_supplement with (nolock)
where
	run_id = @run_id


open RECALC
fetch next from RECALC
into
	@recalc_year,
	@recalc_sup_num


while (@@fetch_status = 0)
begin
	exec RecalcProperty 0, @recalc_year, @recalc_sup_num

	fetch next from RECALC
	into
		@recalc_year,
		@recalc_sup_num
end

close RECALC
deallocate RECALC

GO

