



CREATE PROCEDURE GetVITPaymentWizardInfo
@input_prop_id	int,
@input_year	numeric(4,0)
AS

declare @output_prop_id		varchar(15)
declare @output_owner_id	varchar(15)
declare @output_file_as_name	varchar(255)
declare @output_owner_tax_yr	varchar(4)
declare @output_amount_paid	varchar(20)

--Get owner name and ID
select @output_file_as_name = cast(account.file_as_name as varchar(255)),
	@output_owner_id = cast(property.col_owner_id as varchar(15))
from property, account
where property.col_owner_id = account.acct_id
and   property.prop_id = @input_prop_id

--Get amount_paid for those months that have not been applied for a particular year
select @output_amount_paid = (SUM(escrow.amount_paid) - SUM(escrow.penalty) - SUM(escrow.fines)) from escrow where escrow_payment_id in
(
	select escrow_id from escrow_trans where prop_id = @input_prop_id and year = @input_year and month not in
	(
		select month from escrow_trans where prop_id = @input_prop_id and year = @input_year and status = 'VEAP'
	)
)

--Return information...
select  prop_id 	= cast(@input_prop_id as varchar(15)),
	owner_id 	= @output_owner_id,
	owner_tax_yr 	= cast(@input_year as varchar(4)),
	file_as_name 	= @output_file_as_name,
	amount_paid 	= cast(@output_amount_paid as varchar(20))

GO

