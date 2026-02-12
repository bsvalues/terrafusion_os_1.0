




create procedure FreezeCeilingVerificationSupplement
	@run_id int
as



update
	freeze_ceiling_verification_run_detail
set
	supplement_prop_id = detail.prop_id,
	udi_supplement = 'F',
	freeze_sup_num = fcrs.sup_num
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_run_supplement as fcrs with (nolock)
on
	fcrs.run_id = fcr.run_id
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcrs.year
and	detail.action_indicator = 2
and	detail.calculated_freeze_ceiling is not null
and	detail.calculated_freeze_yr is not null
and
(
	isnull(detail.use_freeze, 'F') <> 'T'
or	isnull(detail.freeze_ceiling, -1.0) <> detail.calculated_freeze_ceiling
or	isnull(detail.freeze_yr, -1) <> detail.calculated_freeze_yr
)
and	detail.sup_status in ('A', 'BC')
and	detail.udi_parent_prop_id is null
where
	fcr.run_id = @run_id



update
	freeze_ceiling_verification_run_detail
set
	supplement_prop_id = detail.prop_id,
	udi_supplement = 'F',
	freeze_sup_num = fcrs.sup_num
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_run_supplement as fcrs with (nolock)
on
	fcrs.run_id = fcr.run_id
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcrs.year
and	detail.sup_status in ('A', 'BC')
and	detail.action_indicator = 2
and	detail.calculated_freeze_ceiling is not null
and	detail.calculated_freeze_yr is not null
and
(
	isnull(detail.use_freeze, 'F') <> 'T'
or	isnull(detail.freeze_ceiling, -1.0) <> detail.calculated_freeze_ceiling
or	isnull(detail.freeze_yr, -1) <> detail.calculated_freeze_yr
)
and	detail.udi_parent_prop_id is not null
and	detail.udi_status = 'S'
where
	fcr.run_id = @run_id



update
	freeze_ceiling_verification_run_detail
set
	supplement_prop_id = detail.udi_parent_prop_id,
	udi_supplement = 'T',
	freeze_sup_num = fcrs.sup_num
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_run_supplement as fcrs with (nolock)
on
	fcrs.run_id = fcr.run_id
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcrs.year
and	detail.sup_status in ('A', 'BC')
and	detail.action_indicator = 2
and	detail.calculated_freeze_ceiling is not null
and	detail.calculated_freeze_yr is not null
and
(
	isnull(detail.use_freeze, 'F') <> 'T'
or	isnull(detail.freeze_ceiling, -1.0) <> detail.calculated_freeze_ceiling
or	isnull(detail.freeze_yr, -1) <> detail.calculated_freeze_yr
)
and	detail.udi_parent_prop_id is not null
and	isnull(detail.udi_status, '') <> 'S'
where
	fcr.run_id = @run_id


	
declare SUPPLEMENT cursor
for
select
	detail.supplement_prop_id,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_sup_num,
	fcr.sup_cd,
	fcr.sup_desc,
	detail.udi_supplement,
	detail.prop_type_cd
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_run_supplement as fcrs with (nolock)
on
	fcrs.run_id = fcr.run_id
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcrs.run_id
and	detail.tax_yr = fcrs.year
and	detail.freeze_sup_num = fcrs.sup_num
and	detail.action_indicator = 2
where
	fcr.run_id = @run_id
group by
	detail.supplement_prop_id,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_sup_num,
	fcr.sup_cd,
	fcr.sup_desc,
	detail.udi_supplement,
	detail.prop_type_cd



declare @supplement_prop_id int
declare @tax_yr numeric(4,0)
declare @sup_num int
declare @freeze_sup_num int
declare @sup_cd varchar(10)
declare @sup_desc varchar(500)
declare @udi_supplement char(1)
declare @prop_type_cd varchar(5)


open SUPPLEMENT
fetch next from SUPPLEMENT
into
	@supplement_prop_id,
	@tax_yr,
	@sup_num,
	@freeze_sup_num,
	@sup_cd,
	@sup_desc,
	@udi_supplement,
	@prop_type_cd

while (@@fetch_status = 0)
begin
	exec PropertySupplement_CreatePropertySupplement @supplement_prop_id, @sup_num, @tax_yr, @freeze_sup_num, @tax_yr, @supplement_prop_id, 'T', '', 0, @udi_supplement
	
	-- UDI Child
	update
		property_val
	set
		sup_cd = @sup_cd,
		sup_desc = @sup_desc,
		sup_action = 'M',
		sup_dt = GetDate()
	where
		udi_parent_prop_id = @supplement_prop_id
	and	prop_val_yr = @tax_yr
	and	sup_num = @freeze_sup_num
	
	
	-- UDI Parent
	update
		property_val
	set
		sup_cd = @sup_cd,
		sup_desc = @sup_desc,
		sup_action = 'D',
		sup_dt = GetDate()
	where
		prop_id = @supplement_prop_id
	and	isnull(udi_parent, '') in ('T', 'D')
	and	prop_val_yr = @tax_yr
	and	sup_num = @freeze_sup_num
	
	
	-- Non-UDI
	update
		property_val
	set
		sup_cd = @sup_cd,
		sup_desc = @sup_desc,
		sup_action = 'M',
		sup_dt = GetDate()
	where
		prop_id = @supplement_prop_id
	and	isnull(udi_parent, '') = ''
	and	isnull(udi_parent_prop_id, -1) = -1
	and	prop_val_yr = @tax_yr
	and	sup_num = @freeze_sup_num
	

	fetch next from SUPPLEMENT
	into
		@supplement_prop_id,
		@tax_yr,
		@sup_num,
		@freeze_sup_num,
		@sup_cd,
		@sup_desc,
		@udi_supplement,
		@prop_type_cd
end


close SUPPLEMENT
deallocate SUPPLEMENT

GO

