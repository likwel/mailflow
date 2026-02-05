// routes/automations.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all workflows
router.get('/workflows', authMiddleware, async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows '+error });
  }
});

// CREATE workflow
router.post('/workflows', authMiddleware, async (req, res) => {
  try {
    const { name, description, trigger, actions } = req.body;
    
    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        trigger,
        actions,
        status: 'draft',
        userId: req.user.id
      }
    });
    
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// UPDATE workflow status
router.patch('/workflows/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    const workflow = await prisma.workflow.update({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      data: { status }
    });
    
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// DELETE workflow
router.delete('/workflows/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.workflow.delete({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    res.json({ message: 'Workflow deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// routes/automations.js

// UPDATE workflow
router.put('/workflows/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, trigger, actions, status } = req.body;
    
    const workflow = await prisma.workflow.update({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      data: {
        name,
        description,
        trigger,
        actions,
        status
      }
    });
    
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

module.exports = router;