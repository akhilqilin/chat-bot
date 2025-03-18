import React, { useState, useRef } from "react";
import axios from "axios";
import { 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  CircularProgress,
  Container,
  Grid
} from "@mui/material";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_VOICE_ID = import.meta.env.VITE_ELEVEN_LABS_VOICE_ID;
const MAX_LISTENING_DURATION = 300000; // 5 minutes

export default function AiBot() {
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [responseReady, setResponseReady] = useState(false);
  const audioRef = useRef(null);
  const listeningTimeoutRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.continuous = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setRecognizedText(transcript);
    sendTextToBackend(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
  };

  const startListening = () => {
    setListening(true);
    recognition.start();
    listeningTimeoutRef.current = setTimeout(() => {
      if (listening) {
        stopListening();
      }
    }, MAX_LISTENING_DURATION);
  };

  const stopListening = () => {
    setListening(false);
    recognition.stop();
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }
  };

  const sendTextToBackend = async (text) => {
    try {
      setLoadingAudio(true);
      const res = await axios.post(`${BACKEND_URL}/ai-process`, { text });
      setAiResponse(res.data.response);
      callElevenLabsTTS(res.data.response);
    } catch (error) {
      console.error("Error processing AI text", error);
    }
  };

  const callElevenLabsTTS = async (text) => {
    setResponseReady(false);
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`;
    const modifiedText = text.replace(/([,.:;?])/g, '$1 <break time="800ms"/>');
    const ssmlText = `<speak><prosody rate="30%">${modifiedText}</prosody></speak>`;
    try {
      const response = await fetch(ttsUrl, {
        method: "POST",
        headers: {
          "xi-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: ssmlText,
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      });
      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onloadeddata = () => {
        setLoadingAudio(false);
        setResponseReady(true);
      };
      audio.play();
      audioRef.current = audio;
    } catch (error) {
      console.error("Error in ElevenLabs TTS:", error);
      setLoadingAudio(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2E7D32 0%, #FFD700 100%)",
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 3,
            p: { xs: 2, sm: 3 },
            backgroundColor: "#fdfdfd",
          }}
        >
          <CardContent>
            <Grid container spacing={2} direction="column">
              <Grid item xs={12}>
                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  sx={{ color: "#2E7D32", fontWeight: "bold", fontSize: { xs: "1.8rem", sm: "2.2rem" } }}
                >
                  <AttachMoneyIcon sx={{ mr: 1, fontSize: { xs: "2rem", sm: "2.5rem" } }} />
                  Get Good With Money
                </Typography>
              </Grid>
              <Grid item xs={12} container justifyContent="center">
                <Button
                  variant="contained"
                  color="success"
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  startIcon={listening ? <MicIcon /> : <MicOffIcon />}
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                  }}
                >
                  {listening ? "Listening..." : "Hold to Speak"}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: "#2E7D32", fontSize: { xs: "1rem", sm: "1.2rem" } }}>
                  Your Speech:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    backgroundColor: "#e8f5e9",
                    p: 2,
                    borderRadius: "8px",
                    minHeight: "50px",
                    fontSize: { xs: "0.8rem", sm: "1rem" },
                  }}
                >
                  {recognizedText}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: "#2E7D32", fontSize: { xs: "1rem", sm: "1.2rem" } }}>
                  Tiffany's Response:
                </Typography>
                {loadingAudio && (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100px" }}>
                    <CircularProgress size={36} color="success" sx={{ mr: 1 }} />
                    <Typography variant="body1">Loading ...</Typography>
                  </Box>
                )}
                {responseReady && (
                  <Typography
                    variant="body1"
                    sx={{
                      backgroundColor: "#fff9c4",
                      p: 2,
                      borderRadius: "8px",
                      minHeight: "50px",
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      mb: 2,
                    }}
                  >
                    {aiResponse}
                  </Typography>
                )}
                {loadingAudio && (
                  <Typography variant="body2" sx={{ textAlign: "center", color: "#757575" }}>
                    Awaiting response...
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
