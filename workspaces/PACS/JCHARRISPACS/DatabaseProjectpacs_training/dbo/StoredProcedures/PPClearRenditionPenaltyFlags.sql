
CREATE PROCEDURE dbo.PPClearRenditionPenaltyFlags
	@input_rendition_year numeric(4,0),
	@pacs_user_id int = 1
AS


set nocount on

-- list the properties that should have penalties cleared
declare @props table (prop_id int, year numeric(4,0), sup_num int)

insert @props (prop_id, year, sup_num)
select prpp.prop_id, prpp.rendition_year, prpp.sup_num

from pp_rendition_prop_penalty prpp

join prop_supp_assoc psa
on psa.prop_id = prpp.prop_id
and psa.owner_tax_yr = prpp.rendition_year
and psa.sup_num = prpp.sup_num

join supplement s with(nolock)
on s.sup_tax_yr = psa.owner_tax_yr
and s.sup_num = psa.sup_num

join sup_group sg with(nolock)
on sg.sup_group_id = s.sup_group_id

left join pacs_year py with(nolock)
on py.tax_yr = psa.owner_tax_yr

where prpp.late_rendition_penalty_flag = 1
and prpp.rendition_year = @input_rendition_year
and ((py.certification_dt is null) or (sg.status_cd in ('C','TO','P')))


--Insert 'BPPPF' event on each property processed
declare @pacs_user_name varchar(30)
select @pacs_user_name = pacs_user_name
from pacs_user
where pacs_user_id = @pacs_user_id

declare @next_event_id int
declare @prop_id int
declare @year numeric(4,0)

declare prop_cursor cursor fast_forward for
select prop_id, year from @props

open prop_cursor
fetch next from prop_cursor into @prop_id, @year

while @@FETCH_STATUS = 0
begin
	exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0

	insert into event
	(
		event_id,
		system_type,
		event_type,
		event_date,
		pacs_user,
		event_desc,
		pacs_user_id
	)
	values
	(
		@next_event_id,
		'A',
		'BPPPF',
		GetDate(),
		@pacs_user_name,
		'All ' + cast(@year as varchar(4)) + ' Rendition late filing penalties removed',
		@pacs_user_id
	)

	insert into prop_event_assoc
	(
		prop_id,
		event_id
	)
	values
	(
		@prop_id,
		@next_event_id
	)

	fetch next from prop_cursor into @prop_id, @year
end

close prop_cursor
deallocate prop_cursor

-- update rendition tracking records
update prt
set penalty_amount_dt = null,
	waiver_request_mandatory_dt = null

from pp_rendition_tracking prt with(nolock)

inner join @props pr
on prt.prop_id = pr.prop_id
and prt.prop_val_yr = pr.year
and prt.sup_num = pr.sup_num


-- update rendition penalty records
update prpp
set late_rendition_penalty_flag = 0

from pp_rendition_prop_penalty prpp

inner join @props pr
on prpp.prop_id = pr.prop_id
and prpp.rendition_year = pr.year
and prpp.sup_num = pr.sup_num


-- clear penalty percentages
update pv
set late_filing_penalty_pct = null

from property_val pv

inner join @props pr
on pv.prop_id = pr.prop_id
and pv.prop_val_yr = pr.year
and pv.sup_num = pr.sup_num

GO

