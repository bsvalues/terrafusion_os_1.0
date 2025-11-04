

/****** Script for SelectTopNRows command from SSMS  ******/

 create view [dbo].[__pp_links__] as
SELECT DISTINCT 
                         prop_links.prop_id AS prop_id, prop_links.file_as_name as file_as_name, prop_links.hs as hs, 
						 prop_links.situs_address as situs, prop_links.legal_desc as legal_desc, 
						 prop_links.geo_id as geo_id, prop_links.market as market, prop_links.parent_prop_id as parent_prop_id, prop_links.complete as complete, 
                         prop_links.lOrder as lOrder, prop_links.dba_name as dba_name, 
						 __BPP__.supples as supples, __BPP__.Ag_MandE as  Ag_MandE, __BPP__.[BPP EQUIPM] as [BPP EQUIPM], 
						 __BPP__.INFO as infro,  __BPP__.conv as conv, 
						 __BPP__.Industrial as industrial, 
                         __BPP__.Title as title, __BPP__.Leased as leased, __BPP__.Boasthouses as boathouses
FROM            prop_links right OUTER JOIN
                         __BPP__ ON prop_links.parent_prop_id = __BPP__.prop_id

GO

