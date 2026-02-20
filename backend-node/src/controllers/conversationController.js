import Conversation from "../models/Conversations.js";

export const getConversations = async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId || req.body.userId;

        const conversations = await Conversation.find({ userId })
        .select('_id title updatedAt messages')
        .sort({ updatedAt: -1 })
        .limit(15);

        const conversationsWithPreview = conversations.map(conv => ({
            _id: conv._id,
            title: conv.title,
            updatedAt: conv.updatedAt,
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

        const conversation = await Conversation.findOne({ 
            _id: conversationId, 
            userId 
        })

        if (!conversation) {
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

        const newConversation = new Conversation({
            userId, 
            title: title || "New Chat",
            messages: []
        })

        await newConversation.save();
        res.status(201).json(newConversation)
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

        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId
        })

        if (!conversation) {
            return res.status(400).json({ message: "Conversation not found" })
        }

        conversation.messages.push({
            role, 
            content,
            timestamp: new Date()
        })

        if (conversation.title === "New Chat" && role === "user" && conversation.messages.length == 1) {
            conversation.title = content.substring(0, 15) + (content.length > 15 ? "..." : "");
        }

        await conversation.save()
        res.json(conversation)

    } catch (e) {
        console.error("Error adding conversation: ", e);
        res.status(500).json({ e: "Failed to add conversation" })
    }
}

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id || req.body.userId;
    
    const result = await Conversation.deleteOne({
      _id: conversationId,
      userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
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
    
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      { title },
      { new: true }
    );
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
};
