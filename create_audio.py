from gtts import gTTS

# Sample Startup Pitch Transcript
pitch_text = """
Hello investors, welcome to EcoTech Solutions. 
Our company achieved two million dollars in ARR last year with over one hundred thousand active monthly users. 
We operate in the green energy sector, which is projected to reach eight hundred billion dollars globally by 2030. 
We are currently seeking five hundred thousand dollars in seed funding for a ten percent equity stake in our company.
"""

# Convert text to audio MP3
tts = gTTS(text=pitch_text, lang='en', slow=False)
tts.save("test_pitch.mp3")
print("✅ 'test_pitch.mp3' file generated successfully!")
