


CREATE PROCEDURE GetTaxDueListingTA

AS

set nocount on

declare @prop_id 			int
declare @eff_date 			varchar(10)
declare @year 				numeric(4,0)
declare @output_current_tax_due     	numeric(14,2)
declare @output_delinquent_tax_due  	numeric(14,2)
declare @output_attorney_fee_due    	numeric(14,2)
declare @output_fee_due	        	numeric(14,2)

set @eff_date 	= '03/14/2002'
set @year 	= 0

DECLARE PROPERTY_LIST INSENSITIVE CURSOR
FOR select prop_id from _tmp_property_tax_due_03142002
order by prop_id

OPEN PROPERTY_LIST
FETCH NEXT FROM PROPERTY_LIST into @prop_id

while (@@FETCH_STATUS = 0)
begin
	exec GetPropertyTaxDueOutput @prop_id, @eff_date, @year, @output_current_tax_due OUTPUT, @output_delinquent_tax_due OUTPUT, @output_attorney_fee_due OUTPUT, @output_fee_due OUTPUT

	update _tmp_property_tax_due_03142002
	set current_tax_due = isnull(@output_current_tax_due, 0),
	delinquent_tax_due = isnull(@output_delinquent_tax_due, 0),
	attorney_fees = isnull(@output_attorney_fee_due, 0),
	fees = isnull(@output_fee_due, 0),
	total_due = isnull(@output_current_tax_due, 0) + isnull(@output_delinquent_tax_due, 0) + isnull(@output_attorney_fee_due, 0) + isnull(@output_fee_due, 0)
	where prop_id = @prop_id

	FETCH NEXT FROM PROPERTY_LIST into @prop_id
end

CLOSE PROPERTY_LIST
DEALLOCATE PROPERTY_LIST

GO

