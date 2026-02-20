import express from 'express'

import {
    getConversations,
    getConversationById,
    createConversation,
    addConversation,
    deleteConversation,
    updateConversationTitle
} from '../controllers/conversationController.js'

const router = express.Router();

router.get('/', getConversations);
router.get('/:conversationId', getConversationById);
router.post('/', createConversation);
router.post('/:conversationId/messages', addConversation);
router.delete('/:conversationId', deleteConversation);
router.patch('/:conversationId/title', updateConversationTitle);

export default router;