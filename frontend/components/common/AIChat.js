const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/ai-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input })
        });
        const data = await res.json();

        setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
    } catch (err) {
        setMessages(prev => [...prev, { from: 'bot', text: '❌ Không thể kết nối tới AI server.' }]);
    }
};