import {Router, type Response} from 'express';
import {supabase} from '../supabase';
import {requireAuth, type AuthenticatedRequest} from '../middleware/requireAuth';
import { isWithinRadius } from '../services/geo';
import type { ClockInRequest, Venue } from '../types';

const router = Router();

// POST api - /api/clock-in (learner clocks in)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { venue_id, latitude, longitude}: ClockInRequest = req.body;

    if (!venue_id || latitude === undefined || longitude === undefined){
        res.status(400).json({ error: 'venue_id, latitude and longitude are required'});
        return;
    }

    // fetch the venue
    const { data: venue, error: venueError} = await supabase
        .from('venues')
        .select('*')
        .eq('id', venue_id)
        .single<Venue>();

    if (venueError || !venue) {
        res.status(404).json({error : 'Venue not found'});
        return;
    }

    // check user proximity
    const withinRadius = isWithinRadius(
        latitude, longitude,
        venue.latitude, venue.longitude,
        venue.radius_m
    );

    if (!withinRadius){
        res.status(403).json({ error: 'You are too far from the venue to clock in',
            venue: venue.name,
            allowed_radius_m: venue.radius_m
        });

        return;
    }

    // insert the clock in record
    const {data, error} = await supabase
        .from('clock_ins')
        .insert({
            learner_id: req.user!.id,
            venue_id,
            latitude,
            longitude
        })
        .select()
        .single();

    if (error) {
    console.error('Clock-in insert error:', error);
    res.status(500).json({ error: 'Failed to record clock-in', detail: error.message });
    return;
  }

    res.status(201).json({message: 'Clocked in successfully!', clock_in: data});
});

// get /api/clock-ins (today's records - facilitator)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'facilitator'){
        res.status(403).json({error: 'Access denied'});
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('clock_ins')
        .select(
            `id,
            clocked_in_at,
            latitude,
            longitude,
            profiles( full_name ),
            venues( name )
            `
        )
        .gte('clocked_in_at', today.toISOString())
        .order('clocked_in_at', {ascending: false});

    if (error){
        res.status(500).json({error: 'Failed to fetch clock-ins'});
        return;
    }
    res.json(data);
});

// get /api/clock-ins/me - learner's own history
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {data, error} = await supabase
        .from('clock_ins')
        .select(`
            id,
            clocked_in_at,
            venues (name, address)
        `)
        .eq('learner_id', req.user!.id)
        .order('clocked_in_at', {ascending: false});

    if (error) {
        res.status(500).json({error: 'Failed to fetch your clock-in data'});
        return;
    }

    res.json(data);
});

export default router;