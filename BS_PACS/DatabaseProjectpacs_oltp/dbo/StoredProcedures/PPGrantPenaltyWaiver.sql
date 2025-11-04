

create procedure dbo.PPGrantPenaltyWaiver
	@input_year numeric(4,0),
	@input_processed_dt datetime,
	@input_comment varchar(512) = ''
as

-- Make sure there is a pp_rendition_tracking row for every personal property in @input_year
insert into
	pp_rendition_tracking with(tablockx)
(
	prop_id,
	prop_val_yr,
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
select 
	pV.prop_id,	--prop_id,                       
	pv.prop_val_yr, --prop_val_yr,                   
	'NR',		--extension1,                    
	'',		--extension1_comment,            
	'NR',		--extension2,                    
	'',		--extension2_comment,            
	'',		--request_support_doc_comment,	   
	'NR',		--penalty_waiver_status,
	'',		--penalty_comment,
	0,		--penalty_amount,
	0,		--penalty_amount_override,  checkbox
	0,		--fraud_penalty_amount,
	''		--fraud_comment
from
	property as p with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = p.prop_id
and	psa.owner_tax_yr = @input_year
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
where
	p.prop_type_cd = 'P'
and	not exists
(
	select
		*
	from
		pp_rendition_tracking with (nolock)
	where
		prop_id = pv.prop_id
	and	prop_val_yr = pv.prop_val_yr
)


declare @pp_waive_amount_threshold numeric(14,2)
select
	@pp_waive_amount_threshold = pp_waive_amount_threshold
from
	pacs_system with (nolock)
where
	system_type in ('A', 'B')


if @pp_waive_amount_threshold is null
begin
	set @pp_waive_amount_threshold = 0.0
end


update
	pp_rendition_tracking
set
	penalty_waiver_status = 'SG',
	penalty_waiver_status_dt = @input_processed_dt,
	penalty_comment = @input_comment
from
	pp_rendition_tracking as prt with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = prt.prop_id
and	psa.owner_tax_yr = prt.prop_val_yr
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	cast(pv.market as numeric(14,2)) < @pp_waive_amount_threshold
where
	prt.prop_val_yr = @input_year
and	isnull(prt.penalty_waiver_status, 'NR') = 'NR'

GO

