
CREATE  procedure AgentInactivate

@prop_id	int,
@owner_id	int,
@agent_id	int,
@prop_val_yr	numeric(4),
@pacs_user_id	int

as

declare @arb_mailings		char(1)
declare @ca_mailings		char(1)
declare @ent_mailings		char(1)
declare @expired_dt_tm		datetime
declare @appl_dt		datetime
declare @eff_dt			datetime
declare @auth_to_protest	char(1)
declare @auth_to_resolve	char(1)
declare @auth_confidential	char(1)
declare @auth_other		char(1)
declare @event_id 		int
declare @agent_name		varchar(70)
declare @pacs_user_name		varchar(30)
declare @event_desc		varchar(1000)
declare @owner_name		varchar(70)
declare @agent_cmnt		varchar(255)

declare @str_expired_dt_tm	varchar(25)
declare @str_appl_dt		varchar(25)
declare @str_eff_dt		varchar(25)


exec dbo.GetUniqueID 'event', @event_id output, 1, 0

select  @arb_mailings      = arb_mailings,	
	@ca_mailings       = ca_mailings,		
	@ent_mailings	   = ent_mailings,
	@expired_dt_tm	   = exp_dt,	
	@appl_dt           = appl_dt,	
	@eff_dt	           = eff_dt,		
	@auth_to_protest   = auth_to_protest,	
	@auth_to_resolve   = auth_to_resolve,	
	@auth_confidential = auth_confidential,	
	@auth_other        = auth_other,
	@agent_cmnt        = IsNull(agent_cmnt, '')
from agent_assoc
where owner_id     = @owner_id
and   prop_id      = @prop_id
and   owner_tax_yr = @prop_val_yr
and   agent_id     = @agent_id

if (@expired_dt_tm is null)
begin
	set @str_expired_dt_tm	= ''
end
else
begin	
	set @str_expired_dt_tm = convert(varchar(25), convert(varchar(2), datepart(mm, @expired_dt_tm)) + '/' 
				+ convert(varchar(2), datepart(dd, @expired_dt_tm)) + '/' 
				+ convert(varchar(4), datepart(yy, @expired_dt_tm)))

end


if (@appl_dt is null)
begin
	set @str_appl_dt	= ''
end
else
begin	
	set @str_appl_dt = convert(varchar(25), convert(varchar(2),datepart(mm, @appl_dt)) + '/' 
				+ convert(varchar(2),datepart(dd, @appl_dt)) + '/' 
				+ convert(varchar(4), datepart(yy, @appl_dt)))
end

if (@eff_dt is null)
begin
	set @str_eff_dt	= ''
end
else
begin	
	set @str_eff_dt = convert(varchar(25), convert(varchar(2),datepart(mm, @eff_dt)) + '/' 
				+ convert(varchar(2), datepart(dd, @eff_dt)) + '/' 
				+ convert(varchar(4), datepart(yy, @eff_dt)))
end

select @agent_name = file_as_name
from account
where acct_id = @agent_id


select @owner_name = file_as_name
from account
where acct_id = @owner_id
	
select @pacs_user_name = pacs_user_name
from pacs_user
where pacs_user_id = @pacs_user_id


set @event_desc = 'Agent: '
set @event_desc = @event_desc + @agent_name 
set @event_desc = @event_desc + ' was inactivated for Owner: ' + @owner_name + ' Year: ' + convert(varchar(4), @prop_val_yr)
set @event_desc = @event_desc + char(13) + char(10) + char(13) + char(10)
set @event_desc = @event_desc +  'Mailings   ' + char(13) + char(10)
set @event_desc = @event_desc +  '  ARB     : ' + IsNull(@arb_mailings, 'F') + char(13) + char(10)
set @event_desc = @event_desc +  '  CAD     : ' + IsNull(@ca_mailings, 'F') + char(13) + char(10)
set @event_desc = @event_desc +  '  Entity  : ' + IsNull(@ent_mailings, 'F') + char(13) + char(10) + char(13) + char(10)
set @event_desc = @event_desc +  'Authorities     ' + char(13) + char(10)
set @event_desc = @event_desc +  '   Protest     : ' + IsNull(@auth_to_protest, 'F')  + char(13) + char(10)
set @event_desc = @event_desc +  '   Resolve     : ' + IsNull(@auth_to_resolve, 'F')  + char(13) + char(10)
set @event_desc = @event_desc +  '   Confidential: ' + IsNull(@auth_confidential, 'F')  + char(13) + char(10)
set @event_desc = @event_desc +  '   Other       : ' + IsNull(@auth_other, 'F') + char(13) + char(10)  + char(13) + char(10)
set @event_desc = @event_desc +  'Dates ' + char(13) + char(10)
set @event_desc = @event_desc +  '   Application : ' + @str_appl_dt  + char(13) + char(10)
set @event_desc = @event_desc +  '   Effective   : ' + @str_eff_dt  + char(13) + char(10)
set @event_desc = @event_desc +  '   Expired     : ' + @str_expired_dt_tm  + char(13) + char(10)  + char(13) + char(10)
set @event_desc = @event_desc +  ' Comment: ' + @agent_cmnt

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
@event_id,
'A',
'SYSTEM',
GetDate(),
@pacs_user_name,
@event_desc,
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
@event_id
)

GO

