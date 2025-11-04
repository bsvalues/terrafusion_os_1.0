
create view change_log_arbyr_vw


as

	select lChangeID, iColumnID, lKeyValue as arb_yr
	from dbo.change_log_keys
	where
		iColumnID in (4083,239)

GO

