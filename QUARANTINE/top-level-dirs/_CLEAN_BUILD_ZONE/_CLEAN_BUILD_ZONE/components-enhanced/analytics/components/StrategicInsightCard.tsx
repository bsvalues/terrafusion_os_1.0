import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

interface StrategicInsightCardProps {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  recommendations: string[];
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export const StrategicInsightCard: React.FC<StrategicInsightCardProps> = ({
  title,
  description,
  impact,
  confidence,
  category,
  recommendations,
  priority
}) => {
  const [expanded, setExpanded] = useState(false);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error.main';
      case 'high':
        return 'warning.main';
      case 'medium':
        return 'info.main';
      case 'low':
        return 'success.main';
      default:
        return 'grey.500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: getPriorityColor(priority), mr: 1, width: 32, height: 32 }}><>

              <LightbulbIcon fontSize="small" />
            </Avatar>
            <Box
</>
</>><>

              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {title}
              </Typography>
              <Typography
</>
variant="caption" color="text.secondary">
                {category}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
            <Chip
              label={priority.toUpperCase()}
              size="small"
              sx={{ bgcolor: getPriorityColor(priority), color: 'white' }}
            />
            <Chip
              label={`${impact.toUpperCase()} IMPACT`}
              size="small"
              color={getImpactColor(impact) as any}
              variant="outlined"
            />
          </Box>
        </Box><>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>

        <Box
</>
sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><>

            <Typography variant="caption" color="text.secondary">
              Confidence Level
            </Typography>
            <Typography
</>
variant="caption" color="text.secondary">
              {confidence}%
            </Typography>
          </Box><>

          <LinearProgress
            variant="determinate"
            value={confidence}
            color={getConfidenceColor(confidence)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <Box
</>
sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {expanded ? 'Hide' : 'Show'} Recommendations
          </Button>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
          >
            Take Action
          </Button>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}><>

            <Typography variant="subtitle2" gutterBottom>
              Recommended Actions:
            </Typography>
            <List
</>
dense>
              {recommendations.map((recommendation /* , index */) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}><>

                    <CheckCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
</>

                    primary={recommendation}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
