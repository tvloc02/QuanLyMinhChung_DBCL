import json
import os
import logging
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError
from datetime import datetime
import re
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(parent_dir, '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    logger.warning(f"⚠️ .env file not found at {dotenv_path}")

class ChatBot:
    def __init__(self, data_file=None):
        """Initialize ChatBot with training data and Gemini API"""

        # Determine correct path to training data
        if data_file is None:
            # Try multiple possible locations
            possible_paths = [
                # Current directory
                os.path.join(os.getcwd(), "training_data.json"),
                os.path.join(os.getcwd(), "model", "training_data.json"),
                # Parent directory
                os.path.join(os.path.dirname(__file__), "training_data.json"),
                os.path.join(os.path.dirname(__file__), "model", "training_data.json"),
                # Project root
                os.path.join(os.path.dirname(os.path.dirname(__file__)), "training_data.json"),
                # With enhanced name
                os.path.join(os.getcwd(), "training_data_enhanced.json"),
                os.path.join(os.path.dirname(__file__), "training_data_enhanced.json"),
            ]

            data_file = None
            for path in possible_paths:
                if os.path.exists(path):
                    data_file = path
                    logger.info(f"✅ Found training data at: {path}")
                    break

            if not data_file:
                logger.error(f"❌ Training data file not found in any of these locations:")
                for path in possible_paths:
                    logger.error(f"   - {path}")
                raise FileNotFoundError("training_data.json not found")

        # Load training data
        self.training_data = self._load_training_data(data_file)
        self.conversation_context = []
        self.data_file_path = data_file

        # Initialize Gemini Client
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("❌ GEMINI_API_KEY environment variable not set")

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

            logger.info("✅ ChatBot initialized successfully with Gemini API")

        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini Client: {e}")
            self.client = None
            raise

    def _load_training_data(self, data_file: str) -> List[Dict]:
        """Load training data from JSON file with multiple fallback options"""

        logger.info(f"📂 Attempting to load training data from: {data_file}")

        try:
            # Check if file exists
            if not os.path.exists(data_file):
                logger.error(f"❌ File does not exist: {data_file}")
                logger.info(f"📂 Current working directory: {os.getcwd()}")
                logger.info(f"📂 Script directory: {os.path.dirname(__file__)}")
                raise FileNotFoundError(f"Training data file not found: {data_file}")

            with open(data_file, encoding="utf-8") as f:
                data = json.load(f)

                # Validate data structure
                if not isinstance(data, list):
                    logger.error(f"❌ Training data is not a list, it's a {type(data)}")
                    return []

                logger.info(f"✅ Loaded {len(data)} training data items from {data_file}")

                # Log sample of loaded data
                if data:
                    logger.info(f"📝 Sample Q&A:")
                    logger.info(f"   Q: {data[0].get('question', 'N/A')[:60]}")
                    logger.info(f"   Category: {data[0].get('category', 'N/A')}")

                return data

        except FileNotFoundError as e:
            logger.error(f"❌ FileNotFoundError: {e}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {e}")
            logger.error(f"   Make sure the JSON file is valid")
            return []
        except Exception as e:
            logger.error(f"❌ Unexpected error loading training data: {e}")
            return []

    def _find_relevant_qa(self, message: str, top_k: int = 3) -> List[Dict]:
        """Find relevant Q&A from training data using keyword matching"""

        if not self.training_data:
            logger.warning("⚠️ No training data available")
            return []

        message_lower = message.lower()
        scored_items = []

        for item in self.training_data:
            score = 0

            # Check keywords
            if 'keywords' in item:
                keywords = item['keywords']
                if isinstance(keywords, list):
                    for keyword in keywords:
                        if keyword.lower() in message_lower:
                            score += 2

            # Check question
            if 'question' in item:
                question_words = set(item['question'].lower().split())
                message_words = set(message_lower.split())
                common_words = question_words & message_words
                score += len(common_words)

            # Check category for partial match
            if 'category' in item and score > 0:
                score += 0.5

            if score > 0:
                scored_items.append((score, item))

        # Sort by score and return top K
        scored_items.sort(key=lambda x: x[0], reverse=True)
        result = [item for _, item in scored_items[:top_k]]

        logger.debug(f"🔍 Found {len(result)} relevant Q&As for: {message[:50]}")
        return result

    def _build_system_prompt(self) -> str:
        """Build system prompt with training data"""

        system_prompt = (
            "Bạn là trợ lý AI thông minh, thân thiện, chuyên tư vấn về "
            "**Hệ thống Quản lý Minh chứng (Evidence Management System)** tại CMC. "
            "\n\nNhiệm vụ chính của bạn:\n"
            "1. Trả lời câu hỏi về hệ thống dựa trên kiến thức được cung cấp\n"
            "2. Hướng dẫn người dùng sử dụng các chức năng\n"
            "3. Hỗ trợ xử lý sự cố\n"
            "4. Cung cấp thông tin về quy trình và phân quyền\n"
            "\n**HƯỚNG DẪN TRẢ LỜI:**\n"
            "- Nếu câu hỏi liên quan đến hệ thống, hãy trả lời chi tiết\n"
            "- Nếu câu hỏi không liên quan, hãy nói: 'Xin lỗi, tôi chỉ có thể hỗ trợ các vấn đề liên quan đến Hệ thống Quản lý Minh chứng.'\n"
            "- Luôn thân thiện, hỗ trợ, và cụ thể\n"
            "- Định dạng rõ ràng, dễ hiểu (dùng bullets, steps)\n"
            "\n**DỮ LIỆU HUẤN LUYỆN (Q&A):**\n"
        )

        # Add training data as context
        qa_count = len(self.training_data) if self.training_data else 0

        if not self.training_data:
            system_prompt += "(⚠️ No training data loaded - using general knowledge)\n"
        else:
            for item in self.training_data:
                category = item.get('category', 'General')
                question = item.get('question', '')
                answer = item.get('answer', '')
                keywords = ', '.join(item.get('keywords', []))

                system_prompt += f"\n[{category}]\n"
                system_prompt += f"Q: {question}\n"
                system_prompt += f"A: {answer}\n"
                if keywords:
                    system_prompt += f"Keywords: {keywords}\n"

        logger.info(f"✅ System prompt built with {qa_count} Q&As")
        return system_prompt

    def get_reply(self, message: str) -> str:
        """Get AI reply for user message"""

        if not self.client:
            logger.error("❌ Gemini client not initialized")
            return "Dịch vụ AI chưa được khởi tạo. Vui lòng kiểm tra API Key."

        try:
            # Validate input
            message = message.strip()
            if not message:
                return "Vui lòng nhập câu hỏi của bạn."

            if len(message) > 1000:
                return "Câu hỏi quá dài. Vui lòng rút gọn câu hỏi của bạn."

            # Find relevant training data
            relevant_qa = self._find_relevant_qa(message, top_k=5)

            system_prompt = self._build_system_prompt()

            # Build context for conversation
            context = "\n\n**RELEVANT TRAINING DATA FOR THIS QUESTION:**\n"
            if relevant_qa:
                for qa in relevant_qa:
                    context += f"Q: {qa.get('question', '')}\n"
                    context += f"A: {qa.get('answer', '')}\n\n"
            else:
                context = "\n\n(No directly relevant training data found - use general knowledge about the system)"

            full_prompt = f"{system_prompt}{context}\n\nUser Question: {message}"

            logger.info(f"📨 Processing message: {message[:50]}...")

            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=300,
                    safety_settings=self.safety_settings
                )
            )

            reply = response.text.strip()

            # Check for out-of-scope responses
            unrelated_phrases = [
                "xin lỗi, tôi chỉ có thể hỗ trợ",
                "không liên quan",
                "ngoài phạm vi"
            ]

            is_unrelated = any(phrase in reply.lower() for phrase in unrelated_phrases)
            if is_unrelated and len(relevant_qa) == 0:
                return "Xin lỗi, câu hỏi này nằm ngoài phạm vi hỗ trợ của tôi. Tôi chỉ có thể hỗ trợ về Hệ thống Quản lý Minh chứng. Vui lòng đưa ra câu hỏi khác hoặc liên hệ team support."

            # Add to conversation context
            self.conversation_context.append({
                "timestamp": datetime.now().isoformat(),
                "user_message": message,
                "bot_reply": reply,
                "relevant_topics": [qa.get('category', 'Unknown') for qa in relevant_qa]
            })

            # Keep only last 10 messages
            if len(self.conversation_context) > 10:
                self.conversation_context = self.conversation_context[-10:]

            logger.info(f"✅ Reply generated successfully")
            return reply

        except APIError as e:
            logger.error(f"❌ Gemini API error: {e}")
            return "Xin lỗi, tôi gặp sự cố kỹ thuật khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."

        except Exception as e:
            logger.error(f"❌ Unexpected error in get_reply: {e}")
            return "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau hoặc liên hệ support."

    def get_contextual_followup(self, last_reply: str, last_message: str = "") -> List[str]:
        """Generate contextual follow-up questions"""

        if not self.client:
            logger.warning("⚠️ Gemini client not initialized, skipping follow-up generation")
            return []

        try:
            # Check if response is about out-of-scope
            if "xin lỗi, câu hỏi này nằm ngoài phạm vi" in last_reply.lower():
                return []

            prompt = (
                f"Dựa trên câu trả lời cuối cùng này từ trợ lý AI:\n'{last_reply}'\n\n"
                "Hãy đề xuất 3 câu hỏi tiếp theo ngắn gọn (dưới 10 từ) mà người dùng có thể hỏi tiếp.\n\n"
                "Chỉ trả lời bằng 3 câu hỏi, mỗi câu nằm trên một dòng, không có số thứ tự."
            )

            logger.info("💭 Generating follow-up questions...")

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
            suggestions = [
                s.strip()
                for s in suggestions_text.split('\n')
                if s.strip() and len(s.strip()) > 5
            ]

            # Clean up suggestions
            cleaned_suggestions = []
            for s in suggestions[:3]:
                cleaned = re.sub(r'^[\d\.\)\-\s]+', '', s).strip()
                if cleaned:
                    cleaned_suggestions.append(cleaned)

            logger.info(f"✅ Generated {len(cleaned_suggestions)} follow-up questions")
            return cleaned_suggestions[:3]

        except APIError as e:
            logger.error(f"❌ API error generating follow-up: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Error in get_contextual_followup: {e}")
            return []

    def search_qa(self, query: str) -> List[Dict]:
        """Search through training data for relevant Q&A"""

        relevant = self._find_relevant_qa(query, top_k=5)
        logger.info(f"🔍 Search for '{query}' found {len(relevant)} results")
        return relevant

    def get_categories(self) -> List[str]:
        """Get all available categories"""

        categories = set()
        for item in self.training_data:
            if 'category' in item:
                categories.add(item['category'])

        result = sorted(list(categories))
        logger.info(f"📚 Retrieved {len(result)} categories")
        return result

    def get_qa_by_category(self, category: str) -> List[Dict]:
        """Get all Q&A items for a specific category"""

        result = [
            item for item in self.training_data
            if item.get('category', '').lower() == category.lower()
        ]
        logger.info(f"📖 Retrieved {len(result)} items for category '{category}'")
        return result

    def get_all_questions(self) -> List[str]:
        """Get all available questions"""

        return [item.get('question', '') for item in self.training_data if 'question' in item]

    def validate_message(self, message: str) -> Tuple[bool, Optional[str]]:
        """Validate user message"""

        if not message:
            return False, "Vui lòng nhập một câu hỏi."

        if len(message.strip()) < 3:
            return False, "Câu hỏi quá ngắn. Vui lòng nhập chi tiết hơn."

        if len(message) > 1000:
            return False, "Câu hỏi quá dài (tối đa 1000 ký tự)."

        # Check for spam
        if re.search(r'(.)\1{9,}', message):
            return False, "Tin nhắn có dấu hiệu spam. Vui lòng nhập lại."

        return True, None

    def clear_context(self):
        """Clear conversation context"""
        self.conversation_context = []
        logger.info("🗑️ Conversation context cleared")

    def get_conversation_context(self) -> List[Dict]:
        """Get current conversation context"""
        return self.conversation_context

    def get_status(self) -> Dict:
        """Get chatbot status"""
        return {
            "initialized": self.client is not None,
            "training_data_loaded": len(self.training_data),
            "categories": len(self.get_categories()),
            "data_file": self.data_file_path,
            "timestamp": datetime.now().isoformat()
        }