
create view change_log_acctid_vw


as

	select lChangeID, iColumnID, lKeyValue as acct_id
	from dbo.change_log_keys
	where
		iColumnID in (42,160,1757)

GO

