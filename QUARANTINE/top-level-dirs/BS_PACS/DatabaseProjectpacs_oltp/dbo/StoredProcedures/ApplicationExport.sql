





CREATE     procedure ApplicationExport

@input_sql	varchar(2048),
@input_type	varchar(5),
@input_event	char(1),
@input_user_id	int

as

--Revision History
--1.0; Creation
--1.1; PratimaV 01/26/2004 - Added for Collin CAD - BPP Application Info Export
--1.2; EricZ 01/27/2004 - Modified market_val logic to pull previous year values per request from Twila @ Collin CAD
--1.3; JeremyW 01/17/2005 - Added prop_sic_cd and state_cd for Collin CAD rendition export
--1.4; JeremyW 02/08/2005 - modified to pull state_cd from property_profile, added code to eliminate \n and \r from legal_desc
--                          and fixed issue where market value was repeating for properties with no prior year
create table #property
(
prop_id	int	 null
)


declare @temp_sql		varchar(1000)
declare @sa_addr_line1		varchar(50)
declare @sa_addr_line2		varchar(50)
declare @sa_addr_line3		varchar(50)
declare @sa_city		varchar(50)
declare @sa_state		varchar(2)
declare @sa_zip			varchar(50)
declare @sa_phone_num		varchar(25)
declare @sa_phone_num2		varchar(25)
declare @sa_fax_num		varchar(25)
declare @sa_url			varchar(50)
declare @file_as_name		varchar(70) 
declare @addr_line1		varchar(60) 
declare @addr_line2		varchar(60) 
declare @addr_line3		varchar(60) 
declare @addr_city		varchar(50) 
declare @addr_state		varchar(2) 
declare @country_cd		varchar(5) 
declare @addr_zip		varchar(50) 
declare @geo_id			varchar(50) 
declare @prop_id		varchar(25) 
declare @owner_id		varchar(25)
declare @legal_desc		varchar(255) 
declare @situs_num		varchar(10)
declare @situs_street_prefx	varchar(10) 
declare @situs_street		varchar(50) 
declare @situs_street_sufix	varchar(10) 
declare @situs_city		varchar(30) 
declare @situs_state		varchar(2) 
declare @situs_zip		varchar(10) 
declare @situs			varchar(130)
declare @prop_type_cd		varchar(5)
declare @int_prop_id		int
declare @int_owner_id		int
declare @int_sup_num		int
declare @prop_val_yr		numeric(4)
declare @entities		varchar(50)
declare @exemptions		varchar(50)
declare @barcode		varchar(100)
declare @school_cd		varchar(5)
declare @appraiser_nm		varchar(40)
declare @appraiser_id		int
declare @dba_name		varchar(50)
declare @agent_id		varchar(25)
declare @agent_file_as_name	varchar(70) 
declare @agent_addr_line1	varchar(60) 
declare @agent_addr_line2	varchar(60) 
declare @agent_addr_line3	varchar(60) 
declare @agent_addr_city	varchar(50) 
declare @agent_addr_state	varchar(2) 
declare @agent_country_cd	varchar(5) 
declare @agent_addr_zip		varchar(50)
declare @market			numeric(14,0) --1.1; PratimaV 01/26/2004 - Added for Collin CAD - BPP Application Info Export
declare @prop_sic_cd		char(5)
declare @state_cd		char(5)

delete from application_export where pacs_user_id = @input_user_id

select  @sa_addr_line1 = addr_line1,
	@sa_addr_line2 = addr_line2,                                         
	@sa_addr_line3 = addr_line3,                                         
	@sa_city       = city,                                               
	@sa_state      = state, 
	@sa_zip	       = zip,                                                
	@sa_phone_num  = phone_num,                 
	@sa_phone_num2 = phone_num2,
	@sa_fax_num    = fax_num,
	@sa_url        = url
from system_address
where system_type = 'A'                                            


set @temp_sql = 'insert into #property '
set @temp_sql = @temp_sql + @input_sql

exec (@temp_sql)

