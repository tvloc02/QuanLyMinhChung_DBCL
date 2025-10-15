import json
import os
import logging
from openai import OpenAI
from dotenv import load_dotenv
from difflib import SequenceMatcher

# FIX LỖI OPENAI_API_KEY environment variable not set: Load .env từ thư mục gốc
# Đường dẫn: chatbot/model/ -> ../../.env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=dotenv_path)

logging.basicConfig(level=logging.INFO)

class ChatBot:
    def __init__(self, data_file="model/training_data.json"):
        try:
            with open(data_file, encoding="utf-8") as f:
                self.data = json.load(f)
        except Exception as e:
            self.data = []
            logging.error(f"Error loading training data: {e}")

        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set.")

            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4o-mini"

        except Exception as e:
            logging.error(f"Failed to initialize OpenAI Client: {e}")
            self.client = None
            raise # Bắt buộc phải raise để main.py bắt và trả về 503

    def _build_system_prompt(self) -> str:
        prompt = (
            "Bạn là trợ lý AI thông minh, thân thiện, chuyên tư vấn về **Hệ thống Quản lý Minh chứng (Evidence Management System)** "
            "tại VNUA. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng **CHỈ** dựa trên kiến thức được cung cấp dưới đây. "
            "Nếu câu hỏi nằm ngoài phạm vi, hãy trả lời chính xác và duy nhất bằng câu: 'Xin lỗi, tôi chỉ có thể hỗ trợ các vấn đề liên quan đến hệ thống quản lý minh chứng.'\n\n"
            "**DỮ LIỆU HUẤN LUYỆN TÙY CHỈNH (Q&A):**\n"
        )

        for item in self.data:
            prompt += f"Q: {item['question']}\nA: {item['answer']}\n"

        return prompt

    def get_reply(self, message: str) -> str:
        if not self.client:
            return "Dịch vụ AI chưa được khởi tạo. Vui lòng kiểm tra API Key."

        system_prompt = self._build_system_prompt()

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=250
            )

            reply = response.choices[0].message.content.strip()

            # XỬ LÝ CÂU TRẢ LỜI KHÔNG PHÙ HỢP
            unrelated_phrase = "xin lỗi, tôi chỉ có thể hỗ trợ các vấn đề liên quan đến hệ thống quản lý minh chứng"
            if unrelated_phrase in reply.lower():
                return "Xin lỗi, tôi chưa hiểu câu hỏi này vì nó không liên quan đến Hệ thống Quản lý Minh chứng. Vui lòng đưa ra câu hỏi đúng hoặc chọn từ các gợi ý."

            return reply

        except Exception as e:
            logging.error(f"Error calling OpenAI API: {e}")
            raise RuntimeError("OpenAI API call failed.")

    def get_contextual_followup(self, last_reply: str) -> list[str]:
        if not self.client:
            return []

        if "xin lỗi, tôi chưa hiểu câu hỏi này" in last_reply.lower():
            return []

        prompt = (
            f"Dựa trên câu trả lời cuối cùng này: '{last_reply}'. "
            "Hãy đề xuất 3 câu hỏi tiếp theo ngắn gọn (dưới 10 từ) mà người dùng có thể hỏi. "
            "Chỉ trả lời bằng 3 câu hỏi, mỗi câu nằm trên một dòng, không có số thứ tự hay ký tự đặc biệt."
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=100
            )

            suggestions_text = response.choices[0].message.content.strip()
            suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]

            return suggestions[:3]

        except Exception as e:
            logging.error(f"Error generating follow-up suggestions: {e}")
            return []