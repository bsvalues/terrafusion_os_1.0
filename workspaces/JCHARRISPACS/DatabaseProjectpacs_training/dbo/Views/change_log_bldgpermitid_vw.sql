
create view change_log_bldgpermitid_vw


as

	select lChangeID, iColumnID, lKeyValue as bldg_permit_id
	from dbo.change_log_keys
	where
		iColumnID = 531

GO

