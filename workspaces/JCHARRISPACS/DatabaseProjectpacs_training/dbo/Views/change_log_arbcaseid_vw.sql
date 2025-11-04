
create view change_log_arbcaseid_vw


as

	select lChangeID, iColumnID, lKeyValue as arb_case_id
	from dbo.change_log_keys
	where
		iColumnID = 612

GO

