
create view change_log_propid_vw


as

	select lChangeID, iColumnID, lKeyValue as prop_id
	from dbo.change_log_keys
	where
		iColumnID in (4026,3546,3521)

GO

