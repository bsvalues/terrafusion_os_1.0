










CREATE PROCEDURE AssignStatementID
   @input_statement_group_id 	int,
   @input_sup_yr   		numeric(4),
   @input_sup_num  		int,
   @input_sort_option		char(1),
   @input_pacs_user_id		int,
   @input_run_num		int
AS
declare @prop_id           int
declare @owner_id          int
declare @bill_id           int
declare @sup_num	   int
declare @statement_id	   int
declare @prev_prop_id	   int
declare @prev_owner_id	   int

select @prev_prop_id  = 0
select @prev_owner_id = 0

if exists (select * 
	   from next_statement_id 
	   where statement_yr = @input_sup_yr)
begin
	select @statement_id = next_statement_id
	from next_statement_id
	where statement_yr = @input_sup_yr
end
else
begin
	select @statement_id = 1
end

/* order by geo id */
if (@input_sort_option = 'G')
begin
	DECLARE BILL SCROLL CURSOR
	FOR select bill.bill_id, bill.prop_id, bill.owner_id, bill.sup_num from bill, account, property, levy_supp_assoc
    	where bill.prop_id = levy_supp_assoc.prop_id
	and     bill.sup_num = levy_supp_assoc.sup_num
	and     bill.sup_tax_yr = levy_supp_assoc.sup_yr
	and     bill.owner_id   = account.acct_id
	and     bill.prop_id    = property.prop_id
	and     levy_supp_assoc.type = 'L'
	and     levy_supp_assoc.sup_yr     = @input_sup_yr
	and    entity_id in (select entity_id from entity_tax_statement_group_assoc, entity_tax_statement_group
			where entity_tax_statement_group_assoc.group_id = @input_statement_group_id
			and   entity_tax_statement_group_assoc.group_id = entity_tax_statement_group.group_id
			and   entity_tax_statement_group.group_yr       = @input_sup_yr)
	
	and property.prop_type_cd in (select prop_type_cd from entity_tax_statement_prop_type
					where levy_group_id = @input_statement_group_id
					and   levy_group_yr = @input_sup_yr
					and   levy_sup_num  = @input_sup_num
					and   levy_run      = @input_run_num	
					and   pacs_user_id  = @input_pacs_user_id)


	 
	order by property.geo_id, bill.prop_id, bill.owner_id

end 
/* order by alpha name */
else if (@input_sort_option = 'A')
begin
/*	DECLARE BILL SCROLL CURSOR
	FOR select bill.bill_id, bill.prop_id, bill.owner_id from bill, account, property
    	where entity_id in (select entity_id from entity_tax_statement_group_assoc, entity_tax_statement_group
			where entity_tax_statement_group_assoc.group_id = @input_statement_group_id
			and   entity_tax_statement_group_assoc.group_id = entity_tax_statement_group.group_id
			and   entity_tax_statement_group.group_yr       = @input_sup_yr)
	and bill.owner_id   = account.acct_id
	and bill.prop_id    = property.prop_id
	and bill.sup_tax_yr = @input_sup_yr
	and bill.sup_num    = @input_sup_num
	and property.prop_type_cd in (select prop_type_cd from entity_tax_statement_prop_type
					where levy_group_id = @input_statement_group_id
					and   levy_group_yr = @input_sup_yr
					and   levy_sup_num  = @input_sup_num
					and   levy_run      = @input_run_num	
					and   pacs_user_id  = @input_pacs_user_id)
	
	order by account.file_as_name, bill.prop_id, bill.owner_id */

	DECLARE BILL SCROLL CURSOR
	FOR select bill.bill_id, bill.prop_id, bill.owner_id, bill.sup_num from bill, account, property, levy_supp_assoc
    	where bill.prop_id = levy_supp_assoc.prop_id
	and     bill.sup_num = levy_supp_assoc.sup_num
	and     bill.sup_tax_yr = levy_supp_assoc.sup_yr
	and     bill.owner_id   = account.acct_id
	and     bill.prop_id    = property.prop_id
	and     levy_supp_assoc.type = 'L'
	and     levy_supp_assoc.sup_yr     = @input_sup_yr
	and    entity_id in (select entity_id from entity_tax_statement_group_assoc, entity_tax_statement_group
			where entity_tax_statement_group_assoc.group_id = @input_statement_group_id
			and   entity_tax_statement_group_assoc.group_id = entity_tax_statement_group.group_id
			and   entity_tax_statement_group.group_yr       = @input_sup_yr)
	
	and property.prop_type_cd in (select prop_type_cd from entity_tax_statement_prop_type
					where levy_group_id = @input_statement_group_id
					and   levy_group_yr = @input_sup_yr
					and   levy_sup_num  = @input_sup_num
					and   levy_run      = @input_run_num	
					and   pacs_user_id  = @input_pacs_user_id)
	
	order by account.file_as_name, bill.prop_id, bill.owner_id

