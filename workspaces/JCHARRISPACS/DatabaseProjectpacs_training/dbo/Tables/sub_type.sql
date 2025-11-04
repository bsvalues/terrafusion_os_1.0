CREATE TABLE [dbo].[sub_type] (
    [image_type]             CHAR (10)    NOT NULL,
    [rect_type]              CHAR (10)    NOT NULL,
    [sub_type]               CHAR (10)    NOT NULL,
    [sub_type_desc]          VARCHAR (50) NULL,
    [expire_image]           CHAR (1)     NULL,
    [method]                 CHAR (5)     NULL,
    [expire_years]           INT          NULL,
    [supercede_options]      CHAR (5)     NULL,
    [supercede_expire_years] INT          NULL,
    [allow_website_images]   BIT          CONSTRAINT [CDF_sub_type_allow_website_images] DEFAULT (0) NOT NULL,
    [confidential]           BIT          CONSTRAINT [CDF_sub_type_confidential] DEFAULT ((0)) NOT NULL,
    [transfer_to_penpad]     BIT          CONSTRAINT [CDF_sub_type_transfer_to_penpad] DEFAULT ((0)) NOT NULL,
    [default_new_penpad]     BIT          CONSTRAINT [CDF_sub_type_default_new_penpad] DEFAULT ((0)) NOT NULL,
    [deferral_image]         BIT          CONSTRAINT [CDF_sub_type_deferral_image] DEFAULT ('false') NOT NULL,
    CONSTRAINT [CPK_sub_type] PRIMARY KEY CLUSTERED ([image_type] ASC, [rect_type] ASC, [sub_type] ASC),
    CONSTRAINT [CFK_sub_type_image_type_rect_type] FOREIGN KEY ([image_type], [rect_type]) REFERENCES [dbo].[rect_type] ([image_type], [rect_type])
);


GO


create trigger tr_sub_type_insert_update_DefaultNewPenpad
on sub_type
for insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
	declare
		@image_type char(10),
		@rect_type char(10),
		@sub_type char(10)
	
	select
		@image_type = image_type,
		@rect_type = rect_type,
		@sub_type = sub_type
	from inserted
	where default_new_penpad = 1
	
	if ( @image_type is null )
	begin
		return
	end
	
	update sub_type
	set default_new_penpad = 0
	where
		image_type <> @image_type or
		rect_type <> @rect_type or
		sub_type <> @sub_type

GO


create trigger tr_sub_type_delete_insert_update_MemTable
on sub_type
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'sub_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicating if this is the default image/record/sub type for new images on the penpad', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sub_type', @level2type = N'COLUMN', @level2name = N'default_new_penpad';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates if this code is used for deferral type images', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sub_type', @level2type = N'COLUMN', @level2name = N'deferral_image';


GO

