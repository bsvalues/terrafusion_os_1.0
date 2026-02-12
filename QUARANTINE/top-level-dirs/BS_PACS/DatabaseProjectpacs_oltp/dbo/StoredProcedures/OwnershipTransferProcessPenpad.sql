

create procedure OwnershipTransferProcessPenpad
	@lOwnerChangeInfoID int,
	@lPropID int,
	@lYear numeric(4,0),
	@lAccountID int,
	@bKeepExemptions bit
as

set nocount on

	-- If zero, we need to create an account from the information checked in from the penpad
	if ( @lAccountID = 0 )
	begin
		exec dbo.GetUniqueID 'account', @lAccountID output, 1, 0

		declare @szFileAsName varchar(70)
		select @szFileAsName = szFileAsName
		from penpad_owner_change with(nolock)
		where
			lOwnerChangeInfoID = @lOwnerChangeInfoID

		-- Add the account record
		insert account with(rowlock) (acct_id, file_as_name)
		values (@lAccountID, @szFileAsName)

		-- Add the address records
		insert address (
			acct_id, addr_type_cd, primary_addr, addr_line1, addr_line2, addr_line3,
			addr_city, addr_state, country_cd, zip, cass
		)
		select
			@lAccountID, szAddressTypeCode, szPrimaryAddress, szLine1, szLine2, szLine3,
			szCity, szState, szCountry, szZIP, szCASS
		from penpad_owner_address with(nolock)
		where
			lOwnerChangeInfoID = @lOwnerChangeInfoID

		-- Add the phone records
		declare @lPhoneID int
		set @lPhoneID = 1

		declare
			@szPhoneTypeCode char(5),
			@szPhoneNumber varchar(20)

		declare curPenpadPhones cursor
		for
			select szPhoneTypeCode, szPhoneNumber
			from penpad_owner_phone with(nolock)
			where
				lOwnerChangeInfoID = @lOwnerChangeInfoID
		for read only

		open curPenpadPhones
		fetch next from curPenpadPhones into @szPhoneTypeCode, @szPhoneNumber

		while ( @@fetch_status = 0 )
		begin
			insert phone (acct_id, phone_id, phone_type_cd, phone_num)
			values (@lAccountID, @lPhoneID, @szPhoneTypeCode, @szPhoneNumber)

			set @lPhoneID = @lPhoneID + 1
			fetch next from curPenpadPhones into @szPhoneTypeCode, @szPhoneNumber
		end

		close curPenpadPhones
		deallocate curPenpadPhones

	end

	-- Change any owner assoc records
	update imprv_owner_assoc
	set owner_id = @lAccountID
	where
		prop_val_yr = @lYear and
		sup_num = 0 and
		sale_id = 0 and
		prop_id = @lPropID

	update land_owner_assoc
	set owner_id = @lAccountID
	where
		prop_val_yr = @lYear and
		sup_num = 0 and
		sale_id = 0 and
		prop_id = @lPropID

	update pers_prop_owner_assoc
	set owner_id = @lAccountID
	where
		prop_val_yr = @lYear and
		sup_num = 0 and
		sale_id = 0 and
		prop_id = @lPropID

	-- Keep or delete exemptions, as requested
	if ( @bKeepExemptions = 1 )
	begin
		update imprv_exemption_assoc
		set owner_id = @lAccountID
		where
			prop_val_yr = @lYear and
			sup_num = 0 and
			sale_id = 0 and
			prop_id = @lPropID

		update land_exemption_assoc
		set owner_id = @lAccountID
		where
			prop_val_yr = @lYear and
			sup_num = 0 and
			sale_id = 0 and
			prop_id = @lPropID

		update pers_prop_exemption_assoc
		set owner_id = @lAccountID
		where
			prop_val_yr = @lYear and
			sup_num = 0 and
			sale_id = 0 and
			prop_id = @lPropID

		update property_special_entity_exemption
		set owner_id = @lAccountID
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID

		update property_freeze
		set owner_id = @lAccountID
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID

		update property_exemption
		set owner_id = @lAccountID
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID

		update property_entity_exemption
		set owner_id = @lAccountID
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID
	end
	else
	begin
		delete imprv_exemption_assoc
		where
			prop_val_yr = @lYear and
			sup_num = 0 and
			sale_id = 0 and
			prop_id = @lPropID

		delete land_exemption_assoc
		where
			prop_val_yr = @lYear and
			sup_num = 0 and
			sale_id = 0 and
			prop_id = @lPropID

		delete pers_prop_exemption_assoc
		where
			prop_val_yr = @lYear and
			sup_num = 0 and
			sale_id = 0 and
			prop_id = @lPropID

		delete property_special_entity_exemption
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID

		delete property_freeze
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID

		delete property_exemption
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID

		delete property_entity_exemption
		where
			exmpt_tax_yr = @lYear and
			owner_tax_yr = @lYear and
			sup_num = 0 and
			prop_id = @lPropID
	end

	update owner with(rowlock)
	set owner_id = @lAccountID
	where
		owner_tax_yr = @lYear and
		sup_num = 0 and
		prop_id = @lPropID

	update penpad_owner_change with(rowlock)
	set bWizardComplete = 1
	where lOwnerChangeInfoID = @lOwnerChangeInfoID

GO

