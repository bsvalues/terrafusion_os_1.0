
CREATE PROCEDURE InsertAbsSubdvWorksheet

	@abs_subdv_cd				varchar(10),
	@cad_acct_no				varchar(50),
	@cad_slide_no				varchar(20),
	@tax_year					varchar(4),
	@map_records_cabinet		varchar(10),
	@date_approved				varchar(10),
	@slide						varchar(10),
	@file_date					varchar(10),
	@current_owner				varchar(100),
	@current_cc_vol_page		varchar(50),
	@current_deed_type			varchar(10),
	@current_exc_date			varchar(10),
	@city_entity				varchar(50),
	@county_entity				varchar(50),
	@school_entity				varchar(50),
	@mapsco_no					varchar(20),
	@access_code				varchar(20),
	@res_com_ex					varchar(20),
	@impts						varchar(20),
	@lots						varchar(20),
	@tracts						varchar(20),
	@plat_acreage				varchar(20),
	@rollback					varchar(20),
	@sq_footage					varchar(20),
	@previous_owner				varchar(100),
	@previous_cc_vol_page		varchar(50),
	@previous_deed_type			varchar(10),
	@previous_exc_date			varchar(10),
	@abstract_map_changed		bit,
	@subdivision_map_changed	bit,
	@remarks					varchar(500)

AS

	DELETE FROM abs_subdv_worksheet
	WHERE abs_subdv_cd = @abs_subdv_cd

	INSERT INTO abs_subdv_worksheet (
		abs_subdv_cd, cad_acct_no, cad_slide_no, tax_year, map_records_cabinet,
		date_approved, slide, file_date, current_owner, current_cc_vol_page,
		current_deed_type, current_exc_date, city_entity, county_entity, school_entity,
		mapsco_no, access_code, res_com_ex, impts, lots, tracts, plat_acreage,
		[rollback], sq_footage, previous_owner, previous_cc_vol_page, previous_deed_type, previous_exc_date,
		abstract_map_changed, subdivision_map_changed, remarks
	)
	VALUES
	(@abs_subdv_cd, @cad_acct_no, @cad_slide_no, @tax_year, @map_records_cabinet,
	@date_approved, @slide, @file_date, @current_owner, @current_cc_vol_page,
	@current_deed_type, @current_exc_date, 	@city_entity, @county_entity, @school_entity,
	@mapsco_no, @access_code, @res_com_ex, @impts, @lots, @tracts, @plat_acreage, 
	@rollback, @sq_footage, @previous_owner, @previous_cc_vol_page, @previous_deed_type, 
	@previous_exc_date, @abstract_map_changed, @subdivision_map_changed, @remarks)

GO

