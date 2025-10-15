import json
from difflib import SequenceMatcher

class ChatBot:
    def __init__(self, data_file="model/training_data.json"):
        with open(data_file, encoding="utf-8") as f:
            self.data = json.load(f)

    def get_reply(self, message: str) -> str:
        message = message.lower()
        best = max(
            self.data,
            key=lambda item: SequenceMatcher(None, message, item["question"].lower()).ratio()
        )
        score = SequenceMatcher(None, message, best["question"].lower()).ratio()
        return best["answer"] if score > 0.6 else "Xin lỗi, tôi chưa hiểu câu hỏi này."
