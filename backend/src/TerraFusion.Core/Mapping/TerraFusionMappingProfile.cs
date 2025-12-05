using AutoMapper;
using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;
using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.Core.Mapping;

public class TerraFusionMappingProfile : Profile
{
    public TerraFusionMappingProfile()
    {
        // Module mappings
        CreateMap<Module, ModuleDto>();
        CreateMap<CreateModuleDto, Module>();
        CreateMap<UpdateModuleDto, Module>();

        // Property mappings  
        CreateMap<Property, PropertyDto>()
            .ForMember(dest => dest.CountyName, opt => opt.MapFrom(src => src.County.Name));
        CreateMap<ImportPropertyDto, Property>();
        CreateMap<PropertyCreateRequest, Property>();

        // Valuation mappings
        CreateMap<Valuation, ValuationDto>()
            .ForMember(dest => dest.AIModelName, opt => opt.MapFrom(src => src.AIModel.Name));
        CreateMap<CreateValuationDto, Valuation>();
        
        // AI Model mappings
        CreateMap<AIModel, AIModelDto>();

        // Cost Matrix mappings
        CreateMap<CostMatrix, CostMatrixDto>();
    }
}
