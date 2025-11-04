
create view change_log_arbitrationid_vw

as

	select lChangeID, iColumnID, lKeyValue as arbitration_id
	from dbo.change_log_keys
	where
		iColumnID = 9304

GO

