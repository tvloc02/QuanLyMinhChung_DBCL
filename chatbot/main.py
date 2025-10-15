from flask import Flask, request, jsonify
from flask_cors import CORS
from model.chatbot import ChatBot

app = Flask(__name__)
CORS(app)
bot = ChatBot()

@app.route("/api/ai-chat", methods=["POST"])
def ai_chat():
    data = request.get_json()
    message = data.get("message", "")
    reply = bot.get_reply(message)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
