

create procedure ARBGetTaxPreview
	@lPacsUserID int
as

	select
		a.file_as_name,
		e.entity_cd,
		petp.szEXCodes,
		petp.lLocalEX,
		petp.lStateEX,
		petp.lTaxable,
		petp.dTax,
		petp.lOwnerID
	from
		property_entity_tax_preview as petp with (nolock)
	inner join
		account as a with (nolock)
	on
		a.acct_id = petp.lOwnerID
	inner join
		entity as e with (nolock)
	on
		e.entity_id = petp.lEntityID
	where
		petp.lPacsUserID = @lPacsUserID
	order by
		a.file_as_name asc,
		petp.lOwnerID,
		e.entity_cd asc

GO

