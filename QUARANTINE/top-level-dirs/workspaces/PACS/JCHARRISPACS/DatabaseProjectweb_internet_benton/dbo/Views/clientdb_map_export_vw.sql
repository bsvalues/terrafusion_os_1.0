
			create view clientdb_map_export_vw
		as
		select prop_id,
			prop_val_yr,
			geo_id,
			prop_type_cd,
			prop_type_desc,
			convert(varchar(50), replace(replace(dba_name, '&', '&amp;'), '''', '&apos;')) as dba_name,
			case when y.certification_dt is null then 'N/A' when ISNULL(p.show_values,'T') = 'F' then 'N/A' else '$' + convert(varchar(20), appraised_val) end as appraised_val,
			abs_subdv_cd,
			mapsco,
			map_id,
			agent_cd,
			hood_cd,
			convert(varchar(50), replace(replace(hood_name, '&', '&amp;'), '''', '&apos;')) as hood_name,
			convert(varchar(80), replace(replace(owner_name, '&', '&amp;'), '''', '&apos;')) as owner_name,
			owner_id,
			pct_ownership,
			exemptions,
			state_cd,
			convert(varchar(255), replace(replace(replace(replace(legal_desc, '&', '&amp;'), '''', '&apos;'), '"', '&quot;'), '<', '&lt;')) as legal_desc,
			convert(varchar(255), replace(replace(replace(situs_display, char(10), ''), char(13), ' '), '  ', ' ')) as situs,
			jurisdictions,
			convert(varchar(80), replace(replace(addr_line1, '&', '&amp;'), '''', '&apos;')) as owner_address1,
			convert(varchar(80), replace(replace(addr_line2, '&', '&amp;'), '''', '&apos;')) as owner_address2,
			convert(varchar(80), replace(replace(addr_line3, '&', '&amp;'), '''', '&apos;')) as owner_address3,
			convert(varchar(80), replace(replace(addr_city, '&', '&amp;'), '''', '&apos;')) as city,
			convert(varchar(20), replace(replace(addr_state, '&', '&amp;'), '''', '&apos;')) as state,
			convert(varchar(20), replace(replace(addr_zip, '&', '&amp;'), '''', '&apos;')) as zip,
			convert(varchar(20), rtrim(replace(replace(country_cd, '&', '&amp;'), '''', '&apos;'))) as country
		from _clientdb_property as p with (nolock)
		join _clientdb_pacs_year as y	with (nolock)
		on p.prop_val_yr = y.tax_yr

GO

