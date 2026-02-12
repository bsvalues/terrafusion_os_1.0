





CREATE   procedure ARBGetHeader

@prop_id	int,
@prop_val_yr	numeric(4),
@case_id	int

as


declare @geo_id			varchar(50)
declare @owner			varchar(70)
declare @appraiser		varchar(40)
declare @legal			varchar(255)
declare @situs			varchar(150)
declare @neighborhood		varchar(10)
declare @state_code		varchar(5)
declare @agent			varchar(70)
declare @exemptions		varchar(50)
declare @entities 		varchar(50)
declare @owner_id		int
declare @agent_id		int
declare @commercial_account		char(1)
declare @prop_type_cd		varchar(5)
declare @prop_type_desc	varchar(50)
declare @sup_num		int
declare @appraiser_id	int
declare @comment		varchar(3000)
declare @remarks		varchar(3000)


SELECT  @geo_id 	   = p.geo_id,
        @legal		   = pv.legal_desc,
        @neighborhood      = pv.hood_cd,
        @sup_num	   = pv.sup_num,
	@appraiser_id = pv.last_appraiser_id,
	@prop_type_cd      = p.prop_type_cd,
	@prop_type_desc = pt.prop_type_desc,
	@comment			= p.prop_cmnt,
	@remarks			= p.remarks

from prop_supp_assoc as psa with(nolock)
join property_val as pv with(nolock) on
	psa.prop_id = pv.prop_id and
	psa.owner_tax_yr = pv.prop_val_yr and
	psa.sup_num = pv.sup_num
join property as p with(nolock) on
	psa.prop_id = p.prop_id
join property_type as pt with(nolock) on
	p.prop_type_cd = pt.prop_type_cd
where psa.prop_id = @prop_id
and psa.owner_tax_yr = @prop_val_yr

select @appraiser = appraiser_nm
from appraiser with(nolock)
where appraiser_id = @appraiser_id

select @situs = REPLACE(situs_display, CHAR(13) + CHAR(10), ' ')
from situs with(nolock)
where prop_id = @prop_id
and   primary_situs = 'Y'

select @state_code     = state_cd
from property_profile with(nolock)
where prop_id     = @prop_id
and   prop_val_yr = @prop_val_yr 


select top 1 @owner = account.file_as_name,
	     @owner_id = account.acct_id
from owner with(nolock)
join account with(nolock) on
	owner.owner_id = account.acct_id
where owner.prop_id  = @prop_id
and   owner.owner_tax_yr = @prop_val_yr
and   owner.sup_num  = @sup_num


select top 1 @agent = account.file_as_name,
	     @agent_id = account.acct_id
from agent_assoc with(nolock)
join account with(nolock) on
	agent_assoc.agent_id = account.acct_id
where agent_assoc.prop_id = @prop_id
and   agent_assoc.owner_tax_yr = @prop_val_yr
and   (agent_assoc.arb_mailings = 'T'
or    agent_assoc.ca_mailings  = 'T')

-- get exemptions 

exec ARBGetExemptions @prop_id, @sup_num, @prop_val_yr, @exemptions output
exec ARBGetEntities   @prop_id, @sup_num, @prop_val_yr, @entities   output


-- check the account_type
/*
if (@prop_type_cd in ('R', 'MH'))
begin
	if exists (select * from state_code
		   where commercial_acct_flag  = 'T'
		   and   state_cd = @state_code)
	begin
		set @account_type = 'Commercial'
	end
	else
	begin
		set @account_type = 'Residential'
	end
end
else if (@prop_type_cd = 'MN')
begin
	set @account_type = 'Mineral'
end
else if (@prop_type_cd = 'P')
begin
	set @account_type = 'Personal'
end
else if (@prop_type_cd = 'A')
begin
	set @account_type = 'Auto'
end
*/

if (@prop_type_cd in ('R', 'MH'))
begin
	if exists (
		select * from state_code with(nolock)
		where state_cd = @state_code and commercial_acct_flag = 'T'
	)
	begin
		set @commercial_account = 'T'
	end
end


select geo_id       = @geo_id,			
       owner        = @owner,			
       appraiser    = @appraiser,		
       legal        = @legal,			
       situs        = @situs,			
       neighborhood = @neighborhood,		
       state_code   = @state_code,		
       agent        = @agent,			
       exemptions   = @exemptions,		
       entities     = @entities,
       appraiser_id = @appraiser_id,
      owner_id     = @owner_id,
       agent_id     = @agent_id,
       prop_type_cd = @prop_type_cd,
       prop_type_desc = @prop_type_desc,
      commercial_account = @commercial_account,
	  comment		= @comment,
	  remarks		= @remarks

GO

