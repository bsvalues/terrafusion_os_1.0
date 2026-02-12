






CREATE   procedure ARBInquiryProcessPropInfo

@prop_id	int,
@prop_val_yr	numeric(4)

as

declare @output_prop_id	int
declare @geo_id		varchar(50)
declare @owner		varchar(70)
declare @legal		varchar(255)
declare @situs		varchar(150)
declare @exemptions	varchar(50)
declare @entities	varchar(50)
declare @owner_id	int
declare @sup_num	int
declare @addr_line1	varchar(60)
declare @addr_line2	varchar(60)
declare @addr_line3	varchar(60)
declare @addr_city	varchar(50)
declare @addr_state	varchar(50)
declare @addr_zip	varchar(50)
declare @address	varchar(330)
declare @agent_id	int
declare @agent_name	varchar(70)


set @output_prop_id = -1
set @sup_num = -1
set @owner_id = -1
set @agent_id = -1

select
	@output_prop_id = psa.prop_id,
	@geo_id = p.geo_id,
	@legal = pv.legal_desc,
	@sup_num = pv.sup_num
from
	prop_supp_assoc as psa with (nolock)
join
	property_val as pv with (nolock)
on
	psa.prop_id = pv.prop_id
and	psa.owner_tax_yr = pv.prop_val_yr
and	psa.sup_num = pv.sup_num
join
	property as p with (nolock)
on
	psa.prop_id = p.prop_id
where
	psa.prop_id = @prop_id
and	psa.owner_tax_yr = @prop_val_yr

if (@output_prop_id = @prop_id)
begin
	set nocount on


	select
		@situs = LTRIM(REPLACE(isnull(situs_display, ''), CHAR(13) + CHAR(10), ' '))
	from
		situs
	where
		prop_id = @prop_id
	and	primary_situs = 'Y'
	
	set @owner_id = -1

	select top 1
		@owner = acct.file_as_name,
		@owner_id = acct.acct_id,
		@addr_line1 = isnull(addr.addr_line1, ''), 
		@addr_line2 = isnull(addr.addr_line2, ''), 
		@addr_line3 = isnull(addr.addr_line3, ''),
		@addr_city = isnull(addr.addr_city,  ''),
		@addr_state = isnull(addr.addr_state, ''),
		@addr_zip = isnull(addr.addr_zip,   '') 
	from
		owner as o with (nolock)
	join
		account as acct with (nolock)
	on
		o.owner_id = acct.acct_id
	join
		address as addr with (nolock)
	on
		acct.acct_id = addr.acct_id
	and	addr.primary_addr = 'Y'
	where
		o.prop_id = @prop_id
	and	o.sup_num  = @sup_num
	and	o.owner_tax_yr = @prop_val_yr
	
	
	set @address = ''
	
	if (@addr_line1 <> '')
	begin
		set @address = @address + @addr_line1
	end
	
	if (@addr_line2 <> '')
	begin
		if (@address <> '')
		begin
			set @address = @address + ' ' 
		end
			
		set @address = @address + @addr_line2
	end
	
	if (@addr_line3 <> '')
	begin
		if (@address <> '')
		begin
			set @address = @address + ' ' 
		end
			
		set @address = @address + @addr_line3
	end
	
	if (@addr_city <> '')
	begin
		if (@address <> '')
		begin
			set @address = @address + ' ' 
		end
			
		set @address = @address + @addr_city
	end
	
	if (@addr_state <> '')
	begin
		if (@address <> '')
		begin
			set @address = @address + ', ' 
		end
			
		set @address = @address + @addr_state
	end
	
	if (@addr_zip <> '')
	begin
		if (@address <> '')
		begin
			set @address = @address + ' ' 
		end
			
		set @address = @address + @addr_zip
	end
	
	
	-- get exemptions 
	
	exec ARBGetExemptions @prop_id, @sup_num, @prop_val_yr, @exemptions output


	select
		@agent_id = aa.agent_id,
		@agent_name = acct.file_as_name 
	from
		agent_assoc as aa with (nolock)
	join
		account as acct with (nolock)
	on
		aa.agent_id = acct.acct_id
	where
		aa.prop_id = @prop_id
	and	aa.owner_tax_yr = @prop_val_yr
end


set nocount off

select
	prop_id = @output_prop_id,
	geo_id = @geo_id,			
	owner = @owner,	
	owner_id = @owner_id,
	sup_num = @sup_num,
	address = @address,		
	legal = @legal,			
	situs = @situs,			
	exemptions = @exemptions,
	agent_id = @agent_id,
	agent_name = @agent_name

GO

