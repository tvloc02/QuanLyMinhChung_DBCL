import json
import os
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(parent_dir, '.env')
load_dotenv(dotenv_path=dotenv_path)

logging.basicConfig(level=logging.INFO)

class ChatBot:
    def __init__(self, data_file="/training_data.json"):
        try:
            with open(data_file, encoding="utf-8") as f:
                self.data = json.load(f)
        except Exception as e:
            self.data = []
            logging.error(f"Error loading training data: {e}")

        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set.")

            # Khởi tạo Gemini Client
            self.client = genai.Client(api_key=api_key)
            self.model = "gemini-2.5-flash"
            self.safety_settings = [
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
            ]

        except Exception as e:
            logging.error(f"Failed to initialize Gemini Client: {e}")
            self.client = None
            raise

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
            # Gửi system prompt và user message
            response = self.client.models.generate_content(
                model=self.model,
                contents=f"{system_prompt}\n\nUser Question: {message}",
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt, # Sử dụng system_instruction
                    temperature=0.3,
                    max_output_tokens=250,
                    safety_settings=self.safety_settings
                )
            )

            reply = response.text.strip()

            unrelated_phrase = "xin lỗi, tôi chỉ có thể hỗ trợ các vấn đề liên quan đến hệ thống quản lý minh chứng"
            if unrelated_phrase in reply.lower():
                return "Xin lỗi, tôi chưa hiểu câu hỏi này vì nó không liên quan đến Hệ thống Quản lý Minh chứng. Vui lòng đưa ra câu hỏi đúng hoặc chọn từ các gợi ý."

            return reply

        except APIError as e:
            logging.error(f"Error calling Gemini API: {e}")
            raise RuntimeError("Gemini API call failed.")
        except Exception as e:
            logging.error(f"Error in get_reply: {e}")
            raise RuntimeError("Gemini API call failed due to an unknown error.")

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
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=100,
                    safety_settings=self.safety_settings
                )
            )

            suggestions_text = response.text.strip()
            suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]

            return suggestions[:3]

        except APIError as e:
            logging.error(f"Error generating follow-up suggestions: {e}")
            return []
        except Exception as e:
            logging.error(f"Error in get_contextual_followup: {e}")
            return []