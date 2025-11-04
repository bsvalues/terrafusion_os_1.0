

CREATE PROCEDURE StatementOfAccountInfo

@input_prop_id		int = 0,
@input_owner_id	int = 0


AS

set nocount on

-- Pacs system

declare	@year	int

select @year = tax_yr
from pacs_system



-- System Address

declare @sys_addr_line1		varchar(50)
declare @sys_addr_line2		varchar(50)
declare @sys_addr_line3		varchar(50)
declare @sys_addr_city		varchar(50)
declare @sys_addr_state	varchar(2)
declare @sys_addr_zip		varchar(10)

select @sys_addr_line1		= addr_line1,
	@sys_addr_line2	= addr_line2,
	@sys_addr_line3	= addr_line3,
	@sys_addr_city		= city,
	@sys_addr_state	= state,
	@sys_addr_zip		= zip
from system_address
where system_type = 'C'


declare @sup_num		int
declare @value_yr		int

select @value_yr = max(owner_tax_yr)
from prop_supp_assoc
where prop_id = @input_prop_id
and owner_tax_yr <= @year

select @sup_num = sup_num
from prop_supp_assoc
where prop_id = @input_prop_id
and owner_tax_yr <= @value_yr

-- Owner Information

declare @pct_ownership		numeric(13,10)

select @pct_ownership = pct_ownership
from original_owner_vw
where prop_id = @input_prop_id

declare @owner_name		varchar(70)

select @owner_name = file_as_name
from account
where acct_id = @input_owner_id

declare @owner_addr_line1	varchar(50)
declare @owner_addr_line2	varchar(50)
declare @owner_addr_line3	varchar(50)
declare @owner_addr_city	varchar(50)
declare @owner_addr_state	varchar(2)
declare @owner_addr_zip	varchar(10)
declare @owner_addr_is_international bit
declare @owner_addr_country_cd char(5)
declare @owner_addr_country_name varchar(50)

select @owner_addr_line1 	= addr_line1,
	@owner_addr_line2 	= addr_line2,
	@owner_addr_line3 	= addr_line3,
	@owner_addr_city	= addr_city,
	@owner_addr_state	= ltrim(addr_state),
	@owner_addr_zip	= addr_zip,
	@owner_addr_is_international = is_international,
	@owner_addr_country_cd = address.country_cd,
	@owner_addr_country_name = country.country_name
from address
left outer join country on country.country_cd = address.country_cd
where acct_id = @input_owner_id
and primary_addr = 'Y'





-- Property & Situs Information

declare @geo_id		varchar(50)
declare @dba_name	varchar(50)
declare @situs_address varchar(256)
declare @prop_type_cd		varchar(5)

select
	@geo_id	= property.geo_id,
	@prop_type_cd = rtrim(property.prop_type_cd),
	@dba_name = property.dba_name,
	@situs_address = REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ')
from property with(nolock)
left outer join situs on
	situs.prop_id = @input_prop_id and
	situs.primary_situs = 'Y'
where property.prop_id = @input_prop_id

declare @legal_description	varchar(255)
declare @mineral_int_pct	numeric(13,10)
declare @improvement_hs	numeric(9)
declare @improvement_nhs	numeric(9)
declare @land_hs		numeric(9)
declare @land_nhs		numeric(9)
declare @productivity_market	numeric(9)
declare @productivity_use	numeric(9)
declare @assessed_value	numeric(9)
declare @legal_acres		numeric(13,5)

select @legal_description	= legal_desc,
	@mineral_int_pct	= mineral_int_pct,
	@improvement_hs	= imprv_hstd_val,
	@improvement_nhs	= imprv_non_hstd_val,
	@land_hs		= land_hstd_val,
	@land_nhs		= land_non_hstd_val,
	@productivity_market	= ag_market + timber_market,
	@productivity_use	= ag_use_val + timber_use,
	@assessed_value	= assessed_val,
	@legal_acres		= legal_acreage
from property_val
where prop_id = @input_prop_id
and prop_val_yr = @value_yr
and sup_num = @sup_num

-- Exemptions
declare @szExemptions varchar(256)
declare @szEXCode char(5)
declare @lIndex int

declare curEX cursor
for
	select distinct exmpt_type_cd
	from property_exemption with(nolock)
	where
		prop_id = @input_prop_id and

		exmpt_tax_yr = @year and
		owner_tax_yr = @year and
		sup_num = @sup_num
	order by
		exmpt_type_cd asc
for read only

open curEX
fetch next from curEX into @szEXCode

set @szExemptions = ''
set @lIndex = 0
while ( @@fetch_status = 0 )
begin
	if ( @lIndex > 0 )
	begin
		set @szExemptions = @szExemptions + ', '
	end

	set @szExemptions = @szExemptions + rtrim(@szEXCode)

	set @lIndex = @lIndex + 1

	fetch next from curEX into @szEXCode
end

close curEX
deallocate curEX


-- Escrow Total

declare @escrow_paid		numeric(14,2)

set @escrow_paid = 0

--Commented out the 'year' clause since we need to return the total amount of escrow, not for just one year in particular. -EricZ 07/24/2002
select @escrow_paid = sum(isnull(amount,0))
from escrow_trans
where prop_id = @input_prop_id

--and year = @value_yr
and status like 'E%'


if (@escrow_paid is null)
begin
	set @escrow_paid = 0
end

set nocount off

select 1 as DumbID,
	@input_prop_id 		as prop_id,
	@input_owner_id 	as owner_id,
	@year			as year,
	@sup_num		as sup_num,
	@sys_addr_line1	as sys_addr_line1,
	@sys_addr_line2 	as sys_addr_line2,
	@sys_addr_line3 	as sys_addr_line3,
	@sys_addr_city		as sys_addr_city,
	@sys_addr_state 	as sys_addr_state,
	@sys_addr_zip		as sys_addr_zip,
	@pct_ownership		as pct_ownership,
	@owner_name		as owner_name,
	@owner_addr_line1	as owner_addr_line1,
	@owner_addr_line2	as owner_addr_line2,
	@owner_addr_line3	as owner_addr_line3,
	@owner_addr_city	as owner_addr_city,
	@owner_addr_state	as owner_addr_state,
	@owner_addr_zip	as owner_addr_zip,
	cast(IsNull(@owner_addr_is_international,0) as bit) as owner_addr_is_international,
	@owner_addr_country_cd as owner_addr_country_cd,
	cast(IsNull(@owner_addr_country_name, '') as varchar(50)) as owner_addr_country_name,
	@geo_id		as geo_id,
	@prop_type_cd		as prop_type_cd,
	@legal_description	as legal_description,
	@mineral_int_pct	as mineral_int_pct,
	@improvement_hs	as improvement_hs,
	@improvement_nhs	as improvement_nhs,
	@land_hs		as land_hs,
	@land_nhs		as land_nhs,
	@productivity_market	as productivity_market,
	@productivity_use	as productivity_use,
	@assessed_value	as assessed_value,
	@legal_acres		as legal_acres,
	@escrow_paid		as escrow_paid,
	@value_yr		as value_yr,
	@dba_name			as dba_name,
	@situs_address		as situs_address,
	@szExemptions		as exemptions

GO

