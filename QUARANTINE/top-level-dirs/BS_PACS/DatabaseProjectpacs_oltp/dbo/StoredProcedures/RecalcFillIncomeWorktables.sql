
create procedure RecalcFillIncomeWorktables
	@lYear numeric(4,0),
	@lSupNum int,
	@lUniquePacsUserID bigint
as

set nocount on

-- Fill these income worktables with all the income valuations for the given year and sup num.
-- Normally, this is done by RecalcSelectProperties, but that stored procedure is never called
-- for a full recalc run that is not large enough to be subdivided.  PACS will now call this
-- stored procedure instead in that circumstance. (bug 18958)

truncate table #recalc_worktable_income_id_assoc
truncate table #recalc_worktable_income_prop_assoc

declare @bRecalcIncome bit
set @bRecalcIncome = 0

-- Populate income worktables
insert #recalc_worktable_income_id_assoc (income_yr, sup_num, income_id)

select distinct ipa.prop_val_yr income_yr, ipa.sup_num, ipa.income_id
from income_prop_assoc ipa with(nolock)
where ipa.prop_val_yr = @lYear
and ipa.sup_num = @lSupNum

union

select distinct ilda.income_yr, ilda.sup_num, ilda.income_id
from income_land_detail_assoc ilda with(nolock)
join property_val pv with(nolock) 
on pv.prop_val_yr = ilda.income_yr
and pv.sup_num = ilda.sup_num
and pv.prop_id = ilda.prop_id
and (pv.prop_inactive_dt is null or pv.udi_parent = 'T')
where pv.prop_val_yr = @lYear
and pv.sup_num = @lSupNum


if ( @@rowcount > 0 )
begin
	set @bRecalcIncome = 1

	insert #recalc_worktable_income_prop_assoc (prop_val_yr, sup_num, prop_id)
	select distinct t.income_yr, t.sup_num, ipa.prop_id
	from #recalc_worktable_income_id_assoc t with(nolock)
	join income_prop_assoc ipa with(nolock) 
	on t.income_yr = ipa.prop_val_yr
	and t.sup_num = ipa.sup_num
	and t.income_id = ipa.income_id	
end


-- insert records in permanent tables for post-calculation cleanup
if ( @bRecalcIncome = 1 )
begin
	delete recalc_income_list_current_division
	where pacs_user_id = @lUniquePacsUserID
	
	insert recalc_income_list_current_division (income_yr, sup_num, income_id, pacs_user_id)
	select distinct t.income_yr, t.sup_num, t.income_id, @lUniquePacsUserID
	from #recalc_worktable_income_id_assoc as t with(nolock)
end

GO

