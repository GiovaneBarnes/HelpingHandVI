import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

console.log('Starting server...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const app = express();

export { app };
const port = process.env.PORT || 3000;

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // allow web app on common dev ports
}));

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get('/providers', async (req: Request, res: Response) => {
  try {
    const { status, island, category, limit: limitParam, cursor: cursorParam } = req.query;

    // Validation
    let limit = 20;
    if (limitParam) {
      const limitNum = parseInt(limitParam as string, 10);
      if (isNaN(limitNum) || limitNum < 1) {
        return res.status(400).json({ error: { code: 'INVALID_LIMIT', message: 'Limit must be between 1 and 50', fieldErrors: { limit: 'Must be between 1 and 50' } } });
      }
      limit = Math.min(limitNum, 50);
    }

    let cursor: { score: number; last_active_at: string | null; id: number } | null = null;
    if (cursorParam) {
      try {
        cursor = JSON.parse(Buffer.from(cursorParam as string, 'base64').toString());
        if (!cursor || typeof cursor.score !== 'number' || typeof cursor.id !== 'number') throw new Error();
      } catch {
        return res.status(400).json({ error: { code: 'INVALID_CURSOR', message: 'Invalid cursor format', fieldErrors: { cursor: 'Invalid base64 JSON' } } });
      }
    }

    let query = `
      SELECT p.*,
             (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at,
             CASE
               WHEN $1 = 'TODAY' AND EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'EMERGENCY_READY') THEN 1000
               ELSE 0
             END +
             CASE
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'VERIFIED') THEN 100
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'EMERGENCY_READY') THEN 200
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'GOV_APPROVED') THEN 300
               ELSE 0
             END as score,
             (p.plan = 'PREMIUM' AND p.trial_end_at > NOW()) as is_premium,
             CASE WHEN p.trial_end_at > NOW() THEN CEIL(EXTRACT(EPOCH FROM (p.trial_end_at - NOW())) / 86400) ELSE 0 END as trial_days_left
      FROM providers p
      WHERE p.archived = false
    `;
    const params: any[] = [status];
    let paramIndex = 2;

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

    if (cursor) {
      query += ` AND (
        score < $${paramIndex} OR
        (score = $${paramIndex} AND (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) < $${paramIndex + 1}) OR
        (score = $${paramIndex} AND (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) = $${paramIndex + 1} AND p.id > $${paramIndex + 2})
      )`;
      params.push(cursor.score, cursor.last_active_at, cursor.id);
      paramIndex += 3;
    }

    query += ` ORDER BY score DESC, 
               (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) DESC NULLS LAST, 
               p.last_updated_at DESC
               LIMIT $${paramIndex}`;
    params.push(limit + 1); // +1 to check if more

    const result = await pool.query(query, params);
    const providers = result.rows.slice(0, limit);
    const hasMore = result.rows.length > limit;
    let nextCursor: string | null = null;
    if (hasMore && providers.length > 0) {
      const last = providers[providers.length - 1];
      nextCursor = Buffer.from(JSON.stringify({
        score: last.score,
        last_active_at: last.last_active_at,
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
             (p.plan = 'PREMIUM' AND p.trial_end_at > NOW()) as is_premium,
             CASE WHEN p.trial_end_at > NOW() THEN CEIL(EXTRACT(EPOCH FROM (p.trial_end_at - NOW())) / 86400) ELSE 0 END as trial_days_left
      FROM providers p
      WHERE p.id = $1 AND p.archived = false
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
    const { name, phone, whatsapp, island, categories, areas } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      const providerResult = await client.query(
        'INSERT INTO providers (name, phone, whatsapp, island, plan, trial_start_at, trial_end_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [name, phone, whatsapp, island, 'PREMIUM', trialStart, trialEnd]
      );
      const providerId = providerResult.rows[0].id;

      for (const categoryName of categories) {
        const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
        if (categoryResult.rows.length > 0) {
          await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES ($1, $2)', [providerId, categoryResult.rows[0].id]);
        }
      }

      for (const area of areas) {
        const areaResult = await client.query('SELECT id FROM areas WHERE island = $1 AND neighborhood = $2', [area.island, area.neighborhood]);
        if (areaResult.rows.length > 0) {
          await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES ($1, $2)', [providerId, areaResult.rows[0].id]);
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ id: providerId });
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
    const { name, phone, whatsapp, island, categories, areas } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE providers SET name = $1, phone = $2, whatsapp = $3, island = $4 WHERE id = $5',
        [name, phone, whatsapp, island, id]
      );

      await client.query('DELETE FROM provider_categories WHERE provider_id = $1', [id]);
      for (const categoryName of categories) {
        const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
        if (categoryResult.rows.length > 0) {
          await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES ($1, $2)', [id, categoryResult.rows[0].id]);
        }
      }

      await client.query('DELETE FROM provider_areas WHERE provider_id = $1', [id]);
      for (const area of areas) {
        const areaResult = await client.query('SELECT id FROM areas WHERE island = $1 AND neighborhood = $2', [area.island, area.neighborhood]);
        if (areaResult.rows.length > 0) {
          await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES ($1, $2)', [id, areaResult.rows[0].id]);
        }
      }

      await client.query('COMMIT');
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

app.get('/admin/reports', adminAuth, async (req, res) => {
  try {
    const query = `
      SELECT r.*, p.name as provider_name
      FROM reports r
      JOIN providers p ON r.provider_id = p.id
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}