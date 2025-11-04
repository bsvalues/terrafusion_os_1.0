
create procedure Delete2519A

as

set nocount on 

declare @prop_id	int

declare prop_cursor cursor fast_forward for
select prop_id  from prop_group_assoc
where prop_group_cd = '25.19A'

open prop_cursor 
fetch next from prop_cursor into @prop_id

while (@@FETCH_STATUS = 0)
begin
	delete from prop_group_assoc
	where prop_id = @prop_id
	and   prop_group_cd = '25.19A'

	fetch next from prop_cursor into @prop_id
end

close prop_cursor
deallocate prop_cursor

GO

