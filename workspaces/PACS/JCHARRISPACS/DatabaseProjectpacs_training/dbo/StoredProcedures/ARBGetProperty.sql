



CREATE   procedure ARBGetProperty
	@prop_id int,
	@prop_val_yr numeric(4),
	@case_id int

as

declare @sup_num int
declare @geo_id varchar(50)
declare @prop_type_cd varchar(5)
declare @comments varchar(3000)
declare @remarks varchar(3000)
declare @legal_desc varchar(255)
declare @hood_cd varchar(10)
declare @appraiser_id int
declare @property_type varchar(50)
declare @entities varchar(100)
declare @exemptions varchar(100)

select
	@sup_num = psa.sup_num,
	@geo_id = p.geo_id,
	@prop_type_cd = ltrim(rtrim(p.prop_type_cd)),
	@comments = p.prop_cmnt,
	@remarks = p.remarks,
	@legal_desc = pv.legal_desc,
	@hood_cd = pv.hood_cd,
	@appraiser_id = pv.last_appraiser_id,
	@property_type = pt.prop_type_desc,
	@entities = dbo.fn_GetEntities(psa.prop_id, psa.owner_tax_yr, psa.sup_num),
	@exemptions = dbo.fn_GetExemptions(psa.prop_id, psa.owner_tax_yr, psa.sup_num)
from
	prop_supp_assoc as psa with (nolock)
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
inner join
	property as p with (nolock)
on
	p.prop_id = pv.prop_id
inner join
	property_type as pt with (nolock)
on
	pt.prop_type_cd = p.prop_type_cd
where
	psa.prop_id = @prop_id
and	psa.owner_tax_yr = @prop_val_yr


declare @hood_name varchar(50)

select
	@hood_name = hood_name
from
	neighborhood with (nolock)
where
	hood_cd = @hood_cd


declare @neighborhood varchar(70)

if ((isnull(@hood_cd, space(0)) <> space(0)) and (isnull(@hood_name, space(0)) <> space(0)))
begin
	set @neighborhood = @hood_cd + space(1) + '(' + @hood_name + ')'
end
else


declare @appraiser_name varchar(40)

select
	@appraiser_name = appraiser_nm
from
	appraiser with (nolock)
where
	appraiser_id = @appraiser_id


declare @primary_situs varchar(150)

select
	@primary_situs = replace(situs_display, char(13) + char(10), space(1))
from
	situs with (nolock)
where
	prop_id = @prop_id
and	primary_situs = 'Y'


declare @ptd varchar(10)

select
	@ptd = state_cd
from
	property_profile with (nolock)
where
	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr 


declare @owner_name varchar(70)

select top 1
	@owner_name = account.file_as_name
from
	owner with (nolock)
inner join
	account with (nolock)
on
	account.acct_id = owner.owner_id
where
	owner.prop_id = @prop_id
and	owner.owner_tax_yr = @prop_val_yr
and	owner.sup_num = @sup_num


declare @agent_name varchar(70)

select top 1
	@agent_name = account.file_as_name
from
	agent_assoc with (nolock)
inner join
	account with (nolock)
on
	account.acct_id = agent_assoc.agent_id
where
	agent_assoc.prop_id = @prop_id
and	agent_assoc.owner_tax_yr = @prop_val_yr
and
(
	agent_assoc.arb_mailings = 'T'
or	agent_assoc.ca_mailings  = 'T'
)


if (@prop_type_cd in ('R', 'MH'))
begin
	if exists
	(
		select
			*
		from
			state_code with (nolock)
		where
			state_cd = @ptd
		and	commercial_acct_flag = 'T'
	)
	begin
		set @property_type = 'Commercial'
	end
	else
	begin
		set @property_type = 'Residential'
	end
end


select
	case_id = @case_id,
	prop_id = @prop_id,
	year = @prop_val_yr,
	sup_num = @sup_num,
	geo_id = isnull(@geo_id, space(0)),
	comments = isnull(@comments, space(0)),
	remarks = isnull(@remarks, space(0)),
	legal_desc = isnull(@legal_desc, space(0)),
	exemptions = isnull(@exemptions, space(0)),
	entities = isnull(@entities, space(0)),
	neighborhood = isnull(@neighborhood, space(0)),
	appraiser_name = isnull(@appraiser_name, space(0)),
	primary_situs = isnull(@primary_situs, space(0)),
	ptd = isnull(@ptd, space(0)),
	owner_name = isnull(@owner_name, space(0)),
	agent_name = isnull(@agent_name, space(0)),
	property_type = isnull(@property_type, space(0))

GO

