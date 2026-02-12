

CREATE VIEW dbo.mh_movement_vw
AS
SELECT     dbo.prop_event_assoc.prop_id, dbo.account.file_as_name, dbo.mh_movement.permit_num, dbo.mh_movement.request_dt, dbo.event.event_date, 
                      dbo.event.pacs_user
FROM         dbo.mh_movement INNER JOIN
                      dbo.event ON dbo.mh_movement.permit_num = dbo.event.ref_id1 INNER JOIN
                      dbo.prop_event_assoc ON dbo.event.event_id = dbo.prop_event_assoc.event_id INNER JOIN
                      dbo.account ON dbo.event.ref_id2 = dbo.account.acct_id
WHERE     (dbo.event.event_type = 'MHM')

GO

