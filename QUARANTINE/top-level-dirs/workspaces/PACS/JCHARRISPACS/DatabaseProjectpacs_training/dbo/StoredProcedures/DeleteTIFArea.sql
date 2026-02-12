

create procedure DeleteTIFArea
	@tif_area_id int
as

delete tif_area_prop_values
where tif_area_id = @tif_area_id

delete tif_area_prop_assoc
where tif_area_id = @tif_area_id

delete tif_area_levy
where tif_area_id = @tif_area_id

delete tif_area_tax_area_assoc
where tif_area_id = @tif_area_id

delete tif_area
where tif_area_id = @tif_area_id

GO

