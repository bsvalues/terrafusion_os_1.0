
-- select JustFileName,Filesize,FileExists from dbo.fn_GetTriggerInfoForATable('c:\Avail_Counters.txt')
Create function dbo.fn_GetTriggerInfoForATable 
(
@table_name varchar(300),
@table_owner sysname
)
   returns @TriggerInfo Table
(
trigger_name varchar(300),
trigger_status varchar(10),
trigger_event varchar(100)
)
as

BEGIN


declare @results table
(
trigger_name varchar(300),
trigger_type varchar(30),
trigger_is_insert varchar(10),
trigger_is_update varchar(10),
trigger_is_delete varchar(10),
trigger_status varchar(10),
trigger_event varchar(100)
)

Insert into @results
(
trigger_name ,
trigger_type ,
trigger_is_insert ,
trigger_is_update ,
trigger_is_delete ,
trigger_status 
)

SELECT 
  --  [Table] = OBJECT_NAME(o.parent_obj), 
    [Trigger] = o.[name], 
    [Type] = CASE WHEN 
        ( 
        SELECT 
            cmptlevel 
        FROM 
            master.dbo.sysdatabases 
        WHERE 
            [name] = DB_NAME() 
        ) = 80 THEN 
        CASE WHEN 
            OBJECTPROPERTY(o.[id], 
            'ExecIsInsteadOfTrigger') = 1 THEN 
                'Instead Of' 
            ELSE 
                'After' 
            END 
        ELSE 
            'After' 
        END, 
    [Insert] = CASE WHEN 
        OBJECTPROPERTY(o.[id], 
        'ExecIsInsertTrigger') = 1 THEN 
            'Insert' 
        ELSE 
            '' 
        END, 
    [Update] = CASE WHEN 
        OBJECTPROPERTY(o.[id], 
        'ExecIsUpdateTrigger') = 1 THEN 
            'Update' 
        ELSE 
            '' 
        END, 
    [Delete] = CASE WHEN  
        OBJECTPROPERTY(o.[id], 
        'ExecIsDeleteTrigger') = 1 THEN 
            'Delete' 
        ELSE 
            '' 
        END, 
    [Enabled?] = CASE WHEN 
        OBJECTPROPERTY(o.[id], 
        'ExecIsTriggerDisabled') = 0 THEN 
            'Enabled' 
        ELSE 
            'Disabled' 
        END 
 FROM sysobjects as o 
      join
      sysobjects as p
   ON 
      o.parent_obj = p.id
WHERE 
      o.parent_obj = OBJECT_ID (@table_name)
  and USER_NAME(p.uid) = @table_owner
  and OBJECTPROPERTY(o.[id], 'IsTrigger') = 1 


insert into @TriggerInfo
(
trigger_name ,
trigger_status ,
trigger_event
)
select 
       trigger_name 
       ,trigger_status
       ,trigger_type + ' ' 
                      + case when len(trigger_is_insert) > 0 
                          then  trigger_is_insert + ' ' 
                          else ''
                        end
                      + case when len(trigger_is_update) > 0 
                          then  trigger_is_update + ' ' 
                          else ''
                        end
                      + trigger_is_delete  
  from @results

RETURN
END

GO

