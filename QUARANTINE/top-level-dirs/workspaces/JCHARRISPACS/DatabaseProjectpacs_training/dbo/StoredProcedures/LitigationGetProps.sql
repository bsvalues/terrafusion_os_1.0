
create procedure LitigationGetProps
	@lLitigationID int
as

	select distinct
		bill.prop_id,
		s.situs_display as situs_address ,
		co.legal_desc,
		co.file_as_name
	from litigation_statement_assoc as lba with(nolock)
	join bill with(nolock) on
		lba.statement_id = bill.statement_id and lba.year = bill.year
	left outer join situs as s with(nolock) on
		bill.prop_id = s.prop_id and
		s.primary_situs = 'Y'
	join curr_tax_property_owner_vw as co with(nolock) on
		bill.prop_id = co.owner_prop_id
	where
		lba.litigation_id = @lLitigationID
	group by
		bill.prop_id,
		s.situs_display  ,
		co.legal_desc,
		co.file_as_name

GO

