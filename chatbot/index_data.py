import json
import os
import chromadb
from google import genai
from dotenv import load_dotenv

# Tải biến môi trường (Giống trong main.py)
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(parent_dir, 'backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Cấu hình
API_KEY = os.getenv("GEMINI_API_KEY")
EMBEDDING_MODEL = 'text-embedding-004'
CHROMA_PATH = "chroma_db"
DATA_FILE = os.path.join(os.path.dirname(__file__), 'model', 'data_chunks.json')

def get_embeddings(texts, client):
    """Sử dụng Gemini API để lấy vector cho các đoạn văn bản. Xử lý từng đoạn riêng lẻ để tăng tính ổn định."""
    embeddings = []
    print(f"Bắt đầu vector hóa {len(texts)} đoạn văn bản (xử lý từng mục)...")
    for i, text in enumerate(texts):
        try:
            # 1. Gọi API cho từng đoạn văn bản
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=[text], # Vẫn truyền vào list 1 item
            )

            # 2. Truy cập vector qua thuộc tính .values
            # Response cho single content call thường trả về 1 list chứa vector.
            # Ta dùng response.values[0] để lấy vector của item đầu tiên.
            embeddings.append(response.values[0])

        except Exception as e:
            print(f"Lỗi khi vector hóa đoạn {i} ({text[:30]}...): {e}")
            # Nếu lỗi, tiếp tục với đoạn tiếp theo
            continue
    return embeddings

def create_vector_store():
    if not API_KEY:
        print("Lỗi: GEMINI_API_KEY chưa được thiết lập. Vui lòng kiểm tra file .env")
        return

    try:
        client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"Lỗi khởi tạo Gemini Client: {e}")
        return

    # 1. Đọc dữ liệu từ file chunks
    try:
        with open(DATA_FILE, 'r', encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file {DATA_FILE}. Vui lòng tạo file này trước.")
        return

    texts = [item['text'] for item in data]
    ids = [item['id'] for item in data]
    metadatas = [{'source': item['source']} for item in data]

    # 2. Lấy Embeddings
    print(f"Bắt đầu vector hóa {len(texts)} đoạn văn bản...")
    embeddings = get_embeddings(texts, client)
    if embeddings is None:
        return

    # 3. Lưu trữ vào ChromaDB
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Xóa collection cũ nếu tồn tại
    try:
        chroma_client.delete_collection(name="chatbot_knowledge")
    except Exception:
        pass # Bỏ qua lỗi nếu collection không tồn tại

    collection = chroma_client.get_or_create_collection(
        name="chatbot_knowledge",
        # Sử dụng độ đo cosine similarity
        metadata={"hnsw:space": "cosine"}
    )

    # Thêm dữ liệu vào ChromaDB
    collection.add(
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
        ids=ids
    )

    print(f"✅ Đã vector hóa và lưu trữ thành công {collection.count()} documents vào ChromaDB tại thư mục {CHROMA_PATH}")


if __name__ == "__main__":
    create_vector_store()