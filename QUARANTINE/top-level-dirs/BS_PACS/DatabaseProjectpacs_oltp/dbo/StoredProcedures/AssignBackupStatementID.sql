












CREATE PROCEDURE AssignBackupStatementID
   @input_statement_group_id int,
   @input_tax_yr   numeric(4)
AS
declare @prop_id           int
declare @owner_id          int
declare @bill_id           int
declare @statement_id	   int
declare @prev_prop_id	   int
declare @prev_owner_id	   int

select @prev_prop_id  = 0
select @prev_owner_id = 0

if exists (select * 
	   from next_statement_id 
	   where statement_yr = @input_tax_yr)
begin
	select @statement_id = next_statement_id
	from next_statement_id
	where statement_yr = @input_tax_yr
end
else
begin
	select @statement_id = 1
end

DECLARE BILL SCROLL CURSOR
FOR select bill_id, prop_id, owner_id from bill 
    where entity_id in (select entity_id from entity_tax_statement_group_assoc, entity_tax_statement_group
					where entity_tax_statement_group_assoc.group_id = @input_statement_group_id
					and   entity_tax_statement_group_assoc.group_id = entity_tax_statement_group.group_id
					and   entity_tax_statement_group.group_yr = @input_tax_yr)
and bill.sup_tax_yr = @input_tax_yr
and bill.sup_num = 0

order by prop_id, owner_id

OPEN BILL 
FETCH NEXT FROM BILL into @bill_id, @prop_id, @owner_id

while (@@FETCH_STATUS = 0)
begin
	if (@prev_prop_id != @prop_id) or
	   (@prev_owner_id != @owner_id)
	begin
		select @statement_id = @statement_id + 1
	end

	update bill set stmnt_id = @statement_id
	where prop_id    = @prop_id
	and   bill_id    = @bill_id
	and   owner_id   = @owner_id
	and   sup_num    = 0
	and   sup_tax_yr = @input_tax_yr

	select @prev_prop_id  = @prop_id
	select @prev_owner_id = @owner_id

	FETCH NEXT FROM BILL into @bill_id, @prop_id, @owner_id
end

if exists (select * 
	   from next_statement_id 
	   where statement_yr = @input_tax_yr)
begin
	update next_statement_id
	set next_statement_id = @statement_id
	where statement_yr = @input_tax_yr
end
else
begin
	insert into next_statement_id (statement_yr, next_statement_id) values (@input_tax_yr, @statement_id)
end


CLOSE BILL
DEALLOCATE BILL

GO

