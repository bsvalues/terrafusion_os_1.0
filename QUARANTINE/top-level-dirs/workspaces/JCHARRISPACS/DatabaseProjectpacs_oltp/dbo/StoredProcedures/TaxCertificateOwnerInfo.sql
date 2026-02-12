

CREATE PROCEDURE TaxCertificateOwnerInfo

@input_prop_id		int,
@input_owner_tax_yr	int,
@input_sup_num	int

AS

set nocount on

	declare @lOwnerID int
	declare @pct_ownership numeric(13,10)

	/* Get the "first" owner */
	select top 1 @lOwnerID = owner.owner_id,@pct_ownership=pct_ownership
	from owner with(nolock)
	join account with(nolock) on
		owner.owner_id = account.acct_id
	join address with(nolock) on
		owner.owner_id = address.acct_id and
		address.primary_addr = 'Y'
	where
		owner.prop_id = @input_prop_id and
		owner.owner_tax_yr = @input_owner_tax_yr and
		owner.sup_num = @input_sup_num
	order by
		owner.owner_id asc

	/* Get said owner's exemptions */

	declare @szExemptions varchar(256)
	declare @szEXCode char(5)
	declare @lIndex int

	declare curEX cursor
	for
		select distinct exmpt_type_cd
		from property_exemption with(nolock)
		where
			prop_id = @input_prop_id and
			owner_id = @lOwnerID and
			exmpt_tax_yr = @input_owner_tax_yr and
			owner_tax_yr = @input_owner_tax_yr and
			sup_num = @input_sup_num
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

set nocount off

	select 	1 as DumbID,
		col_owner_id as owner_id,
		@pct_ownership as pct_ownership,
		account.file_as_name as owner_name,
		address.addr_line1,
		address.addr_line2,
		address.addr_line3,
		address.addr_city,
		address.addr_state,
		address.addr_zip,
		address.is_international,
		country.country_name,
		@szExemptions as exemptions
	from	property with (nolock)
	inner join account with (nolock)
		on property.col_owner_id = account.acct_id
	inner join address with (nolock)
		on property.col_owner_id = address.acct_id and address.primary_addr = 'Y'
	left outer join country with (nolock)
		on country.country_cd = address.country_cd
	where	property.prop_id = @input_prop_id
	order by property.owner_id

GO

