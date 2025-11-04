
CREATE PROCEDURE dbo.sp_AgentJobListing
AS
set nocount on 

declare @c char(1000)
declare @cnt int

-- Create table to hold job information
create table #enum_job ( 
Job_ID uniqueidentifier,
Last_Run_Date int,
Last_Run_Time int,
Next_Run_Date int,
Next_Run_Time int,
Next_Run_Schedule_ID int,
Requested_To_Run int,
Request_Source int,
Request_Source_ID varchar(100),
Running int,
Current_Step int,
Current_Retry_Attempt int, 
State int
)       

------------------
-- Begin Section 2
------------------

-- create a table to hold job_id and the job_id in hex character format
create table ##jobs (job_id uniqueidentifier , 
                     job_id_char varchar(100))

-- Get a list of jobs 	
insert into #enum_job 
      execute master.dbo.xp_sqlagent_enum_jobs 1,
                'garbage' -- doesn't seem to matter what you put here

------------------
-- Begin Section 3
------------------

-- calculate the #jobs table with job_id's
-- and their hex character representation
insert into ##jobs 
       select job_id, dbo.fn_HexToChar(job_id,16) from #enum_job

------------------
-- Begin Section 4
------------------

-- get a count or long running jobs
select @cnt = count(*) 
     from master.dbo.sysprocesses a
          join ##jobs b
          on  substring(a.program_name,32,32)= b.job_id_char
          join msdb.dbo.sysjobs c on b.job_id = c.job_id 
     -- check for jobs that have been running longer that 6 hours.
     where login_time < dateadd(hh,-6,getdate())

------------------
-- Begin Section 5
------------------

select substring(c.name, 1, 78) as [name] from master.dbo.sysprocesses a
join ##jobs b on substring(a.program_name, 32, 32) = b.job_id_char
join msdb.dbo.sysjobs c on b.job_id = c.job_id

drop table #enum_job
drop table ##jobs

GO

