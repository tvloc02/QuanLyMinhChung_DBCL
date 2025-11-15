import json
import os
import chromadb
from google import genai
from google.genai.errors import APIError
from dotenv import load_dotenv

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(parent_dir, 'backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

API_KEY = os.getenv("GEMINI_API_KEY")
EMBEDDING_MODEL = 'text-embedding-004'
CHROMA_PATH = "chroma_db"
DATA_FILE = os.path.join(os.path.dirname(__file__), 'model', 'data_chunks.json')

def get_embeddings(texts):
    if not API_KEY:
        print("Lỗi: GEMINI_API_KEY chưa được thiết lập.")
        return None

    try:
        # Khởi tạo Client bên trong hàm để đảm bảo có thể retry
        client = genai.Client(api_key=API_KEY)
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=texts
        )

        if hasattr(response, 'embedding') and response.embedding:
            return response.embedding
        if hasattr(response, 'values') and response.values:
            return response.values

        return None
    except APIError as e:
        print(f"Lỗi API khi vector hóa batch (NGHIÊM TRỌNG): {e}")
        # THỬ LẠI TỪNG VĂN BẢN ĐỂ IN LỖI CỤ THỂ HƠN
        print("Thử vector hóa từng văn bản một để tìm lỗi cụ thể...")
        embeddings = []
        for i, text in enumerate(texts):
            try:
                client = genai.Client(api_key=API_KEY)
                response = client.models.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=[text]
                )
                embedding = response.embedding if hasattr(response, 'embedding') and response.embedding else response.values[0]
                embeddings.append(embedding)
            except APIError as e_single:
                print(f"Lỗi API khi vector hóa văn bản #{i+1}: {e_single}")
                # Nếu API lỗi, ta KHÔNG nên dùng vector 0 mà nên dừng
                return None
            except Exception as e_other:
                print(f"Lỗi chung khi vector hóa văn bản #{i+1}: {e_other}")
                return None

        if any(len(e) > 1 for e in embeddings):
            return embeddings
        return None
    except Exception as e:
        print(f"Lỗi chung khi vector hóa batch: {e}")
        return None

def create_vector_store():
    if not API_KEY:
        print("Lỗi: GEMINI_API_KEY chưa được thiết lập. Vui lòng kiểm tra file .env")
        return

    print("✓ Cấu hình Gemini API thành công (sử dụng Client)")

    try:
        with open(DATA_FILE, 'r', encoding="utf-8") as f:
            data = json.load(f)
        print(f"✓ Đã đọc {len(data)} chunks từ file dữ liệu")
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file {DATA_FILE}")
        print("Tạo file data_chunks.json mẫu...")

        sample_data = [
            {
                "id": "chunk_1",
                "text": "Hệ thống Quản lý Minh chứng là một nền tảng số hóa giúp các cơ sở giáo dục đại học quản lý, lưu trữ và truy xuất các minh chứng phục vụ công tác kiểm định chất lượng giáo dục.",
                "source": "Giới thiệu hệ thống"
            },
            {
                "id": "chunk_2",
                "text": "Để upload minh chứng, người dùng cần: 1) Đăng nhập vào hệ thống, 2) Chọn mục Quản lý minh chứng, 3) Nhấn nút Tạo mới, 4) Điền thông tin và upload file đính kèm.",
                "source": "Hướng dẫn upload"
            }
        ]

        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, ensure_ascii=False, indent=2)

        data = sample_data
        print(f"✓ Đã tạo file mẫu với {len(data)} chunks")

    texts = [item['text'] for item in data]
    ids = [str(item.get('id', f'chunk_{i}')) for i, item in enumerate(data)]
    metadatas = [{'source': item['source']} for item in data]

    print("\n=== Bắt đầu tạo embeddings ===")
    embeddings = get_embeddings(texts)

    if not embeddings or len(embeddings) != len(texts):
        print("Lỗi: Không thể tạo embeddings cho tất cả các văn bản.")
        print("NGUYÊN NHÂN: Vui lòng kiểm tra lại GEMINI_API_KEY và đảm bảo nó có quyền gọi API.")
        return

    print(f"✓ Đã tạo {len(embeddings)} embeddings")

    print("\n=== Lưu vào ChromaDB ===")
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

    try:
        chroma_client.delete_collection(name="chatbot_knowledge")
        print("✓ Đã xóa collection cũ")
    except Exception:
        print("✓ Không có collection cũ")

    collection = chroma_client.get_or_create_collection(
        name="chatbot_knowledge",
        metadata={"hnsw:space": "cosine"}
    )
    print("✓ Đã tạo collection mới")

    try:
        collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        print(f"✓ Đã lưu {collection.count()} documents vào ChromaDB")
    except Exception as e:
        print(f"Lỗi khi lưu vào ChromaDB: {e}")
        return

    print(f"\n✅ HOÀN THÀNH! Đã vector hóa và lưu trữ {collection.count()} documents")
    print(f"📁 Dữ liệu được lưu tại: {os.path.abspath(CHROMA_PATH)}")

    print("\n=== Kiểm tra kết quả ===")
    test_query = "upload minh chứng"
    try:
        client = genai.Client(api_key=API_KEY)
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=[test_query]
        )
        query_vec = response.embedding

        results = collection.query(
            query_embeddings=[query_vec],
            n_results=2
        )

        print(f"Test query: '{test_query}'")
        print("Kết quả tìm kiếm:")
        for i, doc in enumerate(results['documents'][0]):
            print(f"  {i+1}. {doc[:100]}...")

    except Exception as e:
        print(f"Lỗi khi test: {e}")

if __name__ == "__main__":
    create_vector_store()