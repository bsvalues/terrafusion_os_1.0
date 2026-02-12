
CREATE PROCEDURE dbo.PPSetRenditionPenaltyFlag
	@input_prop_id int,
	@input_owner_id int,
	@input_rendition_year numeric(4,0),
	@pacs_user_id int = 1
AS

set nocount on

declare @prop_id		int
declare @owner_id		int
declare @sup_yr			numeric(4,0)
declare @sup_num		int
declare @owner_name		varchar(70)
declare @legal_desc		varchar(255)
declare @situs_num		varchar(10)
declare @situs_street_prefix	varchar(10)
declare @situs_street		varchar(50)
declare @situs_street_suffix	varchar(10)
declare @situs_city		varchar(30)
declare @situs_state		varchar(2)
declare @situs_zip		varchar(10)
declare @appraised_val		numeric(14,0)
declare @geo_id			varchar(50)
declare @ref_id1		varchar(50)
declare @ref_id2		varchar(50)
declare @rendition_filed	bit
declare @rendition_date		datetime
declare @penalty_user_override_dt datetime
declare @pacs_user_name varchar(30)

select 
	@owner_name = isnull(a.file_as_name, ''),
	@legal_desc = isnull(pv.legal_desc, ''),
	@situs_num = isnull(s.situs_num, ''),
	@situs_street_prefix = isnull(s.situs_street_prefx, ''),
	@situs_street = isnull(s.situs_street, ''),
	@situs_street_suffix = isnull(s.situs_street_sufix, ''),
 	@situs_city = isnull(s.situs_city, ''),
	@situs_state = isnull(s.situs_state, ''),
	@situs_zip = isnull(s.situs_zip, ''),
	@appraised_val = isnull(pv.appraised_val, 0),
	@geo_id = isnull(p.geo_id, ''),
	@ref_id1 = isnull(p.ref_id1, ''),
	@ref_id2 = isnull(p.ref_id2, ''),
	@sup_num = psa.sup_num,
	@rendition_filed = convert(bit, case when ppr.prop_id is null then 0 else 1 end),
	@rendition_date = ppr.rendition_date,
	@penalty_user_override_dt = ppt.penalty_user_override_dt
from
	prop_supp_assoc as psa with (nolock)
inner join
	property_val as pv with (nolock)
on
	psa.prop_id = pv.prop_id
and	psa.owner_tax_yr = pv.prop_val_yr
and	psa.sup_num = pv.sup_num
inner join
	property as p with (nolock)
on
	pv.prop_id = p.prop_id
inner join
	owner as o with (nolock)
on
	pv.prop_id = o.prop_id
and	pv.sup_num = o.sup_num
and	pv.prop_val_yr = o.owner_tax_yr
inner join
	account as a with (nolock)
on
	o.owner_id = a.acct_id
left outer join
	situs as s with (nolock)
on
	pv.prop_id = s.prop_id
and	s.primary_situs = 'Y'
left outer join
	pers_prop_rendition as ppr with (nolock)
on
	pv.prop_id = ppr.prop_id
and	pv.prop_val_yr = ppr.rendition_year
left outer join
	pp_rendition_tracking as ppt with (nolock)
on
	pv.prop_id = ppt.prop_id
and	pv.prop_val_yr = ppt.prop_val_yr
and pv.sup_num = ppt.sup_num
where
	o.prop_id = @input_prop_id
and	o.owner_id = @input_owner_id
and	o.owner_tax_yr = @input_rendition_year

select @pacs_user_name = pacs_user_name
from pacs_user
where pacs_user_id = @pacs_user_id


if not exists
(
	select
		*
	from
		pp_rendition_prop_penalty with (nolock)
	where
		prop_id = @input_prop_id
	and	owner_id = @input_owner_id
	and	sup_num = @sup_num
	and	rendition_year = @input_rendition_year
)
begin
	insert into
		pp_rendition_prop_penalty
	(
		prop_id,
		owner_id,
		sup_num,
		rendition_year,
		rendition_dt,
		owner_name,
		legal_desc,
		situs_address,
		market_value,
		geo_id,
		ref_id1,
		ref_id2,
		late_rendition_penalty_flag,
		fraud_penalty_flag
	)
	values
	(
		@input_prop_id,
		@input_owner_id,
		@sup_num,
		@input_rendition_year,
		@rendition_date,
		@owner_name,
		@legal_desc,
		cast( rtrim(@situs_num + ' ' + @situs_street_prefix + ' ' + @situs_street + ' ' + @situs_street_suffix + ' ' + @situs_city + ' ' + @situs_state + ' ' + @situs_zip) as varchar(140) ),
		@appraised_val,
		@geo_id,
		@ref_id1,
		@ref_id2,
		1,
		0
	)
