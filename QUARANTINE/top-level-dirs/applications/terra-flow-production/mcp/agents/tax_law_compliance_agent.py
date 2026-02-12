"""
Tax Law Compliance Agent for Benton County GeoAssessmentPro

This specialized agent focuses on ensuring compliance with Washington State
property tax laws, regulations, and assessment standards. It provides guidance
on exemptions, special valuations, and regulatory requirements affecting
property assessments in Benton County.

Key capabilities:
- Washington State property tax law knowledge base
- Exemption eligibility analysis and documentation
- Legislative update monitoring and compliance checks
- Appeal support with regulatory documentation
- Compliance documentation generation
"""

import logging
import datetime
import json
from typing import Dict, List, Any, Optional, Union, Tuple
from sqlalchemy import text

from app import db
from mcp.agents.base_agent import BaseAgent

# Configure logging
logger = logging.getLogger(__name__)

class TaxLawComplianceAgent(BaseAgent):
    """
    Agent specializing in Washington State tax law compliance for property assessment.
    
    This agent ensures that assessment practices align with Washington State
    laws and regulations, providing authoritative guidance on tax exemptions,
    special valuations, and compliance requirements.
    """
    
    def __init__(self):
        """Initialize the Tax Law Compliance Agent"""
        super().__init__("tax_law_compliance")
        
        # Register capabilities
        self.update_capabilities([
            "wa_state_compliance_check",
            "tax_exemption_analysis",
            "legislative_update_monitoring",
            "compliance_documentation",
            "appeal_support",
            "regulation_lookup",
            "special_valuation_guidance",
            "audit_preparation"
        ])
        
        # Washington tax regulations database
        self.tax_regulations = self._load_wa_tax_regulations()
        
        # Exemption types database
        self.exemption_types = self._load_exemption_definitions()
        
        # Legislative update tracking
        self.legislation_updates = {
            "last_sync": None,
            "pending_changes": [],
            "implemented_changes": []
        }
        
        # Special property classifications under Washington law
        self.special_classifications = {
            "open_space": {
                "rcw": "84.34",
                "valuation_method": "current_use",
                "eligibility_criteria": ["minimum_acres", "qualifying_use"]
            },
            "timber_land": {
                "rcw": "84.34",
                "valuation_method": "current_use",
                "eligibility_criteria": ["forest_management_plan", "minimum_acres"]
            },
            "historic_property": {
                "rcw": "84.26",
                "valuation_method": "special_valuation",
                "eligibility_criteria": ["historic_designation", "rehabilitation"]
            },
            "senior_disabled_exemption": {
                "rcw": "84.36.381",
                "valuation_method": "partial_exemption",
                "eligibility_criteria": ["age_or_disability", "income_threshold", "primary_residence"]
            }
        }
        
        # Initialize knowledge base with Washington tax laws
        self._initialize_knowledge_base()
        
        logger.info(f"Tax Law Compliance Agent initialized with {len(self.capabilities)} capabilities")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process tax law compliance tasks
        
        Args:
            task_data: Task parameters including task_type and specific task parameters
            
        Returns:
            Task result with compliance analysis
        """
        task_type = task_data.get("task_type")
        
        if not task_type:
            return {"status": "error", "message": "No task type specified"}
        
        # Task routing based on type
        if task_type == "wa_state_compliance_check":
            return self._process_compliance_check(task_data)
        elif task_type == "tax_exemption_analysis":
            return self._process_exemption_analysis(task_data)
        elif task_type == "legislative_update_monitoring":
            return self._process_legislative_updates(task_data)
        elif task_type == "compliance_documentation":
            return self._process_compliance_documentation(task_data)
        elif task_type == "appeal_support":
            return self._process_appeal_support(task_data)
        elif task_type == "regulation_lookup":
            return self._process_regulation_lookup(task_data)
        elif task_type == "special_valuation_guidance":
            return self._process_special_valuation(task_data)
        elif task_type == "audit_preparation":
            return self._process_audit_preparation(task_data)
        elif task_type == "handle_query_message":
            return self._handle_query_message(task_data)
        else:
            return {
                "status": "error", 
                "message": f"Unsupported task type: {task_type}",
                "supported_tasks": self.capabilities
            }
    
    # Core compliance services
    
    def _process_compliance_check(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check compliance with Washington State property tax laws
        
        Args:
            task_data: Parameters including property_id or assessment_data
            
        Returns:
            Compliance check results with issues and recommendations
        """
        property_id = task_data.get("property_id")
        assessment_data = task_data.get("assessment_data", {})
        
        try:
            # Get property data if property_id is provided
            property_data = {}
            if property_id:
                property_data = self._get_property_by_id(property_id)
                if not property_data:
                    return {
                        "status": "error",
                        "message": f"Property not found: {property_id}"
                    }
            else:
                # Use provided assessment data
                property_data = assessment_data
                if not property_data:
                    return {
                        "status": "error",
                        "message": "No assessment data provided"
                    }
            
            # Check compliance with various Washington state requirements
            compliance_checks = {
                "assessment_ratio": self._check_assessment_ratio(property_data),
                "classification": self._check_property_classification(property_data),
                "exemptions": self._check_exemption_compliance(property_data),
                "annual_revaluation": self._check_annual_revaluation_compliance(property_data),
                "documentation": self._check_documentation_compliance(property_data),
                "notification": self._check_notification_compliance(property_data)
            }
            
            # Identify issues and recommendations
            issues = []
            recommendations = []
            
            for check_name, check_result in compliance_checks.items():
                if not check_result.get("compliant", True):
                    issues.append({
                        "issue": check_result.get("issue"),
                        "severity": check_result.get("severity", "medium"),
                        "regulation": check_result.get("regulation")
                    })
                    
                    if "recommendation" in check_result:
                        recommendations.append({
                            "for_issue": check_result.get("issue"),
                            "action": check_result.get("recommendation"),
                            "priority": check_result.get("priority", "medium")
                        })
            
            # Overall compliance status
            overall_compliant = all(check.get("compliant", True) for check in compliance_checks.values())
            
            return {
                "status": "success",
                "property_id": property_id,
                "compliant": overall_compliant,
                "compliance_checks": compliance_checks,
                "issues": issues,
                "recommendations": recommendations,
                "check_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in compliance check: {str(e)}")
            return {
                "status": "error",
                "message": f"Compliance check failed: {str(e)}"
            }
    
    def _process_exemption_analysis(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze property for potential tax exemptions
        
        Args:
            task_data: Parameters including property_id or property_data
            
        Returns:
            Exemption analysis with eligible exemptions and requirements
        """
        property_id = task_data.get("property_id")
        property_data = task_data.get("property_data", {})
        
        try:
            # Get property data if property_id is provided
            if property_id and not property_data:
                property_data = self._get_property_by_id(property_id)
                if not property_data:
                    return {
                        "status": "error",
                        "message": f"Property not found: {property_id}"
                    }
            
            if not property_data:
                return {
                    "status": "error",
                    "message": "No property data provided"
                }
            
            # Analyze potential exemptions
            eligible_exemptions = []
            potential_exemptions = []
            
            for exemption_type, definition in self.exemption_types.items():
                # Check if property meets all required criteria
                meets_criteria = all(
                    self._check_exemption_criterion(property_data, criterion)
                    for criterion in definition.get("required_criteria", [])
                )
                
                # Check if property meets some criteria (potential eligibility)
                meets_some_criteria = any(
                    self._check_exemption_criterion(property_data, criterion)
                    for criterion in definition.get("required_criteria", [])
                )
                
                if meets_criteria:
                    eligible_exemptions.append({
                        "exemption_type": exemption_type,
                        "description": definition.get("description", ""),
                        "rcw": definition.get("rcw", ""),
                        "estimated_impact": self._estimate_exemption_impact(property_data, definition),
                        "required_documentation": definition.get("required_documentation", []),
                        "renewal_requirements": definition.get("renewal_requirements", {})
                    })
                elif meets_some_criteria:
                    # Property meets some but not all criteria
                    missing_criteria = [
                        criterion for criterion in definition.get("required_criteria", [])
                        if not self._check_exemption_criterion(property_data, criterion)
                    ]
                    
                    potential_exemptions.append({
                        "exemption_type": exemption_type,
                        "description": definition.get("description", ""),
                        "rcw": definition.get("rcw", ""),
                        "missing_criteria": missing_criteria,
                        "estimated_impact": self._estimate_exemption_impact(property_data, definition),
                        "required_documentation": definition.get("required_documentation", [])
                    })
            
            # Current exemptions
            current_exemptions = property_data.get("exemptions", [])
            
            return {
                "status": "success",
                "property_id": property_id,
                "current_exemptions": current_exemptions,
                "eligible_exemptions": eligible_exemptions,
                "potential_exemptions": potential_exemptions,
                "analysis_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in exemption analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Exemption analysis failed: {str(e)}"
            }
    
    def _process_legislative_updates(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Monitor and report on legislative updates affecting property assessment
        
        Args:
            task_data: Parameters with sync options
            
        Returns:
            Legislative updates with impact analysis
        """
        force_sync = task_data.get("force_sync", False)
        
        try:
            # Check if we need to sync
            current_time = datetime.datetime.now()
            last_sync = self.legislation_updates.get("last_sync")
            
            needs_sync = force_sync or not last_sync or (
                current_time - last_sync > datetime.timedelta(days=1)
            )
            
            if needs_sync:
                # In a real implementation, this would fetch updates from an API
                # For now, we'll simulate with predefined updates
                self._sync_legislative_updates()
            
            # Filter updates by impact level if requested
            min_impact = task_data.get("min_impact")
            
            if min_impact:
                pending_changes = [
                    update for update in self.legislation_updates["pending_changes"]
                    if update.get("impact_level", "low") in self._get_impact_levels(min_impact)
                ]
            else:
                pending_changes = self.legislation_updates["pending_changes"]
            
            return {
                "status": "success",
                "last_sync": self.legislation_updates["last_sync"].isoformat() if self.legislation_updates["last_sync"] else None,
                "pending_changes": pending_changes,
                "implemented_changes": self.legislation_updates["implemented_changes"],
                "report_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in legislative updates: {str(e)}")
            return {
                "status": "error",
                "message": f"Legislative update monitoring failed: {str(e)}"
            }
    
    def _process_compliance_documentation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate compliance documentation for a specific property or assessment
        
        Args:
            task_data: Parameters including property_id or assessment_data
            
        Returns:
            Compliance documentation with regulatory references
        """
        property_id = task_data.get("property_id")
        assessment_data = task_data.get("assessment_data", {})
        doc_type = task_data.get("doc_type", "standard")  # standard, detailed, audit
        
        try:
            # Get property data if property_id is provided
            property_data = {}
            if property_id:
                property_data = self._get_property_by_id(property_id)
                if not property_data:
                    return {
                        "status": "error",
                        "message": f"Property not found: {property_id}"
                    }
            else:
                # Use provided assessment data
                property_data = assessment_data
                if not property_data:
                    return {
                        "status": "error",
                        "message": "No assessment data provided"
                    }
            
            # First check compliance
            compliance_result = self._process_compliance_check({
                "assessment_data": property_data
            })
            
            if compliance_result.get("status") != "success":
                return compliance_result
            
            # Generate documentation based on the compliance check
            documentation = self._generate_compliance_documentation(
                property_data, 
                compliance_result,
                doc_type
            )
            
            return {
                "status": "success",
                "property_id": property_id,
                "document_type": doc_type,
                "documentation": documentation,
                "generation_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in compliance documentation: {str(e)}")
            return {
                "status": "error",
                "message": f"Compliance documentation generation failed: {str(e)}"
            }
    
    def _process_appeal_support(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate appeal support documentation with regulatory references
        
        Args:
            task_data: Parameters including property_id and appeal_basis
            
        Returns:
            Appeal support documentation with legal references
        """
        property_id = task_data.get("property_id")
        appeal_basis = task_data.get("appeal_basis", "general")  # general, valuation, exemption, etc.
        
        try:
            # Get property data
            property_data = self._get_property_by_id(property_id)
            if not property_data:
                return {
                    "status": "error",
                    "message": f"Property not found: {property_id}"
                }
            
            # Generate appeal support based on the appeal basis
            if appeal_basis == "valuation":
                support_doc = self._generate_valuation_appeal_support(property_data)
            elif appeal_basis == "exemption":
                support_doc = self._generate_exemption_appeal_support(property_data)
            elif appeal_basis == "classification":
                support_doc = self._generate_classification_appeal_support(property_data)
            else:
                # General appeal support
                support_doc = self._generate_general_appeal_support(property_data)
            
            return {
                "status": "success",
                "property_id": property_id,
                "appeal_basis": appeal_basis,
                "appeal_support": support_doc,
                "generation_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in appeal support: {str(e)}")
            return {
                "status": "error",
                "message": f"Appeal support generation failed: {str(e)}"
            }
    
    def _process_regulation_lookup(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Look up specific regulations relevant to assessment situations
        
        Args:
            task_data: Parameters including regulation_type or search_terms
            
        Returns:
            Relevant regulations with interpretations
        """
        regulation_type = task_data.get("regulation_type")
        search_terms = task_data.get("search_terms", [])
        rcw_reference = task_data.get("rcw_reference")
        
        try:
            matching_regulations = []
            
            if rcw_reference:
                # Direct lookup by RCW reference
                matching_regulations = self._lookup_rcw_reference(rcw_reference)
            elif regulation_type:
                # Lookup by regulation type
                matching_regulations = self._lookup_regulation_type(regulation_type)
            elif search_terms:
                # Search by terms
                matching_regulations = self._search_regulations(search_terms)
            else:
                return {
                    "status": "error",
                    "message": "No search criteria provided"
                }
            
            return {
                "status": "success",
                "search_criteria": {
                    "regulation_type": regulation_type,
                    "search_terms": search_terms,
                    "rcw_reference": rcw_reference
                },
                "matching_regulations": matching_regulations,
                "lookup_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in regulation lookup: {str(e)}")
            return {
                "status": "error",
                "message": f"Regulation lookup failed: {str(e)}"
            }
    
    def _process_special_valuation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide guidance on special valuation situations under Washington law
        
        Args:
            task_data: Parameters including property_id and special_type
            
        Returns:
            Special valuation guidance with regulatory basis
        """
        property_id = task_data.get("property_id")
        special_type = task_data.get("special_type")  # open_space, timber_land, historic_property, etc.
        
        try:
            if not special_type or special_type not in self.special_classifications:
                return {
                    "status": "error",
                    "message": f"Unknown special valuation type: {special_type}",
                    "supported_types": list(self.special_classifications.keys())
                }
            
            # Get property data if property_id is provided
            property_data = {}
            if property_id:
                property_data = self._get_property_by_id(property_id)
                if not property_data:
                    return {
                        "status": "error",
                        "message": f"Property not found: {property_id}"
                    }
            
            # Get special classification definition
            classification = self.special_classifications[special_type]
            
            # Check eligibility if property data is available
            eligibility = None
            if property_data:
                eligibility = self._check_special_classification_eligibility(
                    property_data, 
                    special_type, 
                    classification
                )
            
            # Get valuation guidance
            guidance = self._get_special_valuation_guidance(special_type, classification)
            
            return {
                "status": "success",
                "property_id": property_id,
                "special_type": special_type,
                "rcw_reference": classification.get("rcw"),
                "valuation_method": classification.get("valuation_method"),
                "eligibility": eligibility,
                "guidance": guidance,
                "generation_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in special valuation guidance: {str(e)}")
            return {
                "status": "error",
                "message": f"Special valuation guidance failed: {str(e)}"
            }
    
    def _process_audit_preparation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare documentation for state audits of assessment practices
        
        Args:
            task_data: Parameters including audit_type and assessment_year
            
        Returns:
            Audit preparation with required documentation and compliance status
        """
        audit_type = task_data.get("audit_type", "general")  # general, ratio_study, procedural
        assessment_year = task_data.get("assessment_year", datetime.datetime.now().year)
        
        try:
            # Determine required documentation
            required_docs = self._get_audit_documentation_requirements(audit_type)
            
            # Check documentation availability
            available_docs = self._check_document_availability(audit_type, assessment_year)
            
            # Identify missing documentation
            missing_docs = [
                doc for doc in required_docs
                if doc.get("id") not in [avail.get("id") for avail in available_docs]
            ]
            
            # Generate recommendations for compliance
            recommendations = self._generate_audit_recommendations(missing_docs)
            
            # Overall compliance assessment
            compliance_level = "fully_compliant" if not missing_docs else (
                "partially_compliant" if len(missing_docs) < len(required_docs) / 2 
                else "significant_gaps"
            )
            
            return {
                "status": "success",
                "audit_type": audit_type,
                "assessment_year": assessment_year,
                "compliance_level": compliance_level,
                "required_documentation": required_docs,
                "available_documentation": available_docs,
                "missing_documentation": missing_docs,
                "recommendations": recommendations,
                "preparation_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in audit preparation: {str(e)}")
            return {
                "status": "error",
                "message": f"Audit preparation failed: {str(e)}"
            }
    
    # Agent-to-Agent Protocol Message Handlers
    
    def _handle_query_message(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle query messages from other agents
        
        Args:
            task_data: Message data including query content
            
        Returns:
            Response to the query
        """
        message = task_data.get("message", {})
        content = message.get("content", {})
        query = content.get("query", "")
        
        # Process different query types
        if "exemption" in query.lower():
            property_id = content.get("context", {}).get("property_id")
            
            # Use exemption analysis capability to answer query
            analysis_result = self._process_exemption_analysis({
                "property_id": property_id
            })
            
            # Format response for query
            return {
                "message_type": "inform",
                "content": {
                    "information": analysis_result,
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
            
        elif "regulation" in query.lower() or "law" in query.lower():
            search_terms = content.get("context", {}).get("search_terms", [])
            rcw_reference = content.get("context", {}).get("rcw_reference")
            
            # Use regulation lookup capability to answer query
            lookup_result = self._process_regulation_lookup({
                "search_terms": search_terms,
                "rcw_reference": rcw_reference
            })
            
            # Format response for query
            return {
                "message_type": "inform",
                "content": {
                    "information": lookup_result,
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
            
        elif "special valuation" in query.lower() or "classification" in query.lower():
            property_id = content.get("context", {}).get("property_id")
            special_type = content.get("context", {}).get("special_type")
            
            # Use special valuation guidance capability to answer query
            guidance_result = self._process_special_valuation({
                "property_id": property_id,
                "special_type": special_type
            })
            
            # Format response for query
            return {
                "message_type": "inform",
                "content": {
                    "information": guidance_result,
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
            
        else:
            # Unknown query type
            return {
                "message_type": "inform",
                "content": {
                    "information": {
                        "status": "warning",
                        "message": f"Query type not recognized: {query}",
                        "supported_queries": [
                            "exemption", 
                            "regulation or law", 
                            "special valuation or classification"
                        ]
                    },
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
    
    # Helper methods
    
    def _get_property_by_id(self, property_id: str) -> Dict[str, Any]:
        """
        Get property data by ID
        
        Args:
            property_id: Property identifier
            
        Returns:
            Property data dictionary
        """
        # In a real implementation, this would query the database
        # For now, returning an empty dictionary as a placeholder
        return {}
    
    def _load_wa_tax_regulations(self) -> Dict[str, Any]:
        """
        Load Washington State tax regulations database
        
        Returns:
            Regulations database
        """
        # In a real implementation, this would load regulations from a database or file
        # Mock structure for development
        return {
            "84.40.030": {
                "title": "Basis of valuation, assessment, appraisal—One hundred percent of true and fair value—Exceptions",
                "summary": "All property shall be valued at 100% of its true and fair value in money and assessed on the same basis.",
                "url": "https://app.leg.wa.gov/rcw/default.aspx?cite=84.40.030",
                "relevance": ["assessment_ratio", "valuation_standard"]
            },
            "84.40.0301": {
                "title": "Determination of value by public official—Review—Revaluation",
                "summary": "Criteria for determining true and fair value, and requirements for revaluation cycles.",
                "url": "https://app.leg.wa.gov/rcw/default.aspx?cite=84.40.0301",
                "relevance": ["valuation_standard", "revaluation_cycles"]
            },
            "84.36": {
                "title": "Exemptions",
                "summary": "Property tax exemptions for various property types and owners.",
                "url": "https://app.leg.wa.gov/rcw/default.aspx?cite=84.36",
                "relevance": ["exemptions"]
            },
            "84.34": {
                "title": "Open Space, Agricultural, Timber Lands—Current Use—Conservation Futures",
                "summary": "Current use valuation for open space, farm and agricultural land, and timber land.",
                "url": "https://app.leg.wa.gov/rcw/default.aspx?cite=84.34",
                "relevance": ["current_use", "special_valuation"]
            }
        }
    
    def _load_exemption_definitions(self) -> Dict[str, Any]:
        """
        Load exemption definitions for Washington State
        
        Returns:
            Exemption definitions dictionary
        """
        # In a real implementation, this would load exemption definitions from a database or file
        # Mock structure for development
        return {
            "senior_disabled_exemption": {
                "description": "Property tax exemption for senior citizens and disabled persons",
                "rcw": "84.36.381",
                "required_criteria": [
                    {"type": "age", "value": 61, "operator": ">="},
                    {"type": "income", "value": 40000, "operator": "<="},
                    {"type": "primary_residence", "value": True, "operator": "=="}
                ],
                "required_documentation": [
                    "Age verification", "Income documentation", "Ownership proof"
                ],
                "renewal_requirements": {
                    "frequency": "every_3_years",
                    "documents": ["Updated income verification"]
                }
            },
            "nonprofit_charitable_exemption": {
                "description": "Property tax exemption for nonprofit charitable organizations",
                "rcw": "84.36.040",
                "required_criteria": [
                    {"type": "ownership_type", "value": "nonprofit", "operator": "=="},
                    {"type": "use", "value": "charitable", "operator": "=="}
                ],
                "required_documentation": [
                    "501(c)(3) determination letter", "Articles of incorporation", "Usage declaration"
                ],
                "renewal_requirements": {
                    "frequency": "annual",
                    "documents": ["Updated usage declaration"]
                }
            },
            "historic_property_special_valuation": {
                "description": "Special valuation for historic properties",
                "rcw": "84.26",
                "required_criteria": [
                    {"type": "historic_designation", "value": True, "operator": "=="},
                    {"type": "rehabilitation_cost", "value": 0, "operator": ">"}
                ],
                "required_documentation": [
                    "Historic designation certification", "Rehabilitation cost documentation"
                ],
                "renewal_requirements": {
                    "frequency": "10_years",
                    "documents": ["Continued compliance verification"]
                }
            }
        }
    
    def _check_assessment_ratio(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if property is assessed at required ratio per Washington State RCW 84.40.030
        
        Washington requires all property to be valued at 100% of its true and fair value
        in money (market value). This implements a comprehensive check of the assessment
        ratio including property type-specific considerations.
        
        Args:
            property_data: Property data to check
            
        Returns:
            Compliance check result with detailed analysis
        """
        # Washington requires 100% true and fair value assessment
        required_ratio = 1.0
        
        assessed_value = property_data.get("assessed_value", 0)
        market_value = property_data.get("market_value", 0)
        property_type = property_data.get("property_type", "unknown")
        valuation_method = property_data.get("valuation_method", "unknown")
        assessment_year = property_data.get("assessment_year", datetime.datetime.now().year)
        
        # Additional checks for data completeness
        if market_value == 0:
            # Can't determine ratio - critical issue
            return {
                "compliant": False,
                "issue": "Cannot determine assessment ratio due to missing market value",
                "severity": "high",
                "regulation": "RCW 84.40.030",
                "recommendation": "Establish market value for property",
                "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.40.030",
                "priority": "high"
            }
        
        actual_ratio = assessed_value / market_value
        
        # Apply appropriate tolerance based on property type
        # Residential properties need tighter tolerance than commercial or agricultural
        if property_type.lower() in ["residential", "single_family", "multi_family"]:
            tolerance = 0.03  # 3% tolerance for residential
        elif property_type.lower() in ["commercial", "industrial"]:
            tolerance = 0.05  # 5% tolerance for commercial/industrial
        elif property_type.lower() in ["agricultural", "farm", "timber"]:
            tolerance = 0.07  # 7% tolerance for agricultural/resource lands
        else:
            tolerance = 0.05  # Default tolerance
        
        # Check ratio within tolerance
        if abs(actual_ratio - required_ratio) > tolerance:
            # Check for special valuation methods that might be exempt from standard ratio
            if valuation_method.lower() in ["current_use", "designated_forest", "open_space"]:
                # Special valuation methods allowed by RCW 84.34
                return {
                    "compliant": True,
                    "actual_ratio": actual_ratio,
                    "required_ratio": required_ratio,
                    "note": f"Property uses special valuation method: {valuation_method}",
                    "regulation": "RCW 84.34"
                }
            
            # Standard assessment ratio issue
            severity = "high" if abs(actual_ratio - required_ratio) > (2 * tolerance) else "medium"
            
            return {
                "compliant": False,
                "issue": f"Assessment ratio ({actual_ratio:.2f}) does not meet required ratio (1.00 ± {tolerance})",
                "severity": severity,
                "regulation": "RCW 84.40.030",
                "recommendation": "Adjust assessed value to match market value",
                "details": {
                    "assessed_value": assessed_value,
                    "market_value": market_value,
                    "property_type": property_type,
                    "discrepancy_percentage": abs((actual_ratio - required_ratio) * 100),
                    "assessment_year": assessment_year
                },
                "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.40.030",
                "priority": "high"
            }
        
        # Additional check for valuation date compliance
        # Washington requires January 1 valuation date
        valuation_date = property_data.get("valuation_date")
        current_year = datetime.datetime.now().year
        
        if valuation_date:
            try:
                if isinstance(valuation_date, str):
                    valuation_date = datetime.datetime.strptime(valuation_date, "%Y-%m-%d").date()
                
                # Check if valuation is for correct assessment year (Jan 1)
                if valuation_date.year != assessment_year or valuation_date.month != 1 or valuation_date.day != 1:
                    return {
                        "compliant": False,
                        "actual_ratio": actual_ratio,
                        "required_ratio": required_ratio,
                        "issue": f"Valuation date ({valuation_date}) is not January 1 of assessment year ({assessment_year})",
                        "severity": "medium",
                        "regulation": "RCW 84.40.020",
                        "recommendation": "Update valuation to reflect January 1 value",
                        "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.40.020"
                    }
            except (ValueError, AttributeError):
                # Couldn't parse date or other issue
                pass
        
        # Compliance check passes
        return {
            "compliant": True,
            "actual_ratio": actual_ratio,
            "required_ratio": required_ratio,
            "property_type": property_type,
            "tolerance_applied": tolerance,
            "regulation": "RCW 84.40.030",
            "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.40.030"
        }
    
    def _check_property_classification(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if property classification is correct per Washington State RCW 84.41
        
        Washington requires proper classification of all properties to ensure 
        fair and uniform assessment. This implements comprehensive classification
        checks based on property characteristics as defined in WA statutes.
        
        Args:
            property_data: Property data to check
            
        Returns:
            Compliance check result with detailed classification analysis
        """
        property_class = property_data.get("classification", "unknown")
        current_use = property_data.get("current_use", False)
        land_area = property_data.get("land_area", 0)
        land_area_unit = property_data.get("land_area_unit", "sqft")  # or acres
        building_area = property_data.get("building_area", 0)
        building_type = property_data.get("building_type", "")
        zoning = property_data.get("zoning", "")
        use_code = property_data.get("use_code", "")
        improvements = property_data.get("improvements", [])
        has_residence = property_data.get("has_residence", False)
        agricultural_use = property_data.get("agricultural_use", False)
        timber_use = property_data.get("timber_use", False)
        historic_designation = property_data.get("historic_designation", False)
        
        # Convert acres to square feet if needed
        if land_area_unit.lower() == "acres":
            land_area_sqft = land_area * 43560
        else:
            land_area_sqft = land_area
        
        # Check if current classification appears to match the property characteristics
        expected_classification = None
        classification_issues = []
        
        # Residential checks
        if building_type and building_type.lower() in ["single_family", "duplex", "triplex", "apartment"]:
            if "residential" not in property_class.lower():
                classification_issues.append({
                    "issue": f"Building type ({building_type}) indicates residential use, but classification is {property_class}",
                    "expected": "Residential"
                })
                expected_classification = "Residential"
        
        # Commercial checks
        if building_type and building_type.lower() in ["office", "retail", "warehouse", "hotel", "restaurant"]:
            if "commercial" not in property_class.lower():
                classification_issues.append({
                    "issue": f"Building type ({building_type}) indicates commercial use, but classification is {property_class}",
                    "expected": "Commercial"
                })
                expected_classification = "Commercial"
                
        # Industrial checks
        if building_type and building_type.lower() in ["manufacturing", "processing", "industrial"]:
            if "industrial" not in property_class.lower():
                classification_issues.append({
                    "issue": f"Building type ({building_type}) indicates industrial use, but classification is {property_class}",
                    "expected": "Industrial"
                })
                expected_classification = "Industrial"
                
        # Agricultural checks
        if agricultural_use or (current_use and "farm" in property_class.lower()):
            # Check that land area meets minimum for agricultural classification
            min_farm_area_sqft = 5 * 43560  # 5 acres in sqft
            
            if land_area_sqft < min_farm_area_sqft and "agricultural" in property_class.lower():
                classification_issues.append({
                    "issue": f"Property classified as agricultural but does not meet minimum size requirement (5 acres)",
                    "expected": "Non-agricultural",
                    "details": {
                        "actual_size": f"{land_area} {land_area_unit}",
                        "minimum_size": "5 acres",
                        "regulation": "RCW 84.34.020"
                    }
                })
            elif land_area_sqft >= min_farm_area_sqft and agricultural_use and "agricultural" not in property_class.lower():
                classification_issues.append({
                    "issue": f"Property appears to be agricultural but is classified as {property_class}",
                    "expected": "Agricultural",
                    "details": {
                        "actual_size": f"{land_area} {land_area_unit}",
                        "minimum_size": "5 acres",
                        "regulation": "RCW 84.34.020"
                    }
                })
                expected_classification = "Agricultural"
        
        # Open space checks
        if current_use and "open" in property_class.lower():
            # Verify open space has been approved under RCW 84.34
            has_open_space_approval = property_data.get("open_space_approval", False)
            
            if not has_open_space_approval:
                classification_issues.append({
                    "issue": "Property classified as open space but lacks required approval",
                    "expected": "Standard classification unless approval documented",
                    "regulation": "RCW 84.34.037"
                })
        
        # Historic property checks
        if historic_designation:
            has_historic_approval = property_data.get("historic_approval", False)
            
            if not has_historic_approval and "historic" in property_class.lower():
                classification_issues.append({
                    "issue": "Property has historic designation but lacks formal historic approval required for special valuation",
                    "regulation": "RCW 84.26.040"
                })
        
        # Timber land checks
        if timber_use or "timber" in property_class.lower():
            has_forest_mgmt_plan = property_data.get("forest_management_plan", False)
            min_timber_area_sqft = 5 * 43560  # 5 acres
            
            if "timber" in property_class.lower() and not has_forest_mgmt_plan:
                classification_issues.append({
                    "issue": "Property classified as timber land but lacks required forest management plan",
                    "regulation": "RCW 84.34.041"
                })
                
            if land_area_sqft < min_timber_area_sqft and "timber" in property_class.lower():
                classification_issues.append({
                    "issue": f"Property classified as timber land but does not meet minimum size requirement (5 acres)",
                    "expected": "Non-timber", 
                    "regulation": "RCW 84.34.020"
                })
        
        # Check if exempt properties are properly classified
        is_exempt = property_data.get("exempt", False)
        exempt_reason = property_data.get("exempt_reason", "")
        
        if is_exempt and "exempt" not in property_class.lower():
            classification_issues.append({
                "issue": f"Property is exempt ({exempt_reason}) but not classified as exempt",
                "expected": "Exempt",
                "regulation": "RCW 84.36"
            })
        
        # Result construction
        if classification_issues:
            return {
                "compliant": False,
                "classification": property_class,
                "expected_classification": expected_classification,
                "issues": classification_issues,
                "severity": "medium" if len(classification_issues) > 1 else "low",
                "regulation": "RCW 84.41.030",
                "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.41.030",
                "recommendation": f"Review property characteristics and update classification to {expected_classification if expected_classification else 'appropriate category'}"
            }
        
        # If we reach this point, no classification issues found
        return {
            "compliant": True,
            "classification": property_class,
            "property_characteristics": {
                "land_area": land_area,
                "land_area_unit": land_area_unit,
                "building_type": building_type,
                "current_use": current_use
            },
            "regulation": "RCW 84.41.030",
            "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.41.030"
        }
    
    def _check_exemption_compliance(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if exemptions are properly applied per Washington State regulations
        
        Washington has numerous property tax exemptions with specific eligibility 
        requirements codified in RCW 84.36. This method validates that exemptions
        are properly applied according to state law and all required documentation
        is present.
        
        Args:
            property_data: Property data to check
            
        Returns:
            Compliance check result with detailed analysis of exemption validity
        """
        exemptions = property_data.get("exemptions", [])
        if not exemptions:
            # No exemptions to check
            return {
                "compliant": True,
                "exemptions": [],
                "note": "No exemptions applied to property"
            }
        
        # Track issues with exemptions
        exemption_issues = []
        valid_exemptions = []
        
        # Common Washington state exemption types with requirements
        wa_exemption_types = {
            "senior_disabled": {
                "rcw": "84.36.381",
                "requirements": [
                    {"type": "owner_age", "operator": ">=", "value": 61},
                    {"type": "income", "operator": "<=", "value": 40000},  # Updated threshold
                    {"type": "primary_residence", "operator": "==", "value": True},
                    {"type": "ownership_years", "operator": ">=", "value": 1}
                ],
                "documentation": ["income_verification", "age_verification", "residence_declaration"]
            },
            "nonprofit_religious": {
                "rcw": "84.36.020",
                "requirements": [
                    {"type": "ownership", "operator": "==", "value": "religious_org"},
                    {"type": "used_for_religious_purposes", "operator": "==", "value": True}
                ],
                "documentation": ["nonprofit_status", "use_verification"]
            },
            "nonprofit_educational": {
                "rcw": "84.36.050",
                "requirements": [
                    {"type": "ownership", "operator": "==", "value": "educational_org"},
                    {"type": "used_for_education", "operator": "==", "value": True}
                ],
                "documentation": ["nonprofit_status", "use_verification"]
            },
            "government_property": {
                "rcw": "84.36.010",
                "requirements": [
                    {"type": "ownership", "operator": "in", "value": ["federal", "state", "county", "city", "tribal"]}
                ],
                "documentation": ["ownership_verification"]
            },
            "agricultural_equipment": {
                "rcw": "84.36.630",
                "requirements": [
                    {"type": "property_type", "operator": "==", "value": "farm_equipment"},
                    {"type": "used_for_farming", "operator": "==", "value": True}
                ],
                "documentation": ["equipment_inventory", "farming_declaration"]
            },
            "historical_property": {
                "rcw": "84.26",
                "requirements": [
                    {"type": "historic_designation", "operator": "==", "value": True},
                    {"type": "historic_preservation_plan", "operator": "==", "value": True}
                ],
                "documentation": ["historic_designation_certificate", "preservation_agreement"]
            }
        }
        
        # Check each exemption on the property
        for exemption in exemptions:
            exemption_type = exemption.get("type", "")
            exemption_year = exemption.get("year", datetime.datetime.now().year)
            exemption_amount = exemption.get("amount", 0)
            exemption_documents = exemption.get("documents", [])
            
            # Skip if no type defined
            if not exemption_type:
                exemption_issues.append({
                    "exemption": exemption,
                    "issue": "Exemption type not specified",
                    "severity": "high"
                })
                continue
                
            # Check if this is a recognized Washington exemption type
            wa_exemption = wa_exemption_types.get(exemption_type)
            if not wa_exemption:
                # Not a standard WA exemption, note as warning
                exemption_issues.append({
                    "exemption": exemption,
                    "issue": f"Non-standard exemption type: {exemption_type}",
                    "severity": "medium",
                    "recommendation": "Verify exemption is valid under Washington law"
                })
                continue
                
            # Check requirements
            requirements_met = True
            missing_requirements = []
            
            for requirement in wa_exemption.get("requirements", []):
                if not self._check_exemption_criterion(property_data, requirement):
                    requirements_met = False
                    missing_requirements.append(requirement)
            
            # Check documentation
            required_docs = wa_exemption.get("documentation", [])
            missing_docs = [doc for doc in required_docs if doc not in exemption_documents]
            
            # Evaluate exemption validity
            if not requirements_met or missing_docs:
                issue_details = {
                    "exemption_type": exemption_type,
                    "rcw": wa_exemption.get("rcw"),
                    "missing_requirements": missing_requirements if missing_requirements else None,
                    "missing_documentation": missing_docs if missing_docs else None,
                    "severity": "high" if not requirements_met else "medium"
                }
                
                exemption_issues.append({
                    "exemption": exemption,
                    "issue": "Exemption requirements not fully met",
                    "details": issue_details,
                    "recommendation": "Review exemption eligibility and documentation"
                })
            else:
                # Exemption appears valid
                valid_exemptions.append({
                    "exemption_type": exemption_type,
                    "exemption_amount": exemption_amount,
                    "exemption_year": exemption_year,
                    "rcw": wa_exemption.get("rcw")
                })
        
        # Overall exemption compliance status
        if exemption_issues:
            return {
                "compliant": False,
                "exemptions": exemptions,
                "valid_exemptions": valid_exemptions,
                "issues": exemption_issues,
                "severity": "high" if any(issue.get("severity") == "high" for issue in exemption_issues) else "medium",
                "regulation": "RCW 84.36",
                "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.36",
                "recommendation": "Review and correct exemption issues identified"
            }
        
        # All exemptions valid
        return {
            "compliant": True,
            "exemptions": exemptions,
            "valid_exemptions": valid_exemptions,
            "regulation": "RCW 84.36",
            "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.36"
        }
    
    def _check_documentation_compliance(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if required documentation is present
        
        Args:
            property_data: Property data to check
            
        Returns:
            Compliance check result
        """
        # In a real implementation, this would check for required assessment documentation
        # Simplified placeholder implementation
        return {
            "compliant": True,
            "documentation": property_data.get("documentation", [])
        }
    
    def _check_annual_revaluation_compliance(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check compliance with Washington State's annual revaluation requirement (RCW 36.21.080)
        
        Washington requires annual revaluation of all property in the county.
        This method checks that properties have been revalued within the required timeframe.
        
        Args:
            property_data: Property data to check
            
        Returns:
            Compliance check result with detailed revaluation analysis
        """
        current_date = datetime.datetime.now().date()
        current_year = current_date.year
        
        # Get last valuation date
        last_valuation_date = property_data.get("last_valuation_date")
        last_valuation_timestamp = property_data.get("last_valuation_timestamp")
        last_inspection_date = property_data.get("last_inspection_date")
        
        # Handle the case where last valuation is stored as string
        if isinstance(last_valuation_date, str):
            try:
                last_valuation_date = datetime.datetime.strptime(
                    last_valuation_date, "%Y-%m-%d"
                ).date()
            except ValueError:
                # Could not parse date, continue with other checks
                last_valuation_date = None
        
        # Try using timestamp if date not available
        if not last_valuation_date and last_valuation_timestamp:
            try:
                if isinstance(last_valuation_timestamp, str):
                    last_valuation_timestamp = float(last_valuation_timestamp)
                last_valuation_date = datetime.datetime.fromtimestamp(
                    last_valuation_timestamp
                ).date()
            except (ValueError, TypeError):
                # Could not convert timestamp
                pass
        
        # Try inspection date if no valuation date
        if not last_valuation_date and last_inspection_date:
            try:
                if isinstance(last_inspection_date, str):
                    last_inspection_date = datetime.datetime.strptime(
                        last_inspection_date, "%Y-%m-%d"
                    ).date()
                # Use inspection date as a proxy for valuation
                last_valuation_date = last_inspection_date
            except ValueError:
                # Could not parse date
                pass
        
        # If we still don't have a valuation date, that's a compliance issue
        if not last_valuation_date:
            return {
                "compliant": False,
                "issue": "No record of property valuation date",
                "severity": "high",
                "regulation": "RCW 36.21.080",
                "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=36.21.080",
                "recommendation": "Schedule property for immediate revaluation",
                "priority": "high"
            }
        
        # Check if valuation is from current assessment year (Jan 1 valuation date)
        assessment_year = property_data.get("assessment_year", current_year)
        
        # Per WA law, properties should be revalued annually
        # For counties on annual revaluation cycles, check that the property was revalued for the current assessment year
        years_since_valuation = assessment_year - last_valuation_date.year
        
        cyclical_revaluation = property_data.get("cyclical_revaluation", False)
        revaluation_cycle = property_data.get("revaluation_cycle", 1)  # Default to annual
        
        # For counties using cyclical revaluation (allowed under certain conditions), 
        # check that the property was revalued within the appropriate cycle
        if cyclical_revaluation:
            if years_since_valuation > revaluation_cycle:
                return {
                    "compliant": False,
                    "issue": f"Property has not been revalued within the {revaluation_cycle}-year cycle",
                    "severity": "high",
                    "last_valuation": last_valuation_date.isoformat(),
                    "assessment_year": assessment_year,
                    "years_since_valuation": years_since_valuation,
                    "revaluation_cycle": revaluation_cycle,
                    "regulation": "RCW 36.21.080",
                    "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=36.21.080",
                    "recommendation": "Schedule property for revaluation immediately",
                    "priority": "high",
                    "details": {
                        "cyclical_revaluation": True,
                        "revaluation_due_year": last_valuation_date.year + revaluation_cycle
                    }
                }
        else:
            # Annual revaluation requirement (standard)
            if years_since_valuation > 1:
                return {
                    "compliant": False,
                    "issue": "Property has not been revalued annually as required",
                    "severity": "high",
                    "last_valuation": last_valuation_date.isoformat(),
                    "assessment_year": assessment_year,
                    "years_since_valuation": years_since_valuation,
                    "regulation": "RCW 36.21.080",
                    "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=36.21.080",
                    "recommendation": "Schedule property for revaluation immediately",
                    "priority": "high"
                }
        
        # Physical inspection compliance (at least once every 6 years) per RCW 84.41.041
        physical_inspection_required = True
        
        if last_inspection_date:
            try:
                if isinstance(last_inspection_date, str):
                    last_inspection_date = datetime.datetime.strptime(
                        last_inspection_date, "%Y-%m-%d"
                    ).date()
                
                years_since_inspection = current_year - last_inspection_date.year
                
                if years_since_inspection > 6:
                    return {
                        "compliant": False,
                        "issue": "Physical inspection has not been conducted within the required 6-year period",
                        "severity": "medium",
                        "last_inspection": last_inspection_date.isoformat(),
                        "years_since_inspection": years_since_inspection,
                        "regulation": "RCW 84.41.041",
                        "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.41.041",
                        "recommendation": "Schedule physical inspection",
                        "priority": "medium"
                    }
            except (ValueError, TypeError):
                # Could not determine inspection date
                return {
                    "compliant": False,
                    "issue": "Cannot determine last physical inspection date",
                    "severity": "medium",
                    "regulation": "RCW 84.41.041",
                    "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.41.041",
                    "recommendation": "Schedule physical inspection and improve record keeping",
                    "priority": "medium"
                }
        else:
            # No record of physical inspection
            return {
                "compliant": False,
                "issue": "No record of physical inspection",
                "severity": "medium",
                "regulation": "RCW 84.41.041",
                "rcw_reference": "https://app.leg.wa.gov/RCW/default.aspx?cite=84.41.041",
                "recommendation": "Schedule physical inspection and improve record keeping",
                "priority": "medium"
            }
        
        # All checks passed
        return {
            "compliant": True,
            "last_valuation": last_valuation_date.isoformat(),
            "last_inspection": last_inspection_date.isoformat() if last_inspection_date else None,
            "assessment_year": assessment_year,
            "years_since_valuation": years_since_valuation,
            "years_since_inspection": current_year - last_inspection_date.year if last_inspection_date else None,
            "regulation": "RCW 36.21.080, RCW 84.41.041",
            "rcw_reference": [
                "https://app.leg.wa.gov/RCW/default.aspx?cite=36.21.080",
                "https://app.leg.wa.gov/RCW/default.aspx?cite=84.41.041"
            ]
        }
    
    def _check_notification_compliance(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if required notifications have been sent
        
        Args:
            property_data: Property data to check
            
        Returns:
            Compliance check result
        """
        # In a real implementation, this would check for required assessment notices
        # Simplified placeholder implementation
        return {
            "compliant": True,
            "notifications": property_data.get("notifications", [])
        }
    
    def _check_exemption_criterion(
        self, 
        property_data: Dict[str, Any], 
        criterion: Dict[str, Any]
    ) -> bool:
        """
        Check if property meets a specific exemption criterion
        
        Args:
            property_data: Property data to check
            criterion: Criterion to check
            
        Returns:
            True if property meets criterion, False otherwise
        """
        # Extract criterion details
        criterion_type = criterion.get("type")
        criterion_value = criterion.get("value")
        criterion_operator = criterion.get("operator")
        
        # Get property value for this criterion type
        property_value = property_data.get(criterion_type)
        
        # If property doesn't have this attribute, criterion is not met
        if property_value is None:
            return False
        
        # Apply operator to compare values
        if criterion_operator == "==":
            return property_value == criterion_value
        elif criterion_operator == "!=":
            return property_value != criterion_value
        elif criterion_operator == ">":
            return property_value > criterion_value
        elif criterion_operator == ">=":
            return property_value >= criterion_value
        elif criterion_operator == "<":
            return property_value < criterion_value
        elif criterion_operator == "<=":
            return property_value <= criterion_value
        elif criterion_operator == "in":
            return property_value in criterion_value
        elif criterion_operator == "contains":
            return criterion_value in property_value
        else:
            # Unknown operator
            return False
    
    def _estimate_exemption_impact(
        self, 
        property_data: Dict[str, Any], 
        exemption_def: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Estimate impact of an exemption on property taxes
        
        Args:
            property_data: Property data
            exemption_def: Exemption definition
            
        Returns:
            Estimated impact
        """
        # In a real implementation, this would calculate tax implications
        # Simplified placeholder implementation
        return {
            "value_reduction": 0,
            "tax_reduction": 0,
            "percentage_reduction": 0
        }
    
    def _sync_legislative_updates(self) -> None:
        """Sync legislative updates from source"""
        
        # In a real implementation, this would connect to an API or legislative source
        # Simplified placeholder implementation
        
        # Mock some recent legislative updates
        sample_updates = [
            {
                "bill_number": "SB 5987",
                "title": "Property Tax Exemption Income Thresholds",
                "summary": "Adjusts income thresholds for senior and disabled exemption program",
                "status": "Enacted",
                "effective_date": "2023-07-01",
                "impact_level": "medium",
                "affected_regulations": ["84.36.381"],
                "implementation_required": True
            },
            {
                "bill_number": "HB 1670",
                "title": "Property Tax Payment Plans",
                "summary": "Authorizes counties to establish payment plans for delinquent property taxes",
                "status": "Enacted",
                "effective_date": "2023-07-01",
                "impact_level": "low",
                "affected_regulations": ["84.56"],
                "implementation_required": True
            }
        ]
        
        # Update our tracking
        self.legislation_updates["last_sync"] = datetime.datetime.now()
        self.legislation_updates["pending_changes"] = sample_updates
    
    def _get_impact_levels(self, min_level: str) -> List[str]:
        """
        Get impact levels at or above the specified minimum
        
        Args:
            min_level: Minimum impact level
            
        Returns:
            List of impact levels
        """
        levels = ["low", "medium", "high", "critical"]
        min_index = levels.index(min_level) if min_level in levels else 0
        return levels[min_index:]
    
    def _generate_compliance_documentation(
        self, 
        property_data: Dict[str, Any],
        compliance_result: Dict[str, Any],
        doc_type: str
    ) -> Dict[str, Any]:
        """
        Generate compliance documentation for a property
        
        Args:
            property_data: Property data
            compliance_result: Compliance check result
            doc_type: Documentation type
            
        Returns:
            Generated documentation
        """
        # In a real implementation, this would generate detailed documentation
        # Simplified placeholder implementation
        return {
            "compliance_statement": "Property assessment complies with Washington State regulations",
            "regulatory_citations": ["RCW 84.40.030", "RCW 84.40.0301"],
            "assessment_details": {
                "assessed_value": property_data.get("assessed_value", 0),
                "assessment_date": property_data.get("assessment_date", datetime.datetime.now().isoformat()),
                "assessment_method": property_data.get("assessment_method", "market")
            },
            "certification": {
                "certified_by": "TaxLawComplianceAgent",
                "certification_date": datetime.datetime.now().isoformat()
            }
        }
    
    def _generate_valuation_appeal_support(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate valuation appeal support
        
        Args:
            property_data: Property data
            
        Returns:
            Appeal support documentation
        """
        # In a real implementation, this would generate detailed appeal documentation
        # Simplified placeholder implementation
        return {
            "appeal_basis": "valuation",
            "regulatory_framework": "RCW 84.48.010",
            "appeal_process": {
                "deadline": "30 days from valuation notice",
                "filing_requirements": ["Written petition", "Supporting evidence"],
                "hearing_process": "County Board of Equalization hearing"
            },
            "legal_standards": {
                "burden_of_proof": "Preponderance of evidence",
                "valuation_standard": "True and fair value"
            },
            "recommended_evidence": [
                "Recent comparable sales",
                "Appraisal report",
                "Evidence of property condition issues"
            ]
        }
    
    def _generate_exemption_appeal_support(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate exemption appeal support
        
        Args:
            property_data: Property data
            
        Returns:
            Appeal support documentation
        """
        # Similar to valuation appeal but focused on exemption issues
        # Simplified placeholder implementation
        return {
            "appeal_basis": "exemption",
            "regulatory_framework": "RCW 84.36",
            "appeal_process": {
                "deadline": "30 days from exemption determination",
                "filing_requirements": ["Written petition", "Exemption eligibility evidence"],
                "hearing_process": "Department of Revenue review"
            },
            "legal_standards": {
                "burden_of_proof": "Preponderance of evidence",
                "exemption_standard": "Strict statutory construction"
            },
            "recommended_evidence": [
                "Ownership documentation",
                "Use verification",
                "Financial records"
            ]
        }
    
    def _generate_classification_appeal_support(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate classification appeal support
        
        Args:
            property_data: Property data
            
        Returns:
            Appeal support documentation
        """
        # Focused on property classification issues
        # Simplified placeholder implementation
        return {
            "appeal_basis": "classification",
            "regulatory_framework": "RCW 84.34",
            "appeal_process": {
                "deadline": "30 days from classification determination",
                "filing_requirements": ["Written petition", "Classification evidence"],
                "hearing_process": "County hearing"
            },
            "legal_standards": {
                "burden_of_proof": "Preponderance of evidence",
                "classification_standard": "Actual use"
            },
            "recommended_evidence": [
                "Land use documentation",
                "Zoning information",
                "Use history"
            ]
        }
    
    def _generate_general_appeal_support(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate general appeal support
        
        Args:
            property_data: Property data
            
        Returns:
            Appeal support documentation
        """
        # General appeal support covering multiple potential issues
        # Simplified placeholder implementation
        return {
            "appeal_basis": "general",
            "regulatory_framework": "RCW 84.48.010",
            "appeal_process": {
                "deadline": "30 days from valuation notice",
                "filing_requirements": ["Written petition", "Supporting evidence"],
                "hearing_process": "County Board of Equalization hearing"
            },
            "legal_standards": {
                "burden_of_proof": "Preponderance of evidence",
                "valuation_standard": "True and fair value"
            },
            "potential_grounds": [
                "Valuation errors",
                "Exemption eligibility",
                "Classification errors",
                "Data errors"
            ],
            "recommended_evidence": [
                "Appraisal report",
                "Comparable sales",
                "Exemption eligibility documentation",
                "Property information corrections"
            ]
        }
    
    def _lookup_rcw_reference(self, rcw_reference: str) -> List[Dict[str, Any]]:
        """
        Look up regulations by RCW reference
        
        Args:
            rcw_reference: RCW reference
            
        Returns:
            Matching regulations
        """
        # In a real implementation, this would look up the RCW in a database
        # Simplified placeholder implementation
        regulations = []
        
        for code, regulation in self.tax_regulations.items():
            if code.startswith(rcw_reference):
                regulations.append({
                    "code": code,
                    "title": regulation.get("title", ""),
                    "summary": regulation.get("summary", ""),
                    "url": regulation.get("url", "")
                })
        
        return regulations
    
    def _lookup_regulation_type(self, regulation_type: str) -> List[Dict[str, Any]]:
        """
        Look up regulations by type
        
        Args:
            regulation_type: Regulation type
            
        Returns:
            Matching regulations
        """
        # In a real implementation, this would filter regulations by type
        # Simplified placeholder implementation
        regulations = []
        
        for code, regulation in self.tax_regulations.items():
            if regulation_type in regulation.get("relevance", []):
                regulations.append({
                    "code": code,
                    "title": regulation.get("title", ""),
                    "summary": regulation.get("summary", ""),
                    "url": regulation.get("url", "")
                })
        
        return regulations
    
    def _search_regulations(self, search_terms: List[str]) -> List[Dict[str, Any]]:
        """
        Search regulations by terms
        
        Args:
            search_terms: Search terms
            
        Returns:
            Matching regulations
        """
        # In a real implementation, this would search regulations by terms
        # Simplified placeholder implementation
        regulations = []
        
        for code, regulation in self.tax_regulations.items():
            # Check if any search term is in the title or summary
            if any(term.lower() in regulation.get("title", "").lower() or 
                   term.lower() in regulation.get("summary", "").lower() 
                   for term in search_terms):
                regulations.append({
                    "code": code,
                    "title": regulation.get("title", ""),
                    "summary": regulation.get("summary", ""),
                    "url": regulation.get("url", ""),
                    "relevance": regulation.get("relevance", [])
                })
        
        return regulations
    
    def _check_special_classification_eligibility(
        self, 
        property_data: Dict[str, Any],
        special_type: str,
        classification: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check eligibility for special classification
        
        Args:
            property_data: Property data
            special_type: Special classification type
            classification: Classification definition
            
        Returns:
            Eligibility check result
        """
        # In a real implementation, this would check eligibility criteria
        # Simplified placeholder implementation
        eligibility_criteria = classification.get("eligibility_criteria", [])
        met_criteria = []
        unmet_criteria = []
        
        for criterion in eligibility_criteria:
            if criterion in property_data:
                met_criteria.append(criterion)
            else:
                unmet_criteria.append(criterion)
        
        eligible = len(unmet_criteria) == 0
        
        return {
            "eligible": eligible,
            "met_criteria": met_criteria,
            "unmet_criteria": unmet_criteria
        }
    
    def _get_special_valuation_guidance(
        self, 
        special_type: str, 
        classification: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get guidance for special valuation
        
        Args:
            special_type: Special valuation type
            classification: Classification definition
            
        Returns:
            Valuation guidance
        """
        # In a real implementation, this would provide detailed guidance
        # Simplified placeholder implementation
        valuation_method = classification.get("valuation_method", "")
        
        if valuation_method == "current_use":
            return {
                "method": "current_use",
                "description": "Value based on current use rather than highest and best use",
                "application_process": "File application with county assessor",
                "documentation_required": [
                    "Application form",
                    "Land use verification",
                    "Income data (for farm and agricultural land)"
                ],
                "maintenance_requirements": "Continue qualifying use, annual reporting may be required",
                "valuation_impact": "Typically reduces assessed value significantly",
                "penalty_provisions": "Change of use may trigger additional tax, interest, and penalties"
            }
        elif valuation_method == "special_valuation":
            return {
                "method": "special_valuation",
                "description": "Rehabilitation costs excluded from valuation for historic properties",
                "application_process": "File application with county assessor after rehabilitation",
                "documentation_required": [
                    "Historic designation evidence",
                    "Rehabilitation cost documentation",
                    "Before and after photographs"
                ],
                "maintenance_requirements": "Maintain historic character, allow public viewing if required",
                "valuation_impact": "Rehabilitation costs excluded from valuation for 10 years",
                "penalty_provisions": "Violation of agreement may trigger additional tax and interest"
            }
        elif valuation_method == "partial_exemption":
            return {
                "method": "partial_exemption",
                "description": "Partial exemption from property tax based on qualifying criteria",
                "application_process": "File application with county assessor",
                "documentation_required": [
                    "Application form",
                    "Eligibility documentation (age, income, disability, etc.)",
                    "Ownership verification"
                ],
                "maintenance_requirements": "Periodic renewal with updated eligibility verification",
                "valuation_impact": "Exempts portion of value from taxation",
                "penalty_provisions": "False information may trigger penalties and back taxes"
            }
        else:
            return {
                "method": "unknown",
                "description": "No specific guidance available for this valuation method"
            }
    
    def _get_audit_documentation_requirements(self, audit_type: str) -> List[Dict[str, Any]]:
        """
        Get required documentation for a state audit
        
        Args:
            audit_type: Type of audit
            
        Returns:
            List of required documents
        """
        # In a real implementation, this would provide document requirements
        # Simplified placeholder implementation
        
        # Common documents for all audits
        common_docs = [
            {
                "id": "valuation_procedures",
                "name": "Valuation Procedures",
                "description": "Documentation of property valuation procedures",
                "requirement_level": "required"
            },
            {
                "id": "assessment_rolls",
                "name": "Assessment Rolls",
                "description": "Complete assessment rolls for the audit period",
                "requirement_level": "required"
            }
        ]
        
        # Specific documents based on audit type
        if audit_type == "ratio_study":
            specific_docs = [
                {
                    "id": "sales_data",
                    "name": "Sales Data",
                    "description": "Validated sales data used for ratio studies",
                    "requirement_level": "required"
                },
                {
                    "id": "ratio_methodology",
                    "name": "Ratio Study Methodology",
                    "description": "Documentation of ratio study methodology",
                    "requirement_level": "required"
                }
            ]
        elif audit_type == "procedural":
            specific_docs = [
                {
                    "id": "notification_samples",
                    "name": "Notification Samples",
                    "description": "Samples of assessment notices",
                    "requirement_level": "required"
                },
                {
                    "id": "appeals_documentation",
                    "name": "Appeals Documentation",
                    "description": "Documentation of appeals process and results",
                    "requirement_level": "required"
                }
            ]
        else:
            # General audit
            specific_docs = [
                {
                    "id": "exemption_records",
                    "name": "Exemption Records",
                    "description": "Records of exemption applications and determinations",
                    "requirement_level": "required"
                },
                {
                    "id": "revaluation_plan",
                    "name": "Revaluation Plan",
                    "description": "Current revaluation cycle plan",
                    "requirement_level": "required"
                }
            ]
        
        return common_docs + specific_docs
    
    def _check_document_availability(self, audit_type: str, assessment_year: int) -> List[Dict[str, Any]]:
        """
        Check availability of required audit documents
        
        Args:
            audit_type: Type of audit
            assessment_year: Assessment year
            
        Returns:
            List of available documents
        """
        # In a real implementation, this would check document availability in the system
        # Simplified placeholder implementation - assuming some documents are available
        
        required_docs = self._get_audit_documentation_requirements(audit_type)
        
        # Simulate that some documents are available
        available_docs = []
        for i, doc in enumerate(required_docs):
            # For this example, assume every other document is available
            if i % 2 == 0:
                available_docs.append({
                    "id": doc["id"],
                    "name": doc["name"],
                    "location": f"/documents/{assessment_year}/{doc['id']}.pdf",
                    "last_updated": datetime.datetime(assessment_year, 1, 1).isoformat()
                })
        
        return available_docs
    
    def _generate_audit_recommendations(self, missing_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate recommendations for addressing missing audit documentation
        
        Args:
            missing_docs: List of missing documents
            
        Returns:
            List of recommendations
        """
        # In a real implementation, this would generate specific recommendations
        # Simplified placeholder implementation
        
        recommendations = []
        
        for doc in missing_docs:
            recommendations.append({
                "document_id": doc["id"],
                "document_name": doc["name"],
                "recommendation": f"Prepare and organize {doc['name']} documentation",
                "priority": "high" if doc.get("requirement_level") == "required" else "medium",
                "deadline": (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
            })
        
        return recommendations
    
    # Knowledge base initialization
    
    def _initialize_knowledge_base(self) -> None:
        """Initialize the knowledge base with Washington tax laws and regulations"""
        
        # Washington property tax principles
        self.add_knowledge("wa_principles", "assessment_ratio", 1.0)
        self.add_knowledge("wa_principles", "valuation_standard", "true_and_fair_value")
        self.add_knowledge("wa_principles", "revaluation_cycle", 1)  # Annual revaluation in Benton County
        
        # Key Washington RCWs related to property assessment
        self.add_knowledge("wa_laws", "84.40.020", {
            "title": "Assessment date",
            "summary": "All real and personal property subject to taxation shall be listed and assessed every year, with reference to its value on the first day of January of the year in which it is assessed.",
            "url": "https://app.leg.wa.gov/rcw/default.aspx?cite=84.40.020"
        })
        
        self.add_knowledge("wa_laws", "84.40.030", {
            "title": "Basis of valuation, assessment, appraisal",
            "summary": "All property shall be valued at one hundred percent of its true and fair value in money and assessed on the same basis unless specifically provided otherwise by law.",
            "url": "https://app.leg.wa.gov/rcw/default.aspx?cite=84.40.030"
        })
        
        self.add_knowledge("wa_laws", "84.40.0305", {
            "title": "Computer software",
            "summary": "Embedded software is taxable as part of the hardware. Other software is taxable as an intangible asset.",
            "url": "https://app.leg.wa.gov/rcw/default.aspx?cite=84.40.0305"
        })
        
        # Common exemption types
        self.add_knowledge("exemptions", "senior_disabled", {
            "rcw": "84.36.381",
            "description": "Exemption for senior citizens and disabled persons with limited income",
            "eligibility": "Age 61+ or disabled, with income below the threshold, for primary residence",
            "application": "Required, with renewal every 3 years"
        })
        
        self.add_knowledge("exemptions", "nonprofit", {
            "rcw": "84.36.040",
            "description": "Exemption for property used for nonprofit charitable purposes",
            "eligibility": "Qualifying nonprofit organizations using property for exempt purposes",
            "application": "Required annually"
        })
        
        # Special valuation programs
        self.add_knowledge("special_programs", "open_space", {
            "rcw": "84.34",
            "description": "Current use valuation for open space, farm and agricultural, and timber lands",
            "impact": "Reduces assessed value based on current use rather than highest and best use",
            "penalties": "Change of use triggers recovery of tax benefit plus interest"
        })
        
        self.add_knowledge("special_programs", "historic", {
            "rcw": "84.26",
            "description": "Special valuation for historic properties",
            "impact": "Excludes rehabilitation costs from valuation for 10 years",
            "requirements": "Property must be on historic register and undergo substantial rehabilitation"
        })