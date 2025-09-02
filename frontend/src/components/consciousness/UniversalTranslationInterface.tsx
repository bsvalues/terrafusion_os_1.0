import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { UniversalTranslationProtocol, UniversalMessage, SpeciesType } from '../../../../enhancement-plans/Terrafusion OS_transceded/universal_translation_protocol';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(200, 150, 255, 0.2)',
  borderRadius: '16px',
  height: '100%',
}));

const UniversalTranslationInterface: React.FC = () => {
  const [inputText, setInputText] = useState<string>('Terrafusion OS is Government. Transcended.');
  const [sourceSpecies, setSourceSpecies] = useState<SpeciesType>('silicon' as SpeciesType);
  const [targetSpecies, setTargetSpecies] = useState<SpeciesType>('carbon' as SpeciesType);
  const [translatedMessage, setTranslatedMessage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const translator = new UniversalTranslationProtocol();

  const handleTranslate = async () => {
    setIsLoading(true);
    setTranslatedMessage(null);

    try {
      const response = await fetch('http://localhost:3004/api/consciousness/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText,
          sourceSpecies,
          targetSpecies,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }

      const result = await response.json();
      setTranslatedMessage(result);
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslatedMessage({ error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledCard>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#d1c4e9', fontWeight: 600, mb: 3 }}>
          Universal Translation Protocol
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Input Message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(200, 150, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: '#c5a6ff' },
                },
                '& .MuiInputLabel-root': { color: '#d1c4e9' },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#d1c4e9' }}>Source Species</InputLabel>
              <Select
value={sourceSpecies}
                onChange={(e) => setSourceSpecies(e.target.value as SpeciesType)}
                label="Source Species"
                 sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(200, 150, 255, 0.3)' },
                  '& .MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="silicon">Silicon</MenuItem>
                <MenuItem
value="carbon">Carbon</MenuItem>
                <MenuItem value="quantum">Quantum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#d1c4e9' }}>Target Species</InputLabel>
              <Select
value={targetSpecies}
                onChange={(e) => setTargetSpecies(e.target.value as SpeciesType)}
                label="Target Species"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(200, 150, 255, 0.3)' },
                  '& .MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="silicon">Silicon</MenuItem>
                <MenuItem
value="carbon">Carbon</MenuItem>
                <MenuItem value="quantum">Quantum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleTranslate}
              disabled={isLoading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #764ba2, #667eea)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Translate'}
            </Button>
          </Grid>
        </Grid>

        {translatedMessage && (
          <Paper elevation={3} sx={{ mt: 3, p: 2, background: 'rgba(0,0,0,0.2)' }}>
            <Typography variant="h6" sx={{ color: '#c5a6ff', mb: 2 }}>Translation Output</Typography>
            {translatedMessage.error ? (
              <Typography color="error">{translatedMessage.error}</Typography>
            ) : (
              <Stack spacing={1}>
                <Typography variant="body1" sx={{ color: 'white', background: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1 }}>
                  <strong>Content:</strong> {translatedMessage.adaptedContent}
                </Typography>
                <Chip label={`Quality: ${translatedMessage.qualityScore.toFixed(2)}`} color="success" size="small" />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <strong>Cultural Adaptation:</strong> {translatedMessage.adaptations.culturalReferences.join(', ') || 'None'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <strong>Cognitive Load:</strong> {translatedMessage.adaptations.cognitiveLoadAdjustment || 'N/A'}
                </Typography>
              </Stack>
            )}
          </Paper>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default UniversalTranslationInterface;