DECLARE PROPERTY CURSOR FORWARD_ONLY STATIC
FOR SELECT dbo.account.file_as_name, dbo.address.addr_line1, dbo.address.addr_line2, dbo.address.addr_line3, dbo.address.addr_city, convert(varchar(2), dbo.address.addr_state), 
           dbo.address.country_cd, dbo.address.addr_zip, dbo.property.geo_id, convert(varchar(25), dbo.property.prop_id),  convert(varchar(25), owner.owner_id), dbo.property_val.legal_desc, IsNull(dbo.situs.situs_num, ''), 
           IsNull(dbo.situs.situs_street_prefx, ''), IsNull(dbo.situs.situs_street, ''), IsNull(dbo.situs.situs_street_sufix, ''), IsNull(dbo.situs.situs_city, ''), IsNull(dbo.situs.situs_state, ''), IsNull(dbo.situs.situs_zip, ''), 
           dbo.property.prop_type_cd, property_val.prop_id, property_val.sup_num, property_val.prop_val_yr, owner.owner_id, property_val.last_appraiser_id, property.dba_name,
	   dbo.agent_assoc.agent_id, agent_account.file_as_name, agent_address.addr_line1, agent_address.addr_line2, agent_address.addr_line3, agent_address.addr_city,
	   convert(varchar(2), agent_address.addr_state), agent_address.country_cd, agent_address.addr_zip, dbo.property.prop_sic_cd, dbo.property_profile.state_cd
FROM  dbo.situs 
RIGHT OUTER JOIN  dbo.account 
INNER JOIN dbo.owner ON dbo.account.acct_id = dbo.owner.owner_id 
INNER JOIN dbo.address ON dbo.account.acct_id = dbo.address.acct_id AND dbo.address.primary_addr = 'Y' 
INNER JOIN dbo.property 
INNER JOIN dbo.prop_supp_assoc ON dbo.property.prop_id = dbo.prop_supp_assoc.prop_id 
INNER JOIN dbo.property_val ON dbo.prop_supp_assoc.prop_id = dbo.property_val.prop_id AND 
      dbo.prop_supp_assoc.owner_tax_yr = dbo.property_val.prop_val_yr 
	AND dbo.prop_supp_assoc.sup_num = dbo.property_val.sup_num 
	and dbo.property_val.prop_inactive_dt is null
ON 
      dbo.owner.prop_id = dbo.property_val.prop_id AND dbo.owner.owner_tax_yr = dbo.property_val.prop_val_yr AND 
      dbo.owner.sup_num = dbo.property_val.sup_num 
INNER JOIN dbo.pacs_system ON dbo.prop_supp_assoc.owner_tax_yr = dbo.pacs_system.appr_yr 
INNER JOIN #property on dbo.property.prop_id = #property.prop_id
ON dbo.situs.prop_id = dbo.property.prop_id
and situs.primary_situs = 'Y'
LEFT OUTER JOIN dbo.agent_assoc ON dbo.agent_assoc.prop_id = dbo.prop_supp_assoc.prop_id
		AND dbo.agent_assoc.owner_tax_yr = dbo.prop_supp_assoc.owner_tax_yr
		AND dbo.agent_assoc.owner_id = dbo.owner.owner_id
		AND dbo.agent_assoc.ca_mailings = 'T'
		AND ((dbo.agent_assoc.eff_dt is not null
			AND dbo.agent_assoc.exp_dt is not null
			AND dbo.agent_assoc.eff_dt <= GetDate()
			AND dbo.agent_assoc.exp_dt >= GetDate())
		OR (dbo.agent_assoc.eff_dt is not null
			AND dbo.agent_assoc.exp_dt is null
			AND dbo.agent_assoc.eff_dt <= GetDate())
		OR (dbo.agent_assoc.eff_dt is null AND
			dbo.agent_assoc.exp_dt is null))
LEFT OUTER JOIN dbo.account AS agent_account ON dbo.agent_assoc.agent_id = agent_account.acct_id
LEFT OUTER JOIN dbo.address AS agent_address ON agent_account.acct_id = agent_address.acct_id AND agent_address.primary_addr = 'Y'
LEFT OUTER JOIN dbo.property_profile on property_profile.prop_id = property_val.prop_id AND property_profile.prop_val_yr = property_val.prop_val_yr

