import json
import os
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError
import chromadb # <--- THÊM THƯ VIỆN CHROMA

# Thiết lập đường dẫn biến môi trường
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(parent_dir, 'backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

logging.basicConfig(level=logging.INFO)

class ChatBot:
    def __init__(self, data_file="UNUSED"):
        # 1. Khởi tạo Gemini Client và Mô hình
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set.")

            self.client = genai.Client(api_key=api_key)
            self.model = "gemini-2.5-flash"
            self.embedding_model = 'text-embedding-004' # Mô hình Embeddings
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

        # 2. Khởi tạo và Tải ChromaDB Vector Store
        try:
            CHROMA_PATH = "chroma_db"
            self.chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
            # Lấy collection đã tạo từ index_data.py
            self.collection = self.chroma_client.get_collection(name="chatbot_knowledge")
            logging.info(f"Loaded Vector Store with {self.collection.count()} documents.")
            if self.collection.count() == 0:
                logging.warning("Vector Store rỗng. Vui lòng chạy python index_data.py để tạo lại dữ liệu.")

        except Exception as e:
            logging.error(f"Failed to load ChromaDB collection: {e}. Đảm bảo đã chạy index_data.py.")
            self.collection = None
            # Không raise lỗi ở đây để main.py có thể kiểm tra self.client/self.collection

    def _build_system_instruction(self) -> str:
        """Tạo system instruction cơ bản cho mô hình sinh (Generation model)."""
        return (
            "Bạn là trợ lý AI thông minh, thân thiện, chuyên tư vấn về **Hệ thống Quản lý Minh chứng (Evidence Management System)** "
            "tại VNUA. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng **CHỈ** dựa trên kiến thức được cung cấp trong phần **NGỮ CẢNH (CONTEXT)**. "
            "Không suy luận hay thêm thông tin ngoài ngữ cảnh. "
            "Nếu câu hỏi nằm ngoài phạm vi, hãy trả lời chính xác và duy nhất bằng câu: 'Xin lỗi, tôi chỉ có thể hỗ trợ các vấn đề liên quan đến hệ thống quản lý minh chứng.'\n"
        )

    # Thay thế hoàn toàn logic RAG cũ bằng Vector Search RAG
    def get_reply(self, message: str) -> str:
        if not self.client or not self.collection:
            return "Dịch vụ AI hoặc Kho Vector chưa được khởi tạo. Vui lòng kiểm tra API Key và đảm bảo đã chạy index_data.py."

        # --- BƯỚC 1: TRUY VẤN DỮ LIỆU (RETRIEVAL) ---
        try:
            # 1.1 Vector hóa câu hỏi (từ message)
            query_embedding = self.client.models.embed_content(
                model=self.embedding_model,
                contents=message,
                # task_type đã bị xóa
            ).embedding

            # 1.2 Truy vấn ChromaDB để tìm các đoạn văn bản liên quan
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=3, # Lấy 3 đoạn văn bản liên quan nhất
                include=['documents', 'distances', 'metadatas']
            )

            # Lấy các đoạn văn bản (chunks) và Độ Tương Đồng (distances)
            retrieved_documents = results['documents'][0]
            distances = results['distances'][0]

        except Exception as e:
            logging.error(f"Error during Vector Retrieval: {e}")
            return "Xin lỗi, tôi gặp lỗi khi tìm kiếm trong kho kiến thức. Vui lòng thử lại."


        # --- BƯỚC 2: XÂY DỰNG PROMPT VÀ GENERATION (TẠO CÂU TRẢ LỜI) ---

        # Tạo chuỗi ngữ cảnh từ các documents được tìm thấy
        context_chunks = []
        for doc, dist in zip(retrieved_documents, distances):
            # Tính Similarity Score (Cosine Similarity: 1 - distance)
            similarity_score = 1 - dist
            # Thêm Score vào ngữ cảnh cho mục đích đo lường (không bắt buộc)
            context_chunks.append(f"[Score: {similarity_score:.3f}] - {doc}")

        context = "\n".join(context_chunks)

        # 2.2 Xây dựng Prompt cuối cùng cho mô hình sinh
        system_prompt = self._build_system_instruction()

        final_prompt = (
            f"**NGỮ CẢNH (CONTEXT) - Chỉ trả lời dựa trên thông tin này:**\n"
            f"{context}\n\n"
            f"**CÂU HỎI NGƯỜI DÙNG (USER QUESTION):** {message}\n"
            "**TRẢ LỜI:**"
        )

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=final_prompt,
                config=types.GenerateContentConfig(
                    # Truyền instruction vào system_instruction để tối ưu hiệu suất
                    system_instruction=system_prompt,
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

    # Hàm get_contextual_followup giữ nguyên
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