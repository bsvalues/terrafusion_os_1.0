















/****** Object:  View dbo.REC_TYPE_VW    Script Date: 1/3/99 9:45:18 PM ******/

/****** Object:  View dbo.REC_TYPE_VW    Script Date: 1/3/99 11:57:06 AM ******/
/****** Object:  View dbo.REC_TYPE_VW    Script Date: 12/21/98 5:34:13 PM ******/
/****** Object:  View dbo.rec_type_vw    Script Date: 11/13/98 3:15:12 PM ******/
CREATE VIEW dbo.REC_TYPE_VW
AS
SELECT rect_type.rect_type, rect_type_desc,
               image_type.image_type, 
               image_type.image_desc,            
               rect_type_user_role_assoc.role_type
               
FROM rect_type
inner join image_type on
	rect_type.image_type = image_type.image_type
inner join rect_type_user_role_assoc on
	rect_type_user_role_assoc.rect_type=rect_type.rect_type and
	rect_type_user_role_assoc.image_type=rect_type.image_type

GO