open property
fetch next from property into 
	@file_as_name,		
	@addr_line1,		
	@addr_line2,		
	@addr_line3,		
	@addr_city,		
	@addr_state,		
	@country_cd,		
	@addr_zip,		
	@geo_id,		
	@prop_id,		
	@owner_id,
	@legal_desc,		
	@situs_num,		
	@situs_street_prefx,	
	@situs_street,		
	@situs_street_sufix,	
	@situs_city,		
	@situs_state,		
	@situs_zip,		
	@prop_type_cd,
	@int_prop_id,
	@int_sup_num,
	@prop_val_yr,
	@int_owner_id,
	@appraiser_id,
	@dba_name,
	@agent_id,
	@agent_file_as_name,
	@agent_addr_line1,
	@agent_addr_line2,
	@agent_addr_line3,
	@agent_addr_city,
	@agent_addr_state,
	@agent_country_cd,
	@agent_addr_zip,
	@prop_sic_cd,
	@state_cd

while (@@FETCH_STATUS = 0)
begin
	-- clear 
	set @situs      	= ''
	set @exemptions 	= ''
	set @entities        	= ''
	set @barcode      	= ''
	set @school_cd   	= ''
	set @appraiser_nm 	= ''

	exec GetExemptions '', @int_prop_id,@int_owner_id, @int_sup_num, @prop_val_yr, @exemptions output
	exec GetEntities   '', @int_prop_id, @int_sup_num, @prop_val_yr, @entities   output
	exec GetSchoolEntity @int_prop_id, @int_sup_num, @prop_val_yr, @school_cd output

	--1.2; Set previous year market value
	if not exists(select * from property_val where prop_id = @int_prop_id and prop_val_yr = (@prop_val_yr - 1) and prop_inactive_dt is null)
	begin
		select @market = 0
	end
	else
	begin
		select @market = isnull(pv.market, 0)
		from property_val pv with (nolock)
		left outer join prop_supp_assoc psa with (nolock)
			on pv.prop_id 		= psa.prop_id
			and pv.sup_num 		= psa.sup_num
			and pv.prop_val_yr 	= psa.owner_tax_yr
		where pv.prop_inactive_dt is null
		and pv.prop_val_yr = (@prop_val_yr - 1)
		and pv.prop_id 		= @int_prop_id
	end

	-- build barcode 
	if (@input_type = 'HS')
	begin
		set @barcode = '/*HS-1-1-' + @prop_id + '-' + @owner_id + '-' + convert(varchar(4), @prop_val_yr) + ' */'
	end
	else if (@input_type = 'BPP')
	begin
		set @barcode = '/*BPP-1-0-' + @prop_id + '-' + @owner_id + '-' + convert(varchar(4), @prop_val_yr) + ' */'
	end

	
	-- build situs
	set @situs = @situs_num

	if (len(@situs_street_prefx) > 0 and len(@situs) > 0)
	begin
		set @situs = @situs + ' '
	end
	
	set @situs = @situs + @situs_street_prefx

	if (len(@situs_street) > 0 and len(@situs) > 0)
	begin
		set @situs = @situs + ' '
	end
	
	set @situs = @situs + @situs_street

	if (len(@situs_street_sufix) > 0 and len(@situs) > 0)
	begin
		set @situs = @situs + ' '
	end

	set @situs = @situs + @situs_street_sufix

	if (len(@situs_city) > 0 and len(@situs) > 0)
	begin
		set @situs = @situs + ' '
	end

	set @situs = @situs + @situs_city

	if (len(@situs_state) > 0 and len(@situs) > 0)
	begin
		set @situs = @situs + ', '
	end

	set @situs = @situs + @situs_state
	
	if (len(@situs_zip) > 0 and len(@situs) > 0)
	begin
		set @situs = @situs + ' '
	end

	set @situs = @situs + @situs_zip

	set @situs = replace(@situs, CHAR(10), ' ')
	set @addr_line1 = replace(@addr_line1, CHAR(10), ' ')
	set @addr_line2 = replace(@addr_line2, CHAR(10), ' ')
	set @addr_line3 = replace(@addr_line3, CHAR(10), ' ')

	set @situs = replace(@situs, CHAR(13), ' ')
	set @addr_line1 = replace(@addr_line1, CHAR(13), ' ')
	set @addr_line2 = replace(@addr_line2, CHAR(13), ' ')
	set @addr_line3 = replace(@addr_line3, CHAR(13), ' ')

	set @legal_desc = replace(@legal_desc, CHAR(13), ' ')
	set @legal_desc = replace(@legal_desc, CHAR(10), ' ')

	-- get appraisre
	select @appraiser_nm = appraiser_nm
	from appraiser
	where appraiser_id = @appraiser_id
	

	insert into application_export
	(
		pacs_user_id,
		app_type,
		sa_addr_line1,
		sa_addr_line2,
		sa_addr_line3,
		sa_city,
		sa_state,
		sa_zip,
		sa_phone_num,
		sa_phone_num2,
		sa_fax_num,
		sa_url,
		owner_name,
		addr_line1,
		addr_line2,
		addr_line3,
		addr_city,
		addr_state,
		addr_country_cd,
		addr_zip,
		geo_id,
		prop_id,
		owner_id,
		prop_type_cd,
		legal_desc,
		situs,
		entities,
		exemptions,
		prop_val_yr,
		barcode,
		school_cd,
		appraiser_nm,
		dba_name,
		agent_id,
		agent_name,
		agent_addr_line1,
		agent_addr_line2,
		agent_addr_line3,
		agent_addr_city,
		agent_addr_state,
		agent_addr_country_cd,
		agent_addr_zip,
		market,
		prop_sic_cd,
		state_cd
	)
	values
	(
		@input_user_id,
		@input_type,
		@sa_addr_line1,
		@sa_addr_line2,
		@sa_addr_line3,
		@sa_city,
		@sa_state,
		@sa_zip,
		@sa_phone_num,
		@sa_phone_num2,
		@sa_fax_num,
		@sa_url,
		@file_as_name,		
		@addr_line1,		
		@addr_line2,		
		@addr_line3,		
		@addr_city,		
		@addr_state,		
		@country_cd,		
		@addr_zip,		
		@geo_id,		
		@prop_id,	
		@owner_id,
		@prop_type_cd,	
		@legal_desc,		
		@situs,
		@entities,
		@exemptions,
		convert(varchar(4), @prop_val_yr),
		@barcode,
		@school_cd,
		@appraiser_nm,
		@dba_name,
		@agent_id,
		@agent_file_as_name,
		@agent_addr_line1,
		@agent_addr_line2,
		@agent_addr_line3,
		@agent_addr_city,
		@agent_addr_state,
		@agent_country_cd,
		@agent_addr_zip,
		@market,
		@prop_sic_cd,
		@state_cd
	)

	
	if (@input_event = 'T')
	begin
		exec ApplicationInsertEvent @int_prop_id, @input_type, @input_user_id
	end

	fetch next from property into 
		@file_as_name,		
		@addr_line1,		
		@addr_line2,		
		@addr_line3,		
		@addr_city,		
		@addr_state,		
		@country_cd,		
		@addr_zip,		
		@geo_id,		
		@prop_id,		
		@owner_id,
		@legal_desc,		
		@situs_num,		
		@situs_street_prefx,	
		@situs_street,		
		@situs_street_sufix,	
		@situs_city,		
		@situs_state,		
		@situs_zip,		
		@prop_type_cd,
		@int_prop_id,
		@int_sup_num,
		@prop_val_yr,
		@int_owner_id,
		@appraiser_id,
		@dba_name,
		@agent_id,
		@agent_file_as_name,
		@agent_addr_line1,
		@agent_addr_line2,
		@agent_addr_line3,
		@agent_addr_city,
		@agent_addr_state,
		@agent_country_cd,
		@agent_addr_zip,
		@prop_sic_cd,
		@state_cd
end

close 		property
deallocate	property

GO

