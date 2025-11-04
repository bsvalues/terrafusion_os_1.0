


create  procedure IADefault

@ia_id		int,
@comment	varchar(512),
@user_id	int

as


update installment_agreement
set 	ia_status          = 'D',
	ia_default_comment = @comment,
	ia_default_dt      = GetDate(),
	ia_default_user    = @user_id

where ia_id = @ia_id


update bill set ia_id = 0
where ia_id = @ia_id


-- add an event to the property that is was defaulted...

declare @prop_id	int

declare prop_cursor cursor fast_forward
for select distinct bill.prop_id 
from installment_agreement_bill_assoc iaba,
     bill
where iaba.bill_id = bill.bill_id
and   iaba.ia_id = @ia_id

open prop_cursor
fetch next from prop_cursor into @prop_id

while (@@FETCH_STATUS = 0)
begin
	exec InsertEvent @prop_id, 'IAD', 'Installment Defaulted', @user_id

	fetch next from prop_cursor into @prop_id
end

close prop_cursor
deallocate prop_cursor

GO

