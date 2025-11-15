import json
import os
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError
import chromadb

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(parent_dir, 'backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

logging.basicConfig(level=logging.INFO)

class ChatBot:
    def __init__(self, data_file="UNUSED"):
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set.")

            self.client = genai.Client(api_key=api_key)
            self.model = "gemini-1.5-flash"
            self.embedding_model = 'text-embedding-004'
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
            raise

        try:
            CHROMA_PATH = "chroma_db"
            self.chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
            self.collection = self.chroma_client.get_collection(name="chatbot_knowledge")
            logging.info(f"Loaded Knowledge Vector Store with {self.collection.count()} documents.")
            if self.collection.count() == 0:
                logging.warning("Knowledge Vector Store rỗng. Vui lòng chạy python index_data.py để tạo lại dữ liệu.")

        except Exception as e:
            logging.error(f"Failed to load ChromaDB knowledge collection: {e}. Đảm bảo đã chạy index_data.py.")
            self.collection = None

        try:
            FILES_CHROMA_PATH = "chroma_db_files"
            self.files_chroma_client = chromadb.PersistentClient(path=FILES_CHROMA_PATH)
            try:
                self.files_collection = self.files_chroma_client.get_collection(name="uploaded_files")
                logging.info(f"Loaded Files Vector Store with documents.")
            except:
                self.files_collection = self.files_chroma_client.create_collection(
                    name="uploaded_files",
                    metadata={"hnsw:space": "cosine"}
                )
                logging.info("Created new Files Vector Store.")
        except Exception as e:
            logging.error(f"Failed to initialize files collection: {e}")
            self.files_collection = None

    def _build_system_instruction(self, context_type="knowledge") -> str:
        if context_type == "files":
            return (
                "Bạn là trợ lý AI thông minh, chuyên phân tích và trả lời câu hỏi dựa trên nội dung các tài liệu đã được tải lên. "
                "Nhiệm vụ của bạn là trả lời các câu hỏi **CHỈ** dựa trên thông tin trong phần **NGỮ CẢNH (CONTEXT)** được cung cấp từ các file đã upload. "
                "Luôn trích dẫn nguồn file khi trả lời. "
                "Nếu thông tin không có trong ngữ cảnh, hãy nói rõ là thông tin này không có trong các tài liệu đã tải lên.\n"
            )
        else:
            return (
                "Bạn là trợ lý AI thông minh, thân thiện, chuyên tư vấn về **Hệ thống Quản lý Minh chứng (Evidence Management System)** "
                "tại VNUA. Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng **CHỈ** dựa trên kiến thức được cung cấp trong phần **NGỮ CẢNH (CONTEXT)**. "
                "Không suy luận hay thêm thông tin ngoài ngữ cảnh. "
                "Nếu câu hỏi nằm ngoài phạm vi, hãy trả lời chính xác và duy nhất bằng câu: 'Xin lỗi, tôi chỉ có thể hỗ trợ các vấn đề liên quan đến hệ thống quản lý minh chứng.'\n"
            )

    def get_reply(self, message: str) -> str:
        if not self.collection:
            return "Dịch vụ AI hoặc Kho Vector chưa được khởi tạo. Vui lòng kiểm tra API Key và đảm bảo đã chạy index_data.py."

        try:
            embedding_response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=[message]
            )
            query_embedding = embedding_response.embedding

            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=3,
                include=['documents', 'distances', 'metadatas']
            )

            retrieved_documents = results['documents'][0]
            distances = results['distances'][0]

        except Exception as e:
            logging.error(f"Error during Knowledge Vector Retrieval: {e}")
            return "Xin lỗi, tôi gặp lỗi khi tìm kiếm trong kho kiến thức. Vui lòng thử lại."

        context_chunks = []
        for doc, dist in zip(retrieved_documents, distances):
            similarity_score = 1 - dist
            context_chunks.append(f"[Score: {similarity_score:.3f}] - {doc}")

        context = "\n".join(context_chunks)

        system_prompt = self._build_system_instruction("knowledge")

        final_prompt = (
            f"**NGỮ CẢNH (CONTEXT) - Chỉ trả lời dựa trên thông tin này:**\n"
            f"{context}\n\n"
            f"**CÂU HỎI NGƯỜI DÙNG (USER QUESTION):** {message}\n"
            "**TRẢ LỜI:**"
        )

        try:
            model = self.client.models.generate_content(
                model=self.model,
                contents=final_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3,
                    max_output_tokens=250,
                    safety_settings=self.safety_settings
                )
            )

            reply = model.text.strip()

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

    def get_reply_from_files(self, message: str) -> str:
        if not self.files_collection:
            return "Dịch vụ AI hoặc Kho Files chưa được khởi tạo. Vui lòng kiểm tra cấu hình."

        try:
            embedding_response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=[message]
            )
            query_embedding = embedding_response.embedding

            results = self.files_collection.query(
                query_embeddings=[query_embedding],
                n_results=5,
                include=['documents', 'distances', 'metadatas']
            )

            if not results['documents'][0]:
                return "Không tìm thấy thông tin liên quan trong các file đã upload. Vui lòng upload file chứa thông tin bạn cần hỏi."

            retrieved_documents = results['documents'][0]
            distances = results['distances'][0]
            metadatas = results['metadatas'][0]

        except Exception as e:
            logging.error(f"Error during Files Vector Retrieval: {e}")
            return "Xin lỗi, tôi gặp lỗi khi tìm kiếm trong các file đã upload."

        context_chunks = []
        files_referenced = set()

        for doc, dist, metadata in zip(retrieved_documents, distances, metadatas):
            similarity_score = 1 - dist
            filename = metadata.get('filename', 'Unknown')
            files_referenced.add(filename)
            context_chunks.append(
                f"[File: {filename} | Score: {similarity_score:.3f}]\n{doc}"
            )

        context = "\n\n".join(context_chunks)
        files_list = ", ".join(files_referenced)

        system_prompt = self._build_system_instruction("files")

        final_prompt = (
            f"**NGỮ CẢNH TỪ CÁC FILE ĐÃ UPLOAD:**\n"
            f"Các file được tham khảo: {files_list}\n\n"
            f"{context}\n\n"
            f"**CÂU HỎI NGƯỜI DÙNG:** {message}\n"
            f"**TRẢ LỜI (nhớ trích dẫn nguồn file khi cần thiết):**"
        )

        try:
            model = self.client.models.generate_content(
                model=self.model,
                contents=final_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3,
                    max_output_tokens=400,
                    safety_settings=self.safety_settings
                )
            )

            reply = model.text.strip()

            if files_referenced:
                reply += f"\n\n📎 *Nguồn tham khảo: {files_list}*"

            return reply

        except APIError as e:
            logging.error(f"Error calling Gemini API for files: {e}")
            return "Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn."
        except Exception as e:
            logging.error(f"Error in get_reply_from_files: {e}")
            return "Xin lỗi, đã xảy ra lỗi không mong muốn."

    def summarize_text(self, text: str, max_length: int = 500) -> str:
        try:
            if len(text) > 10000:
                text = text[:10000] + "..."

            prompt = f"""Hãy tóm tắt nội dung sau đây một cách ngắn gọn và súc tích trong khoảng {max_length} ký tự.
            Tập trung vào các ý chính và thông tin quan trọng nhất.
            
            Nội dung cần tóm tắt:
            {text}
            
            Tóm tắt:"""

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=max_length // 4,
                    safety_settings=self.safety_settings
                )
            )

            return response.text.strip()

        except Exception as e:
            logging.error(f"Error in summarize_text: {e}")
            return "Lỗi khi tóm tắt văn bản"

    def get_contextual_followup(self, last_reply: str) -> list[str]:
        if "xin lỗi" in last_reply.lower() or "không tìm thấy" in last_reply.lower():
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