end
/* order by address zip */
else if (@input_sort_option = 'Z')
begin
	DECLARE BILL SCROLL CURSOR
	FOR select bill.bill_id, bill.prop_id, bill.owner_id, bill.sup_num from bill, account, property, address, levy_supp_assoc
    	where  bill.prop_id = levy_supp_assoc.prop_id
	and     bill.sup_num = levy_supp_assoc.sup_num
	and     bill.sup_tax_yr = levy_supp_assoc.sup_yr 
	and    entity_id in (select entity_id from entity_tax_statement_group_assoc, entity_tax_statement_group
			where entity_tax_statement_group_assoc.group_id = @input_statement_group_id
			and   entity_tax_statement_group_assoc.group_id = entity_tax_statement_group.group_id
			and   entity_tax_statement_group.group_yr       = @input_sup_yr)
	and bill.owner_id   = account.acct_id
	and bill.prop_id    = property.prop_id
	and property.prop_type_cd in (select prop_type_cd from entity_tax_statement_prop_type
		 		      where levy_group_id = @input_statement_group_id
				      and   levy_group_yr = @input_sup_yr
				      and   levy_sup_num  = @input_sup_num
				      and   levy_run      = @input_run_num	
				      and   pacs_user_id  = @input_pacs_user_id)
	and bill.owner_id = address.acct_id
	and address.primary_addr = 'Y'
	
	order by address.addr_zip, account.file_as_name, bill.prop_id, bill.owner_id
end


OPEN BILL 
FETCH NEXT FROM BILL into @bill_id, @prop_id, @owner_id, @sup_num

while (@@FETCH_STATUS = 0)
begin
	if (@prev_prop_id != @prop_id) or
	   (@prev_owner_id != @owner_id)
	begin
		select @statement_id = @statement_id + 1
	end

	update bill set stmnt_id = @statement_id,
		          levy_group_id = @input_statement_group_id ,
		          levy_run_id = @input_run_num
	from property
	where bill.prop_id = property.prop_id
	and   bill.prop_id    = @prop_id
	and   bill.bill_id    = @bill_id
	and   bill.owner_id   = @owner_id
	and   bill.sup_num    = @sup_num
	and   bill.sup_tax_yr = @input_sup_yr
	

	select @prev_prop_id  = @prop_id
	select @prev_owner_id = @owner_id

	FETCH NEXT FROM BILL into @bill_id, @prop_id, @owner_id, @sup_num
end

select @statement_id = max(stmnt_id)
from bill where sup_tax_yr = @input_sup_yr

select @statement_id = @statement_id + 1

if exists (select * 
	   from next_statement_id 
	   where statement_yr = @input_sup_yr)
begin
	update next_statement_id
	set next_statement_id = @statement_id
	where statement_yr = @input_sup_yr
end
else
begin
	insert into next_statement_id (statement_yr, next_statement_id) values (@input_sup_yr, @statement_id)
end


CLOSE BILL
DEALLOCATE BILL

GO

