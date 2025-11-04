
CREATE PROCEDURE [dbo].ExportDataCleanup
AS
	set nocount on

	set context_info 1 -- needed to enable change logging for a middle-tier process
	
---HANDLE PROPERTY TABLE
	-- GEO_ID
		--carriage returns/Line Feeds
		UPDATE property		
		SET geo_id = replace(geo_id, CHAR(13) +CHAR(10),' ')--Replaces with a space
		where geo_id like '%' + CHAR(13) +CHAR(10)+ '%'
		
		-----Tabs
		UPDATE property		
		SET geo_id = replace(geo_id, char(9),' ')--Replaces with a space
		where geo_id like '%' + char(9)+ '%'

		---Line Feeds
		UPDATE property		
		SET geo_id = replace(geo_id, char(10),' ')--Replaces with a space
		where geo_id like '%' + char(10)+ '%'
			
		---Carriage Returns
		UPDATE property		
		SET geo_id = replace(geo_id, char(13),' ')--Replaces with a space
		where geo_id like '%' + char(13)+ '%'

		--ELLIPSIS
		UPDATE property		
		SET geo_id = replace(geo_id, '�',' ')--Replaces with a space
		where geo_id like '%�%'

---HANDLE ACCOUNT TABLE
	-- GEO_ID
		--carriage returns/Line Feeds
		UPDATE account
		SET file_as_name = replace(file_as_name, CHAR(13) +CHAR(10),' ')--Replaces with a space
		where file_as_name like '%' + CHAR(13) +CHAR(10)+ '%'
		
		-----Tabs
		UPDATE account
		SET file_as_name = replace(file_as_name, char(9),' ')--Replaces with a space
		where file_as_name like '%' + char(9)+ '%'

		---Line Feeds
		UPDATE account
		SET file_as_name = replace(file_as_name, char(10),' ')--Replaces with a space
		where file_as_name like '%' + char(10)+ '%'
			
		---Carriage Returns
		UPDATE account
		SET file_as_name = replace(file_as_name, char(13),' ')--Replaces with a space
		where file_as_name like '%' + char(13)+ '%'

		--ELLIPSIS
		UPDATE account
		SET file_as_name = replace(file_as_name, '�',' ')--Replaces with a space
		where file_as_name like '%�%'

---HANDLE PROPERTY_VAL TABLE
	-- LEGAL_DESC
		-----Carriage Returns/Line Feeds
		UPDATE property_val		
		SET LEGAL_DESC = replace(legal_desc, CHAR(13) +CHAR(10),' ')--Replaces with a space
		where legal_desc like '%' + CHAR(13) +CHAR(10)+ '%'

		-----Tabs
		update property_val		
		set legal_desc = replace(legal_desc, char(9), ' ') 
		where legal_desc like '%' + char(9) + '%'
		and (prop_inactive_dt is null or udi_parent = 't')
		
		----Line Feeds
		UPDATE property_val		
		SET LEGAL_DESC = replace(legal_desc, CHAR(10),' ')--Replaces with a space
		where legal_desc like '%' + CHAR(10)+ '%'

		---Carriage Returns
		UPDATE property_val		
		SET LEGAL_DESC = replace(legal_desc, CHAR(13),' ')--Replaces with a space
		where legal_desc like '%' + CHAR(13)+ '%'

		--NON-ASCII
		-------Function to remove non-Ascii characters from the legal
		update pv set pv.legal_desc = dbo.fn_RemoveNonASCII(pv.legal_desc)
		from property_val pv with (nolock)
		inner join property p with (nolock) on
		pv.prop_id = p.prop_id
		inner join property_profile pp with (nolock) on
		pv.prop_id = pp.prop_id
		and pv.prop_val_yr = pp.prop_val_yr
		where (pv.prop_inactive_dt is null or udi_parent = 'T')
		and pv.legal_desc <> dbo.fn_RemoveNonASCII(pv.legal_desc)		
		
		--ELLIPSIS
		update pv set pv.legal_desc = replace(legal_desc, '�',' ')
		from property_val pv with (nolock)
		inner join property p with (nolock) on
		pv.prop_id = p.prop_id
		inner join property_profile pp with (nolock) on
		pv.prop_id = pp.prop_id
		and pv.prop_val_yr = pp.prop_val_yr
		where (pv.prop_inactive_dt is null or udi_parent = 'T')			
		and pv.legal_desc like '%�%'


---HANDLE WA_TAX_STATEMENT TABLE
	--LEGAL_DESC
		-----Carriage Returns/Line Feeds
		UPDATE wa_tax_statement		
		SET LEGAL_DESC = replace(legal_desc, CHAR(13) +CHAR(10),' ')--Replaces with a space
		where legal_desc like '%' + CHAR(13) +CHAR(10)+ '%'

		-----Tabs
		update wa_tax_statement		
		set legal_desc = replace(legal_desc, char(9), ' ') 
		where legal_desc like '%' + char(9) + '%'

		----Line Feeds
		UPDATE wa_tax_statement		
		SET LEGAL_DESC = replace(legal_desc, CHAR(10),' ')	--Replaces with a space
		where legal_desc like '%' + CHAR(10)+ '%'

		---Carriage Returns
		UPDATE wa_tax_statement		
		SET LEGAL_DESC = replace(legal_desc, CHAR(13),' ')	--Replaces with a space
		where legal_desc like '%' + CHAR(13)+ '%'

		--GEO_ID
		-----Carriage Returns/Line Feeds
		UPDATE wa_tax_statement		
		SET geo_id = replace(geo_id, CHAR(13) +CHAR(10),' ')--Replaces with a space
		where geo_id like '%' + CHAR(13) +CHAR(10)+ '%'

GO

