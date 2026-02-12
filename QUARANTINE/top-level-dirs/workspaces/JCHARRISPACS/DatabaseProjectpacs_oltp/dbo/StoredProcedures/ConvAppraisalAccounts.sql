





CREATE PROCEDURE ConvAppraisalAccounts
@input_appr_company	int,
@input_yr		numeric(4)

as

/* Setup all the appropriate code files */

--Interest Type Codes
insert into interest_type
(
interest_type_cd,
interest_type_desc
)
select distinct type_of_int, 'Conversion'
from collections_property_cv
where not exists (select * from interest_type 
		  where interest_type.interest_type_cd = collections_property_cv.type_of_int)
and collections_property_cv.type_of_int is not null

--State Codes
insert into state_code
(
state_cd,
state_cd_desc,
sys_flag
)
select distinct state_cd, 'Conversion', NULL
from collections_property_cv
where not exists (select * from state_code
		  where state_code.state_cd = collections_property_cv.state_cd)
and collections_property_cv.state_cd is not null

--Mortgage Companies
declare @mortgage_cd		char(10)
declare @next_mortgage_id	int

DECLARE MORTGAGE_CO SCROLL CURSOR
FOR select distinct(mortgage_acct_id)
from collections_property_cv
where mortgage_acct_id > '0'

OPEN MORTGAGE_CO
FETCH NEXT FROM MORTGAGE_CO into @mortgage_cd

while (@@FETCH_STATUS = 0)
begin
	if not exists(select * from mortgage_co where mortgage_cd = @mortgage_cd)
	begin
		select @next_mortgage_id = (select next_account_id from next_account_id)
		
		update next_account_id set next_account_id.next_account_id = next_account_id + 1

		insert into mortgage_co
		(
			mortgage_co_id,
			mortgage_cd
		)
		values
		(
			@next_mortgage_id,
			@mortgage_cd
		)

		select @next_mortgage_id = 0
	end

	FETCH NEXT FROM MORTGAGE_CO into @mortgage_cd
end

CLOSE MORTGAGE_CO
DEALLOCATE MORTGAGE_CO


--
exec ConvAppraisalDeleteInfo @input_appr_company, @input_yr
exec ConvAppraisalPopulateOwner
exec ConvAppraisalPopulateProperty @input_appr_company, @input_yr
exec ConvAppraisalPopulateExemption

GO

