
create procedure ValidatePictometryImageTypes
@type varchar(10), @rect varchar(10),
@subtype_north varchar(10), @subtype_south varchar(10),
@subtype_east varchar(10), @subtype_west varchar(10)

as

set nocount on

declare @assessor_role int
set @assessor_role = 0

-- image type
if not exists (select 1 from image_type where image_type = @type)
begin
	insert image_type
	(image_type, image_desc, picture_type, scanned_user_right, photo_user_right)
	values (@type, @type, 'JPG', 'N', 'N')
end

if not exists 
(select 1 from image_type_user_role_assoc 
 where image_type = @type and role_type = @assessor_role)
begin
	insert image_type_user_role_assoc
	(image_type, role_type)
	values (@type, @assessor_role)
end

-- image record type
if not exists (select 1 from rect_type where image_type = @type and rect_type = @rect)
begin
	insert rect_type
	(image_type, rect_type, rect_type_desc)
	values (@type, @rect, @rect)
end

if not exists
(select 1 from rect_type_user_role_assoc
 where image_type = @type and rect_type = @rect and role_type = @assessor_role)
begin
	insert rect_type_user_role_assoc
	(image_type, rect_type, role_type)
	values (@type, @rect, @assessor_role)
end

-- subtype: north
if not exists 
(select 1 from sub_type
 where image_type = @type
 and rect_type = @rect
 and sub_type = @subtype_north)
begin
	insert sub_type
	(image_type, rect_type, sub_type, sub_type_desc)
	values (@type, @rect, @subtype_north, 'North view')
end

-- subtype: south
if not exists 
(select 1 from sub_type
 where image_type = @type
 and rect_type = @rect
 and sub_type = @subtype_south)
begin
	insert sub_type
	(image_type, rect_type, sub_type, sub_type_desc)
	values (@type, @rect, @subtype_south, 'South view')
end

-- subtype: east
if not exists 
(select 1 from sub_type
 where image_type = @type
 and rect_type = @rect
 and sub_type = @subtype_east)
begin
	insert sub_type
	(image_type, rect_type, sub_type, sub_type_desc)
	values (@type, @rect, @subtype_east, 'East view')
end

-- subtype: west
if not exists 
(select 1 from sub_type
 where image_type = @type
 and rect_type = @rect
 and sub_type = @subtype_west)
begin
	insert sub_type
	(image_type, rect_type, sub_type, sub_type_desc)
	values (@type, @rect, @subtype_west, 'West view')
end

GO

