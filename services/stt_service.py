from groq import Groq
from config import Config

class STTService:
    def __init__(self):
        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def transcribe_audio(self, audio_file) -> str:
        """
        Streamlit file uploader ya byte stream se audio transcript generate karta hai.
        """
        try:
            # File contents read karke Groq Whisper ko submit karna
            file_bytes = audio_file.read()
            audio_tuple = (audio_file.name, file_bytes)

            transcription = self.client.audio.transcriptions.create(
                file=audio_tuple,
                model=Config.WHISPER_MODEL,
                response_format="text"
            )
            return transcription
        except Exception as e:
            raise RuntimeError(f"STT Processing Error: {str(e)}")
