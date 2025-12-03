CREATE PROCEDURE [permit].[pProcess_BuildingImport]
AS 
BEGIN
	--Identify by taxlot
	UPDATE bi
	SET taxlot_found = 1
	, bi.prop_id = prop.prop_id
	, bi.prop_type = prop.prop_type_cd
	, bi.UpdatedDate = GETDATE()
	--SELECT * 
	FROM permit.building_import bi
	INNER JOIN dbo.property prop ON CAST(REPLACE(bi.taxlot ,'-','') AS VARCHAR(50)) = prop.simple_geo_id
	WHERE bi.taxlot_found IS NULL
	AND EXISTS(SELECT * FROM dbo.property_val pv WHERE pv.prop_inactive_dt IS NULL AND pv.prop_id = prop.prop_id and pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system))
		
	--Identify by address
	UPDATE bi 
	SET bi.prop_id = addr.prop_id
	, bi.taxlot = prop.simple_geo_id
	, bi.prop_type = prop.prop_type_cd
	, bi.UpdatedDate = GETDATE()
	--SELECT prop.prop_id
	FROM dbo.property prop
	INNER JOIN [pacs_oltp].[dbo].situs addr ON prop.prop_id = addr.prop_id AND addr.primary_situs = 'Y'
	INNER JOIN permit.building_import bi ON REPLACE(ISNULL(situs_num,0) + ISNULL(situs_street_prefx,'') + ISNULL(situs_street,'') + ISNULL(situs_street_sufix,'') + ISNULL(situs_unit,''),' ','') = REPLACE(bi.serviceaddress,' ','')
	WHERE bi.prop_id IS NULL
	AND EXISTS(SELECT * FROM dbo.property_val pv WHERE pv.prop_inactive_dt IS NULL AND pv.prop_id = prop.prop_id and pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system))

	--Identify by address (Prosser format)
	UPDATE bi 
	SET bi.prop_id = addr.prop_id
	, bi.taxlot = prop.simple_geo_id
	, bi.prop_type = prop.prop_type_cd
	, bi.UpdatedDate = GETDATE()
	--SELECT prop.prop_id
	FROM dbo.property prop
	INNER JOIN [pacs_oltp].[dbo].situs addr ON prop.prop_id = addr.prop_id AND addr.primary_situs = 'Y'
	INNER JOIN permit.building_import bi ON REPLACE(ISNULL(situs_street_prefx,'') + ISNULL(situs_street,'') + ISNULL(situs_street_sufix,'') + ISNULL(situs_unit,'') + ISNULL(situs_num,0),' ','') = REPLACE(bi.serviceaddress,' ','')
	WHERE bi.prop_id IS NULL
	AND EXISTS(SELECT * FROM dbo.property_val pv WHERE pv.prop_inactive_dt IS NULL AND pv.prop_id = prop.prop_id and pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system))

	UPDATE bi 
	SET bi.bldg_permit_id = bp.bldg_permit_id
	FROM permit.building_import bi
	INNER JOIN dbo.building_permit bp ON bi.permitno = bp.bldg_permit_num
	WHERE 1=1
	AND bi.bldg_permit_id IS NULL
	--AND bldg_permit_num = '2019000478'

	UPDATE bi
	SET bi.bldg_permit_id = bp.bldg_permit_id
	, bi.UpdatedDate = GETDATE()
	FROM dbo.building_permit bp 
	INNER JOIN dbo.prop_building_permit_assoc assoc ON assoc.bldg_permit_id = bp.bldg_permit_id
	INNER JOIN dbo.property prop ON prop.prop_id = assoc.prop_id
	INNER JOIN permit.building_import bi ON  CAST(REPLACE(bi.taxlot ,'-','') AS VARCHAR(50)) = prop.simple_geo_id
	AND bi.permitno = bldg_permit_num
	WHERE 1=1 
	AND bi.bldg_permit_id IS NULL
	AND EXISTS(SELECT * FROM dbo.property_val pv WHERE pv.prop_inactive_dt IS NULL AND pv.prop_id = prop.prop_id and pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system))
	

	DECLARE @buildingimportid INT,
		@_permit_num       varchar(30), 
		@Status            varchar(5),
		@issue_dt	       datetime,
		@dt_complete       datetime,
		@street_num        varchar(10),
		@street_prefix     varchar(10),
		@street_name       varchar(50),
	--    @Street            varchar(50),
		@street_suffix     varchar(10),
		@unit_type         varchar(5),
		@unit_number       varchar(15),
		@sub_division      varchar(50),
		@plat              varchar(4),
		@block             varchar(4),
		@lot               varchar(50),
		@res_com           char(1),
		@value             numeric,
		@area              numeric,
		@dim_1             varchar(10),
		@dim_2             varchar(10),
		@dim_3             varchar(10),
		@num_floors        numeric,
		@num_units         numeric,
		@comments          varchar(512),
		@SubTypecode       varchar(5),
		@SubTypeDesc       varchar(50),
		@WorkTypecode      varchar(5),
		@WorkTypeDesc      varchar(50),
		@bldg_inspect_req  char(1),
		@bldg_permit_desc  VARCHAR(255),
		@elec_inspect_req  char(1),
		@mech_inspect_req  char(1),
		@plumb_inspect_req char(1),
		@issued_to         varchar(50),
		@owner_phone       varchar(16),
		@builder	       varchar(50),
		@builder_phone     varchar(16),
		@old_permit_no     varchar(20),
		@property_roll     varchar(50),
		@place_id          NUMERIC,
		@prop_id INT,
		@bldg_permit_id INT

	DECLARE newPermit CURSOR
	FOR SELECT p.buildingimportid,
			   p.permitno permit_num,
			   CASE WHEN permitstatus = 'active' THEN 'OPEN' ELSE 'CLOSED' END Status,
			   p.issuedate issue_dt,
			   p.prop_type,
			   p.projectcost,
			   p.serviceaddress,
			   LTRIM(RTRIM(ISNULL(p.contractor_lastname,''))) issued_to,
			   p.DESCRIPTION,
			   p.prop_id
			 FROM permit.building_import p 
			 where  p.bldg_permit_id IS NULL AND prop_id IS NOT NULL AND p.LastAttemptedImport IS NULL

	OPEN newPermit;

	FETCH NEXT FROM newPermit INTO 
		@buildingimportid ,
		@_permit_num       , 
		@Status            ,
		@issue_dt	       ,
		--@dt_complete       ,
		@res_com           ,
		@value             ,
		@street_name       ,
		@issued_to         ,
		@bldg_permit_desc  ,
		@prop_id
		--@street_num        varchar(10),
		--@street_prefix     varchar(10),
		
	--    @Street            varchar(50),
		--@street_suffix     varchar(10),
		--@unit_type         varchar(5),
		--@unit_number       varchar(15),
		--@sub_division      varchar(50),
		--@plat              varchar(4),
		--@block             varchar(4),
		--@lot               varchar(50),

		--@area              numeric,
		--@dim_1             varchar(10),
		--@dim_2             varchar(10),
		--@dim_3             varchar(10),
		--@num_floors        numeric,
		--@num_units         numeric,
    
		--@SubTypecode       varchar(5),
		--@SubTypeDesc       varchar(50),
		--@WorkTypecode      varchar(5),
		--@WorkTypeDesc      varchar(50),
		--@bldg_inspect_req  char(1),
		--@elec_inspect_req  char(1),
		--@mech_inspect_req  char(1),
		--@plumb_inspect_req char(1),
       
		--@owner_phone       varchar(16),
		--@builder	       varchar(50),
		--@builder_phone     varchar(16),
		--@old_permit_no     varchar(20),
		--@property_roll     varchar(50),
		--@place_id          numeric

	WHILE @@FETCH_STATUS = 0
		BEGIN
    
			PRINT @_permit_num
			EXECUTE permit.pInsert_BuildingPermit @Command = 1,
					@_permit_num      = @_permit_num      , 
					@Status           = @Status           ,
					@issue_dt	      = @issue_dt	      ,
					--@dt_complete      = @dt_complete      ,
					@res_com          = @res_com          ,
					@value            = @value            ,
					@street_name = @street_name,
					@bldg_permit_desc = @bldg_permit_desc ,
					@issued_to        = @issued_to        ,
					@CIAPS_BldgPermitImportID = @buildingimportid,
					@OUTPUT_Permit_id = @bldg_permit_id OUTPUT

				PRINT 'After Insert SP'
				PRINT 'BuildingImportID - ' + STR(@buildingimportid)
				PRINT 'BuildingPermitID (new) - ' + STR(@bldg_permit_id)

				IF @bldg_permit_id IS NOT NULL
				BEGIN
				
					UPDATE b 
					SET b.bldg_permit_id = ISNULL(@bldg_permit_id,bldg_permit_id)
					, LastAttemptedImport = GETDATE()
					FROM permit.building_import b 
					WHERE b.buildingimportid = @buildingimportid
				END
				ELSE 
					PRINT 'Missing Bldg Permit ID - Not Inserted'

				IF NOT EXISTS(SELECT * FROM dbo.prop_building_permit_assoc WHERE bldg_permit_id = @bldg_permit_id) AND @bldg_permit_id IS NOT NULL
					BEGIN
						PRINT 'Inserting into Prop bldg Permit Assoc'
						INSERT INTO dbo.prop_building_permit_assoc
						(
							bldg_permit_id,
							prop_id,
							primary_property
						)
						VALUES
						(   @bldg_permit_id,   -- bldg_permit_id - int
							@prop_id,   -- prop_id - int
							1 -- primary_property - bit
						)
					END
			FETCH NEXT FROM newPermit INTO 
				@buildingimportid ,
				@_permit_num       , 
				@Status            ,
				@issue_dt	       ,
				--@dt_complete       ,
				@res_com           ,
				@value             ,
				@street_name       ,
				@issued_to         ,
				@bldg_permit_desc  ,
				@prop_id
			PRINT @@FETCH_STATUS
		END;

	CLOSE newPermit;

	DEALLOCATE newPermit;
END

GO

