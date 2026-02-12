
CREATE PROCEDURE GetAccountType
@input_account_id	int

AS 


--Declare variables
declare @output_account_type	varchar(10)

--Initialize variables
select @output_account_type = 'NA'

--Go find out what type of account @input_account_id is...
if exists(select * from owner where owner_id = @input_account_id)
begin
	select @output_account_type = 'OW'
end
else if exists (select * from agent where agent_id = @input_account_id)
begin
	select @output_account_type = 'AG'
end
else if exists (select * from mortgage_co where mortgage_co_id = @input_account_id)
begin
	select @output_account_type = 'MO'
end
else if exists (select * from attorney where attorney_id = @input_account_id)
begin
	select @output_account_type = 'AT'
end

else
if exists (select * from taxserver where taxserver_id = @input_account_id)
begin
	select @output_account_type = 'TS'
end

else if exists (select * from tax_district where tax_district_id = @input_account_id)
begin
	select @output_account_type = 'TD'
end

else if exists (select * from entity where entity_id = @input_account_id)
begin
	select @output_account_type = 'EN'
end

else if exists (select * from arbitrator where arbitrator_id = @input_account_id)
begin
	select @output_account_type = 'ARB'
end

else if exists (select * from collector where collector_id = @input_account_id)
begin
	select @output_account_type = 'COL'
end

else if exists (select * from special_assessment_agency where agency_id = @input_account_id)
begin
	select @output_account_type = 'SAA'
end

else if not exists (select * from _arb_inquiry_by_account where acct_id = @input_account_id)
begin
	select @output_account_type = 'TP'
end

--Return account information...
select 	account_id 	= @input_account_id,
	account_type 	= @output_account_type

GO

