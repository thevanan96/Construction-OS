import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { error: 'Server is missing Supabase admin configuration.' },
            { status: 500 }
        );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : null;

    if (!token) {
        return NextResponse.json(
            { error: 'Missing authorization token.' },
            { status: 401 }
        );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const {
        data: { user },
        error: userError
    } = await adminSupabase.auth.getUser(token);

    if (userError || !user) {
        return NextResponse.json(
            { error: userError?.message || 'Invalid authorization token.' },
            { status: 401 }
        );
    }

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
        return NextResponse.json(
            { error: deleteError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
