create view __PP_seg_PP_desc_appr_year as

select * from 

(SELECT  prop_id,

pp_description,
    [prop_val_yr],

      [pp_subseg_val]

  FROM [pacs_oltp].[dbo].pers_prop_seg pps
where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum(pp_subseg_val)
  for pp_description
  in ([BUSINESS EQUIPMENT]
,[SUPPLIES -TOOLS]
,[INFORMATION ONLY]
,[LEASED]
,[BPP EQUPMEMT]
,[IMFORMATION ONLY]
,[INDUSTRIAL M&E]
,[BUSINESBPS EQUIPMENT]
,[BPP EQUIPMENT]
,[BUSINESS EQUIPMEBPNT]
,[AG MACHINER126792Y & EQUIPMENT]
,[B]
,[BUSINESS PERSONAL PROPERTY]
,[SUPPLIES MONTHLY AVG]

,[BUSISNESS EQUIPMENT]
,[BPP EQUIPTMENT]
,[BPP EQUPIMENT]
,[BPP EQUIPIMENT]
,[AGA MACHINERY & EQUIPMENT]
,[BUSINESS EQUI0PMENT]
,[1+]
,[SU]
,[BPP EQUIMPMENT]
,[AG MACHINERY & EQUIPMENT]
,[TITLE PLANTS]
,[BP]
,[06.5]
,[BPP EQUIMENT]
,[SUPPLIES - SPARE PARTS]
,[Conversion type code]
,[BPP EQUIPMENT0]
,[S]
,[SUPPLIES - FUEL]
,[BPP EQUPMENT]
,[AG M&E]
,[SUPPLIES]
,[INFORMATION]
,[BOATHOUSES])) as pivottable

GO

