// src/api/routes/contacts.js
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Papa from 'papaparse';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const contactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

// ==================== GET ALL CONTACTS ====================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status = 'ACTIVE',
      listId,
      tags 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ]
      }),
      ...(listId && {
        lists: {
          some: { listId }
        }
      }),
      ...(tags && {
        tags: {
          hasSome: tags.split(',')
        }
      })
    };
    
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          lists: {
            include: {
              list: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: { events: true }
          }
        }
      }),
      prisma.contact.count({ where })
    ]);
    
    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// ==================== GET CONTACT BY ID ====================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        lists: {
          include: {
            list: true
          }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// ==================== CREATE CONTACT ====================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validatedData = contactSchema.parse(req.body);
    const { listIds = [], ...contactData } = validatedData;
    
    // Check if email already exists
    const existing = await prisma.contact.findFirst({
      where: {
        email: contactData.email,
        userId: req.user.id
      }
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Contact with this email already exists' });
    }
    
    const contact = await prisma.contact.create({
      data: {
        ...contactData,
        userId: req.user.id,
        source: 'manual',
        lists: listIds.length > 0 ? {
          create: listIds.map(listId => ({ listId }))
        } : undefined
      },
      include: {
        lists: {
          include: {
            list: true
          }
        }
      }
    });
    
    // Log event
    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        type: 'CONTACT_CREATED',
        metadata: { source: 'manual' }
      }
    });
    
    res.status(201).json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// ==================== UPDATE CONTACT ====================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const validatedData = contactSchema.partial().parse(req.body);
    const { listIds, ...contactData } = validatedData;
    
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const updated = await prisma.contact.update({
      where: { id: req.params.id },
      data: contactData,
      include: {
        lists: {
          include: {
            list: true
          }
        }
      }
    });
    
    // Log event
    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        type: 'CONTACT_UPDATED'
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// ==================== DELETE CONTACT ====================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    await prisma.contact.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// ==================== BULK DELETE CONTACTS ====================
router.post('/bulk/delete', authenticateToken, async (req, res) => {
  try {
    const { contactIds } = req.body;
    
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Invalid contact IDs' });
    }
    
    const result = await prisma.contact.deleteMany({
      where: {
        id: { in: contactIds },
        userId: req.user.id
      }
    });
    
    res.json({ deleted: result.count });
  } catch (error) {
    console.error('Error bulk deleting contacts:', error);
    res.status(500).json({ error: 'Failed to delete contacts' });
  }
});

// ==================== IMPORT CONTACTS (CSV) ====================
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { csvData, listId, updateExisting = false } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ error: 'CSV data is required' });
    }
    
    // Parse CSV
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });
    
    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const row of parsed.data) {
      try {
        const email = row.email?.trim();
        
        if (!email || !email.includes('@')) {
          results.failed++;
          results.errors.push({ email: email || 'unknown', error: 'Invalid email' });
          continue;
        }
        
        const existing = await prisma.contact.findFirst({
          where: {
            email,
            userId: req.user.id
          }
        });
        
        if (existing && !updateExisting) {
          results.failed++;
          results.errors.push({ email, error: 'Contact already exists' });
          continue;
        }
        
        const contactData = {
          email,
          firstName: row.firstname || row.first_name || row['first name'] || null,
          lastName: row.lastname || row.last_name || row['last name'] || null,
          phone: row.phone || null,
          company: row.company || null,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          source: 'import'
        };
        
        if (existing) {
          await prisma.contact.update({
            where: { id: existing.id },
            data: contactData
          });
          results.updated++;
        } else {
          const contact = await prisma.contact.create({
            data: {
              ...contactData,
              userId: req.user.id,
              ...(listId && {
                lists: {
                  create: { listId }
                }
              })
            }
          });
          
          await prisma.contactEvent.create({
            data: {
              contactId: contact.id,
              type: 'CONTACT_CREATED',
              metadata: { source: 'import' }
            }
          });
          
          results.imported++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ email: row.email, error: error.message });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error importing contacts:', error);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
});

// ==================== ADD CONTACTS TO LIST ====================
router.post('/bulk/add-to-list', authenticateToken, async (req, res) => {
  try {
    const { contactIds, listId } = req.body;
    
    if (!Array.isArray(contactIds) || !listId) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    // Verify list belongs to user
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        userId: req.user.id
      }
    });
    
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    // Add contacts to list (skip duplicates)
    const operations = contactIds.map(contactId => ({
      contactId,
      listId
    }));
    
    await prisma.contactListMember.createMany({
      data: operations,
      skipDuplicates: true
    });
    
    // Log events
    for (const contactId of contactIds) {
      await prisma.contactEvent.create({
        data: {
          contactId,
          type: 'LIST_ADDED',
          metadata: { listId, listName: list.name }
        }
      });
    }
    
    res.json({ message: `${contactIds.length} contacts added to list` });
  } catch (error) {
    console.error('Error adding contacts to list:', error);
    res.status(500).json({ error: 'Failed to add contacts to list' });
  }
});

// ==================== GET CONTACT STATISTICS ====================
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [total, active, unsubscribed, bounced] = await Promise.all([
      prisma.contact.count({ where: { userId: req.user.id } }),
      prisma.contact.count({ where: { userId: req.user.id, status: 'ACTIVE' } }),
      prisma.contact.count({ where: { userId: req.user.id, status: 'UNSUBSCRIBED' } }),
      prisma.contact.count({ where: { userId: req.user.id, status: 'BOUNCED' } })
    ]);
    
    res.json({
      total,
      active,
      unsubscribed,
      bounced,
      complained: 0 // Add if needed
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;