end
else
begin
	update
		pp_rendition_prop_penalty
	set
		rendition_dt = @rendition_date,
		owner_name = @owner_name,
		legal_desc = @legal_desc,
		situs_address = cast( rtrim(@situs_num + ' ' + @situs_street_prefix + ' ' + @situs_street + ' ' + @situs_street_suffix + ' ' + @situs_city + ' ' + @situs_state + ' ' + @situs_zip) as varchar(140) ),
		market_value = @appraised_val,
		geo_id = @geo_id,
		ref_id1 = @ref_id1,
		ref_id2 = @ref_id2,
		late_rendition_penalty_flag = 1
	where
		prop_id = @input_prop_id
	and	owner_id = @input_owner_id
	and	sup_num = @sup_num
	and	rendition_year = @input_rendition_year
end


-- Set penalty percentages
if @penalty_user_override_dt is null and exists (
	select * from pacs_config with(nolock) where szGroup = 'BPPRenditions' and szConfigName = 'AutomatedPenalties' and szConfigValue = '1'
)
begin
	declare @penalty numeric(5, 2)
	set @penalty = 0

	if @rendition_filed = 1
	begin
		select top 1 @penalty = isnull(rpc.penalty_percent, 0)
		from rendition_penalty_config rpc
		where rpc.[year] = @input_rendition_year 
		and @rendition_date >= rpc.start_date 
		and @rendition_date <= rpc.end_date 
	end
	else begin
		select @penalty = max(isnull(rpc.penalty_percent, 0))
		from rendition_penalty_config rpc
		where rpc.year = @input_rendition_year
	end
	
	update pv
	set pv.late_filing_penalty_pct = @penalty
	from property_val pv
	where pv.prop_id = @input_prop_id
	and	pv.prop_val_yr = @input_rendition_year
	and	pv.sup_num = @sup_num
end

-- Make sure there is a pp_rendition_tracking record
if not exists
(
	select 1
	from pp_rendition_tracking with(nolock)
	where prop_id = @input_prop_id
	and	prop_val_yr = @input_rendition_year
	and sup_num = @sup_num
)
begin
	insert into
		pp_rendition_tracking with(tablockx)
	(
		prop_id,
		prop_val_yr,
		sup_num,
		extension1,
		extension1_comment,
		extension2,
		extension2_comment,
		request_support_doc_comment,
		penalty_waiver_status,
		penalty_comment,
		penalty_amount,
		penalty_amount_override,
		fraud_penalty_amount,
		fraud_comment
	)
	values
	(
		@input_prop_id,
		@input_rendition_year,
		@sup_num,
		'NR',
		'',
		'NR',
		'',
		'',
		'NR',
		'',
		0,
		0,
		0,
		''
	)
end


-- update the rendition tracking record
update pp_rendition_tracking
set pp_rendition_tracking.waiver_request_mandatory_dt =
		case datepart(dw, dateadd(day, 30, GetDate()))
			when 7 then convert(varchar(10), dateadd(day, 32, GetDate()), 101)
			when 1 then convert(varchar(10), dateadd(day, 31, GetDate()), 101)
			else convert(varchar(10), dateadd(day, 30, GetDate()), 101)
		end,
	pp_rendition_tracking.penalty_amount_dt = 
	(
		select isnull(penalty_amount_dt, GetDate()) penalty_amount_dt
		from pp_rendition_tracking 
		where prop_val_yr = @input_rendition_year 
		and prop_id = @input_prop_id
		and sup_num = @sup_num
	)
	
from pp_rendition_tracking prt with(nolock)

inner join prop_supp_assoc psa with(nolock)
on psa.prop_id = prt.prop_id
and	psa.owner_tax_yr = prt.prop_val_yr
and psa.sup_num = prt.sup_num

inner join property_val as pv with (nolock)
on pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_inactive_dt is null

where prt.prop_val_yr = @input_rendition_year
and	prt.prop_id = @input_prop_id
and prt.sup_num = @sup_num


--Insert 'BPPPF' event on each property processed
declare @next_event_id	int
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
	cast(@input_rendition_year as varchar(4)) + 
		' Rendition late filing penalty imposed: ' + 
		cast(@penalty as varchar(10)) + '%',
	@pacs_user_id
)

insert into prop_event_assoc
(
	prop_id,
	event_id
)
values
(
	@input_prop_id,
	@next_event_id
)

GO

