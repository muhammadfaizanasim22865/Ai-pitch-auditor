import streamlit as st
from config import Config
from services import STTService, ClaimExtractor, SearchService, FactChecker

# ==========================================
# 1. PAGE CONFIGURATION
# ==========================================
st.set_page_config(
    page_title="AI Pitch Auditor",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# 1B. GLOBAL STYLING (visual only — no logic here)
# ==========================================
st.markdown("""
<style>

    /* ---------- Base ---------- */
    html, body, [class*="css"] {
        font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    .stApp {
        background: radial-gradient(circle at 10% 0%, #131722 0%, #0b0d13 55%, #0a0c11 100%);
    }

    /* ---------- Hide default chrome ---------- */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {background: transparent !important;}

    /* ---------- Sidebar ---------- */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #12141c 0%, #0d0f16 100%);
        border-right: 1px solid rgba(255,255,255,0.06);
    }
    section[data-testid="stSidebar"] .stButton button {
        background: rgba(255,255,255,0.04);
        color: #e6e8ef;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        text-align: left;
        transition: all 0.15s ease-in-out;
        font-weight: 500;
    }
    section[data-testid="stSidebar"] .stButton button:hover {
        background: rgba(124, 137, 255, 0.15);
        border: 1px solid rgba(124, 137, 255, 0.45);
        color: #ffffff;
        transform: translateX(2px);
    }

    /* ---------- Hero header ---------- */
    .hero-wrap {
        padding: 1.6rem 1.8rem;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(16,185,129,0.08) 100%);
        border: 1px solid rgba(255,255,255,0.08);
        margin-bottom: 1.4rem;
    }
    .hero-title {
        font-size: 2.1rem;
        font-weight: 800;
        color: #f5f6fa;
        margin: 0;
        letter-spacing: -0.5px;
    }
    .hero-sub {
        color: #9aa0b4;
        font-size: 1rem;
        margin-top: 0.35rem;
    }
    .hero-badges {
        margin-top: 0.9rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .hero-badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.28rem 0.7rem;
        border-radius: 999px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        color: #c7cbe0;
    }

    /* ---------- Input area card ---------- */
    .input-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        padding: 1.1rem 1.2rem 0.4rem 1.2rem;
        margin-bottom: 1rem;
    }
    .input-card-label {
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #8b90a8;
        margin-bottom: 0.6rem;
    }

    /* ---------- Chat bubbles ---------- */
    div[data-testid="stChatMessage"] {
        background: rgba(255,255,255,0.035);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 14px;
        padding: 0.4rem 0.2rem;
        margin-bottom: 0.6rem;
    }

    /* ---------- Verdict cards (rendered via markdown) ---------- */
    .verdict-card {
        border-radius: 14px;
        padding: 1rem 1.2rem;
        margin: 0.6rem 0;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
    }
    .verdict-claim {
        font-size: 1.02rem;
        font-weight: 600;
        color: #f0f1f7;
        margin-bottom: 0.5rem;
    }
    .verdict-pill {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        padding: 0.22rem 0.65rem;
        border-radius: 999px;
        margin-right: 0.5rem;
        text-transform: uppercase;
    }
    .pill-true { background: rgba(16,185,129,0.18); color: #34d399; border: 1px solid rgba(52,211,153,0.4);}
    .pill-false { background: rgba(239,68,68,0.18); color: #f87171; border: 1px solid rgba(248,113,113,0.4);}
    .pill-unverified { background: rgba(245,158,11,0.18); color: #fbbf24; border: 1px solid rgba(251,191,36,0.4);}
    .verdict-category {
        font-size: 0.78rem;
        color: #9aa0b4;
        font-weight: 500;
    }
    .verdict-explanation {
        margin-top: 0.6rem;
        color: #cdd0de;
        font-size: 0.93rem;
        line-height: 1.5;
    }
    .verdict-sources {
        margin-top: 0.6rem;
        font-size: 0.8rem;
        color: #7d8299;
    }

    /* ---------- Divider ---------- */
    .soft-divider {
        border: none;
        border-top: 1px solid rgba(255,255,255,0.08);
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 2. SESSION STATE MANAGEMENT
# ==========================================
if "saved_chats" not in st.session_state:
    st.session_state.saved_chats = []

if "current_chat_id" not in st.session_state:
    st.session_state.current_chat_id = None

if "messages" not in st.session_state:
    st.session_state.messages = []

# Incrementing keys for the file/audio widgets. Bumping these after each
# submission forces Streamlit to treat the uploader/recorder as brand-new
# widgets on the next rerun, so a previously uploaded/recorded input can
# never be silently reprocessed on a later, unrelated interaction.
if "uploader_key" not in st.session_state:
    st.session_state.uploader_key = 0

if "audio_key" not in st.session_state:
    st.session_state.audio_key = 0

def create_new_chat():
    st.session_state.messages = []
    st.session_state.current_chat_id = None
    st.rerun()

def load_chat(chat_id):
    for chat in st.session_state.saved_chats:
        if chat["id"] == chat_id:
            st.session_state.messages = chat["messages"].copy()
            st.session_state.current_chat_id = chat_id
            st.rerun()

def save_current_session(user_title, messages_list):
    if st.session_state.current_chat_id is None:
        new_id = len(st.session_state.saved_chats) + 1
        st.session_state.current_chat_id = new_id
        st.session_state.saved_chats.append({
            "id": new_id,
            "title": user_title,
            "messages": messages_list.copy()
        })
    else:
        for chat in st.session_state.saved_chats:
            if chat["id"] == st.session_state.current_chat_id:
                chat["messages"] = messages_list.copy()

# ==========================================
# 3. SIDEBAR (CHAT HISTORY & CONTROLS)
# ==========================================
with st.sidebar:
    st.markdown(
        """
        <div style="text-align:center; padding: 0.6rem 0 1rem 0;">
            <div style="font-size: 2.2rem;">🛡️</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #f5f6fa;">Pitch Auditor</div>
            <div style="font-size: 0.8rem; color: #8b90a8;">AI-powered fact checking</div>
        </div>
        """,
        unsafe_allow_html=True
    )

    if st.button("➕  New Audit", use_container_width=True):
        create_new_chat()

    st.markdown('<hr class="soft-divider">', unsafe_allow_html=True)

    st.markdown(
        '<div style="font-size:0.78rem; font-weight:700; text-transform:uppercase; '
        'letter-spacing:0.06em; color:#8b90a8; margin-bottom:0.5rem;">📜 Chat History</div>',
        unsafe_allow_html=True
    )
    if not st.session_state.saved_chats:
        st.caption("No saved chats yet — start an audit above.")
    else:
        for chat in reversed(st.session_state.saved_chats):
            if st.button(f"💬  {chat['title']}", key=f"chat_{chat['id']}", use_container_width=True):
                load_chat(chat["id"])

    st.markdown('<hr class="soft-divider">', unsafe_allow_html=True)

    if st.button("🗑️  Clear History", use_container_width=True):
        st.session_state.saved_chats = []
        st.session_state.messages = []
        st.session_state.current_chat_id = None
        st.rerun()

# ==========================================
# 4. MAIN INTERFACE
# ==========================================
st.markdown(
    """
    <div class="hero-wrap">
        <p class="hero-title">🛡️ AI Pitch Auditor</p>
        <p class="hero-sub">Paste a claim, record your pitch, or upload an audio file — I'll extract the factual claims and check them for you.</p>
        <div class="hero-badges">
            <span class="hero-badge">🎙️ Voice input</span>
            <span class="hero-badge">📁 File upload</span>
            <span class="hero-badge">🔍 Live fact-checking</span>
            <span class="hero-badge">✅ Verdict scoring</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True
)

# Display Chat History
for message in st.session_state.messages:
    avatar = "🧑‍💼" if message["role"] == "user" else "🛡️"
    with st.chat_message(message["role"], avatar=avatar):
        st.markdown(message["content"])

# Standard Inputs (File & Mic)
st.markdown('<div class="input-card">', unsafe_allow_html=True)
st.markdown('<div class="input-card-label">Provide your pitch</div>', unsafe_allow_html=True)
col1, col2 = st.columns(2)
with col1:
    uploaded_file = st.file_uploader(
        "📁 Upload Audio File",
        type=["mp3", "wav", "m4a"],
        key=f"uploader_{st.session_state.uploader_key}",
    )
with col2:
    recorded_audio = st.audio_input(
        "🎙️ Record Audio Pitch",
        key=f"audio_{st.session_state.audio_key}",
    )
st.markdown('</div>', unsafe_allow_html=True)

# Chat Input Bar
prompt = st.chat_input("Paste claim or ask here...")

# ==========================================
# 5. AUDIT & FACT CHECK LOGIC
# ==========================================
if prompt or uploaded_file or recorded_audio:
    user_text = prompt if prompt else ("🎙️ [Voice Audio]" if recorded_audio else f"📁 {uploaded_file.name}")
    audio_source = recorded_audio or uploaded_file

    st.session_state.messages.append({"role": "user", "content": user_text})
    with st.chat_message("user", avatar="🧑‍💼"):
        st.write(user_text)

    with st.chat_message("assistant", avatar="🛡️"):
        with st.spinner("🔎 Processing pitch and checking facts..."):
            transcript = ""
            if audio_source:
                stt = STTService()
                transcript = stt.transcribe_audio(audio_source)
            else:
                transcript = prompt.strip() if prompt else ""

            if not transcript:
                st.error("No clear speech or text input found.")
                st.stop()

            extractor = ClaimExtractor()
            claims = extractor.extract_claims(transcript)

            response_markdown = ""
            if not claims:
                response_markdown = "No verifiable factual claims were found."
                st.info(response_markdown)
            else:
                searcher = SearchService()
                checker = FactChecker()

                for item in claims:
                    claim_text = item.get("claim", "")
                    if claim_text:
                        search_res = searcher.search_claim(claim_text)
                        verdict_info = checker.verify_claim(claim_text, search_res)

                        verdict = verdict_info.get("verdict", "UNVERIFIED")
                        explanation = verdict_info.get("explanation", "")
                        sources = verdict_info.get("sources", [])
                        sources_str = ", ".join(sources) if sources else "None"

                        # Plain markdown card kept for chat history / persistence
                        card = f"**Claim:** \"{claim_text}\"\n\n" \
                               f"**Verdict:** `{verdict}` | **Category:** {item.get('category', 'General')}\n\n" \
                               f"**Explanation:** {explanation}\n\n" \
                               f"**Sources:** {sources_str}\n"

                        response_markdown += card + "\n---\n"

                        # Styled version shown live in the UI
                        pill_class = {
                            "TRUE": "pill-true",
                            "FALSE": "pill-false",
                        }.get(verdict, "pill-unverified")

                        verdict_icon = {"TRUE": "✅", "FALSE": "❌"}.get(verdict, "⚠️")

                        styled_card = f"""
                        <div class="verdict-card">
                            <div class="verdict-claim">💬 "{claim_text}"</div>
                            <span class="verdict-pill {pill_class}">{verdict_icon} {verdict}</span>
                            <span class="verdict-category">🏷️ {item.get('category', 'General')}</span>
                            <div class="verdict-explanation">{explanation}</div>
                            <div class="verdict-sources">🔗 Sources: {sources_str}</div>
                        </div>
                        """
                        st.markdown(styled_card, unsafe_allow_html=True)

        st.session_state.messages.append({"role": "assistant", "content": response_markdown})

        # Save to Sidebar History
        title = user_text[:25] + "..." if len(user_text) > 25 else user_text
        save_current_session(title, st.session_state.messages)

    # Force the file uploader and audio recorder to reset to a fresh, empty
    # widget on the next run. Without this, Streamlit keeps returning the
    # same uploaded/recorded value on every later rerun (e.g. when the user
    # submits a new text prompt), causing the previous input to be silently
    # reprocessed instead of the new one.
    st.session_state.uploader_key += 1
    st.session_state.audio_key += 1
    st.rerun()
