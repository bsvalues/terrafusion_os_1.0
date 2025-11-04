




CREATE  procedure PopulatePTDStrataInfo

	@input_yr numeric(4),
	@entity_id int,
	@state_cd varchar(2)

as
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

select * 
into _temp_stratum 
from ptd_state_report_cd_detail_data with (nolock)
where state_cd like @state_cd + '%'
and entity_id = @entity_id
and year = @input_yr

--Stratum #1

set @target_val_stratum_1 = (select sum(appraised_val) * .05 from _temp_stratum)
set @stratum_count = 0
set @stratum_total_val = 0
set @stratum_high_val = 0

DECLARE PROP_LIST SCROLL CURSOR
FOR select appraised_val
	 from _temp_stratum with (nolock) order by appraised_val

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

delete from _temp_stratum where appraised_val <= @stratum_high_val

--Stratum #2

set @target_val_stratum_2 = (select sum(appraised_val) * .20 from _temp_stratum with (nolock))
set @stratum_count = 0
set @stratum_total_val = 0
set @stratum_high_val = 0

insert into ptd_state_report_strata (entity_id, year, as_of_sup_num, state_cd, 
stratum_number, stratum_count, stratum_total_val, stratum_high_val)
select @entity_id, @input_yr, 0, @state_cd, 2, count(*), sum(appraised_val), max(appraised_val)
from _temp_stratum with (nolock)
where appraised_val >= @target_val_stratum_2

delete from _temp_stratum where appraised_val >= @target_val_stratum_2

--Stratum #3, #4, #5 and #6
set @target_val_stratum_3 = (select sum(appraised_val) * .25 from _temp_stratum)
set @target_val_stratum_4 = (select sum(appraised_val) * .50 from _temp_stratum)
set @target_val_stratum_5 = (select sum(appraised_val) * .75 from _temp_stratum)
set @target_val_stratum_6 = (select sum(appraised_val) * 1.0 from _temp_stratum)

--select target_val_3 = @target_val_stratum_3, target_val_4 = @target_val_stratum_4, target_val_5 = @target_val_stratum_5, target_val_6 = @target_val_stratum_6

declare @target_val numeric(14)
declare @stratum_number numeric(14)
declare @stratum_running_total numeric(14)

DECLARE PROP_LIST SCROLL CURSOR
FOR select appraised_val
	 from _temp_stratum with (nolock) order by appraised_val

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
	--if (@stratum_number = 6) select stratum_number = @stratum_number, stratum_target = @target_val, appraised_val = @appraised_val,  stratum_running_total = @stratum_running_total, stratum_count = @stratum_count, stratum_total_val = @stratum_total_val, stratum_high_val = @stratum_high_val

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

update ptd_state_report_strata set stratum_count = 0 where stratum_count is null and year = @input_yr
update ptd_state_report_strata set stratum_total_val = 0 where stratum_total_val is null and year = @input_yr
update ptd_state_report_strata set stratum_high_val = 0 where stratum_high_val is null and year = @input_yr

--cleanup

if exists (select * from sysobjects where id = object_id(N'[dbo].[_temp_stratum]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[_temp_stratum]

GO

