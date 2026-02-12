"""
3D Privacy Landscape Visualization Engine
Real-time 3D rendering of privacy metrics and data flows
"""

import json
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from enum import Enum


class PrivacyNodeType(Enum):
    """Types of nodes in privacy landscape."""
    QUERY = "query"
    AGGREGATION = "aggregation"
    ANALYSIS = "analysis"
    RISK_ASSESSMENT = "risk_assessment"
    COMPLIANCE_CHECK = "compliance_check"
    DATA_MINIMIZATION = "data_minimization"


class PrivacyFlowType(Enum):
    """Types of flows between nodes."""
    EPSILON_CONSUMPTION = "epsilon_consumption"
    RISK_PROPAGATION = "risk_propagation"
    COMPLIANCE_FLOW = "compliance_flow"
    DATA_MINIMIZATION = "data_minimization"


@dataclass
class Vector3:
    """3D coordinates."""
    x: float
    y: float
    z: float

    def __add__(self, other):
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

    def distance_to(self, other):
        dx = self.x - other.x
        dy = self.y - other.y
        dz = self.z - other.z
        return (dx*dx + dy*dy + dz*dz) ** 0.5


@dataclass
class PrivacyNode3D:
    """3D node representing privacy operation."""
    node_id: str
    node_type: PrivacyNodeType
    position: Vector3
    color: str
    size: float
    label: str
    value: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PrivacyFlow3D:
    """3D flow between privacy nodes."""
    flow_id: str
    flow_type: PrivacyFlowType
    source: str
    destination: str
    intensity: float
    color: str
    thickness: float
    animation_speed: float = 1.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class PrivacyLandscape3D:
    """3D visualization of privacy landscape."""

    def __init__(self, width: float = 1000, height: float = 1000, depth: float = 500):
        self.width = width
        self.height = height
        self.depth = depth
        self.nodes: Dict[str, PrivacyNode3D] = {}
        self.flows: Dict[str, PrivacyFlow3D] = {}
        self.camera_position = Vector3(width/2, height/2, depth*1.5)
        self.render_quality = "ultra"

    def add_node(self, node: PrivacyNode3D) -> None:
        """Add privacy node to landscape."""
        self.nodes[node.node_id] = node

    def add_flow(self, flow: PrivacyFlow3D) -> None:
        """Add flow between nodes."""
        self.flows[flow.flow_id] = flow

    def create_query_node(self, query_name: str, epsilon_cost: float,
                         risk_score: float) -> PrivacyNode3D:
        """Create node for query operation."""
        # Color based on epsilon cost
        if epsilon_cost < 0.1:
            color = "#00FF00"  # Green (low cost)
        elif epsilon_cost < 1.0:
            color = "#FFFF00"  # Yellow (medium cost)
        else:
            color = "#FF0000"  # Red (high cost)

        position = Vector3(
            x=self.width * (epsilon_cost / 10.0),
            y=self.height * (risk_score),
            z=self.depth * 0.5
        )

        node = PrivacyNode3D(
            node_id=f"query_{query_name}_{datetime.now().timestamp()}",
            node_type=PrivacyNodeType.QUERY,
            position=position,
            color=color,
            size=max(5, min(50, epsilon_cost * 10)),
            label=query_name,
            value=epsilon_cost,
            metadata={
                "epsilon_cost": epsilon_cost,
                "risk_score": risk_score
            }
        )

        self.add_node(node)
        return node

    def create_risk_node(self, risk_type: str, risk_value: float) -> PrivacyNode3D:
        """Create node for risk assessment."""
        color_intensity = int(255 * risk_value)
        color = f"#FF{255-color_intensity:02X}00"  # Red to yellow gradient

        position = Vector3(
            x=self.width * 0.7,
            y=self.height * risk_value,
            z=self.depth * 0.3
        )

        node = PrivacyNode3D(
            node_id=f"risk_{risk_type}_{datetime.now().timestamp()}",
            node_type=PrivacyNodeType.RISK_ASSESSMENT,
            position=position,
            color=color,
            size=20 + risk_value * 30,
            label=risk_type,
            value=risk_value,
            metadata={"risk_type": risk_type}
        )

        self.add_node(node)
        return node

    def create_compliance_node(self, framework: str, compliance_score: float) -> PrivacyNode3D:
        """Create node for compliance status."""
        # Green for high compliance, red for low
        if compliance_score > 0.8:
            color = "#00FF00"
        elif compliance_score > 0.6:
            color = "#80FF00"
        elif compliance_score > 0.4:
            color = "#FFFF00"
        else:
            color = "#FF0000"

        position = Vector3(
            x=self.width * 0.3,
            y=self.height * compliance_score,
            z=self.depth * 0.7
        )

        node = PrivacyNode3D(
            node_id=f"compliance_{framework}_{datetime.now().timestamp()}",
            node_type=PrivacyNodeType.COMPLIANCE_CHECK,
            position=position,
            color=color,
            size=25,
            label=framework,
            value=compliance_score,
            metadata={"framework": framework}
        )

        self.add_node(node)
        return node

    def create_flow_between(self, source_node: PrivacyNode3D,
                           dest_node: PrivacyNode3D,
                           flow_type: PrivacyFlowType,
                           intensity: float = 1.0) -> PrivacyFlow3D:
        """Create flow between two nodes."""
        distance = source_node.position.distance_to(dest_node.position)
        thickness = intensity * 2

        flow = PrivacyFlow3D(
            flow_id=f"flow_{source_node.node_id}_{dest_node.node_id}",
            flow_type=flow_type,
            source=source_node.node_id,
            destination=dest_node.node_id,
            intensity=intensity,
            color=self._flow_color(flow_type),
            thickness=thickness,
            animation_speed=1.0 / distance if distance > 0 else 1.0
        )

        self.add_flow(flow)
        return flow

    def _flow_color(self, flow_type: PrivacyFlowType) -> str:
        """Get color for flow type."""
        colors = {
            PrivacyFlowType.EPSILON_CONSUMPTION: "#FF6B6B",
            PrivacyFlowType.RISK_PROPAGATION: "#FFA500",
            PrivacyFlowType.COMPLIANCE_FLOW: "#00FF00",
            PrivacyFlowType.DATA_MINIMIZATION: "#4169E1"
        }
        return colors.get(flow_type, "#FFFFFF")

    def export_scene(self) -> Dict[str, Any]:
        """Export 3D scene for rendering."""
        return {
            "scene": {
                "dimensions": {
                    "width": self.width,
                    "height": self.height,
                    "depth": self.depth
                },
                "camera": {
                    "position": {"x": self.camera_position.x,
                               "y": self.camera_position.y,
                               "z": self.camera_position.z},
                    "target": {"x": self.width/2, "y": self.height/2, "z": self.depth/2}
                },
                "render_quality": self.render_quality,
                "lighting": {
                    "ambient": 0.6,
                    "directional": 1.0,
                    "shadows": True
                }
            },
            "nodes": [
                {
                    "id": node.node_id,
                    "type": node.node_type.value,
                    "position": {"x": node.position.x, "y": node.position.y, "z": node.position.z},
                    "color": node.color,
                    "size": node.size,
                    "label": node.label,
                    "value": node.value
                }
                for node in self.nodes.values()
            ],
            "flows": [
                {
                    "id": flow.flow_id,
                    "type": flow.flow_type.value,
                    "source": flow.source,
                    "destination": flow.destination,
                    "intensity": flow.intensity,
                    "color": flow.color,
                    "thickness": flow.thickness,
                    "animation_speed": flow.animation_speed
                }
                for flow in self.flows.values()
            ],
            "timestamp": datetime.now().isoformat()
        }

    def get_statistics(self) -> Dict[str, Any]:
        """Get landscape statistics."""
        return {
            "total_nodes": len(self.nodes),
            "total_flows": len(self.flows),
            "node_types": {
                node_type.value: len([n for n in self.nodes.values() if n.node_type == node_type])
                for node_type in PrivacyNodeType
            },
            "flow_types": {
                flow_type.value: len([f for f in self.flows.values() if f.flow_type == flow_type])
                for flow_type in PrivacyFlowType
            },
            "timestamp": datetime.now().isoformat()
        }
