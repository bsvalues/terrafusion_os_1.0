
create view change_log_propvalyr_vw

as

	select lChangeID, iColumnID, lKeyValue as prop_val_yr
	from dbo.change_log_keys
	where
		iColumnID in (5136,4083,2770,3505,4381,1829,4723, 5550)

GO

