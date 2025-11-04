
CREATE PROCEDURE PROPLM

	@id1 		int, -- prop_id
	@id2 		int, -- owner_id
	@year 		numeric(4,0) = null,
	@sup_num 	int = null

AS

--Revision History
--1.0 Created
--1.1 12/10/2003 ELZ; added a bunch of fields and reformatted the stored proc to look more presentable
--1.2 06/07/2004 REC; added new zip code fields

if (@id1 > 0)
begin
	if (@year is null)
	begin
		if exists
		(
			select * from pacs_system with (nolock) where system_type in ('A', 'B')
		)
		begin
			select @year = appr_yr from pacs_system with (nolock) where system_type in ('A', 'B')
		end
		else
		begin
			select @year = tax_yr from pacs_system with (nolock) where system_type = 'C'
		end
	end

	if (@sup_num is null)
	begin
		select @sup_num = sup_num from prop_supp_assoc with (nolock) where prop_id = @id1 and owner_tax_yr = @year
	end

	declare @exempt_code as varchar(5)
	declare @exemptions as varchar(200)
	declare @entity_code as varchar(5)
	declare @entities as varchar(200)
	declare @prop_id_barcode as varchar(20)
	
	--build the barcode string for the prop_id
	select @prop_id_barcode = '!' + CAST( @id1 as VARCHAR(20)) + '!'
	--Get Exemptions
	set @exemptions = ''

	declare EXEMPTIONS cursor fast_forward
	for
	select
		rtrim(exmpt_type_cd)
	from
		property_exemption with (nolock)
	where
		prop_id = @id1
	and	owner_id = @id2
	and	exmpt_tax_yr = @year
	and	exmpt_type_cd <> 'AG'
	and	sup_num = @sup_num

	open EXEMPTIONS

	fetch next from EXEMPTIONS into @exempt_code

	while @@fetch_status = 0
	begin
		if len(@exemptions) <> 0
		begin
			set @exemptions = @exemptions + ', '
		end
		set @exemptions = @exemptions + @exempt_code

		fetch next from EXEMPTIONS into @exempt_code
	end

	close EXEMPTIONS
	deallocate EXEMPTIONS

	--Get Entities
	set @entities = ''

	declare ENTITIES cursor fast_forward
	for
	select
		rtrim(entity_cd)
	from
		entity_prop_assoc as epa with (nolock)
	inner join
		entity with (nolock)
	on
		epa.entity_id = entity.entity_id
	where
		epa.prop_id = @id1
	and	epa.tax_yr = @year
	and	epa.sup_num = @sup_num

	open ENTITIES

	fetch next from ENTITIES into @entity_code

	while @@fetch_status = 0
	begin
		if len(@entities) <> 0
		begin
			set @entities = @entities + ', '
		end

		set @entities = @entities + @entity_code

		fetch next from ENTITIES into @entity_code
	end

	close ENTITIES
	deallocate ENTITIES

	--Get Collection Owner Info
	declare @col_owner_id int
	declare @col_owner_name varchar(70)
	declare @col_owner_addr_line1 varchar(60)
	declare @col_owner_addr_line2 varchar(60)
	declare @col_owner_addr_line3 varchar(60)
	declare @col_owner_addr_city varchar(50)
	declare @col_owner_addr_state varchar(50)
	declare @col_owner_addr_zip varchar(50)
	declare @col_owner_addr_country varchar(5)
	declare @col_owner_addr_country_desc varchar(50)
	declare @col_owner_addr_csz varchar(150)
	declare @col_owner_zip varchar(5)
	declare @col_owner_cass varchar(4)
	declare @col_owner_route varchar(2)
	declare @col_owner_zip_4_2 varchar(14)
	declare @col_owner_addr_is_international bit

	select
		@col_owner_id = property.col_owner_id,
		@col_owner_name =
			case
				when account.confidential_file_as_name is not null then account.confidential_file_as_name
				else isnull(account.file_as_name, '')
			end,
		@col_owner_addr_line1 = rtrim(isnull(address.addr_line1, '')),
		@col_owner_addr_line2 = rtrim(isnull(address.addr_line2, '')),
		@col_owner_addr_line3 = rtrim(isnull(address.addr_line3, '')),
		@col_owner_addr_city = rtrim(isnull(address.addr_city, '')),
		@col_owner_addr_state = rtrim(isnull(address.addr_state, '')),
		@col_owner_addr_zip = rtrim(isnull(address.addr_zip, '')),
		@col_owner_addr_country = rtrim(isnull(address.country_cd, '')),
		@col_owner_addr_country_desc = rtrim(isnull(country.country_name, '')),
		@col_owner_addr_csz = rtrim(isnull(address.addr_city, '')) + ', ' + rtrim(isnull(address.addr_state, '')) + ' ' + rtrim(isnull(address.addr_zip, '')),
		@col_owner_zip = rtrim(isnull(address.zip, '')),
		@col_owner_cass = rtrim(isnull(address.cass, '')),
		@col_owner_route = rtrim(isnull(address.route, '' )),
		@col_owner_zip_4_2 = rtrim(isnull(address.zip_4_2, '')),
		@col_owner_addr_is_international = isnull(address.is_international, 0)
	from
		property with (nolock)
	inner join
		account with (nolock)
	on
		account.acct_id = property.col_owner_id
	inner join
		address with (nolock)
	on
		address.acct_id = account.acct_id
	and	address.primary_addr = 'Y'
	left outer join 
		country with (nolock)
	on
		country.country_cd = address.country_cd
	where
		property.prop_id = @id1

	--Get Collection Agent Info
	declare @col_agent_id int
	declare @col_agent_name varchar(70)
	declare @col_agent_addr_line1 varchar(60)
	declare @col_agent_addr_line2 varchar(60)
	declare @col_agent_addr_line3 varchar(60)
	declare @col_agent_addr_city varchar(50)
	declare @col_agent_addr_state varchar(50)
	declare @col_agent_addr_zip varchar(50)
	declare @col_agent_addr_country varchar(5)
	declare @col_agent_addr_country_desc varchar(50)
	declare @col_agent_addr_csz varchar(150)
	declare @col_agent_zip varchar(5)
	declare @col_agent_cass varchar(4)
	declare @col_agent_route varchar(2)
	declare @col_agent_zip_4_2 varchar(14)
	declare @col_agent_addr_is_international bit

	select
		@col_agent_id = property.col_agent_id,
		@col_agent_name =
			case
				when account.confidential_file_as_name is not null then account.confidential_file_as_name
				else isnull(account.file_as_name, '')
			end,
		@col_agent_addr_line1 = rtrim(isnull(address.addr_line1, '')),
		@col_agent_addr_line2 = rtrim(isnull(address.addr_line2, '')),
		@col_agent_addr_line3 = rtrim(isnull(address.addr_line3, '')),
		@col_agent_addr_city = rtrim(isnull(address.addr_city, '')),
		@col_agent_addr_state = rtrim(isnull(address.addr_state, '')),
		@col_agent_addr_zip = rtrim(isnull(address.addr_zip, '')),
		@col_agent_addr_country = rtrim(isnull(address.country_cd, '')),
		@col_agent_addr_country_desc = rtrim(isnull(country.country_name, '')),
		@col_agent_addr_csz = rtrim(isnull(address.addr_city, '')) + ', ' + rtrim(isnull(address.addr_state, '')) + ' ' + rtrim(isnull(address.addr_zip, '')),
		@col_agent_zip = rtrim(isnull(address.zip, '')),
		@col_agent_cass = rtrim(isnull(address.cass, '')),
		@col_agent_route = rtrim(isnull(address.route, '' )),
		@col_agent_zip_4_2 = rtrim(isnull(address.zip_4_2, '')),
		@col_agent_addr_is_international = isnull(address.is_international, 0)
	from
		property with (nolock)
	inner join
		account with (nolock)
	on
		account.acct_id = property.col_agent_id
	inner join
		address with (nolock)
	on
		address.acct_id = account.acct_id
	and	address.primary_addr = 'Y'
	left outer join
		country with (nolock)
	on
		country.country_cd = address.country_cd
	where
		property.prop_id = @id1

	--Get CA Agent Info
	declare @ca_agent_id as int
	declare @ca_agent_name as varchar(70)
	declare @ca_addr_line1 as varchar(60)
	declare @ca_addr_line2 as varchar(60)
	declare @ca_addr_line3 as varchar(60)
	declare @ca_addr_city as varchar(50)
	declare @ca_addr_state as varchar(50)
	declare @ca_addr_zip as varchar(50)
	declare @ca_addr_country as varchar(5)
	declare @ca_addr_country_desc as varchar(50)
	declare @ca_addr_csz as varchar(150)
	declare @ca_zip as varchar(5)
	declare @ca_cass as varchar(4)
	declare @ca_route as varchar(2)
	declare @ca_zip_4_2 as varchar(14)
	declare @ca_addr_is_international bit

	select
		@ca_agent_id = isnull(agent_assoc.agent_id, 0),
		@ca_agent_name = isnull(account.file_as_name, ''),
		@ca_addr_line1 = isnull(address.addr_line1, ''),
		@ca_addr_line2 = isnull(address.addr_line2, ''),
		@ca_addr_line3 = isnull(address.addr_line3, ''),
		@ca_addr_city = isnull(address.addr_city, ''),
		@ca_addr_state = isnull(address.addr_state, ''),
		@ca_addr_zip = isnull(address.addr_zip, ''),
		@ca_addr_country = rtrim(isnull(address.country_cd, '')),
		@ca_addr_country_desc = rtrim(isnull(country.country_name, '')),
		@ca_zip = isnull(address.zip,''),
		@ca_cass = isnull(address.cass,''),
		@ca_route = isnull(address.route,''),
		@ca_zip_4_2 = isnull(address.zip_4_2,''),
		@ca_addr_is_international = isnull(address.is_international, 0)
	from
		agent_assoc with (nolock)
	inner join
		account with (nolock)
	on
		agent_assoc.agent_id = account.acct_id
	inner join
		address with (nolock)
	on
		account.acct_id = address.acct_id
	and	address.primary_addr = 'Y'
	left outer join
		country with (nolock)
	on
		country.country_cd = address.country_cd
	where
		prop_id = @id1
	and	owner_tax_yr = @year
	and	owner_id = @id2
	and	isnull(exp_dt, getdate() + 1) > getdate()
	and	ca_mailings = 'T'

	set @ca_addr_csz = rtrim(@ca_addr_city) + ', ' + rtrim(@ca_addr_state) + ' ' + rtrim(@ca_addr_zip)

	--Get Entity Agent Info
	declare @ent_agent_id as int
	declare @ent_agent_name as varchar(70)
	declare @ent_addr_line1 as varchar(60)
	declare @ent_addr_line2 as varchar(60)
	declare @ent_addr_line3 as varchar(60)
	declare @ent_addr_city as varchar(50)
	declare @ent_addr_state as varchar(50)
	declare @ent_addr_zip as varchar(50)
	declare @ent_addr_country as varchar(5)
	declare @ent_addr_country_desc as varchar(50)
	declare @ent_zip as varchar(5)
	declare @ent_cass as varchar(4)
	declare @ent_route as varchar(2)
	declare @ent_zip_4_2 as varchar(14)
	declare @ent_addr_is_international bit 

	select
		@ent_agent_id = isnull(agent_assoc.agent_id, 0),
		@ent_agent_name = isnull(account.file_as_name, ''),
		@ent_addr_line1 = isnull(address.addr_line1, ''),
		@ent_addr_line2 = isnull(address.addr_line2, ''),
		@ent_addr_line3 = isnull(address.addr_line3, ''),
		@ent_addr_city = isnull(address.addr_city, ''),
		@ent_addr_state = isnull(address.addr_state, ''),
		@ent_addr_zip = isnull(address.addr_zip, ''),
		@ent_addr_country = rtrim(isnull(address.country_cd, '')),
		@ent_addr_country_desc = rtrim(isnull(country.country_name, '')),
		@ent_zip = isnull(address.zip, ''),
		@ent_cass = isnull(address.cass, ''),
		@ent_route = isnull(address.route, ''),
		@ent_zip_4_2 = isnull(address.zip_4_2, ''),
		@ent_addr_is_international = isnull(address.is_international, 0)
	from
		agent_assoc with (nolock)
	inner join
		account with (nolock)
	on
		agent_assoc.agent_id = account.acct_id
	inner join
		address with (nolock)
	on
		account.acct_id = address.acct_id
	and	address.primary_addr = 'Y'
	left outer join
		country with (nolock)
	on
		country.country_cd = address.country_cd
	where
		prop_id = @id1
	and	owner_tax_yr = @year
	and	owner_id = @id2
	and	isnull(exp_dt, getdate() + 1) > getdate()
	and	ent_mailings = 'T'

	--Get ARB Agent Info
	declare @arb_agent_id as int
	declare @arb_agent_name as varchar(70)
	declare @arb_addr_line1 as varchar(60)
	declare @arb_addr_line2 as varchar(60)
	declare @arb_addr_line3 as varchar(60)
	declare @arb_addr_city as varchar(50)
	declare @arb_addr_state as varchar(50)
	declare @arb_addr_zip as varchar(50)
	declare @arb_addr_country as varchar(5)
	declare @arb_addr_country_desc as varchar(50)
	declare @arb_zip as varchar(5) 
	declare @arb_cass as varchar(4)
	declare @arb_route as varchar(2)
	declare @arb_zip_4_2 as varchar(14) 
	declare @arb_addr_is_international bit

	select
		@arb_agent_id = isnull(agent_assoc.agent_id, 0),
		@arb_agent_name = isnull(account.file_as_name, ''),
		@arb_addr_line1 = isnull(address.addr_line1, ''),
		@arb_addr_line2 = isnull(address.addr_line2, ''),
		@arb_addr_line3 = isnull(address.addr_line3, ''),
		@arb_addr_city = isnull(address.addr_city, ''),
		@arb_addr_state = isnull(address.addr_state, ''),
		@arb_addr_zip = isnull(address.addr_zip, ''),
		@arb_addr_country = rtrim(isnull(address.country_cd, '')),
		@arb_addr_country_desc = rtrim(isnull(country.country_name, '')),
		@arb_zip = isnull(address.zip, ''),
		@arb_cass = isnull(address.cass, ''),
		@arb_route = isnull(address.route, ''),
		@arb_zip_4_2 = isnull(address.zip_4_2, ''),
		@arb_addr_is_international = isnull(address.is_international, 0)
	from
		agent_assoc with (nolock)
	inner join
		account with (nolock)
	on
		agent_assoc.agent_id = account.acct_id
	inner join
		address with (nolock)
	on
		account.acct_id = address.acct_id
	and	address.primary_addr = 'Y'
	left outer join
		country with (nolock)
	on
		country.country_cd = address.country_cd
	where
		prop_id = @id1
	and	owner_tax_yr = @year
	and	owner_id = @id2
	and	isnull(exp_dt, getdate() + 1) > getdate()
	and	arb_mailings = 'T'

	--Get Appraiser Name
	declare @appraiser_nm as varchar(40)

	select
		@appraiser_nm = appraiser.appraiser_nm
	from
		property_val with (nolock)
	inner join
		appraiser with (nolock)
	on
		property_val.last_appraiser_id = appraiser.appraiser_id
	inner join
		prop_supp_assoc with (nolock)
	on
		property_val.prop_id = prop_supp_assoc.prop_id
	and	property_val.sup_num = prop_supp_assoc.sup_num
	and	property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
	where
		prop_supp_assoc.prop_id = @id1
	and	prop_supp_assoc.owner_tax_yr = @year

	--Get School Code
	declare @school_cd as varchar(5)

	select
		@school_cd = e.entity_cd
	from
		prop_supp_assoc as psa with (nolock)
	inner join
		entity_prop_assoc as epa with (nolock)
	on
		epa.prop_id = psa.prop_id
	and	epa.tax_yr = psa.owner_tax_yr
	and	epa.sup_num = psa.sup_num
	inner join
		entity as e with (nolock)
	on
		e.entity_id = epa.entity_id
	and	e.entity_type_cd = 'S'
	where
		psa.prop_id = @id1
	and	psa.owner_tax_yr = @year

	--Get phone numbers for OWNER
	declare @owner_phone_business as varchar(20)
	declare @owner_phone_business2 as varchar(20)
	declare @owner_phone_cell as varchar(20)
	declare @owner_phone_fax as varchar(20)
	declare @owner_phone_home as varchar(20)
	declare @owner_phone_home2 as varchar(20)

	select @owner_phone_business = phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'B'
	select @owner_phone_business2 = phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'B2'
	select @owner_phone_cell = phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'C'
	select @owner_phone_fax = phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'F'
	select @owner_phone_home = phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'H'
	select @owner_phone_home2 = phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'H2'

	--Get phone numbers for COLLECTIONS OWNER
	declare @col_owner_phone_business as varchar(20)
	declare @col_owner_phone_business2 as varchar(20)
	declare @col_owner_phone_cell as varchar(20)
	declare @col_owner_phone_fax as varchar(20)
	declare @col_owner_phone_home as varchar(20)
	declare @col_owner_phone_home2 as varchar(20)

	if (@col_owner_id > 0)
	begin
		select @col_owner_phone_business = phone_num from phone with (nolock) where acct_id = @col_owner_id and phone_type_cd = 'B'
		select @col_owner_phone_business2 = phone_num from phone with (nolock) where acct_id = @col_owner_id and phone_type_cd = 'B2'
		select @col_owner_phone_cell = phone_num from phone with (nolock) where acct_id = @col_owner_id and phone_type_cd = 'C'
		select @col_owner_phone_fax = phone_num from phone with (nolock) where acct_id = @col_owner_id and phone_type_cd = 'F'
		select @col_owner_phone_home = phone_num from phone with (nolock) where acct_id = @col_owner_id and phone_type_cd = 'H'
		select @col_owner_phone_home2 = phone_num from phone with (nolock) where acct_id = @col_owner_id and phone_type_cd = 'H2'
	end

	--Get phone numbers for COLLECTIONS AGENT
	declare @col_agent_phone_business as varchar(20)
	declare @col_agent_phone_business2 as varchar(20)
	declare @col_agent_phone_cell as varchar(20)
	declare @col_agent_phone_fax as varchar(20)
	declare @col_agent_phone_home as varchar(20)
	declare @col_agent_phone_home2 as varchar(20)

	if (@col_agent_id > 0)
	begin
		select @col_agent_phone_business = phone_num from phone with (nolock) where acct_id = @col_agent_id and phone_type_cd = 'B'
		select @col_agent_phone_business2 = phone_num from phone with (nolock) where acct_id = @col_agent_id and phone_type_cd = 'B2'
		select @col_agent_phone_cell = phone_num from phone with (nolock) where acct_id = @col_agent_id and phone_type_cd = 'C'
		select @col_agent_phone_fax = phone_num from phone with (nolock) where acct_id = @col_agent_id and phone_type_cd = 'F'
		select @col_agent_phone_home = phone_num from phone with (nolock) where acct_id = @col_agent_id and phone_type_cd = 'H'
		select @col_agent_phone_home2 = phone_num from phone with (nolock) where acct_id = @col_agent_id and phone_type_cd = 'H2'
	end

	--Get phone numbers for CA_AGENT
	declare @ca_agent_phone_business as varchar(20)
	declare @ca_agent_phone_business2 as varchar(20)
	declare @ca_agent_phone_cell as varchar(20)
	declare @ca_agent_phone_fax as varchar(20)
	declare @ca_agent_phone_home as varchar(20)
	declare @ca_agent_phone_home2 as varchar(20)

	if (@ca_agent_id > 0)
	begin
		select @ca_agent_phone_business = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'B'
		select @ca_agent_phone_business2 = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'B2'
		select @ca_agent_phone_cell = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'C'
		select @ca_agent_phone_fax = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'F'
		select @ca_agent_phone_home = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'H'
		select @ca_agent_phone_home2 = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'H2'
	end

	--Get phone numbers for ENT_AGENT
	declare @ent_agent_phone_business as varchar(20)
	declare @ent_agent_phone_business2 as varchar(20)
	declare @ent_agent_phone_cell as varchar(20)
	declare @ent_agent_phone_fax as varchar(20)
	declare @ent_agent_phone_home as varchar(20)
	declare @ent_agent_phone_home2 as varchar(20)

	if (@ent_agent_id > 0)
	begin
		select @ent_agent_phone_business = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'B'
		select @ent_agent_phone_business2 = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'B2'
		select @ent_agent_phone_cell = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'C'
		select @ent_agent_phone_fax = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'F'
		select @ent_agent_phone_home = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'H'
		select @ent_agent_phone_home2 = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'H2'
	end

	--Get phone numbers for ARB_AGENT
	declare @arb_agent_phone_business as varchar(20)
	declare @arb_agent_phone_business2 as varchar(20)
	declare @arb_agent_phone_cell as varchar(20)
	declare @arb_agent_phone_fax as varchar(20)
	declare @arb_agent_phone_home as varchar(20)
	declare @arb_agent_phone_home2 as varchar(20) 

	if (@arb_agent_id > 0)
	begin
		select @arb_agent_phone_business = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'B'
		select @arb_agent_phone_business2 = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'B2'
		select @arb_agent_phone_cell = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'C'
		select @arb_agent_phone_fax = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'F'
		select @arb_agent_phone_home = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'H'
		select @arb_agent_phone_home2 = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'H2'
	end

