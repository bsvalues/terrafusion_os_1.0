


create view arb_tax_preview_vw
as
	select
		petp.lPacsUserID,
		petp.lPropValYr,
		petp.lPropID,
		petp.lOwnerID,
		a.file_as_name as szOwnerName,
		petp.lSupNum,
		petp.lEntityID,
		ltrim(rtrim(e.entity_cd)) as szEntityCode,
		petp.szExCodes,
		petp.lLocalEx,
		petp.lStateEx,
		petp.lTaxable,
		petp.dTax,
		petp.szFreezeType,
		petp.lFreezeYear,
		petp.dFreezeCeiling
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

GO

