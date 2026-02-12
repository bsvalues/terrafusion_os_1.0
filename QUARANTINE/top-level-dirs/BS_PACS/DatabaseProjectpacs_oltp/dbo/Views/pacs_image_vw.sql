

/* Create the view we previously dropped */
create view pacs_image_vw
as
	select distinct
		pacs_image.ref_id, pacs_image.image_id, pacs_image.ref_type,
		pacs_image.image_type, image_type.image_desc, 
		image_type.system_type as image_system_type, pacs_image.location, pacs_image.scan_dt, pacs_image.image_dt, 
		pacs_image.expiration_dt, pacs_image.sub_type, sub_type.sub_type_desc, sub_type.system_type as sub_system_type, 
		pacs_image.rec_type, rect_type.rect_type_desc, rect_type.system_type as rect_system_type, image_type.system_type, 
		sub_type.appr_conf, sub_type.coll_conf, pacs_image.system_type as property_system_type, isnull(image_type.scanned_user_right, 'f') as scanned_user_right, 
		isnull(image_type.photo_user_right, 'f') as photo_user_right, ref_year
	from pacs_image
	inner join image_type on
		pacs_image.image_type = image_type.image_type and
		image_type.system_type = pacs_image.system_type
	inner join rect_type on
		pacs_image.rec_type = rect_type.rect_type and rect_type.system_type = pacs_image.system_type and 
		pacs_image.image_type = rect_type.image_type and image_type.system_type = pacs_image.system_type
	inner join sub_type on
		pacs_image.sub_type = sub_type.sub_type and sub_type.system_type = pacs_image.system_type and 
		pacs_image.rec_type = sub_type.rect_type and rect_type.system_type = pacs_image.system_type and 
		pacs_image.image_type = sub_type.image_type and image_type.system_type = pacs_image.system_type

GO

