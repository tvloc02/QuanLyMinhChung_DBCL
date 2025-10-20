from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model.chatbot import ChatBot

import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from functools import wraps
import json

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"⚠️ Warning: .env file not found at {dotenv_path}")
    print(f"   Current working directory: {os.getcwd()}")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["*"]}})

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max request size
app.config['JSON_SORT_KEYS'] = False

# Logging configuration with emojis
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('chatbot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global variables
bot = None
chat_sessions = {}
MAX_SESSIONS = 1000
SESSION_TIMEOUT_HOURS = 24

def initialize_chatbot():
    """Initialize the chatbot with proper error handling"""
    global bot

    try:
        # Determine the correct path to training data
        current_dir = os.path.dirname(os.path.abspath(__file__))

        possible_paths = [
            os.path.join(current_dir, "training_data_enhanced.json"),
            os.path.join(current_dir, "training_data.json"),
            os.path.join(current_dir, "model", "training_data.json"),
            os.path.join(os.path.dirname(current_dir), "training_data.json"),
            os.path.join(os.getcwd(), "training_data.json"),
            os.path.join(os.getcwd(), "training_data_enhanced.json"),
        ]

        logger.info(f"🔍 Searching for training data...")
        logger.info(f"   Current directory: {current_dir}")
        logger.info(f"   Working directory: {os.getcwd()}")

        training_data_path = None
        for path in possible_paths:
            if os.path.exists(path):
                training_data_path = path
                logger.info(f"✅ Found training data at: {path}")
                break

        if not training_data_path:
            logger.error(f"❌ Training data not found in any of these locations:")
            for path in possible_paths:
                logger.error(f"   - {path}")
            raise FileNotFoundError("Training data file not found")

        # Initialize chatbot with found path
        bot = ChatBot(data_file=training_data_path)

        # Get status
        status = bot.get_status()
        logger.info(f"✅ Chatbot initialized successfully")
        logger.info(f"   Training data: {status['training_data_loaded']} Q&As")
        logger.info(f"   Categories: {status['categories']}")
        logger.info(f"   Data file: {status['data_file']}")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to initialize chatbot: {str(e)}")
        logger.error(f"   Error type: {type(e).__name__}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return False

# Initialize chatbot on startup
if __name__ != '__main__':
    logger.info("📂 Initializing chatbot...")
    if not initialize_chatbot():
        logger.error("❌ Chatbot initialization failed")
        bot = None

def cleanup_old_sessions():
    """Remove sessions older than SESSION_TIMEOUT_HOURS"""
    current_time = datetime.now()
    expired_sessions = []

    for session_id, session_data in chat_sessions.items():
        if 'last_activity' in session_data:
            last_activity = datetime.fromisoformat(session_data['last_activity'])
            if current_time - last_activity > timedelta(hours=SESSION_TIMEOUT_HOURS):
                expired_sessions.append(session_id)

    for session_id in expired_sessions:
        del chat_sessions[session_id]
        logger.info(f"🗑️ Cleaned up expired session: {session_id}")

    return len(expired_sessions)

def require_session_id(f):
    """Decorator to validate session_id parameter"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_id = request.args.get('session_id') or (request.get_json() or {}).get('session_id', 'default')

        if not session_id:
            return jsonify({
                "success": False,
                "error": "session_id is required"
            }), 400

        # Initialize session if not exists
        if session_id not in chat_sessions:
            if len(chat_sessions) > MAX_SESSIONS:
                cleanup_old_sessions()

            chat_sessions[session_id] = {
                "created_at": datetime.now().isoformat(),
                "history": [],
                "user_info": {}
            }

        # Update last activity
        chat_sessions[session_id]['last_activity'] = datetime.now().isoformat()

        return f(session_id=session_id, *args, **kwargs)

    return decorated_function

@app.route("/api/ai-chat", methods=["POST"])
@require_session_id
def ai_chat(session_id):
    """Main chat endpoint"""

    if not bot or not bot.client:
        logger.error("❌ Chatbot service unavailable")
        return jsonify({
            "success": False,
            "error": "Dịch vụ AI chưa sẵn sàng",
            "reply": "Xin lỗi, tôi gặp sự cố cấu hình kỹ thuật. Vui lòng kiểm tra API Key và training data."
        }), 503

    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        message = (data.get("message") or "").strip()
        user_context = data.get("user_context", {})

        # Validate message
        is_valid, error_msg = bot.validate_message(message)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": error_msg,
                "message": message
            }), 400

        logger.info(f"📨 Chat - Session: {session_id}, Message: {message[:50]}...")

        # Get AI response
        reply = bot.get_reply(message)

        # Get follow-up suggestions
        followups = bot.get_contextual_followup(reply, message)

        # Store in session history
        chat_record = {
            "timestamp": datetime.now().isoformat(),
            "user_message": message,
            "bot_reply": reply,
            "followup_questions": followups,
            "user_context": user_context
        }

        chat_sessions[session_id]["history"].append(chat_record)

        # Keep only last 50 messages
        if len(chat_sessions[session_id]["history"]) > 50:
            chat_sessions[session_id]["history"] = chat_sessions[session_id]["history"][-50:]

        logger.info(f"✅ Response sent to session {session_id}")

        return jsonify({
            "success": True,
            "reply": reply,
            "followup_questions": followups,
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id,
            "message_count": len(chat_sessions[session_id]["history"])
        }), 200

    except RuntimeError as e:
        logger.error(f"⚠️ External service error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Lỗi kết nối dịch vụ ngoài",
            "reply": "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau."
        }), 503

    except Exception as e:
        logger.error(f"❌ Internal error in ai_chat: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "Đã xảy ra lỗi nội bộ",
            "reply": "Xin lỗi, tôi gặp sự cố nội bộ. Vui lòng thử lại sau."
        }), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""

    # Cleanup old sessions
    cleaned = cleanup_old_sessions()

    if not bot:
        return jsonify({
            "status": "unhealthy",
            "error": "Chatbot not initialized",
            "timestamp": datetime.now().isoformat()
        }), 503

    status = bot.get_status()

    health_data = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len(chat_sessions),
        "sessions_cleaned": cleaned,
        "bot_status": status
    }

    return jsonify(health_data), 200

@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Get all available question categories"""
    try:
        if not bot:
            return jsonify({"success": False, "error": "Chatbot not initialized"}), 503

        categories = bot.get_categories()

        logger.info(f"📚 Retrieved {len(categories)} categories")

        return jsonify({
            "success": True,
            "categories": categories,
            "count": len(categories)
        }), 200

    except Exception as e:
        logger.error(f"❌ Error getting categories: {str(e)}")
        return jsonify({"success": False, "error": "Failed to get categories"}), 500

@app.route("/api/status", methods=["GET"])
def get_status():
    """Get chatbot status and statistics"""
    try:
        if not bot:
            return jsonify({
                "success": False,
                "error": "Chatbot not initialized"
            }), 503

        status = bot.get_status()

        return jsonify({
            "success": True,
            "status": status,
            "active_sessions": len(chat_sessions)
        }), 200

    except Exception as e:
        logger.error(f"❌ Error getting status: {str(e)}")
        return jsonify({"success": False, "error": "Failed to get status"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found",
        "message": "Tài nguyên yêu cầu không tồn tại"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"❌ Internal server error: {str(error)}")
    return jsonify({
        "success": False,
        "error": "Internal server error",
        "message": "Xảy ra lỗi nội bộ. Vui lòng thử lại sau"
    }), 500

@app.before_request
def log_request():
    """Log incoming requests"""
    if not request.path.startswith('/api/health'):
        logger.info(f"➡️  {request.method} {request.path}")

@app.after_request
def log_response(response):
    """Log response status"""
    if not request.path.startswith('/api/health'):
        logger.info(f"⬅️  Response: {response.status_code}")
    return response

if __name__ == "__main__":
    port = int(os.getenv("CHATBOT_PORT", 8000))
    debug = os.getenv("FLASK_ENV", "production") == "development"

    # Initialize chatbot
    logger.info("📂 Initializing chatbot...")
    if not initialize_chatbot():
        logger.error("❌ Failed to initialize chatbot. Exiting.")
        sys.exit(1)

    logger.info(f"🚀 Starting chatbot server on port {port} (debug={debug})")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        threaded=True
    )