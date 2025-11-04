
CREATE PROCEDURE dbo.sp_AddTableDescription
  @TableName varchar(255),
  @Description varchar(7500),
  @table_owner sysname = 'dbo'
AS 

SET NOCOUNT ON

--The size of description cannot be more than 7,500 bytes.
DECLARE @err int
    SET @err = 0

-- validate input
if LEN(@Description) = 0
   begin
      set @err = -1
      RAISERROR('No description provided for Table: %s ', 16, 1,@TableName) WITH NOWAIT
      return @err
   end
   
-- see if table exists
if not exists (
	select *
	from sysobjects
        where name = @TableName
          and xtype = 'U'
         )
   begin
      set @err = -2
      RAISERROR('Table does not exists: %s', 16, 1, @TableName) WITH NOWAIT
      return @err
   end

-- determine if this is SQL 2000 or greater
DECLARE @ver varchar(7)
SELECT @ver = CASE
 WHEN CHARINDEX('9.00', @@VERSION) > 0 THEN '2005'
 WHEN CHARINDEX('8.00', @@VERSION) > 0 THEN '2000'
 ELSE '2005' -- no clients are lower than 2000, default to 2005
END 

declare @level0_val varchar(25)

if @ver = '2005'
   begin
      set @level0_val = 'schema'
   end 
else
   begin
      set @level0_val = 'user'
   end 
-- check to see if description of table already exists
-- to see if we need to add or update
IF EXISTS(select objname
            FROM ::fn_listextendedproperty (NULL, @level0_val, @table_owner, 'table', @TableName, NULL, NULL) )
   begin
     -- update
       EXEC sp_updateextendedproperty 
       @name = N'MS_Description', 
       @value = @Description, 
       @level0type = @level0_val,
       @level0name = @table_owner,  --Schema Name
       @level1type = N'TABLE',
       @level1name = @TableName --Table Name
   end
ELSE
  begin 
     --add
		--add an Extended Property as table description
		EXEC sp_addextendedproperty 
		@name=N'MS_Description', 
		@value=@Description ,
		@level0type=@level0_val, 
		@level0name=@table_owner, --Schema Name
		@level1type=N'TABLE', 
		@level1name=@TableName --Table Name
  end

GO

