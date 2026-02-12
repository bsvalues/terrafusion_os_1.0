
create procedure RemovedRetainedExciseNumbersAfterExport

as

set nocount on

insert voided_excise_numbers_retained
(excise_number)
select ven.excise_number
from voided_excise_reet as ven
with (nolock)
left outer join voided_excise_numbers_retained as venr
with (nolock)
on ven.excise_number = venr.excise_number
where venr.excise_number is null

update voided_excise_numbers_retained
set exported = 1
where excise_number in
(
	select excise_number
	from voided_excise_reet
	with (nolock)
	where export_date is not null
)
and exported = 0

GO

