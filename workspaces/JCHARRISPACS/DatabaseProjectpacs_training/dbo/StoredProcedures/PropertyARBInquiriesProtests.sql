
create procedure [dbo].[PropertyARBInquiriesProtests]

	@prop_id int,
	@type varchar(2)

as

set nocount on

declare @arbletter table
(
	prop_val_yr numeric(4,0) not null, 
	case_id int not null, 
	dtCreate datetime not null, 
	letter_id int not null
)

declare @year numeric(4,0)
declare @case_id int
declare @create_dt datetime
declare @letter_id int
declare @prev_case_id int

set @prev_case_id = 0

if @type = 'AI'
begin
declare curLetters cursor fast_forward
for	select ai.prop_val_yr, ai.case_id, alh.dtCreate, alh.lLetterID
	from _arb_inquiry as ai
	with (nolock)
	left outer join _arb_letter_history as alh
	with (nolock)
	on ai.prop_val_yr = alh.lPropValYr
	and ai.case_id = alh.lCaseID
	and alh.szARBType = 'AI'
	where ai.prop_id = @prop_id
	order by ai.case_id, alh.dtCreate desc
end
else if @type = 'AP'
begin
declare curLetters cursor fast_forward
for	select ap.prop_val_yr, ap.case_id, alh.dtCreate, alh.lLetterID
	from _arb_protest as ap
	with (nolock)
	left outer join _arb_letter_history as alh
	with (nolock)
	on ap.prop_val_yr = alh.lPropValYr
	and ap.case_id = alh.lCaseID
	and alh.szARBType = 'AP'
	where ap.prop_id = @prop_id
	order by ap.case_id, alh.dtCreate desc
end

open curLetters

fetch next from curLetters into @year, @case_id, @create_dt, @letter_id

while @@fetch_status = 0
begin
	if @prev_case_id <> @case_id and @create_dt is not null
	begin
		insert @arbletter
		(prop_val_yr, case_id, dtCreate, letter_id)
		values
		(@year, @case_id, @create_dt, @letter_id)
	end

	set @prev_case_id = @case_id

	fetch next from curLetters into @year, @case_id, @create_dt, @letter_id
end

close curLetters
deallocate curLetters

set nocount off

if @type = 'AI'
begin
	select ai.*, ltr.dtCreate, l.letter_name
	from _arb_inquiry as ai
	with (nolock)
	left outer join @arbletter as ltr
	on ai.prop_val_yr = ltr.prop_val_yr
	and ai.case_id = ltr.case_id
	left outer join letter as l
	with (nolock)
	on ltr.letter_id = l.letter_id
	where ai.prop_id = @prop_id
	order by ai.prop_val_yr desc
end
else if @type = 'AP'
begin
	select ap.*, aphd.docket_start_date_time, aphd.docket_end_date_time,
		ltr.dtCreate, l.letter_name
	from _arb_protest as ap
	with (nolock)
	left outer join _arb_protest_hearing_docket as aphd
	with (nolock)
	on ap.docket_id = aphd.docket_id
	left outer join @arbletter as ltr
	on ap.prop_val_yr = ltr.prop_val_yr
	and ap.case_id = ltr.case_id
	left outer join letter as l
	with (nolock)
	on ltr.letter_id = l.letter_id
	where ap.prop_id = @prop_id
	order by ap.prop_val_yr desc
end

GO

