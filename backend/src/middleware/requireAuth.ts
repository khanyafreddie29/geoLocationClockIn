import { type Request, type Response, type NextFunction } from "express";
import { supabase } from "../supabase";

export interface AuthenticatedRequest extends Request {
    user?:{
        id: string;
        email: string;
        role: string;
    };
}

export async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;
    // gets the jwt token from request header
    // supabase verifies the token
    // jwt is attached to the user's info
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        res.status(401).json({error: 'Missing or invalid authorization header'});
        return;
    }

    const token = authHeader.split(' ')[1];

    const { data: {user}, error} = await supabase.auth.getUser(token);
    // if token is missing or invalid it stops the request

    if (error || !user){
        res.status(401).json({error: 'Invalid or expired token'});
        return;
    }

    // fetching the user roles from their profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    req.user = {
        id: user.id,
        email: user.email!,
        role: profile?.role ?? 'learner'
    };

    next();
}