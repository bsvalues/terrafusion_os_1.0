
create view change_log_chgofownerid_vw


as

	select lChangeID, iColumnID, lKeyValue as chg_of_owner_id
	from dbo.change_log_keys
	where
		iColumnID = 713

GO

