
create procedure CopyIncomeScheduleGRMGIM

	@old_year numeric(4,0),
	@old_prop_type_cd varchar(10),
	@old_class_cd varchar(10),
	@old_econ_cd varchar(10),
	@old_level_cd varchar(10),
	@new_year numeric(4,0),
	@new_prop_type_cd varchar(10),
	@new_class_cd varchar(10),
	@new_econ_cd varchar(10),
	@new_level_cd varchar(10)

as

set nocount on

insert income_sched_grm_gim
([year], prop_type_cd, class_cd, econ_cd, level_cd,
 potential_gross_income_annual, potential_gross_income_monthly,
 gross_income_multiplier, gross_rent_multiplier)

select @new_year, @new_prop_type_cd, @new_class_cd, @new_econ_cd, @new_level_cd,
	potential_gross_income_annual, potential_gross_income_monthly,
	gross_income_multiplier, gross_rent_multiplier
from income_sched_grm_gim
where [year] = @old_year
and prop_type_cd = @old_prop_type_cd
and class_cd = @old_class_cd
and econ_cd = @old_econ_cd
and level_cd = @old_level_cd

GO