-- Sale Information
	
	declare @sale_land_acerage as numeric (18,4)
	declare @seller_name as varchar (60)
	declare @seller_addr_line1 as varchar (70)
	declare @seller_addr_line2 as varchar (70)
	declare @seller_addr_line3 as varchar (70)
	declare @seller_city as varchar (50)
	declare @seller_zip as varchar (20)
	declare @seller_state as varchar (20)
	declare @seller_country as varchar (20)
	declare @seller_country_desc as varchar(50)
	declare @seller_addr_is_international bit
	declare @seller_id as varchar (20)
	declare @chg_of_owner_id as varchar (20)
	declare @deed_dt as varchar (20)
	declare @sale_type_cd as varchar (20)
	declare @deed_type_cd as char(10)
	declare @grantor as varchar(30)
	declare @grantee as varchar(30)
	declare @deed_page as char(20)
	declare @buyer_id as int	
	declare @buyer_name as varchar(60)
	declare @buyer_addr_line1 as varchar (70)
	declare @buyer_addr_line2 as varchar (70)
	declare @buyer_addr_line3 as varchar (70)
	declare @buyer_city as varchar (50)
	declare @buyer_zip as varchar (20)
	declare @buyer_state as varchar (20)
	declare @buyer_country as varchar (20)
	declare @buyer_country_desc as varchar(50)
	declare @deed_volume as char(20)
	declare @buyer_addr_is_international bit

	select top 1
		@seller_id = seller_id ,
		@chg_of_owner_id = seller_assoc.chg_of_owner_id,
		@deed_dt = left(deed_dt,12),
		@deed_type_cd = chg_of_owner.deed_type_cd,
		@grantor = chg_of_owner.grantor_cv,
		@grantee = chg_of_owner.grantee_cv,
		@deed_page = chg_of_owner.deed_book_page,
		@deed_volume = chg_of_owner.deed_book_id
	from
		seller_assoc with (nolock)
	inner join
		chg_of_owner with (nolock)
	on
		chg_of_owner.chg_of_owner_id = seller_assoc.chg_of_owner_id
	where
		prop_id = @id1
	order by
		coo_sl_dt desc, chg_of_owner.chg_of_owner_id desc

	select
		@seller_name = file_as_name 
	from
		account with (nolock)
	where
		acct_id = @seller_id
	
	select 
		@seller_addr_line1 = isnull(addr_line1,''),
	    @seller_addr_line2  = isnull(addr_line2,''),
	    @seller_addr_line3 =  isnull(addr_line3,''),
	    @seller_city = isnull(addr_city,''),
		@seller_zip = isnull(addr_zip, ''),
		@seller_state = isnull(addr_state,''),
		@seller_country = isnull(address.country_cd,''),
		@seller_country_desc = isnull(country.country_name, ''),
		@seller_addr_is_international = isnull(address.is_international, 0)		
	from
		address with (nolock)
	left outer join
		country with (nolock)
	on
		country.country_cd = address.country_cd
	where
		acct_id = @seller_id 
	and	primary_addr = 'Y'

	select
		@sale_land_acerage = isnull(sl_land_acres,0),
		@sale_type_cd = isnull(sl_type_cd,'')
	from
		sale with (nolock)
	where
		chg_of_owner_id = @chg_of_owner_id

	select 
		@buyer_id = buyer_id
	from
		buyer_assoc
	where 
		buyer_assoc.chg_of_owner_id = @chg_of_owner_id

	select
		@buyer_name = file_as_name 
	from
		account with (nolock)
	where
		acct_id = @buyer_id

	select 
		@buyer_addr_line1 = isnull(addr_line1,''),
	    @buyer_addr_line2  = isnull(addr_line2,''),
	    @buyer_addr_line3 =  isnull(addr_line3,''),
	    @buyer_city = isnull(addr_city,''),
		@buyer_zip = isnull(addr_zip, ''),
		@buyer_state = isnull(addr_state,''),
		@buyer_country = isnull(address.country_cd,''),
		@buyer_country_desc = isnull(country.country_name, ''),
		@buyer_addr_is_international = isnull(address.is_international, 0)
	from
		address with (nolock)
	inner join
		country with (nolock)
	on
		country.country_cd = address.country_cd
	where
		acct_id = @buyer_id 
	and	primary_addr = 'Y'

	--RETURN VALUES
	select distinct
		property.prop_id as PROP_ID,
		coalesce(account.confidential_file_as_name, account.file_as_name, '') as OWNER_NAME,
		isnull(account.acct_id, 0) as OWNER_ID,
		dbo.fn_Address(
			coalesce(account.confidential_file_as_name, account.file_as_name, ''), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			country.country_name,
			address.is_international,
			5
		) as NAME_ADDRESS,
		dbo.fn_Address(
			coalesce(account.confidential_file_as_name, account.file_as_name, ''), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			country.country_name,
			address.is_international,
			5
		) as NAME_ADDRESS_5LINES,
		dbo.fn_Address(
			coalesce(account.confidential_file_as_name, account.file_as_name, ''), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			country.country_name,
			address.is_international,
			6
		) as NAME_ADDRESS_6LINES,
		rtrim(isnull(address.addr_line1, '')) as OWNER_ADDR_LINE1,
		isnull(address.addr_line2, '') as OWNER_ADDR_LINE2,
		isnull(address.addr_line3, '') as OWNER_ADDR_LINE3,
		isnull(address.addr_city, '') as OWNER_ADDR_CITY,
		isnull(address.addr_state, '') as OWNER_ADDR_STATE,
		isnull(address.addr_zip, '') as OWNER_ADDR_ZIP,
		isnull(address.country_cd, '') as OWNER_ADDR_COUNTRY,
		isnull(country.country_name, '') as OWNER_ADDR_COUNTRY_DESC,
		rtrim(isnull(address.addr_city, '')) + ', ' + rtrim(isnull(address.addr_state, '')) + ' ' + rtrim(isnull(address.addr_zip, '')) as OWNER_ADDR_CSZ,
		isnull(address.zip, '') as OWNER_ZIP,
		isnull(address.cass, '') as OWNER_CASS,
		isnull(address.route, '' ) as OWNER_ROUTE,
		isnull(address.zip_4_2, '' ) as OWNER_ZIP_BARCODE,
		isnull(@owner_phone_business, '') as OWNER_PHONE_BUSINESS,
		isnull(@owner_phone_business2, '') as OWNER_PHONE_BUSINESS2,
		isnull(@owner_phone_cell, '') as OWNER_PHONE_CELL,
		isnull(@owner_phone_fax, '') as OWNER_PHONE_FAX,
		isnull(@owner_phone_home, '') as OWNER_PHONE_HOME,
		isnull(@owner_phone_home2, '') as OWNER_PHONE_HOME2,
		
		isnull(@col_owner_name, '') as COLLECTION_OWNER_NAME,
		isnull(@col_owner_id, '') as COLLECTION_OWNER_ID,
		dbo.fn_Address(
			@col_owner_name, 
			@col_owner_addr_line1,
			@col_owner_addr_line2,
			@col_owner_addr_line3,
			@col_owner_addr_city,
			@col_owner_addr_state,
			@col_owner_addr_zip,
			@col_owner_addr_country_desc,
			@col_owner_addr_is_international,
			5
		) as COLLECTION_OWNER_NAME_ADDRESS,
		dbo.fn_Address(
			@col_owner_name, 
			@col_owner_addr_line1,
			@col_owner_addr_line2,
			@col_owner_addr_line3,
			@col_owner_addr_city,
			@col_owner_addr_state,
			@col_owner_addr_zip,
			@col_owner_addr_country_desc,
			@col_owner_addr_is_international,
			5
		) as COLLECTION_OWNER_NAME_ADDRESS_5LINES,
		dbo.fn_Address(
			@col_owner_name, 
			@col_owner_addr_line1,
			@col_owner_addr_line2,
			@col_owner_addr_line3,
			@col_owner_addr_city,
			@col_owner_addr_state,
			@col_owner_addr_zip,
			@col_owner_addr_country_desc,
			@col_owner_addr_is_international,
			6
		) as COLLECTION_OWNER_NAME_ADDRESS_6LINES,
		isnull(@col_owner_addr_line1, '') as COLLECTION_OWNER_ADDR_LINE1,
		isnull(@col_owner_addr_line2, '') as COLLECTION_OWNER_ADDR_LINE2,
		isnull(@col_owner_addr_line3, '') as COLLECTION_OWNER_ADDR_LINE3,
		isnull(@col_owner_addr_city, '') as COLLECTION_OWNER_ADDR_CITY,
		isnull(@col_owner_addr_state, '') as COLLECTION_OWNER_ADDR_STATE,
		isnull(@col_owner_addr_zip, '') as COLLECTION_OWNER_ADDR_ZIP,
		isnull(@col_owner_addr_country, '') as COLLECTION_OWNER_ADDR_COUNTRY,
		isnull(@col_owner_addr_country_desc, '') as COLLECTION_OWNER_ADDR_COUNTRY_DESC,
		isnull(@col_owner_addr_is_international, 0) as COLLECTION_OWNER_ADDR_IS_INTERNATIONAL,
		isnull(@col_owner_addr_csz, '') as COLLECTION_OWNER_ADDR_CSZ,
		isnull(@col_owner_zip, '') as COLLECTION_OWNER_ZIP,
		isnull(@col_owner_cass, '') as COLLECTION_OWNER_CASS,
		isnull(@col_owner_route, '') as COLLECTION_OWNER_ROUTE,
		isnull(@col_owner_zip_4_2, '') as COLLECTION_OWNER_ZIP_BARCODE,
		isnull(@col_owner_phone_business, '') as COLLECTION_OWNER_PHONE_BUSINESS,
		isnull(@col_owner_phone_business2, '') as COLLECTION_OWNER_PHONE_BUSINESS2,
		isnull(@col_owner_phone_cell, '') as COLLECTION_OWNER_PHONE_CELL,
		isnull(@col_owner_phone_fax, '') as COLLECTION_OWNER_PHONE_FAX,
		isnull(@col_owner_phone_home, '') as COLLECTION_OWNER_PHONE_HOME,
		isnull(@col_owner_phone_home2, '') as COLLECTION_OWNER_PHONE_HOME2,
		
		isnull(@col_agent_name, '') as COLLECTION_AGENT_NAME,
		isnull(@col_agent_id, '') as COLLECTION_AGENT_ID,
		dbo.fn_Address(
			@col_agent_name, 
			@col_agent_addr_line1,
			@col_agent_addr_line2,
			@col_agent_addr_line3,
			@col_agent_addr_city,
			@col_agent_addr_state,
			@col_agent_addr_zip,
			@col_agent_addr_country_desc,
			@col_agent_addr_is_international,
			5
		) as COLLECTION_AGENT_NAME_ADDRESS,
		dbo.fn_Address(
			@col_agent_name, 
			@col_agent_addr_line1,
			@col_agent_addr_line2,
			@col_agent_addr_line3,
			@col_agent_addr_city,
			@col_agent_addr_state,
			@col_agent_addr_zip,
			@col_agent_addr_country_desc,
			@col_agent_addr_is_international,
			5
		) as COLLECTION_AGENT_NAME_ADDRESS_5LINES,
		dbo.fn_Address(
			@col_agent_name, 
			@col_agent_addr_line1,
			@col_agent_addr_line2,
			@col_agent_addr_line3,
			@col_agent_addr_city,
			@col_agent_addr_state,
			@col_agent_addr_zip,
			@col_agent_addr_country_desc,
			@col_agent_addr_is_international,
			6
		) as COLLECTION_AGENT_NAME_ADDRESS_6LINES,
		isnull(@col_agent_addr_line1, '') as COLLECTION_AGENT_ADDR_LINE1,
		isnull(@col_agent_addr_line2, '') as COLLECTION_AGENT_ADDR_LINE2,
		isnull(@col_agent_addr_line3, '') as COLLECTION_AGENT_ADDR_LINE3,
		isnull(@col_agent_addr_city, '') as COLLECTION_AGENT_ADDR_CITY,
		isnull(@col_agent_addr_state, '') as COLLECTION_AGENT_ADDR_STATE,
		isnull(@col_agent_addr_zip, '') as COLLECTION_AGENT_ADDR_ZIP,
		isnull(@col_agent_addr_country, '') as COLLECTION_AGENT_ADDR_COUNTRY,
		isnull(@col_agent_addr_country_desc, '') as COLLECTION_AGENT_ADDR_COUNTRY_DESC,
		isnull(@col_agent_addr_is_international, 0) as COLLECTION_AGENT_ADDR_IS_INTERNATIONAL,
		isnull(@col_agent_addr_csz, '') as COLLECTION_AGENT_ADDR_CSZ,
		isnull(@col_agent_zip, '') as COLLECTION_AGENT_ZIP,
		isnull(@col_agent_cass, '') as COLLECTION_AGENT_CASS,
		isnull(@col_agent_route, '') as COLLECTION_AGENT_ROUTE,
		isnull(@col_agent_zip_4_2, '') as COLLECTION_AGENT_ZIP_BARCODE,
		isnull(@col_agent_phone_business, '') as COLLECTION_AGENT_PHONE_BUSINESS,
		isnull(@col_agent_phone_business2, '') as COLLECTION_AGENT_PHONE_BUSINESS2,
		isnull(@col_agent_phone_cell, '') as COLLECTION_AGENT_PHONE_CELL,
		isnull(@col_agent_phone_fax, '') as COLLECTION_AGENT_PHONE_FAX,
		isnull(@col_agent_phone_home, '') as COLLECTION_AGENT_PHONE_HOME,
		isnull(@col_agent_phone_home2, '') as COLLECTION_AGENT_PHONE_HOME2,
		
		isnull(property.geo_id, '') as GEO_ID,
		isnull(property.ref_id1, '') as REF_ID1,
		isnull(property.ref_id2, '') as REF_ID2,
		isnull(property_val.legal_desc, '') as LEGAL_DESC,
		replace(isnull(situs_display, ''), CHAR(13) + CHAR(10), ' ') as SITUS,
		isnull(@entities, '') as ENTITIES,
		isnull(@exemptions, '') as EXEMPTIONS,
		isnull(property.dba_name, '') as DBA_NAME,
		isnull(property_val.legal_acreage, 0) as LEGAL_ACREAGE,
		isnull(property_val.market, 0) as MARKET_VAL,
		isnull(property_val.appraised_val, 0) as APPRAISED_VAL,
		isnull(property_val.assessed_val, 0) as ASSESSED_VAL,
		isnull(property_val.sup_desc, 0) as SUPP_REASON,
		isnull(@appraiser_nm, '') as APPRAISER_NM,
		isnull(@school_cd, '') as SCHOOL_CD,
		
		isnull(@ca_agent_name, '') as CA_AGENT_NAME,
		dbo.fn_Address(
			@ca_agent_name, 
			@ca_addr_line1,
			@ca_addr_line2,
			@ca_addr_line3,
			@ca_addr_city,
			@ca_addr_state,
			@ca_addr_zip,
			@ca_addr_country_desc,
			@ca_addr_is_international,
			5
		) as CA_AGENT_ADDRESS,
		dbo.fn_Address(
			@ca_agent_name, 
			@ca_addr_line1,
			@ca_addr_line2,
			@ca_addr_line3,
			@ca_addr_city,
			@ca_addr_state,
			@ca_addr_zip,
			@ca_addr_country_desc,
			@ca_addr_is_international,
			5
		) as CA_AGENT_ADDRESS_5LINES,
		dbo.fn_Address(
			@ca_agent_name, 
			@ca_addr_line1,
			@ca_addr_line2,
			@ca_addr_line3,
			@ca_addr_city,
			@ca_addr_state,
			@ca_addr_zip,
			@ca_addr_country_desc,
			@ca_addr_is_international,
			6
		) as CA_AGENT_ADDRESS_6LINES,
		isnull(@ca_addr_line1, '') as CA_ADDR_LINE1,
		isnull(@ca_addr_line2, '') as CA_ADDR_LINE2,
		isnull(@ca_addr_line3, '') as CA_ADDR_LINE3,
		isnull(@ca_addr_city, '') as CA_ADDR_CITY,
		isnull(@ca_addr_state, '') as CA_ADDR_STATE,
		isnull(@ca_addr_zip, '') as CA_ADDR_ZIP,
		isnull(@ca_addr_country, '') as CA_ADDR_COUNTRY,
		isnull(@ca_addr_country_desc, '') as CA_ADDR_COUNTRY_DESC,
		isnull(@ca_addr_is_international, 0) as CA_ADDR_IS_INTERNATIONAL,
		isnull(@ca_addr_csz, '') as CA_ADDR_CSZ,
		isnull(@ca_zip,'') as CA_ZIP,
		isnull(@ca_cass,'') as CA_CASS,
		isnull(@ca_route,'') as CA_ROUTE,
		isnull(@ca_zip_4_2,'') as CA_ZIP_BARCODE,
		isnull(@ca_agent_phone_business, '') as CA_AGENT_PHONE_BUSINESS,
		isnull(@ca_agent_phone_business2, '') as CA_AGENT_PHONE_BUSINESS2,
		isnull(@ca_agent_phone_cell, '') as CA_AGENT_PHONE_CELL,
		isnull(@ca_agent_phone_fax, '') as CA_AGENT_PHONE_FAX,
		isnull(@ca_agent_phone_home, '') as CA_AGENT_PHONE_HOME,
		isnull(@ca_agent_phone_home2, '') as CA_AGENT_PHONE_HOME2,
		
		isnull(@ent_agent_name, '') as ENT_AGENT_NAME,
		dbo.fn_Address(
			@ent_agent_name, 
			@ent_addr_line1,
			@ent_addr_line2,
			@ent_addr_line3,
			@ent_addr_city,
			@ent_addr_state,
			@ent_addr_zip,
			@ent_addr_country_desc,
			@ent_addr_is_international,
			5
		) as ENT_AGENT_ADDRESS,
		dbo.fn_Address(
			@ent_agent_name, 
			@ent_addr_line1,
			@ent_addr_line2,
			@ent_addr_line3,
			@ent_addr_city,
			@ent_addr_state,
			@ent_addr_zip,
			@ent_addr_country_desc,
			@ent_addr_is_international,
			5
		) as ENT_AGENT_ADDRESS_5LINES,
		dbo.fn_Address(
			@ent_agent_name, 
			@ent_addr_line1,
			@ent_addr_line2,
			@ent_addr_line3,
			@ent_addr_city,
			@ent_addr_state,
			@ent_addr_zip,
			@ent_addr_country_desc,
			@ent_addr_is_international,
			6
		) as ENT_AGENT_ADDRESS_6LINES,
		isnull(@ent_addr_line1, '') as ENT_ADDR_LINE1,
		isnull(@ent_addr_line2, '') as ENT_ADDR_LINE2,
		isnull(@ent_addr_line3, '') as ENT_ADDR_LINE3,
		isnull(@ent_addr_city, '') as ENT_ADDR_CITY,
		isnull(@ent_addr_state, '') as ENT_ADDR_STATE,
		isnull(@ent_addr_zip, '') as ENT_ADDR_ZIP,
		isnull(@ent_addr_country, '') as ENT_ADDR_COUNTRY,
		isnull(@ent_addr_country_desc, '') as ENT_ADDR_COUNTRY_DESC,
		isnull(@ent_addr_is_international, 0) as ENT_ADDR_IS_INTERNATIONAL,
		isnull(@ent_zip,'') as ENT_ZIP,
		isnull(@ent_cass, '') as ENT_CASS,
		isnull(@ent_route, '') as ENT_ROUTE,
		isnull(@ent_zip_4_2,'') as ENT_ZIP_BARCODE,
		isnull(@ent_agent_phone_business, '') as ENT_AGENT_PHONE_BUSINESS,
		isnull(@ent_agent_phone_business2, '')  as ENT_AGENT_PHONE_BUSINESS2,
		isnull(@ent_agent_phone_cell, '') as ENT_AGENT_PHONE_CELL,
		isnull(@ent_agent_phone_fax, '') as ENT_AGENT_PHONE_FAX,
		isnull(@ent_agent_phone_home, '') as ENT_AGENT_PHONE_HOME,
		isnull(@ent_agent_phone_home2, '') as ENT_AGENT_PHONE_HOME2,
		
		isnull(@arb_agent_name, '') as ARB_AGENT_NAME,
		dbo.fn_Address(
			@arb_agent_name, 
			@arb_addr_line1,
			@arb_addr_line2,
			@arb_addr_line3,
			@arb_addr_city,
			@arb_addr_state,
			@arb_addr_zip,
			@arb_addr_country_desc,
			@arb_addr_is_international,
			5
		) as ARB_AGENT_ADDRESS,
		dbo.fn_Address(
			@arb_agent_name, 
			@arb_addr_line1,
			@arb_addr_line2,
			@arb_addr_line3,
			@arb_addr_city,
			@arb_addr_state,
			@arb_addr_zip,
			@arb_addr_country_desc,
			@arb_addr_is_international,
			5
		) as ARB_AGENT_ADDRESS_5LINES,
		dbo.fn_Address(
			@arb_agent_name, 
			@arb_addr_line1,
			@arb_addr_line2,
			@arb_addr_line3,
			@arb_addr_city,
			@arb_addr_state,
			@arb_addr_zip,
			@arb_addr_country_desc,
			@arb_addr_is_international,
			6
		) as ARB_AGENT_ADDRESS_6LINES,
		isnull(@arb_addr_line1, '') as ARB_ADDR_LINE1,
		isnull(@arb_addr_line2, '') as ARB_ADDR_LINE2,
		isnull(@arb_addr_line3, '') as ARB_ADDR_LINE3,
		isnull(@arb_addr_city, '') as ARB_ADDR_CITY,
		isnull(@arb_addr_state, '') as ARB_ADDR_STATE,
		isnull(@arb_addr_zip, '') as ARB_ADDR_ZIP,
		isnull(@arb_addr_country, '') as ARB_ADDR_COUNTRY,
		isnull(@arb_addr_country_desc, '') as ARB_ADDR_COUNTRY_DESC,
		isnull(@arb_addr_is_international, 0) as ARB_ADDR_IS_INTERNATIONAL,
		isnull(@arb_zip, '' ) as ARB_ZIP,
		isnull(@arb_cass, '' ) as ARB_CASS,
		isnull(@arb_route, '' ) as ARB_ROUTE,
		isnull(@arb_zip_4_2, '') as ARB_ZIP_BARCODE,
		isnull(@arb_agent_phone_business, '') as ARB_AGENT_PHONE_BUSINESS,
		isnull(@arb_agent_phone_business2, '') as ARB_AGENT_PHONE_BUSINESS2,
		isnull(@arb_agent_phone_cell, '') as ARB_AGENT_PHONE_CELL,
		isnull(@arb_agent_phone_fax, '') as ARB_AGENT_PHONE_FAX,
		isnull(@arb_agent_phone_home, '') as ARB_AGENT_PHONE_HOME,
		isnull(@arb_agent_phone_home2, '') as ARB_AGENT_PHONE_HOME2,
		coalesce(@ca_agent_name, account.confidential_file_as_name, account.file_as_name) as CA_AGENT_OR_OWNER_NAME,
		dbo.fn_Address(
			coalesce(@ca_agent_name, account.confidential_file_as_name, account.file_as_name), 
			case	
				when @ca_agent_name is null then isnull(address.addr_line1, '')
				else 'Agent for: ' + 
					case
						when account.confidential_file_as_name is not null then account.confidential_file_as_name
						else isnull(account.file_as_name, '')
					end
					+ char(13) + @ca_addr_line1
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_line2, '')
				else @ca_addr_line2
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_line3, '')
				else @ca_addr_line3
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_city, '')
				else @ca_addr_city
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_state, '')
				else @ca_addr_state
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_zip, '')
				else @ca_addr_zip
			end,
			case
				when @ca_agent_name is null then isnull(country.country_name, '')
				else @ca_addr_country_desc
			end,
			case
				when @ca_agent_name is null then isnull(address.is_international, '')
				else @ca_addr_is_international
			end,
			6
		) as CA_AGENT_OR_OWNER_NAME_ADDRESS,
		dbo.fn_Address(
			coalesce(@ca_agent_name, account.confidential_file_as_name, account.file_as_name), 
			case	
				when @ca_agent_name is null then isnull(address.addr_line1, '')
				else 'Agent for: ' + 
					case
						when account.confidential_file_as_name is not null then account.confidential_file_as_name
						else isnull(account.file_as_name, '')
					end
					+ char(13) + @ca_addr_line1
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_line2, '')
				else @ca_addr_line2
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_line3, '')
				else @ca_addr_line3
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_city, '')
				else @ca_addr_city
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_state, '')
				else @ca_addr_state
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_zip, '')
				else @ca_addr_zip
			end,
			case
				when @ca_agent_name is null then isnull(country.country_name, '')
				else @ca_addr_country_desc
			end,
			case
				when @ca_agent_name is null then isnull(address.is_international, '')
				else @ca_addr_is_international
			end,
			6
		) as CA_AGENT_OR_OWNER_NAME_ADDRESS_5LINES,
		dbo.fn_Address(
			coalesce(@ca_agent_name, account.confidential_file_as_name, account.file_as_name), 
			case	
				when @ca_agent_name is null then isnull(address.addr_line1, '')
				else 'Agent for: ' + 
					case
						when account.confidential_file_as_name is not null then account.confidential_file_as_name
						else isnull(account.file_as_name, '')
					end
					+ char(13) + @ca_addr_line1
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_line2, '')
				else @ca_addr_line2
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_line3, '')
				else @ca_addr_line3
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_city, '')
				else @ca_addr_city
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_state, '')
				else @ca_addr_state
			end,
			case
				when @ca_agent_name is null then isnull(address.addr_zip, '')
				else @ca_addr_zip
			end,
			case
				when @ca_agent_name is null then isnull(country.country_name, '')
				else @ca_addr_country_desc
			end,
			case
				when @ca_agent_name is null then isnull(address.is_international, '')
				else @ca_addr_is_international
			end,
			7
		) as CA_AGENT_OR_OWNER_NAME_ADDRESS_6LINES,
		case	
			when @ca_agent_name is null then isnull(address.addr_line1, '')
			else 'Agent for: ' + 
				case
					when account.confidential_file_as_name is not null then account.confidential_file_as_name
					else isnull(account.file_as_name, '')
				end
				+ char(13) + @ca_addr_line1
		end as CA_AGENT_OR_OWNER_ADDR_LINE1,
		case
			when @ca_agent_name is null then isnull(address.addr_line2, '')
			else @ca_addr_line2
		end as CA_AGENT_OR_OWNER_ADDR_LINE2,
		case
			when @ca_agent_name is null then isnull(address.addr_line3, '')
			else @ca_addr_line3
		end as CA_AGENT_OR_OWNER_ADDR_LINE3,
		case
			when @ca_agent_name is null then isnull(address.addr_city, '')
			else @ca_addr_city
		end as CA_AGENT_OR_OWNER_ADDR_CITY,
		case
			when @ca_agent_name is null then isnull(address.addr_state, '')
			else @ca_addr_state
		end as CA_AGENT_OR_OWNER_ADDR_STATE,
		case
			when @ca_agent_name is null then isnull(address.addr_zip, '')
			else @ca_addr_zip
		end as CA_AGENT_OR_OWNER_ADDR_ZIP,
		case
			when @ca_agent_name is null then isnull(address.country_cd, '')
			else @ca_addr_country
		end as CA_AGENT_OR_OWNER_ADDR_COUNTRY,
		case
			when @ca_agent_name is null then isnull(country.country_name, '')
			else @ca_addr_country_desc
		end as CA_AGENT_OR_OWNER_ADDR_COUNTRY_DESC,
		case
			when @ca_agent_name is null then isnull(address.is_international, '')
			else @ca_addr_is_international
		end as CA_AGENT_OR_OWNER_ADDR_IS_INTERNATIONAL,
		case
			when @ca_agent_name is null then isnull(@owner_phone_business, '')
			else @ca_agent_phone_business
		end as CA_AGENT_OR_OWNER_PHONE_BUSINESS,
		case
			when @ca_agent_name is null then isnull(@owner_phone_business2, '')
			else @ca_agent_phone_business2
		end as CA_AGENT_OR_OWNER_PHONE_BUSINESS2,
		case
			when @ca_agent_name is null then isnull(@owner_phone_cell, '')
			else @ca_agent_phone_cell
		end as CA_AGENT_OR_OWNER_PHONE_CELL,
		case
			when @ca_agent_name is null then isnull(@owner_phone_fax, '')
			else @ca_agent_phone_fax
		end as CA_AGENT_OR_OWNER_PHONE_FAX,
		case
			when @ca_agent_name is null then isnull(@owner_phone_home, '')
			else @ca_agent_phone_home
		end as CA_AGENT_OR_OWNER_PHONE_HOME,
		case
			when @ca_agent_name is null then isnull(@owner_phone_home2, '')
			else @ca_agent_phone_home2
		end as CA_AGENT_OR_OWNER_PHONE_HOME2,
		
		isnull(property_val.sub_market_cd, '') as SUB_MARKET,
		isnull(business_address.addr_line1, '') as BUSINESS_ADDRESS_LINE1,
		isnull(business_address.addr_line2, '') as BUSINESS_ADDRESS_LINE2,
		isnull(business_address.addr_line3, '') as BUSINESS_ADDRESS_LINE3,
		isnull(business_address.addr_city, '') as BUSINESS_ADDRESS_CITY,
		isnull(business_address.addr_state, '') as BUSINESS_ADDRESS_STATE,
		isnull(business_address.addr_zip, '') as BUSINESS_ADDRESS_ZIP ,
		case
			when @ca_agent_id = 0 then ''
			else @ca_agent_id
		end as CA_AGENT_ID ,
		@prop_id_barcode as PROP_ID_BARCODE,
		@sale_land_acerage as SALE_LAND_ACERAGE,
		@seller_name as SELLER_NAME,
		dbo.fn_Address(
			@seller_name, 
			@seller_addr_line1,
			@seller_addr_line2,
			@seller_addr_line3,
			@seller_city,
			@seller_state,
			@seller_zip,
			@seller_country_desc,
			@seller_addr_is_international,
			5
		) as SELLER_ADDRESS,
		dbo.fn_Address(
			@seller_name, 
			@seller_addr_line1,
			@seller_addr_line2,
			@seller_addr_line3,
			@seller_city,
			@seller_state,
			@seller_zip,
			@seller_country_desc,
			@seller_addr_is_international,
			5
		) as SELLER_ADDRESS_5LINES,
		dbo.fn_Address(
			@seller_name, 
			@seller_addr_line1,
			@seller_addr_line2,
			@seller_addr_line3,
			@seller_city,
			@seller_state,
			@seller_zip,
			@seller_country_desc,
			@seller_addr_is_international,
			6
		) as SELLER_ADDRESS_6LINES,
		@seller_addr_line1 as SELLER_ADDR_LINE1,
		@seller_addr_line2 as SELLER_ADDR_LINE2,
		@seller_addr_line3 as SELLER_ADDR_LINE3,
		@seller_city as SELLER_CITY,
		@seller_state as SELLER_STATE,
		@seller_zip as SELLER_ZIP,
		@seller_country as SELLER_COUNTRY,
		@seller_country_desc as SELLER_COUNTRY_DESC,
		@seller_addr_is_international as SELLER_ADDR_IS_INTERNATIONAL,
		@deed_dt as DEED_DT ,
		@sale_type_cd as SALE_TYPE_CD ,
		@deed_type_cd as DEED_TYPE,
	 	@grantor as GRANTOR,
	 	@grantee as GRANTEE,
	 	@deed_page as DEED_PAGE,
	 	@buyer_id  as BUYER_ID	,
	 	@buyer_name as BUYER_NAME,
		dbo.fn_Address(
			@buyer_name, 
			@buyer_addr_line1,
			@buyer_addr_line2,
			@buyer_addr_line3,
			@buyer_city,
			@buyer_state,
			@buyer_zip,
			@buyer_country_desc,
			@buyer_addr_is_international,
			5
		) as BUYER_ADDRESS,
		dbo.fn_Address(
			@buyer_name, 
			@buyer_addr_line1,
			@buyer_addr_line2,
			@buyer_addr_line3,
			@buyer_city,
			@buyer_state,
			@buyer_zip,
			@buyer_country_desc,
			@buyer_addr_is_international,
			5
		) as BUYER_ADDRESS_5LINES,
		dbo.fn_Address(
			@buyer_name, 
			@buyer_addr_line1,
			@buyer_addr_line2,
			@buyer_addr_line3,
			@buyer_city,
			@buyer_state,
			@buyer_zip,
			@buyer_country_desc,
			@buyer_addr_is_international,
			6
		) as BUYER_ADDRESS_6LINES,
	 	@buyer_addr_line1 as BUYER_ADDR_LINE1,
	 	@buyer_addr_line2 as BUYER_ADDR_LINE2,
	 	@buyer_addr_line3 as BUYER_ADDR_LINE3,
	 	@buyer_city as BUYER_CITY,
	 	@buyer_state as BUYER_STATE,
	 	@buyer_zip as BUYER_ZIP,
		@buyer_country as BUYER_COUNTRY,
		@buyer_country_desc as BUYER_COUNTRY_DESC,
		@buyer_addr_is_international as BUYER_ADDR_IS_INTERNATIONAL,
		@deed_volume as DEED_VOLUME,
		
		case when imp_leased_land = 1
			then isnull(property_val.non_taxed_mkt_val, 0)
			else isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + 
				isnull(property_val.ag_market, 0) + isnull(property_val.timber_market, 0) + 
				isnull(property_val.ag_hs_mkt_val, 0) + isnull(property_val.timber_hs_mkt_val, 0) 
			end as LAND_VALUE,
		isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0) as IMPROVEMENT_VALUE,
		case when imp_leased_land = 1
			then isnull(property_val.non_taxed_mkt_val, 0) + isnull(property_val.imprv_hstd_val, 0) + 
				isnull(property_val.imprv_non_hstd_val, 0)
			else isnull(property_val.market, 0)
		end as MARKET_VALUE        
   
	from
		property with (nolock)
	inner join
		property_val with (nolock)
	on
		property.prop_id = property_val.prop_id
	and	property_val.prop_val_yr = @year
	and	property_val.sup_num = @sup_num
	inner join
		owner with (nolock)
	on
		property.prop_id = owner.prop_id
	and	owner.owner_tax_yr = @year
	and	owner.sup_num = @sup_num
	and	owner.owner_id = @id2
	inner join
		account with (nolock)
	on
		owner.owner_id = account.acct_id
	left outer join
		address with (nolock)
	on
		account.acct_id = address.acct_id
	and	address.primary_addr = 'Y'	
	left outer join
		country with (nolock)
	on
		country.country_cd = address.country_cd
	left outer join
		address as business_address
	on
		account.acct_id = business_address.acct_id
	and	business_address.addr_type_cd = 'B'
	left outer join
		phone with (nolock)
	on
		account.acct_id = phone.acct_id
	left outer join
		situs with (nolock)
	on
		property.prop_id = situs.prop_id
		and	situs.primary_situs = 'Y'
	left join property_sub_type
		on property_val.sub_type = property_sub_type.property_sub_cd

	where
		property.prop_id = @id1


