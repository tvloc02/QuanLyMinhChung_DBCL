from flask import Flask, request, jsonify
from flask_cors import CORS
from model.chatbot import ChatBot
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('chatbot.log'),
        logging.StreamHandler()
    ]
)

try:
    # Đảm bảo đường dẫn này đúng hoặc bạn có thể truyền thẳng tên file nếu nó cùng thư mục
    bot = ChatBot(data_file="training_data.json")
    logging.info("Chatbot initialized successfully")
except Exception as e:
    logging.error(f"Failed to initialize chatbot: {str(e)}")
    bot = None

chat_history = {}

@app.route("/api/ai-chat", methods=["POST"])
def ai_chat():
    if not bot or not bot.client:
        return jsonify({
            "error": "Dịch vụ AI chưa sẵn sàng",
            "reply": "Xin lỗi, tôi gặp sự cố cấu hình kỹ thuật. Vui lòng kiểm tra API Key."
        }), 503

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        message = data.get("message", "").strip()
        session_id = data.get("session_id", "default")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        reply = bot.get_reply(message)

        followups = bot.get_contextual_followup(reply)

        if session_id not in chat_history:
            chat_history[session_id] = []

        chat_history[session_id].append({
            "timestamp": datetime.now().isoformat(),
            "user_message": message,
            "bot_reply": reply
        })

        if len(chat_history[session_id]) > 50:
            chat_history[session_id] = chat_history[session_id][-50:]

        logging.info(f"Chat - Session: {session_id}, Message: {message[:50]}")

        return jsonify({
            "reply": reply,
            "followup_questions": followups,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        logging.error(f"Error in ai_chat: {str(e)}")
        return jsonify({
            "error": "Đã xảy ra lỗi khi xử lý yêu cầu",
            "reply": "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau."
        }), 500

@app.route("/api/chat-history/<session_id>", methods=["GET"])
def get_chat_history(session_id):
    try:
        history = chat_history.get(session_id, [])
        return jsonify({
            "session_id": session_id,
            "history": history,
            "count": len(history)
        })
    except Exception as e:
        logging.error(f"Error getting chat history: {str(e)}")
        return jsonify({"error": "Failed to get chat history"}), 500

@app.route("/api/clear-history/<session_id>", methods=["DELETE"])
def clear_history(session_id):
    try:
        if session_id in chat_history:
            del chat_history[session_id]
        return jsonify({"message": "History cleared successfully"})
    except Exception as e:
        logging.error(f"Error clearing history: {str(e)}")
        return jsonify({"error": "Failed to clear history"}), 500

@app.route("/api/suggestions", methods=["GET"])
def get_suggestions():
    suggestions = [
        {
            "category": "Bắt đầu",
            "questions": [
                "Hệ thống quản lý minh chứng là gì?",
                "Làm thế nào để đăng nhập?",
                "Hướng dẫn sử dụng cơ bản"
            ]
        },
        {
            "category": "Quản lý minh chứng",
            "questions": [
                "Tạo minh chứng mới như thế nào?",
                "Tìm kiếm minh chứng",
                "Sửa và xóa minh chứng",
                "Sao chép minh chứng"
            ]
        },
        {
            "category": "Import & Export",
            "questions": [
                "Import minh chứng từ Excel",
                "Import cây thư mục",
                "Xuất báo cáo minh chứng"
            ]
        },
        {
            "category": "Quản lý hệ thống",
            "questions": [
                "Phân quyền người dùng",
                "Quản lý tiêu chuẩn và tiêu chí",
                "Xem thống kê và báo cáo"
            ]
        },
        {
            "category": "Hỗ trợ",
            "questions": [
                "Xử lý khi gặp lỗi",
                "Không tải được file",
                "Liên hệ hỗ trợ"
            ]
        }
    ]
    return jsonify({"suggestions": suggestions})

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    try:
        data = request.get_json()
        message = data.get("message")
        reply = data.get("reply")
        rating = data.get("rating")
        comment = data.get("comment", "")

        feedback_entry = {
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "reply": reply,
            "rating": rating,
            "comment": comment
        }

        logging.info(f"Feedback received: {feedback_entry}")

        return jsonify({
            "message": "Cảm ơn bạn đã đóng góp ý kiến!",
            "success": True
        })

    except Exception as e:
        logging.error(f"Error submitting feedback: {str(e)}")
        return jsonify({"error": "Failed to submit feedback"}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy" if bot else "unhealthy",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len(chat_history)
    })

@app.route("/api/quick-actions", methods=["GET"])
def get_quick_actions():
    actions = [
        {
            "id": "create_evidence",
            "label": "Tạo minh chứng mới",
            "description": "Hướng dẫn tạo minh chứng từng bước",
            "icon": "plus-circle"
        },
        {
            "id": "search_evidence",
            "label": "Tìm kiếm minh chứng",
            "description": "Cách tìm kiếm và lọc minh chứng",
            "icon": "search"
        },
        {
            "id": "import_data",
            "label": "Import dữ liệu",
            "description": "Import từ Excel hoặc folder",
            "icon": "upload"
        },
        {
            "id": "export_report",
            "label": "Xuất báo cáo",
            "description": "Tạo và xuất báo cáo",
            "icon": "download"
        },
        {
            "id": "manage_users",
            "label": "Quản lý người dùng",
            "description": "Phân quyền và quản lý user",
            "icon": "users"
        }
    ]
    return jsonify({"actions": actions})

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)