
-- select ReferenceType,fk_name,fk_col,referenced_col from dbo.fn_GetForeignKeyInfoForATable('imprv_adj')
Create function dbo.fn_GetForeignKeyInfoForATable 
(
@table_requested varchar(300),
@table_owner sysname
)
   returns @FKRef table
(
 ReferenceType varchar(300)
,fk_name sysname
,fk_object_id int
,fk_col varchar(4000)
,referenced_col varchar(4000)
)

as

BEGIN
declare @parent_objid int
    set @parent_objid = (select id from sysobjects 
                           where name = @table_requested
                             and USER_NAME(uid) = @table_owner)

Insert into @FKRef(ReferenceType,fk_name,fk_object_id)
   select distinct 'Is FK Referenced By Table ' + object_name(fkeyid) as ReferenceType,
          object_name(constid) as fkname,
          constid
	from sysforeignkeys 
   where rkeyid = @parent_objid
  

Insert into @FKRef(ReferenceType,fk_name,fk_object_id)
   select distinct 'Has FK References To Table ' + object_name(rkeyid) as ReferenceType,
          object_name(constid) as fkname,
          constid
     from sysforeignkeys
    where fkeyid= @parent_objid


declare @fk_col varchar(4000)
declare @fk_col_hold varchar(4000)
declare @referenced_col varchar(4000)
declare @referenced_col_hold varchar(4000)
    set @fk_col = ''
    set @fk_col_hold = ''
    set @referenced_col = ''
    set @referenced_col_hold = ''
declare @fk_object_id int

declare cRef CURSOR local FAST_FORWARD FOR
SELECT fk_object_id from @FKRef

OPEN cRef
FETCH NEXT FROM cRef INTO @fk_object_id

WHILE @@FETCH_STATUS = 0
BEGIN

    
     declare cCol CURSOR local FAST_FORWARD FOR
       select ISNULL(col_name(fkeyid, fkey),'') as fk_cols
             ,ISNULL(col_name(rkeyid, rkey),'') as referenced_col
	     from sysforeignkeys
        where constid = @fk_object_id
        order by keyno

     open cCol
       FETCH NEXT FROM cCol INTO @fk_col_hold,@referenced_col_hold
		WHILE @@FETCH_STATUS = 0
		BEGIN
      
          set  @fk_col = case  @fk_col  
                             when '' then @fk_col_hold 
                             else  @fk_col + ',' + @fk_col_hold
                         end
          set  @referenced_col = case  @referenced_col  
                             when '' then @referenced_col_hold 
                             else  @referenced_col + ',' + @referenced_col_hold
                         end

          FETCH NEXT FROM cCol INTO @fk_col_hold,@referenced_col_hold

        END
	close cCol
	deallocate cCol

Update @FKRef
   set fk_col = @fk_col
      ,referenced_col = @referenced_col
where fk_object_id = @fk_object_id

set @fk_col = ''
set @referenced_col = ''

FETCH NEXT FROM cRef INTO @fk_object_id
END

close cRef
deallocate cRef

RETURN 
END

GO

