
create view change_log_supnum_vw


as

	select lChangeID, iColumnID, lKeyValue as sup_num
	from dbo.change_log_keys
	where
		iColumnID = 5002

GO

