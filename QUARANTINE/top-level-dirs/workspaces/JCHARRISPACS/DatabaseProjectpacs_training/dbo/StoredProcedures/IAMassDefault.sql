

CREATE procedure IAMassDefault 

@user_id	int

as

declare @ia_id	int

declare ia_cursor cursor fast_forward
for select #ia_mass_default.ia_id
from #ia_mass_default,
     installment_agreement ia
where #ia_mass_default.ia_id = ia.ia_id
and   ia.ia_status <> 'D'

open ia_cursor
fetch next from ia_cursor into @ia_id

while (@@FETCH_STATUS = 0)
begin
	exec IADefault @ia_id, 'MASS DEFAULT', @user_id


	fetch next from ia_cursor into @ia_id
end

close ia_cursor
deallocate ia_cursor

GO

