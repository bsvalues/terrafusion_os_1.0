
















/****** Object:  View dbo.SUB_TYPE_VW    Script Date: 1/3/99 9:45:18 PM ******/

/****** Object:  View dbo.SUB_TYPE_VW    Script Date: 1/3/99 11:57:06 AM ******/
/****** Object:  View dbo.SUB_TYPE_VW    Script Date: 12/21/98 5:34:16 PM ******/
/****** Object:  View dbo.SUB_TYPE_VW    Script Date: 11/13/98 3:15:12 PM ******/
CREATE VIEW dbo.SUB_TYPE_VW
AS
SELECT sub_type.image_type, 
               sub_type.sub_type, 
               sub_type_desc, 
               rect_type.rect_type, 
               rect_type.rect_type_desc,
               sub_type_user_role_assoc.role_type

FROM sub_type
inner join rect_type on
	sub_type.rect_type = rect_type.rect_type and
	sub_type.image_type = rect_type.image_type
inner join sub_type_user_role_assoc on
	sub_type_user_role_assoc.rect_type=sub_type.rect_type and
	sub_type_user_role_assoc.image_type=sub_type.image_type and
	sub_type_user_role_assoc.sub_type=sub_type.sub_type

GO

