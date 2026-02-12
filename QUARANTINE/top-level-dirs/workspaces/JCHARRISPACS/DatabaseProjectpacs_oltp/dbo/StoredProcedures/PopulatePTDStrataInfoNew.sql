

CREATE procedure PopulatePTDStrataInfoNew

@input_yr numeric(4),
@entity_id int,
@state_cd varchar(2)

with recompile
as

set nocount on

---------------------------------------------------------
--Stratum Calculation Procedure for School Districts
---------------------------------------------------------
declare @appraised_val numeric(14)
declare @target_val_stratum_1 numeric(14)
declare @target_val_stratum_2 numeric(14)
declare @target_val_stratum_3 numeric(14)
declare @target_val_stratum_4 numeric(14)
declare @target_val_stratum_5 numeric(14)
declare @target_val_stratum_6 numeric(14)
declare @stratum_count numeric(14)
declare @stratum_total_val numeric(14)
declare @stratum_high_val numeric(14)
delete from ptd_state_report_strata where year = @input_yr and entity_id = @entity_id and state_cd = @state_cd

if exists (select * from sysobjects where id = object_id(N'[dbo].[_temp_stratum]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[_temp_stratum]

declare @taxing_unit_number	varchar(20)

select @taxing_unit_number = replace(taxing_unit_num,'-','')
from entity
where entity_id = @entity_id

declare @select_cmd varchar(2000)

set @select_cmd = 'select cast(left(account_number, charindex(''-'',account_number) -1) as int) as prop_id, '
set @select_cmd = @select_cmd + cast(@input_yr as varchar(5)) + ' as year, '
set @select_cmd = @select_cmd + '0 as sup_num, '
set @select_cmd = @select_cmd + 'cast(right(account_number, len(account_number) - charindex(''-'',account_number)) as int) as owner_id, '
set @select_cmd = @select_cmd + cast(@entity_id as varchar(10)) + ' as entity_id, '
set @select_cmd = @select_cmd + quotename(@state_cd,'''') + ' as state_cd, '
set @select_cmd = @select_cmd + 'sum(isnull(category_market_value_land_before_any_cap,0)+'
set @select_cmd = @select_cmd + 'isnull(category_market_value_improvement_before_any_cap,0)+isnull(personal_property_value,0)+isnull(mineral_value,0)-isnull(proration_loss_to_property,0)) as appraised_val '
set @select_cmd = @select_cmd + 'into [dbo].[_temp_stratum] '
set @select_cmd = @select_cmd + 'from ptd_ajr '
set @select_cmd = @select_cmd + 'where comptrollers_category_code = ' + quotename(@state_cd,'''') + ' '
set @select_cmd = @select_cmd + 'and taxing_unit_id_code = ' + quotename(@taxing_unit_number,'''') + ' '
set @select_cmd = @select_cmd + 'group by account_number'

exec(@select_cmd)
/*
select 0 as prop_id, 
	0 as year, 
	0 as sup_num, 
	0 as owner_id, 
	@entity_id as entity_id, 
	@state_cd as state_cd, 
	sum(isnull(category_market_value_land_before_any_cap,0)+isnull(category_market_value_improvement_before_any_cap,0)+isnull(personal_property_value,0)+isnull(mineral_value,0)-isnull(proration_loss_to_property,0)) as appraised_val
into _temp_stratum
from ptd_ajr
where comptrollers_category_code = quotename(@state_cd,"'")
and taxing_unit_id_code = quotename(@taxing_unit_number,"'")
*/

/*
select prop_id, year, sup_num, owner_id, entity_id, state_cd, appraised_val
into _temp_stratum 
from property_owner_entity_state_cd
where state_cd like @state_cd + "%"
and entity_id = @entity_id
and year = @input_yr
*/
--Stratum #1

set @target_val_stratum_1 = (select sum(appraised_val) * .05 from [dbo].[_temp_stratum])
set @stratum_count = 0
set @stratum_total_val = 0
set @stratum_high_val = 0

DECLARE PROP_LIST CURSOR FAST_FORWARD
FOR select appraised_val
	 from [dbo].[_temp_stratum] order by appraised_val

OPEN PROP_LIST
FETCH NEXT FROM PROP_LIST into	@appraised_val

while (@@FETCH_STATUS = 0)
begin	
	if (@stratum_total_val <= @target_val_stratum_1)
	begin
		set @stratum_count = @stratum_count + 1
		set @stratum_total_val = @stratum_total_val + @appraised_val
		if (@appraised_val > @stratum_high_val) set @stratum_high_val = @appraised_val
	end
	-- Continue on list if the appraised value is equal to high value
	else if (@appraised_val = @stratum_high_val)
		begin
			set @stratum_count = @stratum_count + 1
			set @stratum_total_val = @stratum_total_val + @appraised_val
			if (@appraised_val > @stratum_high_val) set @stratum_high_val = @appraised_val
		end
		else break

	FETCH NEXT FROM PROP_LIST into	@appraised_val
end

insert into ptd_state_report_strata (entity_id, year, as_of_sup_num, state_cd, 
stratum_number, stratum_count, stratum_total_val, stratum_high_val)
values (@entity_id, @input_yr, 0, @state_cd, 1, @stratum_count, @stratum_total_val, @stratum_high_val)

CLOSE PROP_LIST
DEALLOCATE PROP_LIST

delete from [dbo].[_temp_stratum] where appraised_val <= @stratum_high_val

--Stratum #2

set @target_val_stratum_2 = (select sum(appraised_val) * .20 from [dbo].[_temp_stratum])
set @stratum_count = 0
set @stratum_total_val = 0
set @stratum_high_val = 0

insert into ptd_state_report_strata (entity_id, year, as_of_sup_num, state_cd, 
stratum_number, stratum_count, stratum_total_val, stratum_high_val)
select @entity_id, @input_yr, 0, @state_cd, 2, count(*), sum(appraised_val), max(appraised_val)
from [dbo].[_temp_stratum]
where appraised_val >= @target_val_stratum_2

delete from [dbo].[_temp_stratum] where appraised_val >= @target_val_stratum_2

--Stratum #3, #4, #5 and #6
set @target_val_stratum_3 = (select sum(appraised_val) * .25 from [dbo].[_temp_stratum])
set @target_val_stratum_4 = (select sum(appraised_val) * .50 from [dbo].[_temp_stratum])
set @target_val_stratum_5 = (select sum(appraised_val) * .75 from [dbo].[_temp_stratum])
set @target_val_stratum_6 = (select sum(appraised_val) * 1.0 from [dbo].[_temp_stratum])

--select target_val_3 = @target_val_stratum_3, target_val_4 = @target_val_stratum_4, target_val_5 = @target_val_stratum_5, target_val_6 = @target_val_stratum_6

declare @target_val numeric(14)
declare @stratum_number numeric(14)
declare @stratum_running_total numeric(14)

DECLARE PROP_LIST CURSOR FAST_FORWARD
FOR select appraised_val
	 from [dbo].[_temp_stratum] order by appraised_val

OPEN PROP_LIST
FETCH NEXT FROM PROP_LIST into	@appraised_val

set @stratum_number = 3
set @stratum_count = 0
set @stratum_total_val = 0
set @stratum_high_val = 0
set @stratum_running_total = 0

while (@@FETCH_STATUS = 0)
begin	
	if (@stratum_number = 3) set @target_val = @target_val_stratum_3
	if (@stratum_number = 4) set @target_val = @target_val_stratum_4
	if (@stratum_number = 5) set @target_val = @target_val_stratum_5
	if (@stratum_number = 6) set @target_val = @target_val_stratum_6

	if (@stratum_running_total <= @target_val)
	begin
		set @stratum_count = @stratum_count + 1
		set @stratum_total_val = @stratum_total_val + @appraised_val
		if (@appraised_val > @stratum_high_val) set @stratum_high_val = @appraised_val
		set @stratum_running_total = @stratum_running_total + @appraised_val
	end
	-- Continue on list if the appraised value is equal to high value
	else if (@appraised_val = @stratum_high_val)
		begin
			set @stratum_count = @stratum_count + 1
			set @stratum_total_val = @stratum_total_val + @appraised_val
			if (@appraised_val > @stratum_high_val) set @stratum_high_val = @appraised_val
			set @stratum_running_total = @stratum_running_total + @appraised_val
		end
		else 
			--Write off the strata info to the appropriate stratum number
			begin
				insert into ptd_state_report_strata (entity_id, year, as_of_sup_num, state_cd, 
				stratum_number, stratum_count, stratum_total_val, stratum_high_val)
				values (@entity_id, @input_yr, 0, @state_cd, @stratum_number, @stratum_count, @stratum_total_val, @stratum_high_val)
				set @stratum_number = @stratum_number + 1
				set @stratum_count = 0
				set @stratum_total_val = 0
				set @stratum_high_val = 0
				
				--Start accumulating again with the current cursor info.
				set @stratum_count = @stratum_count + 1
				set @stratum_total_val = @stratum_total_val + @appraised_val
				if (@appraised_val > @stratum_high_val) set @stratum_high_val = @appraised_val
				set @stratum_running_total = @stratum_running_total + @appraised_val

			end
			if (@stratum_number > 6) 
			begin
				select debug = 'breaking'
				break
			end

	
	FETCH NEXT FROM PROP_LIST into	@appraised_val
end

if (@stratum_count > 0)
begin
	insert into ptd_state_report_strata (entity_id, year, as_of_sup_num, state_cd, 
	stratum_number, stratum_count, stratum_total_val, stratum_high_val)
	values (@entity_id, @input_yr, 0, @state_cd, @stratum_number, @stratum_count, @stratum_total_val, @stratum_high_val)
end
				
CLOSE PROP_LIST
DEALLOCATE PROP_LIST

update ptd_state_report_strata
set stratum_count = isnull(stratum_count, 0),
	stratum_total_val = isnull(stratum_total_val, 0),
	stratum_high_val = isnull(stratum_high_val,0)
where year = @input_yr


/*
update ptd_state_report_strata set stratum_count = 0 where stratum_count is null and year = @input_yr
update ptd_state_report_strata set stratum_total_val = 0 where stratum_total_val is null and year = @input_yr
update ptd_state_report_strata set stratum_high_val = 0 where stratum_high_val is null and year = @input_yr
*/
--cleanup

if exists (select * from sysobjects where id = object_id(N'[dbo].[_temp_stratum]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[_temp_stratum]

GO

