

CREATE PROCEDURE sp_Rebuild_AllFragmented_SQL2005     

   @pctFrag smallint = 10
AS
declare @StartProc datetime
    set @StartProc= getdate()
declare @dbname as varchar(50)
set @dbname = 'Database: ' + db_name()

-- NOTE: proc must be run with the "set arithabort on" and "set quoted_identifier on"
--       options set, due to indexes on computed columns 
/* Top of each procedure to capture input parameters */

SET NOCOUNT ON
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(varchar(10),@pctFrag) 
            + ' ' + @dbname
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */
-- this works for SQL Server 2005
-- new syntax for rebuilding all indexes on a tables and indexed views with
-- percentage fragmentaion found in parameter

DECLARE @dbId INT
    SET @dbId = db_id() -- get id for database
declare @ObjName varchar(200)
declare @objType varchar(200)
declare @FragPct numeric(4,2)
declare @sql varchar(500)
declare @status varchar(200)
declare @TotRows bigint
declare @DurSecs int
declare @StartReindex datetime


-- create temp table that includes info on tables needing reindexing

SELECT object_name(A.object_id) AS ObjName,
       so.type_desc as ObjDesc,
       MAX(A.Avg_Fragmentation_In_Percent) as PctFrag
  INTO #frag
  FROM sys.objects so WITH(NOLOCK)
  JOIN sys.indexes B WITH(NOLOCK) 
    ON so.object_id = b.object_id
  JOIN
      sys.dm_db_index_physical_stats (@dbId, NULL,NULL, NULL, NULL) AS A 
    ON A.Object_id = B.Object_id 
   AND A.Index_id = B.Index_id 
 WHERE B.[name] IS NOT NULL
   AND A.page_count  >= 100 -- frag pct only matters with larger page count
   AND A.Avg_Fragmentation_In_Percent >= @pctFrag
GROUP BY object_name(A.object_id),
         so.type_desc
ORDER BY so.type_desc -- will get user_table first then views

DECLARE curIndexes CURSOR FAST_FORWARD
for
  select f.ObjName,
         f.ObjDesc,
         f.PctFrag,
         r.TotRows

    from #frag f join
        ( -- get rowcount for each table being reindexed
			SELECT 
			t.name as ObjName, 
			TotRows = SUM 
			( 
			CASE 
			WHEN (p.index_id < 2) AND (a.type = 1) THEN p.rows 
			ELSE 0 
			END 
			) 
			FROM sys.tables t 
				  INNER JOIN 
				 sys.partitions p 
			  ON t.object_id = p.object_id 
				  INNER JOIN 
				 sys.allocation_units a 
			  ON p.partition_id = a.container_id 
			GROUP BY t.name
         ) as r
 ON f.ObjName = r.ObjName
for read only

open curIndexes
fetch next from curIndexes into @ObjName ,@objType,@FragPct,@TotRows

	/* For each index */
	while @@fetch_status = 0
	  begin
      set @sql = 'ALTER INDEX ALL ON dbo.' + @ObjName + ' REBUILD'

      set @StartReindex = getdate()
      -- update log  
      set @status = @dbname + ' Start Reindex: ' + @ObjName + ' ' + @objType 
                    + ' Percent Fragmented: ' + convert(varchar(120),@FragPct) 
      exec dbo.CurrentActivityLogInsert @proc, @status,@TotRows,@@ERROR

      exec(@sql)
      set @DurSecs = datediff(s,@StartReindex,getdate())
      -- update log  
      set @status =  Replace(@status,'Start','End') + ' Duration in seconds: ' + convert(varchar(30),@DurSecs) 
      exec dbo.CurrentActivityLogInsert @proc, @status,@TotRows,@@ERROR

      checkpoint -- force write of transaction log
      fetch next from curIndexes into @ObjName,@objType,@FragPct,@TotRows

	end

	close curIndexes
	deallocate curIndexes

-- update log 
set @qry = Replace(@qry,'Start','End')
           + ' Proc Total Duration in minutes: ' + convert(varchar(30),datediff(mi,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry

GO

