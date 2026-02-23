import axios from "axios"

export const embedText = async (text) => {
    const response = await axios.post(`${process.env.OLLAMA_URL}/api/embed`, {
        model: "nomic-embed-text",
        input: text
    });

    return response.data.embeddings[0];
}