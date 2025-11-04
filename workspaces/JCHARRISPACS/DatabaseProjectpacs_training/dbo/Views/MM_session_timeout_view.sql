

CREATE  VIEW [dbo].[MM_session_timeout_view] AS select datediff(MINUTE,last_update,getdate()) AS value,session_key AS session_key from mobile_manager_session
where ((isnull(logged_out,0) = 0) and (datediff(MINUTE,last_update,GETDATE()) < 480))

GO

