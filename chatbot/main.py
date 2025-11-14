from flask import Flask, request, jsonify
from flask_cors import CORS
from model.chatbot import ChatBot
from model.file_processor import FileProcessor
import logging
from datetime import datetime
from dotenv import load_dotenv
import os
import io

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

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
    bot = ChatBot(data_file="/chatbot/model/training_data.json")
    file_processor = FileProcessor()
    logging.info("Chatbot and FileProcessor initialized successfully")
except Exception as e:
    logging.error(f"Failed to initialize: {str(e)}")
    bot = None
    file_processor = None

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
        search_type = data.get("search_type", "knowledge")  # knowledge hoặc files

        if not message:
            return jsonify({"error": "Message is required"}), 400

        # Sử dụng kiến thức từ files đã upload hoặc kiến thức hệ thống
        if search_type == "files":
            reply = bot.get_reply_from_files(message)
        else:
            reply = bot.get_reply(message)

        followups = bot.get_contextual_followup(reply)

        if session_id not in chat_history:
            chat_history[session_id] = []

        chat_history[session_id].append({
            "timestamp": datetime.now().isoformat(),
            "user_message": message,
            "bot_reply": reply,
            "search_type": search_type
        })

        if len(chat_history[session_id]) > 50:
            chat_history[session_id] = chat_history[session_id][-50:]

        logging.info(f"Chat - Session: {session_id}, Message: {message[:50]}")

        return jsonify({
            "reply": reply,
            "followup_questions": followups,
            "timestamp": datetime.now().isoformat()
        })

    except RuntimeError as e:
        logging.error(f"External service error: {str(e)}")
        return jsonify({
            "error": "Lỗi kết nối dịch vụ ngoài",
            "reply": "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau."
        }), 503

    except Exception as e:
        logging.error(f"Internal server error in ai_chat: {str(e)}")
        return jsonify({
            "error": "Đã xảy ra lỗi khi xử lý yêu cầu",
            "reply": "Xin lỗi, tôi gặp sự cố nội bộ. Vui lòng thử lại sau."
        }), 500

@app.route("/api/process-file", methods=["POST"])
def process_file():
    if not file_processor:
        return jsonify({
            "success": False,
            "error": "FileProcessor chưa được khởi tạo"
        }), 503

    try:
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy file"
            }), 400

        file = request.files['file']
        file_id = request.form.get('file_id')

        if not file_id:
            return jsonify({
                "success": False,
                "error": "Thiếu file_id"
            }), 400

        # Đọc nội dung file
        file_content = io.BytesIO(file.read())
        filename = file.filename
        content_type = file.content_type

        # Xử lý file
        result = file_processor.process_file(
            file_content,
            filename,
            content_type,
            file_id
        )

        if result['success']:
            return jsonify({
                "success": True,
                "content": result['content'],
                "summary": result['summary'],
                "vector_id": result['vector_id']
            })
        else:
            return jsonify({
                "success": False,
                "error": result.get('error', 'Lỗi xử lý file')
            }), 500

    except Exception as e:
        logging.error(f"Error processing file: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/delete-vector/<vector_id>", methods=["DELETE"])
def delete_vector(vector_id):
    if not file_processor:
        return jsonify({
            "success": False,
            "error": "FileProcessor chưa được khởi tạo"
        }), 503

    try:
        success = file_processor.delete_vector(vector_id)
        return jsonify({"success": success})
    except Exception as e:
        logging.error(f"Error deleting vector: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/summarize-text", methods=["POST"])
def summarize_text():
    if not bot or not bot.client:
        return jsonify({
            "error": "Dịch vụ AI chưa sẵn sàng"
        }), 503

    try:
        data = request.get_json()
        text = data.get("text", "")
        max_length = data.get("max_length", 500)

        if not text:
            return jsonify({"error": "Text is required"}), 400

        summary = bot.summarize_text(text, max_length)

        return jsonify({
            "success": True,
            "summary": summary
        })

    except Exception as e:
        logging.error(f"Error in summarize: {str(e)}")
        return jsonify({
            "error": "Lỗi khi tóm tắt văn bản"
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

@app.route("/api/get-file-vectors", methods=["GET"])
def get_file_vectors():
    """Lấy danh sách các file đã được vector hóa"""
    if not file_processor:
        return jsonify({
            "success": False,
            "error": "FileProcessor chưa được khởi tạo"
        }), 503

    try:
        vectors_info = file_processor.get_all_vectors_info()
        return jsonify({
            "success": True,
            "vectors": vectors_info
        })
    except Exception as e:
        logging.error(f"Error getting vectors: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

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
        "file_processor": "ready" if file_processor else "not ready",
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