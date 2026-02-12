create view rms_quality_vw as 
select Year = 2015, QualityID, QualityName from ms_res_cost_2015.dbo.Quality with(nolock)
union all
select Year = 2016, QualityID, QualityName from ms_res_cost_2015.dbo.Quality with(nolock)
union all
select Year = 2017, QualityID, QualityName from ms_res_cost_2015.dbo.Quality with(nolock)

GO

