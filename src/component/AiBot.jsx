import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  CircularProgress 
} from "@mui/material";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_VOICE_ID = import.meta.env.VITE_ELEVEN_LABS_VOICE_ID;

// Set maximum listening duration to  minutes (300,000 milliseconds)
const MAX_LISTENING_DURATION = 300000; 

export default function AiBot() {
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [responseReady, setResponseReady] = useState(false);
  const audioRef = useRef(null);
  const listeningTimeoutRef = useRef(null);

  // Set up SpeechRecognition
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
    // Set a timeout to stop listening automatically after MAX_LISTENING_DURATION
    listeningTimeoutRef.current = setTimeout((  ) => {
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

  // Send the user's speech text to the backend AI processor
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

  // Call ElevenLabs TTS API, create an audio element and wait for it to load
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

      // Create an audio element and set its onloadeddata event
      const audio = new Audio(audioUrl);
      audio.onloadeddata = () => {
        setLoadingAudio(false);
        setResponseReady(true);
      };
      audio.play();
      // Store the audio element to display controls later
      audioRef.current = audio;
    } catch (error) {
      console.error("Error in ElevenLabs TTS:", error);
      setLoadingAudio(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        minHeight: '100vh',
        p: 2,
        background: 'linear-gradient(135deg, #2E7D32 0%, #FFD700 100%)', // Dark green to gold gradient
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 500, md: 600 },
          borderRadius: 3,
          boxShadow: 3,
          p: { xs: 2, sm: 3 },
          mx: 'auto',
          my: 4,
          backgroundColor: "#fdfdfd"
        }}
      >
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom sx={{ color: "#2E7D32", fontWeight: "bold" }}>
            <AttachMoneyIcon sx={{ mr: 1 }} />
            Get Good With Money
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <Button
              variant="contained"
              color="success"
              onMouseDown={startListening}
              onMouseUp={stopListening}
              startIcon={listening ? <MicIcon /> : <MicOffIcon />}
              sx={{
                py: 1.5,
                px: 3,
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
              }}
            >
              {listening ? "Listening..." : "Hold to Speak"}
            </Button>
          </Box>
          <Box sx={{ my: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: "#2E7D32" }}>
              Your Speech:
            </Typography>
            <Typography
              variant="body1"
              sx={{
                backgroundColor: '#e8f5e9',
                p: 2,
                borderRadius: '8px',
                minHeight: '50px',
                fontSize: { xs: '0.8rem', sm: '1rem' },
              }}
            >
              {recognizedText}
            </Typography>
          </Box>
          <Box sx={{ my: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: "#2E7D32" }}>
              Tiffany's Response:
            </Typography>
            {loadingAudio && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
                <CircularProgress size={36} color="success" sx={{ mr: 1 }} />
                <Typography variant="body1">Loading ...</Typography>
              </Box>
            )}
            {responseReady && (
              <Box>
                <Typography
                  variant="body1"
                  sx={{
                    backgroundColor: '#fff9c4',
                    p: 2,
                    borderRadius: '8px',
                    minHeight: '50px',
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    mb: 2,
                  }}
                >
                  {aiResponse}
                </Typography>
                {/* Display audio controls if needed */}
                
              </Box>
            )}
            {!loadingAudio && !responseReady && (
              <Typography variant="body2" sx={{ textAlign: 'center', color: "#757575" }}>
                Awaiting response...
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
