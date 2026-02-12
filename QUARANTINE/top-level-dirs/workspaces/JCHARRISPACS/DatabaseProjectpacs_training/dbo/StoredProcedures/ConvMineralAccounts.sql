










CREATE procedure ConvMineralAccounts 

@input_appr_company	int,
@input_yr		numeric(4)

as

declare @next_property_id	int
declare @next_account_id	int
declare @next_pp_seg_id	int

/* set up all the appropriate code files */
insert into interest_type
(
interest_type_cd,
interest_type_desc
)
select distinct type_of_int, 'Conversion'
from mineral_property_cv
where not exists (select * from interest_type 
		  where interest_type_cd = type_of_int)
and  type_of_int is not null

/* set up all the appropriate code files */
insert into state_code
(
state_cd,
state_cd_desc,
sys_flag
)
select distinct state_cd, 'Conversion', NULL
from mineral_property_cv
where not exists (select * from state_code
		  where state_code.state_cd = mineral_property_cv.state_cd)
and  state_cd is not null

--exec ConvMinDeleteApprInfo @input_yr, @input_appr_company
--
-- COMMENTED OUT BY OSVALDO -  7/15/2000
--  WE DON'T NEED TO DELETE THE INFO, WE SIMPLE WANT TO CODE MINERAL PROPERTY AS INACTIVE.
--- THIS IS DONE IN THE ConvMinPopulateProperty below
--
exec ConvMinSetMatchUnmatched
exec ConvMinPopulateOwner
exec ConvMinPopulateProperty
exec ConvMinPopulateExemption

/* Commented out by Osvaldo - 5/20/2001 because this is causing problems with clients on next_ids

select @next_property_id = 0
select @next_account_id = 0
select @next_pp_seg_id = 0

select @next_property_id = max(prop_id)
from property

if (@next_property_id <> 0 )
begin
	update next_property_id set next_property_id = @next_property_id + 100
end

select @next_account_id = max(acct_id)
from account

if (@next_account_id <> 0)
begin
	update next_account_id set next_account_id = @next_account_id + 100
end

select  @next_pp_seg_id = max(pp_seg_id)
from pers_prop_seg

if (@next_pp_seg_id <> 0)
begin
	update next_pers_prop_seg_id set next_pers_prop_seg_id = @next_pp_seg_id + 100
end
*/

GO

