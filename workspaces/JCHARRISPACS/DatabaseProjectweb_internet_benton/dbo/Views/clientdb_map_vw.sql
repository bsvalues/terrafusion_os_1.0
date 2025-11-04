
			create view clientdb_map_vw
			as
			select prop_id,
				prop_val_yr,
				geo_id,
				prop_type_cd,
				prop_type_desc,
				dba_name,
				case when y.certification_dt is null then 'N/A' when ISNULL(p.show_values,'T') = 'F' then 'N/A' else '$' + convert(varchar(20), appraised_val) end as appraised_val,
				abs_subdv_cd,
				mapsco,
				map_id,
				agent_cd,
				hood_cd,
				hood_name,
				owner_name,
				owner_id,
				pct_ownership,
				exemptions,
				state_cd,
				legal_desc,
				replace(replace(replace(situs_display, char(10), ''), char(13), ' '), '  ', ' ') as situs,
				jurisdictions
			from _clientdb_property as p with (nolock)
			join _clientdb_pacs_year as y	with (nolock)
			on p.prop_val_yr = y.tax_yr

GO

