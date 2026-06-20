import { supabase } from "../config/supabase.js";

export const getConversations = async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId || req.body.userId;

        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('id, title, updated_at, messages')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(15);

        if (error) throw error;

        const conversationsWithPreview = conversations.map(conv => ({
            _id: conv.id,
            title: conv.title,
            updatedAt: conv.updated_at,
            lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content.substring(0, 15) : "",
        }));

        res.json(conversationsWithPreview);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: 'Failed to fetch conversations' })
    }
}

export const getConversationById = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id || req.query.userId || req.body.userId;

        const { data: conversation, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single();

        if (error || !conversation) {
            return res.status(404).json({ message: "Conversation not found" })
        }

        res.json(conversation);
    } catch (e) {
        console.error("Error fetching conversation: ", e);
        res.status(500).json({ e: "Failed to fetch conversation" })
    }
}

export const createConversation = async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId || req.body.userId;
        const { title } = req.body;

        const { data, error } = await supabase
            .from('conversations')
            .insert([{
                user_id: userId,
                title: title || "New Chat",
                messages: []
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0])
    } catch (e) {
        console.error("Error creating conversation: ", e);
        res.status(500).json({ e: "Failed to create conversation" })
    }
}

export const addConversation = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        const { conversationId } = req.params;
        const { role, content } = req.body;

        const { data: conversation, error: fetchError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !conversation) {
            return res.status(400).json({ message: "Conversation not found" })
        }

        const updatedMessages = [
            ...conversation.messages,
            {
                role,
                content,
                timestamp: new Date().toISOString()
            }
        ];

        let updatedTitle = conversation.title;
        if (conversation.title === "New Chat" && role === "user" && updatedMessages.length == 1) {
            updatedTitle = content.substring(0, 15) + (content.length > 15 ? "..." : "");
        }

        const { data, error: updateError } = await supabase
            .from('conversations')
            .update({
                messages: updatedMessages,
                title: updatedTitle,
                updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json(data)
    } catch (e) {
        console.error("Error adding conversation: ", e);
        res.status(500).json({ e: "Failed to add conversation" })
    }
}

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id || req.body.userId;
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

export const updateConversationTitle = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id || req.body.userId;
    const { title } = req.body;
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
};
