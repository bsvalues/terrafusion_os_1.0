



CREATE PROCEDURE CreateSuppGroupBills
   @input_sup_group int,
   @input_user_id int,
    @input_batch_id	int
AS

declare @sup_tax_yr numeric(4)
declare @sup_num    int
declare @tax_year     numeric(4)

select @tax_year = tax_yr from pacs_system


DECLARE SUPP_GROUP_VW SCROLL CURSOR
FOR select sup_tax_yr,
	   sup_num 
    from   supplement_vw
    where  sup_group_id = @input_sup_group

OPEN SUPP_GROUP_VW
FETCH NEXT FROM SUPP_GROUP_VW into @sup_tax_yr, @sup_num

while (@@FETCH_STATUS = 0)
begin
	if (@sup_tax_yr <= @tax_year)
	begin
		exec CreateSuppBills @sup_tax_yr, @sup_num, @input_user_id, @input_sup_group, @input_batch_id
	end

 	FETCH NEXT FROM SUPP_GROUP_VW into @sup_tax_yr, @sup_num
end

/* update the sup group to a status of 'BC' which indicates that bills have been created */
update sup_group
set status_cd = 'BC', sup_bill_create_dt = GetDate(), sup_bills_created_by_id = @input_user_id
where sup_group_id = @input_sup_group

exec SupGroupPreprocess_UpdateTaxAmounts @input_sup_group, @input_user_id

CLOSE SUPP_GROUP_VW
DEALLOCATE SUPP_GROUP_VW

GO

