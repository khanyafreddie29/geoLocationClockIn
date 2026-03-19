import {Router, type Response} from 'express';
import {supabase} from '../supabase';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('name');
        // retreieves all venue data from name to address - coords

    if (error){
        res.status(500).json({ error: 'Failed to fetch venues'});
        return;
    }

    res.json(data)
});

export default router