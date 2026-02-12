




CREATE VIEW dbo.delq_notice_info_vw
AS
SELECT     dbo.event.event_id, dbo.event_type.event_type_cd, dbo.event_type.event_type_desc, dbo.event.event_date, dbo.event.pacs_user, 
                      dbo.event.event_desc, dbo.event.ref_num, dbo.delq_notice.print_dt, dbo.delq_notice.notice_dt, dbo.delq_notice.owner_file_as_name, 
                      dbo.delq_notice.owner_addr_line1, dbo.delq_notice.owner_addr_line2, dbo.delq_notice.owner_addr_line3, dbo.delq_notice.owner_addr_city, 
                      dbo.delq_notice.owner_addr_state, dbo.delq_notice.owner_addr_country_cd, dbo.delq_notice.owner_addr_zip, dbo.delq_notice.notice_heading
FROM         dbo.event INNER JOIN
                      dbo.event_type ON dbo.event.event_type = dbo.event_type.event_type_cd INNER JOIN
                      dbo.delq_notice ON dbo.event.ref_num = dbo.delq_notice.delq_notice_id
WHERE dbo.event.ref_evt_type = 'DELQNOTICE'

GO

