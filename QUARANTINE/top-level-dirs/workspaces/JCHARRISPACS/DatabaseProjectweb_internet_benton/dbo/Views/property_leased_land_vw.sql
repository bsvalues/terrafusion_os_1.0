
			CREATE VIEW dbo.property_leased_land_vw
			AS
			SELECT DISTINCT
				p.prop_id,
				p.prop_val_yr,
				is_leased_land_property
			from _clientdb_property as p with (nolock)

GO

