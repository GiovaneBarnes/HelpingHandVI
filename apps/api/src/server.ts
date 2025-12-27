import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

console.log('Starting server...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Extend Request interface for admin actor
declare global {
  namespace Express {
    interface Request {
      adminActor?: string;
    }
  }
}

const app = express();

export { app };
const port = process.env.PORT || 3000;

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

// Activity Service helper
class ActivityService {
  static async logEvent(providerId: number, eventType: string) {
    try {
      await pool.query(
        'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
        [providerId, eventType]
      );
    } catch (error) {
      console.error('Failed to log activity event:', error);
      // Don't throw - activity logging shouldn't break the main operation
    }
  }
}

export { ActivityService };

// Premium/Trial helper functions
export const isPremium = (provider: any): boolean => {
  return provider.plan === 'PREMIUM' &&
         (provider.plan_source !== 'TRIAL' || (provider.trial_end_at && new Date(provider.trial_end_at) > new Date()));
};

export const trialDaysLeft = (provider: any): number => {
  if (!provider.trial_end_at) return 0;
  const days = Math.ceil((new Date(provider.trial_end_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

// Audit Service for admin governance
class AuditService {
  static async log({
    actionType,
    adminActor,
    providerId,
    reportId,
    notes
  }: {
    actionType: string;
    adminActor: string;
    providerId?: number;
    reportId?: number;
    notes?: string;
  }) {
    try {
      await pool.query(
        'INSERT INTO admin_audit_log (action_type, admin_actor, provider_id, report_id, notes) VALUES ($1, $2, $3, $4, $5)',
        [actionType, adminActor, providerId || null, reportId || null, notes || null]
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  }
}

export { AuditService };

// Admin auth middleware with actor extraction
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Extract admin actor from key (use last 8 chars as identifier, never store full key)
  req.adminActor = (key as string).slice(-8);
  next();
};

export { adminAuth };

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // allow web app on common dev ports
}));

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get('/areas', async (req: Request, res: Response) => {
  try {
    const { island } = req.query;
    if (!island || typeof island !== 'string') {
      return res.status(400).json({ error: 'Island parameter required' });
    }
    
    // Validate island parameter
    const validIslands = ['STT', 'STX', 'STJ'];
    if (!validIslands.includes(island)) {
      return res.status(400).json({ error: { code: 'INVALID_ISLAND', message: 'Island must be one of: STT, STX, STJ', fieldErrors: { island: 'Must be STT, STX, or STJ' } } });
    }
    
    const result = await pool.query(
      'SELECT id, name FROM areas WHERE island = $1 ORDER BY name',
      [island]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/providers', async (req: Request, res: Response) => {
  try {
    const { status, island, category, areaId, limit: limitParam, cursor: cursorParam } = req.query;

    // Check emergency mode
    const emergencyResult = await pool.query('SELECT value FROM app_settings WHERE key = $1', ['emergency_mode']);
    const emergencyMode = emergencyResult.rows[0]?.value?.enabled || false;

    // Validation
    let limit = 20;
    if (limitParam) {
      const limitNum = parseInt(limitParam as string, 10);
      if (isNaN(limitNum) || limitNum < 1) {
        return res.status(400).json({ error: { code: 'INVALID_LIMIT', message: 'Limit must be between 1 and 50', fieldErrors: { limit: 'Must be between 1 and 50' } } });
      }
      limit = Math.min(limitNum, 50);
    }

    // Validate island parameter
    const validIslands = ['STT', 'STX', 'STJ'];
    if (island && typeof island === 'string' && !validIslands.includes(island)) {
      return res.status(400).json({ error: { code: 'INVALID_ISLAND', message: 'Island must be one of: STT, STX, STJ', fieldErrors: { island: 'Must be STT, STX, or STJ' } } });
    }

    let cursor: { trust_tier: number; is_premium_active: boolean; emergency_boost_eligible: number; lifecycle_active: boolean; last_active_at: string | null; status_last_updated_at: string; id: number } | null = null;
    if (cursorParam) {
      try {
        cursor = JSON.parse(Buffer.from(cursorParam as string, 'base64').toString());
        if (!cursor || typeof cursor.trust_tier !== 'number' || typeof cursor.id !== 'number') throw new Error();
      } catch {
        return res.status(400).json({ error: { code: 'INVALID_CURSOR', message: 'Invalid cursor format', fieldErrors: { cursor: 'Invalid base64 JSON' } } });
      }
    }

    let query = `
      SELECT p.*,
             (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at,
             p.lifecycle_status,
             p.is_disputed,
             p.plan,
             p.plan_source,
             p.trial_end_at,
             (p.plan = 'PREMIUM' AND (p.plan_source != 'TRIAL' OR p.trial_end_at > NOW())) as is_premium_active,
             CASE WHEN p.trial_end_at > NOW() THEN CEIL(EXTRACT(EPOCH FROM (p.trial_end_at - NOW())) / 86400) ELSE 0 END as trial_days_left,
             CASE WHEN p.plan_source = 'TRIAL' AND p.trial_end_at > NOW() THEN true ELSE false END as is_trial,
             -- Trust tier: GOV > VERIFIED > NONE
             CASE
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'GOV_APPROVED') THEN 3
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'VERIFIED') THEN 2
               ELSE 1
             END as trust_tier,
             -- Emergency boost eligibility (only for premium-active providers with EMERGENCY_READY)
             CASE WHEN (p.plan = 'PREMIUM' AND (p.plan_source != 'TRIAL' OR p.trial_end_at > NOW())) AND
                       EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'EMERGENCY_READY')
                  THEN 1 ELSE 0 END as emergency_boost_eligible
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (island) {
      query += ` AND p.island = $${paramIndex}`;
      params.push(island);
      paramIndex++;
    }

    if (category) {
      query += ` AND EXISTS (SELECT 1 FROM provider_categories pc JOIN categories c ON pc.category_id = c.id WHERE pc.provider_id = p.id AND c.name = $${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    if (areaId) {
      query += ` AND EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $${paramIndex})`;
      params.push(areaId);
      paramIndex++;
    }

    if (cursor) {
      query += ` AND (
        trust_tier < $${paramIndex} OR
        (trust_tier = $${paramIndex} AND is_premium_active < $${paramIndex + 1}) OR
        (trust_tier = $${paramIndex} AND is_premium_active = $${paramIndex + 1} AND emergency_boost_eligible < $${paramIndex + 2}) OR
        (trust_tier = $${paramIndex} AND is_premium_active = $${paramIndex + 1} AND emergency_boost_eligible = $${paramIndex + 2} AND (p.lifecycle_status = 'ACTIVE') < $${paramIndex + 3}) OR
        (trust_tier = $${paramIndex} AND is_premium_active = $${paramIndex + 1} AND emergency_boost_eligible = $${paramIndex + 2} AND (p.lifecycle_status = 'ACTIVE') = $${paramIndex + 3} AND (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) < $${paramIndex + 4}) OR
        (trust_tier = $${paramIndex} AND is_premium_active = $${paramIndex + 1} AND emergency_boost_eligible = $${paramIndex + 2} AND (p.lifecycle_status = 'ACTIVE') = $${paramIndex + 3} AND (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) = $${paramIndex + 4} AND p.status_last_updated_at < $${paramIndex + 5}) OR
        (trust_tier = $${paramIndex} AND is_premium_active = $${paramIndex + 1} AND emergency_boost_eligible = $${paramIndex + 2} AND (p.lifecycle_status = 'ACTIVE') = $${paramIndex + 3} AND (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) = $${paramIndex + 4} AND p.status_last_updated_at = $${paramIndex + 5} AND p.id > $${paramIndex + 6})
      )`;
      params.push(cursor.trust_tier, cursor.is_premium_active, cursor.emergency_boost_eligible, cursor.lifecycle_active, cursor.last_active_at, cursor.status_last_updated_at, cursor.id);
      paramIndex += 7;
    }

    query += ` ORDER BY trust_tier DESC,
               is_premium_active DESC,
               ${emergencyMode ? 'emergency_boost_eligible DESC,' : ''}
               (p.lifecycle_status = 'ACTIVE') DESC,
               (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) DESC NULLS LAST,
               p.status_last_updated_at DESC,
               p.id ASC
               LIMIT $${paramIndex}`;
    params.push(limit + 1); // +1 to check if more

    const result = await pool.query(query, params);
    const providers = result.rows.slice(0, limit);
    const hasMore = result.rows.length > limit;
    let nextCursor: string | null = null;
    if (hasMore && providers.length > 0) {
      const last = providers[providers.length - 1];
      nextCursor = Buffer.from(JSON.stringify({
        trust_tier: last.trust_tier,
        is_premium_active: last.is_premium_active,
        emergency_boost_eligible: last.emergency_boost_eligible,
        lifecycle_active: last.lifecycle_status === 'ACTIVE',
        last_active_at: last.last_active_at,
        status_last_updated_at: last.status_last_updated_at,
        id: last.id
      })).toString('base64');
    }

    let suggestions: any[] = [];
    if (providers.length === 0) {
      // Generate suggestions
      if (status === 'TODAY') {
        suggestions.push({
          id: 'expand_today',
          label: 'Available next 3 days',
          description: 'Expand availability to next 3 days',
          patch: { status: 'NEXT_3_DAYS' }
        });
      } else if (status === 'NEXT_3_DAYS') {
        suggestions.push({
          id: 'expand_3days',
          label: 'Available this week',
          description: 'Expand availability to this week',
          patch: { status: 'THIS_WEEK' }
        });
      } else if (status === 'THIS_WEEK') {
        suggestions.push({
          id: 'expand_week',
          label: 'Available next week',
          description: 'Expand availability to next week',
          patch: { status: 'NEXT_WEEK' }
        });
      }
      // Nearby areas: simplified, suggest removing island filter if present, or top areas
      if (island) {
        suggestions.push({
          id: 'nearby_areas',
          label: 'Check nearby islands',
          description: 'Remove island filter to see providers on other islands',
          patch: { island: null }
        });
      }
    }

    res.json({
      data: {
        providers,
        nextCursor,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      },
      error: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.*,
             (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at,
             p.plan,
             p.plan_source,
             p.trial_end_at,
             (p.plan = 'PREMIUM' AND (p.plan_source != 'TRIAL' OR p.trial_end_at > NOW())) as is_premium_active,
             CASE WHEN p.trial_end_at > NOW() THEN CEIL(EXTRACT(EPOCH FROM (p.trial_end_at - NOW())) / 86400) ELSE 0 END as trial_days_left,
             CASE WHEN p.plan_source = 'TRIAL' AND p.trial_end_at > NOW() THEN true ELSE false END as is_trial,
             COALESCE(
               (SELECT json_agg(json_build_object('id', a.id, 'name', a.name, 'island', a.island))
                FROM areas a
                JOIN provider_areas pa ON pa.area_id = a.id
                WHERE pa.provider_id = p.id),
               '[]'::json
             ) as areas
      FROM providers p
      WHERE p.id = $1 AND p.lifecycle_status != 'ARCHIVED'
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/providers', async (req, res) => {
  try {
    const {
      name,
      phone,
      whatsapp,
      island,
      categories,
      areas,
      contact_call_enabled = true,
      contact_whatsapp_enabled = true,
      contact_sms_enabled = true,
      preferred_contact_method,
      typical_hours,
      emergency_calls_accepted = false
    } = req.body;

    // Validation
    if (!name || !phone || !island) {
      return res.status(400).json({ error: 'Name, phone, and island are required' });
    }
    
    // Validate island parameter
    const validIslands = ['STT', 'STX', 'STJ'];
    if (!validIslands.includes(island)) {
      return res.status(400).json({ error: { code: 'INVALID_ISLAND', message: 'Island must be one of: STT, STX, STJ', fieldErrors: { island: 'Must be STT, STX, or STJ' } } });
    }
    
    if (!Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({ error: 'At least one area is required' });
    }
    if (!contact_call_enabled && !contact_whatsapp_enabled && !contact_sms_enabled) {
      return res.status(400).json({ error: 'At least one contact method must be enabled' });
    }
    const enabledMethods = [];
    if (contact_call_enabled) enabledMethods.push('CALL');
    if (contact_whatsapp_enabled) enabledMethods.push('WHATSAPP');
    if (contact_sms_enabled) enabledMethods.push('SMS');
    if (preferred_contact_method && !enabledMethods.includes(preferred_contact_method)) {
      return res.status(400).json({ error: 'Preferred contact method must be enabled' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      const providerResult = await client.query(
        `INSERT INTO providers (
          name, phone, whatsapp, island, plan, plan_source, trial_start_at, trial_end_at,
          contact_call_enabled, contact_whatsapp_enabled, contact_sms_enabled,
          preferred_contact_method, typical_hours, emergency_calls_accepted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
        [name, phone, whatsapp, island, 'PREMIUM', 'TRIAL', trialStart, trialEnd,
         contact_call_enabled, contact_whatsapp_enabled, contact_sms_enabled,
         preferred_contact_method, typical_hours, emergency_calls_accepted]
      );
      const providerId = providerResult.rows[0].id;

      for (const categoryName of categories) {
        const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
        if (categoryResult.rows.length > 0) {
          await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES ($1, $2)', [providerId, categoryResult.rows[0].id]);
        }
      }

      for (const areaId of areas) {
        // Validate area belongs to provider's island
        const areaResult = await client.query('SELECT id FROM areas WHERE id = $1 AND island = $2', [areaId, island]);
        if (areaResult.rows.length > 0) {
          await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES ($1, $2)', [providerId, areaId]);
        }
      }

      await client.query('COMMIT');

      // Calculate trial days left
      const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      res.status(201).json({
        id: providerId,
        plan: 'PREMIUM',
        plan_source: 'TRIAL',
        trial_end_at: trialEnd.toISOString(),
        trial_days_left: trialDaysLeft
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      whatsapp,
      island,
      categories,
      areas,
      contact_call_enabled,
      contact_whatsapp_enabled,
      contact_sms_enabled,
      preferred_contact_method,
      typical_hours,
      emergency_calls_accepted
    } = req.body;

    // Validation
    if (!Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({ error: 'At least one area is required' });
    }
    
    // Validate island parameter if provided
    if (island !== undefined) {
      const validIslands = ['STT', 'STX', 'STJ'];
      if (!validIslands.includes(island)) {
        return res.status(400).json({ error: { code: 'INVALID_ISLAND', message: 'Island must be one of: STT, STX, STJ', fieldErrors: { island: 'Must be STT, STX, or STJ' } } });
      }
    }
    
    if (typeof contact_call_enabled === 'boolean' && typeof contact_whatsapp_enabled === 'boolean' && typeof contact_sms_enabled === 'boolean') {
      if (!contact_call_enabled && !contact_whatsapp_enabled && !contact_sms_enabled) {
        return res.status(400).json({ error: 'At least one contact method must be enabled' });
      }
      const enabledMethods = [];
      if (contact_call_enabled) enabledMethods.push('CALL');
      if (contact_whatsapp_enabled) enabledMethods.push('WHATSAPP');
      if (contact_sms_enabled) enabledMethods.push('SMS');
      if (preferred_contact_method && !enabledMethods.includes(preferred_contact_method)) {
        return res.status(400).json({ error: 'Preferred contact method must be enabled' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(name);
        paramIndex++;
      }
      if (phone !== undefined) {
        updateFields.push(`phone = $${paramIndex}`);
        updateValues.push(phone);
        paramIndex++;
      }
      if (whatsapp !== undefined) {
        updateFields.push(`whatsapp = $${paramIndex}`);
        updateValues.push(whatsapp);
        paramIndex++;
      }
      if (island !== undefined) {
        updateFields.push(`island = $${paramIndex}`);
        updateValues.push(island);
        paramIndex++;
      }
      if (contact_call_enabled !== undefined) {
        updateFields.push(`contact_call_enabled = $${paramIndex}`);
        updateValues.push(contact_call_enabled);
        paramIndex++;
      }
      if (contact_whatsapp_enabled !== undefined) {
        updateFields.push(`contact_whatsapp_enabled = $${paramIndex}`);
        updateValues.push(contact_whatsapp_enabled);
        paramIndex++;
      }
      if (contact_sms_enabled !== undefined) {
        updateFields.push(`contact_sms_enabled = $${paramIndex}`);
        updateValues.push(contact_sms_enabled);
        paramIndex++;
      }
      if (preferred_contact_method !== undefined) {
        updateFields.push(`preferred_contact_method = $${paramIndex}`);
        updateValues.push(preferred_contact_method);
        paramIndex++;
      }
      if (typical_hours !== undefined) {
        updateFields.push(`typical_hours = $${paramIndex}`);
        updateValues.push(typical_hours);
        paramIndex++;
      }
      if (emergency_calls_accepted !== undefined) {
        updateFields.push(`emergency_calls_accepted = $${paramIndex}`);
        updateValues.push(emergency_calls_accepted);
        paramIndex++;
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await client.query(
          `UPDATE providers SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      if (categories) {
        await client.query('DELETE FROM provider_categories WHERE provider_id = $1', [id]);
        for (const categoryName of categories) {
          const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
          if (categoryResult.rows.length > 0) {
            await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES ($1, $2)', [id, categoryResult.rows[0].id]);
          }
        }
      }

      if (areas) {
        await client.query('DELETE FROM provider_areas WHERE provider_id = $1', [id]);
        for (const areaId of areas) {
          // Get current island if not updating island
          const islandToCheck = island || (await client.query('SELECT island FROM providers WHERE id = $1', [id])).rows[0].island;
          const areaResult = await client.query('SELECT id FROM areas WHERE id = $1 AND island = $2', [areaId, islandToCheck]);
          if (areaResult.rows.length > 0) {
            await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES ($1, $2)', [id, areaId]);
          }
        }
      }

      await client.query('COMMIT');
      await ActivityService.logEvent(parseInt(id), 'PROFILE_UPDATED');
      res.json({ message: 'Updated' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/providers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE providers SET status = $1, last_updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
    await ActivityService.logEvent(parseInt(id), 'STATUS_UPDATED');
    res.json({ message: 'Status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/reports', async (req, res) => {
  try {
    const { provider_id, reason, contact } = req.body;
    await pool.query(
      'INSERT INTO reports (provider_id, reason, contact) VALUES ($1, $2, $3)',
      [provider_id, reason, contact]
    );
    res.status(201).json({ message: 'Report submitted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/admin/providers', adminAuth, async (req, res) => {
  try {
    const query = `
      SELECT p.*,
             (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at,
             (p.plan = 'PREMIUM' AND p.trial_end_at > NOW()) as is_premium,
             CASE WHEN p.trial_end_at > NOW() THEN CEIL(EXTRACT(EPOCH FROM (p.trial_end_at - NOW())) / 86400) ELSE 0 END as trial_days_left,
             p.is_disputed,
             p.disputed_at
      FROM providers p
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/admin/providers/:id/verify', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (verified) {
      // Add VERIFIED badge if not already present
      await pool.query(`
        INSERT INTO provider_badges (provider_id, badge)
        VALUES ($1, 'VERIFIED')
        ON CONFLICT (provider_id, badge) DO NOTHING
      `, [id]);
    } else {
      // Remove VERIFIED badge
      await pool.query(`
        DELETE FROM provider_badges
        WHERE provider_id = $1 AND badge = 'VERIFIED'
      `, [id]);
    }

    await pool.query('UPDATE providers SET status_last_updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    await ActivityService.logEvent(parseInt(id), 'VERIFIED');

    // Log audit event
    const badgeText = verified ? 'VERIFIED' : 'unverified';
    await AuditService.log({
      actionType: 'VERIFY',
      adminActor: req.adminActor!,
      providerId: parseInt(id),
      notes: `Provider ${badgeText} by admin`
    });

    res.json({ message: 'Provider verification updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/admin/providers/:id/archive', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const currentResult = await pool.query('SELECT lifecycle_status FROM providers WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const currentStatus = currentResult.rows[0].lifecycle_status;

    // Toggle between ACTIVE and ARCHIVED
    const newStatus = currentStatus === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    const isArchiving = newStatus === 'ARCHIVED';

    await pool.query("UPDATE providers SET lifecycle_status = $1, status_last_updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newStatus, id]);
    await ActivityService.logEvent(parseInt(id), 'ARCHIVED');

    // Log audit event
    const actionType = isArchiving ? 'ARCHIVE' : 'UNARCHIVE';
    await AuditService.log({
      actionType,
      adminActor: req.adminActor!,
      providerId: parseInt(id),
      notes: `Provider ${isArchiving ? 'archived' : 'unarchived'} by admin`
    });

    res.json({ message: `Provider ${isArchiving ? 'archived' : 'unarchived'}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/admin/providers/:id/disputed', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isDisputed, notes } = req.body;

    await pool.query(`
      UPDATE providers
      SET is_disputed = $1, disputed_at = $2, status_last_updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [isDisputed, isDisputed ? new Date() : null, id]);

    // Log audit event
    const actionType = isDisputed ? 'MARK_DISPUTED' : 'UNMARK_DISPUTED';
    await AuditService.log({
      actionType,
      adminActor: req.adminActor!,
      providerId: parseInt(id),
      notes: notes || `Provider ${isDisputed ? 'marked as disputed' : 'unmarked as disputed'} by admin`
    });

    res.json({ message: `Provider ${isDisputed ? 'marked as disputed' : 'unmarked as disputed'}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/admin/jobs/recompute-provider-lifecycle', adminAuth, async (req, res) => {
  try {
    // Recompute lifecycle status based on activity patterns
    const query = `
      WITH provider_activity AS (
        SELECT
          p.id,
          MAX(ae.created_at) as last_activity,
          COUNT(ae.id) as activity_count,
          COUNT(r.id) as report_count
        FROM providers p
        LEFT JOIN activity_events ae ON p.id = ae.provider_id
        LEFT JOIN reports r ON p.id = r.provider_id
        GROUP BY p.id
      ),
      lifecycle_updates AS (
        SELECT
          pa.id,
          CASE
            WHEN pa.last_activity >= NOW() - INTERVAL '30 days' THEN 'ACTIVE'::lifecycle_status
            WHEN pa.last_activity >= NOW() - INTERVAL '90 days' THEN 'INACTIVE'::lifecycle_status
            WHEN pa.report_count > 0 THEN 'ARCHIVED'::lifecycle_status
            ELSE 'ARCHIVED'::lifecycle_status
          END as new_status
        FROM provider_activity pa
      )
      UPDATE providers
      SET lifecycle_status = lu.new_status, status_last_updated_at = CURRENT_TIMESTAMP
      FROM lifecycle_updates lu
      WHERE providers.id = lu.id AND providers.lifecycle_status != lu.new_status
    `;
    
    const result = await pool.query(query);
    res.json({ message: `Lifecycle recomputed for ${result.rowCount} providers` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/admin/jobs/expire-trials', adminAuth, async (req, res) => {
  try {
    // Find expired trial providers and downgrade them
    const expiredTrialsQuery = `
      UPDATE providers
      SET plan = 'FREE', plan_source = 'FREE', updated_at = CURRENT_TIMESTAMP
      WHERE plan = 'PREMIUM'
        AND plan_source = 'TRIAL'
        AND trial_end_at < NOW()
    `;

    const result = await pool.query(expiredTrialsQuery);

    // Log audit event for governance
    if ((result.rowCount ?? 0) > 0) {
      await AuditService.log({
        actionType: 'TRIAL_EXPIRED',
        adminActor: req.adminActor!,
        notes: `Expired ${result.rowCount} trial(s) - downgraded to FREE plan`
      });
    }

    res.json({
      data: { downgradedCount: result.rowCount },
      error: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/admin/reports', adminAuth, async (req, res) => {
  try {
    const { status, type } = req.query;

    let query = `
      SELECT r.*, p.name as provider_name
      FROM reports r
      JOIN providers p ON r.provider_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Default filter: show NEW + IN_REVIEW
    if (!status) {
      query += ` AND r.status IN ('NEW', 'IN_REVIEW')`;
    } else if (status !== 'ALL') {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type && type !== 'ALL') {
      query += ` AND r.report_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/admin/reports/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Get current status for audit log
    const currentResult = await pool.query('SELECT status FROM reports WHERE id = $1', [id]);
    const oldStatus = currentResult.rows[0]?.status;

    // Update report
    await pool.query(`
      UPDATE reports
      SET status = $1, admin_notes = $2
      WHERE id = $3
    `, [status, adminNotes || null, id]);

    // Log audit event
    await AuditService.log({
      actionType: 'REPORT_STATUS_CHANGED',
      adminActor: req.adminActor!,
      reportId: parseInt(id),
      notes: `Report status changed from ${oldStatus} to ${status}`
    });

    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Emergency mode endpoints
app.get('/settings/emergency-mode', async (req, res) => {
  try {
    const result = await pool.query('SELECT value FROM app_settings WHERE key = $1', ['emergency_mode']);
    const emergencyMode = result.rows[0]?.value?.enabled || false;
    // Return both old and new format for backward compatibility
    res.json({
      enabled: emergencyMode,
      data: { enabled: emergencyMode },
      error: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      enabled: false,
      data: null,
      error: 'Internal server error'
    });
  }
});

app.patch('/admin/settings/emergency-mode', adminAuth, async (req, res) => {
  try {
    const { enabled, notes } = req.body;

    // Get current state for logging
    const currentResult = await pool.query('SELECT value FROM app_settings WHERE key = $1', ['emergency_mode']);
    const currentEnabled = currentResult.rows[0]?.value?.enabled || false;

    await pool.query(`
      UPDATE app_settings
      SET value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE key = $2
    `, [{ enabled }, 'emergency_mode']);

    // Log audit event
    await AuditService.log({
      actionType: 'EMERGENCY_MODE_TOGGLED',
      adminActor: req.adminActor!,
      notes: `enabled: ${currentEnabled} -> ${enabled}${notes ? ` (${notes})` : ''}`
    });

    res.json({
      enabled,
      data: { enabled },
      error: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ data: null, error: 'Internal server error' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}