end
else
begin
	select
		'Property ID' as PROP_ID,
		'Owner''s Name' as OWNER_NAME,
		'Owner ID' as OWNER_ID,
		'Owner''s Name and Address (5 lines)' as NAME_ADDRESS,
		'Owner''s Name and Address (6 lines - Intl)' as NAME_ADDRESS_6LINES,
		'Owner Addr Line 1' as OWNER_ADDR_LINE1,
		'Owner Addr Line 2' as OWNER_ADDR_LINE2,
		'Owner Addr Line 3' as OWNER_ADDR_LINE3,
		'Owner Addr City' as OWNER_ADDR_CITY,
		'Owner Addr State' as OWNER_ADDR_STATE,
		'Owner Addr Zip' as OWNER_ADDR_ZIP,
		'Owner Addr Country' as OWNER_ADDR_COUNTRY,
		'Owner Addr Country Desc' as OWNER_ADDR_COUNTRY_DESC,
		'Owner Addr CSZ' as OWNER_ADDR_CSZ,
		'Owner zip' as OWNER_ZIP,
		'Owner cass' as OWNER_CASS,
		'Owner route' as OWNER_ROUTE,
		'Owner Zip_Barcode' as OWNER_ZIP_BARCODE,
		'Owner Phone Business' as OWNER_PHONE_BUSINESS,
		'Owner Phone Business 2' as OWNER_PHONE_BUSINESS2,
		'Owner Phone Cell' as OWNER_PHONE_CELL,
		'Owner Phone Fax' as OWNER_PHONE_FAX,
		'Owner Phone Home' as OWNER_PHONE_HOME,
		'Owner Phone Home 2' as OWNER_PHONE_HOME2,
		
		'Collection Owner''s Name' as COLLECTION_OWNER_NAME,
		'Collection Owner ID' as COLLECTION_OWNER_ID,
		'Collection Owner''s Name and Address (5 lines)' as COLLECTION_OWNER_NAME_ADDRESS,
		'Collection Owner''s Name and Address (6 lines - Intl)' as COLLECTION_OWNER_NAME_ADDRESS_6LINES,
		'Collection Owner Addr Line 1' as COLLECTION_OWNER_ADDR_LINE1,
		'Collection Owner Addr Line 2' as COLLECTION_OWNER_ADDR_LINE2,
		'Collection Owner Addr Line 3' as COLLECTION_OWNER_ADDR_LINE3,
		'Collection Owner Addr City' as COLLECTION_OWNER_ADDR_CITY,
		'Collection Owner Addr State' as COLLECTION_OWNER_ADDR_STATE,
		'Collection Owner Addr Zip' as COLLECTION_OWNER_ADDR_ZIP,
		'Collection Owner Addr Country' as COLLECTION_OWNER_ADDR_COUNTRY,
		'Collection Owner Addr Country Desc' as COLLECTION_OWNER_ADDR_COUNTRY_DESC,
		'Collection Owner Addr CSZ' as COLLECTION_OWNER_ADDR_CSZ,
		'Collection Owner zip' as COLLECTION_OWNER_ZIP,
		'Collection Owner cass' as COLLECTION_OWNER_CASS,
		'Collection Owner route' as COLLECTION_OWNER_ROUTE,
		'Collection Owner Zip_Barcode' as COLLECTION_OWNER_ZIP_BARCODE,
		'Collection Owner Phone Business' as COLLECTION_OWNER_PHONE_BUSINESS,
		'Collection Owner Phone Business 2' as COLLECTION_OWNER_PHONE_BUSINESS2,
		'Collection Owner Phone Cell' as COLLECTION_OWNER_PHONE_CELL,
		'Collection Owner Phone Fax' as COLLECTION_OWNER_PHONE_FAX,
		'Collection Owner Phone Home' as COLLECTION_OWNER_PHONE_HOME,
		'Collection Owner Phone Home 2' as COLLECTION_OWNER_PHONE_HOME2,
		
		'Collection Agent''s Name' as COLLECTION_AGENT_NAME,
		'Collection Agent ID' as COLLECTION_AGENT_ID,
		'Collection Agent''s Name and Address (5 lines)' as COLLECTION_AGENT_NAME_ADDRESS,
		'Collection Agent''s Name and Address (6 lines - Intl)' as COLLECTION_AGENT_NAME_ADDRESS_6LINES,
		'Collection Agent Addr Line 1' as COLLECTION_AGENT_ADDR_LINE1,
		'Collection Agent Addr Line 2' as COLLECTION_AGENT_ADDR_LINE2,
		'Collection Agent Addr Line 3' as COLLECTION_AGENT_ADDR_LINE3,
		'Collection Agent Addr City' as COLLECTION_AGENT_ADDR_CITY,
		'Collection Agent Addr State' as COLLECTION_AGENT_ADDR_STATE,
		'Collection Agent Addr Zip' as COLLECTION_AGENT_ADDR_ZIP,
		'Collection Agent Addr Country' as COLLECTION_AGENT_ADDR_COUNTRY,
		'Collection Agent Addr Country Desc' as COLLECTION_AGENT_ADDR_COUNTRY_DESC,
		'Collection Agent Addr CSZ' as COLLECTION_AGENT_ADDR_CSZ,
		'Collection Agent zip' as COLLECTION_AGENT_ZIP,
		'Collection Agent cass' as COLLECTION_AGENT_CASS,
		'Collection Agent route' as COLLECTION_AGENT_ROUTE,
		'Collection Agent Zip_Barcode' as COLLECTION_AGENT_ZIP_BARCODE,
		'Collection Agent Phone Business' as COLLECTION_AGENT_PHONE_BUSINESS,
		'Collection Agent Phone Business 2' as COLLECTION_AGENT_PHONE_BUSINESS2,
		'Collection Agent Phone Cell' as COLLECTION_AGENT_PHONE_CELL,
		'Collection Agent Phone Fax' as COLLECTION_AGENT_PHONE_FAX,
		'Collection Agent Phone Home' as COLLECTION_AGENT_PHONE_HOME,
		'Collection Agent Phone Home 2' as COLLECTION_AGENT_PHONE_HOME2,
		
		'Geographic ID' as GEO_ID,
		'Reference ID 1' as REF_ID1,
		'Reference ID 2' as REF_ID2,
		'Legal Description' as LEGAL_DESC,
		'Situs' as SITUS,
		'Entities' as ENTITIES,
		'Exemptions' as EXEMPTIONS,
		'DBA - Doing Business As' as DBA_NAME,
		'Legal Acreage' as LEGAL_ACREAGE,
		'Market Value' as MARKET_VAL,
		'Appraised Value' as APPRAISED_VAL,
		'Assessed Value' as ASSESSED_VAL,
		'Supplement Reason' as SUPP_REASON,
		'Appraiser Name' as APPRAISER_NM,
		'School Code' as SCHOOL_CD,
		
		'CA Agent Name' as CA_AGENT_NAME,
		'CA Agent Name and Address (5 lines)' as CA_AGENT_ADDRESS,
		'CA Agent Name and Address (6 lines - Intl)' as CA_AGENT_ADDRESS_6LINES,
		'CA Addr Line 1' as CA_ADDR_LINE1,
		'CA Addr Line 2' as CA_ADDR_LINE2,
		'CA Addr Line 3' as CA_ADDR_LINE3,
		'CA Addr City' as CA_ADDR_CITY,
		'CA Addr State' as CA_ADDR_STATE,
		'CA Addr Zip' as CA_ADDR_ZIP,
		'CA Addr Country' as CA_ADDR_COUNTRY,
		'CA Addr Country Desc' as CA_ADDR_COUNTRY_DESC,
		'CA Addr CSZ' as CA_ADDR_CSZ,
		'CA ZIP' as CA_ZIP,
		'CA CASS' as CA_CASS,
		'CA ROUTE' as CA_ROUTE,
		'CA Zip_Barcode' as CA_ZIP_BARCODE,
		'CA Agent Phone Business' as CA_AGENT_PHONE_BUSINESS,
		'CA Agent Phone Business 2' as CA_AGENT_PHONE_BUSINESS2,
		'CA Agent Phone Cell' as CA_AGENT_PHONE_CELL,
		'CA Agent Phone Fax' as CA_AGENT_PHONE_FAX,
		'CA Agent Phone Home' as CA_AGENT_PHONE_HOME,
		'CA Agent Phone Home 2' as CA_AGENT_PHONE_HOME2,
		
		'ENT Agent Name' as ENT_AGENT_NAME,
		'ENT Agent Name and Address (5 lines)' as ENT_AGENT_ADDRESS,
		'ENT Agent Name and Address (6 lines - Intl)' as ENT_AGENT_ADDRESS_6LINES,
		'ENT Agent Phone Business' as ENT_AGENT_PHONE_BUSINESS,
		'ENT Agent Phone Business 2' as ENT_AGENT_PHONE_BUSINESS2,
		'ENT Agent Phone Cell' as ENT_AGENT_PHONE_CELL,
		'ENT Agent Phone Fax' as ENT_AGENT_PHONE_FAX,
		'ENT Agent Phone Home' as ENT_AGENT_PHONE_HOME,
		'ENT Agent Phone Home 2' as ENT_AGENT_PHONE_HOME2,
		
		'ARB Agent Name' as ARB_AGENT_NAME,
		'ARB Agent Name and Address (5 lines)' as ARB_AGENT_ADDRESS,
		'ARB Agent Name and Address (6 lines - Intl)' as ARB_AGENT_ADDRESS_6LINES,
		'ARB Agent Phone Business' as ARB_AGENT_PHONE_BUSINESS,
		'ARB Agent Phone Business 2' as ARB_AGENT_PHONE_BUSINESS2,
		'ARB Agent Phone Cell' as ARB_AGENT_PHONE_CELL,
		'ARB Agent Phone Fax' as ARB_AGENT_PHONE_FAX,
		'ARB Agent Phone Home' as ARB_AGENT_PHONE_HOME,
		'ARB Agent Phone Home 2' as ARB_AGENT_PHONE_HOME2,
		
		'CA Agent or Owner Name and Address (6 Lines)' as CA_AGENT_OR_OWNER_NAME_ADDRESS,
		'CA Agent or Owner Name and Address (7 Lines - Intl)' as CA_AGENT_OR_OWNER_NAME_ADDRESS_6LINES,
		'CA Agent or Owner Phone Business' as CA_AGENT_OR_OWNER_PHONE_BUSINESS,
		'CA Agent or Owner Phone Business 2' as CA_AGENT_OR_OWNER_PHONE_BUSINESS2,
		'CA Agent or Owner Phone Cell' as CA_AGENT_OR_OWNER_PHONE_CELL,
		'CA Agent or Owner Phone Fax' as CA_AGENT_OR_OWNER_PHONE_FAX,
		'CA Agent or Owner Phone Home' as CA_AGENT_OR_OWNER_PHONE_HOME,
		'CA Agent or Owner Phone Home 2' as CA_AGENT_OR_OWNER_PHONE_HOME2,
		
		'Sub Market' as SUB_MARKET,
		'Business Address Line 1' as BUSINESS_ADDRESS_LINE1,
		'Business Address Line 2' as BUSINESS_ADDRESS_LINE2,
		'Business Address Line 3' as BUSINESS_ADDRESS_LINE3,
		'Business Address City' as BUSINESS_ADDRESS_CITY,
		'Business Address State' as BUSINESS_ADDRESS_STATE,
		'Business Address Zip' as BUSINESS_ADDRESS_ZIP,
		'CA Agent ID' as CA_AGENT_ID,
		'PropID Barcode' as PROP_ID_BARCODE,
		
		'Sale Land Acerage' as SALE_LAND_ACERAGE,
		'Seller Name' as SELLER_NAME,
		'Seller''s Name and Address (5 Lines)' as SELLER_ADDRESS,
		'Seller''s Name and Address (6 Lines - Intl)' as SELLER_ADDRESS_6LINES,
		'Seller''s Addr Line 1' as SELLER_ADDR_LINE1,
		'Seller''s Addr Line 2' as SELLER_ADDR_LINE2,
		'Seller''s Addr Line 3' as SELLER_ADDR_LINE3,
		'Seller City' as SELLER_CITY,
		'Seller State' as SELLER_STATE,
		'Seller Zip' as SELLER_ZIP,
		'Seller Country' as SELLER_COUNTRY,		   
		'Seller Country Desc' as SELLER_COUNTRY_DESC,
		'Deed date' as DEED_DT ,
		'Sale type cd' as SALE_TYPE_CD,
		'Deed type cd' as DEED_TYPE,
	 	'Grantor' as GRANTOR,
	 	'Grantee' as GRANTEE,
	 	'Deed Page' as DEED_PAGE,
	 	'Buyer Id'  as BUYER_ID	,
	 	'Buyer''s Name' as BUYER_NAME,
		'Buyer''s Name and Address (5 Lines)' as BUYER_ADDRESS,
		'Buyer''s Name and Address (6 Lines - Intl)' as BUYER_ADDRESS_6LINES,
	 	'Buyer''s Addr Line 1' as BUYER_ADDR_LINE1,
	 	'Buyer''s Addr Line 2' as BUYER_ADDR_LINE2,
	 	'Buyer''s Addr Line 3' as BUYER_ADDR_LINE3,
	 	'Buyer City' as BUYER_CITY,
	 	'Buyer Zip' as BUYER_ZIP,
	 	'Buyer State' as BUYER_STATE,
		'Buyer Country' as BUYER_COUNTRY,
		'Buyer Country Desc' as BUYER_COUNTRY_DESC,
		'Deed Volume' as DEED_VOLUME,
		
		'Land Value' as LAND_VALUE,
		'Improvement Value' as IMPROVEMENT_VALUE,
		'Market Value' as MARKET_VALUE        
end

GO

