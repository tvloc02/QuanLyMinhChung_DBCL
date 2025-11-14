import json
import os
import chromadb
from google import genai
from dotenv import load_dotenv

# Tải biến môi trường
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(parent_dir, 'backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Cấu hình
API_KEY = os.getenv("GEMINI_API_KEY")
EMBEDDING_MODEL = 'text-embedding-004'
CHROMA_PATH = "chroma_db"
DATA_FILE = os.path.join(os.path.dirname(__file__), 'model', 'data_chunks.json')

def get_embeddings(texts):
    """Sử dụng Gemini API để lấy vector cho các đoạn văn bản theo batch."""
    try:
        # API hỗ trợ batching, nên ta có thể gửi cả list
        response = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=texts,
            task_type="RETRIEVAL_DOCUMENT"
        )
        return response['embedding']
    except Exception as e:
        print(f"Lỗi nghiêm trọng khi vector hóa batch: {e}")
        # Nếu batch fail, thử lại từng cái một
        print("Thử lại từng văn bản một...")
        embeddings = []
        for text in texts:
            try:
                response = genai.embed_content(
                    model=EMBEDDING_MODEL,
                    content=text,
                    task_type="RETRIEVAL_DOCUMENT"
                )
                embeddings.append(response['embedding'])
            except Exception as e_single:
                print(f"Lỗi khi vector hóa văn bản: {e_single}. Sử dụng vector 0.")
                embeddings.append([0.0] * 768) # Vector mặc định
        return embeddings

def create_vector_store():
    if not API_KEY:
        print("Lỗi: GEMINI_API_KEY chưa được thiết lập. Vui lòng kiểm tra file .env")
        return

    genai.configure(api_key=API_KEY)
    print("✓ Cấu hình Gemini API thành công")

    # 1. Đọc dữ liệu từ file chunks
    try:
        with open(DATA_FILE, 'r', encoding="utf-8") as f:
            data = json.load(f)
        print(f"✓ Đã đọc {len(data)} chunks từ file dữ liệu")
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file {DATA_FILE}")
        print("Tạo file data_chunks.json mẫu...")

        # Tạo dữ liệu mẫu nếu chưa có
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

    # 2. Lấy Embeddings
    print("\n=== Bắt đầu tạo embeddings ===")
    embeddings = get_embeddings(texts)

    if not embeddings or len(embeddings) != len(texts):
        print("Lỗi: Không thể tạo embeddings cho tất cả các văn bản.")
        return

    print(f"✓ Đã tạo {len(embeddings)} embeddings")

    # 3. Lưu trữ vào ChromaDB
    print("\n=== Lưu vào ChromaDB ===")
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Xóa collection cũ nếu tồn tại
    try:
        chroma_client.delete_collection(name="chatbot_knowledge")
        print("✓ Đã xóa collection cũ")
    except Exception:
        print("✓ Không có collection cũ")

    # Tạo collection mới
    collection = chroma_client.get_or_create_collection(
        name="chatbot_knowledge",
        metadata={"hnsw:space": "cosine"}
    )
    print("✓ Đã tạo collection mới")

    # Thêm dữ liệu vào ChromaDB
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

    # Kiểm tra
    print("\n=== Kiểm tra kết quả ===")
    test_query = "upload minh chứng"
    try:
        response = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=test_query,
            task_type="RETRIEVAL_QUERY"
        )
        query_vec = response['embedding']

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