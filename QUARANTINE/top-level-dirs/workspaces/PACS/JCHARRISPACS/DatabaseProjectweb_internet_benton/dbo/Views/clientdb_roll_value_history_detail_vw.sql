
			create view dbo.clientdb_roll_value_history_detail_vw
			as
			select r.*, y.certification_dt
			from _clientdb_roll_value_history_detail as r	with (nolock)
			join _clientdb_pacs_year as y	with (nolock)
			on r.prop_val_yr = y.tax_yr

GO

